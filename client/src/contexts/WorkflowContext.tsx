import React, { createContext, ReactNode, useContext, useState } from 'react';
import { WorkflowNode } from '@shared/schema';

interface WorkflowContextType {
  workflowName: string;
  workflowDescription: string;
  workflowNodes: WorkflowNode[];
  agentName: string;
  agentDescription: string;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setWorkflowNodes: (nodes: WorkflowNode[]) => void;
  setAgentName: (name: string) => void;
  setAgentDescription: (description: string) => void;
  loadWorkflow: (data: { 
    name: string, 
    description: string, 
    nodes: WorkflowNode[],
    agentName: string,
    agentDescription: string
  }) => void;
  clearWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");

  const loadWorkflow = (data: { 
    name: string, 
    description: string, 
    nodes: WorkflowNode[],
    agentName: string,
    agentDescription: string
  }) => {
    setWorkflowName(data.name);
    setWorkflowDescription(data.description);
    setWorkflowNodes(data.nodes);
    setAgentName(data.agentName);
    setAgentDescription(data.agentDescription);
  };

  const clearWorkflow = () => {
    setWorkflowName("");
    setWorkflowDescription("");
    setWorkflowNodes([]);
    setAgentName("");
    setAgentDescription("");
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflowName,
        workflowDescription,
        workflowNodes,
        agentName,
        agentDescription,
        setWorkflowName,
        setWorkflowDescription,
        setWorkflowNodes,
        setAgentName,
        setAgentDescription,
        loadWorkflow,
        clearWorkflow
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}