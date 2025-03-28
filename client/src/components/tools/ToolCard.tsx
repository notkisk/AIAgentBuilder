import { Tool } from "@/lib/agent-tools";

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className={`w-12 h-12 ${tool.color.bg} ${tool.color.darkBg} rounded-lg flex items-center justify-center ${tool.color.text} ${tool.color.darkText} mb-4`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d={tool.icon} />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {tool.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {tool.capabilities.map((capability, index) => (
          <span
            key={index}
            className={`px-2.5 py-0.5 text-xs font-medium ${tool.color.bg} ${tool.color.text} ${tool.color.darkBg} ${tool.color.darkText} rounded-full`}
          >
            {capability}
          </span>
        ))}
      </div>
    </div>
  );
}
