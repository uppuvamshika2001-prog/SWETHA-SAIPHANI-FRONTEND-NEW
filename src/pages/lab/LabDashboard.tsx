import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Search,
  FileText,
  Beaker,
  ChevronRight,
  Camera,
  Microscope,
  Dna,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { LabResultEntryDialog } from '@/components/lab/LabResultEntryDialog';
import { LabResultDetailsDialog } from '@/components/lab/LabResultDetailsDialog';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useLab } from '@/contexts/LabContext';

export default function LabDashboard() {
  const navigate = useNavigate();
  const [processedTests, setProcessedTests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'urgent'>('all');
  const { labOrders: rawOrders, loading, fetchLabOrders } = useLab();

  useEffect(() => {
    fetchLabOrders();
  }, [fetchLabOrders]);

  const labOrders = rawOrders.map(order => ({
    id: order.id,
    order_id: `LAB-${order.id.slice(0, 4).toUpperCase()}`,
    patient_id: order.patientId,
    patient_name: `${order.patient.firstName} ${order.patient.lastName}`,
    doctor_id: order.orderedById,
    doctor_name: `Dr. ${order.orderedBy.firstName} ${order.orderedBy.lastName}`,
    tests: [{
      test_id: order.testCode || 'N/A',
      test_name: order.testName,
      status: order.status === 'COMPLETED' ? 'completed' : ('pending' as const),
      result: '',
    }],
    priority: (order.priority.toLowerCase() === 'stat' ? 'stat' : (order.priority.toLowerCase() === 'urgent' ? 'urgent' : 'routine')) as any,
    status: (order.status === 'IN_PROGRESS' ? 'processing' : order.status.toLowerCase()) as any,
    ordered_at: order.createdAt,
    completed_at: order.result?.completedAt,
    notes: order.notes || undefined
  }));

  const pendingTests = labOrders.filter((t) => t.status === 'ordered' || t.status === 'sample_collected').length;
  const inProgress = labOrders.filter((t) => t.status === 'processing').length;
  const completedToday = labOrders.filter((t) => t.status === 'completed').length;
  const urgentTests = labOrders.filter((t) => t.priority === 'urgent' || t.priority === 'stat').length;

  // Search filtering - get unique patients with matching tests
  const searchResults = searchQuery.trim().length > 0
    ? labOrders.filter(order =>
      order.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tests[0]?.test_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  // Get unique patients from search results
  const uniquePatients = Array.from(
    new Map(searchResults.map(order => [order.patient_id, order])).values()
  );

  // Lists for each category
  const pendingTestsList = labOrders.filter((t) => t.status === 'ordered' || t.status === 'sample_collected' || t.status === 'payment_pending');
  const inProgressList = labOrders.filter((t) => t.status === 'processing');
  const completedList = labOrders.filter((t) => t.status === 'completed');
  const urgentList = labOrders.filter((t) => t.priority === 'urgent' || t.priority === 'stat');

  // Get filtered data based on active filter
  const getFilteredData = () => {
    switch (activeFilter) {
      case 'pending':
        return pendingTestsList;
      case 'in_progress':
        return inProgressList;
      case 'completed':
        return completedList;
      case 'urgent':
        return urgentList;
      default:
        return labOrders.filter(t => t.status !== 'completed');
    }
  };

  const filteredData = getFilteredData();

  // Get filter title
  const getFilterTitle = () => {
    switch (activeFilter) {
      case 'pending':
        return 'Pending Tests';
      case 'in_progress':
        return 'In Progress Tests';
      case 'completed':
        return 'Completed Tests';
      case 'urgent':
        return 'Urgent Tests';
      default:
        return 'Test Queue';
    }
  };

  const handleCollectSample = (test: typeof labOrders[0]) => {
    toast.success("Sample Collection Started", {
      description: `Navigating to sample collection for ${test.patient_name}`,
    });
    navigate('/lab/sample-collection');
  };

  const handleProcessNow = (test: typeof labOrders[0]) => {
    setProcessedTests([...processedTests, test.id]);
    toast.success("Processing Started", {
      description: `Urgent test for ${test.patient_name} is now being processed`,
    });
  };

  const pendingTestColumns = [
    {
      key: 'patient_name',
      header: 'Patient',
      render: (test: typeof labOrders[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {test.patient_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{test.patient_name}</p>
            <p className="text-xs text-muted-foreground">ID: {test.patient_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'test_name',
      header: 'Test',
      render: (test: typeof labOrders[0]) => (
        <span>{test.tests[0]?.test_name || 'Multiple Tests'}</span>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (test: typeof labOrders[0]) => (
        <Badge variant={test.priority === 'urgent' ? 'destructive' : 'secondary'}>
          {test.priority}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (test: typeof labOrders[0]) => (
        <StatusBadge status={test.status} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (test: typeof labOrders[0]) => (
        <div className="flex gap-2">
          {test.status === 'sample_collected' && (
            <Button variant="outline" size="sm" onClick={() => handleCollectSample(test)}>Collect Sample</Button>
          )}
          {test.status === 'processing' && (
            <LabResultEntryDialog testId={test.id}>
              <Button variant="outline" size="sm">Enter Results</Button>
            </LabResultEntryDialog>
          )}
          {test.status === 'completed' && (
            <LabResultDetailsDialog orderId={test.id}>
              <Button variant="ghost" size="sm">View</Button>
            </LabResultDetailsDialog>
          )}
        </div>
      )
    }
  ];

  const recentResultsColumns = [
    { key: 'patient_name', header: 'Patient' },
    {
      key: 'test_name',
      header: 'Test',
      render: (test: typeof labOrders[0]) => (
        <span>{test.tests[0]?.test_name || 'Test'}</span>
      )
    },
    { key: 'doctor_name', header: 'Ordered By' },
    {
      key: 'completed_at',
      header: 'Completed',
      render: (test: typeof labOrders[0]) => (
        <span className="text-muted-foreground">
          {test.completed_at ? format(new Date(test.completed_at), 'MMM d, h:mm a') : '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (test: typeof labOrders[0]) => (
        <StatusBadge status={test.status} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (test: typeof labOrders[0]) => (
        <LabResultDetailsDialog orderId={test.id}>
          <Button variant="ghost" size="sm">View</Button>
        </LabResultDetailsDialog>
      )
    },
  ];

  const activeUrgentTests = labOrders.filter(t => (t.priority === 'urgent' || t.priority === 'stat') && !processedTests.includes(t.id));

  if (loading) {
    return (
      <DashboardLayout role="lab_technician">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lab_technician">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/lab/test-catalog">
                <Beaker className="h-4 w-4 mr-2" />
                Test Catalog
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/lab/results-entry">
                <FileText className="h-4 w-4 mr-2" />
                Enter Results
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Search */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search tests by patient name, test ID, or sample ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />

                {/* Search Results Dropdown */}
                {showSearchResults && uniquePatients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      Found {uniquePatients.length} patient(s) with {searchResults.length} test(s)
                    </div>
                    {uniquePatients.map((patient) => {
                      const patientTests = searchResults.filter(t => t.patient_id === patient.patient_id);
                      return (
                        <div
                          key={patient.patient_id}
                          className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSearchQuery(patient.patient_name);
                            setShowSearchResults(false);
                            navigate('/lab/pending-tests');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {patient.patient_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{patient.patient_name}</p>
                              <p className="text-xs text-muted-foreground">ID: {patient.patient_id}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {patientTests.length} test(s)
                            </Badge>
                          </div>
                          <div className="mt-2 ml-11 flex flex-wrap gap-1">
                            {patientTests.slice(0, 3).map((test, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {test.tests[0]?.test_name}
                              </Badge>
                            ))}
                            {patientTests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{patientTests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No Results Message */}
                {showSearchResults && searchQuery.trim().length > 0 && uniquePatients.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
                    No patients or tests found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Pending Tests"
            value={pendingTests}
            icon={<Clock className="h-5 w-5" />}
            description="Awaiting sample collection"
            variant="primary"
            onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
            className={activeFilter === 'pending' ? 'ring-2 ring-primary ring-offset-2' : ''}
          />
          <StatsCard
            title="In Progress"
            value={inProgress}
            icon={<FlaskConical className="h-5 w-5" />}
            description="Currently processing"
            variant="warning"
            onClick={() => setActiveFilter(activeFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={activeFilter === 'in_progress' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}
          />
          <StatsCard
            title="Completed Today"
            value={completedToday}
            icon={<CheckCircle className="h-5 w-5" />}
            description="Results published"
            variant="success"
            onClick={() => setActiveFilter(activeFilter === 'completed' ? 'all' : 'completed')}
            className={activeFilter === 'completed' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
          />
          <StatsCard
            title="Urgent Tests"
            value={urgentTests}
            icon={<AlertTriangle className="h-5 w-5" />}
            description="Priority processing"
            variant="destructive"
            onClick={() => setActiveFilter(activeFilter === 'urgent' ? 'all' : 'urgent')}
            className={activeFilter === 'urgent' ? 'ring-2 ring-red-500 ring-offset-2' : ''}
          />
        </div>

        {/* Filtered Tests Queue */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {activeFilter === 'urgent' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                {activeFilter === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {activeFilter === 'in_progress' && <FlaskConical className="h-5 w-5 text-yellow-600" />}
                {(activeFilter === 'pending' || activeFilter === 'all') && <Clock className="h-5 w-5 text-primary" />}
                {getFilterTitle()}
                {activeFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredData.length} result(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {activeFilter === 'all' && 'Tests pending sample collection and processing'}
                {activeFilter === 'pending' && 'Tests awaiting sample collection'}
                {activeFilter === 'in_progress' && 'Tests currently being processed'}
                {activeFilter === 'completed' && 'Tests completed with results published'}
                {activeFilter === 'urgent' && 'High priority tests requiring immediate attention'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {activeFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                >
                  Clear Filter
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/lab/pending-tests">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredData.slice(0, 10)}
              columns={activeFilter === 'completed' ? recentResultsColumns : pendingTestColumns}
              emptyMessage={`No ${activeFilter === 'all' ? 'pending' : activeFilter.replace('_', ' ')} tests`}
            />
          </CardContent>
        </Card>

        {/* Test Categories & Recent Results */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Test Categories */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Test Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link
                to="/lab/test-catalog"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <Beaker className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Blood Tests</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to="/lab/test-catalog"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <FlaskConical className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Urine Analysis</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to="/lab/test-catalog"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Imaging</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to="/lab/test-catalog"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <Microscope className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Microbiology</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to="/lab/test-catalog"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <Dna className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Pathology</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link to="/lab/pending-tests">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  View Pending Queue
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link to="/lab/sample-collection">
                  <Beaker className="h-4 w-4 text-blue-600" />
                  Collect Samples
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link to="/lab/results-entry">
                  <FileText className="h-4 w-4 text-green-600" />
                  Enter Test Results
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="lg:col-span-1 glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Results</CardTitle>
                <CardDescription>Recently completed tests</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/lab/results-entry">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={labOrders.filter(t => t.status === 'completed').slice(0, 4)}
                columns={recentResultsColumns}
                emptyMessage="No completed tests"
              />
            </CardContent>
          </Card>
        </div>

        {/* Urgent Tests Alert */}
        {activeUrgentTests.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Urgent Tests Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeUrgentTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <div>
                        <p className="font-medium">{test.patient_name}</p>
                        <p className="text-sm text-muted-foreground">{test.tests[0]?.test_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={test.status} />
                      <Button variant="destructive" size="sm" onClick={() => handleProcessNow(test)}>Process Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

