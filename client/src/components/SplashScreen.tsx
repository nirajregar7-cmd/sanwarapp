import { useState, useEffect } from 'react';
import './SplashScreen.css';
import sanwarLogo from '@/assets/sanwar-new-logo.jpg';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Switch to welcome screen after splash animation
    const splashTimer = setTimeout(() => {
      setShowWelcome(true);
    }, 4000);

    return () => clearTimeout(splashTimer);
  }, []);

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <>
      {/* Splash Screen */}
      <div
        className={`splash-screen ${showWelcome ? 'fade-out' : ''}`}
        data-testid="splash-screen"
      >
        <img 
          src={sanwarLogo} 
          alt="SanWar Logo" 
          className="splash-logo"
        />
        
        <h1 className="splash-title">
          <span className="char">S</span>
          <span className="char">a</span>
          <span className="char">n</span>
          <span className="char">W</span>
          <span className="char">a</span>
          <span className="char">r</span>
        </h1>
        
        <p className="splash-tagline">
          <span className="word">Discover</span>
          <span className="word">salons</span>
          <span className="word">near</span>
          <span className="word">you,</span>
          <span className="word">book</span>
          <span className="word">instantly,</span>
          <span className="word">and</span>
          <span className="word">shine</span>
          <span className="word">with</span>
          <span className="word">confidence.</span>
        </p>
      </div>

      {/* Welcome Screen */}
      <div
        className={`welcome-screen ${showWelcome ? 'fade-in' : ''}`}
        data-testid="welcome-screen"
      >
        <img 
          src={sanwarLogo} 
          alt="SanWar Official Logo" 
          className="welcome-logo"
          data-testid="img-welcome-logo"
        />
        <h2 className="welcome-message">
          <span className="welcome-typing">
            <span className="char">W</span>
            <span className="char">e</span>
            <span className="char">l</span>
            <span className="char">c</span>
            <span className="char">o</span>
            <span className="char">m</span>
            <span className="char">e</span>
            <span className="char">&nbsp;</span>
            <span className="char">t</span>
            <span className="char">o</span>
            <span className="char">&nbsp;</span>
            <span className="highlight-char">S</span>
            <span className="highlight-char">a</span>
            <span className="highlight-char">n</span>
            <span className="highlight-char">W</span>
            <span className="highlight-char">a</span>
            <span className="highlight-char">r</span>
          </span>
        </h2>
        <button 
          className="start-button" 
          onClick={handleGetStarted}
          data-testid="button-get-started"
        >
          Get Started
        </button>
      </div>
    </>
  );
}