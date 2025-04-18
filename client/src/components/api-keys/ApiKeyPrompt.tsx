import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isAIProviderConfigured } from "@/lib/ai-service";

interface ApiKeyPromptProps {
  onKeysConfigured: () => void;
  onSkip?: () => void;
}

const ApiKeyPrompt = ({ onKeysConfigured, onSkip }: ApiKeyPromptProps) => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOpenAI, setHasOpenAI] = useState(isAIProviderConfigured("openai"));
  const [hasAnthropic, setHasAnthropic] = useState(isAIProviderConfigured("anthropic"));
  const { toast } = useToast();
  
  const initialTab = hasOpenAI ? "anthropic" : "openai";
  
  // Initialize API keys and environment from localStorage on component mount
  useEffect(() => {
    // Initialize window.env object
    (window as any).env = (window as any).env || {};
    
    // Set up OpenAI key if available
    const savedOpenAIKey = localStorage.getItem("OPENAI_API_KEY");
    if (savedOpenAIKey) {
      (window as any).env.OPENAI_API_KEY = savedOpenAIKey;
      setHasOpenAI(true);
    }
    
    // Set up Anthropic key if available
    const savedAnthropicKey = localStorage.getItem("ANTHROPIC_API_KEY");
    if (savedAnthropicKey) {
      (window as any).env.ANTHROPIC_API_KEY = savedAnthropicKey;
      setHasAnthropic(true);
    }
    
    // Auto proceed if keys are already configured
    if ((savedOpenAIKey || savedAnthropicKey) && onKeysConfigured) {
      onKeysConfigured();
    }
  }, [onKeysConfigured]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Store API keys securely for this session only
      if (openaiKey) {
        localStorage.setItem("OPENAI_API_KEY", openaiKey);
        // Make available to the environment
        (window as any).env = (window as any).env || {};
        (window as any).env.OPENAI_API_KEY = openaiKey;
        setHasOpenAI(true);
      }
      
      if (anthropicKey) {
        localStorage.setItem("ANTHROPIC_API_KEY", anthropicKey);
        // Make available to the environment
        (window as any).env = (window as any).env || {};
        (window as any).env.ANTHROPIC_API_KEY = anthropicKey;
        setHasAnthropic(true);
      }
      
      toast({
        title: "API Keys Configured",
        description: "Your AI API keys have been configured successfully.",
      });
      
      onKeysConfigured();
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Configuration Error",
        description: "There was an error saving your API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Configure AI Providers</CardTitle>
        <CardDescription>
          Enter your API keys to enable advanced AI features for workflow generation and agent recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="openai" disabled={isSubmitting} className={hasOpenAI ? "bg-green-100 text-green-800" : ""}>
              {hasOpenAI ? "✓ OpenAI" : "OpenAI"}
            </TabsTrigger>
            <TabsTrigger value="anthropic" disabled={isSubmitting} className={hasAnthropic ? "bg-green-100 text-green-800" : ""}>
              {hasAnthropic ? "✓ Anthropic" : "Anthropic"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="openai" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                disabled={isSubmitting || hasOpenAI}
                className={hasOpenAI ? "bg-gray-100" : ""}
              />
              {hasOpenAI && (
                <p className="text-sm text-muted-foreground mt-1">
                  ✓ OpenAI API key is already configured
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="anthropic" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk_ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                disabled={isSubmitting || hasAnthropic}
                className={hasAnthropic ? "bg-gray-100" : ""}
              />
              {hasAnthropic && (
                <p className="text-sm text-muted-foreground mt-1">
                  ✓ Anthropic API key is already configured
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onSkip && (
          <Button variant="outline" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (!openaiKey && !anthropicKey) || (hasOpenAI && hasAnthropic)}
        >
          {isSubmitting ? "Saving..." : "Save API Keys"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyPrompt;