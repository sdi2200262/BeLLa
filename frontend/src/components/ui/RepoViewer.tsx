import { memo, useState, useCallback, lazy, Suspense, ReactNode } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FileIcon } from 'lucide-react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Switch } from './switch'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from './breadcrumb'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

// Lazy load ReactMarkdown for better performance
const ReactMarkdown = lazy(() => import('react-markdown'))

// Types for file tree data structure
export interface TreeNode {
  path: string
  name: string
  type: 'tree' | 'blob'
  children?: TreeNode[]
  content?: string
}

interface RepoViewerProps {
  data?: TreeNode
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
  node: TreeNode
  depth: number
  onSelect: (node: TreeNode) => void
  selectedPath: string | null
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isFolder = node.type === 'tree'
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
        {isFolder ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
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
export function RepoViewer({ data, className, height = '600px' }: RepoViewerProps) {
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(true)

  const handleFileSelect = useCallback((node: TreeNode) => {
    setSelectedFile(node)
    // If it's a markdown file, default to showing markdown view
    if (node.name.toLowerCase().endsWith('.md')) {
      setShowMarkdown(true)
    }
  }, [])

  const isMarkdownFile = selectedFile?.name.toLowerCase().endsWith('.md')
  const language = selectedFile ? getLanguageFromFileName(selectedFile.name) : 'plaintext'

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
      <ResizablePanelGroup direction="horizontal">
        {/* File tree panel */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full border-r border-white/10 bg-black/40">
            <div className="p-2 border-b border-white/10">
              <h3 className="text-sm font-medium text-white/80">Files</h3>
            </div>
            <div className="overflow-auto" style={{ height: 'calc(100% - 37px)' }}>
              <TreeNode 
                node={data} 
                depth={0} 
                onSelect={handleFileSelect}
                selectedPath={selectedFile?.path || null}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* File content panel */}
        <ResizablePanel defaultSize={75} minSize={60} maxSize={80}>
          <div className="h-full bg-black/40">
            {selectedFile ? (
              <>
                <div className="p-2 border-b border-white/10 flex justify-between items-center">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {getBreadcrumbItems(selectedFile.path)}
                    </BreadcrumbList>
                  </Breadcrumb>
                  {isMarkdownFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">
                        {showMarkdown ? 'Preview' : 'Source'}
                      </span>
                      <Switch
                        checked={showMarkdown}
                        onCheckedChange={setShowMarkdown}
                        className="data-[state=checked]:bg-white/20"
                      />
                    </div>
                  )}
                </div>
                <div className="overflow-auto p-4" style={{ height: 'calc(100% - 37px)' }}>
                  {isMarkdownFile && showMarkdown ? (
                    <Suspense fallback={<div className="text-white/60">Loading markdown...</div>}>
                      <div className={cn(
                        // Base styles
                        "prose prose-invert max-w-none",
                        // Spacing and layout
                        "space-y-4",
                        // Headings
                        "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-white/10",
                        "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10",
                        "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-3",
                        "prose-h4:text-base prose-h4:font-bold prose-h4:mb-3",
                        // Text elements
                        "prose-p:text-white/90 prose-p:leading-7 prose-p:mb-4",
                        "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
                        "prose-strong:text-white prose-strong:font-semibold",
                        "prose-em:text-white/90 prose-em:italic",
                        // Code blocks
                        "prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:my-4",
                        "prose-code:text-white prose-code:bg-white/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono",
                        "prose-code:before:content-[''] prose-code:after:content-['']",
                        // Lists - Enhanced styling
                        "prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6",
                        "prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6",
                        "prose-li:text-white/90",
                        // Nested list styling
                        "[&_ul_ul]:mt-2 [&_ul_ol]:mt-2 [&_ol_ul]:mt-2 [&_ol_ol]:mt-2",
                        "[&_ul_ul]:mb-0 [&_ul_ol]:mb-0 [&_ol_ul]:mb-0 [&_ol_ol]:mb-0",
                        // List markers
                        "prose-ul:marker:text-white/50",
                        "prose-ol:marker:text-white/70",
                        // Blockquotes
                        "prose-blockquote:text-white/80 prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:bg-white/5",
                        "prose-blockquote:rounded-r prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:my-4",
                        // Tables
                        "prose-table:text-white/90 prose-table:border prose-table:border-white/10 prose-table:my-4",
                        "prose-th:bg-white/5 prose-th:text-white prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-white/10",
                        "prose-td:p-2 prose-td:border prose-td:border-white/10",
                        // Remove margin from first and last elements
                        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      )}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {selectedFile.content || ''}
                        </ReactMarkdown>
                      </div>
                    </Suspense>
                  ) : (
                    <SyntaxHighlighter
                      language={language}
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        background: 'transparent',
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'keep-all'
                      }}
                      showLineNumbers
                      lineNumberStyle={{
                        minWidth: '3em',
                        paddingRight: '1em',
                        color: 'rgba(255, 255, 255, 0.2)',
                      }}
                      wrapLongLines={true}
                      preserveWhitespace={true}
                    >
                      {selectedFile.content || ''}
                    </SyntaxHighlighter>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/60">
                <p>Select a file to view its contents</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 