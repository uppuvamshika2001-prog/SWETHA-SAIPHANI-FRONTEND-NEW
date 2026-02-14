import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { PatientFilter } from '@/types/filters';

interface FilterChipsProps {
    filters: PatientFilter;
    onRemove: (key: keyof PatientFilter) => void;
    onClearAll: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (key === 'page' || key === 'pageSize' || key === 'sortBy' || key === 'sortDir') return false;
        return value !== undefined && value !== '';
    });

    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground mr-2">Active Filters:</span>
            {activeFilters.map(([key, value]) => (
                <Badge key={key} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-semibold">{String(value)}</span>
                    <button
                        onClick={() => onRemove(key as keyof PatientFilter)}
                        className="ml-1 hover:text-destructive focus:outline-none"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <button
                onClick={onClearAll}
                className="text-sm text-primary hover:underline ml-2"
            >
                Clear All
            </button>
        </div>
    );
}
