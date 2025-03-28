import { format } from "date-fns";
import { Agent, Log } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/contexts/AgentContext";
import { useQuery } from "@tanstack/react-query";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const { updateAgentStatus } = useAgent();

  // Fetch agent logs
  const { data: logs = [] } = useQuery({
    queryKey: ["/api/logs", agent.id],
    queryFn: async () => {
      const res = await fetch(`/api/logs?agentId=${agent.id}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "Never";
    return format(new Date(dateString), "MMM d, h:mm a");
  };

  const toggleAgentStatus = async () => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    await updateAgentStatus(agent.id, newStatus);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center mb-1">
              <h3 className="text-xl font-semibold mr-3">{agent.name}</h3>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  agent.status === "active" ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              <span
                className={`text-xs font-medium ml-1.5 capitalize ${
                  agent.status === "active" ? "text-green-500" : "text-gray-400"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{agent.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={toggleAgentStatus}
              variant={agent.status === "active" ? "outline" : "default"}
              size="sm"
            >
              {agent.status === "active" ? "Pause" : "Activate"}
            </Button>
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {agent.tools.map((tool, index) => (
            <span
              key={index}
              className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
            >
              {tool}
            </span>
          ))}
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Last run: {formatDate(agent.lastRun)}</span>
        </div>
      </div>

      {/* Logs Panel */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 px-6">
        <h4 className="font-medium text-sm mb-2">Recent Execution Logs</h4>
        <div className="space-y-2 text-sm">
          {logs.slice(0, 3).map((log: Log, index: number) => (
            <div key={index} className="flex">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mr-2">
                {format(new Date(log.timestamp), "HH:mm:ss")}
              </span>
              <span
                className={
                  log.level === "error"
                    ? "text-red-500"
                    : "text-gray-700 dark:text-gray-300"
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 italic">No logs available</div>
          )}
        </div>
      </div>
    </div>
  );
}
