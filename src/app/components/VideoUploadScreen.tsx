import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileVideo, ArrowLeft, Check, X } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';

type VideoUploadScreenProps = {
  videoFiles?: File[];
  onUpload: (files: File[]) => void;
  onBack: () => void;
};

export function VideoUploadScreen({ videoFiles, onUpload, onBack }: VideoUploadScreenProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setSelectedFiles(videoFiles ?? []);
  }, [videoFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('video/'));

    if (files.length > 0) {
      setSelectedFiles(files);
      toast.success(`${files.length} video file${files.length > 1 ? 's' : ''} selected`);
    } else {
      toast.error('Please drop a valid video file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
      if (videoFiles.length > 0) {
        setSelectedFiles(videoFiles);
        toast.success(`${videoFiles.length} video file${videoFiles.length > 1 ? 's' : ''} selected`);
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info('Video file removed');
  };

  const handleContinue = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a video file');
      return;
    }

    onUpload(selectedFiles);
  };

  const handleSkip = () => {
    onUpload([]);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-white/5 text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <AxonLogo size={32} color="var(--primary)" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="shadow-2xl border border-white/10 bg-[#121212] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded">
                <FileVideo className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Select Mission Asset</CardTitle>
                <CardDescription className="text-[9px] text-zinc-600 uppercase font-bold mt-1">Capture field test recording for ingestion</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {selectedFiles.length === 0 ? (
              <>
                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload Video Evidence: Click or drag and drop video files here"
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-upload')?.click()}
                  className={`
                    border border-dashed rounded relative overflow-hidden p-16 text-center transition-all duration-300
                    ${isDragging
                      ? 'border-blue-500 bg-blue-500/5 scale-[0.99]'
                      : 'border-white/5 bg-black/40 hover:border-white/20'
                    }
                  `}
                >
                  {/* Scanning animation effect on drag */}
                  {isDragging && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-pulse" />
                  )}

                  <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className={`p-6 rounded-full transition-all duration-500 ${isDragging ? 'bg-blue-500/20 scale-110' : 'bg-white/5'}`}>
                      <Upload className={`w-12 h-12 transition-colors duration-500 ${isDragging ? 'text-blue-400' : 'text-zinc-600'}`} aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-xl font-black uppercase tracking-tighter text-white mb-2 italic">
                        Initialize Asset Drop
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        Secure ingestion tunnel active
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                      <label htmlFor="file-upload" className="w-full">
                        <Button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-[10px] py-6 shadow-xl"
                        >
                          Manual Locate
                        </Button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <p className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">
                      PROTOCOLS: MP4, MOV, AVI, WEBM // LIMIT: 2GB
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* File Preview */}
                <div className="space-y-4">
                  {selectedFiles.map((file, index) => (
                    <div className="group border border-white/5 rounded bg-black/40 p-6 relative overflow-hidden hover:border-blue-500/30 transition-all duration-300" key={`${file.name}-${index}`}>
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <div className="flex items-start gap-6 relative z-10">
                        <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
                          <FileVideo className="w-8 h-8 text-blue-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-black uppercase tracking-tighter text-white truncate italic mb-1">
                                {file.name}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-zinc-500 font-mono tracking-tighter bg-white/5 py-0.5 px-2 rounded">
                                  {formatFileSize(file.size)}
                                </span>
                                <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest truncate">
                                  {file.type}
                                </span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                              className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>

                          <div className="mt-6 flex items-center gap-3">
                            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-full animate-pulse-slow" />
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-blue-500 font-black uppercase tracking-widest">
                              <Check className="w-3 h-3" />
                              Synced
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-generated name info */}
                <div className="bg-blue-500/5 border-l-2 border-blue-500/50 p-5 rounded-r">
                  <div className="flex gap-4">
                    <div className="p-1">
                      <Check className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider leading-relaxed">
                      Mission Control notice: Files will be hash-locked and uniquely indexed
                      to maintain evidence chain of custody standards.
                    </p>
                  </div>
                </div>

                {/* Change File Button */}
                <div className="flex justify-center">
                  <label htmlFor="file-change">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-change')?.click()}
                      className="border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] h-10 px-6"
                    >
                      Swap Mission Asset
                    </Button>
                  </label>
                  <input
                    id="file-change"
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-white/5">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-white/10 text-zinc-400 font-black uppercase tracking-widest text-[10px] h-12 px-8 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-zinc-600 hover:text-zinc-300 font-black uppercase tracking-widest text-[10px] h-12 px-6"
                >
                  Defer Upload
                </Button>
              </div>
              <Button
                onClick={handleContinue}
                disabled={selectedFiles.length === 0}
                className="bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-[11px] h-12 px-12 shadow-[0_0_25px_rgba(223,255,0,0.3)] disabled:opacity-30 disabled:grayscale"
              >
                Assemble Package
              </Button>
            </div>

            {/* Upload Info */}
            <div className="bg-black/40 border border-white/5 rounded p-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Network Protocols
              </h4>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                <li className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Secure TLS 1.3 Channel
                </li>
                <li className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Chunked Payload Support
                </li>
                <li className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Persistent Handshake
                </li>
                <li className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5">•</span>
                  MD5 Integrity Check
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
