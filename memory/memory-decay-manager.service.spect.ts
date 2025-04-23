import { TestBed } from '@angular/core/testing';
import { DEFAULT_NODE_DECAY_RATE } from './memory.tokens';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecayManager } from './memory-decay-manager.service';

describe('DecayManager', () => {
  let decayManager: DecayManager;
  const mockDecayRate = 0.5; // Example decay rate

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DecayManager,
        { provide: DEFAULT_NODE_DECAY_RATE, useValue: mockDecayRate },
      ],
    });
    decayManager = TestBed.inject(DecayManager);
  });

  it('should be created', () => {
    expect(decayManager).toBeTruthy();
  });

  it('should apply decay correctly', () => {
    const initialWeight = 10;
    const lastTimestamp = Date.now() - 60000; // 1 minute ago
    const now = Date.now();

    const decayedWeight = decayManager.applyDecay(
      initialWeight,
      lastTimestamp,
      now
    );

    // Calculate the expected decayed weight
    const timeElapsedMinutes = (now - lastTimestamp) / 60000;
    const randomFactor = 1; // Assuming no random factor for simplicity in this test
    const adjustedDecayRate = mockDecayRate * randomFactor;
    const expectedDecayedWeight = initialWeight * Math.exp(-adjustedDecayRate * timeElapsedMinutes);

    // Use to be close, to account for floating point errors.
    expect(decayedWeight).toBeCloseTo(expectedDecayedWeight);
  });

  it('should apply decay with random factor', () => {
    const initialWeight = 10;
    const lastTimestamp = Date.now() - 60000; // 1 minute ago
    const now = Date.now();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); //force random to be 0.5
    const decayedWeight = decayManager.applyDecay(
        initialWeight,
        lastTimestamp,
        now
    );
    const timeElapsedMinutes = (now - lastTimestamp) / 60000;
    const randomFactor = 1 + (0.5 * 0.1 - 0.05);
    const adjustedDecayRate = mockDecayRate * randomFactor;
    const expectedDecayedWeight = initialWeight * Math.exp(-adjustedDecayRate * timeElapsedMinutes);
    expect(decayedWeight).toBeCloseTo(expectedDecayedWeight);
  });
});