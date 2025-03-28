import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ChatInterface from "@/components/chat/ChatInterface";
import { isAIProviderConfigured } from "@/lib/ai-service";

export default function Create() {
  const [activeTab, setActiveTab] = useState("chat");
  
  // Check if we have AI providers configured
  const hasOpenAI = isAIProviderConfigured("openai");
  const hasAnthropic = isAIProviderConfigured("anthropic");
  const hasAiProvider = hasOpenAI || hasAnthropic;
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Create AI Agent</h2>
          {hasAiProvider && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              AI-Powered 
              {hasOpenAI && hasAnthropic 
                ? " (OpenAI + Anthropic)" 
                : hasOpenAI 
                  ? " (OpenAI)" 
                  : " (Anthropic)"}
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Describe what you want your agent to do in natural language, and we'll create a workflow for you.
        </p>
      </div>

      <Tabs
        defaultValue="chat"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mb-4 w-auto self-start">
          <TabsTrigger value="chat">Chat Builder</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ChatInterface />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
          <Card>
            <CardHeader>
              <CardTitle>Email Monitor</CardTitle>
              <CardDescription>
                Monitor your inbox for important emails and get notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                <p className="font-medium">Example Prompt:</p>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "Create an agent that monitors my Gmail inbox for emails containing the word 'urgent' and sends me a Slack notification when they arrive."
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Gmail API</Badge>
                <Badge>Slack API</Badge>
                <Badge>Text Analysis</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Website Update Tracker</CardTitle>
              <CardDescription>
                Keep track of changes on websites and get summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                <p className="font-medium">Example Prompt:</p>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "I need an agent that checks a website every day for changes, then summarizes the new content and emails it to me."
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Web Scraper</Badge>
                <Badge>OpenAI API</Badge>
                <Badge>Gmail API</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="how-it-works" className="space-y-4 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
          <Card>
            <CardHeader>
              <CardTitle>How AI-Generated Workflows Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">1. Natural Language Description</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start by describing what you want your agent to do in plain English. Be specific about the tools
                  you want to use (Gmail, Slack, OpenAI, etc.) and what actions you want the agent to take.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">2. AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our system uses {hasOpenAI ? "OpenAI" : hasAnthropic ? "Anthropic" : "AI"} to analyze your description and identify the required tools and workflow steps.
                  The AI determines the optimal sequence of operations to achieve your goal.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">3. Workflow Generation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Based on the analysis, a JSON workflow is created that defines each step in the process.
                  Each step specifies a tool, function, and parameters, with proper connections between steps.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">4. Agent Creation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The workflow is converted into an agent that you can run, schedule, and monitor.
                  You can also modify the agent's configuration later if needed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}