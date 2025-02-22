import { UserIcon, GithubIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ProjectCard } from "../ui/ProjectCard";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Mock user data
const mockBeLLaData = {
  username: "sdi2200262",
  projectsUploaded: 3,
  contributions: 15,
  lastActive: "2024-02-22T15:30:00Z",
  projects: [
    "https://github.com/sdi2200262/BeLLa",
    "https://github.com/sdi2200262/BeLLa-NERT",
    "https://github.com/sdi2200262/personal-project"
  ]
};

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

export function ProfilePage() {
  const { user, loading } = useAuth();
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const response = await fetch('https://api.github.com/users/sdi2200262');
        const data = await response.json();
        setGithubUser(data);
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      }
    };

    fetchGithubData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa's <UserIcon className="h-3 w-3" /> Profile Management System
          </div>
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
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl text-white">BeLLa Profile</CardTitle>
                <CardDescription className="text-white/60">
                  Your BeLLa platform statistics and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-3xl font-bold text-white">{mockBeLLaData.projectsUploaded}</div>
                      <div className="text-sm text-white/60">Projects Uploaded</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-3xl font-bold text-white">{mockBeLLaData.contributions}</div>
                      <div className="text-sm text-white/60">Contributions</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-white/60">Last Active</div>
                      <div className="text-white">
                        {new Date(mockBeLLaData.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Your Projects</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockBeLLaData.projects.map((projectUrl, index) => (
                        <ProjectCard
                          key={index}
                          publicRepoUrl={projectUrl}
                          className="w-full"
                          cardClassName="bg-black/40 hover:bg-black/50 border-white/20 backdrop-blur-md"
                          titleClassName="text-xl font-bold"
                          descriptionClassName="text-sm"
                          statsClassName="grid-cols-2 gap-2"
                          languageBarClassName="scale-90 origin-left"
                          secondaryTextColor="text-white/60"
                          hoverScale="hover:scale-[1.02] transition-all duration-300"
                          iconSize={4}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end gap-4">
                      <Button
                        variant="outline"
                        className="bg-white/5 text-white hover:bg-white/10"
                        onClick={() => window.location.href = '/projects'}
                      >
                        View All Projects
                      </Button>
                      <Button
                        className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90"
                        onClick={() => window.location.href = '/projects'}
                      >
                        Add New Project
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl text-white">GitHub Profile</CardTitle>
                  <GithubIcon className="h-6 w-6" />
                </div>
                <CardDescription className="text-white/60">
                  Your GitHub account information and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : githubUser ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={githubUser.avatar_url}
                        alt={`${githubUser.login}'s avatar`}
                        className="w-20 h-20 rounded-full ring-2 ring-white/10"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white">{githubUser.name}</h3>
                        <p className="text-white/60">{githubUser.bio}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-bold text-white">{githubUser.public_repos}</div>
                        <div className="text-sm text-white/60">Public Repos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-bold text-white">{githubUser.followers}</div>
                        <div className="text-sm text-white/60">Followers</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-bold text-white">{githubUser.following}</div>
                        <div className="text-sm text-white/60">Following</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-white/60">Member Since</div>
                        <div className="text-white">
                          {new Date(githubUser.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="bg-[#24292F] text-white hover:bg-[#24292F]/90"
                        onClick={() => window.open(githubUser.html_url, '_blank')}
                      >
                        <GithubIcon className="mr-2 h-4 w-4" />
                        View GitHub Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/60">
                    Failed to load GitHub profile
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
