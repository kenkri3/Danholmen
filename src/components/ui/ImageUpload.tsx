import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

interface UploadError {
  message: string;
  type: "size" | "format" | "limit" | "general";
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showError = useCallback((message: string, type: UploadError["type"] = "general") => {
    setError({ message, type });
    setTimeout(() => setError(null), 4000);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Kunne ikke lese filen"));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);

      if (files.length === 0) return;

      // Check if adding these would exceed max images
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        showError(`Maksimalt ${maxImages} bilder tillatt`, "limit");
        return;
      }

      // Validate file types and sizes
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      const validFiles: File[] = [];
      const rejectedFiles: { file: File; reason: string }[] = [];

      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          rejectedFiles.push({
            file,
            reason: `Ugyldig format: ${file.name}. Kun JPEG, PNG og WebP er tillatt.`,
          });
          continue;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          rejectedFiles.push({
            file,
            reason: `For stor: ${file.name}. Maks ${maxSizeMB}MB.`,
          });
          continue;
        }
        validFiles.push(file);
      }

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0];
        showError(
          firstError.reason,
          firstError.reason.includes("format") ? "format" : "size"
        );
      }

      if (validFiles.length === 0) return;

      // Limit to remaining slots
      const filesToProcess = validFiles.slice(0, remainingSlots);
      if (validFiles.length > remainingSlots) {
        showError(`Kun ${remainingSlots} bilde(r) kan legges til`, "limit");
      }

      setUploading(true);

      try {
        const base64Results = await Promise.all(
          filesToProcess.map(processFile)
        );
        const newImages = [...images, ...base64Results];
        onImagesChange(newImages);
      } catch {
        showError("Det oppstod en feil under opplasting av bilder", "general");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, maxSizeMB, processFile, showError, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      handleFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`image-upload-zone ${
            isDragging ? "dragover" : ""
          } ${error ? "border-sauna-red bg-red-50" : ""}`}
          style={{
            border: error ? "2px dashed #C44B6B" : undefined,
            background: error ? "rgba(196, 75, 107, 0.05)" : undefined,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Laster opp...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <ImagePlus
                className={`w-8 h-8 transition-colors ${
                  isDragging ? "text-teal" : "text-text-muted"
                }`}
              />
              <p className="text-sm text-text-secondary">
                Dra bilder hit eller klikk for å laste opp
              </p>
              <p className="text-xs text-text-muted">
                JPEG, PNG, WebP — maks {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-xs text-sauna-red bg-red-50 rounded-lg px-3 py-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
          >
            <AnimatePresence>
              {images.map((img, idx) => (
                <motion.div
                  key={`${img.slice(0, 40)}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[#DDD6CC] group"
                >
                  <img
                    src={img}
                    alt={`Bilde ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-sauna-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-deep-teal/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Hoved
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {images.length >= maxImages && (
        <p className="text-xs text-text-muted text-center">
          Maksimalt {maxImages} bilder
        </p>
      )}
    </div>
  );
}
