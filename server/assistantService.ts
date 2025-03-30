import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { WorkflowNode } from '@shared/schema';

// Initialize OpenAI client if API key is available
const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Initialize Anthropic client if API key is available
const getAnthropicClient = (): Anthropic | null => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

interface WorkflowContext {
  nodes: WorkflowNode[];
  workflowId?: number;
  agentName?: string;
  agentDescription?: string;
}

interface AssistantResponse {
  message: string;
  updatedWorkflow: { nodes: WorkflowNode[] } | null;
}

/**
 * Chat with the AI assistant about the workflow
 * Handles both general questions and workflow modification requests
 */
export async function chatWithAssistant(
  message: string,
  workflowContext: WorkflowContext
): Promise<AssistantResponse> {
  const openai = getOpenAIClient();
  const anthropic = getAnthropicClient();

  // Choose the available AI provider
  if (!openai && !anthropic) {
    return {
      message: "No AI provider configured. Please set up OpenAI or Anthropic API keys.",
      updatedWorkflow: null
    };
  }

  // Prepare system prompt
  const systemPrompt = `You are an advanced AI assistant embedded within a visual workflow builder application.
Your primary role is to help users create, understand, and modify their workflows through natural language.
You have FULL CONTROL over the workflow and can dynamically create, modify, or delete nodes based on user requests.

WORKFLOW CONTEXT:
${JSON.stringify(workflowContext.nodes, null, 2)}

CAPABILITIES:
1. Create entire workflows from scratch based on user descriptions
2. Add, modify, or delete specific nodes as requested
3. Restructure workflows for better efficiency
4. Answer questions about the workflow and explain node functionality
5. Suggest improvements to existing workflows

AVAILABLE TOOLS AND FUNCTIONS:
- webscraper: fetchPage(url), extractText(selector), extractLinks(selector)
- chatgpt: generateText(prompt), summarizeText(text), analyzeText(text)
- anthropic: generateText(prompt), summarizeText(text)
- gmail: sendEmail(to, subject, body), readEmails(filter), getAttachments(emailId)
- slack: sendMessage(channel, text), readMessages(channel, count)
- twitter: postTweet(text), searchTweets(query)
- database: query(sql), insert(table, data), update(table, data, condition)

WORKFLOW STRUCTURE RULES:
- Each node has: id, tool, function, params, and optionally next and position
- Nodes are connected through the "next" property containing the ID of the next node
- Each node must have unique IDs (use sequential numbers as strings: "1", "2", etc.)
- Param values can reference outputs from previous nodes using $nodeId.output syntax

INSTRUCTIONS FOR WORKFLOW MODIFICATIONS:
- If the user describes a workflow need, create the entire workflow from scratch with appropriate nodes
- If user requests deletion, remove the nodes and update connections to maintain workflow integrity
- When adding nodes, assign new unique IDs and update connections
- Always return both a helpful message AND the complete updated workflow JSON
- Explain what you changed and why
- Complete all requested operations without asking for confirmation

RESPONSE FORMAT:
Your response MUST be a valid JSON object with:
1. "message": your explanation to the user
2. "updatedWorkflow": the complete modified workflow object with all nodes

Do not respond to questions unrelated to workflows or this application.`;

  try {
    if (openai) {
      // Use OpenAI for the response
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message + "\n\nPlease respond in JSON format with 'message' and optionally 'updatedWorkflow' properties." }
        ],
        model: "gpt-4",
        temperature: 0.7
      });

      const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
      let parsedResponse;
      
      try {
        // Try to extract JSON if it's embedded in text
        const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                          responseContent.match(/```\s*([\s\S]*?)\s*```/) ||
                          responseContent.match(/{[\s\S]*}/);
                          
        const jsonStr = jsonMatch ? 
          (jsonMatch[1] ? jsonMatch[1] : jsonMatch[0].replace(/```json|```/g, '')) : 
          responseContent;
        
        parsedResponse = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse OpenAI response:", e);
        console.log("Raw response:", responseContent);
        // Return a friendly message if parsing fails
        return {
          message: "I understood your request but couldn't format my response properly. Could you try rephrasing your request?",
          updatedWorkflow: null
        };
      }
      
      return {
        message: parsedResponse.message || "I couldn't process your request.",
        updatedWorkflow: parsedResponse.updatedWorkflow || null
      };
    } else if (anthropic) {
      // Use Anthropic as fallback
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: "user", content: `${message}\n\nRespond in JSON format with 'message' and optionally 'updatedWorkflow' properties.` }
        ]
      });

      let responseText = "{}";
      if (response.content && response.content.length > 0) {
        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') {
          responseText = contentBlock.text;
        }
      }

      let parsedResponse;
      
      try {
        // Extract JSON from Claude's response which might include surrounding text
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          responseText.match(/{[\s\S]*}/);
                          
        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : responseText;
        parsedResponse = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse Claude response:", e);
        parsedResponse = { message: responseText };
      }
      
      return {
        message: parsedResponse.message || "I couldn't process your request.",
        updatedWorkflow: parsedResponse.updatedWorkflow || null
      };
    }
    
    throw new Error("No AI provider available");
  } catch (error) {
    console.error("Error calling AI service:", error);
    return {
      message: "Sorry, I encountered an error while processing your request. Please try again later.",
      updatedWorkflow: null
    };
  }
}