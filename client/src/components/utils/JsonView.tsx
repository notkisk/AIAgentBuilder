import React, { useState } from 'react';

interface JsonViewProps {
  data: any;
  expanded?: boolean;
}

export default function JsonView({ data, expanded = false }: JsonViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatJson = (obj: any) => {
    try {
      if (typeof obj === 'string') {
        try {
          // Try to parse if it's a stringified JSON
          const parsed = JSON.parse(obj);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // If it's not valid JSON, return the original string
          return obj;
        }
      }
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return String(obj);
    }
  };
  
  const jsonString = formatJson(data);

  return (
    <div className="font-mono text-sm">
      {isExpanded ? (
        <pre className="whitespace-pre-wrap break-all">{jsonString}</pre>
      ) : (
        <div>
          <pre className="whitespace-pre-wrap break-all max-h-60 overflow-auto">
            {jsonString}
          </pre>
          {jsonString.length > 500 && (
            <button 
              onClick={toggleExpanded} 
              className="text-xs text-blue-500 hover:text-blue-700 mt-2"
            >
              Show {isExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}