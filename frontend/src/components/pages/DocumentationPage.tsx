import { CodeViewer } from "@/components/ui/CodeViewer"
import { CodeIcon } from "lucide-react"

export function Documentation() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Documentation</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa <CodeIcon className="h-3 w-3" /> Documentation Viewer
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <CodeViewer 
          className="rounded-lg border border-white/10"
          leftPanelClassName="bg-black/40"
          rightPanelClassName="bg-black/40"
          breadcrumbClassName="text-white/60"
          fileItemHoverClassName="hover:bg-white/5"
          fileItemClassName="text-white/70"
          selectedFileClassName="bg-white/10 text-white"
          height="calc(100vh - 200px)"
        />
      </div>
    </div>
  )
}
