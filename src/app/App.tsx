// Field Data Upload App - Main Application Component
import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Core screens - Static imports for reliability
import { UserInfoScreen } from '@/app/components/UserInfoScreen';
import { DashboardScreen } from '@/app/components/DashboardScreen';

// Secondary screens - Lazy load
const GeoLocationScreen = lazy(() => import('@/app/components/GeoLocationScreen').then(m => ({ default: m.GeoLocationScreen })));
const MetadataFormScreen = lazy(() => import('@/app/components/MetadataFormScreen').then(m => ({ default: m.MetadataFormScreen })));
const VideoUploadScreen = lazy(() => import('@/app/components/VideoUploadScreen').then(m => ({ default: m.VideoUploadScreen })));
const ReviewSubmitScreen = lazy(() => import('@/app/components/ReviewSubmitScreen').then(m => ({ default: m.ReviewSubmitScreen })));
const UploadHistoryScreen = lazy(() => import('@/app/components/UploadHistoryScreen').then(m => ({ default: m.UploadHistoryScreen })));
const AdminDashboardScreen = lazy(() => import('@/app/components/AdminDashboardScreen').then(m => ({ default: m.AdminDashboardScreen }))) as any;

export type UserInfo = {
  userName: string;
  email: string;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  accuracy: number;
  timestamp: string;
};

export type MetadataForm = {
  date: string;
  deviceId: string;
  deviceType: string;
  testCycle: string;
  location: string;
  environment: string;
  timeStart: string;
  timeEnd: string;
  roadType: string;
  postedSpeedLimit: string;
  numberOfLanes: string;
  trafficDensity: string;
  roadHeading: string;
  cameraHeading: string;
  lighting: string;
  weatherCondition: string;
  severity: string;
  measuredDistance: string;
  mountHeight: string;
  pitchAngle: string;
  firmware: string;
  varVersion: string;
  comments?: string;
  [key: string]: string | boolean | undefined;
};

export type TestData = {
  testId: string;
  userInfo: UserInfo;
  geoLocation: GeoLocation;
  metadata: MetadataForm;
  videos?: {
    fileName: string;
    url?: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  }[];
  videoUrl?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Screen =
  | 'user-info'
  | 'dashboard'
  | 'geo-location'
  | 'metadata-form'
  | 'video-upload'
  | 'review-submit'
  | 'upload-history'
  | 'admin-dashboard';

const normalizeMetadata = (input: MetadataForm | null | undefined): MetadataForm => {
  if (!input) return {
    date: '',
    deviceId: '',
    deviceType: '',
    testCycle: '',
    location: '',
    environment: '',
    timeStart: '',
    timeEnd: '',
    roadType: '',
    postedSpeedLimit: '',
    numberOfLanes: '',
    trafficDensity: '',
    roadHeading: '',
    cameraHeading: '',
    lighting: '',
    weatherCondition: '',
    severity: '',
    measuredDistance: '',
    mountHeight: '',
    pitchAngle: '',
    vehicleCaptureView: '',
    externalBatteryPluggedIn: false,
    firmware: '',
    varVersion: '',
    comments: ''
  };

  return { ...input };
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('user-info');
  const [sessionId, setSessionId] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  console.log(`[App] Current screen: ${currentScreen}, Auth state: ${userInfo ? 'Logged In' : 'Logged Out'}`);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [metadata, setMetadata] = useState<MetadataForm | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string>('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  // Check for existing session on mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem('fieldTestSessionId');
    if (existingSessionId) {
      setSessionId(existingSessionId);
      // Try to fetch session data
      fetchSession(existingSessionId);
    } else {
      // Generate new session ID
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('fieldTestSessionId', newSessionId);
    }
  }, []);

  const fetchSession = useCallback(async (sid: string) => {
    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }
      const response = await fetch(
        `${functionsBase}${functionsRoutePrefix}/session/${sid}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserInfo({ userName: data.userName, email: data.email });
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }, []);

  const handleUserInfoSubmit = useCallback((info: UserInfo) => {
    setUserInfo(info);
    setCurrentScreen('dashboard');
  }, []);

  const handleStartNewTest = useCallback(() => {
    // Generate new test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTestId(testId);
    setGeoLocation(null);
    setMetadata(null);
    setVideoFiles([]);
    setIsEditingExisting(false);
    setCurrentScreen('geo-location');
  }, []);

  const handleGeoLocationContinue = useCallback((location: GeoLocation) => {
    setGeoLocation(location);
    setCurrentScreen('metadata-form');
  }, []);

  const handleMetadataSubmit = useCallback(async (formData: MetadataForm) => {
    setMetadata(formData);
    if (isEditingExisting) {
      try {
        const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
        if (!functionsBase) {
          throw new Error('Missing Supabase functions base URL');
        }
        const response = await fetch(`${functionsBase}${functionsRoutePrefix}/tests/${currentTestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            metadata: formData,
            geoLocation: geoLocation // Include updated geolocation info
          })
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('NOT_FOUND');
          }
          let errorMessage = `Failed to update metadata (status ${response.status})`;
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch { }
          throw new Error(errorMessage);
        }
        // Update succeeded - increment refresh token and navigate
        setHistoryRefreshToken(prev => prev + 1);
        toast.success('Test updated successfully');
        setIsEditingExisting(false);
        setCurrentScreen('upload-history');
      } catch (error) {
        console.error('Error updating metadata:', error);
        const message = error instanceof Error ? error.message : 'Failed to update metadata';
        if (message !== 'NOT_FOUND') {
          toast.error(message);
          return; // Don't navigate on error
        }
        // If test not found, try creating it
        if (message === 'NOT_FOUND') {
          try {
            const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
            if (!functionsBase) {
              throw new Error('Missing Supabase functions base URL');
            }
            const response = await fetch(`${functionsBase}${functionsRoutePrefix}/tests`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({
                testId: currentTestId,
                sessionId,
                userInfo,
                geoLocation,
                metadata: formData
              })
            });
            if (response.ok) {
              // Creation succeeded - increment refresh token and navigate
              setHistoryRefreshToken(prev => prev + 1);
              toast.success('Test data saved');
              setIsEditingExisting(false);
              setCurrentScreen('upload-history');
            } else {
              toast.error('Failed to update metadata');
              return; // Don't navigate on error
            }
          } catch (fallbackError) {
            console.error('Error creating missing test:', fallbackError);
            toast.error('Failed to update metadata');
            return; // Don't navigate on error
          }
        }
      }
      return;
    }
    setCurrentScreen('video-upload');
  }, [currentTestId, geoLocation, isEditingExisting, sessionId, userInfo]);

  const handleVideoUpload = useCallback((files: File[]) => {
    setVideoFiles(files);
    setCurrentScreen('review-submit');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentScreen('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    // Clear persisted session
    localStorage.removeItem('fieldTestSessionId');

    // Reset client state
    setUserInfo(null);
    setGeoLocation(null);
    setMetadata(null);
    setVideoFiles([]);
    setCurrentTestId('');
    setIsEditingExisting(false);
    setHistoryRefreshToken(0);

    // Generate a fresh session id for the next login
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('fieldTestSessionId', newSessionId);

    // Return to User Info screen
    setCurrentScreen('user-info');
  }, []);

  const handleViewHistory = useCallback(() => {
    setCurrentScreen('upload-history');
  }, []);

  const handleSubmitComplete = useCallback(() => {
    // Clear current test data
    setGeoLocation(null);
    setMetadata(null);
    setVideoFiles([]);
    setCurrentTestId('');
    setIsEditingExisting(false);
    setCurrentScreen('dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Initializing Interface...</p>
        </div>
      }>
        {currentScreen === 'user-info' && (
          <UserInfoScreen
            sessionId={sessionId}
            onSubmit={handleUserInfoSubmit}
          />
        )}

        {currentScreen === 'dashboard' && userInfo && (
          <DashboardScreen
            userInfo={userInfo}
            onStartNewTest={handleStartNewTest}
            onViewHistory={handleViewHistory}
            onLogout={handleLogout}
            onOpenAdmin={() => setCurrentScreen('admin-dashboard')}
          />
        )}

        {currentScreen === 'geo-location' && userInfo && (
          <GeoLocationScreen
            userInfo={userInfo}
            initialLocation={isEditingExisting ? geoLocation : null}
            onContinue={handleGeoLocationContinue}
            onBack={handleBackToDashboard}
          />
        )}

        {currentScreen === 'metadata-form' && userInfo && geoLocation && (
          <MetadataFormScreen
            userInfo={userInfo}
            geoLocation={geoLocation}
            metadata={metadata}
            onSubmit={handleMetadataSubmit}
            onDraftChange={(draft: MetadataForm) => setMetadata(draft)}
            onBack={() => setCurrentScreen(isEditingExisting ? 'geo-location' : 'geo-location')}
          />
        )}

        {currentScreen === 'video-upload' && (
          <VideoUploadScreen
            videoFiles={videoFiles}
            onUpload={handleVideoUpload}
            onBack={() => setCurrentScreen('metadata-form')}
          />
        )}

        {currentScreen === 'review-submit' && userInfo && geoLocation && metadata && (
          <ReviewSubmitScreen
            testId={currentTestId}
            sessionId={sessionId}
            userInfo={userInfo}
            geoLocation={geoLocation}
            metadata={metadata}
            videoFiles={videoFiles}
            onSubmitComplete={handleSubmitComplete}
            onBack={() => setCurrentScreen('video-upload')}
            onEditMetadata={() => setCurrentScreen('metadata-form')}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'upload-history' && userInfo && (
          <UploadHistoryScreen
            userInfo={userInfo}
            refreshToken={historyRefreshToken}
            onEditMetadata={(test: TestData) => {
              setCurrentTestId(test.testId);
              setUserInfo(test.userInfo);
              setGeoLocation(test.geoLocation);
              setMetadata(normalizeMetadata(test.metadata));
              setVideoFiles([]);
              setIsEditingExisting(true);
              setCurrentScreen('geo-location'); // Start edit flow from geo-location
            }}
            onBack={handleBackToDashboard}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'admin-dashboard' && (
          <AdminDashboardScreen
            onBack={handleBackToDashboard}
          />
        )}
      </Suspense>

      <Toaster />

      {/* Debug Overlay */}
      <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-[10px] text-zinc-500 font-mono z-[9999] pointer-events-none">
        APP_STATE: {currentScreen} | AUTH: {userInfo ? 'YES' : 'NO'} | SESSION: {sessionId ? 'OK' : 'MISSING'}
      </div>
    </div>
  );
}
