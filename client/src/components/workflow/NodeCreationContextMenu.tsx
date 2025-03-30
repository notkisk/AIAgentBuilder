import React, { useState, useRef, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Icons } from '../ui/icons';
import { cn } from '@/lib/utils';

interface NodeCategory {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  color: string;
  darkColor: string;
}

interface NodeType {
  id: string;
  name: string;
  description: string;
  category: string;
  function: string;
  params: Record<string, any>;
  icon?: keyof typeof Icons;
}

interface NodeCreationContextMenuProps {
  position: { x: number; y: number } | null;
  onSelectNode: (nodeType: NodeType) => void;
  onClose: () => void;
  sourceNodeId?: string; // Optional ID of the source node (when connecting)
}

// Node categories with color scheme
const nodeCategories: NodeCategory[] = [
  { 
    id: 'input', 
    label: 'Input', 
    icon: 'plus', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    darkColor: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
  },
  { 
    id: 'processing', 
    label: 'Processing', 
    icon: 'cpu', 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    darkColor: 'dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
  },
  { 
    id: 'ai', 
    label: 'AI', 
    icon: 'zap', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    darkColor: 'dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
  },
  { 
    id: 'communication', 
    label: 'Communication', 
    icon: 'messageSquare', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' 
  },
  { 
    id: 'data', 
    label: 'Data', 
    icon: 'database', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    darkColor: 'dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' 
  },
  { 
    id: 'output', 
    label: 'Output', 
    icon: 'arrowRight', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
    darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' 
  },
];

// Available node types grouped by category
const nodeTypes: NodeType[] = [
  // Input category
  {
    id: 'text-input',
    name: 'Text Input',
    description: 'Get text input from the user',
    category: 'input',
    function: 'getText',
    params: { prompt: 'Enter text' }
  },
  {
    id: 'file-input',
    name: 'File Input',
    description: 'Upload a file as input',
    category: 'input',
    function: 'getFile',
    params: { prompt: 'Upload a file' }
  },
  {
    id: 'trigger',
    name: 'Schedule Trigger',
    description: 'Trigger workflow on a schedule',
    category: 'input',
    function: 'schedule',
    params: { schedule: '0 9 * * *' }
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Trigger workflow from external source',
    category: 'input',
    function: 'webhook',
    params: { path: '/webhooks/incoming' }
  },
  
  // Processing category
  {
    id: 'text-processor',
    name: 'Text Processor',
    description: 'Process text with operations like trim, uppercase, etc.',
    category: 'processing',
    function: 'transform',
    params: { operation: 'uppercase' }
  },
  {
    id: 'json-transform',
    name: 'JSON Transform',
    description: 'Parse, filter, or transform JSON data',
    category: 'processing',
    function: 'transformJson',
    params: { path: 'data.results', operation: 'extract' }
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Run custom code to process data',
    category: 'processing',
    function: 'runCode',
    params: { language: 'javascript', code: 'return input.toUpperCase();' }
  },
  
  // AI category
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Generate text with ChatGPT',
    category: 'ai',
    function: 'generateText',
    params: { prompt: 'Generate a summary' }
  },
  {
    id: 'chatgpt-analyze',
    name: 'ChatGPT Analyzer',
    description: 'Analyze text with ChatGPT',
    category: 'ai',
    function: 'analyzeText',
    params: { text: '' }
  },
  {
    id: 'chatgpt-summarize',
    name: 'ChatGPT Summarizer',
    description: 'Summarize text with ChatGPT',
    category: 'ai',
    function: 'summarizeText',
    params: { text: '' }
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Generate text with Anthropic Claude',
    category: 'ai',
    function: 'generateText',
    params: { prompt: 'Generate a response' }
  },
  
  // Communication category
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send an email via Gmail',
    category: 'communication',
    function: 'sendEmail',
    params: { to: 'user@example.com', subject: 'Workflow Notification', body: 'This is an automated notification' }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send message to Slack channel',
    category: 'communication',
    function: 'sendMessage',
    params: { channel: 'general', text: 'Workflow notification' }
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Send an SMS notification',
    category: 'communication',
    function: 'sendSms',
    params: { to: '+1234567890', message: 'Workflow notification' }
  },
  
  // Data category
  {
    id: 'database',
    name: 'Database',
    description: 'Query or insert data into database',
    category: 'data',
    function: 'query',
    params: { sql: 'SELECT * FROM data' }
  },
  {
    id: 'webscraper',
    name: 'Web Scraper',
    description: 'Scrape data from a website',
    category: 'data',
    function: 'fetchPage',
    params: { url: 'https://example.com' }
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read or write to Google Sheets',
    category: 'data',
    function: 'readData',
    params: { spreadsheetId: '', range: 'A1:D10' }
  },
  
  // Output category
  {
    id: 'display',
    name: 'Display',
    description: 'Display results to the user',
    category: 'output',
    function: 'displayText',
    params: { text: '' }
  },
  {
    id: 'file-output',
    name: 'File Output',
    description: 'Save results to a file',
    category: 'output',
    function: 'saveFile',
    params: { filename: 'output.txt', content: '' }
  },
  {
    id: 'webhook-output',
    name: 'Webhook Output',
    description: 'Send results to an external webhook',
    category: 'output',
    function: 'sendWebhook',
    params: { url: 'https://example.com/webhook', payload: '' }
  }
];

export function NodeCreationContextMenu({ position, onSelectNode, onClose, sourceNodeId }: NodeCreationContextMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>('input');
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Filter node types by active category
  const filteredNodeTypes = nodeTypes.filter(node => node.category === activeCategory);
  
  // Get the color for the active category
  const activeCategoryColor = nodeCategories.find(cat => cat.id === activeCategory)?.color || '';
  const activeCategoryDarkColor = nodeCategories.find(cat => cat.id === activeCategory)?.darkColor || '';
  
  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Close with escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  if (!position) return null;
  
  // Position menu - ensure it stays within viewport
  const menuStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000,
    minWidth: isMobile ? '300px' : '320px',
    maxWidth: isMobile ? '90vw' : '320px',
    transform: 'translate(-50%, -10px)'
  } as React.CSSProperties;
  
  return (
    <div 
      ref={menuRef} 
      style={menuStyle}
      className="animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <Card className="overflow-hidden border shadow-md backdrop-blur-sm bg-background/95">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.plus className="h-4 w-4" />
            <h3 className="text-sm font-medium">Add Node</h3>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6">
            <Icons.x className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
          <div className="p-1">
            <ScrollArea className="w-full max-w-full pb-1">
              <TabsList className="w-max">
                {nodeCategories.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex items-center gap-1 px-3"
                  >
                    {React.createElement(Icons[category.icon], { className: 'h-3.5 w-3.5' })}
                    <span>{category.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          {nodeCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="p-0 m-0">
              <ScrollArea className="h-[320px] p-3">
                <div className="space-y-2">
                  {nodeTypes
                    .filter(node => node.category === category.id)
                    .map(nodeType => (
                      <div
                        key={nodeType.id}
                        className={cn(
                          "p-3 rounded-md border cursor-pointer transition-all",
                          "hover:border-primary/50",
                          category.color,
                          category.darkColor
                        )}
                        onClick={() => {
                          onSelectNode(nodeType);
                          onClose();
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium">{nodeType.name}</div>
                          {nodeType.icon && (
                            <div className="bg-background dark:bg-background/20 p-1 rounded-full">
                              {React.createElement(Icons[nodeType.icon], { className: 'h-3.5 w-3.5' })}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{nodeType.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0 h-4">
                            {nodeType.function}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        
        {sourceNodeId && (
          <div className="p-2 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Connecting from:</span> Node {sourceNodeId}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}