"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUp } from "lucide-react";
import UploadZone from "./components/UploadZone";
import FileList, { UploadedFile } from "./components/FileList";

const STORAGE_KEY = "uploaded-files";

function loadFilesFromStorage(): UploadedFile[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const files: UploadedFile[] = JSON.parse(stored);
    return files.filter((f) => f.status !== "uploading");
  } catch {
    return [];
  }
}

function saveFilesToStorage(files: UploadedFile[]) {
  try {
    const toSave = files.filter((f) => f.status !== "uploading");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore storage errors
  }
}

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setFiles(loadFilesFromStorage());
  }, []);

  useEffect(() => {
    saveFilesToStorage(files);
  }, [files]);

  const uploadFile = useCallback(async (file: File, fileId: string) => {
    try {
      // Step 1: Get presigned URL
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      const res = await fetch(`/api/presigned-url?${params}`);
      if (!res.ok) {
        throw new Error("Failed to get presigned URL");
      }
      const { url, key } = await res.json();

      // Step 2: Upload to MinIO via presigned URL using XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setFiles((prev) =>
              prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // Step 3: Mark as success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                key,
                uploadedAt: new Date().toISOString(),
              }
            : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  }, []);

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setIsUploading(true);

      const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        status: "uploading" as const,
        progress: 0,
      }));

      setFiles((prev) => [...newFiles, ...prev]);

      // Upload all files concurrently
      await Promise.allSettled(
        selectedFiles.map((file, i) => uploadFile(file, newFiles[i].id))
      );

      setIsUploading(false);
    },
    [uploadFile]
  );

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <FileUp className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Document Upload
            </h1>
            <p className="text-sm text-slate-500">
              Upload files to be processed by the document pipeline
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-6">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />
        </div>

        {/* Stats */}
        {files.length > 0 && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-slate-500">
              {files.length} file{files.length !== 1 ? "s" : ""} total
            </span>
            {successCount > 0 && (
              <span className="text-green-600 font-medium">
                {successCount} uploaded
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600 font-medium">
                {errorCount} failed
              </span>
            )}
          </div>
        )}

        {/* File List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Upload History
          </h2>
          <FileList files={files} onRemove={handleRemove} />
        </div>
      </div>
    </div>
  );
}
