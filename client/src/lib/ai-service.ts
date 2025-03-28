import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { WorkflowNodes } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Helper function to get API key from environment or local storage
function getAPIKey(provider: AIProvider): string {
  if (provider === "openai") {
    // Check browser environment first
    if (typeof window !== "undefined") {
      // Check window.env (from API key prompt)
      if ((window as any).env?.OPENAI_API_KEY) {
        return (window as any).env.OPENAI_API_KEY;
      }
      
      // Check localStorage
      const storedKey = localStorage.getItem("OPENAI_API_KEY");
      if (storedKey) {
        return storedKey;
      }
    }
    
    // Fall back to env variables
    return import.meta.env.OPENAI_API_KEY || "";
  } else if (provider === "anthropic") {
    // Check browser environment first
    if (typeof window !== "undefined") {
      // Check window.env (from API key prompt)
      if ((window as any).env?.ANTHROPIC_API_KEY) {
        return (window as any).env.ANTHROPIC_API_KEY;
      }
      
      // Check localStorage
      const storedKey = localStorage.getItem("ANTHROPIC_API_KEY");
      if (storedKey) {
        return storedKey;
      }
    }
    
    // Fall back to env variables
    return import.meta.env.ANTHROPIC_API_KEY || "";
  }
  return "";
}

// Initialize clients dynamically when needed
function getOpenAIClient(): OpenAI {
  // The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
  // Do not change this unless explicitly requested by the user
  return new OpenAI({
    apiKey: getAPIKey("openai"),
    dangerouslyAllowBrowser: true,
  });
}

function getAnthropicClient(): Anthropic {
  // The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025.
  // Do not change this unless explicitly requested by the user
  return new Anthropic({
    apiKey: getAPIKey("anthropic"),
    dangerouslyAllowBrowser: true, // Allow usage in the browser
  });
}

// Define AI provider type
export type AIProvider = "openai" | "anthropic";

/**
 * Check if the AI provider is configured with API keys
 */
export function isAIProviderConfigured(provider: AIProvider): boolean {
  if (provider === "openai") {
    // Check multiple sources for API key
    if (import.meta.env.OPENAI_API_KEY) {
      return true;
    }
    
    // Check browser environment
    if (typeof window !== "undefined") {
      // Check window.env (from API key prompt)
      if ((window as any).env?.OPENAI_API_KEY) {
        return true;
      }
      
      // Check localStorage
      const storedKey = localStorage.getItem("OPENAI_API_KEY");
      if (storedKey) {
        return true;
      }
    }
    
    return false;
  } else if (provider === "anthropic") {
    // Check multiple sources for API key
    if (import.meta.env.ANTHROPIC_API_KEY) {
      return true;
    }
    
    // Check browser environment
    if (typeof window !== "undefined") {
      // Check window.env (from API key prompt)
      if ((window as any).env?.ANTHROPIC_API_KEY) {
        return true;
      }
      
      // Check localStorage
      const storedKey = localStorage.getItem("ANTHROPIC_API_KEY");
      if (storedKey) {
        return true;
      }
    }
    
    return false;
  }
  
  return false;
}

/**
 * Generate a workflow from a text prompt
 */
export async function generateWorkflow(
  prompt: string,
  provider: AIProvider = "openai"
): Promise<{
  name: string;
  description: string;
  nodes: WorkflowNodes;
}> {
  try {
    // First try to use the server-side API to generate the workflow
    const response = await apiRequest("POST", "/api/generate-workflow", {
      prompt,
    });

    // Parse the response data
    const data = await response.json();
    return {
      name: data.name,
      description: data.description,
      nodes: data.nodes,
    };
  } catch (error) {
    // If server-side generation fails, fall back to client-side generation
    console.warn("Server-side workflow generation failed, using client-side fallback");
    
    // Prepare the system prompt
    const systemPrompt = `You are an expert workflow generator assistant. 
Your task is to convert user instructions into a workflow configuration.
A workflow consists of connected nodes, where each node represents a tool/function call.
Nodes can pass their outputs to subsequent nodes as inputs.

Each node has:
- id: A unique identifier (string)
- tool: The tool to use (e.g., "webscraper", "chatgpt", "gmail")
- function: The function to call (e.g., "fetchPage", "summarizeText")
- params: Input parameters for the function (object with key-value pairs)
- next: ID of the next node (string, optional - if omitted, this is the final node)

Parameter values can reference outputs from previous nodes using the syntax: $nodeId.output

RESPOND ONLY WITH A VALID JSON OBJECT with this structure:
{
  "name": "Descriptive workflow name",
  "description": "Detailed workflow description",
  "nodes": {
    "nodes": [
      {
        "id": "1",
        "tool": "toolName",
        "function": "functionName",
        "params": { "param1": "value1" },
        "next": "2"
      },
      ...
    ]
  }
}

Available tools and functions:
- webscraper: fetchPage(url), extractText(selector), extractLinks(selector)
- chatgpt: generateText(prompt), summarizeText(text), analyzeText(text)
- anthropic: generateText(prompt), summarizeText(text)
- gmail: sendEmail(to, subject, body), readEmails(filter), getAttachments(emailId)
- google_calendar: createEvent(title, start, end), listEvents(start, end)
- google_sheets: readData(spreadsheetId, range), writeData(spreadsheetId, range, data)
- slack: sendMessage(channel, text), readMessages(channel, count)
- twitter: postTweet(text), searchTweets(query)
- database: query(sql), insert(table, data), update(table, data, condition)
- file_system: readFile(path), writeFile(path, content), listFiles(directory)`;

    // Generate workflow configuration based on the provider
    if (provider === "openai" && isAIProviderConfigured(provider)) {
      const openaiClient = getOpenAIClient();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content || "{}";
      const workflowConfig = JSON.parse(content);
      return {
        name: workflowConfig.name || "Generated Workflow",
        description: workflowConfig.description || `Workflow generated from: ${prompt}`,
        nodes: workflowConfig.nodes || { nodes: [] }
      };
    } else if (provider === "anthropic" && isAIProviderConfigured(provider)) {
      const anthropicClient = getAnthropicClient();
      const message = await anthropicClient.messages.create({
        model: "claude-3-7-sonnet-20250219",
        system: systemPrompt,
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ],
      });

      // Handle different content block types
      let text = "";
      if (message.content && message.content.length > 0) {
        const contentBlock = message.content[0];
        if (contentBlock.type === 'text') {
          text = contentBlock.text;
        }
      }
      
      const workflowConfig = JSON.parse(text || "{}");
      return {
        name: workflowConfig.name || "Generated Workflow",
        description: workflowConfig.description || `Workflow generated from: ${prompt}`,
        nodes: workflowConfig.nodes || { nodes: [] }
      };
    } else {
      throw new Error(`AI provider ${provider} is not configured or not supported`);
    }
  }
}

/**
 * Get available tools and their capabilities from an AI model
 */
export async function getToolRecommendations(
  description: string,
  provider: AIProvider = "openai"
): Promise<string[]> {
  const systemPrompt = `Based on the user's workflow description, recommend the most appropriate tools from this list:
- webscraper
- chatgpt
- anthropic
- gmail
- google_calendar
- google_sheets
- slack
- twitter
- database
- file_system

Respond with a JSON array of tool names only, e.g. ["webscraper", "chatgpt", "gmail"]`;

  try {
    if (provider === "openai" && isAIProviderConfigured(provider)) {
      const openaiClient = getOpenAIClient();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the content safely
      try {
        const content = completion.choices[0].message.content || "[]";
        return JSON.parse(content);
      } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        return ["webscraper", "chatgpt"];
      }
    } else if (provider === "anthropic" && isAIProviderConfigured(provider)) {
      const anthropicClient = getAnthropicClient();
      const message = await anthropicClient.messages.create({
        model: "claude-3-7-sonnet-20250219",
        system: systemPrompt,
        max_tokens: 1000,
        messages: [
          { role: "user", content: description }
        ],
      });

      // Handle different content block types
      let text = "";
      if (message.content && message.content.length > 0) {
        const contentBlock = message.content[0];
        if (contentBlock.type === 'text') {
          text = contentBlock.text;
        }
      }
      
      // Parse the JSON or return default if parsing fails
      try {
        return JSON.parse(text || "[]");
      } catch (error) {
        console.error("Error parsing Anthropic response:", error);
        return ["webscraper", "chatgpt"];
      }
    } else {
      return ["webscraper", "chatgpt"]; // Default fallback if no AI provider is configured
    }
  } catch (error) {
    console.error("Error getting tool recommendations:", error);
    return ["webscraper", "chatgpt"]; // Default fallback on error
  }
}