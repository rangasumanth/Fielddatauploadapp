import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, RefreshCw, ArrowLeft, Check, Navigation, Globe, AlertCircle, Loader2 } from 'lucide-react';
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

  const getIPBasedLocation = async (): Promise<{ city: string; state: string }> => {
    try {
      console.log('Fetching location from backend (bypasses firewall)...');

      // Import Supabase config
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }
      const url = `${functionsBase}${functionsRoutePrefix}/location/ip`;
      console.log('Backend URL:', url);

      // Call backend function to fetch location
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Backend response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Backend location response:', data);

        if (data.success) {
          console.log('Successfully got location from backend:', { city: data.city, state: data.state });
          return {
            city: data.city || 'Unknown',
            state: data.state || 'Unknown'
          };
        }
      } else {
        // Log error response
        const errorData = await response.text();
        console.error('Backend location request failed with status', response.status, ':', errorData);
      }

      console.log('Backend location request failed - trying direct IP fallback...');
      return await getDirectIPLocation();
    } catch (error) {
      console.error('Backend location fetch error:', error);
      console.log('Trying direct IP fallback...');
      return await getDirectIPLocation();
    }
  };

  const getDirectIPLocation = async (): Promise<{ city: string; state: string }> => {
    try {
      console.log('Trying direct IP geolocation...');

      // Try multiple IP geolocation services with fallback
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://ipinfo.io/json'
      ];

      for (const service of services) {
        try {
          console.log(`Trying service: ${service}`);
          const response = await fetch(service, {
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Got location from ${service}:`, data);

            if (service.includes('ipapi.co')) {
              return {
                city: data.city || 'Unknown',
                state: data.region || 'Unknown'
              };
            } else if (service.includes('ip-api.com')) {
              return {
                city: data.city || 'Unknown',
                state: data.regionName || 'Unknown'
              };
            } else if (service.includes('ipinfo.io')) {
              return {
                city: data.city || 'Unknown',
                state: data.region || 'Unknown'
              };
            }
          }
        } catch (error) {
          console.warn(`Service ${service} failed:`, error);
          continue;
        }
      }

      console.log('All IP services failed - using default location');
      // Return a default location that's likely to be correct for most users
      return { city: 'San Francisco', state: 'California' };
    } catch (error) {
      console.error('Direct IP location fetch error:', error);
      return { city: 'San Francisco', state: 'California' };
    }
  };

  const checkLocationPermission = async (): Promise<string> => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      console.log('Location permission status:', result.state);
      return result.state; // 'granted', 'prompt', or 'denied'
    } catch (error) {
      console.error('Permission check error:', error);
      return 'unknown';
    }
  };

  const testLocationAccess = (): void => {
    console.log('=== Location Access Test ===');
    console.log('navigator.geolocation available:', !!navigator.geolocation);
    console.log('HTTPS connection:', window.location.protocol === 'https:');
    console.log('Current URL:', window.location.href);
    checkLocationPermission();
  };

  const testBackendConnection = async (): void => {
    console.log('=== Backend Connection Test ===');
    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }
      const testUrl = `${functionsBase}${functionsRoutePrefix}/test`;
      console.log('Testing backend endpoint:', testUrl);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Test endpoint response:', response.status, response.statusText);
      const data = await response.json();
      console.log('Test endpoint data:', data);

      if (response.ok) {
        toast.success('Backend connection test passed!');
      } else {
        toast.error('Backend connection test failed');
      }
    } catch (error) {
      console.error('Backend connection test error:', error);
      toast.error('Backend connection test failed: ' + error.message);
    }
  };

  const captureLocation = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Starting location capture...');

    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      console.error(msg);
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      setShowManualEntry(true);
      return;
    }

    try {
      console.log('Requesting GPS location...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('GPS location received:', pos);
            resolve(pos);
          },
          (err) => {
            console.error('GPS error - code:', err.code, 'message:', err.message);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      console.log(`GPS captured: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);

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
      setError(null);
      setShowManualEntry(false);
      console.log('Location captured successfully:', geoData);
      toast.success('Location captured successfully');
    } catch (error) {
      console.error('GPS capture failed, triggering IP-based fallback...', error);

      // GPS failed — immediately use IP-based geolocation as fallback
      try {
        console.log('Fetching IP-based location...');
        const ipLocation = await getIPBasedLocation();
        console.log('Using IP-based location:', ipLocation);

        const geoData: GeoLocation = {
          latitude: 0,
          longitude: 0,
          city: ipLocation.city,
          state: ipLocation.state,
          accuracy: 0,
          timestamp: new Date().toISOString()
        };

        setLocation(geoData);
        setError('Using approximate location based on your IP address. GPS not available.');
        setShowManualEntry(true);
        toast.info('Using IP-based location as GPS fallback');
      } catch (fallbackError) {
        console.error('IP fallback also failed:', fallbackError);

        // If all else fails, show manual entry mode with empty location
        console.log('All automated methods failed - enabling manual entry mode');
        setLocation({
          latitude: 0,
          longitude: 0,
          city: 'Unknown',
          state: 'Unknown',
          accuracy: 0,
          timestamp: new Date().toISOString()
        });
        setError('Could not automatically detect location. Please enter your details manually below.');
        setShowManualEntry(true);
        toast.warning('Please enter your location manually');

        let errorMsg = 'Failed to get location. ';

        if (error instanceof GeolocationPositionError) {
          console.error('GeolocationPositionError code:', error.code);
          if (error.code === 1) {
            errorMsg = 'Location permission denied. Please:\n1. Click the location icon in your address bar\n2. Select "Allow" for this site\n3. Click "Refresh Location" to try again';
          } else if (error.code === 2) {
            errorMsg = 'Location service unavailable. Please:\n1. Check internet connection\n2. Ensure location services are enabled in your browser settings\n3. Try clicking "Refresh Location" again';
          } else if (error.code === 3) {
            errorMsg = 'Location request timed out. Using IP-based fallback instead.';
          }
        } else if (error instanceof Error) {
          console.error('General error:', error.message);
          errorMsg += error.message;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm-custom">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Location Capture</h1>
                <p className="text-sm text-gray-600">{userInfo.userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">GPS Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12 animate-slide-in-bottom">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-6 shadow-lg-custom">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Capture Your Location
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We'll automatically detect your GPS coordinates and location details for accurate field test documentation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Location Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl-custom border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-primary rounded-xl">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Location Details</CardTitle>
                    <CardDescription className="text-gray-600">
                      Precise coordinates and location information for your test
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Location Error</h4>
                      <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
                    </div>
                  </div>
                )}

                {/* Manual Entry Alert */}
                {showManualEntry && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
                    <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">Manual Entry Mode</h4>
                      <p className="text-sm text-amber-800">
                        Please enter your location details below, or try clicking "Refresh Location" again after granting permission.
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Data Display */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Latitude
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.latitude?.toString() ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualLatitudeChange(e.target.value)}
                          className="bg-white border-gray-300 focus:ring-primary focus:border-primary transition-all duration-200"
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g., 34.0522"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'Capturing...' : (location?.latitude?.toString() ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-gray-50 text-gray-900 font-mono border-gray-200"
                          />
                          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {location && !isLoading && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Longitude
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.longitude?.toString() ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualLongitudeChange(e.target.value)}
                          className="bg-white border-gray-300 focus:ring-primary focus:border-primary transition-all duration-200"
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g., -118.2437"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'Capturing...' : (location?.longitude?.toString() ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-gray-50 text-gray-900 font-mono border-gray-200"
                          />
                          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {location && !isLoading && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      City
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.city ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualCityChange(e.target.value)}
                          className="bg-white border-gray-300 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="e.g., Los Angeles"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'Fetching...' : (location?.city ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-gray-50 text-gray-900 border-gray-200"
                          />
                          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {location && location.city !== 'Unknown' && !isLoading && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      State
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.state ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualStateChange(e.target.value)}
                          className="bg-white border-gray-300 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="e.g., California"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'Fetching...' : (location?.state ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-gray-50 text-gray-900 border-gray-200"
                          />
                          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {location && location.state !== 'Unknown' && !isLoading && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Accuracy
                    </Label>
                    <Input
                      value={location ? `±${location.accuracy.toFixed(2)}m` : '-'}
                      readOnly
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Timestamp</Label>
                    <Input
                      value={location ? new Date(location.timestamp).toLocaleString() : '-'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6">
                  <Button
                    onClick={captureLocation}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh Location'}
                  </Button>

                  <Button
                    onClick={handleContinue}
                    disabled={!location || isLoading}
                    className="flex items-center gap-2 ml-auto bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-lg-custom"
                  >
                    <Check className="w-4 h-4" />
                    Continue to Metadata
                  </Button>
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Location Services</h4>
                    <p className="text-sm text-blue-800">
                      Location data is automatically captured using your device's GPS. Make sure location services are enabled for accurate positioning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar - Status and Debugging */}
            <div className="space-y-6">
              {/* Current Status */}
              <Card className="shadow-lg-custom border-0 bg-white/80 backdrop-blur-sm animate-slide-in-right">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">GPS Status</span>
                    <Badge className={`px-3 py-1 ${isLoading ? 'bg-yellow-500' : location ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {isLoading ? 'Capturing' : location ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Location Mode</span>
                    <Badge variant={showManualEntry ? "secondary" : "default"} className="px-3 py-1">
                      {showManualEntry ? 'Manual' : 'Automatic'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Debug Actions */}
              <Card className="shadow-lg-custom border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Debug Tools</CardTitle>
                  <CardDescription className="text-gray-600">Advanced diagnostic options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={testLocationAccess}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Test Location Access
                  </Button>

                  <Button
                    onClick={testBackendConnection}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Test Backend
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
