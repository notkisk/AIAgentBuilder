import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Agent, InsertAgent, Log } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AgentContextType {
  agents: Agent[];
  isLoading: boolean;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  createAgent: (agent: Omit<InsertAgent, "status">) => Promise<Agent>;
  updateAgentStatus: (id: number, status: "active" | "inactive") => Promise<void>;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["/api/agents"],
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agent: Omit<InsertAgent, "status">) => {
      const newAgent: InsertAgent = {
        ...agent,
        status: "inactive", // Default to inactive
      };
      const res = await apiRequest("POST", "/api/agents", newAgent);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent created",
        description: "Your AI agent has been created successfully",
      });
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update agent status mutation
  const updateAgentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "active" | "inactive" }) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: `Agent ${data.status === "active" ? "activated" : "deactivated"}`,
        description: `"${data.name}" is now ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update agent status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAgent = async (agent: Omit<InsertAgent, "status">) => {
    return createAgentMutation.mutateAsync(agent);
  };

  const updateAgentStatus = async (id: number, status: "active" | "inactive") => {
    await updateAgentStatusMutation.mutateAsync({ id, status });
  };

  return (
    <AgentContext.Provider
      value={{
        agents,
        isLoading,
        selectedAgent,
        setSelectedAgent,
        createAgent,
        updateAgentStatus,
        showCreateModal,
        setShowCreateModal,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
