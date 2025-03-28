import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
}

export default function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <div 
      className={cn(
        "relative bg-white/60 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50",
        "backdrop-blur-lg rounded-2xl p-6 h-full shadow-md",
        "hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300",
        className
      )}
    >
      {/* Gradient circle decoration */}
      <div className="absolute -top-3 -left-3 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center text-white mb-5 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
            <path d={icon} />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
        
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
