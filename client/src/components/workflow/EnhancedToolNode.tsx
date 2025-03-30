import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getToolColor } from '@/lib/agent-tools';
import { Icons } from '../ui/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

interface ToolNodeData {
  label: string;
  tool: string; 
  function: string;
  params: Record<string, any>;
  outputs?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  description?: string;
}

// Map tool names to icons
const toolIcons: Record<string, keyof typeof Icons> = {
  'trigger': 'play',
  'chatgpt': 'zap',
  'anthropic': 'bot',
  'gmail': 'messageSquare',
  'slack': 'messageSquare',
  'webscraper': 'eye',
  'database': 'database',
  'google_sheets': 'fileText',
  'google_calendar': 'fileText',
  'twitter': 'share',
  'file_system': 'fileText',
  'input': 'plus',
  'output': 'arrowRight',
  'text': 'fileText'
};

function getNodeDescription(data: ToolNodeData): string {
  // Based on the tool type, provide a more specific description
  switch (data.tool) {
    case 'chatgpt':
      return `Uses OpenAI GPT to ${data.function === 'generateText' 
        ? 'generate content based on a prompt' 
        : data.function === 'summarizeText' 
          ? 'summarize the input text' 
          : 'analyze text'}`;
    case 'anthropic':
      return 'Uses Anthropic Claude to process natural language inputs';
    case 'gmail':
      return `${data.function === 'sendEmail' 
        ? 'Sends an email through Gmail' 
        : data.function === 'readEmails' 
          ? 'Retrieves emails from Gmail inbox' 
          : 'Gets attachments from emails'}`;
    case 'slack':
      return `${data.function === 'sendMessage' 
        ? 'Sends a message to a Slack channel' 
        : 'Retrieves messages from a Slack channel'}`;
    case 'webscraper':
      return `${data.function === 'fetchPage' 
        ? 'Fetches content from a web page' 
        : data.function === 'extractText' 
          ? 'Extracts text from a web page' 
          : 'Extracts links from a web page'}`;
    case 'database':
      return `${data.function === 'query' 
        ? 'Runs a database query' 
        : data.function === 'insert' 
          ? 'Inserts data into the database' 
          : 'Updates data in the database'}`;
    case 'trigger':
      return 'Initiates the workflow according to a schedule or event';
    case 'input':
      return 'Collects input data to start the workflow';
    case 'output':
      return 'Displays or exports the workflow results';
    default:
      return `${data.tool}.${data.function}`;
  }
}

// Function to truncate objects for display
function truncateValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
  }
  if (typeof value === 'object') {
    return '{...}'; // Just indicate it's an object
  }
  return String(value);
}

const EnhancedToolNode = memo(({ id, data, selected }: NodeProps<ToolNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toolColor = getToolColor(data.tool);
  const bgColor = toolColor?.bg || 'bg-gray-100';
  const textColor = toolColor?.text || 'text-gray-800';
  const darkBgColor = toolColor?.darkBg || 'dark:bg-gray-800';
  const darkTextColor = toolColor?.darkText || 'dark:text-gray-200';
  
  const hasParams = Object.keys(data.params || {}).length > 0;
  const hasOutputs = data.outputs && Object.keys(data.outputs).length > 0;
  
  const icon = toolIcons[data.tool] || 'cpu';
  const description = data.description || getNodeDescription(data);
  
  // Status indicator styles
  const statusStyles = {
    idle: 'bg-gray-200 dark:bg-gray-700',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };
  
  return (
    <div
      className={cn(
        "group relative transition-all duration-200",
        selected ? "scale-105 shadow-xl" : "shadow-md",
        "hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      {/* Source handle (outgoing) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "w-3 h-3 rounded-full bg-primary border-primary", 
          "transition-all duration-300",
          "hover:scale-150 hover:bg-primary/70"
        )}
        style={{ bottom: -6, zIndex: 1 }}
      />
      
      {/* Target handle (incoming) */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "w-3 h-3 rounded-full bg-primary/60 border-primary/60", 
          "transition-all duration-300",
          "hover:scale-150 hover:bg-primary"
        )}
        style={{ top: -6, zIndex: 1 }}
      />
      
      <Card className={cn(
        "backdrop-blur-lg border-2 overflow-hidden transition-colors",
        selected ? "border-primary" : "border-transparent hover:border-primary/50",
        bgColor, textColor, darkBgColor, darkTextColor
      )}>
        {/* Status indicator */}
        {data.status && (
          <div className="absolute top-0 right-0 mt-2 mr-2">
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                statusStyles[data.status]
              )}
              title={`Status: ${data.status}`}
            />
          </div>
        )}
        
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="bg-background/80 dark:bg-background/20 p-1.5 rounded-md">
                {React.createElement(Icons[icon], { className: 'h-4 w-4' })}
              </div>
              <span className="font-semibold">{data.label || `${data.tool}`}</span>
            </div>
            
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {data.function}
            </Badge>
          </div>
          
          <p className="text-xs opacity-80 mt-1 mb-2">{description}</p>
          
          {(hasParams || hasOutputs) && (
            <Accordion 
              type="single" 
              collapsible 
              defaultValue={isExpanded ? "parameters" : undefined}
              onValueChange={value => setIsExpanded(!!value)}
              className="bg-background/20 dark:bg-background/10 rounded-md"
            >
              {hasParams && (
                <AccordionItem value="parameters" className="border-none">
                  <AccordionTrigger className="px-3 py-1.5 text-xs font-medium hover:no-underline">
                    Parameters
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2 pt-0">
                    <div className="space-y-1">
                      {Object.entries(data.params || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="font-medium opacity-80">{key}:</span>
                          <span className="opacity-70 max-w-[65%] truncate" title={String(value)}>
                            {truncateValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {hasOutputs && (
                <AccordionItem value="outputs" className="border-none">
                  <AccordionTrigger className="px-3 py-1.5 text-xs font-medium hover:no-underline">
                    Outputs
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2 pt-0">
                    <div className="space-y-1">
                      {Object.entries(data.outputs || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="font-medium opacity-80">{key}:</span>
                          <span className="opacity-70 max-w-[65%] truncate" title={String(value)}>
                            {truncateValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      </Card>
      
      {/* Node Actions */}
      <div 
        className={cn(
          "absolute -top-2 -right-2 flex gap-1 opacity-0 transition-opacity",
          "group-hover:opacity-100",
          selected ? "opacity-100" : ""
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-md">
                <Icons.edit className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Node</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-md">
                <Icons.copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full shadow-md">
                <Icons.trash className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Node</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});

EnhancedToolNode.displayName = 'EnhancedToolNode';

export default EnhancedToolNode;