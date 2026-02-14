import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { bills } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Plus, IndianRupee } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { BillGenerationDialog } from "@/components/billing/BillGenerationDialog";
import { BillDetailsDialog } from "@/components/billing/BillDetailsDialog";
import { Button } from "@/components/ui/button";

export default function OPDBilling() {
    const opdBills = bills.filter(b => b.type === 'opd');

    const columns = [
        { key: "bill_id", header: "Bill ID" },
        { key: "patient_name", header: "Patient" },
        { key: "total", header: "Total", render: (b: any) => <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" />{b.total}</span> },
        { key: "paid_amount", header: "Paid", render: (b: any) => <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" />{b.paid_amount}</span> },
        { key: "balance", header: "Balance", render: (b: any) => <span className={`flex items-center ${b.balance > 0 ? "text-red-500 font-medium" : "text-green-500"}`}><IndianRupee className="h-3 w-3 mr-0.5" />{b.balance}</span> },
        { key: "status", header: "Status", render: (b: any) => <StatusBadge status={b.status} /> },
        {
            key: "actions",
            header: "Actions",
            render: (b: any) => (
                <BillDetailsDialog billId={b.id}>
                    <Button variant="ghost" size="sm">View</Button>
                </BillDetailsDialog>
            )
        }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Receipt className="h-6 w-6" />
                            OPD Billing
                        </h1>
                        <p className="text-muted-foreground">Outpatient billing and invoices</p>
                    </div>
                    <BillGenerationDialog>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Bill
                        </Button>
                    </BillGenerationDialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoices</CardTitle>
                        <CardDescription>Recent OPD bills generated</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={opdBills}
                            columns={columns}
                            emptyMessage="No OPD bills found"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout >
    );
}
