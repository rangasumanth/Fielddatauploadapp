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
  initialLocation: GeoLocation | null | undefined;
  onContinue: (location: GeoLocation) => void;
  onBack: () => void;
};

export function GeoLocationScreen({ userInfo, initialLocation, onContinue, onBack }: GeoLocationScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Initialize with initialLocation if present
  useEffect(() => {
    if (initialLocation) {
      console.log('Initializing with existing location:', initialLocation);
      setLocation({
        ...initialLocation,
        // Ensure timestamp is current if missing
        timestamp: initialLocation.timestamp || new Date().toISOString()
      });
      setShowManualEntry(true); // Default to manual entry for editing
      return;
    }

    // Only auto-capture if no initial location provided
    testLocationAccess();
    captureLocation();
  }, [initialLocation]); // Run when initialLocation changes (or on mount)

  const handleManualLatitudeChange = (value: string) => {
    const lat = parseFloat(value);
    if (!isNaN(lat) && location) {
      setLocation({ ...location, latitude: lat });
    }
  };

  const handleManualLongitudeChange = (value: string) => {
    const lng = parseFloat(value);
    if (!isNaN(lng) && location) {
      setLocation({ ...location, longitude: lng });
    }
  };

  const handleManualCityChange = (value: string) => {
    if (location) {
      setLocation({ ...location, city: value });
    }
  };

  const handleManualStateChange = (value: string) => {
    if (location) {
      setLocation({ ...location, state: value });
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
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900 whitespace-pre-wrap">
                  <strong>⚠️ Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Manual Entry Alert */}
            {showManualEntry && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>📍 Manual Entry:</strong> Please enter your location details below, or try clicking "Refresh Location" again after granting permission.
                </p>
              </div>
            )}

            {/* Location Data Display */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <div className="flex items-center gap-2">
                  {showManualEntry ? (
                    <Input
                      value={location?.latitude?.toString() ?? ''}
                      onChange={(e) => handleManualLatitudeChange(e.target.value)}
                      className="bg-white"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g., 34.0522"
                    />
                  ) : (
                    <>
                      <Input
                        value={isLoading ? 'Capturing...' : (location?.latitude?.toString() ?? '-')}
                        readOnly
                        disabled={isLoading}
                        className="bg-gray-100 text-gray-900 font-mono"
                      />
                      {location && <Check className="w-5 h-5 text-green-600" />}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <div className="flex items-center gap-2">
                  {showManualEntry ? (
                    <Input
                      value={location?.longitude?.toString() ?? ''}
                      onChange={(e) => handleManualLongitudeChange(e.target.value)}
                      className="bg-white"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g., -118.2437"
                    />
                  ) : (
                    <>
                      <Input
                        value={isLoading ? 'Capturing...' : (location?.longitude?.toString() ?? '-')}
                        readOnly
                        disabled={isLoading}
                        className="bg-gray-100 text-gray-900 font-mono"
                      />
                      {location && <Check className="w-5 h-5 text-green-600" />}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <div className="flex items-center gap-2">
                  {showManualEntry ? (
                    <Input
                      value={location?.city ?? ''}
                      onChange={(e) => handleManualCityChange(e.target.value)}
                      className="bg-white"
                      placeholder="e.g., Los Angeles"
                    />
                  ) : (
                    <>
                      <Input
                        value={isLoading ? 'Fetching...' : (location?.city ?? '-')}
                        readOnly
                        disabled={isLoading}
                        className="bg-gray-100 text-gray-900"
                      />
                      {location && location.city !== 'Unknown' && <Check className="w-5 h-5 text-green-600" />}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <div className="flex items-center gap-2">
                  {showManualEntry ? (
                    <Input
                      value={location?.state ?? ''}
                      onChange={(e) => handleManualStateChange(e.target.value)}
                      className="bg-white"
                      placeholder="e.g., California"
                    />
                  ) : (
                    <>
                      <Input
                        value={isLoading ? 'Fetching...' : (location?.state ?? '-')}
                        readOnly
                        disabled={isLoading}
                        className="bg-gray-100 text-gray-900"
                      />
                      {location && location.state !== 'Unknown' && <Check className="w-5 h-5 text-green-600" />}
                    </>
                  )}
                </div>
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
            <div className="flex gap-3 pt-4 flex-wrap">
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
                onClick={testLocationAccess}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                📋 Diagnose (Check Console)
              </Button>

              <Button
                onClick={testBackendConnection}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                🔗 Test Backend
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
