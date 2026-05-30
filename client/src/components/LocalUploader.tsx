import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LocalUploaderProps {
  maxFileSize?: number; // bytes
  accept?: string;
  onUpload: (url: string) => void;
  buttonText?: string;
  className?: string;
  children?: React.ReactNode;
}

export function LocalUploader({
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  accept = "image/*",
  onUpload,
  buttonText = "Upload",
  className = "",
  children,
}: LocalUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      alert(`File too large. Max size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      const url = data.url || data.path;
      if (url) {
        onUpload(url);
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          children || (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )
        )}
      </Button>
    </div>
  );
}
