import { useEffect, useState, useCallback } from "react";
import { CodeIcon, Plus, Trash2, Loader2, AlertCircle, UserIcon, GitForkIcon, GitPullRequestIcon, BookIcon, X } from "lucide-react";
import { ProjectCard } from "../ui/ProjectCard";
import { SearchBar } from "../ui/searchbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { bellaProjects } from "@/config/bella-projects";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { GithubIcon } from "lucide-react";
import { API_BASE_URL, defaultFetchOptions, handleResponse, APIError } from "@/config/api";
import { useLikes } from '@/contexts/LikeContext';

interface Project {
  _id: string;
  repositoryUrl: string;
  uploadedBy: string;
  createdAt: string;
  status: string;
  likeCount?: number;
  liked?: boolean;
}

interface ProjectsResponse {
  projects: Project[];
  limits: {
    projectsPerUser: number;
    remaining: number;
  };
}

interface PaginatedResponse {
  projects: Project[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    hasMore: boolean;
  };
  limits: {
    projectsPerUser: number;
    cacheTime: number;
  };
  cached: boolean;
}

interface RepoSuggestion {
  id: string;
  text: string;
  description?: string;
}

export function ProjectsPage() {
  const { user, logout, getAuthToken } = useAuth();
  const { refreshLikes } = useLikes();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bella");
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [repoSuggestions, setRepoSuggestions] = useState<RepoSuggestion[]>([]);
  const [projectLimits, setProjectLimits] = useState({
    total: 0,
    remaining: 0
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInputValue);
      setCurrentPage(1);
    }
  };

  const fetchUserProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For community projects tab, we don't need authentication
      const response = await fetch(`${API_BASE_URL}/projects`, {
        ...defaultFetchOptions,
        signal: AbortSignal.timeout(60000)
      });

      const data = await handleResponse<PaginatedResponse>(response);
      const projects = data.projects || [];
      
      // If user is logged in, fetch like status for each project
      if (user && projects.length > 0) {
        try {
          // Filter out any invalid project IDs (must be 24 hex characters)
          const projectIds = projects
            .map(p => p._id)
            .filter(id => {
              const isValid = id && /^[0-9a-fA-F]{24}$/.test(id);
              if (!isValid) {
                console.warn(`Skipping invalid project ID in user projects: ${id}`);
              }
              return isValid;
            });
          
          // Only fetch likes if we have valid project IDs
          if (projectIds.length > 0) {
            // Use a debounce mechanism to prevent excessive refreshes
            const refreshKey = projectIds.sort().join(',');
            const now = Date.now();
            const lastRefresh = (window as any)._projectsPageLikeRefreshTime || 0;
            
            if (now - lastRefresh > 5000) { // Only refresh if it's been more than 5 seconds
              (window as any)._projectsPageLikeRefreshTime = now;
              
              // Use the refreshLikes function from LikeContext
              await refreshLikes(projectIds);
            } else {
              console.log('Skipping projects page likes refresh - too soon since last refresh');
            }
          }
          
          // Always set the projects, even if we couldn't refresh likes
          setUserProjects(projects);
        } catch (error) {
          console.error('Error fetching like data:', error);
          // Continue with projects without like data
          setUserProjects(projects);
        }
      } else {
        setUserProjects(projects);
      }
      
      setTotalPages(data.pagination?.pages || 1);
      setTotalProjects(data.pagination?.total || 0);
      
      // Only set project limits if user is logged in
      if (user) {
        setProjectLimits({
          total: data.limits.projectsPerUser,
          remaining: data.limits.projectsPerUser - (data.projects?.length || 0)
        });
      }
      
      // Mark that we've done the initial fetch
      setHasInitialFetch(true);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Failed to fetch projects');
      
      if (error.message?.includes('sign in') || error.message?.includes('session expired')) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects on mount - but only once
  useEffect(() => {
    if (!hasInitialFetch) {
      fetchUserProjects();
    }
  }, []);

  // Re-fetch when tab changes
  useEffect(() => {
    if (activeTab === 'user') {
      fetchUserProjects();
    } else if (activeTab === 'bella') {
      setCurrentPage(1);
      setSearchQuery('');
      setSearchInputValue('');
      setError(null);
    }
  }, [activeTab]);

  // Re-fetch when search query changes
  useEffect(() => {
    if (activeTab === 'user' && searchQuery && hasInitialFetch) {
      fetchUserProjects();
    }
  }, [searchQuery]);

  const handleAddProject = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newProjectUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required to add projects');
      }

      const response = await fetch(`${API_BASE_URL}/projects`, {
        ...defaultFetchOptions,
        method: 'POST',
        headers: {
          ...defaultFetchOptions.headers,
          'Authorization': `Bearer ${token}`
        } as HeadersInit,
        body: JSON.stringify({
          repositoryUrl: newProjectUrl.trim()
        }),
        signal: AbortSignal.timeout(60000)
      });

      const data = await handleResponse<{ project: Project; limits: { projectsPerUser: number; remaining: number } }>(response);

      // Only reset form and redirect if project was successfully added
      setNewProjectUrl('');
      setShowAddProject(false);
      setError(null);
      navigate('/profile');

    } catch (error: any) {
      console.error('Error adding project:', error);
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        setError('Operation timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to add project');
      }
      
      if (error.message?.includes('sign in') || error.message?.includes('session expired')) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate repo suggestions based on user's GitHub repos
  const generateRepoSuggestions = useCallback((input: string) => {
    if (!input || !user?.repos || input.length < 2) {
      setRepoSuggestions([]);
      return;
    }

    const suggestions = user.repos
      .filter(repo => {
        const searchLower = input.toLowerCase();
        return (
          repo.name.toLowerCase().includes(searchLower) ||
          repo.full_name.toLowerCase().includes(searchLower) ||
          repo.html_url.toLowerCase().includes(searchLower)
        );
      })
      .map(repo => ({
        id: repo.id.toString(),
        text: repo.html_url,
        description: repo.description
      }))
      .slice(0, 5);

    setRepoSuggestions(suggestions);
  }, [user?.repos]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa's <CodeIcon className="h-3 w-3" /> Project Management System
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-12 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Browse Projects</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Explore BeLLa's official repositories or add your own projects to showcase your work to the community.
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{bellaProjects.length}</div>
              <div className="text-sm text-white/60">Official Projects</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{userProjects.length}</div>
              <div className="text-sm text-white/60">Community Projects</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setShowAddProject(!showAddProject);
                setActiveTab('user');
              }}
              className={cn(
                "transition-all duration-300 px-6",
                showAddProject 
                  ? "bg-white/5 text-white hover:text-white hover:bg-white/10" 
                  : "bg-[#0066FF] text-white hover:text-white hover:bg-[#0066FF]/60"
              )}
            >
              {showAddProject ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {user ? 'Add Project' : 'Sign in to Add Project'}
                </>
              )}
            </Button>
            
            {user && (
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="bg-white/5 text-white hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                View Your Projects
              </Button>
            )}
          </div>
        </div>

        {/* New Add Project UI */}
        {showAddProject && (
          <div className="transform transition-all duration-300 ease-in-out mb-8">
            <div className="border border-white/10 bg-black/40 backdrop-blur-xl p-[1px] rounded-2xl">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl">
                <div className="p-8">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#0066FF]">
                        <GithubIcon className="w-5 h-5" />
                        <h3 className="text-lg font-medium">Add GitHub Repository</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Enter the URL of your GitHub repository to add it to the community projects.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <SearchBar
                          placeholder="https://github.com/username/repository"
                          value={newProjectUrl}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewProjectUrl(value);
                            generateRepoSuggestions(value);
                          }}
                          onFocus={() => {
                            if (user?.repos) {
                              const suggestions = user.repos
                                .map(repo => ({
                                  id: repo.id.toString(),
                                  text: repo.html_url,
                                  description: repo.description || undefined
                                }));
                              setRepoSuggestions(suggestions);
                            }
                          }}
                          onSearch={(value) => {
                            setNewProjectUrl(value);
                          }}
                          suggestions={repoSuggestions}
                          onSuggestionClick={(suggestion) => {
                            setNewProjectUrl(suggestion.text);
                          }}
                          className="w-full"
                          inputClassName={cn(
                            "bg-white/5 text-white border-white/10 rounded-xl pl-10 pr-4 py-6 text-sm",
                            "transition-all duration-300",
                            "focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          suggestionsClassName="bg-black/95 backdrop-blur-xl border-white/10 absolute w-full mt-1 rounded-xl shadow-lg overflow-hidden z-[9999]"
                          disabled={isSubmitting}
                          hideSearchIcon={true}
                          showSuggestionsOnFocus={true}
                          minCharacters={0}
                        />
                        <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-20" />
                      </div>
                      <Button
                        onClick={handleAddProject}
                        disabled={isSubmitting}
                        className="bg-[#0066FF] text-white hover:bg-[#0066FF]/60 transition-all duration-300 px-8 rounded-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Repository'
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <AlertCircle className="w-4 h-4" />
                        <span>Make sure your repository is public and contains a valid GitHub URL</span>
                      </div>
                      {user?.repos && (
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <BookIcon className="w-4 h-4" />
                          <span>Click on the input field to see your available repositories</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-2 backdrop-blur-md max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Rest of the content (Tabs, etc.) */}
        <Tabs defaultValue="bella" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 bg-black/40 border border-white/10 rounded-lg p-1">
            <TabsTrigger 
              value="bella" 
              className="data-[state=active]:bg-white/10 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa" className="w-4 h-4" />
                BeLLa Projects
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="user" 
              className="data-[state=active]:bg-white/10 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <CodeIcon className="w-4 h-4" />
                Community Projects
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bella" className="mt-8">
            <div className="columns-3 gap-4">
              {bellaProjects.map((project, index) => {
                // Get route based on project index
                const route = index === 0 ? '/projects/bella/main' : '/projects/bella/nert';
                return (
                  <div key={index} className="break-inside-avoid inline-block w-full align-top mb-4">
                    <ProjectCard
                      publicRepoUrl={project.repositoryUrl}
                      className="w-full"
                      cardClassName="bg-black/40 hover:bg-black/50 border-white/20 backdrop-blur-md h-fit"
                      titleClassName="text-2xl font-bold"
                      descriptionClassName="text-sm"
                      statsClassName="grid-cols-2 gap-2"
                      languageBarClassName="scale-90 origin-left"
                      secondaryTextColor="text-white/60"
                      hoverScale="hover:scale-[1.02] transition-all duration-300"
                      iconSize={4}
                      onClick={() => navigate(route)}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="user" className="mt-8">
            {/* Enhanced Search Bar Section */}
            <div className="relative mb-8">
              <SearchBar
                size="lg"
                variant="outline"
                className="w-full max-w-2xl mx-auto backdrop-blur-md"
                inputClassName={cn(
                  "text-white placeholder:text-white/50 pl-12",
                  "bg-white/5 border-white/10",
                  "transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]",
                  "focus-visible:border-[#0066FF]",
                  "hover:border-white/20",
                  "rounded-xl"
                )}
                suggestionsClassName="bg-black/80 backdrop-blur-xl border-white/10 absolute w-full mt-1 rounded-xl shadow-lg overflow-hidden z-[9999]"
                placeholder="Search community projects..."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                }}
                onSearch={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Simplified Projects Grid with Loading States */}
            <div className="columns-3 gap-4">
              {isLoading ? (
                <div className="col-span-3 text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                    <p className="text-white/60">Loading projects...</p>
                  </div>
                </div>
              ) : Array.isArray(userProjects) && userProjects.length > 0 ? (
                userProjects.map((project) => (
                  <div key={project._id} className="break-inside-avoid inline-block w-full align-top mb-4">
                    <ProjectCard
                      publicRepoUrl={project.repositoryUrl}
                      className="w-full"
                      cardClassName="bg-black/40 hover:bg-black/50 border-white/20 backdrop-blur-md"
                      titleClassName="text-2xl font-bold"
                      descriptionClassName="text-sm"
                      statsClassName="grid-cols-2 gap-2"
                      languageBarClassName="scale-90 origin-left"
                      secondaryTextColor="text-white/60"
                      hoverScale="hover:scale-[1.02] transition-all duration-300"
                      iconSize={4}
                      projectId={project._id}
                      initialLikeCount={project.likeCount || 0}
                      initialLiked={project.liked || false}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-white/60">
                  No projects found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
