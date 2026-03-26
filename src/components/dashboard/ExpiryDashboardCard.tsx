import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { Medicine } from '@/types';

interface ExpiryDashboardCardProps {
    medicines: Medicine[];
}

export function ExpiryDashboardCard({ medicines }: ExpiryDashboardCardProps) {
    const navigate = useNavigate();

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    let expiringIn30DaysCount = 0;
    let expiringIn90DaysCount = 0;

    const expiringMedicinesWithin90Days = medicines.filter(m => {
        const expDateAttr = m.batch?.expiry_date || m.expiry_date;
        const expiry = expDateAttr ? new Date(expDateAttr) : null;
        if (!expiry || isNaN(expiry.getTime())) return false;

        if (expiry <= thirtyDaysFromNow && expiry >= now) {
            expiringIn30DaysCount++;
            return true;
        } else if (expiry > thirtyDaysFromNow && expiry <= ninetyDaysFromNow) {
            expiringIn90DaysCount++;
            return true;
        }
        return false;
    }).sort((a, b) => {
        const dateA = new Date(a.batch?.expiry_date || a.expiry_date).getTime();
        const dateB = new Date(b.batch?.expiry_date || b.expiry_date).getTime();
        return dateA - dateB;
    });

    const displayMedicines = expiringMedicinesWithin90Days.slice(0, 3);

    return (
        <Card className="border-warning/20 bg-card">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-warning" />
                            Expiring Medicines
                        </CardTitle>
                        <CardDescription>
                            <span className="flex items-center gap-2 mt-3">
                                <span className="flex items-center gap-1 font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md text-xs">
                                    🔴 {expiringIn30DaysCount} (within 1 month)
                                </span>
                                <span className="flex items-center gap-1 font-medium text-warning bg-warning/10 px-2 py-1 rounded-md text-xs">
                                    🟡 {expiringIn90DaysCount} (within 3 months)
                                </span>
                            </span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {displayMedicines.length > 0 ? (
                        displayMedicines.map((medicine) => {
                            const isOneMonth = new Date(medicine.batch?.expiry_date || medicine.expiry_date) <= thirtyDaysFromNow;
                            // Add slight styling offsets over the red and yellow borders to meet the visual priority UI requirements.
                            const borderColor = isOneMonth ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5";
                            const textColor = isOneMonth ? "text-destructive" : "text-warning";
                            const expiryLabel = isOneMonth ? "Expiring Soon" : "Expiring in 3 Months";

                            return (
                                <div key={medicine.id} className={`p-3 rounded-lg border ${borderColor} transition-colors`}>
                                    <p className="font-medium text-foreground">{medicine.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Batch: {medicine.batch?.batch_number || medicine.batch_number || '-'}</p>
                                    <p className={`text-sm font-medium mt-1.5 ${textColor}`}>
                                        {expiryLabel}: {new Date(medicine.batch?.expiry_date || medicine.expiry_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Stock: {medicine.stock_quantity} units</p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-8 text-sm text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            No medicines expiring soon!
                        </div>
                    )}
                </div>
                {expiringMedicinesWithin90Days.length > 0 && (
                    <Button variant="ghost" className="w-full mt-4 text-muted-foreground" onClick={() => navigate('/pharmacy/inventory')}>
                        Review all {expiringMedicinesWithin90Days.length} expiring items
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
