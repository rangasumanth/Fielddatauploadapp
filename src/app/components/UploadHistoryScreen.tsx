import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Trash2, Download, Loader2, FileVideo } from 'lucide-react';
import type { UserInfo, TestData } from '@/app/App';

type UploadHistoryScreenProps = {
  userInfo: UserInfo;
  onBack: () => void;
};

export function UploadHistoryScreen({ userInfo, onBack }: UploadHistoryScreenProps) {
  const [tests, setTests] = useState<TestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-54e4d920/tests`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load tests');
      }

      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error('Failed to load upload history');
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
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-54e4d920/tests/${testId}`,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Upload History</h1>
                <p className="text-sm text-gray-500">View all test submissions</p>
              </div>
            </div>
            <Button onClick={loadTests} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Submissions</CardTitle>
            <CardDescription>
              {tests.length} {tests.length === 1 ? 'test' : 'tests'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-12">
                <FileVideo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tests found</p>
                <p className="text-sm text-gray-400 mt-2">Submit your first field test to see it here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Field Tester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.testId}>
                        <TableCell className="font-medium">
                          {test.metadata?.date || 'N/A'}
                        </TableCell>
                        <TableCell>{test.metadata?.deviceId || 'N/A'}</TableCell>
                        <TableCell>
                          {test.geoLocation 
                            ? `${test.geoLocation.city}, ${test.geoLocation.state}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="truncate max-w-xs">
                          {test.videoFileName || test.metadata?.videoFileName || 'N/A'}
                        </TableCell>
                        <TableCell>{test.userInfo?.userName || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={test.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {test.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(test)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(test.testId)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Details</DialogTitle>
            <DialogDescription>
              Test ID: {selectedTest?.testId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedTest.userInfo?.userName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedTest.userInfo?.email}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="font-medium">{selectedTest.geoLocation?.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">State</p>
                    <p className="font-medium">{selectedTest.geoLocation?.state}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Latitude</p>
                    <p className="font-medium">{selectedTest.geoLocation?.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Longitude</p>
                    <p className="font-medium">{selectedTest.geoLocation?.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="font-semibold mb-2">Test Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Device ID</p>
                    <p className="font-medium">{selectedTest.metadata?.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Device Type</p>
                    <p className="font-medium">{selectedTest.metadata?.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Test Cycle</p>
                    <p className="font-medium">{selectedTest.metadata?.testCycle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Environment</p>
                    <p className="font-medium capitalize">{selectedTest.metadata?.environment}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Road Type</p>
                    <p className="font-medium capitalize">{selectedTest.metadata?.roadType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Weather</p>
                    <p className="font-medium capitalize">{selectedTest.metadata?.weatherCondition || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div>
                <h3 className="font-semibold mb-2">Video Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-500">File Name</p>
                    <p className="font-medium break-all">{selectedTest.videoFileName || 'N/A'}</p>
                  </div>
                  {selectedTest.videoUrl && (
                    <div>
                      <p className="text-gray-500 mb-1">Video URL</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedTest.videoUrl, '_blank')}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Open Video
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedTest.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedTest.status || 'pending'}
                  </Badge>
                  {selectedTest.createdAt && (
                    <span className="text-sm text-gray-500">
                      Submitted {formatDate(selectedTest.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
