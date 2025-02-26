import { UserIcon, GithubIcon, GitPullRequestIcon, GitForkIcon, BookIcon, Loader2, AlertCircle, Trash2, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ProjectCard } from "../ui/ProjectCard";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { fetchContributors, type Contributor } from "@/services/contributorsService";
import { API_BASE_URL, defaultFetchOptions, handleResponse } from "@/config/api";
import { useLikes } from '@/contexts/LikeContext';

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

interface Project {
  _id: string;
  repositoryUrl: string;
  uploadedBy: string;
  status: string;
  createdAt: string;
  likeCount?: number;
  liked?: boolean;
}

interface ProjectLimits {
  total: number;
  remaining: number;
}

interface ProjectsResponse {
  projects: Project[];
  limits: {
    projectsPerUser: number;
    remaining: number;
  };
}

export function ProfilePage() {
  const { user, loading, logout, getAuthToken } = useAuth();
  const { refreshLikes } = useLikes();
  const navigate = useNavigate();
  
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [contributions, setContributions] = useState(0);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [likedProjects, setLikedProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [likedProjectsLoading, setLikedProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingMap, setIsDeletingMap] = useState<Record<string, boolean>>({});
  const [projectLimits, setProjectLimits] = useState<{ total: number; remaining: number }>({
    total: 5,
    remaining: 5
  });
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch GitHub profile data
    const fetchGithubData = async () => {
      try {
        const response = await fetch(`https://api.github.com/users/${user.username}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch GitHub data');
        }
        const data = await response.json();
        setGithubUser(data);
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      }
    };
    
    // Fetch contributions data
    const fetchContributionsData = async () => {
      try {
        const contributors = await fetchContributors();
        const userContributions = contributors.find(
          (contributor: Contributor) => contributor.username === user.username
        );
        setContributions(userContributions?.contributions || 0);
      } catch (error) {
        console.error('Error fetching contributions:', error);
      }
    };

    // Fetch user's projects
    const fetchUserProjects = async () => {
      setProjectsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/projects/user`, {
          ...defaultFetchOptions,
          headers: {
            ...defaultFetchOptions.headers,
            'Authorization': `Bearer ${token}`
          } as HeadersInit,
          signal: AbortSignal.timeout(60000)
        });

        const data = await handleResponse<{ projects: Project[]; limits: { projectsPerUser: number; remaining: number } }>(response);
        setUserProjects(data.projects || []);
        setProjectLimits({
          total: data.limits.projectsPerUser,
          remaining: data.limits.remaining
        });
        
        // Refresh likes for these projects
        if (data.projects?.length > 0) {
          const projectIds = data.projects.map(p => p._id).filter(Boolean);
          await refreshLikes(projectIds);
        }
      } catch (error: any) {
        console.error('Error fetching user projects:', error);
        setError(error.message);
        
        if (error.message.includes('sign in') || error.message.includes('session expired')) {
          logout();
          navigate('/login');
        }
      } finally {
        setProjectsLoading(false);
      }
    };

    // Fetch user's liked projects
    const fetchLikedProjects = async () => {
      setLikedProjectsLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/likes/user/liked`, {
          ...defaultFetchOptions,
          headers: {
            ...defaultFetchOptions.headers,
            'Authorization': `Bearer ${token}`
          } as HeadersInit,
          signal: AbortSignal.timeout(60000)
        });

        const data = await handleResponse<{ projects: Project[] }>(response);
        
        // Ensure all projects have likeCount and liked properties
        const projectsWithLikes = (data.projects || []).map(project => ({
          ...project,
          likeCount: project.likeCount || 0,
          liked: true // These are all liked by the user
        }));
        
        setLikedProjects(projectsWithLikes);
        
        // Refresh likes for these projects - but only if we have valid IDs
        if (projectsWithLikes.length > 0) {
          // Filter out any invalid project IDs (must be 24 hex characters)
          const projectIds = projectsWithLikes
            .map(p => p._id)
            .filter(id => {
              const isValid = id && /^[0-9a-fA-F]{24}$/.test(id);
              if (!isValid) {
                console.warn(`Skipping invalid project ID in liked projects: ${id}`);
              }
              return isValid;
            });
          
          if (projectIds.length > 0) {
            // Use a debounce mechanism to prevent excessive refreshes
            const refreshKey = projectIds.sort().join(',');
            const now = Date.now();
            const lastRefresh = (window as any)._profileLikeRefreshTime || 0;
            
            if (now - lastRefresh > 5000) { // Only refresh if it's been more than 5 seconds
              (window as any)._profileLikeRefreshTime = now;
              await refreshLikes(projectIds);
            } else {
              console.log('Skipping profile likes refresh - too soon since last refresh');
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching liked projects:', error);
        
        if (error.message?.includes('sign in') || error.message?.includes('session expired')) {
          logout();
          navigate('/login');
        }
      } finally {
        setLikedProjectsLoading(false);
      }
    };

    fetchGithubData();
    fetchContributionsData();
    fetchUserProjects();
    fetchLikedProjects();
  }, [user, navigate, getAuthToken, logout, refreshLikes]);

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;

    setIsDeletingMap(prev => ({ ...prev, [projectId]: true }));
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        ...defaultFetchOptions,
        method: 'DELETE',
        headers: {
          ...defaultFetchOptions.headers,
          'Authorization': `Bearer ${token}`
        } as HeadersInit
      });

      await handleResponse(response);

      // Remove the project from local state
      setUserProjects(prev => prev.filter(p => p._id !== projectId));
      setProjectLimits(prev => ({
        ...prev,
        remaining: prev.remaining + 1
      }));

    } catch (error: any) {
      console.error('Error deleting project:', error);
      setError(error.message);
      
      if (error.message.includes('sign in') || error.message.includes('session expired')) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsDeletingMap(prev => ({ ...prev, [projectId]: false }));
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="flex items-center gap-1 text-sm text-white/60">
              Using BeLLa's <UserIcon className="h-3 w-3" /> Profile Management System
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="bg-white/5 text-white hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="bella" className="w-full">
          <TabsList className="w-full justify-start bg-black/40 border-white/10">
            <TabsTrigger 
              value="bella" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
            >
              BeLLa Profile
            </TabsTrigger>
            <TabsTrigger 
              value="github"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
            >
              GitHub Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bella">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa Logo" className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">BeLLa Profile</CardTitle>
                    <CardDescription className="text-white/60">
                      Your BeLLa account information and statistics
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* User Info */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <img
                        src={githubUser?.avatar_url}
                        alt={`${githubUser?.login}'s avatar`}
                        className="w-24 h-24 rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-[#0066FF]"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-[#0066FF]/10 p-2 rounded-full ring-2 ring-black transition-all duration-300 group-hover:bg-[#0066FF]/20">
                        <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa Logo" className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{githubUser?.name}</h3>
                      <p className="text-white/60">{githubUser?.bio || 'No bio available'}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-3xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {userProjects.length}/{projectLimits.total || 5}
                        </div>
                        <div className="text-sm text-white/60">Projects Uploaded</div>
                      </div>
                      <GitForkIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-3xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {likedProjects.length}
                        </div>
                        <div className="text-sm text-white/60">Liked Projects</div>
                      </div>
                      <Heart className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                    <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                      <div className="relative z-10">
                        <div className="text-3xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                          {contributions}
                        </div>
                        <div className="text-sm text-white/60">Contributions</div>
                      </div>
                      <GitPullRequestIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                          <GithubIcon className="text-[#0066FF] w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Your Projects</h3>
                      </div>
                      {projectLimits.remaining > 0 && (
                        <Button
                          className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90 transition-all duration-300 hover:scale-[1.02]"
                          onClick={() => navigate('/projects')}
                        >
                          Add New Project
                        </Button>
                      )}
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectsLoading ? (
                        Array(3).fill(null).map((_, i) => (
                          <div key={i} className="relative">
                            <div className="w-full h-[200px] rounded-[15px] bg-white/5 animate-pulse">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : userProjects.length > 0 ? (
                        userProjects.map((project) => (
                          <div key={project._id} className="relative">
                            <button
                              onClick={() => handleDeleteProject(project._id)}
                              className="absolute top-2 right-2 z-10 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors"
                              title="Delete project"
                              disabled={isDeletingMap[project._id]}
                            >
                              {isDeletingMap[project._id] ? (
                                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-500" />
                              )}
                            </button>
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
                        <div className="col-span-3 text-center py-8 text-white/60">
                          No projects uploaded yet.{' '}
                          <button
                            onClick={() => navigate('/projects')}
                            className="text-[#0066FF] hover:underline"
                          >
                            Add your first project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Liked Projects Section */}
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                          <Heart className="text-[#0066FF] w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Liked Projects</h3>
                      </div>
                      <Button
                        className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90 transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => navigate('/projects')}
                      >
                        Explore More Projects
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {likedProjectsLoading ? (
                        Array(3).fill(null).map((_, i) => (
                          <div key={i} className="relative">
                            <div className="w-full h-[200px] rounded-[15px] bg-white/5 animate-pulse">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : likedProjects.length > 0 ? (
                        likedProjects.map((project) => (
                          <div key={project._id} className="relative">
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
                              initialLiked={true}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 text-white/60">
                          No liked projects yet.{' '}
                          <button
                            onClick={() => navigate('/projects')}
                            className="text-[#0066FF] hover:underline"
                          >
                            Explore projects to like
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github">
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0066FF]/10 p-2 rounded-lg">
                    <GithubIcon className="text-[#0066FF] w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">GitHub Profile</CardTitle>
                    <CardDescription className="text-white/60">
                      Your GitHub account information and statistics
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 text-white/40 animate-spin mx-auto" />
                      <p className="text-white/60">Loading GitHub data...</p>
                    </div>
                  </div>
                ) : githubUser ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <img
                          src={githubUser.avatar_url}
                          alt={`${githubUser.login}'s avatar`}
                          className="w-24 h-24 rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-[#0066FF]"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-[#0066FF]/10 p-2 rounded-full ring-2 ring-black transition-all duration-300 group-hover:bg-[#0066FF]/20">
                          <GithubIcon className="w-4 h-4 text-[#0066FF]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{githubUser.name}</h3>
                        <p className="text-white/60">{githubUser.bio || 'No bio available'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                        <div className="relative z-10">
                          <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                            {githubUser.public_repos}
                          </div>
                          <div className="text-sm text-white/60">Public Repos</div>
                        </div>
                        <GitForkIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                      </div>
                      <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                        <div className="relative z-10">
                          <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                            {githubUser.followers}
                          </div>
                          <div className="text-sm text-white/60">Followers</div>
                        </div>
                        <UserIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                      </div>
                      <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                        <div className="relative z-10">
                          <div className="text-2xl font-bold text-white group-hover:text-[#0066FF] transition-colors duration-300">
                            {githubUser.following}
                          </div>
                          <div className="text-sm text-white/60">Following</div>
                        </div>
                        <UserIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-[#0066FF]/5 transition-colors duration-300" />
                      </div>
                      <div className="relative overflow-hidden bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10 group">
                        <div className="relative z-10">
                          <div className="text-sm text-white/60">Member Since</div>
                          <div className="text-white mt-1">
                            {new Date(githubUser.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <BookIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-white/10 transition-colors duration-300" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="bg-[#24292F] text-white hover:bg-[#24292F]/90 transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => window.open(githubUser.html_url, '_blank')}
                      >
                        <GithubIcon className="mr-2 h-4 w-4" />
                        View GitHub Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">Failed to load GitHub profile</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
