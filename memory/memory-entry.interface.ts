import { SimulationNodeDatum } from 'd3';

export interface MemoryNode extends SimulationNodeDatum {
  id: string;
  type: string;
  weight: number;
  timestamp: number;
}

export interface MemoryEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  timestamp: number;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}
