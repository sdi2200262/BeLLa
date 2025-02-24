import { memo, useState, useCallback, lazy, Suspense, ReactNode } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FileIcon, File } from 'lucide-react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Switch } from './switch'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from './breadcrumb'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import { ScrollArea } from "./scroll-area"

// Lazy load ReactMarkdown for better performance
const ReactMarkdown = lazy(() => import('react-markdown'))

// Types for file tree data structure
interface FileTreeNode {
  name: string
  type: 'file' | 'dir'
  path: string
  children?: FileTreeNode[]
}

interface RepoViewerProps {
  data: FileTreeNode[]
  className?: string
  height?: string
}

// Language detection for syntax highlighting
const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    go: 'go',
    rs: 'rust',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
  }
  return languageMap[extension] || 'plaintext'
}

// Memoized tree node component for better performance
const TreeNode = memo(({ 
  node, 
  depth = 0,
  onSelect,
  selectedPath
}: { 
  node: FileTreeNode
  depth: number
  onSelect: (node: FileTreeNode) => void
  selectedPath: string | null
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isFolder = node.type === 'dir'
  const isSelected = selectedPath === node.path

  const handleClick = useCallback(() => {
    if (isFolder) {
      setIsExpanded(prev => !prev)
    } else {
      onSelect(node)
    }
  }, [isFolder, node, onSelect])

  return (
    <li className="list-none">
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-2 py-1 cursor-pointer rounded text-sm transition-all duration-200",
          "hover:bg-white/5",
          "text-white/70 hover:text-white",
          isSelected && "bg-white/10 text-white"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        ) : (
          <span className="w-4" />
        )}
        {isFolder ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
        <span>{node.name}</span>
      </div>

      {isFolder && isExpanded && node.children && (
        <ul>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.path || index}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </ul>
      )}
    </li>
  )
})

TreeNode.displayName = 'TreeNode'

// Main RepoViewer component
export function RepoViewer({ data, className, height = '500px' }: RepoViewerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(true)

  const handleFileSelect = useCallback((node: FileTreeNode) => {
    setSelectedFile(node)
    // If it's a markdown file, default to showing markdown view
    if (node.name.toLowerCase().endsWith('.md')) {
      setShowMarkdown(true)
    }
  }, [])

  const isMarkdownFile = selectedFile?.name.toLowerCase().endsWith('.md')
  const language = selectedFile ? getLanguageFromFileName(selectedFile.name) : 'plaintext'

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const paddingLeft = `${depth * 1.5}rem`

    if (node.type === 'dir') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-lg transition-colors"
            style={{ paddingLeft }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#0066FF]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#0066FF]" />
            )}
            <Folder className="w-4 h-4 text-[#0066FF]" />
            <span className="text-sm text-white/80">{node.name}</span>
          </button>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      )
    }

    return (
      <div
        key={node.path}
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-lg transition-colors"
        style={{ paddingLeft }}
      >
        <File className="w-4 h-4 text-white/40" />
        <span className="text-sm text-white/60">{node.name}</span>
      </div>
    )
  }

  // Generate breadcrumb items from path
  const getBreadcrumbItems = (path: string) => {
    const parts = path.split('/')
    return parts.map((part, index) => {
      const isLast = index === parts.length - 1
      return (
        <BreadcrumbItem key={index}>
          {isLast ? (
            <span className="text-white">{part}</span>
          ) : (
            <span className="text-white/60">{part}</span>
          )}
          {!isLast && <BreadcrumbSeparator />}
        </BreadcrumbItem>
      )
    })
  }

  // Custom components for ReactMarkdown
  const markdownComponents: Components = {
    code(props) {
      const { className, children, ...rest } = props
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match && !props.node?.position?.start.line
      return !isInline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={tomorrow}
          PreTag="div"
          customStyle={{
            margin: '1em 0',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.9rem',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1em",
            textAlign: "right",
            userSelect: "none",
            opacity: "0.2",
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={cn(
          "bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono",
          className
        )} {...rest}>
          {children}
        </code>
      )
    },
    h1(props) {
      return <h1 className="text-2xl font-bold text-white border-b border-white/10 pb-2 mb-4" {...props} />
    },
    h2(props) {
      return <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4 mt-6" {...props} />
    },
    h3(props) {
      return <h3 className="text-lg font-bold text-white mt-6 mb-4" {...props} />
    },
    h4(props) {
      return <h4 className="text-base font-bold text-white mt-4 mb-3" {...props} />
    },
    h5(props) {
      return <h5 className="text-sm font-bold text-white mt-4 mb-2" {...props} />
    },
    h6(props) {
      return <h6 className="text-xs font-bold text-white/90 mt-4 mb-2" {...props} />
    },
    ul(props) {
      return <ul className="list-disc pl-6 my-4 space-y-1 text-white/90 marker:text-white/50" {...props} />
    },
    ol(props) {
      return <ol className="list-decimal pl-6 my-4 space-y-1 text-white/90 marker:text-white/70" {...props} />
    },
    a(props) {
      return (
        <a 
          {...props}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        />
      )
    },
    p(props) {
      return <p className="text-white/90 leading-7 mb-4" {...props} />
    },
    blockquote(props) {
      return <blockquote className="border-l-4 border-white/20 pl-4 py-1 my-4 text-white/80 bg-white/5 rounded-r" {...props} />
    },
    img(props) {
      return (
        <img 
          {...props}
          className="max-w-full h-auto rounded-lg my-4 border border-white/10"
        />
      )
    },
    strong(props) {
      return <strong className="font-bold text-white" {...props} />
    },
    em(props) {
      return <em className="italic text-white/90" {...props} />
    },
    del(props) {
      return <del className="line-through text-white/70" {...props} />
    },
    hr(props) {
      return <hr className="my-8 border-t border-white/10" {...props} />
    },
    table(props) {
      return (
        <div className="my-6 w-full overflow-x-auto">
          <table className="w-full border-collapse text-white/90" {...props} />
        </div>
      )
    },
    thead(props) {
      return <thead className="bg-white/5" {...props} />
    },
    tbody(props) {
      return <tbody className="divide-y divide-white/10" {...props} />
    },
    tr(props) {
      return <tr className="border-b border-white/10 last:border-0" {...props} />
    },
    th(props) {
      return (
        <th 
          className="border border-white/10 bg-white/5 p-2 text-left font-semibold text-white" 
          {...props} 
        />
      )
    },
    td(props) {
      return <td className="border border-white/10 p-2 text-white/90" {...props} />
    },
    li(props) {
      const { checked, ...rest } = props as DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement> & { checked?: boolean }
      
      if (checked !== undefined) {
        return (
          <li className={cn(
            "flex items-start gap-2",
            "text-white/90",
            "relative",
            "pl-1",
          )} {...rest}>
            <input 
              type="checkbox" 
              checked={checked} 
              readOnly 
              className="mt-1.5 rounded border-white/20 bg-white/5 checked:bg-blue-500"
            />
            <span>{rest.children}</span>
          </li>
        )
      }
      return (
        <li className={cn(
          "text-white/90",
          "relative",
          "pl-1",
          "[&>ul]:mt-2 [&>ol]:mt-2",
          "[&>ul]:mb-0 [&>ol]:mb-0",
        )} {...rest} />
      )
    }
  }

  if (!data) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-white/60">No files to display</p>
      </div>
    )
  }

  return (
    <div className={cn('border border-white/10 rounded-lg overflow-hidden', className)} style={{ height }}>
      <ScrollArea style={{ height }} className="p-4">
        {data?.map(node => renderNode(node)) || (
          <div className="text-center text-white/40 py-8">
            No files to display
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 