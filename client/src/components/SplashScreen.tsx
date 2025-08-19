import { useState, useEffect } from 'react';
import './SplashScreen.css';

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
        <svg className="splash-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEFCE8"/>
              <stop offset="1" stopColor="#FDE047"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="35" fill="url(#logoGradient)" opacity="0.2"/>
          <path d="M30 30 L70 30 L70 35 L35 35 L35 70 L30 70 Z" fill="url(#logoGradient)"/>
          <path d="M45 40 L65 40 L65 45 L50 45 L50 65 L45 65 Z" fill="url(#logoGradient)"/>
          <circle cx="35" cy="55" r="3" fill="url(#logoGradient)"/>
          <path d="M40 50 L60 35" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round"/>
          <path d="M40 60 L60 70" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        
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
          src="/sanwar-logo.jpg" 
          alt="SanWar Official Logo" 
          className="welcome-logo"
          data-testid="img-welcome-logo"
        />
        <h2 className="welcome-message">
          Welcome to <span className="highlight">SanWar</span>
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