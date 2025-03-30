import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Code, Sparkles } from 'lucide-react';
import { getToolColor } from '@/lib/agent-tools';
import type { WorkflowNode } from '@shared/schema';

interface NodeExplanationTooltipProps {
  node: {
    id: string;
    tool: string;
    function: string;
    params: Record<string, any>;
  };
  isOpen: boolean;
  onClose: () => void;
  previousNodeInfo?: {
    id: string;
    function: string;
  } | null;
  nextNodeInfo?: {
    id: string;
    function: string;
  } | null;
}

interface ExplanationState {
  loading: boolean;
  error: string | null;
  explanation: {
    general: string;
    parameters: Record<string, string>;
    impact: string;
    example: string;
  } | null;
}

export function NodeExplanationTooltip({
  node,
  isOpen,
  onClose,
  previousNodeInfo,
  nextNodeInfo
}: NodeExplanationTooltipProps) {
  const [explanation, setExplanation] = useState<ExplanationState>({
    loading: true,
    error: null,
    explanation: null
  });

  // Fetch explanation from AI when modal opens
  useEffect(() => {
    if (isOpen) {
      generateExplanation();
    }
  }, [isOpen, node]);

  // Generate explanation using AI service
  const generateExplanation = async () => {
    setExplanation({
      loading: true,
      error: null,
      explanation: null
    });

    try {
      // Import the AI service function
      const { generateNodeExplanation } = await import('@/lib/ai-service');
      
      // Call the AI service to get the explanation
      const explanationData = await generateNodeExplanation(
        node,
        previousNodeInfo,
        nextNodeInfo
      );

      // Update state with the explanation
      setExplanation({
        loading: false,
        error: null,
        explanation: explanationData
      });
    } catch (error) {
      console.error("Error generating explanation:", error);
      setExplanation({
        loading: false,
        error: "Failed to generate explanation. Please try again.",
        explanation: null
      });
    }
  };

  const toolColor = getToolColor(node.tool) || {
    bg: '#f9fafb',
    text: '#111827',
    darkBg: '#1f2937',
    darkText: '#f9fafb',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-8 h-8 flex items-center justify-center rounded-md"
              style={{
                backgroundColor: toolColor.bg,
                color: toolColor.text,
              }}
            >
              <Info className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">
              {node.function}
              <Badge 
                variant="outline" 
                className="ml-2 capitalize" 
                style={{
                  backgroundColor: `${toolColor.bg}20`,
                  borderColor: `${toolColor.bg}50`,
                  color: toolColor.text
                }}
              >
                {node.tool}
              </Badge>
            </DialogTitle>
          </div>
          <DialogDescription>
            Node ID: {node.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {explanation.loading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : explanation.error ? (
            <div className="p-4 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {explanation.error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateExplanation} 
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-medium">Description</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">
                    {explanation.explanation?.general}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-medium">Parameters</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    {explanation.explanation && Object.entries(explanation.explanation.parameters).map(([param, desc]) => (
                      <div key={param} className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-200">{param}:</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-medium">Workflow Impact</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">
                    {explanation.explanation?.impact}
                  </p>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h3 className="text-xs font-medium mb-1">Example</h3>
                  <code className="text-xs block whitespace-pre-wrap">
                    {explanation.explanation?.example}
                  </code>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}