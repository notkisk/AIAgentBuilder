import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat/ChatInterface";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import { isAIProviderConfigured } from "@/lib/ai-service";
import { WorkflowNode, WorkflowNodes } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useWorkflow } from "@/contexts/WorkflowContext";

export default function Create() {
  const [activeTab, setActiveTab] = useState("chat");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we have AI providers configured
  const hasOpenAI = isAIProviderConfigured("openai");
  const hasAnthropic = isAIProviderConfigured("anthropic");
  const hasAiProvider = hasOpenAI || hasAnthropic;

  // Get workflow state from context
  const { 
    workflowName, setWorkflowName,
    workflowDescription, setWorkflowDescription,
    workflowNodes, setWorkflowNodes,
    agentName, setAgentName,
    agentDescription, setAgentDescription
  } = useWorkflow();
  
  // Create example workflows
  const loadExampleWebScraper = () => {
    setAgentName("Website Content Monitor");
    setAgentDescription("Monitors a website for changes, summarizes new content with AI, and sends email notifications");
    setWorkflowName("Web Scraper to Email Workflow");
    setWorkflowDescription("Scrapes website content, summarizes it with AI, and sends email notifications");
    
    setWorkflowNodes([
      {
        id: "1",
        tool: "webscraper",
        function: "fetchPage",
        params: { url: "https://example.com" },
        next: "2"
      },
      {
        id: "2",
        tool: "chatgpt",
        function: "summarizeText",
        params: { text: "$1.output" },
        next: "3"
      },
      {
        id: "3",
        tool: "gmail",
        function: "sendEmail",
        params: { 
          to: "user@example.com", 
          subject: "Website Update Summary", 
          body: "$2.output" 
        }
      }
    ]);
  };
  
  // Sample available tools
  const availableTools = [
    {
      name: "gmail",
      functions: [
        {
          name: "sendEmail",
          description: "Sends an email to recipient",
          parameters: {
            to: { type: "string", description: "Recipient email" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body content" }
          }
        },
        {
          name: "readEmails",
          description: "Reads emails based on filters",
          parameters: {
            filters: { type: "string", description: "Filter string (e.g., from:example@gmail.com)" }
          }
        }
      ]
    },
    {
      name: "chatgpt",
      functions: [
        {
          name: "generateText",
          description: "Generates text based on a prompt",
          parameters: {
            prompt: { type: "string", description: "Text prompt for generation" }
          }
        },
        {
          name: "summarizeText",
          description: "Summarizes input text",
          parameters: {
            text: { type: "string", description: "Text to summarize" }
          }
        }
      ]
    },
    {
      name: "webscraper",
      functions: [
        {
          name: "fetchPage",
          description: "Fetches a web page",
          parameters: {
            url: { type: "string", description: "URL to fetch" }
          }
        },
        {
          name: "extractText",
          description: "Extracts text from HTML using selector",
          parameters: {
            selector: { type: "string", description: "CSS selector to extract" }
          }
        }
      ]
    },
    {
      name: "slack",
      functions: [
        {
          name: "sendMessage",
          description: "Sends a message to a Slack channel",
          parameters: {
            channel: { type: "string", description: "Channel name or ID" },
            text: { type: "string", description: "Message text" }
          }
        },
        {
          name: "readMessages",
          description: "Reads messages from a Slack channel",
          parameters: {
            channel: { type: "string", description: "Channel name or ID" },
            count: { type: "number", description: "Number of messages to read" }
          }
        }
      ]
    }
  ];
  
  // Handle workflow node changes
  const handleNodesChange = (nodes: WorkflowNode[]) => {
    setWorkflowNodes(nodes);
  };
  
  // Effect to automatically switch to Visual Builder tab when workflows are loaded
  useEffect(() => {
    if (workflowNodes && workflowNodes.length > 0 && activeTab === "chat") {
      setActiveTab("visual");
    }
  }, [workflowNodes, activeTab]);
  
  // Create agent and workflow mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // First create the workflow
      const workflowResponse = await apiRequest('/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          nodes: {
            nodes: workflowNodes || []
          }
        })
      });
      
      if (!workflowResponse.ok) {
        const error = await workflowResponse.json();
        throw new Error(error.message || 'Failed to create workflow');
      }
      
      const workflow = await workflowResponse.json();
      
      // Then create the agent linked to the workflow
      const agentResponse = await apiRequest('/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          prompt: `Visually created agent: ${agentDescription}`,
          tools: Array.from(new Set((workflowNodes || []).map(node => node.tool))),
          workflowId: workflow.id,
          status: 'inactive'
        })
      });
      
      if (!agentResponse.ok) {
        const error = await agentResponse.json();
        throw new Error(error.message || 'Failed to create agent');
      }
      
      return await agentResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agent created successfully",
        description: `Your agent "${agentName}" is ready to use.`,
        variant: "default",
      });
      
      // Navigate to the agent detail page
      navigate(`/agents/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Create AI Agent</h2>
          {hasAiProvider && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              AI-Powered 
              {hasOpenAI && hasAnthropic 
                ? " (OpenAI + Anthropic)" 
                : hasOpenAI 
                  ? " (OpenAI)" 
                  : " (Anthropic)"}
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Describe what you want your agent to do in natural language, and we'll create a workflow for you.
        </p>
      </div>

      <Tabs
        defaultValue="chat"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mb-4 w-auto self-start">
          <TabsTrigger value="chat">Chat Builder</TabsTrigger>
          <TabsTrigger value="visual">Visual Builder</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ChatInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Visual Workflow Builder</CardTitle>
              <CardDescription>
                Visually design your agent's workflow by adding and connecting tool nodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input 
                      id="agent-name" 
                      placeholder="My Agent" 
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agent-description">Agent Description</Label>
                    <Textarea 
                      id="agent-description" 
                      placeholder="Describe what this agent does" 
                      className="min-h-[80px]"
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input 
                      id="workflow-name" 
                      placeholder="My Workflow" 
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workflow-description">Workflow Description</Label>
                    <Textarea 
                      id="workflow-description" 
                      placeholder="Describe your workflow" 
                      className="min-h-[80px]"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Workflow Canvas</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadExampleWebScraper}
                  className="text-xs"
                >
                  Load Example Workflow
                </Button>
              </div>
              <div className="p-1 bg-gray-50 dark:bg-gray-900 rounded-md h-[500px] border">
                <WorkflowEditor 
                  initialNodes={workflowNodes || []}
                  onNodesChange={handleNodesChange}
                  availableTools={availableTools}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 mt-4">
              <Button 
                className="ml-auto"
                disabled={
                  !agentName || 
                  !agentDescription || 
                  !workflowName || 
                  !workflowDescription || 
                  !workflowNodes || workflowNodes.length === 0 || 
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
          <Card>
            <CardHeader>
              <CardTitle>Email Monitor</CardTitle>
              <CardDescription>
                Monitor your inbox for important emails and get notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                <p className="font-medium">Example Prompt:</p>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "Create an agent that monitors my Gmail inbox for emails containing the word 'urgent' and sends me a Slack notification when they arrive."
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Gmail API</Badge>
                <Badge>Slack API</Badge>
                <Badge>Text Analysis</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Website Update Tracker</CardTitle>
              <CardDescription>
                Keep track of changes on websites and get summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                <p className="font-medium">Example Prompt:</p>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "I need an agent that checks a website every day for changes, then summarizes the new content and emails it to me."
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Web Scraper</Badge>
                <Badge>OpenAI API</Badge>
                <Badge>Gmail API</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="how-it-works" className="space-y-4 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
          <Card>
            <CardHeader>
              <CardTitle>How AI-Generated Workflows Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">1. Natural Language Description</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start by describing what you want your agent to do in plain English. Be specific about the tools
                  you want to use (Gmail, Slack, OpenAI, etc.) and what actions you want the agent to take.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">2. AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our system uses {hasOpenAI ? "OpenAI" : hasAnthropic ? "Anthropic" : "AI"} to analyze your description and identify the required tools and workflow steps.
                  The AI determines the optimal sequence of operations to achieve your goal.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">3. Workflow Generation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Based on the analysis, a JSON workflow is created that defines each step in the process.
                  Each step specifies a tool, function, and parameters, with proper connections between steps.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">4. Agent Creation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The workflow is converted into an agent that you can run, schedule, and monitor.
                  You can also modify the agent's configuration later if needed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}