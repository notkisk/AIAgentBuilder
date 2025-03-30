import React, { useState, useRef, useEffect } from 'react';
import { WorkflowNode } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icons } from '../ui/icons';
import { useNotification } from '@/hooks/useNotification';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatWorkflowInterfaceProps {
  workflowNodes: WorkflowNode[];
  onWorkflowUpdate: (nodes: WorkflowNode[]) => void;
  workflowId?: number; // Optional workflow ID if we're modifying an existing workflow
}

export function ChatWorkflowInterface({
  workflowNodes,
  onWorkflowUpdate,
  workflowId
}: ChatWorkflowInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you build or modify your workflow. Describe the changes you want to make, and I will update the visual workflow for you.'
    }
  ]);
  
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Create a new workflow based on a text prompt
  const createWorkflowFromPrompt = async () => {
    try {
      setIsProcessing(true);
      
      // Add user message to chat
      const userMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: userMessageId, role: 'user', content: prompt }]);
      
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }
      
      const workflow = await response.json();
      
      // Add assistant message explaining the workflow
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've created a workflow based on your request: "${workflow.description}"`
        }
      ]);
      
      // Update the visual workflow
      onWorkflowUpdate(workflow.nodes);
      
    } catch (error) {
      console.error('Error generating workflow:', error);
      showNotification(
        'There was a problem creating your workflow. Please try again.',
        'Error generating workflow',
        { variant: 'destructive' }
      );
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while generating the workflow. Please try again with a different description.'
        }
      ]);
    } finally {
      setPrompt('');
      setIsProcessing(false);
    }
  };
  
  // Modify an existing workflow based on a text prompt
  const modifyWorkflowWithPrompt = async () => {
    try {
      setIsProcessing(true);
      
      // Add user message to chat
      const userMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: userMessageId, role: 'user', content: prompt }]);
      
      const response = await fetch('/api/workflows/modify', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          nodes: workflowNodes,
          workflowId
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to modify workflow');
      }
      
      const result = await response.json();
      
      // Add assistant message explaining the modifications
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've updated the workflow based on your request: "${result.message || 'Workflow updated successfully'}"`
        }
      ]);
      
      // Update the visual workflow with the modified nodes
      onWorkflowUpdate(result.nodes);
      
    } catch (error) {
      console.error('Error modifying workflow:', error);
      showNotification(
        'There was a problem updating your workflow. Please try again.',
        'Error modifying workflow',
        { variant: 'destructive' }
      );
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while modifying the workflow. Please try a different approach or simpler modification.'
        }
      ]);
    } finally {
      setPrompt('');
      setIsProcessing(false);
    }
  };
  
  // Handle submit action depending on whether we're creating or modifying
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    if (workflowNodes.length === 0) {
      // No existing nodes, create a new workflow
      await createWorkflowFromPrompt();
    } else {
      // Modify existing workflow
      await modifyWorkflowWithPrompt();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2">
        <Icons.messageSquare className="h-5 w-5" />
        <h3 className="text-lg font-medium">Workflow Chat</h3>
      </div>
      
      <ScrollArea className="flex-grow p-3">
        <div className="space-y-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar>
                  <Icons.zap className="h-5 w-5" />
                </Avatar>
              )}
              
              <Card 
                className={cn(
                  "p-3 max-w-[80%]",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
              
              {message.role === 'user' && (
                <Avatar>
                  <Icons.user className="h-5 w-5" />
                </Avatar>
              )}
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe workflow changes..."
            className="min-h-[60px] resize-none"
            disabled={isProcessing}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isProcessing || !prompt.trim()}
          >
            {isProcessing ? (
              <Icons.loader className="h-5 w-5 animate-spin" />
            ) : (
              <Icons.arrowRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 flex gap-2 flex-wrap">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setPrompt('Add a new node that sends an email notification')}>
            + Add email node
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setPrompt('Connect node A to node B')}>
            Connect nodes
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setPrompt('Remove the last node')}>
            Remove node
          </Badge>
        </div>
      </form>
    </div>
  );
}