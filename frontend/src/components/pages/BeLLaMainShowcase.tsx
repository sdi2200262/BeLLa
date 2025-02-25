import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  GitFork,
  GitCommit,
  FileCode, 
  AlertCircle,
  GithubIcon,
  Code2,
  GitPullRequest,
  BookOpen,
  Users,
  Zap,
  Shield,
  Rocket,
  Check,
  Lightbulb,
  Database,
  Globe,
  Loader2, 
  MessageCircle,
  GraduationCap,
  HeartHandshake,
  Terminal
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { getLanguageColor } from "@/lib/colors";
import { RepoViewer } from "../ui/RepoViewer";
import { Button } from "../ui/button";
import { bellaProjects } from "@/config/bella-projects";
import { API_BASE_URL, defaultFetchOptions, handleResponse } from "@/config/api";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
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

export function BeLLaMainShowcasePage() {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState("project");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const project = bellaProjects[0];
        const repoUrl = project.repositoryUrl;
        
        const repoResponse = await fetch(
          `${API_BASE_URL}/projects/data?url=${encodeURIComponent(repoUrl)}`,
          {
            ...defaultFetchOptions,
            signal: AbortSignal.timeout(60000)
          }
        );
        
        const data = await handleResponse<ProjectResponse>(repoResponse);
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
        setError(error.message || 'Failed to load project data');
      }
    };

    fetchProjectData();
  }, []);

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
          <span>Loading BeLLa platform data...</span>
        </div>
      </div>
    );
  }

  const calculateLanguagePercentages = () => {
    const total = Object.values(repository.languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(repository.languages).map(([name, value]) => ({
      name,
      percentage: (value / total) * 100,
      color: getLanguageColor(name)
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb Navigation */}
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
                  BeLLa Platform
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
            <div className="space-y-4 max-w-3xl">
              <p className="text-2xl text-white/60">
                BeLLa is an open source collaborative development platform.
              </p>
            </div>

            <div className="flex items-center">
              <img src="/svg/BeLLa/CobuterMan.svg" alt="Man" className="size-26" />
              
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
              value="about"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-white rounded-lg py-2 px-1 mx-1"
            >
              About
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
                      Browse the BeLLa platform source code
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
            {/* Platform Philosophy */}
            <section className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Community Driven</h2>
              <div className="text-white/60 max-w-3xl mx-auto space-y-4">
                <ul className="space-y-2 list-none">
                  <li className="hover:text-white/80 transition-colors">
                    Share your own projects and get valuable feedback.
                  </li>
                  <li className="hover:text-white/80 transition-colors">
                    Contribute to existing projects and enrich your portfolio.
                  </li>
                </ul>
              </div>
            </section>

            {/* Core Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-4 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <Database className="w-6 h-6 text-[#0066FF]" />
                    <Code2 className="w-6 h-6 text-[#0066FF]" />
                  </div>
                  <CardTitle className="text-xl text-white">Technical Excellence</CardTitle>
                  <CardDescription className="text-white/60 text-md">
                    Built with modern web technologies and optimized for performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-[#0066FF] mt-6"/>
                      <div>
                        <h4 className="font-semibold text-white/80">Secure Authentication</h4>
                        <p className="text-sm text-white/60">GitHub OAuth integration for seamless and secure access.</p>
                        <p className="text-sm text-white/60">No private information is stored.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-[#0066FF] mt-6" />
                      <div>
                        <h4 className="font-semibold text-white/80">Backend Optimization</h4>
                        <p className="text-sm text-white/60">Smart caching and efficient resource management.</p>
                        <p className="text-sm text-white/60">Aiming for best user experience.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-4 bg-[#0066FF]/10 w-fit p-3 rounded-xl mb-4">
                    <Users className="w-6 h-6 text-[#0066FF]" />
                    <HeartHandshake className="w-6 h-6 text-[#0066FF]" />
                  </div>
                  <CardTitle className="text-xl text-white">Developer Focus</CardTitle>
                  <CardDescription className="text-white/60 text-md">
                    A platform that grows with its community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <GitPullRequest className="w-5 h-5 text-[#0066FF] mt-3" />
                      <div>
                        <h4 className="font-semibold text-white/80">Portfolio Enhancement</h4>
                        <p className="text-sm text-white/60">Make contributions to build up your developer profile</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-[#0066FF] mt-3" />
                      <div>
                        <h4 className="font-semibold text-white/80">Open Source</h4>
                        <p className="text-sm text-white/60">Transparent development and community-driven improvements</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
              
              {/* Smart Commenting System */}
              <Card className="bg-black/40 border-white/10 col-span-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-xl text-white">Smart Commenting System</CardTitle>
                      <CardDescription className="text-white/60 text-md">
                        Our flagship feature enables seamless collaboration through thread-based discussions and file-specific or code-specific comments.
                      </CardDescription>
                    </div>
                    <div className="bg-[#0066FF]/10 p-3 rounded-xl ml-auto">
                      <MessageCircle className="w-8 h-8 text-[#0066FF]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Thread-Based Discussions</h4>
                      <p className="text-sm text-white/60">
                        Collaborate on project issues and features with other developers.
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Code Context</h4>
                      <p className="text-sm text-white/60">
                        Comments are directly linked to relevant files or code sections for clear communication.
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Smart Notifications</h4>
                      <p className="text-sm text-white/60">
                        Get notified when a comment of yours has been replied to or if the Project has been updated.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Learning & Growth Section */}
            <Card className="bg-black/40 border-white/10 col-span-full mt-8">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-xl text-white">Perfect for Learning & Growth</CardTitle>
                    <CardDescription className="text-white/60 text-md">
                      An ideal environment for developers to practice and gain real-world experience
                    </CardDescription>
                  </div>
                  <div className="bg-[#0066FF]/10 p-3 rounded-xl ml-auto">
                    <GraduationCap className="w-8 h-8 text-[#0066FF]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Hands-on Experience</h4>
                    <p className="text-sm text-white/60">
                      Work with real codebases and gain practical experience in modern development workflows.
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Get Feedback</h4>
                    <p className="text-sm text-white/60">
                      Receive guidance and engage with experienced developers through the commenting system.
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Portfolio Building</h4>
                    <p className="text-sm text-white/60">
                      Build a strong portfolio with meaningful contributions to real projects.
                    </p>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-8">
            {/* Platform Overview */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Globe className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Platform Overview</CardTitle>
                    <CardDescription className="text-white/60">
                      How BeLLa Works
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">For Project Owners</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <GitFork className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Upload your GitHub projects to showcase them to the community</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Code2 className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Receive contextual feedback through the smart commenting system</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Build a community around your projects</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">For Contributors</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FileCode className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Browse projects and explore their source code</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <GitPullRequest className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Contribute through pull requests and enhance your portfolio</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-[#0066FF] " />
                        <p className="text-sm text-white/80">Get recognized for your contributions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Story */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <BookOpen className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">The Story Behind BeLLa</CardTitle>
                    <CardDescription className="text-white/60">
                      From Side Project to Developer Platform
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  BeLLa emerged from a simple observation during my CS studies: there is a big gap between 
                  academic knowledge and real-world development. I experimented with Web Dev to face real-world challenges
                  and experience real-world workflows.
                </p>
                <p className="text-white/80">
                This platform is a space where developers can learn by doing and contribute to meaningful projects.
                Gain much needed experience and enhance their portfolio. Important aspects of real-world development that are not taught in academia.
                </p>
              </CardContent>
            </Card>

            {/* Roadmap */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Rocket className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Platform Roadmap</CardTitle>
                    <CardDescription className="text-white/60">
                      My ideas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Release</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <p className="text-white/80">Smart commenting system with code context</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <p className="text-white/80">GitHub integration and project showcasing</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <p className="text-white/80">Contribution tracking</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Coming Soon</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#0066FF] mt-2" />
                        <p className="text-white/80">Enhanced collaboration tools with real-time updates</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#0066FF] mt-2" />
                        <p className="text-white/80">Advanced project analytics and insights</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#0066FF] mt-2" />
                        <p className="text-white/80">Integrated learning resources and tutorials</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contribute */}
          <TabsContent value="contribute" className="space-y-12">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Terminal className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Contribution Guide</CardTitle>
                    <CardDescription>Help improve BeLLa Platform</CardDescription>
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