import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, GitFork, Scale, GitCommit, FileCode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { LanguageBar } from "./LanguageBar";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/colors";

interface Repository {
  name: string;
  description: string;
  owner: {
    login: string;
  };
  stargazers_count: number;
  forks_count: number;
  license: {
    name: string;
  } | null;
  languages_url: string;
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
  iconSize = 4
}: ProjectCardProps) {
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [languages, setLanguages] = useState<{ [key: string]: number }>({});
  const [commitCount, setCommitCount] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const newIsVisible = entry.isIntersecting;
        console.log(`Card visibility changed for ${publicRepoUrl}: ${newIsVisible}`);
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
      if (!isVisible || hasLoaded) {
        console.log(`Skipping fetch for ${publicRepoUrl}: visible=${isVisible}, loaded=${hasLoaded}`);
        return;
      }

      console.log(`Fetching data for ${publicRepoUrl}`);
      try {
        const response = await fetch(`http://localhost:3001/api/projects/repo?url=${encodeURIComponent(publicRepoUrl)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRepository(data);
        setLanguages(data.languages || {});
        setCommitCount(data.commitCount || 0);
        setHasLoaded(true);
        console.log(`Successfully loaded data for ${publicRepoUrl}`);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        setRepository(null);
      }
    };

    fetchRepoData();
  }, [publicRepoUrl, isVisible, hasLoaded]);

  const calculateLanguagePercentages = () => {
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(languages).map(([name, value]) => ({
      name,
      percentage: (value / total) * 100,
      color: getLanguageColor(name)
    }));
  };

  const handleCardClick = () => {
    if (repository) {
      navigate(`/projects/${repository.name}`);
    }
  };

  if (!repository) {
    return (
      <div ref={cardRef} className={cn("cursor-pointer", className)}>
        <Card className={cn("rounded-[15px] backdrop-blur-md transition-all duration-300 p-4", backgroundColor, borderColor, hoverScale, cardClassName)}>
          <CardHeader>
            <CardTitle className={cn("text-2xl", textColor, titleClassName)}>
              Loading…
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className={cn(secondaryTextColor, descriptionClassName)}>
              Fetching repository data…
            </CardDescription>
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
        <CardHeader className="space-y-2">
          <div className="space-y-1">
            <CardTitle className={cn("text-2xl", textColor, titleClassName)}>
              {repository.name}
            </CardTitle>
            <div className={cn("text-sm", secondaryTextColor)}>
              by {repository.owner?.login || "Unknown owner"}
            </div>
          </div>
          <CardDescription className={cn(secondaryTextColor, descriptionClassName)}>
            {repository.description || "No description available"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={cn("grid grid-cols-2 gap-4", statsClassName)}>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <Star className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.stargazers_count} stars</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <GitFork className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.forks_count} forks</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <Scale className={`w-${iconSize} h-${iconSize}`} />
              <span>{repository.license?.name || "No license"}</span>
            </div>
            <div className={cn("flex items-center gap-2", secondaryTextColor)}>
              <GitCommit className={`w-${iconSize} h-${iconSize}`} />
              <span>{commitCount} commits</span>
            </div>
          </div>

          {Object.keys(languages).length > 0 && (
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