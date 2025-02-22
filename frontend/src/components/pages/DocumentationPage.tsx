import { CodeIcon } from "lucide-react"
import { RepoViewer } from "@/components/ui/RepoViewer"
import type { TreeNode } from "@/components/ui/RepoViewer"
import { useEffect, useState } from "react"

// This is a temporary mock structure. Later, this will be fetched from your backend
const mockDocumentation: TreeNode = {
  path: "docs",
  name: "documentation",
  type: "tree" as const,
  children: [
    {
      path: "docs/getting-started",
      name: "getting-started",
      type: "tree" as const,
      children: [
        {
          path: "docs/getting-started/introduction.md",
          name: "introduction.md",
          type: "blob" as const,
          content: `# Introduction to BeLLa

Welcome to BeLLa documentation! This guide will help you get started with our platform.

## What is BeLLa?

BeLLa is a modern web application that helps developers showcase and document their projects effectively.

## Key Features

- Project Showcase
- Documentation Viewer
- GitHub Integration
- Modern UI/UX

## Getting Started

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run the development server`
        },
        {
          path: "docs/getting-started/installation.md",
          name: "installation.md",
          type: "blob" as const,
          content: `# Installation Guide

Follow these steps to set up BeLLa on your local machine.

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git

## Setup Instructions

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/BeLLa.git
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   cd BeLLa
   npm install
   \`\`\`

3. Configure environment variables:
   - Copy \`.env.example\` to \`.env\`
   - Update the values as needed

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\``
        }
      ]
    },
    {
      path: "docs/components",
      name: "components",
      type: "tree" as const,
      children: [
        {
          path: "docs/components/repo-viewer.md",
          name: "repo-viewer.md",
          type: "blob" as const,
          content: `# RepoViewer Component

The RepoViewer component is a lightweight and performant file tree viewer with syntax highlighting support.

## Usage

\`\`\`tsx
import { RepoViewer } from "@/components/ui/RepoViewer"

<RepoViewer
  data={fileTree}
  height="600px"
  className="rounded-lg"
/>
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| data | TreeNode | File tree structure |
| height | string | Component height |
| className | string | Additional CSS classes |

## Examples

Check out the Components Showcase page for live examples.`
        }
      ]
    },
    {
      path: "docs/api",
      name: "api",
      type: "tree" as const,
      children: [
        {
          path: "docs/api/endpoints.md",
          name: "endpoints.md",
          type: "blob" as const,
          content: `# API Endpoints

This document describes the available API endpoints in BeLLa.

## Projects

### GET /api/projects

Fetches a list of projects.

### GET /api/projects/:id

Fetches a specific project by ID.

### POST /api/projects

Creates a new project.

## Documentation

### GET /api/docs

Fetches the documentation tree structure.

### GET /api/docs/:path

Fetches specific documentation content.`
        }
      ]
    }
  ]
}

export function Documentation() {
  const [docTree, setDocTree] = useState<TreeNode | undefined>(mockDocumentation)

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
          data={docTree}
          className="rounded-lg border border-white/10"
          height="calc(100vh - 200px)"
        />
      </div>
    </div>
  )
}
