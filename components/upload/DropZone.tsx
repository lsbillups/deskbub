'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function DropZone({ onFilesSelected, maxFiles = 5 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const valid: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a JPG, PNG, or WebP.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" is too large (max 10MB).`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length > maxFiles) {
      setError(`Max ${maxFiles} photos allowed. Only the first ${maxFiles} will be used.`);
      return valid.slice(0, maxFiles);
    }
    return valid;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const valid = validateFiles(files);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = validateFiles(files);
    if (valid.length > 0) onFilesSelected(valid);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-coral bg-coral/5 scale-[1.02]'
              : 'border-gray-300 hover:border-coral/50 hover:bg-coral/[0.02]'
          }
        `}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="pointer-events-none">
          <div className="text-5xl mb-4">📸</div>
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">
            Drop 3-5 photos of your pet
          </h3>
          <p className="text-text-secondary text-sm mb-3">
            or click to browse — JPG, PNG, WebP up to 10MB each
          </p>
          <div className="flex justify-center gap-6 text-xs text-text-secondary/60">
            <span>📷 Front</span>
            <span>↩️ Side</span>
            <span>↪️ Other side</span>
            <span>🔽 Back</span>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-500 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
