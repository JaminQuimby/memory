import { inject, Injectable } from '@angular/core';
import { MemoryGraph, MemoryNode, MemoryEdge } from './memory-entry.interface';
import { DEFAULT_NODE_REINFORCEMENT_FACTOR, EXPONENTIAL_REINFORCEMENT_ALPHA } from './memory.tokens';

@Injectable({ providedIn: 'root' })
export class ReinforcementHandler {
  
  private reinforcementFactor: number = inject(DEFAULT_NODE_REINFORCEMENT_FACTOR);
  private readonly maxWeight = 1.0;
  private alpha: number = inject(EXPONENTIAL_REINFORCEMENT_ALPHA);

  private exponentialReinforcement(x: number): number {
    return this.reinforcementFactor * Math.exp(-this.alpha * (1 - x));
  }

  public reinforceMemory(node: MemoryNode, graph: MemoryGraph): MemoryNode {
    const delta = this.exponentialReinforcement(node.weight);
    node.weight = Math.min(this.maxWeight, node.weight + delta);
    node.timestamp = Date.now();

    this.propagateReinforcement(node, graph, 2, 1); // Start with step 1
    return node;
  }

  private propagateReinforcement(node: MemoryNode, graph: MemoryGraph, maxSteps: number, currentStep: number): void {
    if (currentStep > maxSteps) return;
  
    for (const edge of this.getNeighborEdges(node.id, graph)) {
      const neighborId = edge.source === node.id ? edge.target : edge.source;
      const neighborNode = this.getNode(neighborId, graph);
      if (neighborNode) {
        const propagationFactor = (edge.weight || 0.5) * (1 - (0.2 * currentStep)); // Linear decay
        const delta = this.exponentialReinforcement(neighborNode.weight);
        neighborNode.weight = Math.min(this.maxWeight, neighborNode.weight + delta * propagationFactor);
        neighborNode.timestamp = Date.now();
        this.propagateReinforcement(neighborNode, graph, maxSteps, currentStep + 1);
      }
    }
  }

  private getNode(nodeId: string, graph: MemoryGraph): MemoryNode | undefined {
    return graph.nodes.find(n => n.id === nodeId);
  }
  private getNeighborEdges(nodeId: string, graph: MemoryGraph): MemoryEdge[] {
    return graph.edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
  }
}