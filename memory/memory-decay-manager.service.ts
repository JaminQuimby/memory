import { Injectable, inject } from '@angular/core';
import { DEFAULT_NODE_DECAY_RATE } from './memory.tokens';

@Injectable({ providedIn: 'root' })
export class DecayManager {
  private decayRate = inject(DEFAULT_NODE_DECAY_RATE);
  private readonly ONE_MINUTE_IN_MILLISECONDS = 60000;
  private readonly FLUCTUATION_RANGE = 0.1;
  private readonly FLUCTUATION_OFFSET = 0.05;
  private readonly ELASTICITY_FACTOR = 0.5;
  private readonly HALF_LIFE_SCALING = 0.25;
  private readonly BASE_DECAY_RECOVERY_TIME = 10; // Base recovery window
  private lastDecayTimestamp: number | null = null;
  private decayResumeTimestamp: number | null = null; // Tracks when decay resumes

  public applyDecay(
    weight: number, 
    lastTimestamp: number, 
    now: number, 
    lastReinforcementTimestamp?: number
  ): number {
    const elapsedMinutes = (now - lastTimestamp) / this.ONE_MINUTE_IN_MILLISECONDS;
    
    if (this.lastDecayTimestamp === null || now > this.lastDecayTimestamp) {
      this.lastDecayTimestamp = now;
    }

    const timeSinceLastDecay = (now - this.lastDecayTimestamp) / this.ONE_MINUTE_IN_MILLISECONDS;

    // Reset decay recovery if user goes inactive again
    if (this.decayResumeTimestamp === null || now - this.decayResumeTimestamp > this.BASE_DECAY_RECOVERY_TIME * this.ONE_MINUTE_IN_MILLISECONDS) {
      this.decayResumeTimestamp = now;
    }
    
    const timeSinceDecayResumed = (now - this.decayResumeTimestamp) / this.ONE_MINUTE_IN_MILLISECONDS;
    const dynamicRecoveryTime = Math.min(timeSinceDecayResumed, this.BASE_DECAY_RECOVERY_TIME); // Caps at 10 min
    
    const decayRateDelta = 1 + (Math.random() * this.FLUCTUATION_RANGE - this.FLUCTUATION_OFFSET);
    let adjustedDecayRate = this.decayRate * decayRateDelta;

    if (lastReinforcementTimestamp) {
      const timeSinceReinforcement = (now - lastReinforcementTimestamp) / this.ONE_MINUTE_IN_MILLISECONDS;
      if (timeSinceReinforcement < 1) return weight;

      const reinforcementFactor = 1 / (1 + Math.exp(-this.ELASTICITY_FACTOR * (timeSinceReinforcement - 5)));
      adjustedDecayRate *= reinforcementFactor;
    }

    // Ensure gradual decay resumption even if user walks away again
    const recoveryFactor = dynamicRecoveryTime / this.BASE_DECAY_RECOVERY_TIME;
    const decaySlowdownFactor = 1 / (1 + Math.exp(-this.ELASTICITY_FACTOR * (timeSinceLastDecay - 5)));
    adjustedDecayRate *= decaySlowdownFactor * recoveryFactor;

    const minDecayRate = this.decayRate * this.HALF_LIFE_SCALING;
    adjustedDecayRate = Math.max(adjustedDecayRate, minDecayRate);

    return weight * Math.exp(-adjustedDecayRate * elapsedMinutes);
  }
}
