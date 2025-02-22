import { useEffect, useState, useCallback } from "react";
import { CodeIcon, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { ProjectCard } from "../ui/ProjectCard";
import { SearchBar } from "../ui/searchbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { bellaProjects } from "@/config/bella-projects";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  repositoryUrl: string;
  uploadedBy: string;
  createdAt: string;
}

interface PaginatedResponse {
  projects: Project[];
  totalPages: number;
  currentPage: number;
  totalProjects: number;
}

export function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("bella");
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingMap, setIsDeletingMap] = useState<Record<string, boolean>>({});
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const projectsPerPage = 9;
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string; url?: string }>>([]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInputValue);
      setCurrentPage(1);
    }
  };

  const fetchUserProjects = async (page: number = 1, shouldResetCache: boolean = false) => {
    if (activeTab !== 'user') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: projectsPerPage.toString(),
        search: searchQuery
      });

      // Add cache-busting parameter if needed
      if (shouldResetCache) {
        searchParams.append('t', Date.now().toString());
      }

      const response = await fetch(`http://localhost:3001/api/projects?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data: PaginatedResponse = await response.json();
      
      // Only update state if we're still on the user tab
      if (activeTab === 'user') {
        setUserProjects(data.projects || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setHasInitialFetch(true);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects. Please try again.');
      setUserProjects([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'user' && (!hasInitialFetch || searchQuery || currentPage > 1)) {
      fetchUserProjects(currentPage);
    }
  }, [activeTab, currentPage, searchQuery]);

  // Reset state when switching tabs
  useEffect(() => {
    if (activeTab === 'user' && !hasInitialFetch) {
      fetchUserProjects(1);
    } else if (activeTab === 'bella') {
      setCurrentPage(1);
      setSearchQuery('');
      setSearchInputValue('');
      setError(null);
    }
  }, [activeTab]);

  const handleAddProject = async () => {
    if (!newProjectUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: newProjectUrl.trim(),
          uploadedBy: 'User'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This repository has already been added to the projects list');
        }
        throw new Error(data.error || 'Failed to add project');
      }

      // Reset UI state
      setNewProjectUrl('');
      setShowAddProject(false);
      setSearchQuery('');
      setSearchInputValue('');
      
      // Update local state instead of fetching
      setUserProjects(prev => {
        // Add the new project at the beginning since we sort by createdAt desc
        const newProjects = [data, ...prev];
        // If we're not on the first page, or if we have search query, fetch to ensure correct data
        if (currentPage !== 1 || searchQuery) {
          fetchUserProjects(1, true);
          return prev;
        }
        // If we're on first page and no search, just update locally
        return newProjects.slice(0, projectsPerPage);
      });

      // Update total count and pages
      setTotalPages(prev => Math.ceil((userProjects.length + 1) / projectsPerPage));
      
      // If we added the first project, ensure we're on page 1
      if (userProjects.length === 0) {
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error('Error adding project:', error);
      setError(error.message || 'Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setIsDeletingMap(prev => ({ ...prev, [projectId]: true }));
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      // Remove the project from local state
      setUserProjects(prev => {
        const newProjects = prev.filter(p => p._id !== projectId);
        
        // If we're on the last page and it's now empty, or if we have a search query
        if ((currentPage > 1 && newProjects.length === 0) || searchQuery) {
          // We need to fetch to get the correct data
          const newPage = currentPage > 1 && newProjects.length === 0 ? currentPage - 1 : currentPage;
          setCurrentPage(newPage);
          fetchUserProjects(newPage, true);
          return prev;
        }
        
        return newProjects;
      });

      // Update total pages
      setTotalPages(prev => Math.max(1, Math.ceil((userProjects.length - 1) / projectsPerPage)));

    } catch (error: any) {
      console.error('Error deleting project:', error);
      setError(error.message || 'Failed to delete project');
      // Only fetch if the error indicates we need to sync
      if (error.message.includes('not found')) {
        fetchUserProjects(currentPage, true);
      }
    } finally {
      setIsDeletingMap(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Render loading skeleton for projects
  const renderProjectSkeleton = () => (
    <div className="relative">
      <div className="w-full h-[200px] rounded-[15px] bg-white/5 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      </div>
    </div>
  );

  // Generate suggestions based on input
  const generateSuggestions = useCallback((input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    // First, filter from currently loaded projects
    const localSuggestions = userProjects
      .filter(project => {
        const url = project.repositoryUrl.toLowerCase();
        const searchLower = input.toLowerCase();
        return url.includes(searchLower);
      })
      .map(project => ({
        id: project._id,
        text: project.repositoryUrl,
        url: project.repositoryUrl
      }))
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(localSuggestions);
  }, [userProjects]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { id: string; text: string; url?: string }) => {
    setSearchInputValue(suggestion.text);
    setSearchQuery(suggestion.text);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <div className="flex items-center gap-1 text-sm text-white/60">
          <span>Using BeLLa's backend API, ProjectCard and Seachbar  </span>
          <CodeIcon className="h-3 w-3" />
        </div>  
      </div>
    </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-8 pt-8">
        {/* Tab Description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Browse Projects</h2>
          <p className="text-white/60 text-lg mb-6">
            Explore BeLLa's official repositories or add your own projects to showcase.
          </p>
          
          <Button
            onClick={() => setShowAddProject(!showAddProject)}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        <Tabs defaultValue="bella" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
            <TabsTrigger value="bella" className="data-[state=active]:bg-white/10">
              BeLLa Repositories
            </TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-white/10">
              User Repositories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bella" className="mt-6">
            <div className="columns-3 gap-4">
              {bellaProjects.map((project, index) => (
                <div key={index} className="break-inside-avoid inline-block w-full align-top mb-2">
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
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="user" className="mt-6">
            <div className="flex justify-center mb-6 relative z-50">
              <SearchBar
                size="lg"
                variant="outline"
                className="w-[600px] backdrop-blur-md"
                inputClassName="text-white placeholder:text-white/50 pl-12 rounded-full bg-white/5 border-transparent focus:border-white transition-colors duration-200"
                suggestionsClassName="bg-white/[0.03] backdrop-blur-xl border-white/10 absolute w-full mt-1 rounded-xl shadow-lg overflow-hidden"
                placeholder="Search projects..."
                value={searchInputValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchInputValue(newValue);
                  generateSuggestions(newValue);
                }}
                onSearch={(value) => {
                  if (!value) {
                    setSearchQuery("");
                    setCurrentPage(1);
                    fetchUserProjects(1, true);
                  } else {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }
                }}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>

            {showAddProject && (
              <div className="mb-6 flex gap-2 justify-center">
                <Input
                  placeholder="Enter GitHub repository URL"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="max-w-xl bg-white/5 text-white border-white/20 backdrop-blur-md rounded-full pl-4"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={handleAddProject}
                  disabled={isSubmitting}
                  className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 rounded-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 backdrop-blur-md max-w-xl mx-auto">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Masonry layout with CSS columns and slight vertical spacing */}
            <div className="columns-3 gap-4">
              {isLoading ? (
                Array.from({ length: projectsPerPage }).map((_, index) => (
                  <div key={index} className="break-inside-avoid inline-block w-full align-top mb-2">
                    {renderProjectSkeleton()}
                  </div>
                ))
              ) : Array.isArray(userProjects) && userProjects.length > 0 ? (
                userProjects.map((project) => (
                  <div key={project._id} className="break-inside-avoid inline-block w-full align-top mb-2">
                    <div className="relative">
                      {import.meta.env.DEV && (
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className="absolute top-2 right-2 z-10 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors"
                          title="Delete project (Development only)"
                          disabled={isDeletingMap[project._id]}
                        >
                          {isDeletingMap[project._id] ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      )}
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
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/60">
                  {error ? 'Error loading projects' : 'No projects found'}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={cn(
                          "text-white hover:text-white transition-all duration-300 hover:scale-105",
                          (currentPage === 1 || isLoading) && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className={cn(
                            "text-white hover:text-white transition-all duration-300 hover:scale-105",
                            isLoading && "pointer-events-none opacity-50"
                          )}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={cn(
                          "text-white hover:text-white transition-all duration-300 hover:scale-105",
                          (currentPage === totalPages || isLoading) && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-8 py-16 text-center">
        <p className="text-white/60">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>
    </div>
  );
}
