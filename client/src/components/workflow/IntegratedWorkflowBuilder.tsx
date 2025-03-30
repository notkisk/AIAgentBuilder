import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkflowEditor from './WorkflowEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateWorkflow } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';
import { WorkflowNode } from '@shared/schema';
import { Send, Sparkles, Maximize2, Minimize2, X, MessageSquareText } from 'lucide-react';

// Define the message types
type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface IntegratedWorkflowBuilderProps {
  initialNodes: WorkflowNode[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  availableTools: any[];
}

export default function IntegratedWorkflowBuilder({ 
  initialNodes, 
  onNodesChange, 
  availableTools 
}: IntegratedWorkflowBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get the available providers
      const hasOpenAI = localStorage.getItem("OPENAI_API_KEY") || (window as any).env?.OPENAI_API_KEY;
      const hasAnthropic = localStorage.getItem("ANTHROPIC_API_KEY") || (window as any).env?.ANTHROPIC_API_KEY;
      
      // Use OpenAI as default, fallback to Anthropic if available
      const provider = hasOpenAI ? "openai" : hasAnthropic ? "anthropic" : undefined;
      
      if (!provider) {
        throw new Error("No AI provider configured. Please add an OpenAI or Anthropic API key in the settings.");
      }
      
      // Call AI service to generate or update workflow
      const result = await generateWorkflow(inputValue, initialNodes, provider);
      
      if (result && result.nodes && result.nodes.nodes) {
        // Update the workflow nodes
        onNodesChange(result.nodes.nodes);
        
        // Add assistant message
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `I've updated the workflow based on your request. The workflow now includes ${result.nodes.nodes.length} steps.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: "I couldn't generate a workflow from your description. Please try to be more specific about the tools and actions you need.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "Sorry, I encountered an error while trying to update the workflow. Please check your AI provider settings or try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Workflow generation failed",
        description: "Failed to generate workflow from your description. Please make sure your AI provider is properly configured.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Auto-expand chat on first message
      if (messages.length <= 1) {
        setIsChatExpanded(true);
      }
    }
  };

  // Format timestamp for messages
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Workflow Editor */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          isChatExpanded ? (isMobile ? 'h-[40%]' : 'w-[65%]') : 'h-full w-full'
        }`}
      >
        <WorkflowEditor
          initialNodes={initialNodes}
          onNodesChange={onNodesChange}
          availableTools={availableTools}
        />
      </div>
      
      {/* Chat Interface */}
      <AnimatePresence>
        {isChatExpanded ? (
          <motion.div 
            className={`absolute bg-background/95 backdrop-blur-sm border shadow-lg rounded-lg ${
              isMobile 
                ? 'bottom-0 left-0 right-0 h-[60%]' 
                : 'right-0 top-0 bottom-0 w-[35%]'
            }`}
            initial={{ opacity: 0, [isMobile ? 'y' : 'x']: isMobile ? 100 : -100 }}
            animate={{ opacity: 1, [isMobile ? 'y' : 'x']: 0 }}
            exit={{ opacity: 0, [isMobile ? 'y' : 'x']: isMobile ? 100 : -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full p-3">
              {/* Chat Header */}
              <div className="flex justify-between items-center pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4" />
                  <h3 className="font-medium">AI Assistant</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                    Beta
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsChatExpanded(false)}
                    className="h-8 w-8"
                  >
                    {isMobile ? <Minimize2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Messages */}
              <ScrollArea className="flex-1 py-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mb-4 text-blue-400" />
                    <p className="mb-2 font-medium">AI-Powered Assistance</p>
                    <p className="text-sm max-w-xs">
                      Describe modifications for your workflow and the AI will update it for you.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-2">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex flex-col ${
                          message.role === 'assistant' ? 'items-start' : 'items-end'
                        }`}
                      >
                        <div className="flex items-start gap-2 max-w-[85%]">
                          {message.role === 'assistant' && (
                            <div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
                              <Sparkles className="h-3 w-3" />
                            </div>
                          )}
                          <Card className={`px-3 py-2 rounded-2xl text-sm ${
                            message.role === 'assistant' 
                              ? 'bg-secondary/50 dark:bg-secondary/30' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            <p>{message.content}</p>
                          </Card>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-2">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              {/* Input Form */}
              <form onSubmit={handleSubmit} className="mt-2">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Describe changes to your workflow..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="pr-10 py-6"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="absolute bottom-4 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setIsChatExpanded(true)}
              size="lg"
              className="rounded-full shadow-lg px-4 gap-2"
            >
              <MessageSquareText className="h-4 w-4" />
              <span>Chat with AI</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}