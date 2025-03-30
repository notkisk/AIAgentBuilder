import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAgentSchema, 
  insertLogSchema, 
  insertWorkflowSchema, 
  insertToolSchema,
  insertExecutionSchema,
  WorkflowNodesSchema 
} from "@shared/schema";
import { createModifiedWorkflow, createNewWorkflow } from "./workflowService";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Agents API
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const parsedData = insertAgentSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid agent data" });
      }
      
      const agent = await storage.createAgent(parsedData.data);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const agent = await storage.updateAgent(id, updates);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAgent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Logs API
  app.get("/api/logs", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const executionId = req.query.executionId ? String(req.query.executionId) : undefined;
      const logs = await storage.getLogs(agentId, workflowId, executionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const parsedData = insertLogSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid log data" });
      }
      
      const log = await storage.createLog(parsedData.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to create log" });
    }
  });

  // Workflows API
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(id);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const parsedData = insertWorkflowSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid workflow data", errors: parsedData.error.format() });
      }
      
      // Validate the workflow nodes structure
      const nodesValidation = WorkflowNodesSchema.safeParse(parsedData.data.nodes);
      if (!nodesValidation.success) {
        return res.status(400).json({ message: "Invalid workflow nodes structure", errors: nodesValidation.error.format() });
      }
      
      const workflow = await storage.createWorkflow(parsedData.data);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // If nodes are being updated, validate their structure
      if (updates.nodes) {
        const nodesValidation = WorkflowNodesSchema.safeParse(updates.nodes);
        if (!nodesValidation.success) {
          return res.status(400).json({ message: "Invalid workflow nodes structure", errors: nodesValidation.error.format() });
        }
      }
      
      const workflow = await storage.updateWorkflow(id, updates);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });
  
  // Modify workflow with natural language
  app.post("/api/workflows/:id/modify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Invalid prompt. A string prompt is required." });
      }
      
      const workflow = await storage.getWorkflow(id);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Import the workflow service
      const { createModifiedWorkflow } = require('./workflowService');
      
      // Parse the workflow nodes
      let nodes = [];
      try {
        // Handle different node structures
        if (workflow.nodes && typeof workflow.nodes === 'object') {
          if (Array.isArray(workflow.nodes)) {
            nodes = workflow.nodes;
          } else if (workflow.nodes.nodes && Array.isArray(workflow.nodes.nodes)) {
            nodes = workflow.nodes.nodes;
          }
        }
      } catch (parseError) {
        console.error("Error parsing workflow nodes:", parseError);
        return res.status(400).json({ message: "Invalid workflow nodes" });
      }
      
      // Modify the workflow with the natural language prompt
      const modifiedWorkflow = createModifiedWorkflow(prompt, nodes);
      
      // Update the workflow in storage
      const updatedWorkflow = await storage.updateWorkflow(id, {
        nodes: modifiedWorkflow.nodes,
        description: `${workflow.description} (Modified: ${new Date().toISOString()})`
      });
      
      // Return the modified workflow with the message
      res.json({
        workflow: updatedWorkflow,
        message: modifiedWorkflow.message
      });
    } catch (error) {
      console.error("Error modifying workflow:", error);
      res.status(500).json({ message: "Failed to modify workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkflow(id);
      
      if (!success) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Executions API
  app.get("/api/executions", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const executions = await storage.getExecutions(workflowId, agentId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const executionId = req.params.id;
      const execution = await storage.getExecution(executionId);
      
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution" });
    }
  });

  app.post("/api/executions", async (req, res) => {
    try {
      const parsedData = insertExecutionSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid execution data", errors: parsedData.error.format() });
      }
      
      const execution = await storage.createExecution(parsedData.data);
      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to create execution" });
    }
  });

  app.patch("/api/executions/:id", async (req, res) => {
    try {
      const executionId = req.params.id;
      const updates = req.body;
      
      const execution = await storage.updateExecution(executionId, updates);
      
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update execution" });
    }
  });

  app.post("/api/executions/:id/complete", async (req, res) => {
    try {
      const executionId = req.params.id;
      const { success, results } = req.body;
      
      if (typeof success !== 'boolean') {
        return res.status(400).json({ message: "Success parameter is required and must be a boolean" });
      }
      
      const execution = await storage.completeExecution(executionId, success, results);
      
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete execution" });
    }
  });

  // Agent-Workflow linking endpoint
  app.post("/api/agents/:agentId/link/:workflowId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const workflowId = parseInt(req.params.workflowId);
      
      const agent = await storage.linkAgentWithWorkflow(agentId, workflowId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent or workflow not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to link agent with workflow" });
    }
  });

  // Agent execution endpoint
  app.post("/api/agents/:id/execute", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      if (!agent.workflowId) {
        return res.status(400).json({ message: "Agent has no associated workflow" });
      }
      
      const workflow = await storage.getWorkflow(agent.workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: "Associated workflow not found" });
      }
      
      // Create a new execution
      const execution = await storage.createExecution({
        workflowId: workflow.id,
        agentId: agent.id,
        executionId: `exec_${Date.now()}_${agent.id}_${workflow.id}`,
        status: "pending"
      });
      
      // Update agent status to running
      await storage.updateAgent(agent.id, { status: "running" });
      
      // Start processing the workflow in the background (in a real app, this would be a worker/job)
      setTimeout(() => {
        simulateWorkflowExecution(execution.executionId, workflow, agent);
      }, 100);
      
      res.status(202).json({ 
        message: "Execution started", 
        execution,
        agent
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute agent" });
    }
  });
  
  // Function to simulate workflow execution (for demo purposes only)
  async function simulateWorkflowExecution(executionId: string, workflow: any, agent: any) {
    try {
      // Start execution
      await storage.createLog({
        agentId: agent.id,
        level: "info",
        message: `Starting execution of workflow '${workflow.name}'`,
        workflowId: workflow.id,
        executionId
      });
      
      const nodes = workflow.nodes.nodes;
      
      // Process each node sequentially (simple simulation)
      for (const node of nodes) {
        // Update execution with current node
        await storage.updateExecution(executionId, { 
          status: "running",
          currentNode: node.id 
        });
        
        // Log node execution
        await storage.createLog({
          agentId: agent.id,
          level: "info",
          message: `Executing node ${node.id}: ${node.tool}.${node.function}`,
          workflowId: workflow.id,
          executionId,
          details: { node }
        });
        
        // Simulate processing time (1-3 seconds per node)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      }
      
      // Mark execution as complete
      await storage.completeExecution(executionId, true, { 
        result: "Workflow completed successfully",
        executionTime: `${nodes.length + Math.random() * 2}s`
      });
      
      // Update agent status
      await storage.updateAgent(agent.id, { 
        status: "active",
        lastRun: new Date()
      });
      
      // Add final log
      await storage.createLog({
        agentId: agent.id,
        level: "info",
        message: `Workflow execution completed: ${workflow.name}`,
        workflowId: workflow.id,
        executionId,
        details: { status: "success" }
      });
    } catch (error) {
      console.error("Error in workflow execution simulation:", error);
      
      // Mark execution as failed
      await storage.completeExecution(executionId, false, { 
        error: "Execution failed",
        reason: error.message || "Unknown error"
      });
      
      // Update agent status
      await storage.updateAgent(agent.id, { 
        status: "error",
        lastRun: new Date()
      });
      
      // Add error log
      await storage.createLog({
        agentId: agent.id,
        level: "error",
        message: `Workflow execution failed: ${error.message || "Unknown error"}`,
        workflowId: workflow.id,
        executionId,
        details: { error: error.message || "Unknown error" }
      });
    }
  }

  // Chat-based workflow generation API
  app.post("/api/workflows/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Invalid prompt. A string prompt is required." });
      }
      
      // Generate a new workflow using the service
      const workflowResponse = createNewWorkflow(prompt);
      
      res.json(workflowResponse);
    } catch (error) {
      console.error("Error generating workflow:", error);
      res.status(500).json({ message: "Failed to generate workflow" });
    }
  });
  
  // Chat-based workflow modification API
  app.post("/api/workflows/modify", async (req, res) => {
    try {
      const { prompt, nodes, workflowId } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Invalid prompt. A string prompt is required." });
      }
      
      if (!nodes || !Array.isArray(nodes)) {
        return res.status(400).json({ message: "Invalid nodes. An array of workflow nodes is required." });
      }
      
      // Modify the existing workflow with the service
      const modifiedWorkflow = createModifiedWorkflow(prompt, nodes);
      
      // If a workflowId was provided, update the workflow in storage
      if (workflowId) {
        const updatedWorkflow = await storage.updateWorkflow(workflowId, {
          nodes: modifiedWorkflow.nodes,
          description: `${modifiedWorkflow.description} (Modified: ${new Date().toISOString()})`
        });
        
        if (!updatedWorkflow) {
          return res.status(404).json({ message: "Workflow not found" });
        }
      }
      
      res.json(modifiedWorkflow);
    } catch (error) {
      console.error("Error modifying workflow:", error);
      res.status(500).json({ message: "Failed to modify workflow" });
    }
  });

  // Tools API
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.get("/api/tools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tool = await storage.getTool(id);
      
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tool" });
    }
  });

  app.get("/api/tools/name/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const tool = await storage.getToolByName(name);
      
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tool by name" });
    }
  });

  app.post("/api/tools", async (req, res) => {
    try {
      const parsedData = insertToolSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid tool data", errors: parsedData.error.format() });
      }
      
      const tool = await storage.createTool(parsedData.data);
      res.status(201).json(tool);
    } catch (error) {
      res.status(500).json({ message: "Failed to create tool" });
    }
  });

  app.patch("/api/tools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const tool = await storage.updateTool(id, updates);
      
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  app.delete("/api/tools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTool(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tool not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tool" });
    }
  });

  // AI workflow generator API
  app.post("/api/generate-workflow", async (req, res) => {
    try {
      const { prompt, currentWorkflow } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Invalid prompt. A string prompt is required." });
      }
      
      // Import the workflow service functions
      const { createModifiedWorkflow, createNewWorkflow } = require('./workflowService');
      
      let generatedWorkflow;
      const isModifying = currentWorkflow && currentWorkflow.nodes && Array.isArray(currentWorkflow.nodes) && currentWorkflow.nodes.length > 0;
      
      // Check if we have API keys for OpenAI or Anthropic
      if (process.env.OPENAI_API_KEY) {
        try {
          // Initialize OpenAI client
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
          
          // Prepare the system prompt for workflow generation
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
          
          // Generate workflow with OpenAI
          const completion = await openai.chat.completions.create({
            model: "gpt-4o", // The newest OpenAI model as of May 13, 2024
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          
          const content = completion.choices[0].message.content || "{}";
          const workflowConfig = JSON.parse(content);
          
          generatedWorkflow = {
            name: workflowConfig.name || "Generated Workflow",
            description: workflowConfig.description || `Workflow generated from: ${prompt}`,
            prompt,
            nodes: workflowConfig.nodes || { nodes: [] },
            status: "inactive"
          };
        } catch (aiError) {
          console.error("OpenAI workflow generation error:", aiError);
          // Fall back to our workflow service if AI generation fails
          if (isModifying) {
            generatedWorkflow = createModifiedWorkflow(prompt, currentWorkflow.nodes);
          } else {
            generatedWorkflow = createNewWorkflow(prompt);
          }
        }
      } else if (process.env.ANTHROPIC_API_KEY) {
        try {
          // Initialize Anthropic client
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
          });
          
          // Prepare the system prompt for workflow generation (same as above)
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
          
          // Generate workflow with Anthropic
          const message = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219", // The newest Anthropic model as of February 24, 2025
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
          
          generatedWorkflow = {
            name: workflowConfig.name || "Generated Workflow",
            description: workflowConfig.description || `Workflow generated from: ${prompt}`,
            prompt,
            nodes: workflowConfig.nodes || { nodes: [] },
            status: "inactive"
          };
        } catch (aiError) {
          console.error("Anthropic workflow generation error:", aiError);
          // Fall back to our workflow service if AI generation fails
          if (isModifying) {
            generatedWorkflow = createModifiedWorkflow(prompt, currentWorkflow.nodes);
          } else {
            generatedWorkflow = createNewWorkflow(prompt);
          }
        }
      } else {
        // No AI provider available, use the new workflow service
        if (isModifying) {
          generatedWorkflow = createModifiedWorkflow(prompt, currentWorkflow.nodes);
        } else {
          generatedWorkflow = createNewWorkflow(prompt);
        }
      }
      
      res.json(generatedWorkflow);
    } catch (error) {
      console.error("Workflow generation error:", error);
      res.status(500).json({ message: "Failed to generate workflow" });
    }
  });
  
  // Helper function to create a fallback workflow when no AI provider is available
  function createFallbackWorkflow(prompt: string) {
    // Generate a name based on the prompt
    let nameGuess = "Custom Workflow";
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes("monitor") || promptLower.includes("track")) {
      nameGuess = promptLower.includes("email") 
        ? "Email Monitor" 
        : promptLower.includes("website") 
          ? "Website Monitor" 
          : "Activity Monitor";
    } else if (promptLower.includes("summarize") || promptLower.includes("summary")) {
      nameGuess = "Content Summarizer";
    } else if (promptLower.includes("notify") || promptLower.includes("alert")) {
      nameGuess = "Alert System";
    } else if (promptLower.includes("slack")) {
      nameGuess = "Slack Integration";
    } else if (promptLower.includes("gmail") || promptLower.includes("email")) {
      nameGuess = "Email Processor";
    }
    
    // Determine which tools might be needed based on the prompt
    const toolMatches: Record<string, boolean> = {
      "webscraper": false,
      "chatgpt": false,
      "gmail": false,
      "slack": false,
      "database": false,
    };
    
    // Simple keyword matching for tools
    if (promptLower.includes("website") || promptLower.includes("scrape") || promptLower.includes("url") || promptLower.includes("page")) {
      toolMatches.webscraper = true;
    }
    
    if (promptLower.includes("summarize") || promptLower.includes("analyze") || promptLower.includes("generate")) {
      toolMatches.chatgpt = true;
    }
    
    if (promptLower.includes("email") || promptLower.includes("gmail") || promptLower.includes("mail")) {
      toolMatches.gmail = true;
    }
    
    if (promptLower.includes("slack") || promptLower.includes("channel") || promptLower.includes("message")) {
      toolMatches.slack = true;
    }
    
    if (promptLower.includes("store") || promptLower.includes("database") || promptLower.includes("save")) {
      toolMatches.database = true;
    }
    
    // Ensure at least one tool is used
    if (!Object.values(toolMatches).some(Boolean)) {
      toolMatches.chatgpt = true;
    }
    
    // Construct the workflow nodes based on matched tools
    const nodes: any[] = [];
    let nodeId = 1;
    
    if (toolMatches.webscraper) {
      nodes.push({
        id: String(nodeId),
        tool: "webscraper",
        function: "fetchPage",
        params: { url: "https://example.com" },
        next: String(nodeId + 1)
      });
      nodeId++;
    }
    
    if (toolMatches.chatgpt) {
      // If there's a previous node, use its output as input
      const prevOutput = nodes.length > 0 ? `$${nodes.length}.output` : "Sample text to process";
      
      nodes.push({
        id: String(nodeId),
        tool: "chatgpt",
        function: "summarizeText",
        params: { text: prevOutput },
        next: nodes.length > 0 || toolMatches.gmail || toolMatches.slack ? String(nodeId + 1) : undefined
      });
      nodeId++;
    }
    
    if (toolMatches.gmail) {
      // If there's a previous node, use its output as body
      const prevOutput = nodes.length > 0 ? `$${nodes.length}.output` : "Sample email content";
      
      nodes.push({
        id: String(nodeId),
        tool: "gmail",
        function: "sendEmail",
        params: { 
          to: "user@example.com", 
          subject: `${nameGuess} Result`, 
          body: prevOutput 
        },
        next: toolMatches.slack ? String(nodeId + 1) : undefined
      });
      nodeId++;
    } else if (toolMatches.slack) {
      // If there's a previous node, use its output as message
      const prevOutput = nodes.length > 0 ? `$${nodes.length}.output` : "Sample message content";
      
      nodes.push({
        id: String(nodeId),
        tool: "slack",
        function: "sendMessage",
        params: { 
          channel: "#general", 
          text: prevOutput 
        },
        next: toolMatches.database ? String(nodeId + 1) : undefined
      });
      nodeId++;
    }
    
    if (toolMatches.database && nodes.length > 0) {
      // Store the result from a previous node
      const prevOutput = nodes.length > 0 ? `$${nodes.length}.output` : "Sample data";
      
      nodes.push({
        id: String(nodeId),
        tool: "database",
        function: "insert",
        params: { 
          table: "results", 
          data: { 
            result: prevOutput,
            timestamp: "CURRENT_TIMESTAMP"
          }
        }
      });
    }
    
    return {
      name: nameGuess,
      description: `Workflow generated from prompt: ${prompt}`,
      prompt,
      nodes: {
        nodes: nodes
      },
      status: "inactive"
    };
  }

  const httpServer = createServer(app);

  return httpServer;
}
