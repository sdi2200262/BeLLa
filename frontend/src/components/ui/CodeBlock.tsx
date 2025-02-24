import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  command: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ command, className }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-neutral-400 group",
      className
    )}>
      <span className="font-mono text-white opacity-50 group-hover:opacity-100">{command}</span>
      <button
        onClick={copyToClipboard}
        className={cn(
          "p-1 rounded-md transition-all duration-200",
          "opacity-50 group-hover:opacity-100",
          "hover:bg-white/10",
          "focus:outline-none focus:ring-2 focus:ring-white/20",
          "active:scale-95"
        )}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-white/60" />
        )}
      </button>
    </div>
  );
};

export default CodeBlock; 