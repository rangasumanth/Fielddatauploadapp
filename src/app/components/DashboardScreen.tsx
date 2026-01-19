import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { FileVideo, History, MapPin, Database, Plus, TrendingUp, Activity, Zap, LogOut } from 'lucide-react';
import type { UserInfo } from '@/app/App';

type DashboardScreenProps = {
  userInfo: UserInfo;
  onStartNewTest: () => void;
  onViewHistory: () => void;
  onLogout?: () => void;
};

export function DashboardScreen({ userInfo, onStartNewTest, onViewHistory, onLogout }: DashboardScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="animate-slide-in-right">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Field Data Collection</h1>
                  <p className="text-sm text-gray-600">Professional video metadata upload system</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="text-right">
                <div className="font-semibold text-gray-900">{userInfo.userName}</div>
                <div className="text-sm text-gray-500">{userInfo.email}</div>
              </div>
              <Avatar className="w-12 h-12 border-2 border-white shadow-md-custom">
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {userInfo.userName.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {onLogout && (
                <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12 animate-slide-in-bottom">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {userInfo.userName.split(' ')[0]}!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ready to start your next field data collection session? Choose an action below to get started.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card
            className="group hover:shadow-xl-custom transition-all duration-300 cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:bg-white hover:scale-[1.02] animate-fade-in"
            onClick={onStartNewTest}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-primary rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg-custom">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    Start New Test
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Begin a fresh field data collection session
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <p className="text-gray-700 leading-relaxed">
                  Capture precise location data, input comprehensive metadata, and upload high-quality video footage from your field testing environment.
                </p>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-xl-custom transition-all duration-300 cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:bg-white hover:scale-[1.02] animate-slide-in-right"
            onClick={onViewHistory}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-secondary rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg-custom">
                  <History className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    Upload History
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Review all your previous test submissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <p className="text-gray-700 leading-relaxed">
                  Browse through your complete testing history, review metadata details, and manage your uploaded video content.
                </p>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicators */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg-custom animate-fade-in">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">System Status</CardTitle>
                <CardDescription className="text-gray-600">All services are running optimally</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md-custom transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">GPS Status</div>
                    <div className="text-sm text-gray-600">Location services active</div>
                  </div>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 font-medium shadow-sm-custom">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md-custom transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">Storage Status</div>
                    <div className="text-sm text-gray-600">Supabase connected</div>
                  </div>
                </div>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 font-medium shadow-sm-custom">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center animate-fade-in">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Button
              variant="outline"
              className="h-auto py-6 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-300 group animate-scale-in"
              onClick={onStartNewTest}
            >
              <div className="text-center w-full">
                <Plus className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                <div className="font-bold text-lg text-gray-900 group-hover:text-primary">Quick Start</div>
                <div className="text-sm text-gray-600 mt-1">Begin new test immediately</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-300 group animate-slide-in-bottom"
              onClick={onViewHistory}
            >
              <div className="text-center w-full">
                <History className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                <div className="font-bold text-lg text-gray-900 group-hover:text-primary">View All Tests</div>
                <div className="text-sm text-gray-600 mt-1">Browse submission history</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 border-2 border-gray-200 opacity-60 cursor-not-allowed group animate-slide-in-right"
              disabled
            >
              <div className="text-center w-full">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <div className="font-bold text-lg text-gray-400">Export Data</div>
                <div className="text-sm text-gray-400 mt-1">Download test reports</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
