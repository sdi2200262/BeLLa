import React, { useState, useEffect } from 'react';
import './Progress.css';
import Breadcrumb from '../Navigation/Breadcrumb';
import ReadmeViewer from '../ReadmeViewer/ReadmeViewer';
import FileContainer from '../FileContainer/FileContainer';

const Progress: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [documentationFiles, setDocumentationFiles] = useState<{ name: string, onClick: () => Promise<void> }[]>([]);

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: '/home', href: '/' },
        { label: '/progress', href: '/progress' }
      ]} />
      <h1>Progress Documentation</h1>
      <div className="content-row">
        <div className="file-viewer">
          <FileContainer 
            files={documentationFiles}
            maxNameLength={30}
          />
        </div>
        <div className="readme-viewer">
          <ReadmeViewer
            content={fileContent || "Select a file to view its contents"}
            isExpanded={true}
            onToggle={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default Progress;

