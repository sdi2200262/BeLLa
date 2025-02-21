import { useEffect, useState } from "react";
import { CodeIcon, Plus } from "lucide-react";
import { ProjectCard } from "../ui/ProjectCard";
import { SearchBar } from "../ui/searchbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
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
  isBellaProject: boolean;
  createdAt: string;
}

export function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("bella");
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const projectsPerPage = 6;

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: newProjectUrl.trim(),
          uploadedBy: 'User',
          isBellaProject: activeTab === 'bella'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add project');
      }

      // Refresh the project list after successful addition
      await fetchProjects();
      setNewProjectUrl('');
      setShowAddProject(false);
    } catch (error: any) {
      console.error('Error adding project:', error);
      alert(`Failed to add project: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter projects based on active tab and search query
  const filteredProjects = projects
    .filter(project => project.isBellaProject === (activeTab === 'bella'))
    .filter(project =>
      project.repositoryUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <div className="flex items-center gap-1 text-sm text-white/60">
          <CodeIcon className="h-3 w-3" />
          <span>Open source development tools and SaaS</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-8 pt-8">
        <Tabs defaultValue="bella" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bella">BeLLa Repositories</TabsTrigger>
            <TabsTrigger value="user">User Repositories</TabsTrigger>
          </TabsList>

          <TabsContent value="bella" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setShowAddProject(!showAddProject)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add BeLLa Project
              </Button>
            </div>

            {showAddProject && activeTab === 'bella' && (
              <div className="mb-6 flex gap-2">
                <Input
                  placeholder="Enter GitHub repository URL"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="flex-1 bg-white/10 text-white border-white/20"
                />
                <Button
                  onClick={handleAddProject}
                  disabled={isSubmitting}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  publicRepoUrl={project.repositoryUrl}
                  className="w-full"
                  cardClassName="bg-black/40 hover:bg-black/50 border-white/20"
                  titleClassName="text-2xl font-bold"
                  descriptionClassName="text-sm"
                  statsClassName="grid-cols-2 gap-2"
                  languageBarClassName="scale-90 origin-left"
                  secondaryTextColor="text-white/60"
                  hoverScale="hover:scale-[1.05]"
                  iconSize={4}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="user" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <SearchBar
                radius="full"
                className="text-black w-[500px]"
                size="lg"
                width="full"
                position="static"
                inputClassName="text-black"
                iconClassName="text-black"
                containerClassName="bg-white/90"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                onClick={() => setShowAddProject(!showAddProject)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>

            {showAddProject && activeTab === 'user' && (
              <div className="mb-6 flex gap-2">
                <Input
                  placeholder="Enter GitHub repository URL"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="flex-1 bg-white/10 text-white border-white/20"
                />
                <Button
                  onClick={handleAddProject}
                  disabled={isSubmitting}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  publicRepoUrl={project.repositoryUrl}
                  className="w-full"
                  cardClassName="bg-black/40 hover:bg-black/50 border-white/20"
                  titleClassName="text-2xl font-bold"
                  descriptionClassName="text-sm"
                  statsClassName="grid-cols-2 gap-2"
                  languageBarClassName="scale-90 origin-left"
                  secondaryTextColor="text-white/60"
                  hoverScale="hover:scale-[1.05]"
                  iconSize={4}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={cn(
                          "text-white hover:text-white",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="text-white hover:text-white"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={cn(
                          "text-white hover:text-white",
                          currentPage === totalPages && "pointer-events-none opacity-50"
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
      <div className="max-w-3xl mx-auto px-8 py-16 text-center">
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
