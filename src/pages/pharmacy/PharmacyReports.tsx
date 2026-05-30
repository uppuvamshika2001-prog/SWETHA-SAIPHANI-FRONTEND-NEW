import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  FileText, 
  ChevronRight,
  BarChart3,
  IndianRupee,
  Package,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { pharmacyService } from '@/services/pharmacyService';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawClinicHeader, drawClinicFooter } from '@/utils/pdfUtils';

export default function PharmacyReports() {
  const navigate = useNavigate();

  const [downloadingTax, setDownloadingTax] = useState(false);
  const [downloadingAnnual, setDownloadingAnnual] = useState(false);
  const [downloadingInventory, setDownloadingInventory] = useState(false);

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
      icon: <IndianRupee className="h-6 w-6 text-purple-500" />,
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

  const handleDownloadTaxReport = async () => {
    setDownloadingTax(true);
    const toastId = toast.loading("Generating Monthly Tax Report...");
    try {
      const now = new Date();
      const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      const endDate = format(now, 'yyyy-MM-dd');
      
      const response = await pharmacyService.getBills({ startDate, endDate, limit: 1000 });
      const bills = Array.isArray(response) ? response : (response.items || response.data || []);
      const paidBills = bills.filter((b: any) => b.status === 'PAID');
      
      if (paidBills.length === 0) {
        toast.error("No paid bills found for this month.", { id: toastId });
        return;
      }
      
      // Calculate totals
      let totalSubtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let totalGrand = 0;
      
      const tableData = paidBills.map((bill: any, index: number) => {
        const sub = Number(bill.subtotal || 0);
        const disc = Number(bill.discount || 0);
        const tax = Number(bill.gst_amount || bill.gstAmount || 0);
        const grand = Number(bill.grand_total || bill.grandTotal || 0);
        
        totalSubtotal += sub;
        totalDiscount += disc;
        totalTax += tax;
        totalGrand += grand;
        
        const rawDate = bill.created_at || bill.createdAt;
        let dateStr = '-';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            dateStr = format(d, 'dd/MM/yyyy');
          }
        }
          
        const patientName = bill.is_walk_in || bill.isWalkIn
          ? (bill.customer_name || bill.customerName || "Walk-in")
          : (bill.patient ? `${bill.patient.first_name || ''} ${bill.patient.last_name || ''}`.trim() : "Patient");
          
        return [
          String(index + 1),
          dateStr,
          bill.bill_number || bill.billNumber || '-',
          patientName,
          `Rs. ${sub.toFixed(2)}`,
          `Rs. ${disc.toFixed(2)}`,
          `Rs. ${tax.toFixed(2)}`,
          `Rs. ${grand.toFixed(2)}`
        ];
      });
      
      const doc = new jsPDF();
      
      // Draw Header
      await drawClinicHeader(doc, `Monthly Tax Report - ${format(now, 'MMMM yyyy')}`);
      
      // Draw summary boxes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Summary Information:", 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Bills: ${paidBills.length}`, 14, 61);
      doc.text(`Total Taxable Amount: Rs. ${(totalSubtotal - totalDiscount).toFixed(2)}`, 14, 66);
      doc.text(`Total GST (Tax) Collected: Rs. ${totalTax.toFixed(2)}`, 14, 71);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Revenue (Net): Rs. ${totalGrand.toFixed(2)}`, 14, 76);
      
      // Draw Table
      autoTable(doc, {
        startY: 82,
        head: [['S.No', 'Date', 'Bill No.', 'Patient Name', 'Subtotal', 'Discount', 'GST (Tax)', 'Grand Total']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 80, 158], textColor: 255 },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        }
      });
      
      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawClinicFooter(doc, i);
      }
      
      doc.save(`Monthly_Tax_Report_${format(now, 'yyyy_MM')}.pdf`);
      toast.success("Monthly Tax Report downloaded!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to generate tax report: ${error?.message || error}`, { id: toastId });
    } finally {
      setDownloadingTax(false);
    }
  };

  const handleDownloadAnnualSalesSummary = async () => {
    setDownloadingAnnual(true);
    const toastId = toast.loading("Generating Annual Sales Summary...");
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const response = await pharmacyService.getBills({ startDate, endDate, limit: 1000 });
      const bills = Array.isArray(response) ? response : (response.items || response.data || []);
      const paidBills = bills.filter((b: any) => b.status === 'PAID');
      
      if (paidBills.length === 0) {
        toast.error("No paid sales records found for this year.", { id: toastId });
        return;
      }
      
      // Aggregate by month
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthlyData = monthNames.map((name, index) => ({
        monthName: name,
        monthIndex: index,
        billCount: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        grandTotal: 0
      }));
      
      paidBills.forEach((bill: any) => {
        const date = new Date(bill.created_at || bill.createdAt);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          monthlyData[month].billCount += 1;
          monthlyData[month].subtotal += Number(bill.subtotal || 0);
          monthlyData[month].discount += Number(bill.discount || 0);
          monthlyData[month].tax += Number(bill.gst_amount || bill.gstAmount || 0);
          monthlyData[month].grandTotal += Number(bill.grand_total || bill.grandTotal || 0);
        }
      });
      
      let yearlySubtotal = 0;
      let yearlyDiscount = 0;
      let yearlyTax = 0;
      let yearlyGrand = 0;
      let yearlyBills = 0;
      
      const tableData = monthlyData
        .filter(m => m.billCount > 0) // only show months with activity
        .map((m) => {
          yearlySubtotal += m.subtotal;
          yearlyDiscount += m.discount;
          yearlyTax += m.tax;
          yearlyGrand += m.grandTotal;
          yearlyBills += m.billCount;
          
          return [
            m.monthName,
            String(m.billCount),
            `Rs. ${m.subtotal.toFixed(2)}`,
            `Rs. ${m.discount.toFixed(2)}`,
            `Rs. ${m.tax.toFixed(2)}`,
            `Rs. ${m.grandTotal.toFixed(2)}`
          ];
        });
        
      const doc = new jsPDF();
      
      // Draw Header
      await drawClinicHeader(doc, `Annual Sales Summary - Year ${currentYear}`);
      
      // Draw summary boxes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Yearly Performance Summary:", 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Billed Transactions: ${yearlyBills}`, 14, 61);
      doc.text(`Total Gross Sales (Subtotal): Rs. ${yearlySubtotal.toFixed(2)}`, 14, 66);
      doc.text(`Total Discounts Allowed: Rs. ${yearlyDiscount.toFixed(2)}`, 14, 71);
      doc.text(`Total GST Collected: Rs. ${yearlyTax.toFixed(2)}`, 14, 76);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Net Revenue: Rs. ${yearlyGrand.toFixed(2)}`, 14, 82);
      
      // Draw Table
      autoTable(doc, {
        startY: 88,
        head: [['Month', 'Bill Count', 'Subtotal', 'Discount', 'GST (Tax)', 'Net Revenue']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [0, 80, 158], textColor: 255 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawClinicFooter(doc, i);
      }
      
      doc.save(`Annual_Sales_Summary_${currentYear}.pdf`);
      toast.success("Annual Sales Summary downloaded!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to generate annual summary: ${error?.message || error}`, { id: toastId });
    } finally {
      setDownloadingAnnual(false);
    }
  };

  const handleExportInventory = async () => {
    setDownloadingInventory(true);
    const toastId = toast.loading("Exporting Full Inventory CSV...");
    try {
      const medicines = await pharmacyService.getMedicines({ limit: 1000 });
      
      if (!medicines || medicines.length === 0) {
        toast.error("No medicines found in inventory to export.", { id: toastId });
        return;
      }
      
      const csvHeaders = [
        "Medicine Name",
        "Generic Name",
        "Manufacturer",
        "Category",
        "Current Stock (Units)",
        "Pack Qty",
        "Min Stock Level",
        "Status",
        "Batch Number",
        "Expiry Date",
        "Distributor",
        "Unit Price (Rs.)"
      ];
      
      const csvRows = [csvHeaders.join(",")];
      
      medicines.forEach((med: any) => {
        // If has batches, list each batch
        if (med.batches && med.batches.length > 0) {
          med.batches.forEach((batch: any) => {
            const expiryStr = batch.expiry_date
              ? format(new Date(batch.expiry_date), 'dd/MM/yyyy')
              : '-';
            const row = [
              `"${med.name || ''}"`,
              `"${med.generic_name || med.genericName || ''}"`,
              `"${med.manufacturer || ''}"`,
              `"${med.category?.name || (med.categoryRel?.name) || ''}"`,
              batch.stock_quantity || 0,
              batch.pack_quantity || med.pack_quantity || 0,
              med.min_stock_level || med.reorderLevel || 0,
              `"${med.status || ''}"`,
              `"${batch.batch_number || ''}"`,
              expiryStr,
              `"${batch.distributor || ''}"`,
              (batch.unit_price || 0).toFixed(2)
            ];
            csvRows.push(row.join(","));
          });
        } else {
          const expiryStr = med.expiry_date
            ? format(new Date(med.expiry_date), 'dd/MM/yyyy')
            : '-';
          const row = [
            `"${med.name || ''}"`,
            `"${med.generic_name || med.genericName || ''}"`,
            `"${med.manufacturer || ''}"`,
            `"${med.category?.name || (med.categoryRel?.name) || ''}"`,
            med.stock_quantity || 0,
            med.pack_quantity || 0,
            med.min_stock_level || med.reorderLevel || 0,
            `"${med.status || ''}"`,
            `"${med.batch_number || ''}"`,
            expiryStr,
            `"${med.distributor || ''}"`,
            (med.unit_price || 0).toFixed(2)
          ];
          csvRows.push(row.join(","));
        }
      });
      
      const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Full_Inventory_${format(new Date(), 'yyyy_MM_dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Full Inventory CSV exported successfully!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to export inventory CSV: ${error?.message || error}`, { id: toastId });
    } finally {
      setDownloadingInventory(false);
    }
  };

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
              <Button 
                variant="outline" 
                onClick={handleDownloadTaxReport}
                disabled={downloadingTax}
              >
                {downloadingTax && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Download Monthly Tax Report
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadAnnualSalesSummary}
                disabled={downloadingAnnual}
              >
                {downloadingAnnual && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Download Annual Sales Summary
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportInventory}
                disabled={downloadingInventory}
              >
                {downloadingInventory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export Full Inventory (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
