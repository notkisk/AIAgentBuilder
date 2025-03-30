import { WorkflowNode } from '@shared/schema';

interface WorkflowResponse {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  message: string;
  status?: string;
}

/**
 * Creates a modified workflow based on the prompt and existing nodes
 * This is a simplified implementation that handles basic modifications
 */
export function createModifiedWorkflow(prompt: string, existingNodes: WorkflowNode[]): WorkflowResponse {
  // This is where you would integrate with AI to generate workflow modifications
  // For now, we'll provide a fallback implementation that handles some basic operations
  
  const lowerPrompt = prompt.toLowerCase();
  let nodes = [...existingNodes];
  let message = "Workflow updated successfully";
  
  // Handle "add" operations
  if (lowerPrompt.includes("add") || lowerPrompt.includes("create") || lowerPrompt.includes("insert")) {
    // Add email node
    if (lowerPrompt.includes("email") || lowerPrompt.includes("gmail") || lowerPrompt.includes("notification")) {
      const newNodeId = `email-${Date.now()}`;
      const lastNode = nodes[nodes.length - 1];
      
      const newNode: WorkflowNode = {
        id: newNodeId,
        tool: "gmail",
        function: "sendEmail",
        params: {
          to: "user@example.com",
          subject: "Workflow Notification",
          body: "This is an automated notification from your workflow"
        }
      };
      
      if (lastNode) {
        // Connect the last node to the new node
        nodes = nodes.map(node => 
          node.id === lastNode.id ? { ...node, next: newNodeId } : node
        );
      }
      
      nodes.push(newNode);
      message = "Added a new email notification node to the workflow";
    }
    
    // Add AI processing node
    else if (lowerPrompt.includes("ai") || lowerPrompt.includes("chatgpt") || lowerPrompt.includes("summarize")) {
      const newNodeId = `ai-${Date.now()}`;
      const lastNode = nodes[nodes.length - 1];
      
      const newNode: WorkflowNode = {
        id: newNodeId,
        tool: "chatgpt",
        function: "generateText",
        params: {
          prompt: "Generate a summary based on the input data"
        }
      };
      
      if (lastNode) {
        // Connect the last node to the new node
        nodes = nodes.map(node => 
          node.id === lastNode.id ? { ...node, next: newNodeId } : node
        );
      }
      
      nodes.push(newNode);
      message = "Added a new AI processing node to the workflow";
    }
  }
  
  // Handle "remove" or "delete" operations
  else if (lowerPrompt.includes("remove") || lowerPrompt.includes("delete")) {
    let nodeTypeToRemove = "";
    
    if (lowerPrompt.includes("email") || lowerPrompt.includes("gmail")) {
      nodeTypeToRemove = "gmail";
    } else if (lowerPrompt.includes("ai") || lowerPrompt.includes("chatgpt")) {
      nodeTypeToRemove = "chatgpt";
    } else if (lowerPrompt.includes("last")) {
      // Remove the last node
      if (nodes.length > 0) {
        const removedNode = nodes.pop();
        
        // Update the next pointer of any node pointing to the removed node
        nodes = nodes.map(node => 
          node.next === removedNode?.id ? { ...node, next: undefined } : node
        );
        
        message = `Removed the last node from the workflow`;
      } else {
        message = "No nodes to remove";
      }
      return { name: "Modified Workflow", description: "Workflow with modifications", nodes, message };
    }
    
    if (nodeTypeToRemove) {
      // Create a map of nodes to be removed
      const nodesToRemove = nodes
        .filter((node: WorkflowNode) => node.tool === nodeTypeToRemove)
        .reduce((map: Record<string, boolean>, node: WorkflowNode) => {
          map[node.id] = true;
          return map;
        }, {});
        
      // Update connections to skip over removed nodes
      nodes = nodes.map((node: WorkflowNode) => {
        if (node.next && nodesToRemove[node.next]) {
          // Find the next node that isn't being removed
          let nextNodeId = node.next;
          while (nextNodeId && nodesToRemove[nextNodeId]) {
            const currentNode = nodes.find((n: WorkflowNode) => n.id === nextNodeId);
            nextNodeId = currentNode?.next ?? undefined;
          }
          return { ...node, next: nextNodeId };
        }
        return node;
      });
      
      // Filter out the nodes to be removed
      const filteredNodes = nodes.filter((node: WorkflowNode) => node.tool !== nodeTypeToRemove);
      
      nodes = filteredNodes;
      message = `Removed ${nodeTypeToRemove} nodes from the workflow`;
    }
  }
  
  // Handle "connect" operations
  else if (lowerPrompt.includes("connect") || lowerPrompt.includes("link")) {
    const nodeAMatch = lowerPrompt.match(/node\s+([a-z0-9]+)/i);
    const nodeBMatch = lowerPrompt.match(/node\s+([a-z0-9]+).*to.*node\s+([a-z0-9]+)/i);
    
    if (nodeAMatch && nodeBMatch) {
      const nodeAIdentifier = nodeAMatch[1].toLowerCase();
      const nodeBIdentifier = nodeBMatch[2].toLowerCase();
      
      // Try to find nodes by their identifiers
      let nodeA: WorkflowNode | undefined;
      let nodeB: WorkflowNode | undefined;
      
      if (nodeAIdentifier === "a" && nodeBIdentifier === "b") {
        // Special case for generic "connect node A to node B"
        if (nodes.length >= 2) {
          nodeA = nodes[0];
          nodeB = nodes[1];
        }
      } else {
        // Try to find nodes by their identifiers or ids
        nodeA = nodes.find(node => 
          node.id.toLowerCase().includes(nodeAIdentifier) || 
          node.function.toLowerCase().includes(nodeAIdentifier) ||
          node.tool.toLowerCase().includes(nodeAIdentifier)
        );
        
        nodeB = nodes.find(node => 
          node.id.toLowerCase().includes(nodeBIdentifier) || 
          node.function.toLowerCase().includes(nodeBIdentifier) ||
          node.tool.toLowerCase().includes(nodeBIdentifier)
        );
      }
      
      if (nodeA && nodeB) {
        // Connect node A to node B
        nodes = nodes.map(node => 
          node.id === nodeA!.id ? { ...node, next: nodeB!.id } : node
        );
        message = `Connected ${nodeA.tool}:${nodeA.function} to ${nodeB.tool}:${nodeB.function}`;
      } else {
        message = "Could not find specified nodes to connect";
      }
    }
  }
  
  // Handle "update" or "change" operations
  else if (lowerPrompt.includes("update") || lowerPrompt.includes("change") || lowerPrompt.includes("modify")) {
    let toolToUpdate = "";
    
    if (lowerPrompt.includes("email") || lowerPrompt.includes("gmail")) {
      toolToUpdate = "gmail";
    } else if (lowerPrompt.includes("ai") || lowerPrompt.includes("chatgpt")) {
      toolToUpdate = "chatgpt";
    }
    
    if (toolToUpdate) {
      // Find nodes that match the tool type
      const nodesToUpdate = nodes.filter((node: WorkflowNode) => node.tool === toolToUpdate);
      
      if (nodesToUpdate.length > 0) {
        // Update params based on the prompt
        nodes = nodes.map(node => {
          if (node.tool === toolToUpdate) {
            if (toolToUpdate === "gmail") {
              // Extract email properties from the prompt
              const subjectMatch = prompt.match(/subject\s*[:"']([^"']+)["']/i);
              const bodyMatch = prompt.match(/body\s*[:"']([^"']+)["']/i);
              const toMatch = prompt.match(/to\s*[:"']([^"']+)["']/i);
              
              const updatedParams = { ...node.params };
              if (subjectMatch) updatedParams.subject = subjectMatch[1];
              if (bodyMatch) updatedParams.body = bodyMatch[1];
              if (toMatch) updatedParams.to = toMatch[1];
              
              return { ...node, params: updatedParams };
            } else if (toolToUpdate === "chatgpt") {
              // Extract AI properties from the prompt
              const promptMatch = prompt.match(/prompt\s*[:"']([^"']+)["']/i);
              
              const updatedParams = { ...node.params };
              if (promptMatch) updatedParams.prompt = promptMatch[1];
              
              return { ...node, params: updatedParams };
            }
          }
          return node;
        });
        
        message = `Updated parameters for ${toolToUpdate} nodes`;
      } else {
        message = `No ${toolToUpdate} nodes found to update`;
      }
    }
  }
  
  return {
    name: "Modified Workflow",
    description: "Workflow with modifications based on your request",
    nodes,
    message
  };
}

/**
 * Creates a new workflow based on the prompt
 * This is a simplified implementation that creates basic workflows
 */
export function createNewWorkflow(prompt: string): WorkflowResponse {
  // This is where you would integrate with AI to generate workflows
  // For now, we'll provide a fallback implementation that creates some basic workflows
  
  const lowerPrompt = prompt.toLowerCase();
  let name = "New Workflow";
  let description = "Generated workflow";
  let nodes: WorkflowNode[] = [];
  
  // Email notification workflow
  if (lowerPrompt.includes("email") || lowerPrompt.includes("gmail") || lowerPrompt.includes("notification")) {
    name = "Email Notification Workflow";
    description = "Sends email notifications based on triggers";
    
    nodes = [
      {
        id: "trigger-1",
        tool: "trigger",
        function: "schedule",
        params: { schedule: "0 9 * * *" }, // Daily at 9am
        next: "ai-1"
      },
      {
        id: "ai-1",
        tool: "chatgpt",
        function: "generateText",
        params: { prompt: "Generate today's summary" },
        next: "email-1"
      },
      {
        id: "email-1",
        tool: "gmail",
        function: "sendEmail",
        params: {
          to: "user@example.com",
          subject: "Daily Notification",
          body: "Here's your daily update: $ai-1.output"
        }
      }
    ];
  }
  
  // Web monitoring workflow
  else if (lowerPrompt.includes("web") || lowerPrompt.includes("website") || lowerPrompt.includes("monitor")) {
    name = "Website Monitoring Workflow";
    description = "Monitors a website for changes and sends notifications";
    
    nodes = [
      {
        id: "web-1",
        tool: "webscraper",
        function: "fetchPage",
        params: { url: "https://example.com" },
        next: "ai-1"
      },
      {
        id: "ai-1",
        tool: "chatgpt",
        function: "summarizeText",
        params: { text: "$web-1.output" },
        next: "email-1"
      },
      {
        id: "email-1",
        tool: "gmail",
        function: "sendEmail",
        params: {
          to: "user@example.com",
          subject: "Website Update",
          body: "Here's what changed: $ai-1.output"
        }
      }
    ];
  }
  
  // AI Processing workflow
  else if (lowerPrompt.includes("ai") || lowerPrompt.includes("chatgpt") || lowerPrompt.includes("process")) {
    name = "AI Processing Workflow";
    description = "Uses AI to process data and generate insights";
    
    nodes = [
      {
        id: "input-1",
        tool: "input",
        function: "getText",
        params: { prompt: "Enter text to analyze" },
        next: "ai-1"
      },
      {
        id: "ai-1",
        tool: "chatgpt",
        function: "analyzeText",
        params: { text: "$input-1.output" },
        next: "ai-2"
      },
      {
        id: "ai-2",
        tool: "chatgpt",
        function: "generateSummary",
        params: { analysis: "$ai-1.output" },
        next: "output-1"
      },
      {
        id: "output-1",
        tool: "output",
        function: "displayText",
        params: { text: "$ai-2.output" }
      }
    ];
  }
  
  // Default simple workflow
  else {
    name = "Basic Workflow";
    description = "A simple workflow with input, processing, and output";
    
    nodes = [
      {
        id: "input-1",
        tool: "input",
        function: "getText",
        params: { prompt: "Enter text" },
        next: "process-1"
      },
      {
        id: "process-1",
        tool: "text",
        function: "transform",
        params: { operation: "uppercase" },
        next: "output-1"
      },
      {
        id: "output-1",
        tool: "output",
        function: "displayText",
        params: { text: "$process-1.output" }
      }
    ];
  }
  
  return {
    name,
    description,
    nodes,
    message: `Created a new ${name} with ${nodes.length} nodes`
  };
}