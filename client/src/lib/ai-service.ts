import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { WorkflowNodes, WorkflowNode } from "@shared/schema";
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
 * Generate a workflow from a text prompt or modify an existing workflow
 */
export async function generateWorkflow(
  prompt: string,
  existingNodes?: WorkflowNode[], // Optional existing nodes for modification
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
      existingNodes
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
    
    // Determine if we're creating a new workflow or modifying an existing one
    const isModification = existingNodes && existingNodes.length > 0;
    
    // Prepare the system prompt - different for creation vs modification
    let systemPrompt = "";
    
    if (isModification) {
      systemPrompt = `You are an expert workflow modifier assistant.
Your task is to modify an existing workflow based on user instructions.
The user will provide modification instructions and you'll update the existing workflow accordingly.

Each node has:
- id: A unique identifier (string)
- tool: The tool to use (e.g., "webscraper", "chatgpt", "gmail")
- function: The function to call (e.g., "fetchPage", "summarizeText")
- params: Input parameters for the function (object with key-value pairs)
- next: ID of the next node (string, optional - if omitted, this is the final node)

Parameter values can reference outputs from previous nodes using the syntax: $nodeId.output

EXISTING WORKFLOW:
${JSON.stringify(existingNodes, null, 2)}

RESPOND ONLY WITH A VALID JSON OBJECT with the updated workflow:
{
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
    } else {
      systemPrompt = `You are an expert workflow generator assistant. 
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
    }

    // Generate workflow configuration based on the provider
    if (provider === "openai" && isAIProviderConfigured("openai")) {
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
      
      if (isModification) {
        // For modifications, return minimal structure with just the updated nodes
        return {
          name: "Modified Workflow",
          description: `Workflow modified based on: ${prompt}`,
          nodes: workflowConfig.nodes || { nodes: existingNodes || [] }
        };
      } else {
        // For new workflows, return the complete structure
        return {
          name: workflowConfig.name || "Generated Workflow",
          description: workflowConfig.description || `Workflow generated from: ${prompt}`,
          nodes: workflowConfig.nodes || { nodes: [] }
        };
      }
    } else if (provider === "anthropic" && isAIProviderConfigured("anthropic")) {
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
      
      if (isModification) {
        // For modifications, return minimal structure with just the updated nodes
        return {
          name: "Modified Workflow",
          description: `Workflow modified based on: ${prompt}`,
          nodes: workflowConfig.nodes || { nodes: existingNodes || [] }
        };
      } else {
        // For new workflows, return the complete structure
        return {
          name: workflowConfig.name || "Generated Workflow",
          description: workflowConfig.description || `Workflow generated from: ${prompt}`,
          nodes: workflowConfig.nodes || { nodes: [] }
        };
      }
    } else {
      // Check which providers are configured
      const openAIConfigured = isAIProviderConfigured("openai");
      const anthropicConfigured = isAIProviderConfigured("anthropic");
      
      // Try an alternative provider if available
      if (provider === "openai" && anthropicConfigured) {
        return generateWorkflow(prompt, existingNodes, "anthropic");
      } else if (provider === "anthropic" && openAIConfigured) {
        return generateWorkflow(prompt, existingNodes, "openai");
      }
      
      throw new Error(`No AI provider is configured. Please configure OpenAI or Anthropic API keys.`);
    }
  }
}

/**
 * Generate an explanation for a workflow node
 */
export async function generateNodeExplanation(
  nodeData: {
    id: string;
    tool: string;
    function: string;
    params: Record<string, any>;
  },
  previousNodeInfo?: { id: string; function: string } | null,
  nextNodeInfo?: { id: string; function: string } | null,
  provider: AIProvider = "openai"
): Promise<{
  general: string;
  parameters: Record<string, string>;
  impact: string;
  example: string;
}> {
  // Define mock explanations for fallback when no AI provider is available
  const fallbackExplanations: Record<string, Record<string, any>> = {
    webscraper: {
      fetchPage: {
        general: "This node retrieves content from a web page. It accesses the URL provided in the parameters and returns the full HTML content.",
        parameters: {
          url: "The website URL from which to fetch content. This should be a valid URL starting with http:// or https://."
        },
        impact: "This is typically an initial step in a workflow that requires web data. The output HTML can then be processed by subsequent nodes.",
        example: "fetchPage('https://example.com') → Returns the full HTML from example.com"
      },
      extractText: {
        general: "This node extracts specific text from HTML content using CSS selectors. It can target specific elements on a page.",
        parameters: {
          selector: "A CSS selector string that identifies which HTML elements to extract. For example, '.article-content' or 'h1'."
        },
        impact: "This helps filter out just the content you need from a web page, ignoring navigation, ads, and other elements.",
        example: "extractText('.main-content') → Returns text from elements with class 'main-content'"
      }
    },
    chatgpt: {
      generateText: {
        general: "This node uses AI to generate new text based on a prompt. It can create various types of content based on instructions.",
        parameters: {
          prompt: "Instructions for the AI about what kind of text to generate."
        },
        impact: "This creates new content that can be used in subsequent workflow steps or final outputs.",
        example: "generateText('Write a product description for an eco-friendly water bottle') → Returns AI-generated product description"
      },
      summarizeText: {
        general: "This node uses AI to generate a concise summary of input text. It's useful for condensing large amounts of content.",
        parameters: {
          text: "The input text to be summarized. This can be content from a previous node, like web content from a webscraper node."
        },
        impact: "This transforms long or complex content into digestible summaries.",
        example: "summarizeText(longTextContent) → Returns a concise summary of the text"
      }
    }
  };

  // Create a default explanation if no specific one is found
  const createDefaultExplanation = () => {
    return {
      general: `This node uses the ${nodeData.tool} tool to perform the ${nodeData.function} operation. It processes inputs and produces outputs that can be used by other nodes.`,
      parameters: Object.fromEntries(
        Object.entries(nodeData.params).map(([key, value]) => [
          key,
          `Parameter for the ${nodeData.function} operation. ${
            typeof value === 'string' && value.startsWith('$')
              ? `This uses output from another node (${value.split('.')[0].substring(1)}).`
              : 'This affects how the operation is performed.'
          }`
        ])
      ),
      impact: "This node contributes to the workflow by processing data and preparing it for subsequent steps.",
      example: `${nodeData.function}(${Object.keys(nodeData.params).map(k => `${k}: [value]`).join(', ')}) → Returns processed result`
    };
  };

  try {
    // First try to use the server-side API to generate the explanation
    try {
      const response = await apiRequest("POST", "/api/generate-node-explanation", {
        nodeData,
        previousNodeInfo,
        nextNodeInfo
      });

      // Parse the response data
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("Server-side node explanation generation failed, using client-side fallback");
    }

    // Client-side AI generation
    if (isAIProviderConfigured(provider)) {
      const systemPrompt = `You are an expert workflow node explanation assistant.
Your task is to explain the purpose, parameters, and impact of a workflow node in a clear, concise way.

The node information is as follows:
- Tool: ${nodeData.tool}
- Function: ${nodeData.function}
- Parameters: ${JSON.stringify(nodeData.params)}
${previousNodeInfo ? `- Previous node: ${previousNodeInfo.id} (${previousNodeInfo.function})` : ''}
${nextNodeInfo ? `- Next node: ${nextNodeInfo.id} (${nextNodeInfo.function})` : ''}

Respond with a JSON object containing:
{
  "general": "A clear explanation of what this node does",
  "parameters": {
    "paramName1": "What this parameter controls and how it affects the node",
    "paramName2": "What this parameter controls and how it affects the node"
  },
  "impact": "How this node influences the overall workflow, including its connection to previous and next nodes if applicable",
  "example": "A simple code-like example showing how this function works with sample values"
}

Keep your explanation concise, accurate, and helpful for someone who might not understand the technical details.`;

      if (provider === "openai") {
        const openaiClient = getOpenAIClient();
        const completion = await openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: `Please explain the node: ${nodeData.tool}.${nodeData.function} with parameters ${JSON.stringify(nodeData.params)}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || "{}";
        return JSON.parse(content);
      } else if (provider === "anthropic") {
        const anthropicClient = getAnthropicClient();
        const message = await anthropicClient.messages.create({
          model: "claude-3-7-sonnet-20250219",
          system: systemPrompt,
          max_tokens: 2000,
          messages: [
            { 
              role: "user", 
              content: `Please explain the node: ${nodeData.tool}.${nodeData.function} with parameters ${JSON.stringify(nodeData.params)}`
            }
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
        
        return JSON.parse(text || "{}");
      }
    }

    // Check for a tool-specific explanation in our fallback database
    if (fallbackExplanations[nodeData.tool]?.[nodeData.function]) {
      return fallbackExplanations[nodeData.tool][nodeData.function];
    }
    
    // Return a default explanation
    return createDefaultExplanation();
  } catch (error) {
    console.error("Error generating node explanation:", error);
    
    // Check for a tool-specific explanation in our fallback database
    if (fallbackExplanations[nodeData.tool]?.[nodeData.function]) {
      return fallbackExplanations[nodeData.tool][nodeData.function];
    }
    
    // Return a default explanation
    return createDefaultExplanation();
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