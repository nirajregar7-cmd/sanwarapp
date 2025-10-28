import { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  loop?: boolean;
  pauseAfterComplete?: number;
}

export function TypewriterEffect({ 
  text, 
  delay = 0, 
  speed = 100,
  className = "",
  loop = true,
  pauseAfterComplete = 2000
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseAfterComplete);
      return () => clearTimeout(pauseTimeout);
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished typing
          if (loop) {
            setIsPaused(true);
          }
        }
      } else {
        // Deleting backward
        if (currentIndex > 0) {
          setDisplayedText(text.substring(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else {
          // Finished deleting, start typing again
          setIsDeleting(false);
        }
      }
    }, currentIndex === 0 && !isDeleting ? delay : isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, delay, speed, isDeleting, isPaused, loop, pauseAfterComplete]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
