import { Clock, CreditCard, Languages, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCountryConfig } from "@/hooks/useCountryConfig";

interface CountryConfigDisplayProps {
  onChangeClick?: () => void;
  showChangeButton?: boolean;
  compact?: boolean;
}

export function CountryConfigDisplay({ 
  onChangeClick, 
  showChangeButton = false,
  compact = false 
}: CountryConfigDisplayProps) {
  const { countryConfig } = useCountryConfig();

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xl">{countryConfig.flag}</span>
        <span className="font-medium">{countryConfig.name}</span>
        <Badge variant="secondary" className="text-xs">
          {countryConfig.currency.symbol} {countryConfig.currency.code}
        </Badge>
        {showChangeButton && (
          <Button variant="ghost" size="sm" onClick={onChangeClick}>
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Regional Settings
        </CardTitle>
        {showChangeButton && (
          <Button variant="outline" size="sm" onClick={onChangeClick}>
            <Settings className="h-4 w-4 mr-2" />
            Change
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{countryConfig.flag}</span>
          <div>
            <h3 className="font-semibold text-lg">{countryConfig.name}</h3>
            <p className="text-sm text-gray-600">Current region</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Time Zone */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-blue-600 mt-1" />
            <div>
              <h4 className="text-sm font-medium">Time Zone</h4>
              <p className="text-xs text-gray-600">{countryConfig.timezone}</p>
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 flex items-center justify-center text-green-600 font-bold text-sm mt-1">
              {countryConfig.currency.symbol}
            </div>
            <div>
              <h4 className="text-sm font-medium">Currency</h4>
              <p className="text-xs text-gray-600">{countryConfig.currency.code}</p>
            </div>
          </div>

          {/* Payment Gateway */}
          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 text-purple-600 mt-1" />
            <div>
              <h4 className="text-sm font-medium">Payment</h4>
              <p className="text-xs text-gray-600">{countryConfig.paymentGateway}</p>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-start gap-3">
            <Languages className="h-4 w-4 text-orange-600 mt-1" />
            <div>
              <h4 className="text-sm font-medium">Language</h4>
              <p className="text-xs text-gray-600">{countryConfig.defaultLanguage}</p>
            </div>
          </div>
        </div>

        {/* Available Languages */}
        <div className="pt-2 border-t">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Available Languages:</h5>
          <div className="flex flex-wrap gap-1">
            {countryConfig.languages.map((language) => (
              <Badge key={language} variant="secondary" className="text-xs px-2 py-0.5">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}