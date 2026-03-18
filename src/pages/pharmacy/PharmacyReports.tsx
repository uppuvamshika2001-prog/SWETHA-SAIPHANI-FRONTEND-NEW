import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  FileText, 
  ChevronRight,
  BarChart3,
  DollarSign,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PharmacyReports() {
  const navigate = useNavigate();

  const reportCards = [
    {
      title: "Margin Reports",
      description: "Analyze profit margins and sales performance across all medicines.",
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      path: "/pharmacy/margin-reports",
      color: "border-green-100 bg-green-50/50"
    },
    {
      title: "Inventory Reports",
      description: "Review current stock levels, low-stock alerts and reorder status.",
      icon: <Package className="h-6 w-6 text-blue-500" />,
      path: "/pharmacy/inventory",
      color: "border-blue-100 bg-blue-50/50"
    },
    {
      title: "Sales Summary",
      description: "Daily and monthly sales breakdowns with billing details.",
      icon: <DollarSign className="h-6 w-6 text-purple-500" />,
      path: "/pharmacy/billing",
      color: "border-purple-100 bg-purple-50/50"
    },
    {
      title: "Distributor Dues",
      description: "Track outstanding payments and distributor-wise reporting.",
      icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
      path: "/pharmacy/purchases",
      color: "border-orange-100 bg-orange-50/50"
    }
  ];

  return (
    <DashboardLayout role="pharmacist">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Pharmacy Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and reporting for pharmacy operations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {reportCards.map((report) => (
            <Card key={report.title} className={`border ${report.color} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => navigate(report.path)}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 rounded-xl bg-background shadow-sm border border-border/50">
                  {report.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                  {report.description}
                </CardDescription>
                <Button variant="ghost" className="w-full justify-between hover:bg-background/80" onClick={(e) => {
                  e.stopPropagation();
                  navigate(report.path);
                }}>
                  View Detailed Report
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Export
            </CardTitle>
            <CardDescription>Generate and download bulk reports for auditing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">Download Monthly Tax Report</Button>
              <Button variant="outline">Download Annual Sales Summary</Button>
              <Button variant="outline">Export Full Inventory (CSV)</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
