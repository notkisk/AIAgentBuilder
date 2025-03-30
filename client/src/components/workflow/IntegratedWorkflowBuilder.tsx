import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowInstance,
  NodeChange,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowNode } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatWorkflowInterface } from './ChatWorkflowInterface';
import { NodeCreationContextMenu } from './NodeCreationContextMenu';
import EnhancedToolNode from './EnhancedToolNode';
import { Icons } from '../ui/icons';
// import { useResizeObserver } from '@reactflow/node-resizer';
import { ReactFlowProvider } from 'reactflow';
import { useNotification } from '@/hooks/useNotification';

import { cn } from '@/lib/utils';

// Define node types for ReactFlow
const nodeTypes = {
  toolNode: EnhancedToolNode
};

// Interface for props
interface IntegratedWorkflowBuilderProps {
  initialNodes?: WorkflowNode[];
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  readOnly?: boolean;
  workflowId?: number;
  availableTools?: {
    name: string;
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>;
  }[];
}

// Helper function to convert our WorkflowNode schema to ReactFlow nodes
function convertToFlowNodes(nodes: WorkflowNode[]): Node[] {
  if (!nodes) return [];
  return nodes.map((node, index) => ({
    id: node.id,
    position: { x: 250 * (index % 3), y: 150 * Math.floor(index / 3) },
    data: {
      label: node.tool === 'chatgpt' ? 'ChatGPT' : node.tool,
      tool: node.tool,
      function: node.function,
      params: node.params || {},
    },
    type: 'toolNode'
  }));
}

// Helper function to create edges from node connections
function createEdgesFromConnections(nodes: WorkflowNode[]): Edge[] {
  const edges: Edge[] = [];
  
  nodes.forEach(node => {
    if (node.next) {
      edges.push({
        id: `${node.id}-${node.next}`,
        source: node.id,
        target: node.next,
        animated: true,
        style: { stroke: '#8080ff' },
        type: 'smoothstep'
      });
    }
  });
  
  return edges;
}

// Helper function to convert ReactFlow nodes back to our schema
function convertToWorkflowNodes(flowNodes: Node[], edges: Edge[]): WorkflowNode[] {
  // Create a map of node connections
  const connectionMap: Record<string, string> = {};
  edges.forEach(edge => {
    connectionMap[edge.source] = edge.target;
  });
  
  return flowNodes.map(node => ({
    id: node.id,
    tool: node.data.tool,
    function: node.data.function,
    params: node.data.params || {},
    next: connectionMap[node.id]
  }));
}

export function IntegratedWorkflowBuilder({
  initialNodes = [],
  onNodesChange: onWorkflowNodesChange,
  readOnly = false,
  workflowId,
  availableTools = []
}: IntegratedWorkflowBuilderProps) {
  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState(convertToFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(createEdgesFromConnections(initialNodes));
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState<string | null>(null);
  
  // Interface states
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [activeTab, setActiveTab] = useState<string>('visual-builder');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  // Using a regular ref instead of resize observer
  const { width, height } = { width: 0, height: 0 }; // placeholder values
  const { showNotification } = useNotification();
  
  // Update edges whenever nodes change connections
  useEffect(() => {
    if (initialNodes?.length) {
      setNodes(convertToFlowNodes(initialNodes));
      setEdges(createEdgesFromConnections(initialNodes));
    }
  }, [initialNodes, setNodes, setEdges]);
  
  // Convert changes back to WorkflowNode schema and notify parent
  const updateWorkflowNodes = useCallback(() => {
    const workflowNodes = convertToWorkflowNodes(nodes, edges);
    if (onWorkflowNodesChange) {
      onWorkflowNodesChange(workflowNodes);
    }
  }, [nodes, edges, onWorkflowNodesChange]);
  
  // Update parent whenever nodes or edges change
  useEffect(() => {
    // Debounce to avoid too many updates during dragging, etc.
    const timer = setTimeout(() => {
      updateWorkflowNodes();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [nodes, edges, updateWorkflowNodes]);
  
  // Handle new connections between nodes
  const onConnect = useCallback((connection: Connection) => {
    // Create a new edge
    setEdges(eds => {
      // First remove any existing edges from the source node to avoid multiple outputs
      const filteredEdges = eds.filter(e => e.source !== connection.source);
      // Add the new edge
      return [
        ...filteredEdges,
        {
          id: `${connection.source}-${connection.target}`,
          source: connection.source!,
          target: connection.target!,
          animated: true,
          style: { stroke: '#8080ff' },
          type: 'smoothstep'
        }
      ];
    });
    setSourceNodeForConnection(null);
  }, [setEdges]);
  
  // Handle starting a connection drag
  const onConnectStart: OnConnectStart = useCallback((event, params) => {
    if (params.nodeId) {
      setSourceNodeForConnection(params.nodeId);
    }
  }, []);
  
  // Handle ending a connection drag without connecting to a target
  const onConnectEnd = useCallback((event: any) => {
    // Only show the context menu if we have a source node
    if (!sourceNodeForConnection) return;
    
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (reactFlowBounds && reactFlowInstance) {
      const { clientX, clientY } = event;
      const position = {
        x: clientX - reactFlowBounds.left,
        y: clientY - reactFlowBounds.top
      };
      
      // Show the node creation context menu at the drop position
      setContextMenuPosition(position);
    }
  }, [reactFlowInstance, sourceNodeForConnection]);
  
  // Handle selecting a node type from the context menu
  const handleNodeTypeSelect = useCallback((nodeType: any) => {
    if (!reactFlowInstance || !sourceNodeForConnection) return;
    
    // Create a unique ID for the new node
    const nodeId = `${nodeType.id}-${Date.now()}`;
    
    // Create the new node at the context menu position
    const newNode = {
      id: nodeId,
      position: reactFlowInstance.project({
        x: contextMenuPosition!.x,
        y: contextMenuPosition!.y
      }),
      data: {
        label: nodeType.name,
        tool: nodeType.id.split('-')[0], // Extract the tool name from the ID
        function: nodeType.function,
        params: nodeType.params
      },
      type: 'toolNode'
    };
    
    // Add the new node
    setNodes(nds => [...nds, newNode]);
    
    // Connect the source node to the new node
    setEdges(eds => {
      // First remove any existing edges from the source node
      const filteredEdges = eds.filter(e => e.source !== sourceNodeForConnection);
      // Add the new edge
      return [
        ...filteredEdges,
        {
          id: `${sourceNodeForConnection}-${nodeId}`,
          source: sourceNodeForConnection,
          target: nodeId,
          animated: true,
          style: { stroke: '#8080ff' },
          type: 'smoothstep'
        }
      ];
    });
    
    // Clear the context menu
    setContextMenuPosition(null);
    setSourceNodeForConnection(null);
    
    // Show a success notification
    showNotification(`Added ${nodeType.name} node`, 'Node added successfully', { variant: 'success' });
  }, [reactFlowInstance, sourceNodeForConnection, contextMenuPosition, setNodes, setEdges, showNotification]);
  
  // Handle ChatWorkflowInterface updates
  const handleWorkflowUpdate = useCallback((updatedNodes: WorkflowNode[]) => {
    setNodes(convertToFlowNodes(updatedNodes));
    setEdges(createEdgesFromConnections(updatedNodes));
    
    showNotification('Workflow updated', 'Workflow was updated via chat', { variant: 'success' });
  }, [setNodes, setEdges, showNotification]);
  
  // Close context menu 
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setSourceNodeForConnection(null);
  }, []);
  
  return (
    <ReactFlowProvider>
      <div ref={containerRef} className="h-full w-full flex flex-col overflow-hidden">
        <Card className="h-full w-full flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <Icons.zap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">Workflow Builder</h2>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="visual-builder" className="flex items-center gap-2">
                    <Icons.cpu className="h-4 w-4" />
                    <span className="hidden sm:inline">Visual Builder</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat-interface" className="flex items-center gap-2">
                    <Icons.messageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Chat Interface</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Icons.save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button size="sm" className="flex items-center gap-2">
                <Icons.play className="h-4 w-4" />
                <span className="hidden sm:inline">Run</span>
              </Button>
            </div>
          </div>
          
          <div className="flex-grow overflow-hidden">
            <div className={cn(
              "h-full grid transition-all duration-300",
              isMobile 
                ? "grid-rows-1 grid-cols-1" 
                : activeTab === "visual-builder" 
                  ? "grid-cols-[1fr_0px]" 
                  : activeTab === "chat-interface" 
                    ? "grid-cols-[0px_1fr]" 
                    : "grid-cols-[60%_40%]"
            )}>
              <div 
                ref={reactFlowWrapper} 
                className={cn(
                  "h-full",
                  (isMobile && activeTab !== "visual-builder") && "hidden"
                )}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onConnectStart={onConnectStart}
                  onConnectEnd={onConnectEnd}
                  onInit={setReactFlowInstance}
                  connectionLineType={ConnectionLineType.SmoothStep}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.2}
                  maxZoom={2}
                  panOnScroll
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={!readOnly}
                  nodesConnectable={!readOnly}
                  elementsSelectable={!readOnly}
                >
                  <Background />
                  <Controls />
                  <MiniMap 
                    nodeColor={node => {
                      switch (node.data.tool) {
                        case 'chatgpt': return '#34D399';
                        case 'gmail': return '#FBBF24';
                        case 'webscraper': return '#60A5FA';
                        case 'trigger': return '#A78BFA';
                        default: return '#94A3B8';
                      }
                    }}
                    maskColor="rgba(240, 240, 240, 0.2)"
                  />
                  <Panel position="top-left" className="bg-background/60 backdrop-blur-sm rounded-md shadow-sm p-2 border mt-2 ml-2">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {nodes.length} nodes · {edges.length} connections
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        Drag between nodes to connect them
                      </div>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
              
              <div 
                className={cn(
                  "h-full border-l",
                  (isMobile && activeTab !== "chat-interface") && "hidden",
                  !isMobile && activeTab === "visual-builder" && "hidden",
                  !isMobile && activeTab === "chat-interface" && "border-l-0"
                )}
              >
                <ChatWorkflowInterface 
                  workflowNodes={convertToWorkflowNodes(nodes, edges)}
                  onWorkflowUpdate={handleWorkflowUpdate}
                  workflowId={workflowId}
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Context menu for node creation on connection drag */}
        <NodeCreationContextMenu
          position={contextMenuPosition}
          onSelectNode={handleNodeTypeSelect}
          onClose={closeContextMenu}
          sourceNodeId={sourceNodeForConnection || undefined}
        />
      </div>
    </ReactFlowProvider>
  );
}