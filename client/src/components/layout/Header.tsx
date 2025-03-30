import { useApp } from "@/contexts/AppContext";
import { useAgent } from "@/contexts/AgentContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { sidebarOpen, toggleSidebar, currentView } = useApp();
  const { setShowCreateModal } = useAgent();

  // Map current view to header title
  const getHeaderTitle = () => {
    switch (currentView) {
      case "home":
        return "Dashboard";
      case "agents":
        return "My Agents";
      case "tools":
        return "Available Tools";
      case "logs":
        return "Execution Logs";
      case "settings":
        return "Settings";
      case "create":
        return "Create Agent";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="macos-toolbar">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden mr-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">{getHeaderTitle()}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Agent
          </Button>
        </div>
      </div>
    </header>
  );
}
