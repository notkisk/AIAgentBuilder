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
    hover: { scale: 1.05, x: 5 },
    tap: { scale: 0.95 }
  };

  // Glassmorphism style for the sidebar
  const glassmorphismStyle = darkMode 
    ? "bg-gray-900/90 backdrop-blur-md border-r border-gray-800/50" 
    : "bg-white/90 backdrop-blur-md border-r border-gray-200/50";
  
  return (
    <motion.div
      className={`fixed inset-y-0 left-0 z-50 shadow-xl transform transition-all duration-300 ease-in-out md:translate-x-0 md:relative ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${glassmorphismStyle}`}
      initial={false}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      variants={sidebarVariants}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100/20 dark:border-gray-700/20">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white">
              <PlusCircle className="h-6 w-6" />
            </div>
            <motion.h1 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
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
        <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
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
        <div className="p-4 border-t border-gray-100/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">User</p>
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
        hover: { scale: 1.03, x: 3 },
        tap: { scale: 0.97 }
      }}
      className={cn(
        "flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex items-center justify-center",
        collapsed ? "w-full" : "w-auto mr-3",
        isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
      )}>
        {icon}
      </div>
      
      {!collapsed && (
        <motion.span 
          className="text-sm font-medium"
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
