import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Send, FileVideo, MapPin, FileText, Check, Loader2 } from 'lucide-react';
import type { UserInfo, GeoLocation, MetadataForm } from '@/app/App';

type ReviewSubmitScreenProps = {
  testId: string;
  userInfo: UserInfo;
  geoLocation: GeoLocation;
  metadata: MetadataForm;
  videoFile: File;
  onSubmitComplete: () => void;
  onBack: () => void;
};

export function ReviewSubmitScreen({
  testId,
  userInfo,
  geoLocation,
  metadata,
  videoFile,
  onSubmitComplete,
  onBack
}: ReviewSubmitScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
      if (!supabaseUrl) {
        throw new Error('Missing Supabase URL');
      }

      // Step 1: Submit metadata
      setCurrentStep('Saving metadata...');
      setUploadProgress(20);

      const testData = {
        testId,
        userInfo,
        geoLocation,
        metadata,
        videoFileName: videoFile.name,
        videoSize: videoFile.size,
        videoType: videoFile.type
      };

      const metadataResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-54e4d920/tests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(testData)
        }
      );

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to save metadata');
      }

      setUploadProgress(40);

      // Step 2: Upload video
      setCurrentStep('Uploading video to S3...');
      
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('testId', testId);

      const uploadResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-54e4d920/upload-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      setUploadProgress(80);

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload video');
      }

      const uploadResult = await uploadResponse.json();
      
      setCurrentStep('Finalizing submission...');
      setUploadProgress(100);

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Test submitted successfully!');
      onSubmitComplete();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
      setUploadProgress(0);
      setCurrentStep('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} disabled={isSubmitting}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review & Submit</h1>
                <p className="text-sm text-gray-500">Verify all information before submitting</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Upload Progress */}
          {isSubmitting && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-medium text-blue-900">{currentStep}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-900">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Field Tester</p>
                <p className="font-medium">{userInfo.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userInfo.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Geo-Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Geo-Location Data
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{geoLocation.city}, {geoLocation.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Coordinates</p>
                <p className="font-medium text-sm">
                  {geoLocation.latitude.toFixed(4)}, {geoLocation.longitude.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Accuracy</p>
                <p className="font-medium">±{geoLocation.accuracy.toFixed(2)}m</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Metadata Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{metadata.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Device ID</p>
                  <p className="font-medium">{metadata.deviceId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Device Type</p>
                  <p className="font-medium">{metadata.deviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Test Cycle</p>
                  <p className="font-medium">{metadata.testCycle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Environment</p>
                  <p className="font-medium capitalize">{metadata.environment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Road Type</p>
                  <p className="font-medium capitalize">{metadata.roadType}</p>
                </div>
                {metadata.trafficDensity && (
                  <div>
                    <p className="text-sm text-gray-500">Traffic Density</p>
                    <p className="font-medium capitalize">{metadata.trafficDensity}</p>
                  </div>
                )}
                {metadata.lighting && (
                  <div>
                    <p className="text-sm text-gray-500">Lighting</p>
                    <p className="font-medium capitalize">{metadata.lighting}</p>
                  </div>
                )}
                {metadata.weatherCondition && (
                  <div>
                    <p className="text-sm text-gray-500">Weather</p>
                    <p className="font-medium capitalize">{metadata.weatherCondition}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">External Battery</p>
                  <Badge variant={metadata.externalBatteryPluggedIn ? "default" : "secondary"}>
                    {metadata.externalBatteryPluggedIn ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-blue-600" />
                Video Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">File Name</p>
                <p className="font-medium truncate">{videoFile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-medium">{formatFileSize(videoFile.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Type</p>
                <p className="font-medium">{videoFile.type}</p>
              </div>
            </CardContent>
          </Card>

          {/* Test ID */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Test ID</p>
                  <p className="font-mono text-sm font-medium">{testId}</p>
                </div>
                <Badge>Ready to Submit</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 border-t rounded-lg">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              Back to Edit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Test
                </>
              )}
            </Button>
          </div>

          {/* Warning Notice */}
          {!isSubmitting && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Important:</strong> Please review all information carefully before submitting.
                Once submitted, the test data will be permanently stored and cannot be edited.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
