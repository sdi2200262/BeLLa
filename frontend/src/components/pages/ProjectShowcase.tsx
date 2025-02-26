import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Star, 
  GitFork, 
  Scale, 
  GitCommit, 
  FileCode, 
  Clock, 
  Users, 
  Eye, 
  AlertCircle,
  Link as LinkIcon,
  GitBranch,
  CircleDot,
  Loader2,
  Home,
  GithubIcon,
  Code2,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Terminal,
  Copy,
  Check,
  Heart
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LanguageBar } from "../ui/LanguageBar";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/colors";
import { RepoViewer } from "../ui/RepoViewer";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { API_BASE_URL, defaultFetchOptions, handleResponse } from "@/config/api";
import { Button } from "../ui/button";
import CodeBlock from "../ui/CodeBlock";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

interface Project {
  _id: string;
  repositoryUrl: string;
  uploadedBy: string;
  createdAt: string;
}

interface FileNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: FileNode[];
  content?: string;
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

export function ProjectShowcasePage() {
  const { owner, repoName } = useParams();
  const { user, getAuthToken } = useAuth();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Transform GitHub tree data to FileSelector format
  const transformTreeData = (node: any): FileNode => {
    return {
      id: node.path || node.id,
      name: node.name,
      isFolder: node.type === 'tree',
      children: node.children?.map(transformTreeData),
    };
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!owner || !repoName) {
          throw new Error('Repository information is incomplete');
        }

        const repoUrl = `https://github.com/${owner}/${repoName}`;
        console.log('Fetching repository data for:', repoUrl);
        
        // First, try to get the project ID
        try {
          const projectResponse = await fetch(
            `${API_BASE_URL}/projects?search=${encodeURIComponent(repoUrl)}`,
            {
              ...defaultFetchOptions,
              signal: AbortSignal.timeout(30000)
            }
          );
          
          const projectData = await handleResponse<{ projects: Project[] }>(projectResponse);
          if (projectData.projects && projectData.projects.length > 0) {
            const project = projectData.projects[0];
            setProjectId(project._id);
            
            // If user is logged in, fetch like status
            if (user) {
              await fetchLikeStatus(project._id);
            }
          }
        } catch (error) {
          console.error('Error fetching project ID:', error);
          // Continue even if we can't get the project ID
        }
        
        const repoResponse = await fetch(
          `${API_BASE_URL}/projects/data?url=${encodeURIComponent(repoUrl)}`,
          {
            ...defaultFetchOptions,
            signal: AbortSignal.timeout(60000) // 60 second timeout
          }
        );
        
        const data = await handleResponse<ProjectResponse>(repoResponse);
        console.log('Repository data received:', data);
        setRepository(data.data);
        setError(null);

        // Fetch file tree data
        const treeResponse = await fetch(
          `${API_BASE_URL}/projects/tree?url=${encodeURIComponent(repoUrl)}`,
          {
            ...defaultFetchOptions,
            signal: AbortSignal.timeout(60000) // 60 second timeout
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
  }, [owner, repoName, user]);

  // Fetch like status for a project
  const fetchLikeStatus = async (id: string) => {
    if (!user) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/likes/${id}`, {
        ...defaultFetchOptions,
        headers: {
          ...defaultFetchOptions.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        } as HeadersInit
      });
      
      const data = await handleResponse<{ liked: boolean; likeCount: number }>(response);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  // Handle like button click
  const handleLikeClick = async () => {
    if (!user) {
      toast.error("Please sign in to like projects");
      return;
    }
    
    if (!projectId) {
      toast.error("This project hasn't been added to BeLLa yet");
      return;
    }
    
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/likes/${projectId}`, {
        method: 'POST',
        ...defaultFetchOptions,
        headers: {
          ...defaultFetchOptions.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        } as HeadersInit
      });
      
      const data = await handleResponse<{ liked: boolean; likeCount: number }>(response);
      
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      
      toast.success(data.liked ? "Added to your liked projects" : "Removed from your liked projects");
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");
    } finally {
      setIsLikeLoading(false);
    }
  };

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!selectedFile || !owner || !repoName || selectedFile === 'root') return;
      
      try {
        const repoUrl = `https://github.com/${owner}/${repoName}`;
        const response = await fetch(
          `${API_BASE_URL}/projects/content?url=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(selectedFile)}`,
          defaultFetchOptions
        );
        
        const data = await handleResponse<{ content: string }>(response);
        setFileContent(data.content);
      } catch (error: any) {
        console.error('Error fetching file content:', error);
        setFileContent('Failed to load file content');
      }
    };

    fetchFileContent();
  }, [selectedFile, owner, repoName]);

  // Add this new function for copying text
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  // Add this new component for command blocks with copy button
  const CommandBlock = ({ command }: { command: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      const success = await copyToClipboard(command);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className="mt-3 bg-black/40 rounded-lg flex items-center">
        <div className="flex-1 p-4 font-mono text-sm text-white/80">
          {command}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 h-8 w-8 text-white/60 hover:text-[#0066FF] hover:bg-[#0066FF]/10 transition-all duration-300"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
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
          <span>Loading project data...</span>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Transform the file tree data before passing it to CodeViewer
  const fileTreeData = repository.fileTree ? [transformTreeData(repository.fileTree)] : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Breadcrumb Navigation */}
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
                  {repository.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img 
                  src={repository.owner.avatar_url} 
                  alt={repository.owner.login}
                  className="w-16 h-16 rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-[#0066FF]"
                />
                <div className="absolute -bottom-2 -right-2 bg-[#0066FF]/10 p-2 rounded-full ring-2 ring-black transition-all duration-300 group-hover:bg-[#0066FF]/20">
                  <GithubIcon className="w-4 h-4 text-[#0066FF]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  {repository.name}
                  <a 
                    href={repository.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-[#0066FF] transition-colors duration-300"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </a>
                </h1>
                <p className="text-white/60">by {repository.owner.login}</p>
              </div>
            </div>
            
            {/* Like Button */}
            {projectId && (
              <Button 
                variant="outline" 
                className={cn(
                  "transition-all duration-300 gap-2",
                  liked ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20 hover:bg-[#FF3366]/20 hover:border-[#FF3366]/30" 
                       : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
                onClick={handleLikeClick}
                disabled={isLikeLoading}
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    liked ? "fill-[#FF3366] text-[#FF3366]" : "",
                    isLikeLoading ? "animate-pulse" : ""
                  )} 
                />
                {liked ? "Liked" : "Like"}
                {likeCount > 0 && (
                  <span className={cn(
                    "ml-1 text-sm bg-black/20 px-2 py-0.5 rounded-full",
                    liked ? "text-[#FF3366]" : "text-white/70"
                  )}>
                    {likeCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="w-full justify-start bg-black/40 border border-white/10 rounded-lg p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all duration-200"
            >
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all duration-200"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger 
              value="contribute"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 transition-all duration-200"
            >
              Contribute
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Repository Info Card */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                      <GithubIcon className="text-[#0066FF] w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl text-white">Repository Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {repository.stargazers_count}
                        </div>
                        <div className="text-sm text-white/60">Stars</div>
                      </div>
                      <Star className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {repository.forks_count}
                        </div>
                        <div className="text-sm text-white/60">Forks</div>
                      </div>
                      <GitFork className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {repository.watchers_count}
                        </div>
                        <div className="text-sm text-white/60">Watchers</div>
                      </div>
                      <Eye className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-white group-hover:text-[#FF3366] transition-colors duration-300">
                          {likeCount}
                        </div>
                        <div className="text-sm text-white/60">Likes</div>
                      </div>
                      <Heart className={cn(
                        "absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#FF3366]/5 transition-colors duration-300",
                        liked ? "fill-[#FF3366]/5" : ""
                      )} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/70">
                      <GitBranch className="w-4 h-4 text-[#0066FF]" />
                      <span>Default branch: {repository.default_branch}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Scale className="w-4 h-4 text-[#0066FF]" />
                      <span>License: {repository.license?.name || "No license"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <GitCommit className="w-4 h-4 text-[#0066FF]" />
                      <span>Total commits: {repository.commit_count?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                      <Clock className="text-[#0066FF] w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl text-white  ">Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="flex items-center gap-2 text-white/70">
                        <Clock className="w-4 h-4 text-[#0066FF]" />
                        <div>
                          <div className="text-sm text-white/60">Created</div>
                          <div className="text-white">{formatDate(repository.created_at)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="flex items-center gap-2 text-white/70">
                        <Clock className="w-4 h-4 text-[#0066FF]" />
                        <div>
                          <div className="text-sm text-white/60">Last Updated</div>
                          <div className="text-white">{formatDate(repository.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                      <div className="flex items-center gap-2 text-white/70">
                        <Clock className="w-4 h-4 text-[#0066FF]" />
                        <div>
                          <div className="text-sm text-white/60">Last Push</div>
                          <div className="text-white">{formatDate(repository.pushed_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Languages Card */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <FileCode className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl text-white">Languages</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <LanguageBar 
                  languages={calculateLanguagePercentages()} 
                  className="w-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardContent className="p-0">
                <RepoViewer
                  data={repository.fileTree}
                  className="rounded-lg"
                  height="calc(100vh - 300px)"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <Users className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl text-white">Contribution Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-center gap-2 text-white/70">
                      <Users className="w-4 h-4 text-[#0066FF]" />
                      <span>Contributors: Coming soon</span>
                    </div>
                  </div>
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-center gap-2 text-white/70">
                      <GitCommit className="w-4 h-4 text-[#0066FF]" />
                      <span>Commits: {repository.commit_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contribute" className="space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <GitPullRequest className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">How to Contribute</CardTitle>
                    <CardDescription className="text-white/60">
                      Follow these steps to contribute to {repository.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Step 1: Clone */}
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                        <Code2 className="text-[#0066FF] w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-white">1. Clone the Repository</h3>
                        <p className="text-white/60">First, clone the repository to your local machine:</p>
                        <CodeBlock command={`git clone ${repository.html_url}`} />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Branch */}
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                        <GitBranch className="text-[#0066FF] w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-white">2. Create a Branch</h3>
                        <p className="text-white/60">Create a new branch for your feature or fix:</p>
                        <CodeBlock command="git checkout -b feature/your-feature-name" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Make Changes */}
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                        <Terminal className="text-[#0066FF] w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-white">3. Make Your Changes</h3>
                        <p className="text-white/60">Make and commit your changes:</p>
                        <div className="mt-3 space-y-2">
                          <CodeBlock command="git add ." />
                          <CodeBlock command='git commit -m "Description of your changes"' />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Push & PR */}
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                        <GitPullRequest className="text-[#0066FF] w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-white">4. Push and Create Pull Request</h3>
                        <p className="text-white/60">Push your changes and create a pull request:</p>
                        <CodeBlock command="git push origin feature/your-feature-name" />
                        <p className="text-white/60 mt-3">Then visit {repository.html_url} to create a pull request.</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Process */}
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                        <CheckCircle2 className="text-[#0066FF] w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-white">Review Process</h3>
                        <p className="text-white/60">After submitting your pull request:</p>
                        <ul className="mt-3 space-y-2 text-white/60">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                            The repository owner will review your changes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                            You may receive feedback requesting changes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                            Once approved, your changes will be merged
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 