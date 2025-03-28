import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type NotificationType = "default" | "info" | "success" | "warning" | "destructive";

interface NotificationOptions {
  duration?: number;
  variant?: NotificationType;
}

export function useNotification() {
  const { toast } = useToast();
  
  const showNotification = (
    message: string, 
    title?: string,
    options: NotificationOptions = {}
  ) => {
    const { duration = 3000, variant = "default" } = options;
    
    toast({
      title: title || (variant === "destructive" ? "Error" : "Notification"),
      description: message,
      variant,
      duration,
    });
  };
  
  return { showNotification };
}

export default useNotification;
