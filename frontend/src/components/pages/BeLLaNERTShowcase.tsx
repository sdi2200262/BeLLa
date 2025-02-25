import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {  
  Scale, 
  FileCode, 
  AlertCircle,
  Link as LinkIcon,
  GitBranch,
  Loader2,
  GithubIcon,
  Code2,
  GitPullRequest,
  CheckCircle2,
  Terminal,
  Copy,
  BookOpen,
  Boxes,
  Rocket,
  Users,
  Layers, 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { getLanguageColor } from "@/lib/colors";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink
} from "../ui/breadcrumb";
import { API_BASE_URL, defaultFetchOptions, handleResponse } from "@/config/api";
import { Button } from "../ui/button";
import { bellaProjects } from "@/config/bella-projects";
import { RepoViewer } from "../ui/RepoViewer";
import CodeBlock from "../ui/CodeBlock";

interface Repository {
  name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  license: {
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  html_url: string;
  languages: { [key: string]: number };
  commit_count: number;
  fileTree?: any;
}

interface ProjectResponse {
  data: Repository;
  cached: boolean;
  cacheExpiry?: number;
}

interface FileTreeResponse {
  data: any;
  cached: boolean;
  cacheExpiry?: number;
}

export function BeLLaNERTShowcasePage() {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const project = bellaProjects[1]; // BeLLa-NERT is the second project
        const repoUrl = project.repositoryUrl;
        console.log('Fetching BeLLa-NERT repository data for:', repoUrl);
        
        const repoResponse = await fetch(
          `${API_BASE_URL}/projects/data?url=${encodeURIComponent(repoUrl)}`,
          {
            ...defaultFetchOptions,
            signal: AbortSignal.timeout(60000)
          }
        );
        
        const data = await handleResponse<ProjectResponse>(repoResponse);
        console.log('Repository data received:', data);
        setRepository(data.data);
        setError(null);

        const treeResponse = await fetch(
          `${API_BASE_URL}/projects/tree?url=${encodeURIComponent(repoUrl)}`,
          {
            ...defaultFetchOptions,
            signal: AbortSignal.timeout(60000)
          }
        );
        
        const treeData = await handleResponse<FileTreeResponse>(treeResponse);
        setRepository(prev => ({ ...prev!, fileTree: treeData.data }));
      } catch (error: any) {
        console.error('Error fetching repository:', error);
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(error.message || 'Failed to load project data');
        }
        setRepository(null);
      }
    };

    fetchProjectData();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };


  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading template data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Breadcrumb */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link to="/projects" className="text-white/60 hover:text-white transition-colors duration-300">
                  Projects
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">
                  BeLLa-NERT
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/20 via-purple-500/10 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative group">
              <img 
                src="/svg/BeLLa/BeLLa-NERT.svg"
                alt="BeLLa-NERT"
                className="size-50 transition-all duration-500 group-hover:scale-110"
              />
            </div>
            
            <div className="space-y-4 max-w-3xl">
              <p className="text-2xl text-white/60">
                Build Web Apps in minutes with a full-stack template.<br />
                One command setup. Easy to scale.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="bg-[#0066FF] hover:bg-[#0066FF]/60 text-white px-8"
                onClick={() => window.open(repository.html_url, '_blank')}
              >
                <GithubIcon className="w-5 h-5 mr-2" />
                Use Template
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-black hover:text-black hover:bg-white/70"
                onClick={() => setActiveTab("documentation")}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Documentation
              </Button>
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-8">
              <a href="https://nodejs.org/en" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Nodejs.svg" alt="Node.js" className="h-8" /></a>
              <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Express.svg" alt="Express" className="h-8" /></a>
              <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/React.svg" alt="React" className="h-8" /></a>
              <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/TypeScript.svg" alt="TypeScript" className="h-8" /></a>
              <a href="https://www.mongodb.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/MongoDB.svg" alt="MongoDB" className="h-8" /></a>
              <a href="https://www.mongoosejs.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Mongoose.svg" alt="Mongoose" className="h-8" /></a>
              <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Vite.svg" alt="Vite" className="h-8" /></a>
              <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Tailwind.svg" alt="Tailwind CSS" className="h-8" /></a>
              <a href="https://www.shadcn.com/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200"><img src="/svg/stack/Shadcn.svg" alt="shadcn" className="h-8" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          <TabsList className="grid grid-cols-4 bg-black/40 border border-white/10 rounded-xl h-12 w-full max-w-2xl mx-auto">
            <TabsTrigger 
              value="project" 
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white rounded-lg py-2 px-2 mx-3"
            >
              Project
            </TabsTrigger>
            <TabsTrigger 
              value="features" 
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white rounded-lg py-2 px-1 mx-1"
            >
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="setup"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white rounded-lg py-2 px-1 mx-1"
            >
              Setup
            </TabsTrigger>
            <TabsTrigger 
              value="contribute"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white rounded-lg py-2 px-1 mx-1"
            >
              Contribute
            </TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <FileCode className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Project Files</CardTitle>
                    <CardDescription className="text-white/60">
                      Browse the BeLLa-NERT template source code
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <RepoViewer
                  data={repository?.fileTree}
                  className="rounded-lg"
                  height="calc(100vh - 300px)"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-12">
            {/* Template Overview */}
            <section className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Quick Start Template</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Get started with web development quickly using our pre-configured template, perfect for beginners and experienced developers alike.
              </p>
            </section>

            {/* Feature Grid */}
            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <GitBranch className="w-6 h-6 text-[#0066FF]" />
                    <GithubIcon className="w-6 h-6 text-[#0066FF]" />
                  </div>
                  <CardTitle className="text-xl text-white">GitHub Template</CardTitle>
                  <CardDescription className="text-white/80">
                    Ready-to-use GitHub template repository for instant project setup.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <FileCode className="w-6 h-6 text-[#0066FF]" />
                    <img src="/svg/stack/Nodejs.svg" alt="Node.js" className="w-6 h-6 " />
                    <img src="/svg/stack/Express.svg" alt="Express" className="w-6 h-6 " />
                    <img src="/svg/stack/React.svg" alt="React" className="w-6 h-6 " />
                    <img src="/svg/stack/TypeScript.svg" alt="TypeScript" className="w-6 h-6 " />
                  </div>
                  <CardTitle className="text-xl text-white">Modern Stack</CardTitle>
                  <CardDescription className="text-white/80">
                    Pre-configured frontend and backend with TypeScript, React, and Express.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <Boxes className="w-6 h-6 text-[#0066FF]" />
                    <img src="/svg/stack/Shadcn.svg" alt="shadcn" className="w-6 h-6 " />
                  </div>
                  <CardTitle className="text-xl text-white">shadcn/ui Support</CardTitle>
                  <CardDescription className="text-white/80">
                    Import components from a complete UI library to kickstart your project.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <Terminal className="w-6 h-6 text-[#0066FF]" />
                    <code className="text-[#0066FF] font-mono">npm run dev</code>
                  </div>
                  <CardTitle className="text-xl text-white">One Command Setup</CardTitle>
                  <CardDescription className="text-white/80">
                     Ready to go! Just install the npm packages and run the development server.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <BookOpen className="w-6 h-6 text-[#0066FF]" />
                    <span className="text-[#0066FF] text-xs">(or ask ChatGPT...)</span>
                  </div>
                  <CardTitle className="text-xl text-white">Documentation</CardTitle>
                  <CardDescription className="text-white/80">
                    Thorough documentation to help you understand and extend the template.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-2 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <Code2 className="w-6 h-6 text-[#0066FF]" />
                    <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa" className="w-6 h-6 " />
                  </div>
                  <CardTitle className="text-xl text-white">BeLLa Components</CardTitle>
                  <CardDescription className="text-white/80">
                    Includes all the components from the BeLLa <a href="/components" className="text-[#0066FF]">Component Library</a>.
            
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Open Source - Free to Use */}
            <section className="mt-16">
              <Card className="bg-black/40 border-white/10">
                <div className="flex">
                  <CardHeader className="flex-1">
                    <CardTitle className="text-xl text-white">Open Source - Free to Use</CardTitle>
                    <CardDescription className="text-white/80">
                      This template uses the <a href="https://mit-license.org/" className="text-[#0066FF]">MIT License</a> - you can use it, modify it, and distribute it for any purpose free of charge.
                    </CardDescription>
                  </CardHeader>
                  <div className="flex items-center p-6">
                    <Scale className="w-16 h-16 text-[#0066FF] bg-[#0066FF]/20 rounded-xl p-2" />
                  </div>
                </div>
              </Card>
            </section>

            {/* Additional Benefits */}
            <section className="mt-16">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Perfect for Learning</CardTitle>
                  <CardDescription className="text-white/80">
                    Ideal for developers who are:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg mt-1">
                          <Users className="w-4 h-4 text-[#0066FF]" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">New to Web Development</h4>
                          <p className="text-sm text-white/60">
                            Start with a well-structured, modern codebase.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg mt-1">
                          <Rocket className="w-4 h-4 text-[#0066FF]" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Looking to Learn TypeScript</h4>
                          <p className="text-sm text-white/60">
                            Explore TypeScript in a real-world project setup.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg mt-1">
                          <Layers className="w-4 h-4 text-[#0066FF]" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Building Full-Stack Apps</h4>
                          <p className="text-sm text-white/60">
                            Learn to implement frontend to backend connections.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg mt-1">
                          <GitPullRequest className="w-4 h-4 text-[#0066FF]" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Want to Contribute</h4>
                          <p className="text-sm text-white/60">
                            Open source and welcoming to contributors.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="setup" className="space-y-12">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Terminal className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Quick Start Guide</CardTitle>
                    <CardDescription>Up and running in minutes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Use Template Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">1.</span> Use Template
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    In the top right corner of the template's <a href="https://github.com/BeLLa-AI/BeLLa-NERT" className="text-[#0066FF]">GitHub repository</a>, click the "Use Template" button and follow the instructions.
                  </p>
                </div>

                {/* Clone Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">2.</span> Clone Your Repository
                  </h3>
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="git clone your-repository-url" />
                </div>

                {/* Install Dependencies */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">3.</span> Install & Run
                  </h3>
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="npm install" />
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="npm run dev" />
                  <p className="text-sm text-white/60 mt-2">
                    That's it! Your development server will start, and you can begin coding.
                  </p>
                </div>

                {/* Next Steps */}
                <div className="mt-8 p-4 bg-[#0066FF]/5 rounded-lg border border-[#0066FF]/10">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-[#0066FF]" />
                    What's Next?
                  </h4>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>• Explore the example interface to see how everything connects</li>
                    <li>• Check out the documentation for detailed explanations</li>
                    <li>• Start building your own components using shadcn/ui</li>
                    <li>• Make improvements and contribute back to the template</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contribute" className="space-y-12">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Terminal className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Contribution Guide</CardTitle>
                    <CardDescription>Help improve BeLLa-NERT</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Clone Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">1.</span> Clone the Repository
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    First, clone the repository to your local machine:
                  </p>
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command={`git clone ${repository.html_url}`} />
                </div>

                {/* Create Branch Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">2.</span> Create a Branch
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    Create a new branch for your feature or bugfix:
                  </p>
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="git checkout -b feature/your-feature-name" />
                </div>

                {/* Make Changes Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">3.</span> Make Your Changes
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    Make your changes and commit them:
                  </p>
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="git add ." />
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command='git commit -m "Description of your changes"' />
                  <CodeBlock className="bg-[#0066FF]/5 border border-[#0066FF]/10" command="git push origin feature/your-feature-name" />
                </div>

                {/* Create PR Step */}
                <div className="space-y-2">
                  <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <span className="text-[#0066FF]">4.</span> Create Pull Request
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    Go to the GitHub repository and create a new pull request from your branch.
                  </p>
                </div>

                {/* Guidelines Box */}
                <div className="mt-8 p-4 bg-[#0066FF]/5 rounded-lg border border-[#0066FF]/10">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-[#0066FF]" />
                    Contribution Guidelines
                  </h4>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>• Follow the existing code style and conventions</li>
                    <li>• Write clear commit messages</li>
                    <li>• Include tests for new features</li>
                    <li>• Update documentation as needed</li>
                    <li>• Be respectful and constructive in discussions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 