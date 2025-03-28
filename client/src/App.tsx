import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AppProvider } from "./contexts/AppContext";
import { AgentProvider } from "./contexts/AgentContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Home from "./pages/Home";
import Agents from "./pages/Agents";
import Tools from "./pages/Tools";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import CreateAgentModal from "./components/modals/CreateAgentModal";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/agents" component={Agents} />
            <Route path="/tools" component={Tools} />
            <Route path="/logs" component={Logs} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
          <CreateAgentModal />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AgentProvider>
          <Router />
          <Toaster />
        </AgentProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
