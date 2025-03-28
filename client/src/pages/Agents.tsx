import { useAgent } from "@/contexts/AgentContext";
import AgentCard from "@/components/agents/AgentCard";
import { Button } from "@/components/ui/button";

export default function Agents() {
  const { agents, isLoading, setShowCreateModal } = useAgent();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your AI Agents</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your created agents and monitor their activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your agents...</p>
          </div>
        ) : agents.length > 0 ? (
          agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create your first AI agent and start automating your workflows.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Agent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
