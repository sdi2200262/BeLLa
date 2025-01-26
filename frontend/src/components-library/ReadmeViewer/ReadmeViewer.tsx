import React, { FC } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Readme.css';


interface ReadmeViewerProps {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const ReadmeViewer: FC<ReadmeViewerProps> = ({ content, isExpanded, onToggle }) => {
  
  return (
    <div className={`readme-container ${isExpanded ? 'visible' : ''}`}>
      {isExpanded && (
        <div className="readme-content">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      )}
    </div>
  );
};

export default ReadmeViewer;