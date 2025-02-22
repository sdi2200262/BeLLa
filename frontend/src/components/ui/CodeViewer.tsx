import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable"
import { useMemo, lazy, Suspense, useState, useCallback } from 'react'

// Lazy load heavy components
const FileSelector = lazy(() => import('./FileSelector'))
const FileViewer = lazy(() => import('./FileViewer'))

// Memoized language map to prevent recreation on each render
const languageMap: { [key: string]: string } = {
  // Web languages
  'ts': 'typescript',
  'tsx': 'typescript',
  'js': 'javascript',
  'jsx': 'javascript',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'less': 'less',
  
  // Backend languages
  'py': 'python',
  'java': 'java',
  'rb': 'ruby',
  'php': 'php',
  'go': 'go',
  'rs': 'rust',
  'cs': 'csharp',
  'cpp': 'cpp',
  'c': 'c',
  
  // Configuration & Data
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'toml': 'toml',
  'ini': 'ini',
  
  // Shell scripts
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  
  // Documentation
  'md': 'markdown',
  
  // Other common formats
  'sql': 'sql',
  'graphql': 'graphql',
  'dockerfile': 'dockerfile',
};

// Memoized language detection function
const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return languageMap[extension] || 'plaintext';
};

// Interface for props used by CodeViewer.
interface CodeViewerProps {
  className?: string
  leftPanelClassName?: string
  rightPanelClassName?: string
  breadcrumbClassName?: string
  fileItemHoverClassName?: string
  fileItemClassName?: string       
  selectedFileClassName?: string   
  data?: any          
  selectedFile?: string | null
  onSelect?: (id: string | null) => void
  content?: string
  height?: string // New prop for controlling height
}

// Memoized file path finder
const findFilePath = (nodes: any[], id: string | null, currentPath: string[] = []): string[] => {
  if (!id) return []
  
  for (const node of nodes) {
    if (node.id === id) {
      return [...currentPath, node.name]
    }
    if (node.children) {
      const path = findFilePath(node.children, id, [...currentPath, node.name])
      if (path.length > 0) return path
    }
  }
  return []
}

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-pulse text-white/50">Loading...</div>
  </div>
);

// CodeViewer component combines a FileSelector and a FileViewer within a resizable layout.
export function CodeViewer({
  className = "",
  leftPanelClassName = "",
  rightPanelClassName = "",
  breadcrumbClassName = "",
  fileItemHoverClassName = "",
  fileItemClassName = "",
  selectedFileClassName = "",
  data,
  selectedFile,
  onSelect,
  content,
  height = "600px", // Default height
}: CodeViewerProps) {
  // Memoize expensive computations
  const filePath = useMemo(() => 
    data ? findFilePath(data, selectedFile ?? null) : [],
    [data, selectedFile]
  )
  
  const isEmpty = !data || data.length === 0
  const fileName = filePath[filePath.length - 1] || ''
  
  // Memoize language detection
  const language = useMemo(() => 
    getLanguageFromFileName(fileName),
    [fileName]
  )

  // Track panel sizes for smoother resizing
  const [leftPanelSize, setLeftPanelSize] = useState(30)
  const [rightPanelSize, setRightPanelSize] = useState(70)

  // Handle panel resizing
  const handlePanelResize = useCallback((sizes: number[]) => {
    setLeftPanelSize(sizes[0])
    setRightPanelSize(sizes[1])
  }, [])

  if (isEmpty) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        <div className="text-center border border-white/10 rounded-lg p-4 space-y-2 text-muted-foreground">
          <h3 className="text-xl font-semibold">Hello there!</h3>
          <p>No files to display yet. Check back soon!</p>
          <p className="text-sm">🌟 Ready to explore when you are 🚀</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <ResizablePanelGroup 
        direction="horizontal" 
        className="rounded-lg border w-full h-full"
        onLayout={handlePanelResize}
      >
        {/* Left panel: File selector */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className={`h-full ${leftPanelClassName}`}>
            <Suspense fallback={<LoadingPlaceholder />}>
              <FileSelector 
                className="rounded-none" 
                data={data}
                selectedFile={selectedFile}
                onSelect={onSelect}
                fileItemHoverClassName={fileItemHoverClassName}
                fileItemClassName={fileItemClassName}
                selectedFileClassName={selectedFileClassName}
              />
            </Suspense>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right panel: File viewer */}
        <ResizablePanel defaultSize={70} minSize={60} maxSize={80}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <FileViewer
              className={`h-full ${rightPanelClassName}`}
              content={content}
              filePath={filePath}
              breadcrumbClassName={breadcrumbClassName}
              language={language}
            />
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
