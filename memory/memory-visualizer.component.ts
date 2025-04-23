/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
import * as d3 from 'd3';
import { MemoryService } from './memory.service';
import { MemoryGraph, MemoryNode } from './memory-entry.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { OllamaService } from '../ollama/ollama.service';
import { DecayProgressComponent } from './memory-decay-progressbar';

@Component({
  selector: 'app-memory-graph-visualizer',
  templateUrl: './memory-visualizer.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    ProgressBarModule,
    DecayProgressComponent,
  ],
})
export class MemoryGraphVisualizerComponent implements AfterViewInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  public entropyNode: MemoryNode = {
    id: 'Entropy',
    type: 'entropy',
    weight: 1,
    timestamp: Date.now(),
    x: 0,
    y: 0,
  };

  public selectedNodeTypes: string[] = [];

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null =
    null;
  private memoryService = inject(MemoryService);
  private currentGraph = signal<MemoryGraph>(
    this.memoryService.memorySnapshot()
  );
  public nodeCount = computed(() => this.currentGraph().nodes.length);
  public edgeCount = computed(() => this.currentGraph().edges.length);
  private ai = inject(OllamaService);

  // Current graph state

  // Computed property for active nodes (weight > 0.01)
  activeNodes = computed(() =>
    this.currentGraph().nodes.filter((node) => node.weight > 0.01)
  );

  // Decay configuration

  private decayTimer: any = null;

  // Node creation options
  nodeTypes: string[] = ['event', 'prospect', 'constituent', 'gift'];
  selectedNodeType: string = 'event';

  // Edge creation options
  selectedSourceNode: MemoryNode | null = null;
  selectedTargetNode: MemoryNode | null = null;

  // Predefined positions to prevent nodes from flying out
  private nodePositions: Map<string, { x: number; y: number }> = new Map();

  ngAfterViewInit() {
    this.initializeGraph();
    this.startDecaySimulation();
  }

  private initializeGraph() {
    // Clear any existing SVG
    d3.select(this.graphContainer.nativeElement).selectAll('*').remove();

    // Create SVG container
    this.svg = d3
      .select(this.graphContainer.nativeElement)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '500px');

    // Render initial (empty) graph
    this.renderGraph(this.currentGraph());
  }

  private renderGraph(graph: MemoryGraph) {
    if (!this.svg) return;

    const svgWidth = parseInt(this.svg.style('width'));
    const svgHeight = 500;

    // Spread nodes across the visualization
    const nodes = graph.nodes
      .filter((node) => node.weight > 0.01)
      .map((node, index, array) => {
        const totalNodes = array.length;
        const angle = (2 * Math.PI * index) / totalNodes;
        const radius = Math.min(svgWidth, svgHeight) / 3; // Spread in a circle

        return {
          ...node,
          x: svgWidth / 2 + radius * Math.cos(angle),
          y: svgHeight / 2 + radius * Math.sin(angle),
          fx: svgWidth / 2 + radius * Math.cos(angle), // Fixed x
          fy: svgHeight / 2 + radius * Math.sin(angle), // Fixed y
        };
      });

    const links = graph.edges
      .filter((edge) => {
        const sourceExists = nodes.some((n) => n.id === edge.source);
        const targetExists = nodes.some((n) => n.id === edge.target);
        return sourceExists && targetExists;
      })
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)!;
        const targetNode = nodes.find((n) => n.id === edge.target)!;
        return {
          ...edge,
          source: sourceNode,
          target: targetNode,
        };
      });

    // Clear previous visualization
    this.svg.selectAll('*').remove();

    // Color scale for node types
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(this.nodeTypes)
      .range(['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']);

    // Create force simulation with position constraints
    this.simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3.forceLink(links).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force('boundary', () => {
        for (const node of nodes) {
          node.x = Math.max(50, Math.min(svgWidth - 50, node.x!));
          node.y = Math.max(50, Math.min(svgHeight - 50, node.y!));
        }
      });

    // Modify simulation to essentially freeze node positions
    this.simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3.forceLink(links).id((d: any) => d.id)
      )
      .alphaTarget(0) // Immediately stop simulation
      .alphaMin(1); // Prevent further movement
    // Draw edges
    const link = this.svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('stroke', '#999')
      .style('stroke-opacity', (d: any) => d.weight)
      .style('stroke-width', 4);

    // Draw nodes
    const node = this.svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => 20 * d.weight)
      .style('fill', (d: any) => colorScale(d.type) as string)
      .style('opacity', (d: any) => Math.max(0.2, d.weight))
      .style('cursor', 'pointer') // Add pointer cursor
      .on('click', (event, d) => this.showNodeDetails(d));

    const label = this.svg
      .append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d: any) => d.id)
      .attr('fill', '#ffffff')
      .attr('font-size', 14) // Increased font size
      .attr('text-anchor', 'right') // Center text horizontally
      .attr('dominant-baseline', 'right') // Center text vertically
      .attr('dx', 24) // Remove horizontal offset
      .attr('dy', 2); // Remove vertical offset

    // Update positions on each tick
    this.simulation?.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);

      // Store node positions for next render
      nodes.forEach((n) => {
        this.nodePositions.set(n.id, { x: n.x!, y: n.y! });
      });
    });
  }

  private startDecaySimulation() {
    this.memoryService.addOrUpdateNode(this.entropyNode);
    setInterval(() => {
      const currentGraph = this.memoryService.memorySnapshot();
      this.entropyNode = this.memoryService.getNodeById(
        'Entropy'
      ) as MemoryNode;
      // Use markForCheck to trigger change detection only for the graph
      this.currentGraph.set(currentGraph);
      this.renderGraph(currentGraph);
    }, 1000);
  }
  aiJudge() {
    const edges = JSON.stringify(
      this.memoryService.memorySnapshot().edges,
      null,
      2
    );
    const nodes = JSON.stringify(
      this.memoryService.memorySnapshot().nodes,
      null,
      2
    );

    this.ai
      .generate(JSON.stringify({ edges: edges, nodes: nodes }))
      .subscribe((r) => {
        console.log(r.response);
      });
  }
  // Add a new node
  addNode() {
    const currentGraph = this.currentGraph();

    const constituents = [
      'John Doe',
      'Jane Smith',
      'Robert Johnson',
      'Emily Davis',
      'Michael Brown',
      'Sarah Wilson',
      'David Martinez',
      'Laura Anderson',
      'James Taylor',
      'Olivia Thomas',
      'Daniel White',
      'Sophia Harris',
      'William Lewis',
      'Ava Walker',
      'Joseph Hall',
      'Isabella Young',
      'Matthew Allen',
      'Mia King',
      'Ethan Scott',
      'Charlotte Green',
    ];
    const events = [
      'Gala Night 2025',
      'Charity Auction',
      'Tech Conference',
      'Fundraising Dinner',
      'Community Meetup',
    ];
    const prospects = [
      'John Sterling',
      'Emily Rains',
      'Michael Thornton',
      'Sophia Hayes',
      'Daniel Crowe',
    ];
    const gifts = [
      'Platinum Sponsorship',
      'Anonymous Donation',
      'Art Piece Auction',
      'Scholarship Fund',
      'Corporate Grant',
    ];

    const relationship = [
    'pinned',
    'searched_for',
    'asked_in_chat',
    'viewed_after',
    'linked'
  ];

    const getRandomItem = (arr: string[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    const getRandomString = (type: string): string => {
      switch (type) {
        case 'constituent':
          return getRandomItem(constituents);
        case 'event':
          return getRandomItem(events);
        case 'prospect':
          return getRandomItem(prospects);
        case 'gift':
          return getRandomItem(gifts);
        case 'relationship':
          return getRandomItem(relationship);
        default:
          return 'Unknown Type';
      }
    };
    const node = getRandomString(this.selectedNodeType);
    console.log(node);
    const newNode: MemoryNode = {
      id: `|>${node}`,
      type: this.selectedNodeType as any,
      weight: 1,
      timestamp: Date.now(),
    };

    this.memoryService.addOrUpdateNode(newNode);

    const updatedGraph = {
      ...currentGraph,
      nodes: [...currentGraph.nodes, newNode],
    };

    //this.currentGraph.set(updatedGraph);
    this.renderGraph(updatedGraph);
  }

  resetEntropy() {
    return this.memoryService.addOrUpdateNode({
      id: 'Entropy',
      type: 'entropy',
      weight: 1,
      timestamp: Date.now(),
      x: 0,
      y: 0,
    });
  }

  // Add an edge between two existing nodes
  addEdge() {
    if (!this.selectedSourceNode || !this.selectedTargetNode) {
      alert('Please select both source and target nodes');
      return;
    }
    
    const relationships = [
      'pinned',
      'searched_for',
      'asked_in_chat',
      'viewed_after',
      'linked'
    ];
  
      const getRandomItem = (arr: string[]) =>
        arr[Math.floor(Math.random() * arr.length)];
      const getRandomString = (type: string): string => {
        switch (type) {
          case 'relationship':
            return getRandomItem(relationships);
          default:
            return 'Unknown Type';
        }
      }
    const currentGraph = this.memoryService.memorySnapshot();
    const relationship = getRandomString('relationship');
    console.log(this.selectedSourceNode.id,this.selectedTargetNode.id, relationship)
    this.memoryService.addOrUpdateEdge(
      this.selectedSourceNode.id,
      this.selectedTargetNode.id,
      relationship
    );

    this.currentGraph.set(currentGraph);
    this.renderGraph(currentGraph);

    // Reset selections
    this.selectedSourceNode = null;
    this.selectedTargetNode = null;
  }

  // Stop decay
  stopDecay() {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
    }
  }

  // Resume decay
  resumeDecay() {
    this.startDecaySimulation();
  }

  // Reset graph
  resetGraph() {
    // Stop current decay
    this.stopDecay();
    this.memoryService.resetMemory();
    // Clear the graph
    this.currentGraph.set({ nodes: [], edges: [] });
    this.nodePositions.clear();
    this.renderGraph({ nodes: [], edges: [] });

    // Restart decay
    this.startDecaySimulation();
  }

  showNodeDetails(node: MemoryNode) {
    // Create a detailed view of node properties
    console.log('Node Details:', node);
    // Potentially add a modal or side panel to show:
    // - Full node details
    // - Connections
    // - Timestamp
    // - Detailed weight information
  }

  ngOnDestroy() {
    // Cleanup timers
    this.stopDecay();
  }
}
