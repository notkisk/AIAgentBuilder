import React, { useRef, useEffect } from 'react';
import { getToolColor } from '@/lib/agent-tools';

interface WorkflowNode {
  id: string;
  tool: string;
  function: string;
  params: Record<string, any>;
  next?: string;
}

interface WorkflowVisualizerProps {
  nodes: WorkflowNode[];
  activeNodeId?: string;
}

export default function WorkflowVisualizer({ nodes, activeNodeId }: WorkflowVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw the workflow visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Reset canvas and set dimensions
    const nodeWidth = 200;
    const nodeHeight = 100;
    const horizontalGap = 80;
    const verticalGap = 60;
    
    // Calculate canvas size based on node count (simple layout for now)
    const maxNodesPerRow = 3;
    const rows = Math.ceil(nodes.length / maxNodesPerRow);
    const cols = Math.min(nodes.length, maxNodesPerRow);
    
    canvas.width = (nodeWidth * cols) + (horizontalGap * (cols - 1)) + 40;
    canvas.height = (nodeHeight * rows) + (verticalGap * (rows - 1)) + 40;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw nodes
    const nodePositions: Record<string, { x: number, y: number }> = {};
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / maxNodesPerRow);
      const col = index % maxNodesPerRow;
      
      const x = 20 + col * (nodeWidth + horizontalGap);
      const y = 20 + row * (nodeHeight + verticalGap);
      
      // Store position for connection lines
      nodePositions[node.id] = { x, y };
      
      // Get color for the tool
      const color = getToolColor(node.tool) || {
        bg: '#f9fafb',
        text: '#111827',
        darkBg: '#1f2937',
        darkText: '#f9fafb'
      };
      
      // Draw node box
      ctx.fillStyle = color.bg;
      ctx.strokeStyle = node.id === activeNodeId ? '#ff9800' : '#e2e8f0';
      ctx.lineWidth = node.id === activeNodeId ? 3 : 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      
      // Rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + nodeWidth - radius, y);
      ctx.quadraticCurveTo(x + nodeWidth, y, x + nodeWidth, y + radius);
      ctx.lineTo(x + nodeWidth, y + nodeHeight - radius);
      ctx.quadraticCurveTo(x + nodeWidth, y + nodeHeight, x + nodeWidth - radius, y + nodeHeight);
      ctx.lineTo(x + radius, y + nodeHeight);
      ctx.quadraticCurveTo(x, y + nodeHeight, x, y + nodeHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
      
      // Draw node text
      ctx.fillStyle = color.text;
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.tool, x + nodeWidth / 2, y + 25);
      
      ctx.fillStyle = '#4b5563';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(node.function, x + nodeWidth / 2, y + 45);
      
      // Draw parameters (truncated)
      ctx.font = '10px monospace';
      const params = Object.keys(node.params || {}).slice(0, 2);
      params.forEach((key, i) => {
        const value = String(node.params[key]);
        const displayText = `${key}: ${value.length > 15 ? value.substring(0, 15) + '...' : value}`;
        ctx.fillText(displayText, x + nodeWidth / 2, y + 65 + (i * 15));
      });
      
      if (Object.keys(node.params || {}).length > 2) {
        ctx.fillText('...', x + nodeWidth / 2, y + 65 + (2 * 15));
      }
    });
    
    // Draw connections
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    
    nodes.forEach(node => {
      if (node.next && nodePositions[node.next]) {
        const start = nodePositions[node.id];
        const end = nodePositions[node.next];
        
        // Draw arrow from start to end
        const startX = start.x + nodeWidth;
        const startY = start.y + nodeHeight / 2;
        const endX = end.x;
        const endY = end.y + nodeHeight / 2;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // If nodes are on the same row, draw a simple line
        if (Math.abs(startY - endY) < nodeHeight) {
          ctx.lineTo(endX, endY);
        } else {
          // Otherwise, draw a path with curves
          const midX = startX + (endX - startX) / 2;
          ctx.bezierCurveTo(
            midX, startY,
            midX, endY,
            endX, endY
          );
        }
        
        ctx.stroke();
        
        // Draw arrow head
        const arrowSize = 8;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
      }
    });
    
  }, [nodes, activeNodeId]);
  
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">No workflow nodes to display</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-auto">
      <canvas 
        ref={canvasRef} 
        className="min-w-full"
      />
    </div>
  );
}