import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

// Interface for a file node.
interface FileNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: FileNode[];
  content?: string;
}

// Sample data used when no external data is provided.
const sampleData: FileNode[] = [
  {
    id: "1",
    name: "src",
    isFolder: true,
    children: [
      {
        id: "2",
        name: "components",
        isFolder: true,
        children: [
          { id: "3", name: "Button.tsx", isFolder: false },
          { id: "4", name: "FileSelector.tsx", isFolder: false },
        ],
      },
      { id: "5", name: "App.tsx", isFolder: false },
    ],
  },
  { id: "6", name: "package.json", isFolder: false },
];

interface FileNodeItemProps {
  node: FileNode;
  depth?: number;
  selectedFileId: string | null;
  onSelect: (id: string | null) => void;
  fileItemClassName?: string;
  selectedFileClassName?: string;
  fileItemHoverClassName?: string;
}

// Component to render an individual file or folder node.
const FileNodeItem: React.FC<FileNodeItemProps> = ({
  node,
  depth = 0,
  selectedFileId,
  onSelect,
  fileItemClassName,
  selectedFileClassName,
  fileItemHoverClassName,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Toggle folder expansion or select/deselect file.
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (node.isFolder) {
      setExpanded((prev) => !prev);
    } else {
      onSelect(node.id === selectedFileId ? null : node.id);
    }
  };

  const isSelected = !node.isFolder && node.id === selectedFileId;

  return (
    <li>
      <motion.div
        onClick={handleClick}
        className={cn(
          "flex items-center space-x-2 p-1 cursor-pointer rounded",
          fileItemClassName,
          fileItemHoverClassName,
          { [selectedFileClassName || ""]: isSelected }
        )}
        style={{ paddingLeft: depth * 16 }}
        animate={{ scale: isSelected ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon to indicate folder expansion state */}
        {node.isFolder ? (
          <span>
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4" />
        )}
        
        {/* Folder or file icon */}
        {node.isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <Folder className="w-4 h-4" />
          )
        ) : (
          <FileText className="w-4 h-4" />
        )}
        
        <span className="text-sm">{node.name}</span>
      </motion.div>

      {/* Render child nodes if present and folder is expanded */}
      {node.isFolder && node.children && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <FileNodeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedFileId={selectedFileId}
                  onSelect={onSelect}
                  fileItemClassName={fileItemClassName}
                  selectedFileClassName={selectedFileClassName}
                  fileItemHoverClassName={fileItemHoverClassName}
                />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  );
};

interface FileSelectorProps {
  className?: string;
  fileItemClassName?: string;
  selectedFileClassName?: string;
  fileItemHoverClassName?: string;
  data?: FileNode[];
  selectedFile?: string | null;
  onSelect?: (id: string | null) => void;
}

// Main FileSelector component.
export const FileSelector: React.FC<FileSelectorProps> = ({
  className = "",
  fileItemClassName = "",
  selectedFileClassName = "",
  fileItemHoverClassName = "",
  data,
  selectedFile,
  onSelect,
}) => {
  const [internalSelectedFile, setInternalSelectedFile] = useState<string | null>(null);
  const selectedFileId = selectedFile !== undefined ? selectedFile : internalSelectedFile;
  const handleSelect = onSelect ? onSelect : setInternalSelectedFile;
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use sampleData if no external data is provided.
  const files = data || sampleData;

  // Deselect the file if a click outside of the selector occurs.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setInternalSelectedFile(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("h-full w-full", className)}>
      <div 
        ref={containerRef} 
        className="border border-border rounded-l-md rounded-tr-none rounded-br-none h-full overflow-auto flex flex-col"
      >
        <div className="flex items-center justify-center border-b border-border px-4 py-2">
          <h2 className="text-sm font-medium text-white">Select a File</h2>
        </div>
        
        <div className="p-4">
          <ul className="list-none m-0 p-0">
            {files.map((node) => (
              <FileNodeItem
                key={node.id}
                node={node}
                selectedFileId={selectedFileId}
                onSelect={handleSelect}
                fileItemClassName={fileItemClassName}
                selectedFileClassName={selectedFileClassName}
                fileItemHoverClassName={fileItemHoverClassName}
              />
            ))}
          </ul>
        </div>
      
      </div>
    </div>
  );
};

export default FileSelector;