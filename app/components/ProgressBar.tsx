"use client";

interface ProgressBarProps {
  progress: number;
  filename: string;
}

export default function ProgressBar({ progress, filename }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700 truncate max-w-[70%]">
          {filename}
        </span>
        <span className="text-sm font-mono text-slate-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
