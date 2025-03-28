import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAgentSchema, 
  insertLogSchema, 
  insertWorkflowSchema, 
  insertToolSchema, 
  WorkflowNodesSchema 
} from "@shared/schema";

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
      const logs = await storage.getLogs(agentId);
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
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Invalid prompt. A string prompt is required." });
      }
      
      // This will be implemented later with the actual AI workflow generator
      // For now, return a sample workflow structure
      
      const generatedWorkflow = {
        name: "Generated Workflow",
        description: `Workflow generated from prompt: ${prompt}`,
        prompt,
        nodes: {
          nodes: [
            {
              id: "1",
              tool: "webscraper",
              function: "fetchPage",
              params: { url: "https://example.com" },
              next: "2"
            },
            {
              id: "2",
              tool: "chatgpt",
              function: "summarizeText",
              params: { text: "$1.output" },
              next: "3"
            },
            {
              id: "3",
              tool: "gmail",
              function: "sendEmail",
              params: { 
                to: "user@example.com", 
                subject: "Website Summary", 
                body: "$2.output" 
              }
            }
          ]
        },
        status: "inactive"
      };
      
      res.json(generatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate workflow" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
