'use client';

import { useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  title?: string;
  subtitle?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function DropZone({ onFilesSelected, maxFiles = 5, title, subtitle }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const valid: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) { setError(`${f.name} is not a supported format.`); continue; }
      if (f.size > MAX_SIZE) { setError(`${f.name} exceeds 10MB.`); continue; }
      valid.push(f);
    }
    return valid.slice(0, maxFiles);
  };

  const processFiles = (files: File[]) => {
    const valid = validateFiles(files);
    if (valid.length > 0) onFilesSelected(valid);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center
          transition-all duration-300 select-none
          ${isDragging
            ? 'border-coral bg-coral/[0.04] scale-[1.01] shadow-xl shadow-coral/10'
            : 'border-gray-200 hover:border-coral/40 hover:bg-coral/[0.02] hover:shadow-lg hover:shadow-coral/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple={maxFiles > 1}
          onChange={handleChange}
          className="hidden"
        />

        <div className="pointer-events-none space-y-4">
          {/* Camera icon */}
          <motion.div
            animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-coral/10 to-mint/10 mx-auto"
          >
            <span className="text-4xl">📸</span>
          </motion.div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-display font-bold text-text-primary">
            {title || 'Drop a photo of your pet'}
          </h3>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto leading-relaxed">
            {subtitle || 'or click to browse — JPG, PNG, WebP up to 10MB'}
          </p>

          {/* Accepted formats badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-text-secondary/50">
            <span className="px-3 py-1 rounded-full bg-white/60 border border-gray-100">JPG</span>
            <span className="px-3 py-1 rounded-full bg-white/60 border border-gray-100">PNG</span>
            <span className="px-3 py-1 rounded-full bg-white/60 border border-gray-100">WebP</span>
            <span className="px-3 py-1 rounded-full bg-white/60 border border-gray-100">≤10MB</span>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-coral/[0.02] to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      </motion.div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">
          {error}
        </motion.p>
      )}
    </div>
  );
}
