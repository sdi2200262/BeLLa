import React from "react"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb"
import { FolderIcon, FileIcon } from "lucide-react"
import { Switch } from "./switch"
import ReactMarkdown from "react-markdown"

interface FileViewerProps {
  className?: string
  content?: string
  contentClassName?: string
  language?: string
  filePath?: string[]
  breadcrumbClassName?: string
  switchProps?: React.ComponentPropsWithoutRef<typeof Switch>
}

// FileViewer component renders file content along with a breadcrumb navigation for the file path.
export const FileViewer: React.FC<FileViewerProps> = ({
  className = "",
  content = "",
  contentClassName = "",
  breadcrumbClassName = "",
  switchProps = {},
  language = "javascript",
  filePath = [],
}) => {
  const isReadme =
    filePath.length > 0 && filePath[filePath.length - 1].toLowerCase().startsWith("readme")
  const [showMarkdown, setShowMarkdown] = React.useState(false)

  React.useEffect(() => {
    if (!isReadme) {
      setShowMarkdown(false)
    }
  }, [filePath, isReadme])

  const handleSwitchChange = (checked: boolean) => {
    setShowMarkdown(checked)
    if (switchProps.onCheckedChange) {
      switchProps.onCheckedChange(checked)
    }
  }

  // Add truncated breadcrumbs helper (approx. after handleSwitchChange, around line 25)
  const displayPath =
    filePath.length > 3
      ? [filePath[0], "...", filePath[filePath.length - 1]]
      : filePath;

  return (
    <div className={cn("w-full h-full", className)}>
      
      <div className={cn("h-full border border-border rounded-r-md rounded-br-md overflow-auto flex flex-col", contentClassName)}>
        <div className="flex justify-between items-center border-b border-border px-4 py-2">
          <div className="flex items-center">
            {filePath.length > 0 ? (
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
            <div className="prose prose-invert h-full overflow-y-auto [&>*]:m-0">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
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
          )}
        </div>
      
      </div>
    </div>
  )
}

export default FileViewer
