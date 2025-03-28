import { useAgent } from "@/contexts/AgentContext";
import FeatureCard from "@/components/feature/FeatureCard";
import ExampleAgentCard from "@/components/agents/ExampleAgentCard";
import { features, examplePrompts } from "@/lib/agent-tools";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { setShowCreateModal } = useAgent();

  return (
    <div>
      {/* Hero Section */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Create AI Agents from Just a Prompt
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-6">
            Build powerful AI-driven automation workflows without code. Describe what you need in natural language, 
            and we'll create a fully operational agent for you.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="px-6 py-3 bg-white text-primary-600 hover:bg-gray-100 rounded-lg font-medium shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
          >
            Start Building
          </Button>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
      
      {/* Example Agents Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Example Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examplePrompts.slice(0, 2).map((example, index) => (
            <ExampleAgentCard
              key={index}
              name={example.name}
              description={example.description}
              tools={example.tools}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
