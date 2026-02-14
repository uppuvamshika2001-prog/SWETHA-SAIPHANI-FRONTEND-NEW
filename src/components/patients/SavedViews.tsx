import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, Save, Trash2 } from 'lucide-react';
import { PatientFilter } from '@/types/filters';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SavedViewsProps {
    currentFilters: PatientFilter;
    onApply: (filters: PatientFilter) => void;
}

interface SavedView {
    id: string;
    name: string;
    filters: PatientFilter;
}

export function SavedViews({ currentFilters, onApply }: SavedViewsProps) {
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [newViewName, setNewViewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('patientSavedViews');
        if (saved) {
            try {
                setSavedViews(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved views');
            }
        }
    }, []);

    const handleSave = () => {
        if (!newViewName.trim()) {
            toast.error('Please enter a name for the view');
            return;
        }

        const newView: SavedView = {
            id: Date.now().toString(),
            name: newViewName,
            filters: { ...currentFilters }, // Deep copy if needed, but shallow is fine for simple object
        };

        const updatedViews = [...savedViews, newView];
        setSavedViews(updatedViews);
        localStorage.setItem('patientSavedViews', JSON.stringify(updatedViews));
        setNewViewName('');
        setIsSaving(false);
        toast.success('Filter view saved');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedViews = savedViews.filter((v) => v.id !== id);
        setSavedViews(updatedViews);
        localStorage.setItem('patientSavedViews', JSON.stringify(updatedViews));
        toast.success('View deleted');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Saved Views
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>My Favorites</DropdownMenuLabel>
                <div className="p-2">
                    {isSaving ? (
                        <div className="flex gap-2">
                            <Input
                                value={newViewName}
                                onChange={(e) => setNewViewName(e.target.value)}
                                placeholder="View Name"
                                className="h-8"
                            />
                            <Button size="sm" onClick={handleSave}><Save className="h-3 w-3" /></Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setIsSaving(true)}>
                            + Save Current View
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {savedViews.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No saved views</div>
                ) : (
                    savedViews.map((view) => (
                        <DropdownMenuItem key={view.id} onClick={() => onApply(view.filters)} className="flex items-center justify-between group">
                            <span>{view.name}</span>
                            <Trash2
                                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                                onClick={(e) => handleDelete(view.id, e)}
                            />
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
