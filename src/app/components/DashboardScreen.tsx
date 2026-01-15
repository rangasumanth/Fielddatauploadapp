import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { FileVideo, History, MapPin, Database } from 'lucide-react';
import type { UserInfo } from '@/app/App';

type DashboardScreenProps = {
  userInfo: UserInfo;
  onStartNewTest: () => void;
  onViewHistory: () => void;
};

export function DashboardScreen({ userInfo, onStartNewTest, onViewHistory }: DashboardScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Data Collection</h1>
              <p className="text-sm text-gray-500">Video Metadata Upload System</p>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">{userInfo.userName}</div>
              <div className="text-sm text-gray-500">{userInfo.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
            onClick={onStartNewTest}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileVideo className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Start New Test</CardTitle>
                  <CardDescription>Begin a new field data collection session</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Capture location, enter metadata, and upload video from your field test
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500"
            onClick={onViewHistory}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <History className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle>Upload History</CardTitle>
                  <CardDescription>View all previous test submissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Review past field tests, metadata, and uploaded videos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system and service status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">GPS Status</div>
                    <div className="text-sm text-gray-600">Location services</div>
                  </div>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Storage Status</div>
                    <div className="text-sm text-gray-600">Supabase S3</div>
                  </div>
                </div>
                <Badge className="bg-blue-600">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={onStartNewTest}
          >
            <div className="text-left w-full">
              <div className="font-semibold">Quick Start</div>
              <div className="text-xs text-gray-600">Begin new test immediately</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={onViewHistory}
          >
            <div className="text-left w-full">
              <div className="font-semibold">View All Tests</div>
              <div className="text-xs text-gray-600">Browse submission history</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4"
            disabled
          >
            <div className="text-left w-full">
              <div className="font-semibold">Export Data</div>
              <div className="text-xs text-gray-600">Download test reports</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
