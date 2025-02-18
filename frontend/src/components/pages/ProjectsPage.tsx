import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useNavigate } from 'react-router-dom';

interface Repository {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const response = await fetch('http://localhost:3001/github/user/sdi2200262/repos');
        const data = await response.json();
        
        // No need to find the repo as we're getting it directly now
        setRepository(data);
      } catch (err) {
        console.error('Frontend Error:', err);
        setError('Failed to fetch repository data');
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, []);

  const handleCardClick = () => {
    if (repository) {
      navigate(`/projects/${repository.name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-white">Loading repository data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8">Projects</h1>
        
        {repository && (
          <div 
            onClick={handleCardClick}
            className="cursor-pointer"
          >
            <Card className="rounded-[15px] bg-black/50 border-white/10 backdrop-blur-md hover:scale-105 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  {repository.name}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {repository.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-white/70">
                  <div className="flex items-center gap-2">
                    <span>⭐ Stars: {repository.stargazers_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🍴 Forks: {repository.forks_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔤 Language: {repository.language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅 Last Updated: {new Date(repository.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <a 
                  href={repository.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block text-white hover:text-white/70 transition-colors"
                >
                  View on GitHub →
                </a>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
