import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Send, FileVideo, MapPin, FileText, Check, Loader2, LogOut } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';
import type { UserInfo, GeoLocation, MetadataForm } from '@/app/App';

type FormField = {
  id: string;
  section: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'switch' | 'textarea';
  options: string[] | null;
  required: boolean;
  order_index: number;
  is_system: boolean;
};

type ReviewSubmitScreenProps = {
  testId: string;
  sessionId: string;
  userInfo: UserInfo;
  geoLocation: GeoLocation;
  metadata: MetadataForm;
  videoFiles: File[];
  onSubmitComplete: () => void;
  onBack: () => void;
  onEditMetadata: () => void;
  onLogout?: () => void;
};

export function ReviewSubmitScreen({
  testId,
  sessionId,
  userInfo,
  geoLocation,
  metadata,
  videoFiles,
  onSubmitComplete,
  onBack,
  onEditMetadata,
  onLogout
}: ReviewSubmitScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);

  useState(() => {
    const fetchFields = async () => {
      try {
        const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
        if (!supabaseUrl) return;

        const response = await fetch(`${supabaseUrl}/rest/v1/form_fields?select=*&order=order_index.asc`, {
          headers: {
            'apikey': publicAnonKey || '',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFields(data);
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setIsLoadingFields(false);
      }
    };
    fetchFields();
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }

      // Step 1: Submit metadata
      setCurrentStep('Saving metadata...');
      setUploadProgress(20);

      const testData = {
        testId,
        sessionId,
        userInfo,
        geoLocation,
        metadata
      };

      const metadataResponse = await fetch(
        `${functionsBase}${functionsRoutePrefix}/tests`,
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

      if (videoFiles.length > 0) {
        const totalUploads = videoFiles.length;
        for (let i = 0; i < videoFiles.length; i += 1) {
          const file = videoFiles[i];
          setCurrentStep(`Uploading video ${i + 1} of ${totalUploads}...`);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('testId', testId);

          const uploadResponse = await fetch(
            `${functionsBase}${functionsRoutePrefix}/upload-video`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: formData
            }
          );

          const progress = 40 + Math.round(((i + 1) / totalUploads) * 40);
          setUploadProgress(progress);

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Failed to upload video');
          }

          await uploadResponse.json();
        }
      }

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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-black">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-right">
              <Button variant="ghost" size="icon" onClick={onBack} disabled={isSubmitting} className="hover:bg-white/5 text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <AxonLogo size={32} color="var(--primary)" />
            </div>
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                disabled={isSubmitting}
                className="border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] h-9 px-4"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Terminate Session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {/* Upload Progress */}
          {isSubmitting && (
            <Card className="border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl relative overflow-hidden animate-pulse-slow">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/20" />
              <CardContent className="pt-8 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 block mb-1">Active Pipeline</span>
                        <span className="text-sm font-bold text-white uppercase italic">{currentStep}</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-blue-400 font-mono tracking-tighter">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5 bg-white/5" />
                  <div className="flex justify-between items-center text-[8px] text-zinc-600 font-black uppercase tracking-widest pt-2">
                    <span>Target: Cloud Evidence Node</span>
                    <span>Status: Transmitting...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* User Information */}
              <Card className="shadow-2xl border border-white/10 bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700" />
                <CardHeader className="pb-6 border-b border-white/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                    Agent Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8 pt-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Designation</p>
                    <p className="text-sm font-bold text-white uppercase italic">{userInfo.userName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Comm Link</p>
                    <p className="text-sm font-bold text-zinc-400 lowercase">{userInfo.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Geo-Location */}
              <Card className="shadow-2xl border border-white/10 bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="pb-6 border-b border-white/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Spatial Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-8 pt-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Sector</p>
                    <p className="text-sm font-bold text-white uppercase">{geoLocation.city}, {geoLocation.state}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Global Coordinates</p>
                    <p className="text-sm font-mono text-zinc-400">
                      {geoLocation.latitude.toFixed(6)}°N, {geoLocation.longitude.toFixed(6)}°E
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Variance</p>
                    <p className="text-sm font-bold text-blue-500">±{geoLocation.accuracy.toFixed(2)}M</p>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata Summary */}
              <Card className="shadow-2xl border border-white/10 bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-6 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Protocol Manifest
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onEditMetadata}
                      disabled={isSubmitting}
                      className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                    >
                      Override Data
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                    {isLoadingFields ? (
                      <div className="col-span-full py-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary/40" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">Synchronizing Manifest Structure...</span>
                      </div>
                    ) : fields.length > 0 ? (
                      fields.map(field => {
                        const value = metadata[field.name];
                        if (value === undefined || value === null || value === '') return null;

                        return (
                          <div key={field.id} className="space-y-1">
                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{field.label}</p>
                            {field.type === 'switch' ? (
                              <Badge className={`text-[8px] font-black uppercase tracking-widest rounded px-2 py-0.5 ${value ? 'bg-primary text-black' : 'bg-white/5 text-zinc-600 border border-white/5'}`}>
                                {value ? 'Active' : 'Offline'}
                              </Badge>
                            ) : (
                              <p className={`text-xs font-bold uppercase ${field.name === 'deviceId' ? 'font-mono text-zinc-400' : 'text-white'}`}>
                                {String(value)}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Timestamp</p>
                          <p className="text-xs font-bold text-white uppercase">{metadata.date}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Hardware ID</p>
                          <p className="text-xs font-mono text-zinc-400">{metadata.deviceId}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Device Class</p>
                          <p className="text-xs font-bold text-white uppercase">{metadata.deviceType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Assignment</p>
                          <p className="text-xs font-bold text-white uppercase italic">{metadata.testCycle}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Environment</p>
                          <p className="text-xs font-bold text-white uppercase">{metadata.environment}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Roadway</p>
                          <p className="text-xs font-bold text-white uppercase">{metadata.roadType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Aux Power</p>
                          <Badge className={`text-[8px] font-black uppercase tracking-widest rounded px-2 py-0.5 ${metadata.externalBatteryPluggedIn ? 'bg-primary text-black' : 'bg-white/5 text-zinc-600 border border-white/5'}`}>
                            {metadata.externalBatteryPluggedIn ? 'Active' : 'Offline'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Video Details */}
              <Card className="shadow-2xl border border-white/10 bg-[#121212] relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="pb-6 border-b border-white/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
                    <FileVideo className="w-3.5 h-3.5" />
                    Asset Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 flex-1">
                  {videoFiles.length > 0 ? (
                    <div className="space-y-6">
                      {videoFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="p-4 bg-black/40 border border-white/5 rounded">
                          <div className="mb-3 aspect-video bg-black rounded border border-white/5 overflow-hidden relative">
                            <video
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-contain"
                              onMouseOver={e => (e.target as HTMLVideoElement).play()}
                              onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                              muted
                              loop
                            />
                          </div>
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-2">Primary Footage [{index + 1}]</p>
                          <p className="text-xs font-bold text-white truncate italic mb-1">{file.name}</p>
                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{file.type ? file.type.split('/')[1].toUpperCase() : 'RAW'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/5 rounded">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Waiting for Assets</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unique ID Card */}
              <Card className="bg-black/40 border border-white/5 border-dashed">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Sequence ID</span>
                      <Badge className="bg-white/5 text-zinc-400 text-[8px] font-black uppercase border-white/5">Locked</Badge>
                    </div>
                    <p className="text-xs font-mono text-white tracking-widest bg-black p-3 rounded border border-white/5 text-center truncate">{testId}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Footer */}
          <div className="sticky bottom-8 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">
              <div className="flex flex-col gap-1 items-center sm:items-start">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Validation Status</p>
                <p className="text-xs font-bold text-primary uppercase italic">All protocols ready for transmission</p>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial border-white/10 text-zinc-400 font-black uppercase tracking-widest text-[10px] h-12 px-8 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-[11px] h-12 px-12 shadow-[0_0_25px_rgba(223,255,0,0.3)] flex items-center gap-3 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      In Flight
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Commit Mission
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Legal/Warning Notice */}
          {!isSubmitting && (
            <div className="text-center py-6">
              <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest leading-relaxed max-w-2xl mx-auto">
                Confidentiality Notice: By committing this mission, you certify that the evidence captured conforms to
                Axon digital integrity standards. Data once transmitted is non-mutable and permanently indexed
                in the secure asset repository.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
