import { Injectable, signal, computed } from '@angular/core';
import { MemoryGraph } from './memory-entry.interface';

@Injectable({ providedIn: 'root' })
export class MemoryStateService {
  private memoryState = signal<MemoryGraph>({ nodes: [], edges: [] });

  memorySnapshot = computed(() => this.memoryState());

  getMemoryState(): MemoryGraph {
    return this.memoryState();
  }

  setMemoryState(graph: MemoryGraph): void {
    this.memoryState.set({ ...graph });
  }

  resetMemory(): void {
    this.memoryState.set({ nodes: [], edges: [] });
  }
}