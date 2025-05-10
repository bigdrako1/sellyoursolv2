import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  value: number;
  label: string;
  group: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  nodes, 
  links, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Color scale for different node groups
  const colorScale = d3.scaleOrdinal()
    .domain(['whale', 'trader', 'institution', 'early_adopter', 'token'])
    .range(['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']);

  useEffect(() => {
    if (!svgRef.current || !nodes.length || !links.length) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Create a force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.value + 10));

    // Create a container for the graph
    const container = svg.append('g');

    // Add zoom behavior
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      }) as any
    );

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 1.5);

    // Create nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
      );

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d: any) => d.value * 0.5 + 5)
      .attr('fill', (d: any) => colorScale(d.group) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes
    node.append('text')
      .attr('dx', (d: any) => d.value * 0.5 + 8)
      .attr('dy', '.35em')
      .text((d: any) => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#fff');

    // Add title for hover tooltip
    node.append('title')
      .text((d: any) => `${d.label} (${d.group})`);

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, colorScale]);

  return (
    <div className="network-graph-container">
      <svg ref={svgRef} />
    </div>
  );
};

export default NetworkGraph;
