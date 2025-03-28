import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { darkMode, toggleDarkMode } = useApp();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    firebase: false,
  });
  const { toast } = useToast();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: "User",
      email: "user@example.com",
      openai_api_key: "your-openai-api-key-here",
      firebase_api_key: "your-firebase-api-key-here",
    },
  });

  const onSaveProfile = (data: any) => {
    toast({
      title: "Profile updated",
      description: "Your profile changes have been saved.",
    });
  };

  const onSaveApiKeys = (data: any) => {
    toast({
      title: "API keys saved",
      description: "Your API keys have been updated.",
    });
  };

  const toggleShowApiKey = (key: "openai" | "firebase") => {
    setShowApiKeys({
      ...showApiKeys,
      [key]: !showApiKeys[key],
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Configure your AI Agent Builder preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                />
              </div>
              <div>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSaveApiKeys)} className="space-y-6">
              <div>
                <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                <div className="flex">
                  <Input
                    id="openai_api_key"
                    type={showApiKeys.openai ? "text" : "password"}
                    {...register("openai_api_key")}
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none"
                    onClick={() => toggleShowApiKey("openai")}
                  >
                    {showApiKeys.openai ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="firebase_api_key">Firebase API Key</Label>
                <div className="flex">
                  <Input
                    id="firebase_api_key"
                    type={showApiKeys.firebase ? "text" : "password"}
                    {...register("firebase_api_key")}
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none"
                    onClick={() => toggleShowApiKey("firebase")}
                  >
                    {showApiKeys.firebase ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <div>
                <Button type="submit">Save API Keys</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable dark mode for the interface</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email notifications when agents complete tasks
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
