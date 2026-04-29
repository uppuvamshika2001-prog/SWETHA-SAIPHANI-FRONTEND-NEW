import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Calendar, 
  Pill, 
  Download, 
  Filter,
  BarChart3,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pharmacyService } from '@/services/pharmacyService';
import { format, startOfMonth, endOfDay } from 'date-fns';
import { toast } from 'sonner';

const PatientNamesList = ({ namesString }: { namesString: string }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!namesString) return <span className="text-muted-foreground">N/A</span>;
  
  const names = namesString.split(',').map(n => n.trim()).filter(Boolean);
  
  if (names.length === 0) return <span className="text-muted-foreground">N/A</span>;
  
  if (names.length <= 1) {
    return <span className="text-sm">{names[0]}</span>;
  }
  
  const displayNames = expanded ? names : [names[0]];
  
  return (
    <div className="flex flex-col gap-1">
      {displayNames.map((name, i) => (
        <span key={i} className="text-sm">{name}</span>
      ))}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="text-xs text-primary hover:underline text-left mt-0.5 font-medium"
      >
        {expanded ? 'View Less' : `View More (+${names.length - 1})`}
      </button>
    </div>
  );
};

export default function MarginReports() {
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const report = await pharmacyService.getMarginReport(dateRange);
      setData(report.items || report.data || report || null);
    } catch (error) {
      console.error('Failed to fetch margin report:', error);
      toast.error('Failed to load margin report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const columns = [
    { key: 'name', header: 'Medicine Name' },
    { key: 'quantity', header: 'Quantity Sold' },
    { 
      key: 'profit', 
      header: 'Total Profit',
      render: (row: any) => (
        <span className="font-medium text-slate-700">
          ₹{Number(row.profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
  ];

  return (
    <DashboardLayout role={(role as any) || "admin"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Margin Reports</h1>
            <p className="text-muted-foreground">Track pharmacy profit and sales performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    className="pl-10" 
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    className="pl-10" 
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={fetchReport} disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-50 border-emerald-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Profit (Range)</p>
                  <h3 className="text-2xl font-bold text-emerald-900">₹{data?.totalSalesRange?.toLocaleString('en-IN') || '0'}</h3>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Today's Profit</p>
                  <h3 className="text-2xl font-bold text-amber-900">₹{data?.todaySales?.toLocaleString('en-IN') || '0'}</h3>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Monthly Profit</p>
                  <h3 className="text-2xl font-bold text-blue-900">₹{data?.monthlySales?.toLocaleString('en-IN') || '0'}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Items */}
          <Card className="lg:col-span-1 glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top 10 Items
              </CardTitle>
              <CardDescription>Highest revenue items in range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topMedicines?.map((m: any, i: number) => (
                  <div key={`${m.name}-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">₹{m.sales.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {!data?.topMedicines?.length && (
                  <p className="text-center text-muted-foreground py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Profit Table */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="text-lg">Medicine-wise Profit</CardTitle>
              <CardDescription>Detailed profit breakdown by medicine</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={data?.medicineWiseProfit || []}
                columns={columns}
                emptyMessage="No sales data found for the selected range"
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
