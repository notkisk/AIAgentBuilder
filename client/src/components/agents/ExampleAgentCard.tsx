import { Button } from "@/components/ui/button";
import { useAgent } from "@/contexts/AgentContext";
import { useApp } from "@/contexts/AppContext";
import { PlusCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExampleAgentCardProps {
  name: string;
  description: string;
  tools: string[];
  className?: string;
}

export default function ExampleAgentCard({ name, description, tools, className }: ExampleAgentCardProps) {
  const { setShowCreateModal } = useAgent();
  const { setCurrentView } = useApp();
  
  const handleCreateSimilar = () => {
    // TODO: Pre-populate the create modal with this example
    setShowCreateModal(true);
  };

  const handleChatBuilder = () => {
    // Navigate to chat interface with pre-populated prompt
    setCurrentView("create");
    // Could store the example in localStorage or context to pre-populate
  };

  return (
    <div className={cn(
      "relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-2xl shadow-md p-6 h-full",
      "border border-gray-200/50 dark:border-gray-800/50",
      "hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300",
      className
    )}>
      {/* Gradient decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-700">
            {name}
          </h3>
          
          <div className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Example
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tools.map((tool, index) => {
            // Tool color mapping
            const toolColors: Record<string, string> = {
              "Gmail": "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30",
              "Email": "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30",
              "OpenAI": "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
              "GPT": "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
              "Notion": "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700/30",
              "Telegram": "bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30",
              "Data": "bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/30",
              "Calendar": "bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30",
              "Weather": "bg-cyan-100/80 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/30",
              "News": "bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30"
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
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCreateSimilar}
            size="sm"
            variant="outline"
            className="rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 flex items-center gap-1.5 text-sm"
          >
            <PlusCircle className="h-4 w-4" /> 
            Node builder
          </Button>
          
          <Button
            onClick={handleChatBuilder}
            size="sm"
            variant="ghost"
            className="rounded-lg text-primary/80 hover:text-primary flex items-center gap-1.5 text-sm"
          >
            Chat builder
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
