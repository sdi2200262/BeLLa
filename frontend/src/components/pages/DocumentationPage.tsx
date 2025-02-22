import { CodeViewer } from "@/components/ui/CodeViewer"
import { CodeIcon } from "lucide-react"

export function Documentation() {
  return (
    <div className="flex flex-col h-screen">
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4">

            <h1 className="text-3xl font-bold">Documentation</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Using BeLLa <a href="/components/CodeViewer" className="hover:text-white transition-colors duration-100 flex items-center gap-1">CodeViewer <CodeIcon className="h-3 w-3" /></a>
            </div>
          </div>
        </div>
      
      
        <div className="flex-1 p-4">
          <CodeViewer 
            className="h-full border border-white/10 rounded-lg"
            fileItemHoverClassName="hover:bg-accent"
            fileItemClassName="text-muted-foreground"
            selectedFileClassName="bg-accent text-accent-foreground"
            breadcrumbClassName="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
