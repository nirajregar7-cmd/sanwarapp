import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ReviewPhotoGalleryProps {
  photos: string[];
  reviewId?: string;
  className?: string;
}

export function ReviewPhotoGallery({ photos, reviewId, className = "" }: ReviewPhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openPhotoModal = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : photos.length - 1;
    } else {
      newIndex = selectedPhotoIndex < photos.length - 1 ? selectedPhotoIndex + 1 : 0;
    }
    setSelectedPhotoIndex(newIndex);
  };

  // Layout logic based on number of photos
  const getGridLayout = () => {
    switch (photos.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      default:
        return "grid-cols-2"; // Show first 3, with "+X more" indicator for 4+
    }
  };

  const visiblePhotos = photos.slice(0, 3);
  const remainingPhotos = Math.max(0, photos.length - 3);

  return (
    <>
      <div className={`mt-3 ${className}`}>
        <div className={`grid gap-2 ${getGridLayout()}`}>
          {visiblePhotos.map((photo, index) => (
            <div
              key={index}
              className="relative group cursor-pointer overflow-hidden rounded-lg border"
              onClick={() => openPhotoModal(index)}
            >
              <img
                src={photo}
                alt={`Review photo ${index + 1}${reviewId ? ` for review ${reviewId}` : ''}`}
                className="w-full h-20 sm:h-24 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Show remaining photos count on last visible photo */}
              {index === 2 && remainingPhotos > 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    +{remainingPhotos} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Photo Modal */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={closePhotoModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {selectedPhotoIndex !== null && (
              <div className="relative">
                <img
                  src={photos[selectedPhotoIndex]}
                  alt={`Review photo ${selectedPhotoIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                
                {/* Navigation buttons */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => navigatePhoto('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                    >
                      <span className="sr-only">Previous photo</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigatePhoto('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                    >
                      <span className="sr-only">Next photo</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Photo counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedPhotoIndex + 1} of {photos.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}