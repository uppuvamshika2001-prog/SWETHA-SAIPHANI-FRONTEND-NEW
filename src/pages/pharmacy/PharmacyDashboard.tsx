import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pill,
  Package,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  Search,
  TrendingDown,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AddMedicineDialog } from '@/components/pharmacy/AddMedicineDialog';
import { pharmacyService } from '@/services/pharmacyService';
import { Medicine } from '@/types';
import { StatsCardSkeleton } from '@/components/ui/skeleton';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state for actions
  const [reorderedItems, setReorderedItems] = useState<string[]>([]);
  const [processedPrescriptions, setProcessedPrescriptions] = useState<string[]>([]);

  // Calculate dispensed today from bills
  // Use min_stock_level if set, otherwise default to 5 as threshold
  const LOW_STOCK_DEFAULT_THRESHOLD = 5;
  const lowStockMedicines = medicines.filter((m) => {
    const threshold = m.min_stock_level > 0 ? m.min_stock_level : LOW_STOCK_DEFAULT_THRESHOLD;
    return m.stock_quantity <= threshold;
  });
  const outOfStock = medicines.filter((m) => m.stock_quantity === 0).length;

  // Pending orders count from fetched prescriptions
  const pendingOrders = pendingPrescriptions.length;
  const [dispensedToday, setDispensedToday] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [fetchedMedicines, fetchedPrescriptions, fetchedBills] = await Promise.all([
          pharmacyService.getMedicines(),
          pharmacyService.getPendingPrescriptions(),
          pharmacyService.getBills()
        ]);

        setMedicines(fetchedMedicines || []);
        setPendingPrescriptions(fetchedPrescriptions || []);

        // Calculate dispensed today
        const today = new Date().toDateString();
        const todaysBills = (fetchedBills || []).filter((bill: any) =>
          new Date(bill.created_at || bill.date).toDateString() === today
        );
        // Assuming each bill represents a dispensing action, or sum items if simpler
        setDispensedToday(todaysBills.length);

      } catch (error) {
        console.error("Failed to fetch pharmacy dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handlePurchaseOrder = () => {
    toast.success("Purchase Order", {
      description: "Navigating to create new purchase order",
    });
    navigate('/pharmacy/billing');
  };

  const handleDispenseMedicine = () => {
    toast.success("Dispense Medicine", {
      description: "Navigating to dispensing counter",
    });
    navigate('/pharmacy/dispensing');
  };

  const handleReorder = (medicine: Medicine) => {
    setReorderedItems([...reorderedItems, medicine.id]);
    toast.success("Reorder Placed", {
      description: `Reorder request for ${medicine.name} has been submitted`,
    });
  };

  const handleProcessPrescription = (rxId: string, patientName: string) => {
    setProcessedPrescriptions([...processedPrescriptions, rxId]);
    toast.success("Prescription Processed", {
      description: `Prescription for ${patientName} has been processed`,
    });
  };

  const inventoryColumns = [
    { key: 'name', header: 'Medicine' },
    { key: 'category', header: 'Category' },
    {
      key: 'stock_quantity',
      header: 'Stock',
      render: (medicine: Medicine) => {
        const isLow = medicine.stock_quantity <= medicine.min_stock_level;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-destructive font-medium' : ''}>
              {medicine.stock_quantity}
            </span>
            {isLow && <TrendingDown className="h-4 w-4 text-destructive" />}
          </div>
        );
      }
    },
    {
      key: 'unit_price',
      header: 'Price',
      render: (medicine: Medicine) => {
        const price = parseFloat(String(medicine.unit_price || 0));
        return <span>₹{(isNaN(price) ? 0 : price).toFixed(2)}</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (medicine: Medicine) => (
        <StatusBadge status={medicine.status} />
      )
    },
  ];

  // Map pending prescriptions to table format if needed, or use directly
  // The API response might have different keys. Let's adapt if necessary or assume consistent naming.
  // Assuming pendingPrescriptions from API has: id, patientName, doctorName, items (count), time, status
  // If API returns different structure, we might need an adapter.
  // For now, we'll try to use it directly, assuming generic structure or adapting in render.

  const activePrescriptions = pendingPrescriptions.filter(rx => !processedPrescriptions.includes(rx.id));

  const prescriptionColumns = [
    {
      key: 'patientName',
      header: 'Patient',
      render: (rx: any) => (
        <div>
          <p className="font-medium">{rx.patientName || rx.patient_name || 'Patient'}</p>
          <p className="text-xs text-muted-foreground">{rx.doctorName || rx.doctor_name || 'Doctor'}</p>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      render: (rx: any) => (
        <Badge variant="outline">{rx.items?.length || rx.itemCount || 0} items</Badge>
      )
    },
    { key: 'time', header: 'Time', render: (rx: any) => rx.time || format(new Date(rx.created_at || new Date()), 'p') },
    {
      key: 'status',
      header: 'Status',
      render: (rx: any) => (
        <StatusBadge status={rx.status || 'pending'} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (rx: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleProcessPrescription(rx.id, rx.patientName || rx.patient_name)}
        >
          Process
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout role="pharmacist">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePurchaseOrder}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Order
            </Button>
            <Button size="sm" onClick={handleDispenseMedicine}>
              <Pill className="h-4 w-4 mr-2" />
              Dispense Medicine
            </Button>
          </div>
        </div>

        {/* Quick Search */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines by name, category, or batch number..."
                  className="pl-10"
                />
              </div>
              <AddMedicineDialog>
                <Button variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </AddMedicineDialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Pending Orders"
                value={pendingOrders}
                icon={<ClipboardList className="h-5 w-5" />}
                description="Prescriptions to process"
                variant="primary"
              />
              <StatsCard
                title="Dispensed Today"
                value={dispensedToday}
                icon={<Pill className="h-5 w-5" />}
                description="Medicines dispensed"
                variant="success"
              />
              <StatsCard
                title="Low Stock Items"
                value={lowStockMedicines.length}
                icon={<AlertTriangle className="h-5 w-5" />}
                description="Below minimum level"
                variant="warning"
              />
              <StatsCard
                title="Out of Stock"
                value={outOfStock}
                icon={<Package className="h-5 w-5" />}
                description="Need immediate restock"
                variant="destructive"
              />
            </>
          )}
        </div>

        {/* Pending Prescriptions */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Pending Prescriptions
              </CardTitle>
              <CardDescription>Orders waiting to be processed</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/pharmacy/orders')}>
              View All Orders <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {activePrescriptions.length > 0 ? (
              <DataTable
                data={activePrescriptions}
                columns={prescriptionColumns}
                emptyMessage="No pending prescriptions"
                loading={loading}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending prescriptions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory & Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Low Stock Alerts */}
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockMedicines.slice(0, 5).map((medicine) => (
                <div key={medicine.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                  <div>
                    <p className="font-medium text-sm">{medicine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {medicine.stock_quantity} / Min: {medicine.min_stock_level}
                    </p>
                  </div>
                  {reorderedItems.includes(medicine.id) ? (
                    <Button variant="ghost" size="sm" disabled className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Ordered
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleReorder(medicine)}>
                      Reorder
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => navigate('/pharmacy/alerts')}>
                View All Low Stock Items
              </Button>
            </CardContent>
          </Card>

          {/* Inventory Overview */}
          <Card className="lg:col-span-2 glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Inventory Overview</CardTitle>
                <CardDescription>Current medicine stock levels</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/pharmacy/inventory')}>
                Full Inventory <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={medicines.slice(0, 5)}
                columns={inventoryColumns}
                emptyMessage="No medicines in inventory"
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alerts - Mock for now as API might not filter expiry yet */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Expiring Soon
            </CardTitle>
            <CardDescription>Medicines expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 rounded-lg bg-card/50 border border-destructive/20">
                <p className="font-medium">Amoxicillin 500mg</p>
                <p className="text-sm text-muted-foreground">Batch: AMX-2024-001</p>
                <p className="text-sm text-destructive mt-1">Expires: Feb 15, 2026</p>
                <p className="text-xs text-muted-foreground">Stock: 45 units</p>
              </div>
              <div className="p-3 rounded-lg bg-card/50 border border-warning/20">
                <p className="font-medium">Paracetamol 650mg</p>
                <p className="text-sm text-muted-foreground">Batch: PCM-2024-023</p>
                <p className="text-sm text-warning mt-1">Expires: Feb 28, 2026</p>
                <p className="text-xs text-muted-foreground">Stock: 120 units</p>
              </div>
              <div className="p-3 rounded-lg bg-card/50 border border-warning/20">
                <p className="font-medium">Ibuprofen 400mg</p>
                <p className="text-sm text-muted-foreground">Batch: IBU-2024-015</p>
                <p className="text-sm text-warning mt-1">Expires: Mar 10, 2026</p>
                <p className="text-xs text-muted-foreground">Stock: 80 units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

