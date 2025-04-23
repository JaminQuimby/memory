// tokens.ts
// Define injection tokens for global static starting values.
import { InjectionToken } from '@angular/core';

export const DEFAULT_NODE_DECAY_RATE = new InjectionToken<number>('DEFAULT_NODE_DECAY_RATE', {
  providedIn: 'root',
  factory: () => 0.05, // Default decay rate for node exponential decay calculations.
});

export const NODE_DECAY_THRESHOLD = new InjectionToken<number>('NODE_DECAY_THRESHOLD', {
  providedIn: 'root',
  factory: () => 0.1, // Threshold below which node decay is considered significant.
});

export const DEFAULT_NODE_REINFORCEMENT_FACTOR = new InjectionToken<number>(
  'DEFAULT_NODE_REINFORCEMENT_FACTOR',
  {
    providedIn: 'root',
    factory: () => 1.2, // Default reinforcement factor for memory node reinforcement.
  }
);

export const EDGE_DECAY_RATE = new InjectionToken<number>('EDGE_DECAY_RATE', {
  providedIn: 'root',
  factory: () => 0.15, // Default decay rate for edge exponential decay calculations.
});

export const INITIAL_MEMORY_NODE_WEIGHT = new InjectionToken<number>('INITIAL_MEMORY_NODE_WEIGHT', {
  providedIn: 'root',
  factory: () => 1.0, // Default starting weight for new memory nodes.
});

export const MAX_MEMORY_SIZE = new InjectionToken<number>('MAX_MEMORY_SIZE', {
  providedIn: 'root',
  factory: () => 20, // Maximum number of nodes to retain.
});

export const QUERY_CONFIDENCE = new InjectionToken<number>('QUERY_CONFIDENCE', {
  providedIn: 'root',
  factory: () => 0.5, // 50% confidence level for queries.
});
export const EXPONENTIAL_REINFORCEMENT_ALPHA = new InjectionToken<number>('EXPONENTIAL_REINFORCEMENT_ALPHA', {
  providedIn: 'root',
  factory: () => 5,
});