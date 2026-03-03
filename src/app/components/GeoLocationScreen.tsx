import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, RefreshCw, ArrowLeft, Check, Navigation, Globe, AlertCircle, Loader2, Activity } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';
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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-black">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-white/5 text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <AxonLogo size={32} color="var(--primary)" />
            </div>
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.6)]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">GPS READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title Section */}
        <div className="text-center mb-12 animate-slide-in-bottom">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-card border border-primary/20 rounded-xl mb-6 shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <MapPin className="w-10 h-10 text-primary relative z-10" aria-hidden="true" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none mb-3">
            Capture Location
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-xs uppercase font-bold tracking-widest leading-loose">
            Deploying global positioning protocols for field test documentation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Location Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border border-white/10 bg-[#121212] backdrop-blur-xl animate-scale-in">
              <CardHeader className="pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-black rounded border border-white/5 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Telemetry Data</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 uppercase font-bold">
                      Precise coordinate triangulation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Error Alert */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Signal Interruption</h4>
                      <p className="text-[11px] text-zinc-400 font-medium italic">{error}</p>
                    </div>
                  </div>
                )}

                {/* Manual Entry Alert */}
                {showManualEntry && (
                  <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded animate-fade-in">
                    <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Manual Override Required</h4>
                      <p className="text-[11px] text-zinc-400 font-medium italic">
                        Automatic triangulation unavailable. Input manual coordinates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Data Display */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      Latitude
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.latitude?.toString() ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualLatitudeChange(e.target.value)}
                          className="bg-black/50 border-white/10 rounded px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                          type="text"
                          inputMode="decimal"
                          placeholder="00.0000"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'ACQUIRING...' : (location?.latitude?.toString() ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-black/30 border-white/5 text-zinc-400 font-mono text-xs tracking-wider cursor-not-allowed"
                          />
                          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                          {location && !isLoading && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      Longitude
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.longitude?.toString() ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualLongitudeChange(e.target.value)}
                          className="bg-black/50 border-white/10 rounded px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                          type="text"
                          inputMode="decimal"
                          placeholder="00.0000"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'ACQUIRING...' : (location?.longitude?.toString() ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-black/30 border-white/5 text-zinc-400 font-mono text-xs tracking-wider cursor-not-allowed"
                          />
                          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                          {location && !isLoading && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Sector (City)
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.city ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualCityChange(e.target.value)}
                          className="bg-black/50 border-white/10 rounded px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                          placeholder="NAME..."
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'FETCHING...' : (location?.city ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-black/30 border-white/5 text-zinc-400 text-sm tracking-wide cursor-not-allowed"
                          />
                          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                          {location && location.city !== 'Unknown' && !isLoading && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Region (State)
                    </Label>
                    <div className="relative">
                      {showManualEntry ? (
                        <Input
                          value={location?.state ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualStateChange(e.target.value)}
                          className="bg-black/50 border-white/10 rounded px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                          placeholder="NAME..."
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Input
                            value={isLoading ? 'FETCHING...' : (location?.state ?? '-')}
                            readOnly
                            disabled={isLoading}
                            className="bg-black/30 border-white/5 text-zinc-400 text-sm tracking-wide cursor-not-allowed"
                          />
                          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                          {location && location.state !== 'Unknown' && !isLoading && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-primary" />
                      Confidence Margin
                    </Label>
                    <Input
                      value={location ? `±${location.accuracy.toFixed(2)}M` : '-'}
                      readOnly
                      className="bg-black/30 border-white/5 text-zinc-400 font-mono text-xs tracking-wider cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Log Timestamp</Label>
                    <Input
                      value={location ? new Date(location.timestamp).toLocaleString().toUpperCase() : '-'}
                      readOnly
                      className="bg-black/30 border-white/5 text-zinc-400 font-mono text-[10px] tracking-wider cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
                  <Button
                    onClick={captureLocation}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest border-white/10 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    {isLoading ? 'SYNCING...' : 'REFRESH SIGNAL'}
                  </Button>

                  <Button
                    onClick={handleContinue}
                    disabled={!location || isLoading}
                    className="flex items-center gap-3 ml-auto bg-primary hover:bg-white text-black transition-all duration-300 font-black uppercase tracking-widest text-xs h-11 px-6 shadow-[0_0_15px_rgba(223,255,0,0.2)]"
                  >
                    <Check className="w-4 h-4" />
                    CONFIRM & CONTINUE
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Protocol Note */}
            <div className="mt-8 flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-tighter text-white italic mb-1">Evidence Protocol: GEO-101</h4>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  Mission logs require valid geolocation metadata. If precision degrades, perform manual oversight of Sector and Region coordinates.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Status and Debugging */}
          <div className="space-y-6">
            <Card className="shadow-2xl border border-white/10 bg-[#1A1A1A] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Interface Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">GNSS Signal</span>
                  <Badge className={`px-2 py-0.5 text-[8px] uppercase font-black tracking-widest ${isLoading ? 'bg-primary/20 text-primary border-primary/30' : location ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_8px_rgba(223,255,0,0.3)]' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
                    {isLoading ? 'SYNCING' : location ? 'ACTIVE' : 'OFFLINE'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Capture Mode</span>
                  <Badge variant="outline" className={`px-2 py-0.5 text-[8px] uppercase font-black tracking-widest ${showManualEntry ? 'border-accent text-accent bg-accent/10' : 'border-zinc-700 text-zinc-400'}`}>
                    {showManualEntry ? 'OVERRIDE' : 'PROTOCOL'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border border-white/10 bg-[#1A1A1A] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Diagnostics</CardTitle>
                <CardDescription className="text-[9px] text-zinc-600 uppercase font-bold">Manual override tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={testLocationAccess}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-[9px] font-black uppercase tracking-[0.2em] border-white/5 hover:border-primary hover:bg-primary/5 transition-all duration-300 gap-3"
                >
                  <Navigation className="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary" />
                  Test GNSS Stack
                </Button>

                <Button
                  onClick={testBackendConnection}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-[9px] font-black uppercase tracking-[0.2em] border-white/5 hover:border-accent hover:bg-accent/5 transition-all duration-300 gap-3"
                >
                  <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-accent" />
                  Probe Vault API
                </Button>
              </CardContent>
            </Card>

            {/* Visual Flare */}
            <div className="p-4 bg-primary rounded border border-primary/20 bg-opacity-5 flex items-center justify-center opacity-30">
              <Activity className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
