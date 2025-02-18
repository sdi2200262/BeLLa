import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CodeViewer } from '../ui/CodeViewer';

interface Repository {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

export function ProjectShowcasePage() {
  const { repoName } = useParams();
  const [repository, setRepository] = useState<Repository | null>(null);
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

    fetchRepository();
    fetchContents();
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

  if (loading) return <div className="flex items-center justify-center h-screen bg-black">
    <p className="text-white">Loading repository data...</p>
  </div>;

  if (error) return <div className="flex items-center justify-center h-screen bg-black">
    <p className="text-red-500">{error}</p>
  </div>;

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8">{repository?.name}</h1>
        
        <CodeViewer
          className="h-[800px] border border-white/10"
          data={fileData}
          selectedFile={selectedFile}
          onSelect={handleFileSelect}
          content={fileContent}
          leftPanelClassName="bg-black"
          rightPanelClassName="bg-black"
          breadcrumbClassName="text-white/70"
          fileItemHoverClassName="hover:bg-white/10"
          fileItemClassName="text-white/70"
          selectedFileClassName="bg-white/20 text-white"
        />
      </div>
    </div>
  );
}