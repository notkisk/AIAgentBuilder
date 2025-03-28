import { 
  users, 
  type User, 
  type InsertUser, 
  agents, 
  type Agent, 
  type InsertAgent,
  logs,
  type Log,
  type InsertLog,
  workflows,
  type Workflow,
  type InsertWorkflow,
  tools,
  type Tool,
  type InsertTool,
  executions,
  type Execution,
  type InsertExecution,
  type WorkflowNodes
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  linkAgentWithWorkflow(agentId: number, workflowId: number): Promise<Agent | undefined>;
  
  // Log methods
  getLogs(agentId?: number, workflowId?: number, executionId?: string): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Workflow methods
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Execution methods
  getExecutions(workflowId?: number, agentId?: number): Promise<Execution[]>;
  getExecution(executionId: string): Promise<Execution | undefined>;
  createExecution(execution: InsertExecution): Promise<Execution>;
  updateExecution(executionId: string, updates: Partial<Execution>): Promise<Execution | undefined>;
  completeExecution(executionId: string, success: boolean, results?: any): Promise<Execution | undefined>;
  
  // Tool methods
  getTools(): Promise<Tool[]>;
  getTool(id: number): Promise<Tool | undefined>;
  getToolByName(name: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: number, updates: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentStore: Map<number, Agent>;
  private logStore: Map<number, Log>;
  private workflowStore: Map<number, Workflow>;
  private toolStore: Map<number, Tool>;
  private executionStore: Map<string, Execution>;
  userCurrentId: number;
  agentCurrentId: number;
  logCurrentId: number;
  workflowCurrentId: number;
  toolCurrentId: number;
  executionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.agentStore = new Map();
    this.logStore = new Map();
    this.workflowStore = new Map();
    this.toolStore = new Map();
    this.executionStore = new Map();
    this.userCurrentId = 1;
    this.agentCurrentId = 1;
    this.logCurrentId = 1;
    this.workflowCurrentId = 1;
    this.toolCurrentId = 1;
    this.executionCurrentId = 1;
    
    // Add some example agents
    this.createAgent({
      name: "Price Monitor",
      description: "Monitors Amazon product prices and sends Telegram notifications",
      prompt: "Monitor a website for price changes and notify me on Telegram.",
      tools: ["Web Scraper", "Telegram API", "Data Processor"],
      status: "active"
    });
    
    this.createAgent({
      name: "Email Summarizer",
      description: "Summarizes daily emails and saves them to Notion",
      prompt: "Summarize my daily emails and store them in Notion.",
      tools: ["Gmail API", "OpenAI API", "Notion API"],
      status: "inactive"
    });
    
    // Add some example logs
    this.createLog({
      agentId: 1,
      level: "info",
      message: "Starting price check for Amazon products"
    });
    
    this.createLog({
      agentId: 1,
      level: "info",
      message: "Successfully scraped 5 product prices"
    });
    
    this.createLog({
      agentId: 1,
      level: "info",
      message: "Price change detected for Product ID #1242"
    });
    
    this.createLog({
      agentId: 1,
      level: "info",
      message: "Notification sent to Telegram"
    });
    
    this.createLog({
      agentId: 2,
      level: "info",
      message: "Starting email processing"
    });
    
    this.createLog({
      agentId: 2,
      level: "info",
      message: "Retrieved 24 emails from Gmail"
    });
    
    this.createLog({
      agentId: 2,
      level: "info",
      message: "Generated summaries using OpenAI"
    });
    
    this.createLog({
      agentId: 2,
      level: "info",
      message: "Saved summaries to Notion database"
    });
    
    // Initialize tools
    this.initializeTools();
    
    // Add example workflow
    const workflow = this.createWorkflow({
      name: "Email to Slack Summary",
      description: "Summarizes important emails and sends them to Slack",
      prompt: "When I receive an email from my boss, summarize it and send it to Slack.",
      nodes: {
        nodes: [
          {
            id: "1",
            tool: "gmail",
            function: "readEmails",
            params: { filters: "from:boss" },
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
            tool: "slack",
            function: "sendMessage",
            params: { channel: "general", message: "$2.output" }
          }
        ]
      },
      status: "active"
    });
    
    // Link first agent with the workflow
    this.linkAgentWithWorkflow(1, workflow.id);
  }
  
  private initializeTools() {
    // Gmail Tool
    this.createTool({
      name: "gmail",
      type: "api",
      description: "Gmail API for reading and sending emails",
      icon: "mail",
      functions: [
        {
          name: "readEmails",
          description: "Reads emails based on filters",
          parameters: {
            filters: { type: "string", description: "Filter string (e.g., from:example@gmail.com)" }
          },
          returns: { type: "array", description: "Array of email objects" }
        },
        {
          name: "sendEmail",
          description: "Sends an email",
          parameters: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body content" }
          },
          returns: { type: "object", description: "Sent email details" }
        },
        {
          name: "deleteEmail",
          description: "Deletes an email",
          parameters: {
            emailId: { type: "string", description: "ID of the email to delete" }
          },
          returns: { type: "boolean", description: "Success status" }
        },
        {
          name: "markAsRead",
          description: "Marks an email as read",
          parameters: {
            emailId: { type: "string", description: "ID of the email to mark as read" }
          },
          returns: { type: "boolean", description: "Success status" }
        },
        {
          name: "extractAttachments",
          description: "Extracts attachments from an email",
          parameters: {
            emailId: { type: "string", description: "ID of the email to extract attachments from" }
          },
          returns: { type: "array", description: "Array of attachment objects" }
        }
      ],
      auth: {
        type: "oauth",
        required: true,
        scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]
      }
    });
    
    // Slack Tool
    this.createTool({
      name: "slack",
      type: "api",
      description: "Slack API for messaging and channel management",
      icon: "message-circle",
      functions: [
        {
          name: "sendMessage",
          description: "Sends a message to a Slack channel",
          parameters: {
            channel: { type: "string", description: "Channel name or ID" },
            message: { type: "string", description: "Message content" }
          },
          returns: { type: "object", description: "Sent message details" }
        },
        {
          name: "createChannel",
          description: "Creates a new Slack channel",
          parameters: {
            name: { type: "string", description: "Channel name" },
            isPrivate: { type: "boolean", description: "Whether the channel is private" }
          },
          returns: { type: "object", description: "New channel details" }
        },
        {
          name: "addUserToChannel",
          description: "Adds a user to a channel",
          parameters: {
            channel: { type: "string", description: "Channel name or ID" },
            user: { type: "string", description: "User ID or email" }
          },
          returns: { type: "boolean", description: "Success status" }
        },
        {
          name: "fetchMessages",
          description: "Fetches messages from a Slack channel",
          parameters: {
            channel: { type: "string", description: "Channel name or ID" },
            limit: { type: "number", description: "Maximum number of messages to fetch" }
          },
          returns: { type: "array", description: "Array of message objects" }
        }
      ],
      auth: {
        type: "token",
        required: true
      }
    });
    
    // ChatGPT Tool
    this.createTool({
      name: "chatgpt",
      type: "api",
      description: "OpenAI GPT API for text generation and processing",
      icon: "brain",
      functions: [
        {
          name: "generateResponse",
          description: "Generates a response based on a prompt",
          parameters: {
            prompt: { type: "string", description: "Input prompt" },
            options: { type: "object", description: "Optional parameters like temperature, max_tokens, etc." }
          },
          returns: { type: "string", description: "Generated text" }
        },
        {
          name: "summarizeText",
          description: "Summarizes long text",
          parameters: {
            text: { type: "string", description: "Input text to summarize" }
          },
          returns: { type: "string", description: "Summarized text" }
        },
        {
          name: "extractKeywords",
          description: "Extracts important keywords from text",
          parameters: {
            text: { type: "string", description: "Input text for keyword extraction" }
          },
          returns: { type: "array", description: "Array of extracted keywords" }
        }
      ],
      auth: {
        type: "apiKey",
        required: true
      }
    });
    
    // Web Scraper Tool
    this.createTool({
      name: "webscraper",
      type: "function",
      description: "Web scraping tool for extracting data from websites",
      icon: "globe",
      functions: [
        {
          name: "fetchPage",
          description: "Fetches raw HTML content from a webpage",
          parameters: {
            url: { type: "string", description: "URL of the webpage to fetch" }
          },
          returns: { type: "string", description: "Raw HTML content" }
        },
        {
          name: "extractData",
          description: "Extracts specific data from a webpage using CSS selectors",
          parameters: {
            url: { type: "string", description: "URL of the webpage" },
            selector: { type: "string", description: "CSS selector for targeting specific elements" }
          },
          returns: { type: "array", description: "Array of extracted elements" }
        },
        {
          name: "screenshotPage",
          description: "Takes a screenshot of a webpage",
          parameters: {
            url: { type: "string", description: "URL of the webpage to screenshot" }
          },
          returns: { type: "string", description: "Base64-encoded image data" }
        }
      ],
      auth: {
        type: "none",
        required: false
      }
    });
    
    // Google Calendar Tool
    this.createTool({
      name: "calendar",
      type: "api",
      description: "Google Calendar API for managing events and schedules",
      icon: "calendar",
      functions: [
        {
          name: "createEvent",
          description: "Creates a calendar event",
          parameters: {
            title: { type: "string", description: "Event title" },
            startTime: { type: "string", description: "Start time (ISO format)" },
            endTime: { type: "string", description: "End time (ISO format)" },
            attendees: { type: "array", description: "Array of attendee email addresses" }
          },
          returns: { type: "object", description: "Created event details" }
        },
        {
          name: "fetchEvents",
          description: "Fetches events for a specific date range",
          parameters: {
            dateRange: { type: "object", description: "Object with start and end dates" }
          },
          returns: { type: "array", description: "Array of event objects" }
        },
        {
          name: "deleteEvent",
          description: "Deletes a calendar event",
          parameters: {
            eventId: { type: "string", description: "ID of the event to delete" }
          },
          returns: { type: "boolean", description: "Success status" }
        },
        {
          name: "updateEvent",
          description: "Updates a calendar event",
          parameters: {
            eventId: { type: "string", description: "ID of the event to update" },
            updates: { type: "object", description: "Object with fields to update" }
          },
          returns: { type: "object", description: "Updated event details" }
        }
      ],
      auth: {
        type: "oauth",
        required: true,
        scopes: ["https://www.googleapis.com/auth/calendar"]
      }
    });
    
    // HTTP Request Tool
    this.createTool({
      name: "http",
      type: "function",
      description: "HTTP client for making API requests",
      icon: "link",
      functions: [
        {
          name: "get",
          description: "Makes a GET request",
          parameters: {
            url: { type: "string", description: "Request URL" },
            headers: { type: "object", description: "Request headers" }
          },
          returns: { type: "object", description: "Response data" }
        },
        {
          name: "post",
          description: "Makes a POST request",
          parameters: {
            url: { type: "string", description: "Request URL" },
            data: { type: "object", description: "Request body data" },
            headers: { type: "object", description: "Request headers" }
          },
          returns: { type: "object", description: "Response data" }
        },
        {
          name: "put",
          description: "Makes a PUT request",
          parameters: {
            url: { type: "string", description: "Request URL" },
            data: { type: "object", description: "Request body data" },
            headers: { type: "object", description: "Request headers" }
          },
          returns: { type: "object", description: "Response data" }
        },
        {
          name: "delete",
          description: "Makes a DELETE request",
          parameters: {
            url: { type: "string", description: "Request URL" },
            headers: { type: "object", description: "Request headers" }
          },
          returns: { type: "object", description: "Response data" }
        }
      ],
      auth: {
        type: "none",
        required: false
      }
    });
    
    // Database Tool
    this.createTool({
      name: "database",
      type: "function",
      description: "Database connector for SQL operations",
      icon: "database",
      functions: [
        {
          name: "query",
          description: "Executes a SQL query",
          parameters: {
            sql: { type: "string", description: "SQL query string" },
            params: { type: "array", description: "Query parameters" }
          },
          returns: { type: "array", description: "Query results" }
        },
        {
          name: "insert",
          description: "Inserts data into a table",
          parameters: {
            table: { type: "string", description: "Table name" },
            data: { type: "object", description: "Data to insert" }
          },
          returns: { type: "object", description: "Insert result" }
        },
        {
          name: "update",
          description: "Updates records in a table",
          parameters: {
            table: { type: "string", description: "Table name" },
            conditions: { type: "object", description: "WHERE conditions" },
            updates: { type: "object", description: "Fields to update" }
          },
          returns: { type: "object", description: "Update result" }
        }
      ],
      auth: {
        type: "connection",
        required: true
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Agent methods
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agentStore.values());
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agentStore.get(id);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentCurrentId++;
    const now = new Date();
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      createdAt: now,
      status: insertAgent.status || "inactive",
      lastRun: insertAgent.status === "active" ? now : null,
      workflowId: null,
      runCount: 0
    };
    this.agentStore.set(id, agent);
    return agent;
  }
  
  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const agent = this.agentStore.get(id);
    if (!agent) return undefined;
    
    const updatedAgent: Agent = {
      ...agent,
      ...updates,
      // If status is changing to active, update the lastRun timestamp
      lastRun: updates.status === "active" && agent.status !== "active" ? new Date() : agent.lastRun
    };
    
    this.agentStore.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agentStore.delete(id);
  }
  
  async linkAgentWithWorkflow(agentId: number, workflowId: number): Promise<Agent | undefined> {
    const agent = this.agentStore.get(agentId);
    const workflow = this.workflowStore.get(workflowId);
    
    if (!agent || !workflow) return undefined;
    
    const updatedAgent: Agent = {
      ...agent,
      workflowId
    };
    
    this.agentStore.set(agentId, updatedAgent);
    return updatedAgent;
  }
  
  // Log methods
  async getLogs(agentId?: number, workflowId?: number, executionId?: string): Promise<Log[]> {
    const logs = Array.from(this.logStore.values());
    let filtered = logs;
    
    if (agentId) {
      filtered = filtered.filter(log => log.agentId === agentId);
    }
    
    if (workflowId) {
      filtered = filtered.filter(log => log.workflowId === workflowId);
    }
    
    if (executionId) {
      filtered = filtered.filter(log => log.executionId === executionId);
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logCurrentId++;
    const timestamp = new Date();
    const log: Log = { 
      ...insertLog, 
      id, 
      timestamp,
      workflowId: null,
      executionId: null,
      details: {}
    };
    this.logStore.set(id, log);
    return log;
  }
  
  // Workflow methods
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflowStore.values());
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflowStore.get(id);
  }
  
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowCurrentId++;
    const now = new Date();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: now,
      status: insertWorkflow.status || "inactive",
      lastRun: insertWorkflow.status === "active" ? now : null,
      executionCount: 0
    };
    this.workflowStore.set(id, workflow);
    return workflow;
  }
  
  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflowStore.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      // If status is changing to active, update the lastRun timestamp
      lastRun: updates.status === "active" && workflow.status !== "active" ? new Date() : workflow.lastRun
    };
    
    this.workflowStore.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflowStore.delete(id);
  }
  
  // Execution methods
  async getExecutions(workflowId?: number, agentId?: number): Promise<Execution[]> {
    let executions = Array.from(this.executionStore.values());
    
    if (workflowId) {
      executions = executions.filter(execution => execution.workflowId === workflowId);
    }
    
    if (agentId) {
      executions = executions.filter(execution => execution.agentId === agentId);
    }
    
    return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  async getExecution(executionId: string): Promise<Execution | undefined> {
    return this.executionStore.get(executionId);
  }
  
  async createExecution(insertExecution: InsertExecution): Promise<Execution> {
    const id = this.executionCurrentId++;
    const startTime = new Date();
    const executionId = `exec_${Date.now()}_${id}`;
    
    const execution: Execution = {
      ...insertExecution,
      id,
      executionId,
      startTime,
      endTime: null,
      status: "pending",
      results: {},
      currentNode: null
    };
    
    this.executionStore.set(executionId, execution);
    
    // Add a log entry for this execution
    this.createLog({
      agentId: insertExecution.agentId,
      level: "info",
      message: `Started execution ${executionId}`,
      workflowId: insertExecution.workflowId,
      executionId,
      details: { status: "pending" }
    });
    
    // Update workflow execution count
    const workflow = await this.getWorkflow(insertExecution.workflowId);
    if (workflow) {
      const updatedWorkflow: Workflow = {
        ...workflow,
        executionCount: (workflow.executionCount || 0) + 1,
        lastRun: startTime
      };
      this.workflowStore.set(workflow.id, updatedWorkflow);
    }
    
    // Update agent run count
    const agent = await this.getAgent(insertExecution.agentId);
    if (agent) {
      const updatedAgent: Agent = {
        ...agent,
        runCount: (agent.runCount || 0) + 1,
        lastRun: startTime,
        status: "running"
      };
      this.agentStore.set(agent.id, updatedAgent);
    }
    
    return execution;
  }
  
  async updateExecution(executionId: string, updates: Partial<Execution>): Promise<Execution | undefined> {
    const execution = this.executionStore.get(executionId);
    if (!execution) return undefined;
    
    const updatedExecution: Execution = {
      ...execution,
      ...updates,
      // If there's a new node being processed
      currentNode: updates.currentNode || execution.currentNode
    };
    
    this.executionStore.set(executionId, updatedExecution);
    
    // Log node transition if currentNode changed
    if (updates.currentNode && updates.currentNode !== execution.currentNode) {
      this.createLog({
        agentId: execution.agentId,
        level: "info",
        message: `Moving to node ${updates.currentNode}`,
        workflowId: execution.workflowId,
        executionId,
        details: { currentNode: updates.currentNode }
      });
    }
    
    return updatedExecution;
  }
  
  async completeExecution(executionId: string, success: boolean, results: any = {}): Promise<Execution | undefined> {
    const execution = this.executionStore.get(executionId);
    if (!execution) return undefined;
    
    const endTime = new Date();
    const status = success ? "completed" : "failed";
    
    const updatedExecution: Execution = {
      ...execution,
      status,
      endTime,
      results: results || {},
      currentNode: null
    };
    
    this.executionStore.set(executionId, updatedExecution);
    
    // Log completion
    this.createLog({
      agentId: execution.agentId,
      level: success ? "info" : "error",
      message: `Execution ${status}: ${executionId}`,
      workflowId: execution.workflowId,
      executionId,
      details: { results, status }
    });
    
    // Update agent status
    const agent = await this.getAgent(execution.agentId);
    if (agent) {
      const updatedAgent: Agent = {
        ...agent,
        status: agent.status === "running" ? "active" : agent.status,
        lastRun: endTime
      };
      this.agentStore.set(agent.id, updatedAgent);
    }
    
    return updatedExecution;
  }
  
  // Tool methods
  async getTools(): Promise<Tool[]> {
    return Array.from(this.toolStore.values());
  }
  
  async getTool(id: number): Promise<Tool | undefined> {
    return this.toolStore.get(id);
  }
  
  async getToolByName(name: string): Promise<Tool | undefined> {
    return Array.from(this.toolStore.values()).find(
      (tool) => tool.name === name,
    );
  }
  
  async createTool(insertTool: InsertTool): Promise<Tool> {
    const id = this.toolCurrentId++;
    const now = new Date();
    const tool: Tool = {
      ...insertTool,
      id,
      createdAt: now
    };
    this.toolStore.set(id, tool);
    return tool;
  }
  
  async updateTool(id: number, updates: Partial<InsertTool>): Promise<Tool | undefined> {
    const tool = this.toolStore.get(id);
    if (!tool) return undefined;
    
    const updatedTool: Tool = {
      ...tool,
      ...updates
    };
    
    this.toolStore.set(id, updatedTool);
    return updatedTool;
  }
  
  async deleteTool(id: number): Promise<boolean> {
    return this.toolStore.delete(id);
  }
}

export const storage = new MemStorage();