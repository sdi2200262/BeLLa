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
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 rounded-lg px-4 py-2 text-sm",
      className
    )}>
      <span className="font-mono text-white/80">{command}</span>
      <button
        onClick={copyToClipboard}
        className={cn(
          "p-1 rounded-md transition-all duration-200",
          "hover:bg-white/5",
          "focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20",
          "active:scale-95"
        )}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-[#0066FF]" />
        ) : (
          <Copy className="w-4 h-4 text-white/60" />
        )}
      </button>
    </div>
  );
};

export default CodeBlock; 