import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Clock, CreditCard, Languages, Check, ArrowLeft } from "lucide-react";
import { useCountryConfig, CountryConfig } from "@/hooks/useCountryConfig";
import { CountryConfigDisplay } from "@/components/CountryConfigDisplay";
import { toast } from "@/hooks/use-toast";

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

export default function CountrySettings() {
  const { countryConfig, updateCountryConfig } = useCountryConfig();
  const [selectedCountry, setSelectedCountry] = useState<string>(countryConfig.code);
  const [selectedConfig, setSelectedConfig] = useState<CountryConfig>(countryConfig);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const config = countryConfigs.find(c => c.code === countryCode);
    if (config) {
      setSelectedConfig(config);
    }
  };

  const handleSaveChanges = () => {
    updateCountryConfig(selectedConfig);
    setIsDialogOpen(false);
    toast({
      title: "Settings Updated",
      description: `Your regional settings have been updated for ${selectedConfig.name}`,
    });
  };

  const handleCancel = () => {
    setSelectedCountry(countryConfig.code);
    setSelectedConfig(countryConfig);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Regional Settings</h1>
      </div>

      {/* Current Configuration */}
      <CountryConfigDisplay 
        showChangeButton={true}
        onChangeClick={() => setIsDialogOpen(true)}
      />

      {/* Change Country Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Change Regional Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Country Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Country</label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-12">
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
            </div>

            {/* Configuration Preview */}
            {selectedConfig && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    New Configuration for {selectedConfig.name}
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
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={selectedConfig.code === countryConfig.code}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}