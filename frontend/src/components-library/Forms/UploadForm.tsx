import React, { useState, ChangeEvent, FormEvent, FC } from 'react';
import Button from '../Buttons/Button';
import './UploadForm.css';

// Types
type DocumentationType = 'upload' | 'write' | undefined;

type DocumentationOption = {
  value: DocumentationType;
  label: string;
};

// Sub-components

/**
 * FileInput Component
 * Handles file selection and display.
 */
interface FileInputProps {
  label: string;
  selectedFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  accept?: string;
}

const FileInput: FC<FileInputProps> = ({ label, selectedFile, onFileChange, onClear, accept }) => {
  // Function to truncate filename
  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    return `${nameWithoutExt.substring(0, maxLength)}...${extension ? `.${extension}` : ''}`;
  };

  return (
    <div className="file-input-wrapper">
      <Button
        label={selectedFile ? truncateFilename(selectedFile.name) : label}
        onClick={() => document.getElementById(label.replace(/\s+/g, '-').toLowerCase())?.click()}
        variant="action"
      />
      {selectedFile && (
        <Button
          label="×"
          onClick={onClear}
          variant="text"
        />
      )}
      <input
        id={label.replace(/\s+/g, '-').toLowerCase()}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden-input"
      />
    </div>
  );
};

/**
 * DocumentationOption Component
 * Renders a single documentation option as a text button with underline effect.
 */
interface DocumentationOptionProps {
  option: DocumentationOption;
  isSelected: boolean;
  onToggle: () => void;
  readmeFile: File | null;
  onReadmeFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearReadmeFile: () => void;
  readmeContent: string;
  onReadmeContentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

const DocumentationOptionComponent: FC<DocumentationOptionProps> = ({
  option,
  isSelected,
  onToggle,
  readmeFile,
  onReadmeFileChange,
  onClearReadmeFile,
  readmeContent,
  onReadmeContentChange,
}) => {
  return (
    <div 
      className={`documentation-option ${isSelected ? 'expanded' : ''}`}
      data-option={option.value}
    >
      <Button
        label={option.label}
        onClick={onToggle}
        variant="text"
        effects={['underline']}
        isActive={isSelected}
      />
      {option.value === 'upload' && (
        <div className={`file-input-container ${isSelected ? 'animated' : ''}`}
             style={{ display: isSelected ? 'block' : 'none' }}>
          <FileInput
            label="Choose README file"
            selectedFile={readmeFile}
            onFileChange={onReadmeFileChange}
            onClear={onClearReadmeFile}
            accept=".md,.txt"
          />
        </div>
      )}
      {option.value === 'write' && (
        <textarea
          className="readme-textarea"
          style={{ 
            display: isSelected ? 'block' : 'none',
            opacity: isSelected ? 1 : 0,
            transform: isSelected ? 'translateY(0)' : 'translateY(-20px)'
          }}
          placeholder="Write your documentation here..."
          value={readmeContent}
          onChange={onReadmeContentChange}
        />
      )}
    </div>
  );
};

// Main Component
const UploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentationType, setDocumentationType] = useState<DocumentationType>(undefined);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [readmeFile, setReadmeFile] = useState<File | null>(null);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);

  const documentationOptions: DocumentationOption[] = [
    { value: 'upload', label: 'Upload README' },
    { value: 'write', label: 'Write README' },
  ];

  // Add state to track if any documentation option is selected
  const isAnyDocOptionSelected = documentationType !== undefined;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
  };

  const handleReadmeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setReadmeFile(file);
    setError(null);
  };

  const handleReadmeContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setReadmeContent(event.target.value);
    setError(null);
  };

  const handleDocTypeToggle = (value: DocumentationType) => () => {
    if (documentationType === value) {
      // Deselect if the same option is clicked
      setDocumentationType(undefined);
      setReadmeFile(null);
      setReadmeContent('');
    } else {
      // Select the new option
      setDocumentationType(value);
      // Clear other fields when switching
      if (value !== 'upload') setReadmeFile(null);
      if (value !== 'write') setReadmeContent('');
    }
    setError(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const clearReadmeFile = () => {
    setReadmeFile(null);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedFile) {
      setError({ message: 'Please select a file to upload', type: 'error' });
      return false;
    }

    if (!documentationType) {
      setError({ message: 'Please select a documentation option', type: 'error' });
      return false;
    }

    if (documentationType === 'upload' && !readmeFile) {
      setError({ message: 'Please select a README file', type: 'error' });
      return false;
    }

    if (documentationType === 'write' && !readmeContent.trim()) {
      setError({ message: 'Please write documentation content', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    // Handle form submission here
    console.log({
      file: selectedFile,
      documentationType,
      readmeFile,
      readmeContent
    });
  };

  return (
    <form 
      className={`upload-form ${isAnyDocOptionSelected ? 'expanded' : ''}`} 
      onSubmit={handleSubmit}
    >
      {/* Upload File Section */}
      <div className="form-section">
        <h3>Upload a File</h3>
        <FileInput
          label="Choose a file"
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onClear={clearFile}
        />
      </div>

      {/* Documentation Section */}
      <div className="form-section">
        <h3>Documentation</h3>
        <div className="documentation-options">
          {documentationOptions.map(option => (
            <DocumentationOptionComponent
              key={option.value}
              option={option}
              isSelected={documentationType === option.value}
              onToggle={handleDocTypeToggle(option.value)}
              readmeFile={readmeFile}
              onReadmeFileChange={handleReadmeFileChange}
              onClearReadmeFile={clearReadmeFile}
              readmeContent={readmeContent}
              onReadmeContentChange={handleReadmeContentChange}
            />
          ))}
        </div>
      </div>

      {/* Form Actions with inline error */}
      <div className="form-actions">
        {error && (
          <div className={`error ${error.type}`}>
            {error.message}
          </div>
        )}
        <Button
          label="Upload"
          onClick={() => {}}
          variant="action"
          type="submit"
        />
      </div>
    </form>
  );
};

export default UploadForm;
