import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { WorkflowNode } from '@shared/schema';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useNotification } from '@/hooks/useNotification';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  workflowId?: number;
  workflowNodes: WorkflowNode[];
  onWorkflowUpdate: (updatedNodes: WorkflowNode[]) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function ChatAssistant({
  workflowId,
  workflowNodes,
  onWorkflowUpdate,
  expanded,
  onToggleExpand
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: 'Hello! I\'m your workflow assistant. How can I help you with your workflow today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate unique ID for messages
  const generateId = () => {
    return Date.now().toString() + Math.random().toString().slice(2, 8);
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context with current workflow state
      const workflowContext = {
        nodes: workflowNodes,
        workflowId
      };

      // Call API to get AI response
      const response = await apiRequest(
        'POST',
        `/api/assistant/chat`,
        {
          message: input,
          workflowContext
        }
      );

      const responseData = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseData.message || "I couldn't process your request.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If workflow was updated, notify parent component
      if (responseData.updatedWorkflow) {
        onWorkflowUpdate(responseData.updatedWorkflow.nodes);
        showNotification(
          'Workflow Updated',
          'The workflow has been updated based on your request.',
          { variant: 'success' }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'I\'m sorry, I encountered an error while processing your request. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      showNotification(
        'Error',
        'Failed to communicate with the assistant',
        { variant: 'destructive' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full border-l transition-all duration-300",
        expanded ? "w-full" : "w-full"
      )}
    >
      <div className="border-b p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icons.messageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Assistant</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleExpand}
          className="h-8 w-8 p-0"
        >
          {expanded ? (
            <Icons.minimize2 className="h-4 w-4" />
          ) : (
            <Icons.maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex flex-col max-w-[80%] rounded-lg p-3", 
                message.role === 'user' 
                  ? "ml-auto bg-primary text-primary-foreground" 
                  : message.role === 'assistant'
                    ? "bg-muted" 
                    : "bg-muted/50 text-muted-foreground italic text-sm mx-auto"
              )}
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1 self-end">
                {message.role !== 'system' && new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[40px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={isLoading}
          className="h-10 w-10 p-0"
        >
          {isLoading ? (
            <Icons.loader className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}