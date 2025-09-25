/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  id: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500 dark:text-zinc-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, onFileSelect, imageUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  const processFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileTypeError('Please upload a JPG, PNG, or WEBP file.');
      return;
    }
    setFileTypeError(null);
    onFileSelect(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
          processFile(file);
      }
  }, []);
  
  const uploaderClasses = `w-full aspect-video bg-white dark:bg-zinc-800/50 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden cursor-pointer ${
      isDraggingOver 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400'
  }`;

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={uploaderClasses}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload an image"
        tabIndex={0}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Uploaded room" 
            className="w-full h-full object-contain" 
          />
        ) : (
          <div className="text-center text-zinc-500 dark:text-zinc-400 p-4">
            <UploadIcon />
            <p>Click to upload or drag & drop</p>
            <p className="text-sm mt-1">PNG, JPG, or WEBP</p>
          </div>
        )}
      </div>
      {fileTypeError && (
        <div className="w-full mt-2 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 dark:text-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50 rounded-lg p-3 flex items-center animate-fade-in" role="alert">
            <WarningIcon />
            <span>{fileTypeError}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;