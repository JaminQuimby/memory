import { Injectable, inject } from '@angular/core';
import { MemoryStateService } from './memory-state.service';
import { MemoryEdgeService } from './memory-edge.service';
import { MemoryNode } from './memory-entry.interface';
import { ReinforcementHandler } from './memory-reinforcement-handler';
import { INITIAL_MEMORY_NODE_WEIGHT } from './memory.tokens';

@Injectable({ providedIn: 'root' })
export class MemoryNodeService {
  private initialWeight = inject(INITIAL_MEMORY_NODE_WEIGHT);
  private reinforcementHandler = inject(ReinforcementHandler);
  private memoryStateService = inject(MemoryStateService);
  private memoryEdgeService = inject(MemoryEdgeService);

  public addOrUpdateNode(record: MemoryNode, previousRecordId?: string): void {
    const now = Date.now();
    const currentGraph = this.memoryStateService.getMemoryState();

    let node = currentGraph.nodes.find(n => n.id === record.id);
    if (!node) {
      node = { ...record, weight: this.initialWeight, timestamp: now };
      currentGraph.nodes.push(node);
    } else {
      this.reinforcementHandler.reinforceMemory(node,currentGraph);
    }

    // If a previous record is provided, create or update an edge.
    if (previousRecordId) {
      this.memoryEdgeService.addOrUpdateEdge(previousRecordId, record.id, 'viewed_after', 1);
    }

    this.memoryStateService.setMemoryState(currentGraph);
  }
}