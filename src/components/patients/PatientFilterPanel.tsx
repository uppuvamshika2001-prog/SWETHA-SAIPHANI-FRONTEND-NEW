import React, { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PatientFilter } from '@/types/filters';
import { RotateCcw } from 'lucide-react';

interface PatientFilterPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    filters: PatientFilter;
    onApply: (filters: PatientFilter) => void;
    onClear: () => void;
}

export function PatientFilterPanel({
    isOpen,
    onOpenChange,
    filters,
    onApply,
    onClear,
}: PatientFilterPanelProps) {
    const [draftFilters, setDraftFilters] = useState<PatientFilter>(filters);

    // Sync draft with actual filters when panel opens or filters change externally
    useEffect(() => {
        setDraftFilters(filters);
    }, [filters, isOpen]);

    const handleChange = (key: keyof PatientFilter, value: any) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApply(draftFilters);
        onOpenChange(false);
    };

    const handleClear = () => {
        const cleared: PatientFilter = {
            page: 1,
            pageSize: filters.pageSize,
            sortBy: filters.sortBy,
            sortDir: filters.sortDir
        };
        setDraftFilters(cleared);
        onClear(); // calling parent clear too
        // onOpenChange(false); // Optional: keep open or close
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Filter Patients</SheetTitle>
                    <SheetDescription>
                        Narrow down patient records using the criteria below.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    {/* Basic Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            placeholder="Name, UHID, or Mobile Number"
                            value={draftFilters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Gender */}
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select
                                value={draftFilters.gender || 'all'}
                                onValueChange={(val) => handleChange('gender', val === 'all' ? undefined : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={draftFilters.status || 'all'}
                                onValueChange={(val) => handleChange('status', val === 'all' ? undefined : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Age Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ageMin">Min Age</Label>
                            <Input
                                id="ageMin"
                                type="number"
                                min={0}
                                placeholder="0"
                                value={draftFilters.ageMin || ''}
                                onChange={(e) => handleChange('ageMin', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ageMax">Max Age</Label>
                            <Input
                                id="ageMax"
                                type="number"
                                min={0}
                                placeholder="100"
                                value={draftFilters.ageMax || ''}
                                onChange={(e) => handleChange('ageMax', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>
                    </div>

                    {/* Date Range - Registration */}
                    <div className="space-y-2">
                        <Label>Registration Date</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={draftFilters.regFrom || ''}
                                onChange={(e) => handleChange('regFrom', e.target.value)}
                            />
                            <Input
                                type="date"
                                value={draftFilters.regTo || ''}
                                onChange={(e) => handleChange('regTo', e.target.value)}
                            />
                        </div>
                    </div>

                </div>

                <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={handleClear} className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                    <Button onClick={handleApply}>Apply Filters</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
