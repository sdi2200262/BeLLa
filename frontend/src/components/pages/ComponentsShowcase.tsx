import { CodeIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { CodeViewer } from "../ui/CodeViewer";
import { ProjectCard } from "../ui/ProjectCard";
import { SearchBar } from "../ui/searchbar";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";

type ComponentSection = {
  id: string;
  title: string;
  description: string;
  component: JSX.Element;
  usage: JSX.Element;
};

// Mock file tree data structure for CodeViewer
const mockFileTree = [
  {
    id: "src",
    name: "src",
    children: [
      {
        id: "components",
        name: "components",
        children: [
          {
            id: "ui",
            name: "ui",
            children: [
              {
                id: "CodeViewer.tsx",
                name: "CodeViewer.tsx",
                content: `// CodeViewer.tsx
import { ResizablePanelGroup, ResizablePanel } from "./resizable"

interface CodeViewerProps {
  className?: string;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
  breadcrumbClassName?: string;
  fileItemHoverClassName?: string;
  fileItemClassName?: string;
  selectedFileClassName?: string;
  data?: any;
  selectedFile?: string | null;
  onSelect?: (id: string | null) => void;
  content?: string;
  height?: string;
}`
              },
              {
                id: "ProjectCard.tsx",
                name: "ProjectCard.tsx",
                content: `// ProjectCard.tsx
interface ProjectCardProps {
  publicRepoUrl: string;
  className?: string;
  cardClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  statsClassName?: string;
  languageBarClassName?: string;
  secondaryTextColor?: string;
  hoverScale?: string;
  iconSize?: number;
}`
              },
              {
                id: "SearchBar.tsx",
                name: "SearchBar.tsx",
                content: `// SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
  suggestions?: Array<{ id: string; text: string }>;
  onSuggestionClick?: (suggestion: { id: string; text: string }) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
  inputClassName?: string;
  suggestionsClassName?: string;
}`
              }
            ]
          }
        ]
      }
    ]
  }
];

export function ComponentsShowcase() {
  const [activeSection, setActiveSection] = useState<string>("codeviewer");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setSearchResults([
        { id: '1', text: 'Search Result 1' },
        { id: '2', text: 'Another Result' },
        { id: '3', text: `Matching "${query}"` },
      ]);
    } else {
      setSearchResults([]);
    }
  };

  const sections: ComponentSection[] = [
    {
      id: "codeviewer",
      title: "CodeViewer",
      description: "A powerful code viewer with file tree navigation and syntax highlighting.",
      component: (
        <div className="h-[400px]">
          <CodeViewer 
            className="rounded-lg border border-white/10"
            leftPanelClassName="bg-black/40"
            rightPanelClassName="bg-black/40"
            breadcrumbClassName="text-white/60"
            fileItemHoverClassName="hover:bg-white/5"
            fileItemClassName="text-white/70"
            selectedFileClassName="bg-white/10 text-white"
            height="100%"
            data={mockFileTree}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
            content={selectedFile || ""}
          />
        </div>
      ),
      usage: (
        <div className="space-y-4 text-white/80">
          <div>
            <p className="font-semibold mb-2">Basic Usage:</p>
            <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto text-white">
{`import { CodeViewer } from "@/components/ui/CodeViewer"

// Define your file tree data
const fileTree = [
  {
    id: "unique-id",
    name: "filename.tsx",
    children: [] // For directories
    content: "file content" // For files
  }
]

// Use the component
<CodeViewer
  data={fileTree}
  selectedFile={selectedFileId}
  onSelect={setSelectedFileId}
  height="400px"
  className="rounded-lg border"
/>`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-2">Props:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">data</code> - File tree structure</li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">selectedFile</code> - Currently selected file ID</li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">onSelect</code> - Callback when a file is selected</li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">height</code> - Component height (default: "600px")</li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">className</code> - Additional styling classes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "projectcard",
      title: "ProjectCard",
      description: "A dynamic card component for displaying GitHub repository information.",
      component: (
        <div className="grid md:grid-cols-2 gap-4">
          <ProjectCard
            publicRepoUrl="https://github.com/sdi2200262/BeLLa"
            className="w-full"
            cardClassName="bg-black/40 hover:bg-black/50 border-white/20 backdrop-blur-md"
            titleClassName="text-2xl font-bold"
            descriptionClassName="text-sm"
            statsClassName="grid-cols-2 gap-2"
            languageBarClassName="scale-90 origin-left"
            secondaryTextColor="text-white/60"
            hoverScale="hover:scale-[1.02] transition-all duration-300"
            iconSize={4}
          />
          <ProjectCard
            publicRepoUrl="https://github.com/sdi2200262/BeLLa-NERT"
            className="w-full"
            cardClassName="bg-black/40 hover:bg-black/50 border-white/20 backdrop-blur-md"
            titleClassName="text-2xl font-bold"
            descriptionClassName="text-sm"
            statsClassName="grid-cols-2 gap-2"
            languageBarClassName="scale-90 origin-left"
            secondaryTextColor="text-white/60"
            hoverScale="hover:scale-[1.02] transition-all duration-300"
            iconSize={4}
          />
        </div>
      ),
      usage: (
        <div className="space-y-4 text-white/80">
          <div>
            <p className="font-semibold mb-2">Basic Usage:</p>
            <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto text-white">
{`import { ProjectCard } from "@/components/ui/ProjectCard"

<ProjectCard
  publicRepoUrl="https://github.com/username/repo"
  className="w-full"
  cardClassName="bg-black/40 hover:bg-black/50"
  titleClassName="text-2xl font-bold"
  hoverScale="hover:scale-105"
/>`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-2">Features:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Automatic GitHub repository data fetching</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Language statistics visualization</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Star count and last update information</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Customizable styling through className props</code></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "searchbar",
      title: "SearchBar",
      description: "An advanced search bar with suggestions and dynamic filtering.",
      component: (
        <div className="space-y-8">
          <SearchBar
            size="lg"
            variant="outline"
            className="w-full backdrop-blur-md"
            inputClassName="text-white placeholder:text-white/50 pl-12 rounded-full bg-white/5 border-transparent focus:border-white transition-colors duration-200"
            suggestionsClassName="bg-white/[0.03] backdrop-blur-xl border-white/10 absolute w-full mt-1 rounded-xl shadow-lg overflow-hidden"
            placeholder="Try typing something..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            suggestions={searchResults}
            onSuggestionClick={(suggestion) => {
              setSearchQuery(suggestion.text);
              setSearchResults([]);
            }}
          />
          <div className="text-white/60 text-sm">
            Try typing to see live suggestions appear
          </div>
        </div>
      ),
      usage: (
        <div className="space-y-4 text-white/80">
          <div>
            <p className="font-semibold mb-2">Basic Usage:</p>
            <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto text-white">
{`import { SearchBar } from "@/components/ui/searchbar"

const [query, setQuery] = useState("")
const [suggestions, setSuggestions] = useState([])

<SearchBar
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onSearch={(value) => performSearch(value)}
  suggestions={suggestions}
  onSuggestionClick={(suggestion) => {
    setQuery(suggestion.text)
    setSuggestions([])
  }}
  size="lg"
  variant="outline"
/>`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-2">Features:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Real-time suggestions as you type</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Keyboard navigation support</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Customizable styling and variants</code></li>
              <li><code className="text-white bg-white/10 px-1.5 py-0.5 rounded">Debounced search to prevent excessive API calls</code></li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Components</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa's <CodeIcon className="h-3 w-3" /> Custom Components
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 h-[calc(100vh-4rem)] border-r border-white/10 p-4 bg-black/40 backdrop-blur-xl fixed left-0 overflow-y-auto">
          <div className="space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={`w-full justify-start text-left rounded-lg p-2 transition-colors duration-200 ${
                  activeSection === section.id 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pl-64">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`space-y-8 ${activeSection === section.id ? "" : "hidden"}`}
              >
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{section.title}</h2>
                  <p className="text-white/60 text-lg mb-8">{section.description}</p>
                </div>

                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Interactive Example</CardTitle>
                    <CardDescription className="text-white/60">
                      Try out the component below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.component}
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Usage</CardTitle>
                    <CardDescription className="text-white/60">
                      Learn how to use the component
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="prose prose-invert">
                    {section.usage}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 