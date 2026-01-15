import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { MapPin, RefreshCw, ArrowLeft, Check } from 'lucide-react';
import type { UserInfo, GeoLocation } from '@/app/App';

type GeoLocationScreenProps = {
  userInfo: UserInfo;
  onContinue: (location: GeoLocation) => void;
  onBack: () => void;
};

export function GeoLocationScreen({ userInfo, onContinue, onBack }: GeoLocationScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  useEffect(() => {
    // Auto-capture location on mount
    captureLocation();
  }, []);

  const captureLocation = async () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Reverse geocode to get city and state
      const cityState = await reverseGeocode(latitude, longitude);

      const geoData: GeoLocation = {
        latitude,
        longitude,
        city: cityState.city,
        state: cityState.state,
        accuracy,
        timestamp: new Date().toISOString()
      };

      setLocation(geoData);
      toast.success('Location captured successfully');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to get location. Please enable location services.');
      
      // Set default values if geolocation fails
      setLocation({
        latitude: 0,
        longitude: 0,
        city: 'Unknown',
        state: 'Unknown',
        accuracy: 0,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; state: string }> => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FieldDataApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        state: data.address?.state || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { city: 'Unknown', state: 'Unknown' };
    }
  };

  const handleContinue = () => {
    if (!location) {
      toast.error('Location data is required');
      return;
    }
    onContinue(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Geo-Location Capture</h1>
                <p className="text-sm text-gray-500">{userInfo.userName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Location Information
            </CardTitle>
            <CardDescription>
              Your device location is automatically captured for test documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Data Display */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input 
                  value={location?.latitude.toFixed(6) || '-'} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input 
                  value={location?.longitude.toFixed(6) || '-'} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input 
                  value={location?.city || '-'} 
                  readOnly 
                  className="bg-gray-50 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input 
                  value={location?.state || '-'} 
                  readOnly 
                  className="bg-gray-50 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label>Location Accuracy</Label>
                <Input 
                  value={location ? `±${location.accuracy.toFixed(2)}m` : '-'} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Timestamp</Label>
                <Input 
                  value={location ? new Date(location.timestamp).toLocaleString() : '-'} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={captureLocation}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Location'}
              </Button>

              <Button
                onClick={handleContinue}
                disabled={!location || isLoading}
                className="flex items-center gap-2 ml-auto"
              >
                <Check className="w-4 h-4" />
                Continue to Metadata
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Location data is automatically captured using your device's GPS. 
                Make sure location services are enabled for accurate positioning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
