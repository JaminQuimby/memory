import { Injectable, inject } from '@angular/core';
import { MemoryStateService } from './memory-state.service';
import { DecayManager } from './memory-decay-manager.service';
import type { MemoryEdge, MemoryGraph } from './memory-entry.interface';

@Injectable({ providedIn: 'root' })
export class MemoryEdgeService {
  private decayManager = inject(DecayManager);
  private readonly minWeightThreshold = 0.01; // Edges below this are pruned
  private memoryStateService = inject(MemoryStateService);
  private readonly relationshipWeight: { [key: string]: number } = {
    pinned: 1.0,
    searched_for: 0.85,
    asked_in_chat: 0.75,
    viewed_after: 0.6,
    linked: 0.5,
  };
  private readonly WEIGHT_SCALING_FACTOR = 0.2; // Meaningful constant for scaling weight

  addOrUpdateEdge(source: string, target: string, relationship: string, weight: number = 0.5): void {
    const now = Date.now();
    const currentGraph = this.memoryStateService.getMemoryState();

    const baseWeight = this.getBaseWeight(relationship, weight);
    const sourceNodeExists = this.nodeExists(currentGraph, source);
    const targetNodeExists = this.nodeExists(currentGraph, target);

    if (!sourceNodeExists || !targetNodeExists) {
      console.warn(`Cannot add edge: source (${source}) or target (${target}) node does not exist.`);
      return;
    }

    let edge = currentGraph.edges.find(
      (e) => e.source === source && e.target === target && e.relationship === relationship
    );

    if (!edge) {
      edge = this.createNewEdge(source, target, relationship, baseWeight, now);
      currentGraph.edges.push(edge);
    } else {
      this.updateExistingEdge(edge, baseWeight, now);
    }

    this.memoryStateService.setMemoryState(currentGraph);
  }

  private getBaseWeight(relationship: string, weight: number): number {
    return weight ?? this.relationshipWeight[relationship] ?? 0.5;
  }

  private nodeExists(graph: MemoryGraph, nodeId: string): boolean {
    return graph.nodes.some((n) => n.id === nodeId);
  }

  private createNewEdge(source: string, target: string, relationship: string, baseWeight: number, now: number): MemoryEdge {
    return { source, target, relationship, weight: baseWeight, timestamp: now };
  }

  private updateExistingEdge(edge: MemoryEdge, baseWeight: number, now: number): void {
    edge.weight = this.decayManager.applyDecay(edge.weight, edge.timestamp, now) ?? 0;
    edge.weight += (1 - edge.weight) * baseWeight * this.WEIGHT_SCALING_FACTOR;

    if (edge.weight < this.minWeightThreshold) {
      this.removeEdge(edge);
    } else {
      edge.timestamp = now;
    }
  }

  private removeEdge(edge: MemoryEdge): void {
    // Directly mutates the edges array by removing the edge
    this.memoryStateService.getMemoryState().edges = this.memoryStateService
      .getMemoryState()
      .edges.filter((e) => e !== edge);
  }
}
