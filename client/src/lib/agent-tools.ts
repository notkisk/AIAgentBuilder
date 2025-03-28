export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  capabilities: string[];
  color: {
    bg: string;
    text: string;
    darkBg: string;
    darkText: string;
  };
}

// Preset colors for tool categories
const colors = {
  llm: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-400",
  },
  web: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
  },
  email: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
  data: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400",
  },
  messaging: {
    bg: "bg-green-100",
    text: "text-green-800",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  database: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-900/30",
    darkText: "dark:text-yellow-400",
  },
};

export const toolsList: Tool[] = [
  {
    id: "llm-processing",
    name: "LLM Processing",
    description: "Process text with large language models like GPT-4, Claude, and others for summarization, analysis, and generation.",
    icon: "M13.5 4.947c-.366-.366-1.52-.888-3.5-.888-1.978 0-3.134.517-3.5.888-.366.37-.738 1.063-.738 2.553 0 .448.046.937.138 1.404.623-.261 1.707-.62 4.1-.62 2.2 0 3.5.36 4.1.62.092-.45.138-.956.138-1.404 0-1.49-.37-2.184-.738-2.553zM9.85 7.705c0 .393-.203.633-.5.633-.296 0-.5-.24-.5-.634 0-.392.204-.632.5-.632.297 0 .5.24.5.632zm2.804 0c0 .393-.203.633-.5.633-.297 0-.5-.24-.5-.634 0-.392.203-.632.5-.632.297 0 .5.24.5.632zM13.5 10.443c-.623.26-1.707.62-4.1.62-2.393 0-3.477-.36-4.1-.62C5.208 11.633 4.9 13.14 5.06 14.866c.142 1.562.711 2.405 1.94 2.736.931.25 2.245.132 3-.32.39.208.857.328 1.5.328.642 0 1.108-.12 1.5-.328.755.45 2.07.57 3 .32 1.23-.33 1.798-1.175 1.94-2.737.16-1.726-.147-3.233-.44-4.424zM10 13h-.739a1.01 1.01 0 00-.673.33c-.204.225-.301.516-.301.777 0 .13.022.243.032.365C8.835 14.815 9.384 15 10 15s1.165-.185 1.681-.528c.01-.122.032-.236.032-.365 0-.26-.097-.553-.301-.777a1.01 1.01 0 00-.673-.33H10z",
    category: "llm",
    capabilities: ["OpenAI", "Claude", "Local Models"],
    color: colors.llm,
  },
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "Extract data from websites, monitor for changes, and process the results for your needs.",
    icon: "M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z",
    category: "web",
    capabilities: ["Basic Extractor", "Change Monitor", "Form Filler"],
    color: colors.web,
  },
  {
    id: "email-calendar",
    name: "Email & Calendar",
    description: "Read, write, and organize emails. Schedule and manage calendar events and reminders.",
    icon: "M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z",
    category: "email",
    capabilities: ["Gmail", "Outlook", "Google Calendar"],
    color: colors.email,
  },
  {
    id: "data-processors",
    name: "Data Processors",
    description: "Transform, filter, and analyze data from various sources. Generate insights from your information.",
    icon: "M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z",
    category: "data",
    capabilities: ["Summarization", "Translation", "Filtering"],
    color: colors.data,
  },
  {
    id: "messaging",
    name: "Messaging & Notifications",
    description: "Send notifications and messages to various platforms when your agents detect important information.",
    icon: "M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z",
    category: "messaging",
    capabilities: ["Telegram", "Discord", "Slack"],
    color: colors.messaging,
  },
  {
    id: "database",
    name: "Database & Storage",
    description: "Store, retrieve, and manage data from various database systems and storage providers.",
    icon: "M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z",
    category: "database",
    capabilities: ["Firebase", "PostgreSQL", "Vector DBs"],
    color: colors.database,
  },
];

export function getToolColor(toolName: string) {
  const tool = toolsList.find(t => t.name === toolName);
  
  if (tool) {
    return tool.color;
  }
  
  // Default color if tool not found
  return {
    bg: "bg-gray-100",
    text: "text-gray-800",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-200",
  };
}

// Example prompts for agent creation
export const examplePrompts = [
  {
    name: "Website Price Monitor",
    description: "Monitor a website for price changes and notify me on Telegram when prices drop.",
    tools: ["Web Scraper", "Data Processor", "Telegram API"],
  },
  {
    name: "Email Summarizer",
    description: "Summarize my daily emails and store them in Notion for later reference.",
    tools: ["Gmail API", "OpenAI API", "Notion API"],
  },
  {
    name: "Social Media Monitor",
    description: "Monitor Twitter for mentions of my brand and send alerts to Slack.",
    tools: ["Web Scraper", "Data Processor", "Slack API"],
  },
  {
    name: "Sales Data Analyzer",
    description: "Analyze my company's sales data and generate weekly reports.",
    tools: ["Data Processor", "PostgreSQL", "Gmail API"],
  },
];

// Features for the homepage
export const features = [
  {
    title: "Natural Language Creation",
    description: "Describe your agent in plain English, and our AI will build it for you with the right tools and integrations.",
    icon: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
  },
  {
    title: "Pre-built Tool Integrations",
    description: "Connect to Gmail, Calendar, Notion, Telegram, and many other services with zero configuration.",
    icon: "M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z",
  },
  {
    title: "Automated Execution",
    description: "Set up your agents to run manually, on a schedule, or in response to specific triggers.",
    icon: "M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z",
  },
];
