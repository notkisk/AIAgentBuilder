import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAgent } from "@/contexts/AgentContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createAgent } = useAgent();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    // Simple client-side processing for now
    // In a real implementation, this would call the backend which uses OpenAI/Anthropic
    
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
    const matchedTools = Object.entries(toolMatches)
      .filter(([_, isMatched]) => isMatched)
      .map(([toolName, _]) => toolName);
    
    // Ensure at least one tool is selected
    if (matchedTools.length === 0) {
      matchedTools.push("OpenAI API");
    }
    
    // Generate a name based on the prompt
    let nameGuess = "";
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
    } else {
      nameGuess = "Custom Agent";
    }
    
    // Prepare the API integrations that need to be set up
    const setupNeeded = matchedTools.map(tool => ({
      name: tool,
      type: tool === "Gmail API" || tool === "Calendar API" 
        ? "oauth" as const
        : "api_key" as const,
      isConfigured: false
    }));
    
    // Create the suggestion object
    const suggestion: AgentSuggestion = {
      name: nameGuess,
      description: userPrompt,
      tools: matchedTools,
      recommendedSetup: setupNeeded
    };
    
    // Prepare the response message
    const toolsList = matchedTools.map(tool => `• ${tool}`).join("\n");
    const setupList = setupNeeded.map(setup => 
      `[Connect ${setup.name.replace(" API", "")}] (${setup.type === "oauth" ? "OAuth Login" : "API Key"})`
    ).join(" ");
    
    const responseMessage = `
✅ I can create an agent to ${userPrompt.toLowerCase()}.

Based on your description, I recommend using these tools:
${toolsList}

⚙️ Required setup:
${setupList}

Should I create this agent for you?
    `.trim();
    
    return {
      message: responseMessage,
      suggestion
    };
  };

  const handleCreateAgent = async () => {
    if (!agentSuggestion) return;
    
    try {
      setIsProcessing(true);
      
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
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className={`h-8 w-8 ${message.role === "user" ? "ml-2" : "mr-2"}`}>
                {message.role === "user" ? (
                  <div className="h-full w-full rounded-full bg-primary-500 flex items-center justify-center text-white">
                    U
                  </div>
                ) : (
                  <div className="h-full w-full rounded-full bg-primary-100 dark:bg-gray-700 flex items-center justify-center text-primary-600 dark:text-primary-300">
                    AI
                  </div>
                )}
              </Avatar>
              <div>
                <div
                  className={`${
                    message.role === "user"
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  } rounded-lg p-3`}
                >
                  {message.id === "typing" ? (
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Agent suggestion action card */}
        {agentSuggestion && (
          <div className="flex justify-start">
            <div className="ml-10 max-w-[80%]">
              <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-primary-100 dark:border-gray-700">
                <h4 className="font-medium mb-2">Create "{agentSuggestion.name}" Agent?</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {agentSuggestion.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateAgent} disabled={isProcessing}>
                    {isProcessing ? "Creating..." : "Create Agent"}
                  </Button>
                  <Button variant="outline" onClick={() => setAgentSuggestion(null)}>
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your AI agent..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button type="submit" disabled={isProcessing || !inputValue.trim()}>
            {isProcessing ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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