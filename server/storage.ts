import { 
  users, 
  type User, 
  type InsertUser, 
  agents, 
  type Agent, 
  type InsertAgent,
  logs,
  type Log,
  type InsertLog
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
  
  // Log methods
  getLogs(agentId?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentStore: Map<number, Agent>;
  private logStore: Map<number, Log>;
  userCurrentId: number;
  agentCurrentId: number;
  logCurrentId: number;

  constructor() {
    this.users = new Map();
    this.agentStore = new Map();
    this.logStore = new Map();
    this.userCurrentId = 1;
    this.agentCurrentId = 1;
    this.logCurrentId = 1;
    
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
      lastRun: insertAgent.status === "active" ? now : undefined
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
      // If status is changing to active, update lastRun
      lastRun: updates.status === "active" ? new Date() : agent.lastRun,
    };
    
    this.agentStore.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agentStore.delete(id);
  }
  
  // Log methods
  async getLogs(agentId?: number): Promise<Log[]> {
    const logs = Array.from(this.logStore.values());
    
    if (agentId) {
      return logs.filter(log => log.agentId === agentId);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logCurrentId++;
    const now = new Date();
    const log: Log = { 
      ...insertLog, 
      id, 
      timestamp: now
    };
    this.logStore.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
