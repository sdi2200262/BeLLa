import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CodeViewer } from '../ui/CodeViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, GitFork, Star, Code, Info, Files, Clock, FileCode, Scale } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import { LanguageBar } from '../ui/LanguageBar';

interface Repository {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  created_at: string;
  default_branch: string;
  license?: {
    name: string;
  };
  languages_url: string;
}

export function ProjectShowcasePage() {
  const { repoName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [languages, setLanguages] = useState<{ [key: string]: number }>({});
  const [fileData, setFileData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const response = await fetch(`http://localhost:3001/github/user/sdi2200262/repos`);
        const data = await response.json();
        setRepository(data);
      } catch (err) {
        console.error('Frontend Error:', err);
        setError('Failed to fetch repository data');
      }
    };

    const fetchContents = async () => {
      try {
        const response = await fetch(`http://localhost:3001/github/repos/sdi2200262/${repoName}/contents`);
        const data = await response.json();
        setFileData(data);
      } catch (err) {
        console.error('Frontend Error:', err);
        setError('Failed to fetch repository contents');
      } finally {
        setLoading(false);
      }
    };

    const fetchLanguages = async () => {
      if (repository?.languages_url) {
        try {
          const response = await fetch(repository.languages_url);
          if (!response.ok) throw new Error('Failed to fetch languages');
          const data = await response.json();
          setLanguages(data);
        } catch (err) {
          console.error('Failed to fetch languages:', err);
          setLanguages({});
        }
      }
    };

    fetchRepository();
    fetchContents();

    if (repository) {
      fetchLanguages();
    }
  }, [repoName]);

  const handleFileSelect = async (fileId: string | null) => {
    setSelectedFile(fileId);
    if (fileId) {
      const file = findFileById(fileData, fileId);
      if (file?.url) {
        try {
          const response = await fetch(`http://localhost:3001/github/file-content?url=${file.url}`);
          const data = await response.json();
          setFileContent(data.content);
        } catch (err) {
          console.error('Frontend Error:', err);
          setError('Failed to fetch file content');
        }
      }
    }
  };

  const findFileById = (items: any[], id: string): any => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const calculateLanguagePercentages = () => {
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(languages).map(([name, value]) => ({
      name,
      percentage: (value / total) * 100,
      color: getLanguageColor(name)
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-black">
    <p className="text-white">Loading repository data...</p>
  </div>;

  if (error) return <div className="flex items-center justify-center h-screen bg-black">
    <p className="text-red-500">{error}</p>
  </div>;

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="text-sm">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects" className="text-white/60 hover:text-white">
                  Projects
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">
                {repository?.name || 'Loading...'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Repository Header with Language Bar */}
        <div className="border-b border-white/10 pb-6 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{repository?.name}</h1>
            <p className="text-white/70 text-lg">{repository?.description}</p>
            
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-white/60">
                <Star className="h-4 w-4" />
                <span>{repository?.stargazers_count}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <GitFork className="h-4 w-4" />
                <span>{repository?.forks_count}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Scale className="h-4 w-4" />
                <span>{repository?.license?.name}</span>
              </div>
            </div>
            {Object.keys(languages).length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm mb-2 text-white/60">
                  <FileCode className="h-4 w-4" />
                  <span>Languages</span>
                </div>
                <LanguageBar 
                  languages={calculateLanguagePercentages()} 
                  className="w-[400px] max-w-2xl"
                />
              </div>
            )}
          </div>

        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="bg-white/10 border border-white/10">
            <TabsTrigger value="files" className="text-white/90 data-[state=active]:bg-white/50">
              <Files className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="info" className=" text-white/90 data-[state=active]:bg-white/50">
              <Info className="h-4 w-4 mr-2" />
              Information
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-6">
            <CodeViewer
              className="h-[800px]"
              data={fileData}
              selectedFile={selectedFile}
              onSelect={handleFileSelect}
              content={fileContent}
              leftPanelClassName="bg-white/10 " 
              rightPanelClassName="bg-white/5"
              breadcrumbClassName="text-white/90"
              fileItemHoverClassName="hover:bg-white/5 transition-colors duration-150"
              fileItemClassName="text-white/90"
              selectedFileClassName="bg-white/10 text-white"
            />
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="border border-white/10 rounded-lg p-6 space-y-4 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(repository?.created_at || '').toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last updated: {new Date(repository?.updated_at || '').toLocaleDateString()}</span>
              </div>
              {repository?.license && (
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>License: {repository.license.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Default branch: {repository?.default_branch}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function for language colors
function getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    // ... add more languages as needed
  };
  return colors[language] || '#8b949e';
}