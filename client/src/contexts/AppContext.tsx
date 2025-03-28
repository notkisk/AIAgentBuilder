import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

export type CurrentView = "home" | "agents" | "tools" | "logs" | "settings" | "create";

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<CurrentView>("home");
  const [location, navigate] = useLocation();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(storedDarkMode);
    if (storedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Update dark mode in localStorage and document class
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Sync current view with URL
  useEffect(() => {
    if (location === "/") setCurrentView("home");
    else if (location === "/agents") setCurrentView("agents");
    else if (location === "/tools") setCurrentView("tools");
    else if (location === "/logs") setCurrentView("logs");
    else if (location === "/settings") setCurrentView("settings");
    else if (location === "/create") setCurrentView("create");
  }, [location]);

  // Navigate when current view changes
  useEffect(() => {
    const path = 
      currentView === "home" ? "/" :
      `/${currentView}`;
    
    navigate(path);
  }, [currentView, navigate]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        currentView,
        setCurrentView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
