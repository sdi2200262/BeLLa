import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom';
import { Star, GitFork, Scale, FileCode, GitCommit } from "lucide-react";
import { LanguageBar } from "./LanguageBar";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

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
}

interface ProjectCardProps {
  repository: Repository;
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
  repository, 
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
  const [languages, setLanguages] = useState<{ [key: string]: number }>({});
  const [commitCount, setCommitCount] = useState<number>(0);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log('Fetching languages from:', repository.languages_url);
        const response = await fetch(repository.languages_url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Languages data:', data);
        setLanguages(data);
      } catch (err) {
        console.error('Failed to fetch languages:', err);
        setLanguages({});
      }
    };

    const fetchCommitCount = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repository.owner.login}/${repository.name}/commits?per_page=1`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const link = response.headers.get('Link') || '';
        const match = link.match(/&page=(\d+)>; rel="last"/);
        const count = match ? parseInt(match[1]) : 0;
        setCommitCount(count);
      } catch (err) {
        console.error('Failed to fetch commit count:', err);
        setCommitCount(0);
      }
    };

    fetchLanguages();
    fetchCommitCount();
  }, [repository.languages_url, repository.owner.login, repository.name]);

  const calculateLanguagePercentages = () => {
    console.log('Calculating percentages for languages:', languages);
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(languages).map(([name, value]) => ({
      name,
      percentage: (value / total) * 100,
      color: getLanguageColor(name)
    }));
  };

  const handleCardClick = () => {
    navigate(`/projects/${repository.name}`);
  };

  return (
    <div onClick={handleCardClick} className={cn("cursor-pointer", className)}>
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
              by {repository.owner.login}
            </div>
          </div>
          <CardDescription className={cn(secondaryTextColor, descriptionClassName)}>
            {repository.description}
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
              <span>{repository.license?.name || 'No license'}</span>
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

// Helper function to get language colors (you can expand this)
function getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    C: '#555555',
    Cpp: '#f34b7d',
    Csharp: '#178600',
    Ruby: '#701516',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Go: '#00ADD8',
    Rust: '#dea584',
    Scala: '#c22d40',
    // Add more languages as needed
  };
  return colors[language] || '#8b949e';
} 