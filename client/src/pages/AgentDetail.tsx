import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Code, 
  Hammer, 
  Info, 
  Play, 
  Repeat, 
  Workflow, 
  XCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Execution, Log, NodeSchema, Workflow as WorkflowType } from "@shared/schema";
import JsonView from '@/components/utils/JsonView';
import ReactFlowVisualizer from '@/components/workflow/ReactFlowVisualizer';

export default function AgentDetail() {
  const { id } = useParams();
  const agentId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  // Fetch agent data
  const { data: agent, isLoading: isLoadingAgent, error: agentError } = useQuery({
    queryKey: ['/api/agents', agentId],
    enabled: !isNaN(agentId)
  });

  // Fetch workflow data if agent has workflowId
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ['/api/workflows', agent?.workflowId],
    enabled: !!agent?.workflowId
  });

  // Fetch agent logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/logs', { agentId }],
    queryFn: async () => {
      const response = await apiRequest(`/api/logs?agentId=${agentId}`);
      return response.json();
    },
    enabled: !isNaN(agentId)
  });

  // Fetch executions for this agent
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['/api/executions', { agentId }],
    queryFn: async () => {
      const response = await apiRequest(`/api/executions?agentId=${agentId}`);
      return response.json();
    },
    enabled: !isNaN(agentId)
  });

  // Fetch execution logs if execution is selected
  const { data: executionLogs } = useQuery({
    queryKey: ['/api/logs', { executionId: selectedExecution }],
    queryFn: async () => {
      const response = await apiRequest(`/api/logs?executionId=${selectedExecution}`);
      return response.json();
    },
    enabled: !!selectedExecution
  });

  // Execute agent mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/agents/${agentId}/execute`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute agent');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Execution started",
        description: `The agent "${agent?.name}" is now running.`,
        variant: "default",
      });

      // Refetch queries to get updated data
      queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/executions', { agentId }] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs', { agentId }] });

      // Auto-select the new execution
      setSelectedExecution(data.execution.executionId);
      setActiveTab("runs");
    },
    onError: (error) => {
      toast({
        title: "Execution failed",
        description: error.message || "Failed to execute agent",
        variant: "destructive",
      });
    }
  });

  // Toggle agent status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = agent?.status === 'active' ? 'inactive' : 'active';
      const response = await apiRequest(`/api/agents/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} agent`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: agent?.status === 'active' ? "Agent deactivated" : "Agent activated",
        description: `The agent "${agent?.name}" is now ${agent?.status === 'active' ? 'inactive' : 'active'}.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId] });
    },
    onError: (error) => {
      toast({
        title: "Status change failed",
        description: error.message || "Failed to change agent status",
        variant: "destructive",
      });
    }
  });

  // Automatically select the most recent execution when data loads
  useEffect(() => {
    if (executions?.length > 0 && !selectedExecution) {
      // Sort by start time descending and take the first one
      const sortedExecutions = [...executions].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      setSelectedExecution(sortedExecutions[0].executionId);
    }
  }, [executions, selectedExecution]);

  // Handle execute click
  const handleExecute = () => {
    if (agent?.status === 'running') {
      toast({
        title: "Agent is already running",
        description: "Please wait for the current execution to complete.",
        variant: "warning",
      });
      return;
    }

    if (!agent?.workflowId) {
      toast({
        title: "No workflow linked",
        description: "This agent doesn't have a workflow to execute.",
        variant: "destructive",
      });
      return;
    }

    executeMutation.mutate();
  };

  // Handle status toggle click
  const handleToggleStatus = () => {
    if (agent?.status === 'running') {
      toast({
        title: "Cannot change status",
        description: "The agent is currently running. Please wait for it to complete.",
        variant: "warning",
      });
      return;
    }

    toggleStatusMutation.mutate();
  };

  // Handle execution selection
  const handleExecutionSelect = (executionId: string) => {
    setSelectedExecution(executionId);
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
        </Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
          <Clock className="w-3 h-3 mr-1" /> Inactive
        </Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Repeat className="w-3 h-3 mr-1 animate-spin" /> Running
        </Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="w-3 h-3 mr-1" /> Error
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render log level badge with appropriate color
  const renderLogLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Info className="w-3 h-3 mr-1" /> Info
        </Badge>;
      case 'warn':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
          <AlertCircle className="w-3 h-3 mr-1" /> Warning
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" /> Error
        </Badge>;
      case 'debug':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
          <Code className="w-3 h-3 mr-1" /> Debug
        </Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Format the date with time
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoadingAgent) {
    return <div className="flex items-center justify-center h-full">Loading agent details...</div>;
  }

  if (agentError || !agent) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load agent details. Agent may not exist or there was a server error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Find the current execution
  const currentExecution = selectedExecution 
    ? executions?.find(e => e.executionId === selectedExecution) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <div className="text-gray-500">{agent.description}</div>
        </div>
        <div className="flex items-center space-x-3">
          {renderStatusBadge(agent.status)}
          <div className="flex space-x-2">
            <Button 
              variant={agent.status === 'active' ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              disabled={agent.status === 'running' || toggleStatusMutation.isPending}
            >
              {agent.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleExecute}
              disabled={!agent.workflowId || agent.status === 'running' || executeMutation.isPending}
            >
              <Play className="w-4 h-4 mr-1" /> Run
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div>{renderStatusBadge(agent.status)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Run</h3>
                <div>{agent.lastRun ? formatDate(agent.lastRun) : 'Never'}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Run Count</h3>
                <div>{agent.runCount || 0}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tools</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {agent.tools.map((tool, index) => (
                    <Badge key={index} variant="outline">{tool}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Original Prompt</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mt-1 text-sm font-mono">
                  {agent.prompt}
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingWorkflow ? (
            <div className="text-center py-4">Loading workflow...</div>
          ) : !workflow ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No workflow</AlertTitle>
              <AlertDescription>
                This agent doesn't have a workflow linked to it.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Linked Workflow</CardTitle>
                <CardDescription>{workflow.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">{workflow.description}</p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("workflow")}>
                    <Workflow className="w-4 h-4 mr-1" /> View Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          {isLoadingWorkflow ? (
            <div className="text-center py-4">Loading workflow...</div>
          ) : !workflow ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No workflow</AlertTitle>
              <AlertDescription>
                This agent doesn't have a workflow linked to it.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Visualization</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-hidden">
                        <ReactFlowVisualizer nodes={(workflow.nodes as any)?.nodes || []} />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Definition (JSON)</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80">
                        <JsonView data={workflow.nodes} />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleExecute}
                    disabled={agent.status === 'running' || executeMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" /> Run Workflow
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          {isLoadingExecutions ? (
            <div className="text-center py-4">Loading execution history...</div>
          ) : !executions || executions.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No executions</AlertTitle>
              <AlertDescription>
                This agent hasn't been executed yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <h3 className="text-lg font-medium">Execution History</h3>
                <div className="space-y-2">
                  {executions.map((execution) => (
                    <Card 
                      key={execution.executionId}
                      className={`cursor-pointer hover:shadow transition-shadow duration-200 ${
                        selectedExecution === execution.executionId ? 'border-primary ring-1 ring-primary' : ''
                      }`}
                      onClick={() => handleExecutionSelect(execution.executionId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate">
                            {execution.executionId.split('_')[0]}_
                            <span className="font-mono">{execution.executionId.split('_')[1]?.slice(0, 6)}</span>
                          </div>
                          <StatusBadge status={execution.status} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(execution.startTime)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                {currentExecution ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Execution Details</CardTitle>
                        <StatusBadge status={currentExecution.status} />
                      </div>
                      <CardDescription>
                        ID: {currentExecution.executionId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                        <div>{formatDate(currentExecution.startTime)}</div>
                      </div>
                      
                      {currentExecution.endTime && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                          <div>{formatDate(currentExecution.endTime)}</div>
                        </div>
                      )}
                      
                      {currentExecution.currentNode && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Current Node</h3>
                          <div>
                            <Badge variant="outline">{currentExecution.currentNode}</Badge>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Results</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mt-1 overflow-auto max-h-60">
                          <JsonView data={currentExecution.results || {}} />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Execution Logs</h3>
                        <div className="space-y-2">
                          {!executionLogs || executionLogs.length === 0 ? (
                            <div className="text-gray-500 italic">No logs available for this execution</div>
                          ) : (
                            executionLogs.map((log: Log) => (
                              <div 
                                key={log.id} 
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{log.message}</div>
                                  {renderLogLevelBadge(log.level)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(log.timestamp)}
                                </div>
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                    <JsonView data={log.details} />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select an execution to view details
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {isLoadingLogs ? (
            <div className="text-center py-4">Loading logs...</div>
          ) : !logs || logs.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No logs</AlertTitle>
              <AlertDescription>
                No logs have been recorded for this agent yet.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  Recent activity and events for this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log: Log) => (
                    <div 
                      key={log.id} 
                      className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{log.message}</div>
                        {renderLogLevelBadge(log.level)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(log.timestamp)}
                        {log.executionId && (
                          <span className="ml-2">
                            Execution: <span className="font-mono">{log.executionId.split('_')[0]}_
                            {log.executionId.split('_')[1]?.slice(0, 6)}</span>
                          </span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                          <JsonView data={log.details} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component to show status badge with icon
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Repeat className="w-3 h-3 mr-1 animate-spin" /> Running
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}