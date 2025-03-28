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
  status: text("status").notNull().default("inactive"),  // "inactive", "active", "running", "error"
  workflowId: integer("workflow_id"),
  lastRun: timestamp("last_run"),
  runCount: integer("run_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Agent Logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  workflowId: integer("workflow_id"),
  executionId: text("execution_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(),  // "info", "warn", "error", "debug"
  message: text("message").notNull(),
  details: jsonb("details").default('{}'),
});

// Workflow Models
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  nodes: jsonb("nodes").notNull(),
  status: text("status").notNull().default("inactive"),  // "inactive", "active", "running", "error"
  lastRun: timestamp("last_run"),
  executionCount: integer("execution_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Workflow Executions - To track specific runs of a workflow
export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  workflowId: integer("workflow_id").notNull(),
  agentId: integer("agent_id").notNull(),
  status: text("status").notNull().default("pending"),  // "pending", "running", "completed", "failed"
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  results: jsonb("results").default('{}'),
  currentNode: text("current_node"),
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
  runCount: true,
  workflowId: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
}).extend({
  details: z.record(z.any()).optional(),
  executionId: z.string().optional(),
  workflowId: z.number().optional(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  lastRun: true,
  executionCount: true,
});

export const insertExecutionSchema = createInsertSchema(executions).omit({
  id: true,
  startTime: true,
  endTime: true,
  results: true,
  currentNode: true,
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
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executions.$inferSelect;
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
