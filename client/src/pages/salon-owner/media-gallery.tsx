import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Image, 
  Video, 
  X, 
  Star, 
  Eye, 
  Trash2, 
  Edit3,
  Camera,
  Film,
  Tag,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SalonMedia } from "@shared/schema";
import { Link } from "wouter";

const MEDIA_CATEGORIES = [
  { value: "work", label: "Work Showcase", icon: Camera },
  { value: "staff", label: "Staff Photos", icon: Camera },
  { value: "interior", label: "Interior Design", icon: Image },
  { value: "services", label: "Services", icon: Tag },
  { value: "before_after", label: "Before & After", icon: Eye },
  { value: "other", label: "Other", icon: FileText }
];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function MediaGallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<SalonMedia | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<SalonMedia | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Get salon info first
  const { data: salon } = useQuery({
    queryKey: ["/api/owner/salon"],
  });

  const salonId = (salon as any)?.id;

  // Fetch existing media
  const { data: mediaList = [], isLoading } = useQuery<SalonMedia[]>({
    queryKey: [`/api/salons/${salonId}/media`],
    enabled: !!salonId,
  });

  // Gallery navigation functions
  const openMediaViewer = (media: SalonMedia, index: number) => {
    setViewingMedia(media);
    setCurrentMediaIndex(index);
  };

  const navigateToPrevious = () => {
    if (mediaList && mediaList.length > 0) {
      const newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaList.length - 1;
      setCurrentMediaIndex(newIndex);
      setViewingMedia(mediaList[newIndex]);
    }
  };

  const navigateToNext = () => {
    if (mediaList && mediaList.length > 0) {
      const newIndex = currentMediaIndex < mediaList.length - 1 ? currentMediaIndex + 1 : 0;
      setCurrentMediaIndex(newIndex);
      setViewingMedia(mediaList[newIndex]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewingMedia) {
        if (e.key === 'ArrowLeft') {
          navigateToPrevious();
        } else if (e.key === 'ArrowRight') {
          navigateToNext();
        } else if (e.key === 'Escape') {
          setViewingMedia(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewingMedia, currentMediaIndex, mediaList]);

  // Upload media mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/salons/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/media`] });
      setShowUploadDialog(false);
      setUploading(false);
      toast({
        title: "Upload Successful",
        description: "Media files have been uploaded successfully",
      });
    },
    onError: (error) => {
      setUploading(false);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      return apiRequest("DELETE", `/api/salons/media/${mediaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/media`] });
      toast({
        title: "Media Deleted",
        description: "Media file has been removed",
      });
    },
  });

  // Update media mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { mediaId: string; updates: Partial<SalonMedia> }) => {
      return apiRequest("PUT", `/api/salons/media/${data.mediaId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/media`] });
      setEditingMedia(null);
      toast({
        title: "Media Updated",
        description: "Media details have been updated",
      });
    },
  });

  // Set primary media mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      return apiRequest("PATCH", `/api/salons/media/${mediaId}/set-primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/media`] });
      toast({
        title: "Primary Image Set",
        description: "This image is now the primary image for your salon.",
      });
    },
    onError: (error) => {
      console.error("Set primary media error:", error);
      toast({
        title: "Failed to Set Primary",
        description: "Failed to set primary image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (files: FileList) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon information not found",
        variant: "destructive",
      });
      return;
    }

    if (mediaList.length + files.length > 50) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to 50 files total`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("salonId", salonId);

    let validFiles = 0;
    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 100MB`,
          variant: "destructive",
        });
        return;
      }

      formData.append(`files`, file);
      formData.append(`fileTypes`, isImage ? "image" : "video");
      validFiles++;
    });

    if (validFiles === 0) {
      setUploading(false);
      return;
    }

    try {
      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderMediaItem = (media: SalonMedia, index: number) => {
    const isVideo = media.fileType === "video";
    const IconComponent = isVideo ? Film : Camera;

    return (
      <div key={media.id} className="relative group">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-square">
            {isVideo ? (
              <video
                src={media.fileUrl}
                className="w-full h-full object-cover cursor-pointer"
                preload="metadata"
                onClick={() => openMediaViewer(media, index)}
                data-testid={`video-media-${media.id}`}
              />
            ) : (
              <img
                src={media.fileUrl}
                alt={media.title || "Salon media"}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openMediaViewer(media, index)}
                data-testid={`img-media-${media.id}`}
              />
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  openMediaViewer(media, index);
                }}
                className="bg-blue-500/80 hover:bg-blue-500"
                data-testid={`button-view-${media.id}`}
                title="View full size"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMedia(media);
                }}
                className="bg-white/20 hover:bg-white/30"
                data-testid={`button-edit-${media.id}`}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              {!media.isPrimary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimaryMutation.mutate(media.id);
                  }}
                  className="bg-yellow-500/80 hover:bg-yellow-500"
                  data-testid={`button-set-primary-${media.id}`}
                  title="Set as primary image"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(media.id);
                }}
                className="bg-red-500/80 hover:bg-red-500"
                data-testid={`button-delete-${media.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Media type badge */}
            <Badge 
              className="absolute top-2 left-2"
              variant={isVideo ? "default" : "secondary"}
            >
              <IconComponent className="h-3 w-3 mr-1" />
              {isVideo ? "Video" : "Photo"}
            </Badge>

            {/* Primary badge */}
            {media.isPrimary && (
              <Badge className="absolute top-2 right-2 bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                Primary
              </Badge>
            )}
          </div>

          <CardContent className="p-3">
            <div className="space-y-1">
              <h4 className="font-medium text-sm truncate" data-testid={`text-title-${media.id}`}>
                {media.title || media.fileName || "Untitled"}
              </h4>
              {media.category && (
                <p className="text-xs text-gray-600 capitalize" data-testid={`text-category-${media.id}`}>
                  {media.category.replace("_", " ")}
                </p>
              )}
              {media.fileSize && (
                <p className="text-xs text-gray-500" data-testid={`text-size-${media.id}`}>
                  {(media.fileSize / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!salon) {
    return (
      <div className="p-8 text-center">
        <p>Loading salon information...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/shopkeeper/dashboard" className="inline-flex">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-heading">Salon Media Gallery</h1>
            <p className="text-gray-600" data-testid="text-file-count">
              {mediaList.length} of 50 files uploaded
            </p>
          </div>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button disabled={mediaList.length >= 50} data-testid="button-upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Photos & Videos</DialogTitle>
              <DialogDescription>
                Upload up to {50 - mediaList.length} more files. Supported: Images (JPG, PNG, WebP) and Videos (MP4, WebM, MOV). Max size: 100MB per file.
              </DialogDescription>
            </DialogHeader>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-upload")?.click()}
              data-testid="upload-area"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Photos and videos up to 100MB each
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>

            {uploading && (
              <div className="text-center py-4" data-testid="upload-progress">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Uploading files...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(mediaList.length / 50) * 100}%` }}
          data-testid="progress-bar"
        />
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : mediaList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="media-grid">
          {mediaList.map((media, index) => renderMediaItem(media, index))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="empty-state">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media uploaded yet</h3>
          <p className="text-gray-600 mb-6">
            Start by uploading photos and videos of your salon to showcase your work
          </p>
          <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-first">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Media
          </Button>
        </div>
      )}

      {/* Edit Media Dialog */}
      {editingMedia && (
        <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Media Details</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  mediaId: editingMedia.id,
                  updates: {
                    title: formData.get("title") as string,
                    description: formData.get("description") as string,
                    category: formData.get("category") as string,
                    isPrimary: formData.get("isPrimary") === "on" || false,
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingMedia.title || ""}
                  placeholder="Give this media a title"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingMedia.description || ""}
                  placeholder="Describe what this shows"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingMedia.category || ""}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  name="isPrimary"
                  defaultChecked={editingMedia.isPrimary || false}
                  className="rounded"
                  data-testid="input-is-primary"
                />
                <Label htmlFor="isPrimary" className="text-sm">
                  Set as primary image for salon card
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingMedia(null)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Media Viewer Modal */}
      <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {viewingMedia?.title || viewingMedia?.fileName || "Media Viewer"}
            </DialogTitle>
            <DialogDescription>
              View {viewingMedia?.fileType === "video" ? "video" : "image"} in full screen
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <button
              onClick={() => setViewingMedia(null)}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
              data-testid="button-close-viewer"
            >
              <X className="h-5 w-5" />
            </button>
            
            {viewingMedia && (
              <div className="relative">
                {viewingMedia.fileType === "video" ? (
                  <video
                    src={viewingMedia.fileUrl}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    controls
                    autoPlay
                    data-testid={`video-viewer-${viewingMedia.id}`}
                  />
                ) : (
                  <img
                    src={viewingMedia.fileUrl}
                    alt={viewingMedia.title || "Salon media"}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    data-testid={`img-viewer-${viewingMedia.id}`}
                  />
                )}

                {/* Navigation arrows - only show if there are multiple images */}
                {mediaList && mediaList.length > 1 && (
                  <>
                    <button
                      onClick={navigateToPrevious}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors z-40"
                      data-testid="button-nav-previous"
                      title="Previous image (←)"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={navigateToNext}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors z-40"
                      data-testid="button-nav-next"
                      title="Next image (→)"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {mediaList && mediaList.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-40" data-testid="text-image-counter">
                    {currentMediaIndex + 1} / {mediaList.length}
                  </div>
                )}
                
                {/* Media info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="text-white">
                    <h3 className="text-lg font-semibold" data-testid="text-viewer-title">
                      {viewingMedia.title || viewingMedia.fileName || "Untitled"}
                    </h3>
                    {viewingMedia.category && (
                      <p className="text-sm opacity-80 capitalize" data-testid="text-viewer-category">
                        {viewingMedia.category.replace("_", " ")}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm opacity-80 mt-2">
                      <span>{viewingMedia.fileType === "video" ? "Video" : "Photo"}</span>
                      {viewingMedia.fileSize && (
                        <span>{(viewingMedia.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                      )}
                      {viewingMedia.isPrimary && (
                        <span className="bg-yellow-500 px-2 py-1 rounded text-xs">Primary</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}