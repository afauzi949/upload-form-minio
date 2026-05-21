"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUp } from "lucide-react";
import UploadZone from "./components/UploadZone";
import FileList, { UploadedFile } from "./components/FileList";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
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

  const pollStatus = useCallback((fileId: string, localId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/status/${fileId}`);
        if (!res.ok) return;

        const data = await res.json();

        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== localId) return f;
            return {
              ...f,
              status: data.status as UploadedFile["status"],
              indexedAt: data.indexed_at,
              chunkCount: data.chunk_count,
              error: data.error_msg,
            };
          })
        );

        // Stop polling jika status final
        if (data.status === "done" || data.status === "failed") {
          clearInterval(interval);
        }
      } catch {
        // Ignore polling errors, will retry
      }
    }, 3000); // Poll setiap 3 detik

    // Cleanup: stop polling setelah 5 menit (safety timeout)
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }, []);

  const uploadFile = useCallback(async (file: File, localId: string) => {
    try {
      // Step 1: Upload file ke Backend API
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      // data = { file_id, status: "pending", message: "File queued for processing" }

      // Step 2: Update state — status jadi "pending", simpan file_id untuk polling
      setFiles((prev) =>
        prev.map((f) =>
          f.id === localId
            ? {
                ...f,
                status: "pending" as const,
                progress: 100,
                fileId: data.file_id,
                uploadedAt: new Date().toISOString(),
              }
            : f
        )
      );

      // Step 3: Mulai polling status
      pollStatus(data.file_id, localId);

    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === localId
            ? {
                ...f,
                status: "failed" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  }, [pollStatus]);

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

  const doneCount = files.filter((f) => f.status === "done").length;
  const processingCount = files.filter((f) => f.status === "processing" || f.status === "pending").length;
  const failedCount = files.filter((f) => f.status === "failed").length;

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
            {doneCount > 0 && (
              <span className="text-green-600 font-medium">
                {doneCount} done
              </span>
            )}
            {processingCount > 0 && (
              <span className="text-blue-600 font-medium">
                {processingCount} processing
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-red-600 font-medium">
                {failedCount} failed
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
