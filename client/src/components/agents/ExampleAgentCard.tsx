import { Button } from "@/components/ui/button";
import { useAgent } from "@/contexts/AgentContext";

interface ExampleAgentCardProps {
  name: string;
  description: string;
  tools: string[];
}

export default function ExampleAgentCard({ name, description, tools }: ExampleAgentCardProps) {
  const { setShowCreateModal } = useAgent();
  
  const handleCreateSimilar = () => {
    // TODO: Pre-populate the create modal with this example
    setShowCreateModal(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-3">{name}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        "{description}"
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tools.map((tool, index) => {
          let bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
          
          if (tool.includes("Gmail") || tool.includes("Email")) {
            bgColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
          } else if (tool.includes("OpenAI") || tool.includes("GPT")) {
            bgColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
          } else if (tool.includes("Notion")) {
            bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
          } else if (tool.includes("Telegram")) {
            bgColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
          } else if (tool.includes("Data")) {
            bgColor = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
          }
          
          return (
            <span
              key={index}
              className={`px-2.5 py-0.5 text-xs font-medium ${bgColor} rounded-full`}
            >
              {tool}
            </span>
          );
        })}
      </div>
      <Button
        onClick={handleCreateSimilar}
        variant="link"
        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center text-sm p-0"
      >
        <span>Create similar agent</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </Button>
    </div>
  );
}
