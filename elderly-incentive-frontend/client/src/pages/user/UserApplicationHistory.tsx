import React, { useEffect, useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import UserLayout from '@/components/UserLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { userAPI, showErrorToast } from '@/lib/api';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentInfo {
  transaction_id: string;
  amount: number;
  payment_date: string;
  status: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  bank_abbreviation?: string;
}

interface Application {
  id: number;
  submission_date: string;
  status: string;
  ml_prediction: string;
  payment_status: string;
  amount?: number;
  payment?: PaymentInfo;
}

export default function UserApplicationHistory() {
  const { isAuthenticated } = useUserAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/user/login');
      return;
    }
    fetchApplications();
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getApplications();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-rose-100 text-rose-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPredictionColor = (prediction: string) =>
    prediction === 'Eligible' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-96"><Spinner /></div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My Applications</h1>
          <p className="text-sm text-slate-500">View and track all your submitted applications</p>
        </div>

        {applications.length === 0 ? (
          <Card className="p-12 text-center shadow-none">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600 font-medium mb-2">No applications yet</p>
            <p className="text-slate-500 text-sm">Submit your first application from the dashboard to get started</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-5 hover:shadow-sm transition-shadow shadow-none border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-base font-semibold text-slate-900">Application #{app.id}</h3>
                      <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Submitted</p>
                        <p className="font-medium text-slate-900">{format(new Date(app.submission_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Eligibility</p>
                        <Badge className={getPredictionColor(app.ml_prediction)}>{app.ml_prediction}</Badge>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Payment</p>
                        <Badge className={getPaymentColor(app.payment_status)}>{app.payment_status}</Badge>
                      </div>
                      {app.amount && (
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Amount</p>
                          <p className="font-semibold text-slate-900">₦{app.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </div>

                    {/* Payment details row if paid */}
                    {app.payment && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                        <p><span className="font-medium">Account:</span> {app.payment.account_name} — {app.payment.account_number}</p>
                        {app.payment.bank_name && (
                          <p><span className="font-medium">Bank:</span> {app.payment.bank_name} ({app.payment.bank_abbreviation})</p>
                        )}
                        <p><span className="font-medium">Transaction ID:</span> {app.payment.transaction_id}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(app)}
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 h-8 w-8 p-0"
                  >
                    <Eye size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Application #{selectedApp?.id}</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Status', value: selectedApp.status },
                  { label: 'Eligibility', value: selectedApp.ml_prediction },
                  { label: 'Payment', value: selectedApp.payment_status },
                  ...(selectedApp.amount ? [{ label: 'Amount', value: `₦${selectedApp.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` }] : []),
                  { label: 'Submitted', value: format(new Date(selectedApp.submission_date), 'MMM d, yyyy HH:mm') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {selectedApp.payment && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Information</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account name</span>
                      <span className="font-medium text-slate-800">{selectedApp.payment.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account number</span>
                      <span className="font-medium text-slate-800">{selectedApp.payment.account_number}</span>
                    </div>
                    {selectedApp.payment.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank</span>
                        <span className="font-medium text-slate-800">{selectedApp.payment.bank_name} ({selectedApp.payment.bank_abbreviation})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-800">{format(new Date(selectedApp.payment.payment_date), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-mono text-xs text-slate-700 truncate max-w-[160px]">{selectedApp.payment.transaction_id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
