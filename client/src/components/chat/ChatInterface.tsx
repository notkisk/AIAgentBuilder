import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAgent } from "@/contexts/AgentContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateWorkflow, getToolRecommendations, isAIProviderConfigured } from "@/lib/ai-service";
import ApiKeyPrompt from "@/components/api-keys/ApiKeyPrompt";
import { useWorkflow } from "@/contexts/WorkflowContext";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface AgentSuggestion {
  name: string;
  description: string;
  tools: string[];
  recommendedSetup?: Array<{
    name: string;
    type: "api_key" | "oauth" | "webhook";
    isConfigured: boolean;
  }>;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI Agent Builder. Describe what you want your agent to do, and I'll help you create it.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createAgent } = useAgent();
  const { toast } = useToast();
  const { 
    workflowNodes,
    setWorkflowName, 
    setWorkflowDescription, 
    setWorkflowNodes,
    setAgentName,
    setAgentDescription 
  } = useWorkflow();
  
  // Check if we have AI providers configured
  const hasOpenAI = isAIProviderConfigured("openai");
  const hasAnthropic = isAIProviderConfigured("anthropic");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle API key configuration
  const handleKeysConfigured = () => {
    setShowApiKeyPrompt(false);
    toast({
      title: "AI keys configured",
      description: "Your AI keys have been configured. You'll get better workflow generation now!",
    });
    
    // Add a message to inform the user
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Thanks for configuring your AI keys! I can now provide more accurate workflow recommendations. Please tell me what you'd like your agent to do.",
        timestamp: new Date(),
      },
    ]);
  };
  
  const handleSkipKeyConfig = () => {
    setShowApiKeyPrompt(false);
    
    // Add a message to inform the user
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "No problem! I'll still help you create an agent, but I'll use simplified rule-based recommendations. You can always add AI keys later in settings.",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // Add a typing indicator message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: "typing",
          role: "assistant",
          content: "Thinking...",
          timestamp: new Date(),
        },
      ]);

      // Check if we need to prompt for API keys
      const hasAiKeys = hasOpenAI || hasAnthropic;
      if (!hasAiKeys && !showApiKeyPrompt) {
        // Remove the typing indicator
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== "typing"));
        
        // Suggest configuring AI keys for better results
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "To provide the most accurate agent recommendations, I can use AI models like OpenAI or Anthropic. Would you like to configure an API key?",
            timestamp: new Date(),
          },
        ]);
        
        setShowApiKeyPrompt(true);
        setIsProcessing(false);
        return;
      }

      // Process the user's input to create an agent
      const response = await processAgentRequest(userMessage.content);

      // Remove the typing indicator
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== "typing"));

      // Add the real response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      setAgentSuggestion(response.suggestion);
    } catch (error) {
      console.error("Error processing agent request:", error);
      
      // Remove the typing indicator
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== "typing"));
      
      // Add error message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error while creating your agent. Please try again.",
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processAgentRequest = async (userPrompt: string): Promise<{
    message: string;
    suggestion: AgentSuggestion;
  }> => {
    // Check if we have AI providers configured
    const hasOpenAI = isAIProviderConfigured("openai");
    const hasAnthropic = isAIProviderConfigured("anthropic");
    
    // Determine which AI provider to use
    const provider = hasOpenAI ? "openai" : hasAnthropic ? "anthropic" : null;
    
    try {
      // If AI provider is available, use it for tool recommendations
      let recommendedTools: string[] = [];
      let workflowConfig: { name: string; description: string; nodes: any } | null = null;
      
      if (provider) {
        // Get tool recommendations from AI
        recommendedTools = await getToolRecommendations(userPrompt, provider);
        
        // Also generate a workflow for later use
        try {
          workflowConfig = await generateWorkflow(userPrompt, provider);
          
          // Update the workflow context with the generated data
          if (workflowConfig) {
            setWorkflowName(workflowConfig.name);
            setWorkflowDescription(workflowConfig.description);
            setWorkflowNodes(workflowConfig.nodes.nodes);
            setAgentName(workflowConfig.name);
            setAgentDescription(workflowConfig.description);
          }
        } catch (error) {
          console.warn("Failed to generate workflow:", error);
        }
      } else {
        // Fallback to rule-based tools recommendation if no AI provider
        // Extract potential agent name and tools based on keywords
        const keywords = {
          email: ["email", "gmail", "mail", "inbox", "message"],
          slack: ["slack", "channel", "workspace", "notify", "notification"],
          web: ["website", "web", "url", "scrape", "page", "monitor"],
          calendar: ["calendar", "schedule", "event", "appointment", "meeting"],
          openai: ["ai", "gpt", "openai", "generate", "analyze"],
          database: ["database", "sql", "db", "store", "postgresql", "postgres"],
        };
        
        // Determine which tools might be needed based on the prompt
        const toolMatches: Record<string, boolean> = {
          "Gmail API": false,
          "Slack API": false,
          "Web Scraper": false,
          "Calendar API": false,
          "OpenAI API": false,
          "PostgreSQL": false,
        };
        
        const promptLower = userPrompt.toLowerCase();
        
        for (const [category, terms] of Object.entries(keywords)) {
          if (terms.some(term => promptLower.includes(term))) {
            switch (category) {
              case "email":
                toolMatches["Gmail API"] = true;
                break;
              case "slack":
                toolMatches["Slack API"] = true;
                break;
              case "web":
                toolMatches["Web Scraper"] = true;
                break;
              case "calendar":
                toolMatches["Calendar API"] = true;
                break;
              case "openai":
                toolMatches["OpenAI API"] = true;
                break;
              case "database":
                toolMatches["PostgreSQL"] = true;
                break;
            }
          }
        }
        
        // Get the matched tools as an array
        recommendedTools = Object.entries(toolMatches)
          .filter(([_, isMatched]) => isMatched)
          .map(([toolName, _]) => toolName);
        
        // Ensure at least one tool is selected
        if (recommendedTools.length === 0) {
          recommendedTools.push("OpenAI API");
        }
      }
      
      // Generate a name based on the prompt or use the AI-generated one
      let nameGuess = workflowConfig?.name || "Custom Agent";
      if (!workflowConfig) {
        const promptLower = userPrompt.toLowerCase();
        if (promptLower.includes("monitor") || promptLower.includes("track")) {
          nameGuess = promptLower.includes("email") 
            ? "Email Monitor" 
            : promptLower.includes("website") 
              ? "Website Monitor" 
              : "Activity Monitor";
        } else if (promptLower.includes("summarize") || promptLower.includes("summary")) {
          nameGuess = "Content Summarizer";
        } else if (promptLower.includes("notify") || promptLower.includes("alert")) {
          nameGuess = "Alert Agent";
        }
      }
      
      // Prepare the API integrations that need to be set up
      const setupNeeded = recommendedTools.map(tool => ({
        name: tool,
        type: tool === "Gmail API" || tool === "Calendar API" 
          ? "oauth" as const
          : "api_key" as const,
        isConfigured: false
      }));
      
      // Create the suggestion object
      const suggestion: AgentSuggestion = {
        name: nameGuess,
        description: workflowConfig?.description || userPrompt,
        tools: recommendedTools,
        recommendedSetup: setupNeeded
      };
      
      // Prepare the response message
      const toolsList = recommendedTools.map(tool => `• ${tool}`).join("\n");
      const setupList = setupNeeded.map(setup => 
        `[Connect ${setup.name.replace(" API", "")}] (${setup.type === "oauth" ? "OAuth Login" : "API Key"})`
      ).join(" ");
      
      let aiNoteMessage = "";
      if (!provider) {
        aiNoteMessage = "\n\n⚠️ Note: For more accurate recommendations, configure OpenAI or Anthropic API keys in settings.";
      }
      
      const responseMessage = `
✅ I can create an agent to ${userPrompt.toLowerCase()}.

Based on your description, I recommend using these tools:
${toolsList}

⚙️ Required setup:
${setupList}${aiNoteMessage}

Should I create this agent for you?
      `.trim();
      
      return {
        message: responseMessage,
        suggestion
      };
    } catch (error) {
      console.error("Error in processAgentRequest:", error);
      
      // Fallback if anything went wrong
      const suggestion: AgentSuggestion = {
        name: "Custom Agent",
        description: userPrompt,
        tools: ["OpenAI API"],
        recommendedSetup: [{
          name: "OpenAI API",
          type: "api_key",
          isConfigured: false
        }]
      };
      
      return {
        message: `
I can create a basic agent based on your description. 
I'll set it up to use OpenAI for text processing.

⚙️ Required setup:
[Connect OpenAI] (API Key)

Should I create this agent for you?
        `.trim(),
        suggestion
      };
    }
  };

  const handleCreateAgent = async () => {
    if (!agentSuggestion) return;
    
    try {
      setIsProcessing(true);
      
      // Update the workflow context with the agent suggestion data
      setAgentName(agentSuggestion.name);
      setAgentDescription(agentSuggestion.description);
      
      // If no workflow has been created in the context, create one with basic info
      if (!workflowNodes || workflowNodes.length === 0) {
        setWorkflowName(`${agentSuggestion.name} Workflow`);
        setWorkflowDescription(`Workflow for ${agentSuggestion.name}: ${agentSuggestion.description}`);
      }
      
      const newAgent = await createAgent({
        name: agentSuggestion.name,
        description: agentSuggestion.description,
        prompt: agentSuggestion.description,
        tools: agentSuggestion.tools,
      });
      
      setAgentSuggestion(null);
      
      // Add confirmation message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Great! I've created your "${newAgent.name}" agent. You can now see it in your agent dashboard.`,
          timestamp: new Date(),
        },
      ]);
      
      // Invalidate the agents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      
      toast({
        title: "Agent Created",
        description: `Your "${newAgent.name}" agent has been created successfully.`,
      });
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error",
        description: "Failed to create the agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute left-1/4 top-1/4 w-56 h-56 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute right-1/4 bottom-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      {/* API Key Configuration Modal */}
      {showApiKeyPrompt && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md p-4">
            <ApiKeyPrompt
              onKeysConfigured={handleKeysConfigured}
              onSkip={handleSkipKeyConfig}
            />
          </div>
        </div>
      )}
      
      {/* Chat Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-800/50 py-3 px-6 backdrop-blur-md bg-white/60 dark:bg-gray-900/60">
        <h2 className="text-lg font-semibold gradient-text">AI Agent Builder</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Describe what you want your agent to do, and I'll help create it
        </p>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className={`h-9 w-9 ${message.role === "user" ? "ml-3" : "mr-3"} shadow-md ${message.role === "user" ? "" : "ring-2 ring-primary/10"}`}>
                {message.role === "user" ? (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium">
                    U
                  </div>
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-100 to-white dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <span className="text-primary dark:text-primary-300 font-medium">AI</span>
                  </div>
                )}
              </Avatar>
              <div>
                <div
                  className={`
                    rounded-2xl px-4 py-3 shadow-sm
                    ${message.role === "user" 
                      ? "bg-gradient-to-br from-primary to-purple-600 text-white" 
                      : "glass border border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-gray-100"
                    }
                  `}
                >
                  {message.id === "typing" ? (
                    <div className="flex space-x-1.5 py-1">
                      <div className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Agent suggestion action card */}
        {agentSuggestion && (
          <div className="flex justify-start">
            <div className="ml-12 max-w-[85%]">
              <Card className="glass-card p-5 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold gradient-text">
                    {agentSuggestion.name}
                  </h4>
                  <div className="px-2.5 py-1 text-xs font-medium bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800/30">
                    Ready
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm">
                  {agentSuggestion.description.length > 120 
                    ? `${agentSuggestion.description.slice(0, 120)}...` 
                    : agentSuggestion.description}
                </p>
                
                <div className="mb-4">
                  <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-2">
                    Tools
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {agentSuggestion.tools.map((tool, index) => {
                      // Tool color mapping (simplified version)
                      const toolColors: Record<string, string> = {
                        "Gmail": "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30",
                        "Email": "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30",
                        "OpenAI": "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
                        "GPT": "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
                        "Notion": "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700/30",
                        "Slack": "bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30",
                        "Data": "bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/30",
                        "Calendar": "bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30",
                        "Web": "bg-cyan-100/80 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/30",
                        "SQL": "bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30"
                      };
                      
                      // Find matching tool color
                      const toolColor = Object.entries(toolColors).find(([key]) => 
                        tool.includes(key)
                      )?.[1] || "bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30";
                      
                      return (
                        <span
                          key={index}
                          className={`px-2.5 py-1 text-xs font-medium ${toolColor} rounded-full border`}
                        >
                          {tool}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleCreateAgent} 
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      "Create Agent"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 bg-white/50 dark:bg-gray-800/50 dark:border-gray-700"
                    onClick={() => setAgentSuggestion(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="px-4 pb-4 pt-2">
        <form onSubmit={handleSubmit} className="glass-card flex items-center p-1 pl-4 pr-1 space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what you want your AI agent to do..."
            disabled={isProcessing || showApiKeyPrompt}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isProcessing || showApiKeyPrompt || !inputValue.trim()}
            className={`rounded-xl h-10 w-10 ${
              inputValue.trim() 
                ? 'bg-gradient-to-r from-primary to-purple-600 hover:shadow-md transition-all' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}