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
  DollarSign
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { pharmacyService } from '@/services/pharmacyService';
import { format, startOfMonth, endOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function MarginReports() {
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
      setData(report);
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
      render: (row: any) => <span className="font-medium text-green-600">₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
  ];

  return (
    <DashboardLayout role="pharmacist">
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
          <StatsCard
            title="Total Margin (Range)"
            value={`₹${data?.totalProfit?.toLocaleString('en-IN') || '0'}`}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Net profit in selected date range"
            variant="success"
          />
          <StatsCard
            title="Today's Margin"
            value={`₹${data?.todayProfit?.toLocaleString('en-IN') || '0'}`}
            icon={<DollarSign className="h-5 w-5" />}
            description="Total profit generated today"
            variant="warning"
          />
          <StatsCard
            title="Monthly Margin"
            value={`₹${data?.monthlyProfit?.toLocaleString('en-IN') || '0'}`}
            icon={<DollarSign className="h-5 w-5" />}
            description="Total profit this month"
            variant="primary"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Profitable Medicines */}
          <Card className="lg:col-span-1 glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top 10 Profitable
              </CardTitle>
              <CardDescription>Most profitable medicines in range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topMedicines?.map((m: any, i: number) => (
                  <div key={`${m.name}-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">₹{m.profit.toLocaleString('en-IN')}</span>
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
