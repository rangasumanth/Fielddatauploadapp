import { useState, useEffect } from 'react';
import { UserInfoScreen } from '@/app/components/UserInfoScreen';
import { DashboardScreen } from '@/app/components/DashboardScreen';
import { GeoLocationScreen } from '@/app/components/GeoLocationScreen';
import { MetadataFormScreen } from '@/app/components/MetadataFormScreen';
import { VideoUploadScreen } from '@/app/components/VideoUploadScreen';
import { ReviewSubmitScreen } from '@/app/components/ReviewSubmitScreen';
import { UploadHistoryScreen } from '@/app/components/UploadHistoryScreen';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';

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
  vehicleCaptureView: string;
  externalBatteryPluggedIn: boolean;
  firmware: string;
  varVersion: string;
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
  | 'upload-history';

const normalizeMetadata = (input: MetadataForm | null | undefined): MetadataForm => ({
  date: input?.date ?? '',
  deviceId: input?.deviceId ?? '',
  deviceType: input?.deviceType ?? '',
  testCycle: input?.testCycle ?? '',
  location: input?.location ?? '',
  environment: input?.environment ?? '',
  timeStart: input?.timeStart ?? '',
  timeEnd: input?.timeEnd ?? '',
  roadType: input?.roadType ?? '',
  postedSpeedLimit: input?.postedSpeedLimit ?? '',
  numberOfLanes: input?.numberOfLanes ?? '',
  trafficDensity: input?.trafficDensity ?? '',
  roadHeading: input?.roadHeading ?? '',
  cameraHeading: input?.cameraHeading ?? '',
  lighting: input?.lighting ?? '',
  weatherCondition: input?.weatherCondition ?? '',
  severity: input?.severity ?? '',
  measuredDistance: input?.measuredDistance ?? '',
  mountHeight: input?.mountHeight ?? '',
  pitchAngle: input?.pitchAngle ?? '',
  vehicleCaptureView: input?.vehicleCaptureView ?? '',
  externalBatteryPluggedIn: input?.externalBatteryPluggedIn ?? false,
  firmware: input?.firmware ?? '',
  varVersion: input?.varVersion ?? ''
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('user-info');
  const [sessionId, setSessionId] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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

  const fetchSession = async (sid: string) => {
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
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
    setUserInfo(info);
    setCurrentScreen('dashboard');
  };

  const handleStartNewTest = () => {
    // Generate new test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTestId(testId);
    setGeoLocation(null);
    setMetadata(null);
    setVideoFiles([]);
    setIsEditingExisting(false);
    setCurrentScreen('geo-location');
  };

  const handleGeoLocationContinue = (location: GeoLocation) => {
    setGeoLocation(location);
    setCurrentScreen('metadata-form');
  };

  const handleMetadataSubmit = async (formData: MetadataForm) => {
    setMetadata(formData);
    if (isEditingExisting) {
      let updateSucceeded = false;
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
          body: JSON.stringify({ metadata: formData })
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('NOT_FOUND');
          }
          let errorMessage = `Failed to update metadata (status ${response.status})`;
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
        updateSucceeded = true;
        toast.success('Metadata updated');
        setHistoryRefreshToken(prev => prev + 1);
      } catch (error) {
        console.error('Error updating metadata:', error);
        const message = error instanceof Error ? error.message : 'Failed to update metadata';
        if (message !== 'NOT_FOUND') {
          toast.error(message);
        }
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
              updateSucceeded = true;
              toast.success('Metadata saved');
              setHistoryRefreshToken(prev => prev + 1);
            } else {
              toast.error('Failed to update metadata');
            }
          } catch (fallbackError) {
            console.error('Error creating missing test:', fallbackError);
            toast.error('Failed to update metadata');
          }
        }
      } finally {
        if (updateSucceeded) {
          setIsEditingExisting(false);
          setCurrentScreen('upload-history');
        }
      }
      return;
    }
    setCurrentScreen('video-upload');
  };

  const handleVideoUpload = (files: File[]) => {
    setVideoFiles(files);
    setCurrentScreen('review-submit');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleViewHistory = () => {
    setCurrentScreen('upload-history');
  };

  const handleSubmitComplete = () => {
    // Clear current test data
    setGeoLocation(null);
    setMetadata(null);
    setVideoFiles([]);
    setCurrentTestId('');
    setIsEditingExisting(false);
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        />
      )}

      {currentScreen === 'geo-location' && userInfo && (
        <GeoLocationScreen
          userInfo={userInfo}
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
          onDraftChange={(draft) => setMetadata(draft)}
          onBack={() => setCurrentScreen(isEditingExisting ? 'upload-history' : 'geo-location')}
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
        />
      )}

      {currentScreen === 'upload-history' && userInfo && (
        <UploadHistoryScreen
          userInfo={userInfo}
          refreshToken={historyRefreshToken}
          onEditMetadata={(test) => {
            setCurrentTestId(test.testId);
            setUserInfo(test.userInfo);
            setGeoLocation(test.geoLocation);
            setMetadata(normalizeMetadata(test.metadata));
            setVideoFiles([]);
            setIsEditingExisting(true);
            setCurrentScreen('metadata-form');
          }}
          onBack={handleBackToDashboard}
        />
      )}

      <Toaster />
    </div>
  );
}
