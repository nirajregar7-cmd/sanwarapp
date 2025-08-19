import { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './OnboardingWalkthrough.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  image?: string;
  action?: 'highlight' | 'click' | 'scroll';
}

interface OnboardingWalkthroughProps {
  steps: OnboardingStep[];
  userType: 'customer' | 'salon-owner' | 'brand-owner';
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWalkthrough({ 
  steps, 
  userType, 
  onComplete, 
  onSkip 
}: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight class
        element.classList.add('onboarding-highlight');
        
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [currentStep, steps]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Mark onboarding as completed for this user type
    localStorage.setItem(`sanwar_onboarding_${userType}`, 'completed');
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(`sanwar_onboarding_${userType}`, 'skipped');
    onSkip();
  };

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" data-testid="onboarding-overlay" />
      
      {/* Onboarding Modal */}
      <div 
        className={`onboarding-modal onboarding-modal-${currentStepData.position}`}
        data-testid="onboarding-modal"
      >
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-step-counter">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button 
            onClick={handleSkip}
            className="onboarding-close-btn"
            data-testid="button-skip-onboarding"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="onboarding-progress-container">
          <div 
            className="onboarding-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="onboarding-content">
          {currentStepData.image && (
            <div className="onboarding-image">
              <img 
                src={currentStepData.image} 
                alt={currentStepData.title}
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          
          <h3 className="onboarding-title" data-testid="text-step-title">
            {currentStepData.title}
          </h3>
          
          <p className="onboarding-description" data-testid="text-step-description">
            {currentStepData.description}
          </p>
        </div>

        {/* Footer */}
        <div className="onboarding-footer">
          <div className="onboarding-navigation">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="onboarding-nav-btn"
              data-testid="button-prev-step"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            
            <div className="onboarding-dots">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`onboarding-dot ${
                    index === currentStep ? 'active' : 
                    index < currentStep ? 'completed' : ''
                  }`}
                  onClick={() => setCurrentStep(index)}
                  data-testid={`dot-step-${index}`}
                />
              ))}
            </div>
            
            <Button
              onClick={nextStep}
              className="onboarding-nav-btn onboarding-primary-btn"
              data-testid="button-next-step"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check size={16} />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}