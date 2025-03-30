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
  const systemPrompt = `You are an AI assistant embedded in a workflow builder application. 
Your role is to help users understand and modify their workflows.

WORKFLOW CONTEXT:
${JSON.stringify(workflowContext.nodes, null, 2)}

CAPABILITIES:
1. Answer questions about the workflow
2. Explain what different nodes do
3. Suggest improvements
4. Modify the workflow based on user requests

MODIFICATION INSTRUCTIONS:
- If the user requests changes to the workflow, return both a helpful message AND the updated workflow JSON.
- If you're making a change, explain what you changed and why.
- Only change the nodes array, nothing else.
- Preserve node IDs when making modifications.
- Make sure the workflow remains valid (proper connections, etc.)

Do not respond to questions unrelated to workflows or this application.`;

  try {
    if (openai) {
      // Use OpenAI for the response
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "gpt-4",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
      const parsedResponse = JSON.parse(responseContent);
      
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