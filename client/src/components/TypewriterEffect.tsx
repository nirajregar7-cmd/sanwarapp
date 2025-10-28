import { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}

export function TypewriterEffect({ 
  text, 
  delay = 0, 
  speed = 100,
  className = "" 
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsComplete(true);
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, delay, speed]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}
