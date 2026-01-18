import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Save, Calendar, User, MapPin, Clock, Car, Cloud, Camera, Cpu, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { UserInfo, GeoLocation, MetadataForm } from '@/app/App';

type MetadataFormScreenProps = {
  userInfo: UserInfo;
  geoLocation: GeoLocation;
  metadata?: MetadataForm | null;
  onSubmit: (metadata: MetadataForm) => void;
  onDraftChange?: (metadata: MetadataForm) => void;
  onBack: () => void;
};

const buildEmptyMetadata = (): MetadataForm => ({
  date: new Date().toISOString().split('T')[0],
  deviceId: '',
  deviceType: '',
  testCycle: '',
  location: '',
  environment: '',
  timeStart: '',
  timeEnd: '',
  roadType: '',
  postedSpeedLimit: '',
  numberOfLanes: '',
  trafficDensity: '',
  roadHeading: '',
  cameraHeading: '',
  lighting: '',
  weatherCondition: '',
  severity: '',
  measuredDistance: '',
  mountHeight: '',
  pitchAngle: '',
  vehicleCaptureView: '',
  externalBatteryPluggedIn: false,
  firmware: '',
  varVersion: ''
});

export function MetadataFormScreen({ userInfo, geoLocation, metadata, onSubmit, onDraftChange, onBack }: MetadataFormScreenProps) {
  const [formData, setFormData] = useState<MetadataForm>(() => metadata ?? buildEmptyMetadata());

  useEffect(() => {
    setFormData(metadata ?? buildEmptyMetadata());
  }, [metadata]);

  const handleInputChange = (field: keyof MetadataForm, value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ['deviceId', 'deviceType', 'testCycle', 'environment', 'roadType'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof MetadataForm]);

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Metadata Entry</h1>
                <p className="text-sm text-gray-500">{userInfo.userName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core test identification details</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field Tester</Label>
                  <Input value={userInfo.userName} readOnly className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID *</Label>
                  <Select value={formData.deviceId} onValueChange={(value) => handleInputChange('deviceId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D20A03670">D20A03670</SelectItem>
                      <SelectItem value="D20A04600">D20A04600</SelectItem>
                      <SelectItem value="D20A03710">D20A03710</SelectItem>
                      <SelectItem value="D20A03700">D20A03700</SelectItem>
                      <SelectItem value="D20A06831">D20A06831</SelectItem>
                      <SelectItem value="D20A05310">D20A05310</SelectItem>
                      <SelectItem value="D20A00440">D20A00440</SelectItem>
                      <SelectItem value="D20A06821">D20A06821</SelectItem>
                      <SelectItem value="D20A07941">D20A07941</SelectItem>
                      <SelectItem value="D20A07821">D20A07821</SelectItem>
                      <SelectItem value="D20A07681">D20A07681</SelectItem>
                      <SelectItem value="D20A04690">D20A04690</SelectItem>
                      <SelectItem value="D20A04780">D20A04780</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceType">Device Type *</Label>
                  <Select value={formData.deviceType} onValueChange={(value) => handleInputChange('deviceType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-EVT">Pre-EVT</SelectItem>
                      <SelectItem value="EVT">EVT</SelectItem>
                      <SelectItem value="DVT">DVT</SelectItem>
                      <SelectItem value="RING">RING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="testCycle">Test Cycle *</Label>
                  <Select value={formData.testCycle} onValueChange={(value) => handleInputChange('testCycle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GA 2 - RC1">GA 2 - RC1</SelectItem>
                      <SelectItem value="GA 2 - RC2">GA 2 - RC2</SelectItem>
                      <SelectItem value="GA 2 - RC3">GA 2 - RC3</SelectItem>
                      <SelectItem value="GA 2 - RC4">GA 2 - RC4</SelectItem>
                      <SelectItem value="GA 2 - RC5">GA 2 - RC5</SelectItem>
                      <SelectItem value="GA 2 - RC6">GA 2 - RC6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Geographic and site information</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City (locked)</Label>
                  <Input value={geoLocation.city} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <Label>State Collected (locked)</Label>
                  <Input value={geoLocation.state} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location / Landmark</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Main St & 5th Ave intersection"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="environment">Environment *</Label>
                  <Select value={formData.environment} onValueChange={(value) => handleInputChange('environment', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="urban">Urban</SelectItem>
                      <SelectItem value="suburban">Suburban</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="highway">Highway</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mountainous">Mountainous</SelectItem>
                      <SelectItem value="coastal">Coastal</SelectItem>
                      <SelectItem value="transportation_hub">Transportation Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Time */}
            <Card>
              <CardHeader>
                <CardTitle>Time</CardTitle>
                <CardDescription>Test duration information</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeStart">Time Start</Label>
                  <Input
                    id="timeStart"
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => handleInputChange('timeStart', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeEnd">Time End</Label>
                  <Input
                    id="timeEnd"
                    type="time"
                    value={formData.timeEnd}
                    onChange={(e) => handleInputChange('timeEnd', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Road & Traffic */}
            <Card>
              <CardHeader>
                <CardTitle>Road & Traffic</CardTitle>
                <CardDescription>Road configuration and traffic conditions</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roadType">Road Type *</Label>
                  <Select value={formData.roadType} onValueChange={(value) => handleInputChange('roadType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select road type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2_local">2-Lane Roadway</SelectItem>
                      <SelectItem value="3_local">3-lane Roadway</SelectItem>
                      <SelectItem value="arterial">Multilane Arterial</SelectItem>
                      <SelectItem value="freeway">Multilane Freeway</SelectItem>
                      <SelectItem value="intersection">Intersection</SelectItem>
                      <SelectItem value="2_highway">2-Lane Highway</SelectItem>
                      <SelectItem value="3_highway">3-Lane Highway</SelectItem>
                      <SelectItem value="parking lot">Parking lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postedSpeedLimit">Posted Speed Limit (mph)</Label>
                  <Input
                    id="postedSpeedLimit"
                    type="number"
                    value={formData.postedSpeedLimit}
                    onChange={(e) => handleInputChange('postedSpeedLimit', e.target.value)}
                    placeholder="e.g., 35"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfLanes">Number of Lanes Counted</Label>
                  <Input
                    id="numberOfLanes"
                    type="number"
                    value={formData.numberOfLanes}
                    onChange={(e) => handleInputChange('numberOfLanes', e.target.value)}
                    placeholder="e.g., 2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trafficDensity">Traffic Density</Label>
                  <Select value={formData.trafficDensity} onValueChange={(value) => handleInputChange('trafficDensity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                      <SelectItem value="congested">Congested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadHeading">Road Heading</Label>
                  <Input
                    id="roadHeading"
                    value={formData.roadHeading}
                    onChange={(e) => handleInputChange('roadHeading', e.target.value)}
                    placeholder="e.g., northbound"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cameraHeading">Camera Heading</Label>
                  <Input
                    id="cameraHeading"
                    value={formData.cameraHeading}
                    onChange={(e) => handleInputChange('cameraHeading', e.target.value)}
                    placeholder="e.g., westbound"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
                <CardDescription>Environmental and weather conditions</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lighting">Lighting</Label>
                  <Select value={formData.lighting} onValueChange={(value) => handleInputChange('lighting', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lighting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="night_ir">Night (IR)</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="transient">Transient</SelectItem>
                      <SelectItem value="night_no_ir">Night (no IR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weatherCondition">Weather Condition</Label>
                  <Select value={formData.weatherCondition} onValueChange={(value) => handleInputChange('weatherCondition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rain">Rain</SelectItem>
                      <SelectItem value="snow">Snow</SelectItem>
                      <SelectItem value="fog">Fog</SelectItem>
                      <SelectItem value="sleet">Sleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Camera & Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Camera & Setup</CardTitle>
                <CardDescription>Physical camera installation details</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="measuredDistance">Measured Distance to Road (m)</Label>
                  <Input
                    id="measuredDistance"
                    type="number"
                    step="0.1"
                    value={formData.measuredDistance}
                    onChange={(e) => handleInputChange('measuredDistance', e.target.value)}
                    placeholder="e.g., 15.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mountHeight">Mount Height (m)</Label>
                  <Input
                    id="mountHeight"
                    type="number"
                    step="0.1"
                    value={formData.mountHeight}
                    onChange={(e) => handleInputChange('mountHeight', e.target.value)}
                    placeholder="e.g., 3.2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pitchAngle">Pitch Angle (degrees)</Label>
                  <Input
                    id="pitchAngle"
                    type="number"
                    step="0.1"
                    value={formData.pitchAngle}
                    onChange={(e) => handleInputChange('pitchAngle', e.target.value)}
                    placeholder="e.g., 25.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleCaptureView">Vehicle Capture View</Label>
                  <Select value={formData.vehicleCaptureView} onValueChange={(value) => handleInputChange('vehicleCaptureView', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front</SelectItem>
                      <SelectItem value="rear">Rear</SelectItem>
                      <SelectItem value="side">Side</SelectItem>
                      <SelectItem value="overhead">Overhead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="externalBattery">External Battery Plugged In</Label>
                      <p className="text-sm text-gray-500">Is external power connected?</p>
                    </div>
                    <Switch
                      id="externalBattery"
                      checked={formData.externalBatteryPluggedIn}
                      onCheckedChange={(checked) => handleInputChange('externalBatteryPluggedIn', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Software and firmware versions</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firmware">Firmware</Label>
                  <Input
                    id="firmware"
                    value={formData.firmware}
                    onChange={(e) => handleInputChange('firmware', e.target.value)}
                    placeholder="e.g., v2.1.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="varVersion">VAR Version</Label>
                  <Input
                    id="varVersion"
                    value={formData.varVersion}
                    onChange={(e) => handleInputChange('varVersion', e.target.value)}
                    placeholder="e.g., VAR-3.0.2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Optional comments or notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <textarea
                    id="comments"
                    value={formData.comments || ''}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter any additional notes about this test condition..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 border-t">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save & Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
