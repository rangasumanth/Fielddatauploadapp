import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Trash2, Download, Loader2, FileVideo, Upload, Pencil, LogOut } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';
import type { UserInfo, TestData } from '@/app/App';

type UploadHistoryScreenProps = {
  userInfo: UserInfo;
  refreshToken: number;
  onEditMetadata: (test: TestData) => void;
  onBack: () => void;
  onLogout?: () => void;
};

export function UploadHistoryScreen({ userInfo, refreshToken, onEditMetadata, onBack, onLogout }: UploadHistoryScreenProps) {
  // ... (lines 20-296 omitted for brevity, but I need to target the header)
  // Actually I need to be careful with replace_file_content.
  // I'll do two separate replacements or use multi_replace.
  const [tests, setTests] = useState<TestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingUploadTestId, setPendingUploadTestId] = useState<string | null>(null);
  const [uploadingTestId, setUploadingTestId] = useState<string | null>(null);
  const [deletingVideoKey, setDeletingVideoKey] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadTests();
  }, [refreshToken]);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }

      const response = await fetch(
        `${functionsBase}${functionsRoutePrefix}/tests?ts=${Date.now()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to load tests (status ${response.status})`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load upload history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (test: TestData) => {
    setSelectedTest(test);
    setIsDetailOpen(true);
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }

      const response = await fetch(
        `${functionsBase}${functionsRoutePrefix}/tests/${testId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      toast.success('Test deleted successfully');
      loadTests(); // Reload the list
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const handleStartUpload = (testId: string) => {
    setPendingUploadTestId(testId);
    uploadInputRef.current?.click();
  };

  const handleDeleteVideo = async (testId: string, fileName: string) => {
    if (isLoading) return;

    const confirmDelete = window.confirm('Delete this video? This will remove it from storage and history.');
    if (!confirmDelete) return;

    const videoKey = `${testId}:${fileName}`;
    setDeletingVideoKey(videoKey);
    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }

      const target = `${functionsBase}${functionsRoutePrefix}/tests/${testId}/videos/${encodeURIComponent(fileName)}`;
      const response = await fetch(target, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        let message = 'Failed to delete video';
        try {
          const errorBody = await response.json();
          message = errorBody?.error || message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      toast.success('Video deleted');
      await loadTests();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete video');
    } finally {
      setDeletingVideoKey(null);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0 || !pendingUploadTestId) {
      return;
    }

    setUploadingTestId(pendingUploadTestId);
    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import('@/utils/supabase/info');
      if (!functionsBase) {
        throw new Error('Missing Supabase functions base URL');
      }

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('testId', pendingUploadTestId);

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

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload video');
        }
      }

      toast.success('Video upload completed');
      loadTests();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploadingTestId(null);
      setPendingUploadTestId(null);
      e.target.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportCSV = () => {
    if (tests.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Test ID', 'Date', 'User Name', 'Email', 'Status', 'Created At',
      'Device ID', 'Device Type', 'Test Cycle', 'Location Landmark',
      'Environment', 'Time Start', 'Time End', 'Road Type',
      'Posted Speed Limit', 'Number of Lanes', 'Traffic Density',
      'Road Heading', 'Camera Heading', 'Lighting', 'Weather Condition',
      'Severity', 'Measured Distance', 'Mount Height', 'Pitch Angle',
      'Vehicle Capture View', 'External Battery', 'Firmware', 'VAR Version',
      'Latitude', 'Longitude', 'City', 'State', 'Accuracy', 'Video File', 'Video URL'
    ];

    const rows = tests.map(test => [
      test.testId,
      test.metadata?.date || '',
      test.userInfo?.userName || '',
      test.userInfo?.email || '',
      test.status || '',
      test.createdAt || '',
      test.metadata?.deviceId || '',
      test.metadata?.deviceType || '',
      test.metadata?.testCycle || '',
      test.metadata?.location || '',
      test.metadata?.environment || '',
      test.metadata?.timeStart || '',
      test.metadata?.timeEnd || '',
      test.metadata?.roadType || '',
      test.metadata?.postedSpeedLimit || '',
      test.metadata?.numberOfLanes || '',
      test.metadata?.trafficDensity || '',
      test.metadata?.roadHeading || '',
      test.metadata?.cameraHeading || '',
      test.metadata?.lighting || '',
      test.metadata?.weatherCondition || '',
      test.metadata?.severity || '',
      test.metadata?.measuredDistance || '',
      test.metadata?.mountHeight || '',
      test.metadata?.pitchAngle || '',
      test.metadata?.vehicleCaptureView || '',
      test.metadata?.externalBatteryPluggedIn ? 'Yes' : 'No',
      test.metadata?.firmware || '',
      test.metadata?.varVersion || '',
      test.geoLocation?.latitude || '',
      test.geoLocation?.longitude || '',
      test.geoLocation?.city || '',
      test.geoLocation?.state || '',
      test.geoLocation?.accuracy || '',
      test.videoFileName || '',
      test.videoUrl || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `field_tests_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data exported successfully');
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-black">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-right">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/5 text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <AxonLogo size={32} color="var(--primary)" />
            </div>
            <div className="flex items-center gap-3">
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-2 border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] h-9 px-4"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Terminate
                </Button>
              )}
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] h-9 px-4"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
              <Button
                onClick={loadTests}
                variant="outline"
                size="sm"
                className="bg-primary hover:bg-white text-black border-none font-black uppercase tracking-widest text-[9px] h-9 px-4 transition-all duration-300 shadow-[0_0_15px_rgba(223,255,0,0.2)]"
              >
                Sync
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="shadow-2xl border border-white/10 bg-[#121212] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <CardHeader className="pb-8 border-b border-white/5 bg-black/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Asset Manifest</CardTitle>
                <CardDescription className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">
                  {tests.length} Recorded Entries
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-black/10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">Accessing Secure Storage...</span>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-24 border-t border-white/5 bg-black/10">
                <FileVideo className="w-16 h-16 text-zinc-800 mx-auto mb-6 stroke-[1]" />
                <p className="text-sm font-bold text-zinc-500 uppercase italic">Void Repository</p>
                <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-black mt-2">No evidence clusters found in current sector</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black/40 border-b border-white/5">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Transmission Date</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Hardware ID</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Sector</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Assets</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Roadway</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Operator</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Integrity</TableHead>
                      <TableHead className="text-right text-[9px] font-black uppercase tracking-widest text-zinc-500 py-4 h-auto">Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => {
                      const videoCount = test.videos?.length || (test.videoFileName || test.videoUrl ? 1 : 0);
                      const hasVideo = videoCount > 0;
                      return (
                        <TableRow key={test.testId} className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors">
                          <TableCell className="font-mono text-[11px] text-zinc-400 py-5">
                            {test.metadata?.date || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-white">
                            {test.metadata?.deviceId || 'N/A'}
                          </TableCell>
                          <TableCell className="text-[11px] font-bold text-zinc-500 uppercase italic">
                            {test.geoLocation
                              ? `${test.geoLocation.city}, ${test.geoLocation.state}`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {hasVideo ? (
                              <div className="flex items-center gap-2">
                                <FileVideo className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-bold text-white uppercase">{videoCount} Asset{videoCount > 1 ? 's' : ''}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-zinc-400 uppercase">{test.metadata?.roadType || 'N/A'}</TableCell>
                          <TableCell className="text-[10px] font-bold text-white uppercase italic">{test.userInfo?.userName || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[8px] font-black uppercase tracking-widest rounded h-5 px-2 ${test.status === 'completed' ? 'bg-primary text-black' : 'bg-white/5 text-zinc-500 border border-white/10'}`}
                            >
                              {test.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(test)}
                                className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5"
                                title="Analyze details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditMetadata(test)}
                                className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5"
                                title="Modify metadata"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartUpload(test.testId)}
                                className="h-8 w-8 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10"
                                title="Inject video asset"
                                disabled={uploadingTestId === test.testId}
                              >
                                {uploadingTestId === test.testId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(test.testId)}
                                className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                                title="Expunge record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl bg-[#121212] border border-white/10 text-white p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <DialogHeader className="p-8 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-primary rounded">
                <Eye className="w-5 h-5 text-black" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">EVIDENCE <span className="text-primary not-italic">ANALYSIS</span></DialogTitle>
                <DialogDescription className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Record Fragment: {selectedTest?.testId}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTest && (
            <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* User Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5 pb-2">Investigator Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Callsign</p>
                      <p className="text-sm font-bold text-white uppercase italic">{selectedTest.userInfo?.userName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Digital ID</p>
                      <p className="text-sm font-bold text-zinc-400">{selectedTest.userInfo?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5 pb-2">Spatial Telemetry</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Sector</p>
                      <p className="text-sm font-bold text-white uppercase">{selectedTest.geoLocation?.city}, {selectedTest.geoLocation?.state}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Coordinates</p>
                      <p className="text-[10px] font-mono text-zinc-400 leading-tight">
                        {selectedTest.geoLocation?.latitude.toFixed(6)}°N<br />
                        {selectedTest.geoLocation?.longitude.toFixed(6)}°E
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5 pb-2">Transmission Log</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Registry Status</p>
                      <Badge className={`text-[9px] font-black uppercase tracking-widest rounded px-2 h-6 ${selectedTest.status === 'completed' ? 'bg-primary text-black' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>
                        {selectedTest.status || 'pending'}
                      </Badge>
                    </div>
                    {selectedTest.createdAt && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-zinc-800 font-extrabold uppercase tracking-widest">Committed On</p>
                        <p className="text-[10px] font-mono text-zinc-500">{formatDate(selectedTest.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Cluster */}
              <div className="space-y-4 p-6 bg-black/40 border border-white/5 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <FileText className="w-20 h-20 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">Metadata Cluster</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pt-2">
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Observation Date</p>
                    <p className="text-[11px] font-bold text-white uppercase">{selectedTest.metadata?.date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Hardware ID</p>
                    <p className="text-[11px] font-mono text-zinc-400 underline decoration-primary/20">{selectedTest.metadata?.deviceId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Resource Class</p>
                    <p className="text-[11px] font-bold text-white uppercase">{selectedTest.metadata?.deviceType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Mission Cycle</p>
                    <p className="text-[11px] font-bold text-white uppercase italic">{selectedTest.metadata?.testCycle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Operational Zone</p>
                    <p className="text-[11px] font-bold text-white uppercase">{selectedTest.metadata?.environment}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Roadway Topology</p>
                    <p className="text-[11px] font-bold text-white uppercase">{selectedTest.metadata?.roadType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Lanes</p>
                    <p className="text-[11px] font-bold text-white">{selectedTest.metadata?.numberOfLanes || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest leading-none mb-1">Aux Power</p>
                    <p className={`text-[11px] font-bold uppercase ${selectedTest.metadata?.externalBatteryPluggedIn ? 'text-primary' : 'text-zinc-600'}`}>{selectedTest.metadata?.externalBatteryPluggedIn ? 'Connected' : 'Offline'}</p>
                  </div>
                </div>

                {selectedTest.metadata?.comments && (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-widest mb-2">Internal Remarks</p>
                    <div className="bg-black/60 p-4 rounded border border-white/5 font-mono text-[11px] text-zinc-400 italic leading-relaxed">
                      {selectedTest.metadata.comments}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Assets */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 border-b border-blue-500/10 pb-2">Authenticated Assets</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {selectedTest.videos && selectedTest.videos.length > 0 ? (
                    selectedTest.videos.map((video: { fileName: string; url?: string }, index: number) => (
                      <div key={`${video.fileName}-${index}`} className="group p-5 bg-black/40 border border-white/5 rounded hover:border-blue-500/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Asset Segment {index + 1}</p>
                            <p className="text-xs font-bold text-white truncate italic">{video.fileName}</p>
                          </div>
                          <div className="flex gap-1">
                            {video.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(video.url, '_blank')}
                                className="h-9 px-4 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[8px]"
                              >
                                <Download className="w-3 h-3 mr-2" />
                                Retrieve
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-zinc-700 hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => handleDeleteVideo(selectedTest.testId, video.fileName)}
                              disabled={deletingVideoKey === `${selectedTest.testId}:${video.fileName}` || isLoading}
                            >
                              {deletingVideoKey === `${selectedTest.testId}:${video.fileName}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : selectedTest.videoFileName || selectedTest.videoUrl ? (
                    <div className="col-span-2 group p-5 bg-black/40 border border-white/5 rounded hover:border-blue-500/30 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Primary Evidence Link</p>
                          <p className="text-xs font-bold text-white italic">{selectedTest.videoFileName || 'Archive Reference'}</p>
                        </div>
                        {selectedTest.videoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedTest.videoUrl, '_blank')}
                            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[8px] h-9 px-6"
                          >
                            <Download className="w-3 h-3 mr-2 text-blue-500" />
                            Secure Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 py-8 text-center bg-black/20 border border-dashed border-white/5 rounded">
                      <p className="text-[9px] text-zinc-800 font-black uppercase tracking-widest">No binary clusters bound to this record</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-8 border-t border-white/5 bg-black/40 flex justify-end">
            <Button
              onClick={() => setIsDetailOpen(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-10 rounded"
            >
              Close Terminal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={uploadInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleUploadFile}
        className="hidden"
      />
    </div>
  );
}
