import { useState } from "react";
import { MOOD_EMOJIS, MoodRating, getRatingFromMood } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MoodRatingSelectorProps {
  selectedMood?: MoodRating;
  onMoodSelect: (mood: MoodRating, rating: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MoodRatingSelector({
  selectedMood,
  onMoodSelect,
  className,
  size = "md"
}: MoodRatingSelectorProps) {
  const [hoveredMood, setHoveredMood] = useState<MoodRating | null>(null);

  const sizeClasses = {
    sm: "text-2xl p-2",
    md: "text-3xl p-3",
    lg: "text-4xl p-4"
  };

  const moods: MoodRating[] = ["very_sad", "sad", "neutral", "happy", "very_happy"];

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="flex space-x-2">
        {moods.map((mood) => {
          const emojiData = MOOD_EMOJIS[mood];
          const isSelected = selectedMood === mood;
          const isHovered = hoveredMood === mood;
          
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onMoodSelect(mood, getRatingFromMood(mood))}
              onMouseEnter={() => setHoveredMood(mood)}
              onMouseLeave={() => setHoveredMood(null)}
              className={cn(
                "rounded-full border-2 transition-all duration-200 hover:scale-110",
                sizeClasses[size],
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 scale-110 shadow-lg"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                isHovered && !isSelected && "border-gray-400 bg-gray-50 dark:bg-gray-800"
              )}
              title={emojiData.label}
            >
              <span className="block">{emojiData.emoji}</span>
            </button>
          );
        })}
      </div>
      
      {/* Show label for selected or hovered mood */}
      {(selectedMood || hoveredMood) && (
        <div className="text-center">
          <p className={cn(
            "font-medium transition-colors duration-200",
            MOOD_EMOJIS[selectedMood || hoveredMood!].color
          )}>
            {MOOD_EMOJIS[selectedMood || hoveredMood!].label}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getRatingFromMood(selectedMood || hoveredMood!)} out of 5 stars
          </p>
        </div>
      )}
    </div>
  );
}

// Display component for showing existing mood ratings
interface MoodRatingDisplayProps {
  mood: MoodRating;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MoodRatingDisplay({
  mood,
  showLabel = false,
  size = "md",
  className
}: MoodRatingDisplayProps) {
  const emojiData = MOOD_EMOJIS[mood];
  
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className={sizeClasses[size]} title={emojiData.label}>
        {emojiData.emoji}
      </span>
      {showLabel && (
        <span className={cn("font-medium", emojiData.color)}>
          {emojiData.label}
        </span>
      )}
    </div>
  );
}