import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getToolColor } from '@/lib/agent-tools';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Trash2,
  ChevronDown,
  ChevronUp,
  Code,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { NodeExplanationTooltip } from './NodeExplanationTooltip';

type NodeParams = Record<string, string | number | boolean | null>;

interface ToolNodeData {
  id: string;
  tool: string;
  function: string;
  params: NodeParams;
  onDeleteNode?: (id: string) => void;
  onConfigureNode?: (id: string) => void;
  isConfiguring?: boolean;
  availableInputs?: {
    nodeId: string;
    function: string;
    label: string;
  }[];
}

interface ToolIconData {
  icon: React.ReactNode;
  label: string;
}

const getToolIcon = (toolName: string): ToolIconData => {
  // Map of tool names to visual icons or formatted names
  const toolIcons: Record<string, ToolIconData> = {
    'webscraper': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 10L21 3M10 14L3 21M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Web'
    },
    'chatgpt': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.3901 11.6C21.6646 10.8 21.8018 10 21.8018 9.2C21.8018 5.4 18.6967 2 14.5953 2C12.2018 2 10.1329 3.2 8.79948 4.9C8.25246 4.8 7.84313 4.7 7.29611 4.7C3.46434 4.7 0.5 8 0.5 12C0.5 16 3.46434 19.3 7.29611 19.3C7.84313 19.3 8.25246 19.2 8.66179 19.1C10.1329 20.8 12.2018 22 14.5953 22C18.6967 22 21.8018 18.6 21.8018 14.8C21.8018 14 21.6646 13.2 21.3901 12.4" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 8.5C14.5 8.5 13 10.5 12 10.5C11 10.5 9.5 8.5 9.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'AI'
    },
    'gmail': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6M22 6L12 13L2 6" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Mail'
    },
    'slack': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.5 10C13.67 10 13 9.33 13 8.5V3.5C13 2.67 13.67 2 14.5 2C15.33 2 16 2.67 16 3.5V8.5C16 9.33 15.33 10 14.5 10Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.5 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.5 14C10.33 14 11 14.67 11 15.5V20.5C11 21.33 10.33 22 9.5 22C8.67 22 8 21.33 8 20.5V15.5C8 14.67 8.67 14 9.5 14Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 15.5H3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9.5C10 8.67 9.33 8 8.5 8H3.5C2.67 8 2 8.67 2 9.5C2 10.33 2.67 11 3.5 11H8.5C9.33 11 10 10.33 10 9.5Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 8V3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14.5C14 13.67 14.67 13 15.5 13H20.5C21.33 13 22 13.67 22 14.5C22 15.33 21.33 16 20.5 16H15.5C14.67 16 14 15.33 14 14.5Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.5 16V20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Slack'
    },
    'database': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 5C21 6.65685 16.9706 8 12 8C7.02944 8 3 6.65685 3 5M21 5C21 3.34315 16.9706 2 12 2C7.02944 2 3 3.34315 3 5M21 5V19C21 20.66 17 22 12 22C7 22 3 20.66 3 19V5M21 12C21 13.66 17 15 12 15C7 15 3 13.66 3 12" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'DB'
    },
    'api': { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 17H13L6 17C4.89543 17 4 16.1046 4 15V9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V15C20 16.1046 19.1046 17 18 17" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17V20M12 20H15M12 20H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16M16 12L13 9M16 12L13 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'API'
    },
    'calendar': {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V6M16 2V6M3 10H21M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Calendar'
    },
    'openai': {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.55879 14.2396C9.55879 15.0406 8.90759 15.6918 8.10655 15.6918C7.30551 15.6918 6.65431 15.0406 6.65431 14.2396C6.65431 13.4385 7.30551 12.7873 8.10655 12.7873C8.90759 12.7873 9.55879 13.4385 9.55879 14.2396Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.8924 14.2396C15.8924 15.0406 15.2412 15.6918 14.4402 15.6918C13.6392 15.6918 12.988 15.0406 12.988 14.2396C12.988 13.4385 13.6392 12.7873 14.4402 12.7873C15.2412 12.7873 15.8924 13.4385 15.8924 14.2396Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.55879 9.33473C9.55879 10.1358 8.90759 10.7869 8.10655 10.7869C7.30551 10.7869 6.65431 10.1358 6.65431 9.33473C6.65431 8.53368 7.30551 7.88248 8.10655 7.88248C8.90759 7.88248 9.55879 8.53368 9.55879 9.33473Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.8924 9.33473C15.8924 10.1358 15.2412 10.7869 14.4402 10.7869C13.6392 10.7869 12.988 10.1358 12.988 9.33473C12.988 8.53368 13.6392 7.88248 14.4402 7.88248C15.2412 7.88248 15.8924 8.53368 15.8924 9.33473Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.32493 11.8276L14.2212 7.88281" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.32422 7.88281L14.2205 11.8276" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'OpenAI'
    }
  };
  
  // Default icon if no match is found
  const defaultIcon: ToolIconData = { 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 14.5C10.5 14.5 10.5 11.5 14 11.5C17.5 11.5 17.5 9 17.5 9M10.5 14.5C10.5 17.5 13 17.5 13.5 17.5C15.2386 17.5 16 16.5 16 16.5M10.5 14.5L7 14.5M14 11.5L17.5 9M14 11.5L13.5 7.5M17.5 9C17.5 7.5 16.5 6.25 15 6C13.5 5.75 13.5 6.5 13.5 7.5M13.5 7.5L14.5 5" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: toolName.substring(0, 4)
  };
  
  return toolIcons[toolName.toLowerCase()] || defaultIcon;
};

// Custom node component for tool nodes with enhanced UI
const EnhancedToolNode = ({ data, selected, id }: NodeProps<ToolNodeData>) => {
  const [expanded, setExpanded] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'warning' | 'error'>('none');
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Extract data
  const tool = data.tool;
  const fn = data.function;
  const params = data.params;
  const isConfiguring = data.isConfiguring;
  const onConfigureNode = data.onConfigureNode;
  const onDeleteNode = data.onDeleteNode;
  
  // Get color scheme for the tool
  const toolColor = getToolColor(tool) || {
    bg: '#f9fafb',
    text: '#111827',
    darkBg: '#1f2937',
    darkText: '#f9fafb',
  };
  
  // Get tool icon and label
  const toolIconData = getToolIcon(tool);
  
  // Validate parameters
  useEffect(() => {
    // For demo purposes: 
    // - Empty params show as warnings
    // - Params with "error" string are errors
    // - Otherwise valid
    
    const paramValues = Object.values(params);
    
    if (paramValues.some(v => typeof v === 'string' && v.toLowerCase().includes('error'))) {
      setValidationStatus('error');
    } else if (paramValues.some(v => v === '' || v === null)) {
      setValidationStatus('warning');
    } else {
      setValidationStatus('valid');
    }
  }, [params]);
  
  // Get validation icon
  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: selected 
          ? '0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
      transition={{ duration: 0.2 }}
      className={`relative px-1 py-2 rounded-lg border ${selected ? 'ring-2 ring-primary' : ''} overflow-hidden`}
      style={{
        width: 220,
        backgroundColor: `${toolColor.bg}05`, // Very light background
        borderColor: `${toolColor.bg}50`,
        color: toolColor.text,
      }}
    >
      {/* Glass effect overlay */}
      <div 
        className="absolute inset-0 z-0 backdrop-blur-sm"
        style={{
          backgroundColor: `${toolColor.bg}08`,
          borderRadius: '0.5rem',
        }}
      />
      
      {/* Input handle with tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle
              type="target"
              position={Position.Top}
              id="in"
              className="w-4 h-4 -mt-0.5 rounded-full bg-sky-400 border-2 border-white hover:bg-sky-600 transition-colors cursor-crosshair dark:border-gray-800"
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Input Connection</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Output handle with tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle
              type="source"
              position={Position.Bottom}
              id="out"
              className="w-4 h-4 -mb-0.5 rounded-full bg-emerald-400 border-2 border-white hover:bg-emerald-600 transition-colors cursor-crosshair dark:border-gray-800"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Output Connection</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Node content */}
      <div className="relative z-10 flex flex-col space-y-1">
        {/* Header section with tool icon and function name */}
        <div className="flex items-center px-3 py-1">
          <div 
            className="w-10 h-10 flex items-center justify-center rounded-md mr-3 shadow-sm"
            style={{
              backgroundColor: toolColor.bg,
              color: toolColor.text,
            }}
            title={`Tool: ${tool}`}
          >
            {toolIconData.icon}
          </div>
          
          <div className="flex-1 truncate">
            <div className="flex items-center">
              <h3 className="text-sm font-bold truncate">{fn}</h3>
              {getValidationIcon()}
            </div>
            <p className="text-xs opacity-70 truncate capitalize">{tool}</p>
          </div>

          {/* Help/Info button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="ml-1 p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExplanation(true);
                  }}
                >
                  <HelpCircle size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Node Explanation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Delete button - only visible when not read-only */}
          {onDeleteNode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="ml-1 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Remove Node</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Configure button */}
          {onConfigureNode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="ml-1 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigureNode(id);
                    }}
                  >
                    <Settings size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Configure Node</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Expandable parameters section */}
        <div className="px-3">
          <button 
            className="w-full flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="font-medium">Parameters</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs space-y-1.5 mt-1 bg-black/5 dark:bg-white/5 p-2 rounded-md"
            >
              {Object.entries(params).length > 0 ? (
                Object.entries(params).map(([key, value], index) => (
                  <div key={index} className="flex flex-col">
                    <span className="font-medium text-[10px] uppercase tracking-wide opacity-70">{key}</span>
                    <Badge 
                      variant="outline" 
                      className="mt-0.5 py-0.5 px-1 h-auto text-left justify-start font-normal"
                      style={{
                        backgroundColor: `${toolColor.bg}10`,
                        borderColor: `${toolColor.bg}30`,
                      }}
                    >
                      {typeof value === 'string' 
                        ? value.startsWith('$') 
                          ? (
                            <div className="text-primary font-medium flex items-center text-[10px]" title={`Input from node ${value.split('.')[0].substring(1)}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Node {value.split('.')[0].substring(1)}
                            </div>
                          )
                          : value === '' ? <span className="italic opacity-50">Empty</span> : value
                        : JSON.stringify(value)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="italic opacity-50">No parameters</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Explanation dialog */}
      {showExplanation && (
        <NodeExplanationTooltip
          node={{
            id,
            tool,
            function: fn,
            params,
          }}
          isOpen={showExplanation}
          onClose={() => setShowExplanation(false)}
          previousNodeInfo={null}
          nextNodeInfo={null}
        />
      )}
    </motion.div>
  );
};

export default EnhancedToolNode;