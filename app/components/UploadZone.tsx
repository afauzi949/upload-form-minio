"use client";

import { useCallback, useState } from "react";
import { Upload, FileUp } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFilesSelected, disabled }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center
        transition-all duration-200 cursor-pointer
        ${isDragOver
          ? "border-blue-500 bg-blue-50 scale-[1.01]"
          : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        accept=".pdf,.doc,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.md,.json,.csv,.xml"
      />
      <div className="flex flex-col items-center gap-3">
        {isDragOver ? (
          <FileUp className="w-12 h-12 text-blue-500 animate-bounce" />
        ) : (
          <Upload className="w-12 h-12 text-slate-400" />
        )}
        <div>
          <p className="text-lg font-medium text-slate-700">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            or click to browse files
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Supports PDF, DOCX, PPTX, XLSX, images, TXT, MD, JSON, CSV
        </p>
      </div>
    </div>
  );
}
