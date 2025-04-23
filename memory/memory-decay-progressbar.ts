import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import type { MemoryNode } from './memory-entry.interface';
import { DecayManager } from './memory-decay-manager.service';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-decay-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:[ProgressBar],
  template: `
    <p-progressBar 
      [value]="decayProgress" 
      [showValue]="true"
      [style]="{'height': '20px'}"
    ></p-progressBar>
    <div class="weight-display">
      Current Weight: {{ currentWeight.toFixed(6) }}
    </div>
  `
})
export class DecayProgressComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: MemoryNode;
  
  decayProgress: number = 100;
  currentWeight: number = 1;
  private decaySubscription: Subscription | null = null;
  decayManager = inject(DecayManager)
  cdr = inject(ChangeDetectorRef);


  ngOnInit() {
    // Set initial weight
    this.currentWeight = this.node.weight;

    // Update progress every second
    this.decaySubscription = interval(1000).subscribe(() => {
      // Apply decay directly to the node's weight
      this.currentWeight = this.decayManager.applyDecay(
        this.node.weight, 
        1, // Initial state
        1  // Passed 1 to indicate elapsed time
      );

      // Update the node's weight
      this.node.weight = this.currentWeight;

      // Calculate progress percentage
      this.decayProgress = Math.max(
        0, 
        Math.min(
          100, 
          (this.currentWeight) * 100
        )
      );

      // Manually trigger change detection
      this.cdr.markForCheck();

      // Stop the interval if weight is very close to zero
      if (this.currentWeight <= 0.001) {
        this.decaySubscription?.unsubscribe();
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription
    this.decaySubscription?.unsubscribe();
  }
}