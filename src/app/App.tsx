import { useState, useEffect } from 'react';
import { UserInfoScreen } from '@/app/components/UserInfoScreen';
import { DashboardScreen } from '@/app/components/DashboardScreen';
import { GeoLocationScreen } from '@/app/components/GeoLocationScreen';
import { MetadataFormScreen } from '@/app/components/MetadataFormScreen';
import { VideoUploadScreen } from '@/app/components/VideoUploadScreen';
import { ReviewSubmitScreen } from '@/app/components/ReviewSubmitScreen';
import { UploadHistoryScreen } from '@/app/components/UploadHistoryScreen';
import { Toaster } from '@/app/components/ui/sonner';

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
  videoFile?: File;
  videoUrl?: string;
  status?: string;
  createdAt?: string;
};

export type Screen = 
  | 'user-info' 
  | 'dashboard' 
  | 'geo-location' 
  | 'metadata-form' 
  | 'video-upload' 
  | 'review-submit' 
  | 'upload-history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('user-info');
  const [sessionId, setSessionId] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [metadata, setMetadata] = useState<MetadataForm | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentTestId, setCurrentTestId] = useState<string>('');

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
      const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
      if (!supabaseUrl) {
        throw new Error('Missing Supabase URL');
      }
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-54e4d920/session/${sid}`,
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
    setVideoFile(null);
    setCurrentScreen('geo-location');
  };

  const handleGeoLocationContinue = (location: GeoLocation) => {
    setGeoLocation(location);
    setCurrentScreen('metadata-form');
  };

  const handleMetadataSubmit = (formData: MetadataForm) => {
    setMetadata(formData);
    setCurrentScreen('video-upload');
  };

  const handleVideoUpload = (file: File | null) => {
    setVideoFile(file);
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
    setVideoFile(null);
    setCurrentTestId('');
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
          onBack={() => setCurrentScreen('geo-location')}
        />
      )}

      {currentScreen === 'video-upload' && (
        <VideoUploadScreen
          videoFile={videoFile}
          onUpload={handleVideoUpload}
          onBack={() => setCurrentScreen('metadata-form')}
        />
      )}

      {currentScreen === 'review-submit' && userInfo && geoLocation && metadata && (
        <ReviewSubmitScreen
          testId={currentTestId}
          userInfo={userInfo}
          geoLocation={geoLocation}
          metadata={metadata}
          videoFile={videoFile}
          onSubmitComplete={handleSubmitComplete}
          onBack={() => setCurrentScreen('video-upload')}
          onEditMetadata={() => setCurrentScreen('metadata-form')}
        />
      )}

      {currentScreen === 'upload-history' && userInfo && (
        <UploadHistoryScreen
          userInfo={userInfo}
          onBack={handleBackToDashboard}
        />
      )}

      <Toaster />
    </div>
  );
}
