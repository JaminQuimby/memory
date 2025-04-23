import { inject, Injectable } from '@angular/core';
import { MemoryEdge, MemoryGraph, MemoryNode } from './memory-entry.interface';
import { MemoryService } from './memory.service';
import { QUERY_CONFIDENCE } from './memory.tokens';

@Injectable({ providedIn: 'root' })
export class MemoryReportService {
 private confidence = inject(QUERY_CONFIDENCE);
 private memoryService = inject(MemoryService) 
  
  getMemoryForLLMWithConfidence(): string {
    const minConfidence = this.confidence;
    const allNodes = this.memoryService.memorySnapshot().nodes;

    // Sort nodes by weight
    const sortedNodes = [...allNodes].sort((a, b) => b.weight - a.weight);
    
    // Start with top record per category
    const nodesByCategory: Record<string, MemoryNode[]> = {};
    sortedNodes.forEach(node => {
        if (!nodesByCategory[node.type]) {
            nodesByCategory[node.type] = [];
        }
        nodesByCategory[node.type].push(node);
    });

    const selectedNodes: MemoryNode[] = [];
    Object.values(nodesByCategory).forEach(categoryNodes => {
        if (categoryNodes.length > 0) {
            selectedNodes.push(categoryNodes[0]);
        }
    });

    function calculateConfidence(nodes: MemoryNode[]): number {
        const totalWeight = allNodes.reduce((sum, n) => sum + n.weight, 0);
        const selectedWeight = nodes.reduce((sum, n) => sum + n.weight, 0);
        return selectedWeight / totalWeight;
    }

    let confidence = calculateConfidence(selectedNodes);

    // Expand selection if confidence is too low
    while (confidence < minConfidence) {
        // Identify dominant category (the one with the most selected nodes)
        const categoryCounts: Record<string, number> = {};
        selectedNodes.forEach(node => {
            categoryCounts[node.type] = (categoryCounts[node.type] || 0) + 1;
        });

        const dominantCategory = Object.keys(categoryCounts).reduce((a, b) =>
            categoryCounts[a] > categoryCounts[b] ? a : b
        );

        // Add another high-weight node from dominant category
        const nextNode = nodesByCategory[dominantCategory]?.find(n => !selectedNodes.includes(n));
        if (nextNode) {
            selectedNodes.push(nextNode);
        } else {
            // Expand via edges if no more high-weight nodes in category
            const topNodeIds = new Set(selectedNodes.map(n => n.id));
            const topEdges = this.memoryService.memorySnapshot().edges.filter(edge =>
                topNodeIds.has(edge.source) || topNodeIds.has(edge.target)
            );

            let bestConnectedNode: MemoryNode | null = null;
            let bestEdgeWeight = 0;
            
            topEdges.forEach(edge => {
                const linkedNode = allNodes.find(n => n.id === edge.source || n.id === edge.target);
                if (linkedNode && !selectedNodes.includes(linkedNode) && edge.weight > bestEdgeWeight) {
                    bestConnectedNode = linkedNode;
                    bestEdgeWeight = edge.weight;
                }
            });

            if (bestConnectedNode) {
                selectedNodes.push(bestConnectedNode);
            } else {
                break; // No more nodes to add
            }
        }

        confidence = calculateConfidence(selectedNodes);
    }

    // Filter edges to include only those that connect selected nodes
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    const selectedEdges = this.memoryService.memorySnapshot().edges.filter(edge =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    const topGraph: MemoryGraph = {
      nodes: selectedNodes.map(node => ({ ...node }) as MemoryNode),
      edges: selectedEdges.map(edge => ({ ...edge }) as MemoryEdge)
  };

    console.log(JSON.stringify(topGraph, null, 2));
    return JSON.stringify(topGraph, null, 2);
}


  /**
   * Exports the current memory graph as a JSON string.
   * The JSON includes both nodes and edges.
   * @returns A formatted JSON string of the memory graph.
   */
  getMemoryForLLMTopTen(): string {
    const topNodes = this.memoryService.getTopNodes(10);
    const topNodeIds = new Set(topNodes.map(node => node.id));
    
    // Filter edges to include only those that connect the top nodes
    const topEdges = this.memoryService.memorySnapshot().edges.filter(edge => topNodeIds.has(edge.source) && topNodeIds.has(edge.target));
    
    // Create a new graph with the top nodes and edges, excluding the timestamp
    const topGraph: MemoryGraph = {
      nodes: topNodes.map(node => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { timestamp, ...rest } = node as any;
        return rest;
      }),
      edges: topEdges.map(edge => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { timestamp, ...rest } = edge as any;
        return rest;
      })
    };
    console.log(JSON.stringify(topGraph, null, 2))
    return JSON.stringify(topGraph, null, 2);
  }

  /**
   * Retrieves the most important record based on the given type and its associated nodes.
   * @param type - The type of the node to find.
   * @returns A formatted JSON string of the most important node and its associated edges.
   */
  getImportantRecordByType(type: string): string {
    const currentGraph = this.memoryService.memorySnapshot();
  
    // Find the top 3 most important nodes of the given type
    const importantNodes = currentGraph.nodes
      .filter(node => node.type === type)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  
    if (importantNodes.length === 0) {
      return JSON.stringify({ nodes: [], edges: [] }, null, 2);
    }
  
    const importantNodeIds = importantNodes.map(node => node.id);
  
    // Find all edges associated with these nodes
    const associatedEdges = currentGraph.edges.filter(edge => 
      importantNodeIds.includes(edge.source) || importantNodeIds.includes(edge.target)
    );
  
    // Create a new graph with the important nodes and their associated edges, excluding the timestamp
    const importantGraph: MemoryGraph = {
      nodes: importantNodes.map(node => {

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { timestamp, ...rest } = node as any;
        return rest;
      }),
      edges: associatedEdges.map(edge => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { timestamp, ...rest } = edge as any;
        return rest;
      })
    };
    console.log(JSON.stringify(importantGraph, null, 2))
    return JSON.stringify(importantGraph, null, 2);
  }

  /**
   * Retrieves the current memory dump as a JSON string.
   * @returns A formatted JSON string of the memory dump.
   */
  getMemoryDump(): string {
    return JSON.stringify(this.memoryService.memorySnapshot(), null, 2);
  }
}