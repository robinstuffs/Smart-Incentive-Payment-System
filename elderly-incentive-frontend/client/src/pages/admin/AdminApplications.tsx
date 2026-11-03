import React, { useEffect, useState } from 'react';
import { adminAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit2, Search } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Admin Application Management Page
 * Design: Modern Civic Dashboard
 * - Table view with all applications
 * - Filter by status and eligibility
 * - View details and update status with admin notes
 * - Modal for detailed application review
 */

interface Application {
  id: number;
  user_id: number;
  username: string;
  age: number;
  income: number;
  health_condition: string;
  submission_date: string;
  status: string;
  ml_prediction: string;
  admin_notes: string | null;
  // payment details
  account_name?: string;
  account_number?: string;
  bank?: { id: number; name: string; abbreviation: string } | null;
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({ status: '', admin_notes: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, eligibilityFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
      if (eligibilityFilter && eligibilityFilter !== 'all') filters.ml_prediction = eligibilityFilter;

      const response = await adminAPI.getApplications(filters);
      setApplications(response.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateClick = (app: Application) => {
    setSelectedApp(app);
    setUpdateFormData({ status: app.status, admin_notes: app.admin_notes || '' });
    setIsDetailDialogOpen(false);
    setIsUpdateDialogOpen(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedApp) return;

    try {
      setIsUpdating(true);
      await adminAPI.updateApplicationStatus(selectedApp.id, updateFormData);
      showSuccessToast('Application updated successfully');
      setIsUpdateDialogOpen(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toString().includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getEligibilityColor = (prediction: string) => {
    return prediction === 'Eligible'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-rose-100 text-rose-800';
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Management</h1>
            <p className="text-slate-600">Review and manage all applications</p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                  placeholder="Search by username or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <Card className="p-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <Card className="p-4">
              <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by eligibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Eligible">Eligible</SelectItem>
                  <SelectItem value="Not Eligible">Not Eligible</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          </div>

          {/* Applications Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Spinner />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-200">
                      <TableHead className="text-slate-700 font-semibold">ID</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Username</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Age</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Income</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Eligibility</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Submitted</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-900">#{app.id}</TableCell>
                        <TableCell className="text-slate-600">{app.username}</TableCell>
                        <TableCell className="text-slate-600">{app.age}</TableCell>
                        <TableCell className="text-slate-600">₦{app.income.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getEligibilityColor(app.ml_prediction)}>
                            {app.ml_prediction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {format(new Date(app.submission_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(app)}>
                                <Eye size={16} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateClick(app)}>
                                <Edit2 size={16} className="mr-2" />
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Application Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>Application ID: #{selectedApp?.id}</DialogDescription>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Username</label>
                    <p className="text-slate-900 font-medium">{selectedApp.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">User ID</label>
                    <p className="text-slate-900 font-medium">{selectedApp.user_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Age</label>
                    <p className="text-slate-900 font-medium">{selectedApp.age}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Income</label>
                    <p className="text-slate-900 font-medium">₦{selectedApp.income.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Health Condition</label>
                    <p className="text-slate-900 font-medium">{selectedApp.health_condition}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Submitted</label>
                    <p className="text-slate-900 font-medium">
                      {format(new Date(selectedApp.submission_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">ML Prediction</label>
                    <Badge className={getEligibilityColor(selectedApp.ml_prediction)}>
                      {selectedApp.ml_prediction}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <Badge className={getStatusColor(selectedApp.status)}>{selectedApp.status}</Badge>
                  </div>
                </div>
                {selectedApp.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Admin Notes</label>
                    <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedApp.admin_notes}</p>
                  </div>
                )}

                {/* Payment / Account Details */}
                {(selectedApp.account_name || selectedApp.bank) && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">User Payment Details</p>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                      {selectedApp.account_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account name</span>
                          <span className="font-medium text-slate-800">{selectedApp.account_name}</span>
                        </div>
                      )}
                      {selectedApp.account_number && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account number</span>
                          <span className="font-medium text-slate-800">{selectedApp.account_number}</span>
                        </div>
                      )}
                      {selectedApp.bank && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bank</span>
                          <span className="font-medium text-slate-800">{selectedApp.bank.name} ({selectedApp.bank.abbreviation})</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => handleUpdateClick(selectedApp!)}
                className="bg-gradient-to-r from-cyan-500 to-teal-600"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Application Status</DialogTitle>
              <DialogDescription>Update status and add admin notes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <Select value={updateFormData.status} onValueChange={(value) =>
                  setUpdateFormData({ ...updateFormData, status: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                <Textarea
                  value={updateFormData.admin_notes}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, admin_notes: e.target.value })}
                  placeholder="Add notes about this application..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveUpdate}
                disabled={isUpdating}
                className="bg-gradient-to-r from-cyan-500 to-teal-600"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
