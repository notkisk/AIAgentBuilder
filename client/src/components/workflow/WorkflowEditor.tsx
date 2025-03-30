import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
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
  Connection,
  addEdge,
} from 'reactflow';
import { getToolColor } from '@/lib/agent-tools';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from 'lucide-react';
import { WorkflowNode, WorkflowNodes } from '@shared/schema';

// Import React Flow styles
import 'reactflow/dist/style.css';

interface WorkflowEditorProps {
  initialNodes?: WorkflowNode[];
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  readOnly?: boolean;
  availableTools?: {
    name: string;
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>;
  }[];
}

interface ToolIconData {
  icon: React.ReactNode;
  label: string;
}

// Function to get tool icon or text
const getToolIcon = (toolName: string): ToolIconData => {
  // Map of tool names to visual icons or formatted names
  const toolIcons: Record<string, ToolIconData> = {
    'webscraper': { 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 10L21 3M10 14L3 21M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Web'
    },
    'chatgpt': { 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.3901 11.6C21.6646 10.8 21.8018 10 21.8018 9.2C21.8018 5.4 18.6967 2 14.5953 2C12.2018 2 10.1329 3.2 8.79948 4.9C8.25246 4.8 7.84313 4.7 7.29611 4.7C3.46434 4.7 0.5 8 0.5 12C0.5 16 3.46434 19.3 7.29611 19.3C7.84313 19.3 8.25246 19.2 8.66179 19.1C10.1329 20.8 12.2018 22 14.5953 22C18.6967 22 21.8018 18.6 21.8018 14.8C21.8018 14 21.6646 13.2 21.3901 12.4" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 8.5C14.5 8.5 13 10.5 12 10.5C11 10.5 9.5 8.5 9.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'AI'
    },
    'gmail': { 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6M22 6L12 13L2 6" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Mail'
    },
    'slack': { 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.5 10C13.67 10 13 9.33 13 8.5V3.5C13 2.67 13.67 2 14.5 2C15.33 2 16 2.67 16 3.5V8.5C16 9.33 15.33 10 14.5 10Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.5 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.5 14C10.33 14 11 14.67 11 15.5V20.5C11 21.33 10.33 22 9.5 22C8.67 22 8 21.33 8 20.5V15.5C8 14.67 8.67 14 9.5 14Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 15.5H3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9.5C10 8.67 9.33 8 8.5 8H3.5C2.67 8 2 8.67 2 9.5C2 10.33 2.67 11 3.5 11H8.5C9.33 11 10 10.33 10 9.5Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 8V3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14.5C14 13.67 14.67 13 15.5 13H20.5C21.33 13 22 13.67 22 14.5C22 15.33 21.33 16 20.5 16H15.5C14.67 16 14 15.33 14 14.5Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.5 16V20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Slack'
    }
  };
  
  // Default icon if no match is found
  const defaultIcon: ToolIconData = { 
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: toolName.substring(0, 4)
  };
  
  return toolIcons[toolName] || defaultIcon;
};

// Custom node component for tool nodes
const ToolNode = ({ data, selected, id }: NodeProps) => {
  const tool = data.tool;
  const fn = data.function;
  const params = data.params;
  const isConfiguring = data.isConfiguring;
  const onConfigureNode = data.onConfigureNode;
  const onDeleteNode = data.onDeleteNode;
  const toolColor = getToolColor(tool) || {
    bg: '#f9fafb',
    text: '#111827',
    darkBg: '#1f2937',
    darkText: '#f9fafb',
  };
  
  // Get tool icon and label
  const toolIconData = getToolIcon(tool);

  return (
    <div 
      className={`relative px-4 py-3 rounded-lg shadow-md border ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{
        backgroundColor: `${toolColor.bg}30`, // Add transparency
        borderColor: toolColor.bg,
        color: toolColor.text,
      }}
    >
      {/* Input handle with tooltip */}
      <div className="tooltip-container">
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors cursor-crosshair"
        />
        <div className="tooltip">Input Connection</div>
      </div>

      {/* Output handle with tooltip */}
      <div className="tooltip-container">
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors cursor-crosshair"
        />
        <div className="tooltip">Output Connection</div>
      </div>

      {/* Delete button - only visible when not read-only */}
      {onDeleteNode && (
        <button 
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(id);
          }}
          title="Remove Node"
        >
          <X size={12} />
        </button>
      )}

      <div className="flex flex-col space-y-1">
        <div className="flex items-center mb-2">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-md mr-2"
            style={{
              backgroundColor: toolColor.bg,
              color: toolColor.text,
            }}
            title={`Tool: ${tool}`}
          >
            {toolIconData.icon}
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
                    ? (
                      <span className="text-primary font-medium flex items-center" title={`Input from node ${value.split('.')[0].substring(1)}`}>
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Node {value.split('.')[0].substring(1)} output
                      </span>
                    )
                    : value
                  : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>

        {/* Edit button - only for editable workflows */}
        {onConfigureNode && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onConfigureNode(id);
            }}
          >
            Edit Configuration
          </Button>
        )}
      </div>
    </div>
  );
};

// Define custom node types
const nodeTypes: NodeTypes = {
  tool: ToolNode,
};

// Convert internal React Flow nodes to our data format
const getWorkflowNodesFromFlow = (nodes: Node[], edges: Edge[]): WorkflowNode[] => {
  const nodeConnections: Record<string, string> = {};
  
  // Build connection map
  edges.forEach(edge => {
    nodeConnections[edge.source] = edge.target;
  });
  
  return nodes.map(node => ({
    id: node.id,
    tool: node.data.tool,
    function: node.data.function,
    params: { ...node.data.params },
    next: nodeConnections[node.id]
  }));
};

// Main component
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ 
  initialNodes = [], 
  onNodesChange, 
  readOnly = false,
  availableTools = []
}) => {
  // Calculate positions for nodes - this is defined outside the InteractiveFlow component 
  // because it doesn't need access to the component's state
  const calculateNodePositions = (
    workflowNodes: WorkflowNode[], 
    handleConfigureNode?: (nodeId: string) => void,
    handleDeleteNode?: (nodeId: string) => void,
    readOnly = false
  ): { nodes: Node[], edges: Edge[] } => {
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
    const maxNodesInLevel = Math.max(...Object.values(nodesByLevel).map(nodes => nodes.length), 1);
    
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
            onConfigureNode: !readOnly && handleConfigureNode ? handleConfigureNode : undefined,
            onDeleteNode: !readOnly && handleDeleteNode ? handleDeleteNode : undefined,
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

  // Convert initial workflow nodes to React Flow format
  const { nodes: initialFlowNodes, edges: initialFlowEdges } = calculateNodePositions(initialNodes || [], undefined, undefined, readOnly);
  
  // Component with interactive controls (nested to use ReactFlow hooks)
  const InteractiveFlow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodeConfig, setNodeConfig] = useState<{
      tool: string;
      function: string;
      params: Record<string, any>;
    } | null>(null);
    const [showAddNodeSheet, setShowAddNodeSheet] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string>('');
    const [selectedFunction, setSelectedFunction] = useState<string>('');
    const [newNodeParams, setNewNodeParams] = useState<Record<string, string>>({});
    
    // Set up handlers for node configuration
    const handleConfigureNode = useCallback((nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(nodeId);
        setNodeConfig({
          tool: node.data.tool,
          function: node.data.function,
          params: { ...node.data.params }
        });
      }
    }, [nodes]);
    
    // Handler for deleting a node
    const handleDeleteNode = useCallback((nodeId: string) => {
      // Remove the node
      setNodes(nds => nds.filter(node => node.id !== nodeId));
      
      // Remove all connected edges
      setEdges(eds => eds.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
      
      // Update other nodes that might reference this node
      const updatedNodes = nodes.map(node => {
        if (node.data.params) {
          // Check for references to the deleted node in parameters
          const updatedParams = { ...node.data.params };
          Object.keys(updatedParams).forEach(key => {
            if (typeof updatedParams[key] === 'string' && 
                updatedParams[key].includes(`$${nodeId}.`)) {
              updatedParams[key] = '';
            }
          });
          return {
            ...node,
            data: {
              ...node.data,
              params: updatedParams
            }
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
    }, [nodes, setNodes, setEdges]);
    
    // Update parent component when nodes/edges change
    useEffect(() => {
      if (onNodesChange && typeof onNodesChange === 'function') {
        const workflowNodes = getWorkflowNodesFromFlow(nodes, edges);
        onNodesChange(workflowNodes);
      }
    }, [nodes, edges, onNodesChange]);
    
    // Fit view when nodes change
    useEffect(() => {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 50);
    }, [initialFlowNodes, initialFlowEdges, fitView]);
    
    // Handle connections between nodes
    const onConnect = useCallback((connection: Connection) => {
      setEdges(eds => {
        // First remove any existing connections from this source
        const filteredEdges = eds.filter(e => e.source !== connection.source);
        // Then add the new connection
        return addEdge({
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8' }
        }, filteredEdges);
      });
    }, [setEdges]);
    
    // Handle adding a new node
    const handleAddNode = () => {
      if (!selectedTool || !selectedFunction) return;
      
      // Get tool function details
      const tool = availableTools.find(t => t.name === selectedTool);
      const functionDetails = tool?.functions.find(f => f.name === selectedFunction);
      
      if (!tool || !functionDetails) return;
      
      // Generate default params from function parameters
      const defaultParams: Record<string, string> = {};
      Object.keys(functionDetails.parameters || {}).forEach(paramName => {
        defaultParams[paramName] = newNodeParams[paramName] || '';
      });
      
      // Generate a unique ID for the new node
      const newId = `node_${Date.now()}`;
      
      // Add the new node
      const newNode: Node = {
        id: newId,
        type: 'tool',
        data: {
          tool: selectedTool,
          function: selectedFunction,
          params: defaultParams,
          onConfigureNode: handleConfigureNode,
          onDeleteNode: handleDeleteNode,
        },
        position: { 
          x: Math.random() * 300, 
          y: Math.random() * 300 
        }
      };
      
      setNodes(nds => [...nds, newNode]);
      
      // Reset form state
      setSelectedTool('');
      setSelectedFunction('');
      setNewNodeParams({});
      setShowAddNodeSheet(false);
      
      // Update layout
      setTimeout(() => {
        const workflowNodes = getWorkflowNodesFromFlow([...nodes, newNode], edges);
        const { nodes: layoutedNodes, edges: layoutedEdges } = calculateNodePositions(
          workflowNodes, 
          handleConfigureNode, 
          handleDeleteNode
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        fitView({ padding: 0.2 });
      }, 50);
    };
    
    // Update node configuration
    const handleUpdateNodeConfig = () => {
      if (!selectedNode || !nodeConfig) return;
      
      setNodes(nds => 
        nds.map(node => {
          if (node.id === selectedNode) {
            return {
              ...node,
              data: {
                ...node.data,
                tool: nodeConfig.tool,
                function: nodeConfig.function,
                params: nodeConfig.params
              }
            };
          }
          return node;
        })
      );
      
      setSelectedNode(null);
      setNodeConfig(null);
    };
    
    // Get functions for selected tool
    const functionsForSelectedTool = 
      availableTools.find(t => t.name === selectedTool)?.functions || [];
    
    // Get parameters for selected function
    const parametersForSelectedFunction = 
      functionsForSelectedTool.find(f => f.name === selectedFunction)?.parameters || {};
    
    return (
      <>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange}
          onConnect={!readOnly ? onConnect : undefined}
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
              onClick={() => fitView({ padding: 0.2 })}
              className="p-2 rounded bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
            </button>
          </Panel>
          
          {!readOnly && (
            <Panel position="top-left">
              <Button 
                onClick={() => setShowAddNodeSheet(true)}
                className="shadow-sm"
              >
                Add Node
              </Button>
            </Panel>
          )}
        </ReactFlow>
        
        {/* Sheet for node configuration */}
        {selectedNode && nodeConfig && (
          <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Configure Node</SheetTitle>
                <SheetDescription>
                  Update parameters for this node.
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-1">
                  <Label>Tool</Label>
                  <div className="font-medium">{nodeConfig.tool}</div>
                </div>
                
                <div className="space-y-1">
                  <Label>Function</Label>
                  <div className="font-medium">{nodeConfig.function}</div>
                </div>
                
                <div className="space-y-3 mt-4">
                  <Label>Parameters</Label>
                  {Object.entries(nodeConfig.params).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`param-${key}`}>{key}</Label>
                      <Input 
                        id={`param-${key}`}
                        value={value as string}
                        onChange={(e) => setNodeConfig({
                          ...nodeConfig,
                          params: {
                            ...nodeConfig.params,
                            [key]: e.target.value
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button onClick={handleUpdateNodeConfig}>Update</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
        
        {/* Sheet for adding new node */}
        <Sheet open={showAddNodeSheet} onOpenChange={setShowAddNodeSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Tool Node</SheetTitle>
              <SheetDescription>
                Configure and add a new node to your workflow.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tool-select">Select Tool</Label>
                <Select 
                  value={selectedTool} 
                  onValueChange={setSelectedTool}
                >
                  <SelectTrigger id="tool-select">
                    <SelectValue placeholder="Select a tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTools.map(tool => (
                      <SelectItem key={tool.name} value={tool.name}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTool && (
                <div className="space-y-1">
                  <Label htmlFor="function-select">Select Function</Label>
                  <Select 
                    value={selectedFunction} 
                    onValueChange={setSelectedFunction}
                  >
                    <SelectTrigger id="function-select">
                      <SelectValue placeholder="Select a function" />
                    </SelectTrigger>
                    <SelectContent>
                      {functionsForSelectedTool.map(fn => (
                        <SelectItem key={fn.name} value={fn.name}>
                          {fn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedFunction && Object.keys(parametersForSelectedFunction).length > 0 && (
                <div className="space-y-3 mt-4">
                  <Label>Parameters</Label>
                  {Object.entries(parametersForSelectedFunction).map(([key, paramInfo]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`new-param-${key}`}>{key}</Label>
                      <Input 
                        id={`new-param-${key}`}
                        placeholder={(paramInfo as any).description || key}
                        value={newNodeParams[key] || ''}
                        onChange={(e) => setNewNodeParams({
                          ...newNodeParams,
                          [key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button 
                onClick={handleAddNode}
                disabled={!selectedTool || !selectedFunction}
              >
                Add Node
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    );
  };
  
  if (!initialNodes || initialNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">
          {readOnly 
            ? "No workflow nodes to display" 
            : "No nodes in workflow. Click 'Add Node' to start building your workflow."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-[500px] w-full">
      <ReactFlowProvider>
        <InteractiveFlow />
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowEditor;