import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Clock, CreditCard, Languages, Check } from "lucide-react";
import { useLocation } from "wouter";

interface CountryConfig {
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

const countryConfigs: CountryConfig[] = [
  {
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    timezone: "Asia/Kolkata (IST)",
    currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
    paymentGateway: "Cashfree",
    languages: ["Hindi", "English"],
    defaultLanguage: "Hindi/English"
  },
  {
    name: "United States",
    code: "US", 
    flag: "🇺🇸",
    timezone: "America/New_York (EST)",
    currency: { code: "USD", symbol: "$", name: "US Dollar" },
    paymentGateway: "Stripe",
    languages: ["English"],
    defaultLanguage: "English"
  },
  {
    name: "United Kingdom",
    code: "GB",
    flag: "🇬🇧", 
    timezone: "Europe/London (GMT)",
    currency: { code: "GBP", symbol: "£", name: "British Pound" },
    paymentGateway: "Stripe",
    languages: ["English"],
    defaultLanguage: "English"
  },
  {
    name: "Germany",
    code: "DE",
    flag: "🇩🇪",
    timezone: "Europe/Berlin (CET)",
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    paymentGateway: "Stripe",
    languages: ["German", "English"],
    defaultLanguage: "German"
  },
  {
    name: "France",
    code: "FR",
    flag: "🇫🇷",
    timezone: "Europe/Paris (CET)", 
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    paymentGateway: "Stripe",
    languages: ["French", "English"],
    defaultLanguage: "French"
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    timezone: "Asia/Dubai (GST)",
    currency: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    paymentGateway: "Stripe",
    languages: ["Arabic", "English"],
    defaultLanguage: "English"
  },
  {
    name: "Canada", 
    code: "CA",
    flag: "🇨🇦",
    timezone: "America/Toronto (EST)",
    currency: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    paymentGateway: "Stripe",
    languages: ["English", "French"],
    defaultLanguage: "English"
  },
  {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    timezone: "Australia/Sydney (AEST)",
    currency: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    paymentGateway: "Stripe", 
    languages: ["English"],
    defaultLanguage: "English"
  },
  {
    name: "Spain",
    code: "ES", 
    flag: "🇪🇸",
    timezone: "Europe/Madrid (CET)",
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    paymentGateway: "Stripe",
    languages: ["Spanish", "English"],
    defaultLanguage: "Spanish"
  },
  {
    name: "Singapore",
    code: "SG",
    flag: "🇸🇬",
    timezone: "Asia/Singapore (SGT)",
    currency: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    paymentGateway: "Stripe",
    languages: ["English", "Mandarin"],
    defaultLanguage: "English"
  }
];

export default function CountryOnboarding() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedConfig, setSelectedConfig] = useState<CountryConfig | null>(null);
  const [, navigate] = useLocation();

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const config = countryConfigs.find(c => c.code === countryCode);
    setSelectedConfig(config || null);
  };

  const handleContinue = () => {
    if (selectedConfig) {
      // Save country configuration to localStorage
      localStorage.setItem('sanwar_country_config', JSON.stringify(selectedConfig));
      localStorage.setItem('sanwar_country_onboarding_completed', 'true');
      
      // Navigate to main app
      navigate("/");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome to Sanwar
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Let's set up your experience by selecting your country
          </p>
        </div>

        {/* Country Selection */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select Your Country
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-12" data-testid="country-select">
                <SelectValue placeholder="Choose your country" />
              </SelectTrigger>
              <SelectContent>
                {countryConfigs.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{country.flag}</span>
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Configuration Preview */}
            {selectedConfig && (
              <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Check className="h-5 w-5 text-green-600" />
                      Configuration for {selectedConfig.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Time Zone */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Time Zone</h4>
                          <p className="text-sm text-gray-600">{selectedConfig.timezone}</p>
                        </div>
                      </div>

                      {/* Currency */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <div className="h-5 w-5 flex items-center justify-center text-green-600 font-bold mt-0.5">
                          {selectedConfig.currency.symbol}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Currency</h4>
                          <p className="text-sm text-gray-600">
                            {selectedConfig.currency.name} ({selectedConfig.currency.code})
                          </p>
                        </div>
                      </div>

                      {/* Payment Gateway */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Payment Gateway</h4>
                          <p className="text-sm text-gray-600">{selectedConfig.paymentGateway}</p>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <Languages className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Default Language</h4>
                          <p className="text-sm text-gray-600">{selectedConfig.defaultLanguage}</p>
                        </div>
                      </div>
                    </div>

                    {/* Available Languages */}
                    <div className="pt-2">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Available Languages:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedConfig.languages.map((language) => (
                          <Badge key={language} variant="secondary" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Continue Button */}
            {selectedConfig && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleContinue}
                  className="px-8 h-12 text-base"
                  data-testid="continue-button"
                >
                  Continue to Sanwar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            You can change these settings later in your account preferences
          </p>
        </div>
      </div>
    </div>
  );
}