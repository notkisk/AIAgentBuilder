import { Card, CardContent } from "@/components/ui/card";
import ChatInterface from "@/components/chat/ChatInterface";

export default function Create() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Create AI Agent</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Describe what you want your agent to do in natural language, and we'll create it for you.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  );
}