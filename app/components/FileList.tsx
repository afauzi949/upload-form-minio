"use client";

import { FileText, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

export interface UploadedFile {
  id: string;            // Saat upload: local ID. Setelah upload: file_id dari backend
  name: string;
  size: number;
  status: "uploading" | "pending" | "processing" | "done" | "failed";
  progress: number;
  fileId?: string;       // UUID dari backend (untuk polling)
  key?: string;
  uploadedAt?: string;
  indexedAt?: string;    // Waktu selesai indexing
  chunkCount?: number;   // Jumlah chunk yang di-embed
  error?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({ status }: { status: UploadedFile["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "uploading":
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    case "pending":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "processing":
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
  }
}

function statusLabel(status: UploadedFile["status"]): string {
  switch (status) {
    case "uploading": return "Uploading...";
    case "pending": return "Queued";
    case "processing": return "Processing...";
    case "done": return "Done";
    case "failed": return "Failed";
  }
}

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
        >
          <StatusIcon status={file.status} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {file.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{formatFileSize(file.size)}</span>
              {file.uploadedAt && (
                <>
                  <span>&middot;</span>
                  <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                </>
              )}
              {file.error && (
                <>
                  <span>&middot;</span>
                  <span className="text-red-500">{file.error}</span>
                </>
              )}
              {/* Pipeline info */}
              {file.status === "done" && file.chunkCount && (
                <>
                  <span>&middot;</span>
                  <span className="text-green-600">{file.chunkCount} chunks indexed</span>
                </>
              )}
              {file.status === "pending" && (
                <>
                  <span>&middot;</span>
                  <span className="text-yellow-600">Waiting for pipeline...</span>
                </>
              )}
              {file.status === "processing" && (
                <>
                  <span>&middot;</span>
                  <span className="text-blue-600">Pipeline processing...</span>
                </>
              )}
            </div>
            {file.status === "uploading" && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(file.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
