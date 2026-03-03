import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, GripVertical, Settings } from 'lucide-react';
import { AxonLogo } from '@/app/components/ui/AxonLogo';

export type FormField = {
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

type AdminDashboardScreenProps = {
    onBack: () => void;
};

export function AdminDashboardScreen({ onBack }: AdminDashboardScreenProps) {
    const [fields, setFields] = useState<FormField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingField, setEditingField] = useState<Partial<FormField> | null>(null);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
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
                const data = await response.json();
                setFields(data);
            } else {
                throw new Error('Failed to fetch fields');
            }
        } catch (error) {
            console.error('Error fetching fields:', error);
            toast.error('Failed to load form configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveField = async () => {
        if (!editingField?.name || !editingField?.label || !editingField?.section) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
            const method = editingField.id ? 'PATCH' : 'POST';
            const url = editingField.id
                ? `${supabaseUrl}/rest/v1/form_fields?id=eq.${editingField.id}`
                : `${supabaseUrl}/rest/v1/form_fields`;

            const response = await fetch(url, {
                method,
                headers: {
                    'apikey': publicAnonKey || '',
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json',
                    ...(editingField.id ? {} : { 'Prefer': 'return=representation' })
                },
                body: JSON.stringify({
                    ...editingField,
                    order_index: editingField.order_index || fields.length * 10 + 10
                })
            });

            if (response.ok) {
                toast.success(editingField.id ? 'Field updated' : 'Field added');
                setEditingField(null);
                fetchFields();
            } else {
                throw new Error('Failed to save field');
            }
        } catch (error) {
            console.error('Error saving field:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleDeleteField = async (id: string, isSystem: boolean) => {
        if (isSystem) {
            toast.error('System fields cannot be deleted');
            return;
        }

        if (!confirm('Are you sure you want to remove this field?')) return;

        try {
            const { supabaseUrl, publicAnonKey } = await import('@/utils/supabase/info');
            const response = await fetch(`${supabaseUrl}/rest/v1/form_fields?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': publicAnonKey || '',
                    'Authorization': `Bearer ${publicAnonKey}`
                }
            });

            if (response.ok) {
                toast.success('Field removed');
                fetchFields();
            } else {
                throw new Error('Failed to delete field');
            }
        } catch (error) {
            console.error('Error deleting field:', error);
            toast.error('Failed to remove field');
        }
    };

    const sections = Array.from(new Set(fields.map(f => f.section)));

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
            <header className="bg-black border-b border-white/10 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
                <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-zinc-400">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <AxonLogo size={32} color="var(--primary)" />
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">
                            Admin <span className="text-primary not-italic">Dashboard</span>
                        </h1>
                    </div>
                    <Button
                        onClick={() => setEditingField({ section: 'Basic Information', type: 'text', required: false, is_system: false })}
                        className="bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-[10px] h-9 px-4"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Field
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-10">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sections.map(section => (
                            <div key={section} className="space-y-4">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 pl-2 border-l-2 border-primary">
                                    {section}
                                </h2>
                                <div className="grid gap-2">
                                    {fields.filter(f => f.section === section).map(field => (
                                        <Card key={field.id} className="bg-zinc-900/50 border-white/5 hover:border-white/10 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <GripVertical className="w-4 h-4 text-zinc-700 cursor-grab" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{field.label}</p>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                                            {field.name} • {field.type} {field.required && '• REQUIRED'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingField(field)}
                                                        className="text-zinc-400 hover:text-white"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    {!field.is_system && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteField(field.id, field.is_system)}
                                                            className="text-zinc-600 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            {editingField && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg bg-[#121212] border-white/10 shadow-2xl">
                        <CardHeader className="border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black uppercase tracking-widest">
                                    {editingField.id ? 'Edit Field' : 'New Configuration Field'}
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setEditingField(null)} className="text-zinc-500">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Section</Label>
                                    <Select
                                        value={editingField.section}
                                        onValueChange={(val) => setEditingField(p => ({ ...p!, section: val }))}
                                    >
                                        <SelectTrigger className="bg-black border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="Basic Information">Basic Information</SelectItem>
                                            <SelectItem value="Location Details">Location Details</SelectItem>
                                            <SelectItem value="Road & Traffic">Road & Traffic</SelectItem>
                                            <SelectItem value="Ambient Conditions">Ambient Conditions</SelectItem>
                                            <SelectItem value="Camera Optomechanics">Camera Optomechanics</SelectItem>
                                            <SelectItem value="Field Observations">Field Observations</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Internal Name (CamelCase)</Label>
                                        <Input
                                            value={editingField.name}
                                            onChange={(e) => setEditingField(p => ({ ...p!, name: e.target.value }))}
                                            disabled={editingField.is_system}
                                            className="bg-black border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Display Label</Label>
                                        <Input
                                            value={editingField.label}
                                            onChange={(e) => setEditingField(p => ({ ...p!, label: e.target.value }))}
                                            className="bg-black border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Input Type</Label>
                                        <Select
                                            value={editingField.type}
                                            onValueChange={(val: any) => setEditingField(p => ({ ...p!, type: val }))}
                                        >
                                            <SelectTrigger className="bg-black border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="select">Select Menu</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="switch">Switch (Yes/No)</SelectItem>
                                                <SelectItem value="textarea">Text Area</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <Switch
                                            checked={editingField.required}
                                            onCheckedChange={(val) => setEditingField(p => ({ ...p!, required: val }))}
                                        />
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Required Field</Label>
                                    </div>
                                </div>

                                {editingField.type === 'select' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Options (Comma separated)</Label>
                                        <textarea
                                            value={editingField.options?.join(', ') || ''}
                                            onChange={(e) => setEditingField(p => ({ ...p!, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                                            className="w-full bg-black border border-white/10 rounded-md p-2 text-sm min-h-[80px]"
                                            placeholder="Option 1, Option 2, ..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <Button variant="ghost" onClick={() => setEditingField(null)} className="text-zinc-500 uppercase text-[10px] font-black">
                                    Abort
                                </Button>
                                <Button onClick={handleSaveField} className="bg-primary hover:bg-white text-black uppercase text-[10px] font-black px-8">
                                    Commit Configuration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
