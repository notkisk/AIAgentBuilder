import { useAgent } from "@/contexts/AgentContext";
import { useApp } from "@/contexts/AppContext";
import FeatureCard from "@/components/feature/FeatureCard";
import ExampleAgentCard from "@/components/agents/ExampleAgentCard";
import { features, examplePrompts } from "@/lib/agent-tools";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Rocket, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const { setShowCreateModal } = useAgent();
  const { setCurrentView } = useApp();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-4"
    >
      {/* Hero Section */}
      <motion.div 
        variants={itemVariants}
        className="rounded-3xl bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-lg text-white p-10 mb-12 shadow-xl"
      >
        <div className="max-w-3xl relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/30 rounded-full blur-xl"
          />

          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
            variants={itemVariants}
          >
            Create AI Agents from 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-amber-300"> Natural Language</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Build powerful AI-driven automation workflows without code. Describe what you need
            in natural language, and we'll create a fully operational agent for you.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            variants={itemVariants}
          >
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="px-6 py-6 bg-white text-primary hover:bg-gray-50 rounded-xl font-medium shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              <Rocket className="w-5 h-5" /> Node Builder
            </Button>
            
            <Button
              onClick={() => setCurrentView("create")}
              size="lg"
              className="px-6 py-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-medium shadow-lg border border-white/20 hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
              variant="outline"
            >
              <Sparkles className="w-5 h-5" /> Chat Builder <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs rounded-full">NEW</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Features Section */}
      <motion.div 
        className="mb-12"
        variants={itemVariants}
      >
        <motion.h2 
          className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-700"
          variants={itemVariants}
        >
          Core Features
        </motion.h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="h-full"
            >
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Example Agents Section */}
      <motion.div
        variants={itemVariants}
      >
        <motion.div className="flex justify-between items-center mb-8">
          <motion.h2 
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-700"
            variants={itemVariants}
          >
            Example Agents
          </motion.h2>
          
          <motion.div
            variants={itemVariants}
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 text-primary/80 hover:text-primary cursor-pointer"
            onClick={() => setCurrentView("agents")}
          >
            View all <ArrowRight className="w-4 h-4" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {examplePrompts.slice(0, 2).map((example, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="h-full"
            >
              <ExampleAgentCard
                name={example.name}
                description={example.description}
                tools={example.tools}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
