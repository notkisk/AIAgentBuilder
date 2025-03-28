import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAgent } from "@/contexts/AgentContext";
import { examplePrompts } from "@/lib/agent-tools";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().min(10, "Please provide a more detailed description"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAgentModal() {
  const { showCreateModal, setShowCreateModal, createAgent } = useAgent();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      prompt: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createAgent({
        name: data.name,
        description: data.prompt.length > 100 ? `${data.prompt.substring(0, 97)}...` : data.prompt,
        prompt: data.prompt,
        tools: inferTools(data.prompt),
      });
    } catch (error) {
      console.error("Failed to create agent:", error);
    }
  };

  // Simple function to infer tools based on prompt keywords
  const inferTools = (prompt: string) => {
    const toolMatches = {
      "Web Scraper": ["website", "web", "scrape", "monitor", "url", "link", "page", "site"],
      "Gmail API": ["email", "gmail", "mail", "inbox"],
      "OpenAI API": ["summarize", "summary", "analyze", "generate", "ai", "gpt", "openai"],
      "Notion API": ["notion", "note", "document", "page"],
      "Telegram API": ["telegram", "message", "notify", "notification", "notify"],
      "Slack API": ["slack", "channel", "message", "notify"],
      "Data Processor": ["data", "process", "transform", "filter", "analyze"],
      "PostgreSQL": ["database", "sql", "postgresql", "postgres", "db", "store", "data"],
    };

    const promptLower = prompt.toLowerCase();
    const matchedTools = [];

    for (const [tool, keywords] of Object.entries(toolMatches)) {
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        matchedTools.push(tool);
      }
    }

    // Ensure we have at least 1 tool
    if (matchedTools.length === 0) {
      matchedTools.push("Data Processor");
    }

    return matchedTools;
  };

  const useExamplePrompt = (example: typeof examplePrompts[0]) => {
    setValue("name", example.name);
    setValue("prompt", example.description);
  };

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Create New AI Agent</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Describe what you want your agent to do in natural language, and we'll create it for you.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="agent_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name (Optional)
                </label>
                <Input
                  id="agent_name"
                  placeholder="My New Agent"
                  {...register("name")}
                  className="w-full"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="agent_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What should your agent do?
                </label>
                <Textarea
                  id="agent_description"
                  rows={4}
                  placeholder="Monitor a website for price changes and notify me on Telegram when prices drop."
                  {...register("prompt")}
                  className="w-full"
                />
                {errors.prompt && (
                  <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Example prompts:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {examplePrompts.map((example, index) => (
                    <li key={index} className="flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <button
                        type="button"
                        onClick={() => useExamplePrompt(example)}
                        className="text-left hover:text-primary-600 focus:outline-none"
                      >
                        "{example.description}"
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Agent</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
