import { inject, Injectable } from '@angular/core';
import { MemoryGraph } from './memory-entry.interface';
import { MAX_MEMORY_SIZE } from './memory.tokens';

@Injectable({ providedIn: 'root' })
export class MemoryPruningService {
  private maxMemorySize = inject(MAX_MEMORY_SIZE);

  /**
   * Prunes the memory graph to ensure it doesn't exceed the maximum allowed size.
   * This method removes the lowest-weighted nodes and their associated edges.
   * @param graph - The current memory graph to be pruned.
   */
  public pruneGraphMemory(graph: MemoryGraph): void {
    // Check if the number of nodes exceeds the max memory size
    if (graph.nodes.length > this.maxMemorySize) {
      // Sort nodes by weight (highest first) and slice the list to retain the top nodes
      const sortedNodes = graph.nodes
        .sort((a, b) => b.weight - a.weight)  // Sort nodes by weight in descending order
        .slice(0, this.maxMemorySize);          // Keep only the top nodes

      // Assign the top nodes back to the graph
      graph.nodes = sortedNodes;

      // Create a set of valid node IDs (nodes to retain)
      const validIds = new Set(sortedNodes.map(n => n.id));

      // Remove edges that are no longer connected to valid nodes
      graph.edges = graph.edges.filter(e => validIds.has(e.source) && validIds.has(e.target));
    }
  }
}
