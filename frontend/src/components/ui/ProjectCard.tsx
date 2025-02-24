import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, GitFork, Scale, GitCommit, FileCode, GithubIcon, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { LanguageBar } from "./LanguageBar";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/colors";
import { API_BASE_URL, defaultFetchOptions, handleResponse, APIError } from "@/config/api";

interface Repository {
  name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  license: {
    name: string;
  } | null;
  languages: Record<string, number>;
  html_url: string;
  commit_count?: number;
  status?: string;
  metadata?: {
    error?: string;
  };
}

interface ProjectResponse {
  cached: boolean;
  cacheExpiry?: number;
  data: Repository;
}

interface ProjectCardProps {
  publicRepoUrl: string;
  className?: string;
  cardClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  statsClassName?: string;
  languageBarClassName?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  hoverScale?: string;
  iconSize?: number;
  onClick?: () => void;
}

export function ProjectCard({ 
  publicRepoUrl,
  className,
  cardClassName,
  titleClassName,
  descriptionClassName,
  statsClassName,
  languageBarClassName,
  backgroundColor = "bg-black/50",
  borderColor = "border-white/10",
  textColor = "text-white",
  secondaryTextColor = "text-white/70",
  hoverScale = "hover:scale-105",
  iconSize = 4,
  onClick
}: ProjectCardProps) {
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const newIsVisible = entry.isIntersecting;
        setIsVisible(newIsVisible);
      },
      {
        root: null,
        rootMargin: '50px', // Start loading slightly before the card is visible
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [publicRepoUrl]);

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!isVisible || hasLoaded) return;

      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/projects/data?url=${encodeURIComponent(publicRepoUrl)}`,
            {
              ...defaultFetchOptions,
              signal: AbortSignal.timeout(30000) // 30 second timeout
            }
          );

          const data = await handleResponse<ProjectResponse>(response);
          setRepository(data.data);
          setHasLoaded(true);
          setError(null);
          return; // Success, exit the retry loop
        } catch (error: any) {
          console.error(`Error fetching repository data (attempt ${4 - retries}/3):`, error);
          lastError = error;
          retries--;
          
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
          }
        }
      }

      // If we get here, all retries failed
      setRepository(null);
      setError(lastError instanceof APIError ? lastError.message : 'Repository is currently unavailable');
      setHasLoaded(true); // Mark as loaded even on error to prevent retries
    };

    fetchRepoData();
  }, [publicRepoUrl, isVisible, hasLoaded]);

  const calculateLanguagePercentages = () => {
    if (!repository?.languages) return [];
    
    const total = Object.values(repository.languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(repository.languages).map(([name, value]) => ({
      name,
      percentage: (value / total) * 100,
      color: getLanguageColor(name)
    }));
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (repository) {
      // Extract the username and repo name from the public repo URL
      const urlMatch = publicRepoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[2]) {
        const [_, owner, repo] = urlMatch;
        navigate(`/projects/${owner}/${repo}`);
      }
    }
  };

  if (error || repository?.status === 'error') {
    const errorMessage = repository?.metadata?.error || error || 'Repository is currently unavailable';
    
    return (
      <div ref={cardRef} className={cn("cursor-pointer", className)}>
        <Card className={cn(
          "rounded-[15px] backdrop-blur-md transition-all duration-300",
          "bg-red-500/5 border-red-500/20",
          cardClassName
        )}>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="text-red-500 text-center">
              <div className="font-semibold">Repository Error</div>
              <div className="text-sm opacity-80">{errorMessage}</div>
              <a 
                href={publicRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm mt-2 text-red-500/80 hover:text-red-500 underline"
              >
                View on GitHub
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!repository) {
    return (
      <div ref={cardRef} className={cn("cursor-pointer", className)}>
        <Card className={cn("rounded-[15px] backdrop-blur-md transition-all duration-700", backgroundColor, borderColor, hoverScale, cardClassName)}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
            </div>
            <div className="h-16 bg-white/5 rounded animate-pulse mt-3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-8 bg-white/5 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={cardRef} onClick={handleCardClick} className={cn("cursor-pointer", className)}>
      <Card className={cn(
        "rounded-[15px] backdrop-blur-md transition-all duration-300",
        backgroundColor,
        borderColor,
        hoverScale,
        cardClassName
      )}>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className={cn("text-2xl", textColor, titleClassName)}>
                {repository.name}
              </CardTitle>
              <div className={cn("text-sm", secondaryTextColor)}>
                by {repository.owner?.login || "Unknown owner"}
              </div>
            </div>
            <img
              src={repository.owner?.avatar_url}
              alt={`${repository.owner?.login}'s avatar`}
              className="w-8 h-8 rounded-full ring-1 ring-white/10 transition-all duration-300 hover:ring-[#0066FF] flex-shrink-0"
            />
          </div>
          <CardDescription className={cn(secondaryTextColor, descriptionClassName)}>
            {repository.description || "No description available"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={cn("grid grid-cols-2 gap-4", statsClassName)}>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <Star className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.stargazers_count.toLocaleString()} stars</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <GitFork className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.forks_count.toLocaleString()} forks</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <Scale className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.license?.name || "No license"}</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <GitCommit className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.commit_count?.toLocaleString() || 0} commits</span>
            </div>
          </div>

          {repository.languages && Object.keys(repository.languages).length > 0 && (
            <div className={cn("pt-2 border-t", borderColor)}>
              <div className={cn("flex items-center gap-2 text-sm mb-2", secondaryTextColor)}>
                <FileCode className="w-3 h-3" />
                <span>Languages</span>
              </div>
              <LanguageBar 
                languages={calculateLanguagePercentages()} 
                className={cn("scale-90 origin-left", languageBarClassName)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 