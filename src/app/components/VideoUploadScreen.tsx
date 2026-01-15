import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileVideo, ArrowLeft, Check, X } from 'lucide-react';

type VideoUploadScreenProps = {
  videoFile?: File | null;
  onUpload: (file: File | null) => void;
  onBack: () => void;
};

export function VideoUploadScreen({ videoFile, onUpload, onBack }: VideoUploadScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (videoFile) {
      setSelectedFile(videoFile);
    }
  }, [videoFile]);

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

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));

    if (videoFile) {
      setSelectedFile(videoFile);
      toast.success('Video file selected');
    } else {
      toast.error('Please drop a valid video file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        toast.success('Video file selected');
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    toast.info('Video file removed');
  };

  const handleContinue = () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    onUpload(selectedFile);
  };

  const handleSkip = () => {
    onUpload(null);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Video Upload</h1>
                <p className="text-sm text-gray-500">Upload field test video</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="w-6 h-6 text-blue-600" />
              Select Video File
            </CardTitle>
            <CardDescription>
              Upload your field test video recording
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedFile ? (
              <>
                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center transition-colors
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        Drag and drop your video file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click the button below to browse
                      </p>
                    </div>

                    <div>
                      <label htmlFor="file-upload">
                        <Button type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                          Browse Files
                        </Button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <p className="text-xs text-gray-400">
                      Supported formats: MP4, MOV, AVI, WebM (Max 2GB)
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* File Preview */}
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileVideo className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {selectedFile.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          <span>File ready for upload</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-generated name info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> The video will be automatically renamed with a unique identifier
                    during upload to maintain consistency and traceability.
                  </p>
                </div>

                {/* Change File Button */}
                <div className="text-center">
                  <label htmlFor="file-change">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => document.getElementById('file-change')?.click()}
                    >
                      Change Video File
                    </Button>
                  </label>
                  <input
                    id="file-change"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Upload Later
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedFile}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Continue to Review
              </Button>
            </div>

            {/* Upload Info */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Upload Information</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Large files will be uploaded to secure cloud storage</li>
                <li>• Upload progress will be shown in the next step</li>
                <li>• Ensure stable internet connection for large videos</li>
                <li>• Video integrity will be verified after upload</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
