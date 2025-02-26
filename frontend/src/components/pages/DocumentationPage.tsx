import { CodeIcon } from "lucide-react"
import { RepoViewer } from "@/components/ui/RepoViewer"
import type { TreeNode } from "@/components/ui/RepoViewer"
import { useEffect, useState } from "react"


export function Documentation() {
  const [docTree, setDocTree] = useState<TreeNode | undefined>()

  // In the future, this will fetch the actual documentation from your backend
  useEffect(() => {
    // Example of how you'll fetch the documentation later
    // const fetchDocs = async () => {
    //   try {
    //     const response = await fetch('/api/docs')
    //     const data = await response.json()
    //     setDocTree(data)
    //   } catch (error) {
    //     console.error('Failed to fetch documentation:', error)
    //   }
    // }
    // fetchDocs()
  }, [])

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
        <RepoViewer 
          data={docTree || []}
          className="rounded-lg border border-white/10"
          height="calc(100vh - 200px)"
        />
      </div>
    </div>
  )
}
