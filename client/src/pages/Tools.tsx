import ToolCard from "@/components/tools/ToolCard";
import { toolsList } from "@/lib/agent-tools";

export default function Tools() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Available Tools & Integrations</h2>
        <p className="text-gray-600 dark:text-gray-300">
          These tools can be automatically connected to your AI agents based on your requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsList.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
