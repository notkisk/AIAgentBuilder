import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Agent Models
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  tools: text("tools").array().notNull(),
  status: text("status").notNull().default("inactive"),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Agent Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
});

// Workflow Models
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  nodes: jsonb("nodes").notNull(),
  status: text("status").notNull().default("inactive"),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tool Models
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  functions: jsonb("functions").notNull(),
  auth: jsonb("auth").default('{}'),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  lastRun: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  lastRun: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

// Node Types (used in workflow nodes)
export const NodeParamSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

export const NodeSchema = z.object({
  id: z.string(),
  tool: z.string(),
  function: z.string(),
  params: NodeParamSchema,
  next: z.string().optional(),
});

export const WorkflowNodesSchema = z.object({
  nodes: z.array(NodeSchema),
});

export type NodeParam = z.infer<typeof NodeParamSchema>;
export type WorkflowNode = z.infer<typeof NodeSchema>;
export type WorkflowNodes = z.infer<typeof WorkflowNodesSchema>;
