import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X, Upload, ImagePlus, CheckCircle, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CustomerShowcaseProps {
  salonId: string;
  salonName?: string;
}

export function CustomerShowcaseSection({ salonId, salonName }: CustomerShowcaseProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: showcase, isLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}/showcase`],
    enabled: !!salonId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      return await apiRequest("POST", `/api/salons/${salonId}/showcase`, {
        photoUrl,
        caption,
        serviceName,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photo submitted!",
        description: "Your photo will appear after salon owner approval. You'll get ₹30 wallet credit!",
      });
      setUploadOpen(false);
      setPreviewUrl("");
      setCaption("");
      setServiceName("");
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/showcase`] });
    },
    onError: () => {
      toast({
        title: "Failed to submit",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPreviewUrl(data.url || data.fileUrl);
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!previewUrl) {
      toast({ title: "Please upload a photo first", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(previewUrl);
  };

  const photos = (showcase as any[]) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Real Customers at {salonName || "This Salon"}</h3>
        </div>
        {user && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => setUploadOpen(true)}
          >
            <ImagePlus className="h-4 w-4 mr-1.5" />
            Share Your Look
          </Button>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No customer photos yet. Be the first to share!</p>
          {user && (
            <Button
              variant="link"
              className="text-purple-600 mt-1"
              onClick={() => setUploadOpen(true)}
            >
              Upload your photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:border-purple-300 transition-all"
              onClick={() => {
                // Could open a lightbox here
                window.open(photo.photoUrl, "_blank");
              }}
            >
              <img
                src={photo.photoUrl}
                alt={photo.caption || "Customer photo"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.customerName || "Customer"}
                  </p>
                  {photo.serviceName && (
                    <p className="text-white/70 text-[10px] truncate">{photo.serviceName}</p>
                  )}
                </div>
              </div>
              {!photo.isApproved && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Share Your Salon Experience
            </DialogTitle>
            <DialogDescription>
              Upload a photo of your new look! After approval, you'll get ₹30 wallet credit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo preview / upload area */}
            <div
              className="relative border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:bg-purple-50/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-700 font-medium">
                    {uploading ? "Uploading..." : "Click to upload photo"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG · Max 5MB</p>
                </div>
              )}
            </div>

            {/* Service name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">What service did you get?</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Haircut, Facial, Manicure"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Your story (optional)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="How was your experience?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Reward badge */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 flex items-center gap-2 border border-purple-100">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-purple-700">
                <span className="font-semibold">₹30 wallet credit</span> after salon owner approves your photo
              </p>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl"
              onClick={handleSubmit}
              disabled={!previewUrl || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Submitting..." : "Submit Photo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
