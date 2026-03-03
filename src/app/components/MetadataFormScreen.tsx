import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, MapPin, Car, Cloud, Camera, FileText, Loader2 } from 'lucide-react';
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

type MetadataFormScreenProps = {
  userInfo: UserInfo;
  geoLocation: GeoLocation;
  metadata?: MetadataForm | null;
  onSubmit: (metadata: MetadataForm) => void;
  onDraftChange?: (metadata: MetadataForm) => void;
  onBack: () => void;
};

const buildEmptyMetadata = (fields: FormField[]): MetadataForm => {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const initial: any = {
    date: localDate,
  };

  fields.forEach(f => {
    if (f.name === 'date') return;
    initial[f.name] = f.type === 'switch' ? false : '';
  });

  return initial as MetadataForm;
};

export function MetadataFormScreen({ userInfo, geoLocation, metadata, onSubmit, onDraftChange, onBack }: MetadataFormScreenProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<MetadataForm>(() => metadata ?? ({} as MetadataForm));

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
      if (!supabaseUrl) throw new Error('Missing Supabase URL');

      const response = await fetch(`${supabaseUrl}/rest/v1/form_fields?select=*&order=order_index.asc`, {
        headers: {
          'apikey': publicAnonKey || '',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data: FormField[] = await response.json();
        setFields(data);
        if (!metadata) {
          setFormData(buildEmptyMetadata(data));
        } else {
          setFormData(metadata);
        }
      } else {
        throw new Error('Failed to fetch form config');
      }
    } catch (error) {
      console.error('Error fetching form config:', error);
      toast.error('Using offline form fallback');
      // Fallback or handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      onDraftChange?.(next as MetadataForm);
      return next as MetadataForm;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = fields
      .filter(f => f.required && !formData[f.name as keyof MetadataForm])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Required: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syncing Parameters...</p>
      </div>
    );
  }

  const sections = Array.from(new Set(fields.map(f => f.section)));

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'Basic Information': return <User className="w-4 h-4 text-primary" />;
      case 'Location Details': return <MapPin className="w-4 h-4 text-[#3B82F6]" />;
      case 'Road & Traffic': return <Car className="w-4 h-4 text-primary" />;
      case 'Ambient Conditions': return <Cloud className="w-4 h-4 text-[#8B5CF6]" />;
      case 'Camera Optomechanics': return <Camera className="w-4 h-4 text-primary" />;
      case 'Field Observations': return <FileText className="w-4 h-4 text-zinc-400" />;
      default: return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'Location Details': return 'bg-[#3B82F6]';
      case 'Ambient Conditions': return 'bg-[#8B5CF6]';
      case 'Field Observations': return 'bg-zinc-700';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-black">
      <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 animate-slide-in-right">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/5 text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <AxonLogo size={32} color="var(--primary)" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8 pb-32">
            <div className="mb-10 animate-slide-in-bottom">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none mb-3">
                Protocol Parameters
              </h2>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                Complete all mandatory fields for evidence integrity.
              </p>
            </div>

            {sections.map(section => (
              <Card key={section} className="shadow-2xl border border-white/10 bg-[#121212] backdrop-blur-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${getSectionColor(section)}`} />
                <CardHeader className="pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {getSectionIcon(section)}
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-white">{section}</CardTitle>
                      <CardDescription className="text-[9px] text-zinc-600 uppercase font-bold">Parameters set</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                  {fields.filter(f => f.section === section).map(field => (
                    <div key={field.id} className={`space-y-3 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                      <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {field.label} {field.required && '*'}
                      </Label>

                      {field.type === 'select' ? (
                        <Select
                          value={String(formData[field.name as keyof MetadataForm] || '')}
                          onValueChange={(val: string) => handleInputChange(field.name, val)}
                        >
                          <SelectTrigger className="bg-black/40 border-white/5 text-white font-bold h-11 focus:ring-primary">
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121212] border-white/10 text-white">
                            {field.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'switch' ? (
                        <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded h-11">
                          <span className="text-[9px] text-zinc-600 uppercase font-bold">Enabled</span>
                          <Switch
                            id={field.name}
                            checked={Boolean(formData[field.name as keyof MetadataForm])}
                            onCheckedChange={(checked: boolean) => handleInputChange(field.name, checked)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          value={String(formData[field.name as keyof MetadataForm] || '')}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(field.name, e.target.value)}
                          className="flex min-h-[100px] w-full rounded border border-white/5 bg-black/40 px-4 py-3 text-sm text-white font-bold focus:ring-1 focus:ring-primary placeholder:text-zinc-800"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          value={String(formData[field.name as keyof MetadataForm] || '')}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="bg-black/40 border-white/5 text-white font-bold h-11 focus:ring-primary"
                        />
                      )}
                    </div>
                  ))}

                  {section === 'Basic Information' && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Field Tester</Label>
                      <Input value={userInfo.userName} readOnly className="bg-black/20 border-white/5 text-zinc-400 font-bold h-11 cursor-not-allowed" />
                    </div>
                  )}

                  {section === 'Location Details' && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sector (City)</Label>
                        <Input value={geoLocation.city} readOnly className="bg-black/20 border-white/5 text-zinc-500 font-mono text-[10px] tracking-wider h-11 cursor-not-allowed" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Region (State)</Label>
                        <Input value={geoLocation.state} readOnly className="bg-black/20 border-white/5 text-zinc-500 font-mono text-[10px] tracking-wider h-11 cursor-not-allowed" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-[#000000]/90 border-t border-white/10 p-5 backdrop-blur-md z-40">
            <div className="max-w-5xl mx-auto flex gap-4 justify-between items-center">
              <Button type="button" variant="outline" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest border-white/10 h-11 px-8">
                Back
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-[10px] h-11 px-10 shadow-[0_0_20px_rgba(223,255,0,0.3)] flex items-center gap-3"
              >
                <Save className="w-4 h-4" />
                Commit Protocol
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
