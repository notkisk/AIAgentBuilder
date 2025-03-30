import { useApp } from "@/contexts/AppContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Home, 
  MessageSquarePlus, 
  Users, 
  Wrench, 
  ClipboardList, 
  Settings, 
  Sun, 
  Moon, 
  X, 
  User,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { darkMode, toggleDarkMode, sidebarOpen, setSidebarOpen, currentView, setCurrentView } = useApp();

  // Animation variants for the sidebar
  const sidebarVariants = {
    expanded: { width: "16rem" },
    collapsed: { width: "5rem" }
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hover: { scale: 1.02, x: 2 },
    tap: { scale: 0.98 }
  };
  
  return (
    <motion.div
      className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:translate-x-0 md:relative ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } macos-sidebar`}
      initial={false}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      variants={sidebarVariants}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-800">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
              <PlusCircle className="h-5 w-5" />
            </div>
            <motion.h1 
              className="text-base font-medium text-gray-800 dark:text-gray-200"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Agent Builder
            </motion.h1>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<Home className="h-5 w-5" />} 
            label="Home" 
            isActive={currentView === "home"}
            onClick={() => setCurrentView("home")}
            collapsed={!sidebarOpen}
          />
          
          <NavItem 
            icon={<MessageSquarePlus className="h-5 w-5" />} 
            label="Create Agent" 
            isActive={currentView === "create"}
            onClick={() => setCurrentView("create")}
            collapsed={!sidebarOpen}
          />
          
          <NavItem 
            icon={<Users className="h-5 w-5" />} 
            label="My Agents" 
            isActive={currentView === "agents"}
            onClick={() => setCurrentView("agents")}
            collapsed={!sidebarOpen}
          />
          
          <NavItem 
            icon={<Wrench className="h-5 w-5" />} 
            label="Available Tools" 
            isActive={currentView === "tools"}
            onClick={() => setCurrentView("tools")}
            collapsed={!sidebarOpen}
          />
          
          <NavItem 
            icon={<ClipboardList className="h-5 w-5" />} 
            label="Execution Logs" 
            isActive={currentView === "logs"}
            onClick={() => setCurrentView("logs")}
            collapsed={!sidebarOpen}
          />
          
          <NavItem 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            isActive={currentView === "settings"}
            onClick={() => setCurrentView("settings")}
            collapsed={!sidebarOpen}
          />
        </nav>

        {/* User and Theme Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </motion.div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const NavItem = ({ icon, label, isActive, onClick, collapsed }: NavItemProps) => {
  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={collapsed ? {} : { 
        hover: { scale: 1.01, x: 1 },
        tap: { scale: 0.99 }
      }}
      className={cn(
        "flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150",
        isActive 
          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-medium"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/30"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex items-center justify-center",
        collapsed ? "w-full" : "w-auto mr-3",
        isActive ? "text-primary" : "text-gray-600 dark:text-gray-400"
      )}>
        {icon}
      </div>
      
      {!collapsed && (
        <motion.span 
          className="text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
