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
  Home
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LanguageBar } from "../ui/LanguageBar";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/colors";
import { CodeViewer } from "../ui/CodeViewer";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

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
  commitCount: number;
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

export function ProjectShowcasePage() {
  const { owner, repoName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

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
        
        const repoResponse = await fetch(`http://localhost:3001/api/projects/repo?url=${encodeURIComponent(repoUrl)}`);
        
        if (!repoResponse.ok) {
          const errorData = await repoResponse.json();
          throw new Error(errorData.error || 'Failed to fetch repository data');
        }
        
        const data = await repoResponse.json();
        console.log('Repository data received:', data);
        setRepository(data);
        setError(null);

        // Fetch file tree data
        const treeResponse = await fetch(`http://localhost:3001/api/projects/files?url=${encodeURIComponent(repoUrl)}`);
        if (!treeResponse.ok) {
          throw new Error('Failed to fetch file tree');
        }
        const treeData = await treeResponse.json();
        setRepository(prev => ({ ...prev!, fileTree: treeData }));
      } catch (error: any) {
        console.error('Error fetching repository:', error);
        setError(error.message || 'Failed to load project data');
        setRepository(null);
      }
    };

    fetchProjectData();
  }, [owner, repoName]);

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!selectedFile || !owner || !repoName || selectedFile === 'root') return;
      
      try {
        const repoUrl = `https://github.com/${owner}/${repoName}`;
        const response = await fetch(
          `http://localhost:3001/api/projects/content?url=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(selectedFile)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch file content');
        }
        
        const data = await response.json();
        setFileContent(data.content);
      } catch (error) {
        console.error('Error fetching file content:', error);
        setFileContent('Failed to load file content');
      }
    };

    fetchFileContent();
  }, [selectedFile, owner, repoName]);

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
                <Link to="/projects" className="text-white/60 hover:text-white">
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
        </div>
      

      {/* Header */}
      
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <img 
              src={repository.owner.avatar_url} 
              alt={repository.owner.login}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {repository.name}
                <a 
                  href={repository.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white"
                >
                  <LinkIcon className="w-4 h-4" />
                </a>
              </h1>
              <p className="text-white/60">by {repository.owner.login}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Repository Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-white/70">
                      <Star className="w-4 h-4" />
                      <span>{repository.stargazers_count} stars</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <GitFork className="w-4 h-4" />
                      <span>{repository.forks_count} forks</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Eye className="w-4 h-4" />
                      <span>{repository.watchers_count} watchers</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <AlertCircle className="w-4 h-4" />
                      <span>{repository.open_issues_count} issues</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/70">
                      <GitBranch className="w-4 h-4" />
                      <span>Default branch: {repository.default_branch}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Scale className="w-4 h-4" />
                    <span>License: {repository.license?.name || "No license"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>Created: {formatDate(repository.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {formatDate(repository.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>Last push: {formatDate(repository.pushed_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <GitCommit className="w-4 h-4" />
                    <span>Total commits: {repository.commitCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle>Languages</CardTitle>
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
            <Card className="bg-black/40 border-white/10">
              <CardContent className="p-0">
                <CodeViewer
                  className="rounded-lg"
                  data={fileTreeData}
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                  content={fileContent}
                  leftPanelClassName="bg-black/40"
                  rightPanelClassName="bg-black/40"
                  breadcrumbClassName="text-white/60"
                  fileItemHoverClassName="hover:bg-white/5"
                  fileItemClassName="text-white/70"
                  selectedFileClassName="bg-white/10 text-white"
                  height="calc(100vh - 300px)"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle>Contribution Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <Users className="w-4 h-4" />
                    <span>Contributors: Coming soon</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <GitCommit className="w-4 h-4" />
                    <span>Commits: {repository.commitCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/70 border-b border-white/10 last:border-0 pb-3">
                    <CircleDot className="w-4 h-4 text-white/40" />
                    <div className="flex-1">
                      <p className="text-sm">Commit activity data would go here</p>
                      <p className="text-xs text-white/40">Time information</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 