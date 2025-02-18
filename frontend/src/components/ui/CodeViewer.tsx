import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable"
import FileSelector from "./FileSelector"
import FileViewer from "./FileViewer"

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
}

// Helper function to recursively find the file path based on an ID.
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
}: CodeViewerProps) {
  const filePath = data ? findFilePath(data, selectedFile ?? null) : []
  const isEmpty = !data || data.length === 0

  if (isEmpty) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-center border border-white/10 rounded-lg p-4 space-y-2 text-muted-foreground">
          <h3 className="text-xl font-semibold">Hello there!</h3>
          <p>No files to display yet. Check back soon!</p>
          <p className="text-sm">🌟 Ready to explore when you are 🚀</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <ResizablePanelGroup direction="horizontal" className="min-h-[200px] rounded-lg border w-full">
        
        {/* Left panel: File selector */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className={`h-full ${leftPanelClassName}`}>
            <FileSelector 
              className="rounded-none" 
              data={data}
              selectedFile={selectedFile}
              onSelect={onSelect}
              fileItemHoverClassName={fileItemHoverClassName}
              fileItemClassName={fileItemClassName}
              selectedFileClassName={selectedFileClassName}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right panel: File viewer */}
        <ResizablePanel defaultSize={70} minSize={60} maxSize={80}>
          <FileViewer
            className={`h-full ${rightPanelClassName}`}
            content={content}
            filePath={filePath}
            breadcrumbClassName={breadcrumbClassName}
          />
        </ResizablePanel>
      
      </ResizablePanelGroup>
    </div>
  )
}
