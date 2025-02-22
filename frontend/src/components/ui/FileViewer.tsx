import React, { memo, useMemo, useCallback, lazy, Suspense } from "react"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb"
import { FolderIcon, FileIcon } from "lucide-react"
import { Switch } from "./switch"
import remarkGfm from 'remark-gfm'

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'))

interface FileViewerProps {
  className?: string
  content?: string
  contentClassName?: string
  language?: string
  filePath?: string[]
  breadcrumbClassName?: string
  switchProps?: React.ComponentPropsWithoutRef<typeof Switch>
}

// Memoized breadcrumb component
const FileBreadcrumb = memo(({ 
  displayPath, 
  breadcrumbClassName 
}: { 
  displayPath: string[], 
  breadcrumbClassName: string 
}) => (
  <Breadcrumb>
    <BreadcrumbList className={cn("text-muted-foreground", breadcrumbClassName)}>
      {displayPath.map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbItem className="text-sm">
            {item === "..." ? (
              <span>...</span>
            ) : index === displayPath.length - 1 ? (
              <BreadcrumbPage className={cn("flex items-center gap-1", "text-foreground", breadcrumbClassName)}>
                <FileIcon className="h-3 w-3" />
                {item}
              </BreadcrumbPage>
            ) : (
              <span className={cn("flex items-center gap-1", "text-muted-foreground", breadcrumbClassName)}>
                <FolderIcon className="h-3 w-3" />
                {item}
              </span>
            )}
          </BreadcrumbItem>
          {index < displayPath.length - 1 && (
            <BreadcrumbSeparator className={cn("text-muted-foreground", breadcrumbClassName)} />
          )}
        </React.Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
));

FileBreadcrumb.displayName = "FileBreadcrumb";

// Memoized syntax highlighter component
const CodeHighlighter = memo(({ 
  content, 
  language 
}: { 
  content: string, 
  language: string 
}) => (
  <SyntaxHighlighter
    language={language}
    style={tomorrow}
    customStyle={{
      backgroundColor: "transparent",
      color: "inherit",
      fontFamily: "inherit",
      padding: 0,
    }}
    showLineNumbers={true}
    lineNumberStyle={{
      minWidth: "2em",
      paddingRight: "1em",
      textAlign: "right",
      userSelect: "none",
      opacity: "0.5",
    }}
  >
    {content}
  </SyntaxHighlighter>
));

CodeHighlighter.displayName = "CodeHighlighter";

// Memoized markdown renderer component
const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <Suspense fallback={<div>Loading markdown...</div>}>
    <div className={cn(
      // Base prose settings
      "prose prose-invert max-w-none",
      // Headings
      "prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-white/10",
      "prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10",
      "prose-h3:text-xl prose-h3:font-bold prose-h3:mb-3",
      "prose-h4:text-lg prose-h4:font-bold prose-h4:mb-3",
      // Text elements
      "prose-p:text-white/90 prose-p:leading-7 prose-p:mb-4",
      "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
      "prose-strong:text-white prose-strong:font-semibold",
      "prose-em:text-white/90 prose-em:italic",
      // Code blocks
      "prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg",
      "prose-code:text-white prose-code:bg-white/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']",
      // Lists
      "prose-ul:text-white/90 prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-6",
      "prose-ol:text-white/90 prose-ol:mb-4 prose-ol:list-decimal prose-ol:pl-6",
      "prose-li:text-white/90 prose-li:mb-2 prose-li:marker:text-white/50",
      // Blockquotes
      "prose-blockquote:text-white/80 prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:bg-white/5 prose-blockquote:rounded-r prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:mb-4",
      // Horizontal rules
      "prose-hr:border-white/10 prose-hr:my-8",
      // Tables
      "prose-table:text-white/90 prose-table:border prose-table:border-white/10 prose-table:mb-4",
      "prose-th:bg-white/5 prose-th:text-white prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-white/10",
      "prose-td:p-2 prose-td:border prose-td:border-white/10",
      // Images
      "prose-img:rounded-lg prose-img:shadow-lg prose-img:mb-4",
      // Remove margin from first and last elements
      "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      // Task lists
      "[&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:pl-0",
      "[&_ul.contains-task-list_li]:flex [&_ul.contains-task-list_li]:items-start [&_ul.contains-task-list_li]:gap-2",
      "[&_ul.contains-task-list_li_input]:mt-1"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={tomorrow}
                PreTag="div"
                customStyle={{
                  margin: '1em 0',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: "2em",
                  paddingRight: "1em",
                  textAlign: "right",
                  userSelect: "none",
                  opacity: "0.3",
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn(
                "bg-white/10 rounded px-1.5 py-0.5 text-sm",
                className
              )} {...props}>
                {children}
              </code>
            )
          },
          // Ensure links open in new tab
          a({ href, children }) {
            return (
              <a 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {children}
              </a>
            );
          },
          // Style task list items
          li({ children, className }) {
            if (className === 'task-list-item') {
              return (
                <li className="flex items-start gap-2 pl-0">
                  {children}
                </li>
              );
            }
            return <li>{children}</li>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  </Suspense>
));

MarkdownRenderer.displayName = "MarkdownRenderer";

// FileViewer component renders file content along with a breadcrumb navigation for the file path.
export const FileViewer: React.FC<FileViewerProps> = memo(({
  className = "",
  content = "",
  contentClassName = "",
  breadcrumbClassName = "",
  switchProps = {},
  language = "plaintext",
  filePath = [],
}) => {
  const isReadme = useMemo(() => 
    filePath.length > 0 && filePath[filePath.length - 1].toLowerCase().startsWith("readme"),
    [filePath]
  );

  const [showMarkdown, setShowMarkdown] = React.useState(isReadme);

  React.useEffect(() => {
    if (!isReadme) {
      setShowMarkdown(false);
    } else {
      setShowMarkdown(true);
    }
  }, [filePath, isReadme]);

  const handleSwitchChange = useCallback((checked: boolean) => {
    setShowMarkdown(checked);
    if (switchProps.onCheckedChange) {
      switchProps.onCheckedChange(checked);
    }
  }, [switchProps]);

  const displayPath = useMemo(() =>
    filePath.length > 3
      ? [filePath[0], "...", filePath[filePath.length - 1]]
      : filePath,
    [filePath]
  );

  return (
    <div className={cn("w-full h-full", className)}>
      <div className={cn("h-full border border-border rounded-r-md rounded-br-md overflow-auto flex flex-col", contentClassName)}>
        <div className="flex justify-between items-center border-b border-border px-4 py-2">
          <div className="flex items-center">
            {filePath.length > 0 ? (
              <FileBreadcrumb displayPath={displayPath} breadcrumbClassName={breadcrumbClassName} />
            ) : (
              <h2 className={cn("text-sm font-medium text-foreground", breadcrumbClassName)}>
                No file selected
              </h2>
            )}
          </div>
          <div className="flex items-center">
            {isReadme && (
              <div className="flex items-center gap-2">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/markdown/markdown-original.svg" className="w-4 h-4" />
                <Switch 
                  checked={showMarkdown}
                  onCheckedChange={handleSwitchChange}
                  {...switchProps}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {isReadme && showMarkdown ? (
            <MarkdownRenderer content={content} />
          ) : (
            <CodeHighlighter content={content} language={language} />
          )}
        </div>
      </div>
    </div>
  );
});

FileViewer.displayName = "FileViewer";

export default FileViewer;
