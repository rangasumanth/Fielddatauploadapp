import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { FileVideo, History, MapPin, Database, Plus, TrendingUp, Activity, Zap, LogOut, Settings } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';
import type { UserInfo } from '@/app/App';

type DashboardScreenProps = {
  userInfo: UserInfo;
  onViewHistory: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
};

export function DashboardScreen({ userInfo, onStartNewTest, onViewHistory, onLogout, onOpenAdmin }: DashboardScreenProps & { onStartNewTest: () => void }) {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-black">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="animate-slide-in-right">
              <AxonLogo size={40} color="var(--primary)" />
            </div>
            <div className="flex items-center gap-6 animate-fade-in">
              <div className="hidden sm:block text-right">
                <div className="font-black text-xs uppercase tracking-wider text-white">{userInfo.userName}</div>
                <div className="text-[10px] text-primary font-mono lowercase tracking-tight">{userInfo.email}</div>
              </div>
              <Avatar className="w-10 h-10 border border-primary/30 p-0.5">
                <AvatarFallback className="bg-zinc-800 text-primary font-black text-xs">
                  {userInfo.userName.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {onLogout && (
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-zinc-500 hover:text-white hover:bg-white/5 uppercase text-[10px] font-black tracking-widest gap-2">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              )}
              {onOpenAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenAdmin}
                  className="text-zinc-500 hover:text-white hover:bg-white/5"
                  title="Admin Settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* User Welcome */}
        <div className="mb-10 animate-slide-in-bottom">
          <div className="flex items-center gap-2 text-primary mb-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-[10px] uppercase font-black tracking-[0.4em]">Authorized Agent Ingress</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white leading-none">
            Welcome, {userInfo.userName.split(' ')[0]}
          </h2>
          <p className="text-zinc-500 mt-4 max-w-xl text-sm font-medium leading-relaxed">
            Manage field data collection, sensor logs, and high-definition video evidence for the Axon public safety ecosystem.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Action Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card
                className="group border border-white/10 bg-[#121212] hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={onStartNewTest}
                role="button"
                tabIndex={0}
                aria-label="Start New Mission"
                onKeyDown={(e) => e.key === 'Enter' && onStartNewTest()}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-20 h-20 -mr-6 -mt-6 text-primary" />
                </div>
                <CardHeader className="relative z-10">
                  <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <Plus className="w-6 h-6 text-white group-hover:text-black" />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-white italic">
                    Start Mission
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                    New field data collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Initiate real-time GPS tracking and multi-sensor metadata acquisition.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="group border border-white/10 bg-[#121212] hover:border-accent/50 transition-all duration-300 cursor-pointer overflow-hidden relative focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                onClick={onViewHistory}
                role="button"
                tabIndex={0}
                aria-label="Access Evidence Hub"
                onKeyDown={(e) => e.key === 'Enter' && onViewHistory()}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                  <History className="w-20 h-20 -mr-6 -mt-6 text-accent" />
                </div>
                <CardHeader className="relative z-10">
                  <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                    <History className="w-6 h-6 text-white group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-white italic">
                    Evidence Hub
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                    Access historical uploads
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Review and synchronize previously captured test sequences and video streams.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 gap-4 font-black uppercase tracking-widest text-[10px]">
              <Button
                variant="outline"
                className="h-24 bg-zinc-900 border-white/5 hover:border-primary hover:bg-primary/5 flex flex-col gap-3 group px-2 text-center"
                onClick={onStartNewTest}
              >
                <Zap className="w-5 h-5 text-zinc-600 group-hover:text-primary transition-colors" />
                Quick Deploy
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-zinc-900 border-white/5 hover:border-accent hover:bg-accent/5 flex flex-col gap-3 group px-2 text-center"
                onClick={onViewHistory}
              >
                <Database className="w-5 h-5 text-zinc-600 group-hover:text-accent transition-colors" />
                Data Audit
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-zinc-900 border-white/5 opacity-30 cursor-not-allowed flex flex-col gap-3 px-2 text-center"
                disabled
              >
                <TrendingUp className="w-5 h-5 text-zinc-700" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-[#1A1A1A] border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black rounded border border-white/5 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-white">System Protocol</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 uppercase font-bold">Secure connection verified</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/40 border-l-2 border-green-500 rounded">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black tracking-wider uppercase">GPS Constellation</span>
                  </div>
                  <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded uppercase font-black">Online</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/40 border-l-2 border-accent rounded">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-black tracking-wider uppercase">Vault Sync</span>
                  </div>
                  <span className="text-[8px] bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-black">Secure</span>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[9px] uppercase font-bold mb-2">
                    <span className="text-zinc-500">Storage Capacity</span>
                    <span className="text-white">82% Available</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[18%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded group relative cursor-pointer overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Field Bulletin</h4>
              <p className="text-[11px] text-zinc-400 font-medium italic">"Ensure all evidence is synchronized before leaving the deployment zone."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
