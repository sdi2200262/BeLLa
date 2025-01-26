import React from 'react';
import './FileContainer.css';

interface FileItem {
  name: string;
  onClick: () => void;
}

interface FileContainerProps {
  files: FileItem[];
  maxNameLength?: number;
}

const FileContainer: React.FC<FileContainerProps> = ({ 
  files, 
  maxNameLength = 20 
}) => {
  const truncateFilename = (filename: string) => {
    if (filename.length <= maxNameLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    return `${nameWithoutExt.substring(0, maxNameLength)}...${extension ? `.${extension}` : ''}`;
  };

  return (
    <div className="file-container">
      {files.map((file, index) => (
        <button
          key={index}
          className="file-item"
          onClick={file.onClick}
        >
          {truncateFilename(file.name)}
        </button>
      ))}
    </div>
  );
};

export default FileContainer; 