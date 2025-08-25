import { useState, useEffect } from 'react';

export interface CountryConfig {
  name: string;
  code: string;
  flag: string;
  timezone: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  paymentGateway: string;
  languages: string[];
  defaultLanguage: string;
}

const defaultConfig: CountryConfig = {
  name: "India",
  code: "IN",
  flag: "🇮🇳",
  timezone: "Asia/Kolkata (IST)",
  currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  paymentGateway: "Cashfree",
  languages: ["Hindi", "English"],
  defaultLanguage: "Hindi/English"
};

export function useCountryConfig() {
  const [countryConfig, setCountryConfig] = useState<CountryConfig>(defaultConfig);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if country configuration exists
    const savedConfig = localStorage.getItem('sanwar_country_config');
    const onboardingCompleted = localStorage.getItem('sanwar_country_onboarding_completed');
    
    if (savedConfig && onboardingCompleted) {
      try {
        const config = JSON.parse(savedConfig);
        setCountryConfig(config);
        setIsConfigured(true);
      } catch (error) {
        console.error('Error parsing country config:', error);
        setIsConfigured(false);
      }
    } else {
      setIsConfigured(false);
    }
  }, []);

  const updateCountryConfig = (newConfig: CountryConfig) => {
    setCountryConfig(newConfig);
    localStorage.setItem('sanwar_country_config', JSON.stringify(newConfig));
    localStorage.setItem('sanwar_country_onboarding_completed', 'true');
    setIsConfigured(true);
  };

  const resetCountryConfig = () => {
    localStorage.removeItem('sanwar_country_config');
    localStorage.removeItem('sanwar_country_onboarding_completed');
    setCountryConfig(defaultConfig);
    setIsConfigured(false);
  };

  return {
    countryConfig,
    isConfigured,
    updateCountryConfig,
    resetCountryConfig
  };
}