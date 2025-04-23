import { Injectable, inject, computed } from '@angular/core';
import { MemoryGraph, MemoryNode } from './memory-entry.interface';
import { DecayManager } from './memory-decay-manager.service';
import { ReinforcementHandler } from './memory-reinforcement-handler';
import { NODE_DECAY_THRESHOLD, INITIAL_MEMORY_NODE_WEIGHT } from './memory.tokens';
import { MemoryEdgeService } from './memory-edge.service';
import { MemoryStateService } from './memory-state.service';
import { MemoryPruningService } from './memory-pruning.service';

@Injectable({ providedIn: 'root' })
export class MemoryService {

  private decayManager = inject(DecayManager);
  private reinforcementHandler = inject(ReinforcementHandler);
  private memoryEdgeService = inject(MemoryEdgeService);
  private memoryStateService = inject(MemoryStateService);
  private memoryPruneService = inject(MemoryPruningService);

  private initialWeight = inject(INITIAL_MEMORY_NODE_WEIGHT);
  private decayThreshold = inject(NODE_DECAY_THRESHOLD);

  // Expose the memory graph as a computed signal.
  public memorySnapshot = computed(() => this.memoryStateService.getMemoryState());

  public addOrUpdateNode(record: MemoryNode, previousRecordId?: string): void {
    const now = Date.now();
    const currentGraph = this.memoryStateService.getMemoryState();

    // Apply decay to current memory before updating.
    this.applyDecay(currentGraph, now);

    let node = currentGraph.nodes.find(n => n.id === record.id);
    if (!node) {
      // If node doesn't exist, add it with initial weight.
      node = { ...record, weight: this.initialWeight, timestamp: now };
      currentGraph.nodes.push(node);
    } else {
      // Reinforce existing node.
      this.reinforcementHandler.reinforceMemory(node, currentGraph);
    }

    // If a previous record is provided, create or update an edge.
    if (previousRecordId) {
      this.memoryEdgeService.addOrUpdateEdge(previousRecordId, record.id, 'viewed_after', 1);
    }

    // Prune memory if size exceeds limit.
    this.memoryPruneService.pruneGraphMemory(currentGraph);
    this.memoryStateService.setMemoryState({ ...currentGraph });
  }

  public addOrUpdateEdge(source: string, target: string, relationship: string): void {
    const now = Date.now();
    const currentMemory = this.memoryStateService.getMemoryState();
  
    // Apply decay before update
    this.applyDecay(currentMemory, now);
  
    let edge = currentMemory.edges.find(e => e.source === source && e.target === target && e.relationship === relationship);
  
    if (!edge) {
      edge = { source, target, relationship, weight: 0.5, timestamp: now };
      currentMemory.edges.push(edge);
    } else {
      edge.weight = Math.min(1.0, edge.weight + 0.1);
      edge.timestamp = now; // Update the timestamp
    }
  
    this.memoryStateService.setMemoryState({ ...currentMemory });
  }

  private applyDecay(graph: MemoryGraph, now: number): void {
    graph.nodes.forEach(node => {
      node.weight = this.decayManager.applyDecay(node.weight, node.timestamp, now);
    });
    graph.edges.forEach(edge => {
      edge.weight = this.decayManager.applyDecay(edge.weight, edge.timestamp, now);
    });
  
    // Remove nodes that have decayed below the threshold.
    const validNodeIds = new Set(graph.nodes.filter(n => n.weight > this.decayThreshold).map(n => n.id));
  
    // Remove edges that have decayed below the threshold or are connected to removed nodes.
    graph.edges = graph.edges.filter(e => e.weight > this.decayThreshold && validNodeIds.has(e.source) && validNodeIds.has(e.target));
  
    // Update the nodes to only include those that are above the threshold.
    graph.nodes = graph.nodes.filter(n => n.weight > this.decayThreshold);
  }

  public getNodeById(id: string){
    const currentGraph = this.memoryStateService.getMemoryState();
    return currentGraph.nodes.find((node) => node.id === id);
  }

  public getTopNodes(limit: number = 5): MemoryNode[] {
    const now = Date.now();
    const currentGraph = this.memoryStateService.getMemoryState();
    this.applyDecay(currentGraph, now);
    return currentGraph.nodes.sort((a, b) => b.weight - a.weight).slice(0, limit);
  }

  public resetMemory(): void {
    this.memoryStateService.resetMemory();
  }
}
