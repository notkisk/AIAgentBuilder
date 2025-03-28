import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Edge,
  Node,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  useReactFlow,
} from 'reactflow';
import { getToolColor } from '@/lib/agent-tools';

// Import React Flow styles
import 'reactflow/dist/style.css';

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

// Custom node component for tool nodes
const ToolNode = ({ data, selected }: NodeProps) => {
  const tool = data.tool;
  const fn = data.function;
  const params = data.params;
  const toolColor = getToolColor(tool) || {
    bg: '#f9fafb',
    text: '#111827',
    darkBg: '#1f2937',
    darkText: '#f9fafb',
  };

  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-md border ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{
        backgroundColor: `${toolColor.bg}30`, // Add transparency
        borderColor: toolColor.bg,
        color: toolColor.text,
      }}
    >
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white"
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white"
      />

      <div className="flex flex-col space-y-1">
        <div className="flex items-center mb-2">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-lg mr-2"
            style={{
              backgroundColor: toolColor.bg,
              color: toolColor.text,
            }}
          >
            <span className="text-xs font-medium">{tool.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold">{fn}</h3>
            <p className="text-xs opacity-70">{tool}</p>
          </div>
        </div>

        {/* Parameters */}
        <div className="text-xs space-y-1 mt-1">
          {Object.entries(params).map(([key, value], index) => (
            <div key={index} className="flex items-start">
              <span className="font-medium mr-1">{key}:</span>
              <span className="truncate opacity-80" style={{ maxWidth: '150px' }}>
                {typeof value === 'string' 
                  ? value.startsWith('$') 
                    ? <span className="text-primary-600 dark:text-primary-400 font-medium">{value}</span>
                    : value
                  : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// The component that provides zoom controls and fit view
const FlowWithControls = ({ initialNodes, initialEdges, activeNodeId }: { 
  initialNodes: Node[], 
  initialEdges: Edge[],
  activeNodeId?: string
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // When active node changes, highlight it
  useEffect(() => {
    if (activeNodeId) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === activeNodeId,
        }))
      );
    }
  }, [activeNodeId, setNodes]);

  // Fit view on initial render and when nodes/edges change
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 50);
  }, [initialNodes, initialEdges, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  // Stop events from propagating to prevent editing the workflow
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-gray-50 dark:bg-gray-900 rounded-md"
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={false} />
        <Panel position="top-right" className="flex space-x-2">
          <button 
            onClick={() => zoomIn()}
            className="p-2 rounded bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button 
            onClick={() => zoomOut()}
            className="p-2 rounded bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button 
            onClick={handleFitView}
            className="p-2 rounded bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
          </button>
        </Panel>
      </ReactFlow>
    </>
  );
};

// Define custom node types
const nodeTypes: NodeTypes = {
  tool: ToolNode,
};

// Layout calculation functions
const calculateNodePositions = (workflowNodes: WorkflowNode[]): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Calculate levels for nodes (depth in workflow)
  const nodeLevels: Record<string, number> = {};
  const calculateLevels = (nodeId: string, level: number) => {
    if (nodeLevels[nodeId] === undefined || level > nodeLevels[nodeId]) {
      nodeLevels[nodeId] = level;
    }
    
    const node = workflowNodes.find(n => n.id === nodeId);
    if (node?.next) {
      calculateLevels(node.next, level + 1);
    }
  };
  
  // Start from all nodes that don't have incoming connections
  const startNodeIds = new Set(workflowNodes.map(n => n.id));
  workflowNodes.forEach(node => {
    if (node.next) {
      startNodeIds.delete(node.next);
    }
  });
  
  startNodeIds.forEach(id => calculateLevels(id, 0));
  
  // Group nodes by level
  const nodesByLevel: Record<number, WorkflowNode[]> = {};
  Object.entries(nodeLevels).forEach(([nodeId, level]) => {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    const node = workflowNodes.find(n => n.id === nodeId);
    if (node) {
      nodesByLevel[level].push(node);
    }
  });
  
  // Position nodes
  const levelGap = 200;
  const nodeGap = 250;
  const maxNodesInLevel = Math.max(...Object.values(nodesByLevel).map(nodes => nodes.length));
  
  Object.entries(nodesByLevel).forEach(([level, levelNodes]) => {
    const levelInt = parseInt(level);
    const levelWidth = levelNodes.length * nodeGap;
    const startX = (maxNodesInLevel * nodeGap - levelWidth) / 2;
    
    levelNodes.forEach((node, index) => {
      const x = startX + index * nodeGap;
      const y = levelInt * levelGap;
      
      nodes.push({
        id: node.id,
        type: 'tool',
        data: {
          tool: node.tool,
          function: node.function,
          params: node.params,
        },
        position: { x, y },
      });
      
      if (node.next) {
        edges.push({
          id: `e${node.id}-${node.next}`,
          source: node.id,
          target: node.next,
          sourceHandle: 'out',
          targetHandle: 'in',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8' }
        });
      }
    });
  });
  
  return { nodes, edges };
};

// Main component
const ReactFlowVisualizer: React.FC<WorkflowVisualizerProps> = ({ nodes, activeNodeId }) => {
  const { nodes: flowNodes, edges: flowEdges } = calculateNodePositions(nodes);
  
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">No workflow nodes to display</p>
      </div>
    );
  }
  
  return (
    <div className="h-[500px] w-full">
      <ReactFlowProvider>
        <FlowWithControls 
          initialNodes={flowNodes} 
          initialEdges={flowEdges}
          activeNodeId={activeNodeId}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default ReactFlowVisualizer;