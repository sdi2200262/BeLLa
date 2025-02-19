import { useEffect, useState } from 'react';
import { ProjectCard } from '../ui/ProjectCard';
import { CodeIcon, PinIcon } from "lucide-react";
import { SearchBar } from '../ui/searchbar';
import { cn } from '@/lib/utils';

interface Repository {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  license: {
    name: string;
  } | null;
  languages_url: string;
  owner: {
    login: string;
  };
  default_branch: string;
  isPinned: boolean;
}

export function ProjectsPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        // Simplified fetch without token
        const response = await fetch('https://api.github.com/repos/sdi2200262/BeLLa-NERT', {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          throw new Error(`GitHub API responded with status ${response.status}`);
        }

        const data = await response.json();
        
        // Ensure the data has the required properties
        const processedData = {
          ...data,
          owner: data.owner || { login: 'sdi2200262' },
          languages_url: data.languages_url || `https://api.github.com/repos/sdi2200262/BeLLa-NERT/languages`,
          license: data.license || null,
        };

        setRepositories([processedData]);
        console.log('Repository data:', processedData);
      } catch (err) {
        console.error('Frontend Error:', err);
        setError('Failed to fetch repository data');
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <CodeIcon className="h-8 w-8 text-white animate-pulse" />
          <p className="text-white/70">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-white/70 hover:text-white transition-colors duration-100"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <div className="flex items-center gap-1 text-sm text-white/60">
          <CodeIcon className="h-3 w-3" />
          <span>Open source development tools and SaaS</span>
        </div>
      </div>

      {/* Fixed Search Bar */}
      
        <SearchBar
          radius="full"
          className="text-black"
          size="lg"
          width="lg"
          position="fixed"
          top="200px"
          left="0"
          right="0"
          inputClassName="text-black"
          iconClassName="text-black"
          containerClassName="mx-auto bg-white/90 hover:scale-105 transform transition-transform"
          placeholder="Search projects..."
        />


      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-32">
        <div className="grid gap-8">
          {repositories.map((repository) => (
            <ProjectCard 
              key={repository.name }
              repository={repository}
              className="max-w-2xl mx-auto"
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

        <div className="mt-40 text-center">
          <p className="text-white/60">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
