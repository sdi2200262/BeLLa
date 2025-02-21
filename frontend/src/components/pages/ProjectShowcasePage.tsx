import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  CircleDot
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LanguageBar } from "../ui/LanguageBar";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/colors";

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
}

interface Project {
  _id: string;
  repositoryUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export function ProjectShowcasePage() {
  const { projectName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // First, get all projects to find the matching URL
        const projectsResponse = await fetch('http://localhost:3001/api/projects');
        const projects: Project[] = await projectsResponse.json();
        
        // Find project by matching the repository name at the end of the URL
        const project = projects.find((p: Project) => {
          const urlParts = p.repositoryUrl.split('/');
          const repoName = urlParts[urlParts.length - 1].replace('.git', '');
          return repoName === projectName;
        });

        if (!project) {
          console.error('Project not found');
          return;
        }

        // Then fetch the detailed repository data
        const repoResponse = await fetch(`http://localhost:3001/api/projects/repo?url=${encodeURIComponent(project.repositoryUrl)}`);
        if (!repoResponse.ok) {
          throw new Error('Failed to fetch repository data');
        }
        const data = await repoResponse.json();
        setRepository(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (projectName) {
      fetchProjectData();
    }
  }, [projectName]);

  if (!repository) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading project data...</div>
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
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
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription className="text-white/70">
                  {repository.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </CardContent>
            </Card>

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

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Repository Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <GitBranch className="w-4 h-4" />
                    <span>Default branch: {repository.default_branch}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Scale className="w-4 h-4" />
                    <span>License: {repository.license?.name || "No license"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <GitCommit className="w-4 h-4" />
                    <span>Total commits: {repository.commitCount}</span>
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
                </CardContent>
              </Card>
            </div>
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