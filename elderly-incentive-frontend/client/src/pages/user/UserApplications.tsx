import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import UserLayout from '@/components/UserLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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
import { Label } from '@/components/ui/label';
import { userAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import PaymentDetailsModal from '@/components/PaymentDetailsModal';
import { format } from 'date-fns';
import {
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FilePlus,
  TrendingUp,
} from 'lucide-react';

interface Application {
  id: number;
  submission_date: string;
  status: string;
  ml_prediction: string;
  payment_status: string;
  amount: number | null;
}

interface ApplicationDetail {
  id: number;
  age: number;
  income: number;
  employment_status: string;
  housing_status: string;
  health_status: string;
  disability: string;
  chronic_illness: string;
  caregiver: string;
  family_support: string;
  healthcare_access: string;
  national_id: string;
  location: string;
  submission_date: string;
  status: string;
  ml_prediction: string;
  ml_probability: number;
  ml_confidence: string;
  payment: {
    transaction_id: string;
    amount: number;
    payment_date: string;
    status: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    bank_abbreviation?: string;
  } | null;
}

// ── helpers ────────────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const eligibilityStyles: Record<string, string> = {
  Eligible: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Not Eligible': 'bg-red-50 text-red-700 border border-red-200',
};

const getStatusStyle = (status: string) =>
  statusStyles[status.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border border-slate-200';

const getEligibilityStyle = (prediction: string) =>
  eligibilityStyles[prediction] ?? 'bg-slate-100 text-slate-600 border border-slate-200';

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved': return <CheckCircle size={13} />;
    case 'rejected': return <XCircle size={13} />;
    default: return <Clock size={13} />;
  }
};

const EMPTY_FORM = {
  age: '',
  income: '',
  employment_status: '',
  housing_status: '',
  health_status: '',
  disability: '',
  chronic_illness: '',
  caregiver: '',
  family_support: '',
  healthcare_access: '',
  national_id: '',
  location: '',
};

const FORM_FIELDS = [
  { label: 'Employment status *', key: 'employment_status', options: ['Employed', 'Unemployed'] },
  { label: 'Housing status *', key: 'housing_status', options: ['Owned', 'Rented', 'Homeless'] },
  { label: 'Health status *', key: 'health_status', options: ['Good', 'Fair', 'Poor'] },
  { label: 'Disability *', key: 'disability', options: ['Yes', 'No'] },
  { label: 'Chronic illness *', key: 'chronic_illness', options: ['Yes', 'No'] },
  { label: 'Has caregiver *', key: 'caregiver', options: ['Yes', 'No'] },
  { label: 'Family support *', key: 'family_support', options: ['Low', 'Medium', 'High'] },
  { label: 'Healthcare access *', key: 'healthcare_access', options: ['Easy', 'Difficult'] },
  { label: 'Has national ID *', key: 'national_id', options: ['Yes', 'No'] },
  { label: 'Location *', key: 'location', options: ['Urban', 'Rural'] },
] as { label: string; key: keyof typeof EMPTY_FORM; options: string[] }[];

// ── component ──────────────────────────────────────────────────────────────────

export default function UserApplications() {
  const { isAuthenticated, isLoading: authLoading, user, refreshUser } = useUserAuth();
  const [, setLocation] = useLocation();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [claimAppId, setClaimAppId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Payment details modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingClaimAppId, setPendingClaimAppId] = useState<number | null>(null);
  const [paymentPrefill, setPaymentPrefill] = useState<{ account_name?: string; account_number?: string; bank_id?: number }>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/user/login');
      return;
    }
    if (!authLoading) fetchApplications();
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (user) {
      setPaymentPrefill({
        account_name: (user as any).account_name || '',
        account_number: (user as any).account_number || '',
        bank_id: (user as any).bank_id || undefined,
      });
    }
  }, [user]);

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

  const handleSubmitApplication = async () => {
    if (!formData.age || !formData.income || !formData.employment_status) {
      showErrorToast({ message: 'Please fill in all required fields' });
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await userAPI.submitApplication({
        ...formData,
        age: parseInt(formData.age),
        income: parseFloat(formData.income),
      });
      setResultData({
        application_id: response.data.application_id,
        ml_prediction: response.data.ml_prediction,
        probability: response.data.probability,
        confidence: response.data.confidence,
      });
      setIsResultDialogOpen(true);
      setIsNewAppDialogOpen(false);
      setFormData(EMPTY_FORM);
      fetchApplications();
      showSuccessToast('Application submitted successfully!');
    } catch (error: any) {
      if (error.response?.data?.profile_incomplete) {
        setIsNewAppDialogOpen(false);
        showErrorToast({ message: 'Please complete your profile before applying. Go to My Profile.' });
      } else {
        showErrorToast(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimIncentive = async () => {
    if (!resultData?.application_id) return;
    // Route through payment modal
    setPendingClaimAppId(resultData.application_id);
    setIsPaymentModalOpen(true);
  };

  const handleClaimFromTable = async () => {
    if (!claimAppId) return;
    // Route through payment modal
    setIsClaimDialogOpen(false);
    setPendingClaimAppId(claimAppId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentDetailsSaved = async (_details: any) => {
    if (!pendingClaimAppId) return;
    try {
      setIsClaiming(true);
      await userAPI.claimIncentive(pendingClaimAppId);
      showSuccessToast('Incentive claimed successfully!');
      setIsResultDialogOpen(false);
      setResultData(null);
      setPendingClaimAppId(null);
      setClaimAppId(null);
      fetchApplications();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleViewDetails = async (app: Application) => {
    try {
      const response = await userAPI.getSingleApplication(app.id);
      setSelectedApp(response.data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      showErrorToast(error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <UserLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
            <p className="text-sm text-slate-500 mt-1">
              {applications.length > 0
                ? `You have ${applications.length} application${applications.length > 1 ? 's' : ''} on record`
                : 'Submit an application to get started'}
            </p>
          </div>
          <Button
            onClick={() => setIsNewAppDialogOpen(true)}
            size="sm"
            className="h-9 self-start sm:self-auto bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white border-0 shadow-none flex items-center gap-2"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New application</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Table Card */}
        <Card className="shadow-none overflow-hidden p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-56">
              <Spinner />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No applications yet</p>
              <p className="text-xs text-slate-500 mb-4">Submit your first application to get started</p>
              <Button
                onClick={() => setIsNewAppDialogOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0 h-9 text-sm"
              >
                <FilePlus size={15} className="mr-2" />
                Submit application
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['ID', 'Submitted', 'Eligibility', 'Status', 'Payment', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${
                          i === 5 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr
                      key={app.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        idx === applications.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">#{app.id}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {format(new Date(app.submission_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${getEligibilityStyle(app.ml_prediction)}`}>
                          {app.ml_prediction}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusStyle(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                        {app.amount
                          ? `₦${app.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {app.ml_prediction === 'Eligible' && !app.amount && (
                            <Button
                              size="sm"
                              onClick={() => { setClaimAppId(app.id); setIsClaimDialogOpen(true); }}
                              className="h-7 px-2.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-none flex items-center gap-1"
                            >
                              <Zap size={12} />
                              Claim
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(app)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          >
                            <Eye size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── New Application Modal ── */}
      <Dialog open={isNewAppDialogOpen} onOpenChange={setIsNewAppDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>New application</DialogTitle>
            <DialogDescription>
              Fill in your information to apply for the elderly incentive program
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Age *</Label>
                <Input
                  type="number"
                  min="60"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="60+"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monthly income (₦) *</Label>
                <Input
                  type="number"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {FORM_FIELDS.reduce<JSX.Element[]>((rows, field, i, arr) => {
              if (i % 2 === 0) {
                const next = arr[i + 1];
                rows.push(
                  <div key={field.key} className="grid grid-cols-2 gap-4">
                    {[field, next].filter(Boolean).map((f) => f && (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{f.label}</Label>
                        <Select
                          value={formData[f.key]}
                          onValueChange={(v) => setFormData({ ...formData, [f.key]: v })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                );
              }
              return rows;
            }, [])}
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setIsNewAppDialogOpen(false)} className="h-9 w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="h-9 w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting...
                </>
              ) : 'Submit application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Result Modal ── */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Application result</DialogTitle>
          </DialogHeader>

          {resultData && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                {resultData.ml_prediction === 'Eligible' ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={36} className="text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-700 mb-1">Congratulations!</h3>
                    <p className="text-sm text-slate-500">You are eligible for the incentive program</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <XCircle size={36} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-red-700 mb-1">Not eligible</h3>
                    <p className="text-sm text-slate-500">Unfortunately you do not qualify at this time</p>
                  </>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                {[
                  { label: 'Prediction', value: resultData.ml_prediction },
                  { label: 'Confidence', value: resultData.confidence },
                  ...(resultData.probability !== null
                    ? [{ label: 'Probability', value: `${(resultData.probability * 100).toFixed(1)}%` }]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setIsResultDialogOpen(false)} className="h-9 w-full sm:w-auto">
              Close
            </Button>
            {resultData?.ml_prediction === 'Eligible' && (
              <Button
                size="sm"
                onClick={handleClaimIncentive}
                disabled={isClaiming}
                className="h-9 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <><Zap size={15} />Claim incentive</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Claim Modal ── */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Claim incentive</DialogTitle>
            <DialogDescription>
              Are you sure you want to claim the incentive for application #{claimAppId}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsClaimDialogOpen(false); setClaimAppId(null); }}
              className="h-9 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleClaimFromTable}
              disabled={isClaiming}
              className="h-9 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 flex items-center justify-center gap-2"
            >
              {isClaiming ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <><Zap size={15} />Confirm claim</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Application Detail Modal ── */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Application #{selectedApp?.id}</DialogTitle>
            <DialogDescription>
              Submitted {selectedApp ? format(new Date(selectedApp.submission_date), 'MMM d, yyyy · HH:mm') : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5 py-2">

              {/* Status row */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getEligibilityStyle(selectedApp.ml_prediction)}`}>
                  {selectedApp.ml_prediction === 'Eligible'
                    ? <CheckCircle size={12} />
                    : <XCircle size={12} />}
                  {selectedApp.ml_prediction}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusStyle(selectedApp.status)}`}>
                  {getStatusIcon(selectedApp.status)}
                  {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                </span>
              </div>

              {/* Personal info grid */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Personal information</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: 'Age', value: `${selectedApp.age} years` },
                    { label: 'Monthly income', value: `₦${selectedApp.income.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
                    { label: 'Employment', value: selectedApp.employment_status },
                    { label: 'Housing', value: selectedApp.housing_status },
                    { label: 'Health', value: selectedApp.health_status },
                    { label: 'Disability', value: selectedApp.disability },
                    { label: 'Chronic illness', value: selectedApp.chronic_illness },
                    { label: 'Has caregiver', value: selectedApp.caregiver },
                    { label: 'Family support', value: selectedApp.family_support },
                    { label: 'Healthcare access', value: selectedApp.healthcare_access },
                    { label: 'National ID', value: selectedApp.national_id },
                    { label: 'Location', value: selectedApp.location },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ML result */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Assessment result</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  {[
                    { label: 'Prediction', value: selectedApp.ml_prediction },
                    { label: 'Confidence', value: selectedApp.ml_confidence },
                    ...(selectedApp.ml_probability !== null
                      ? [{ label: 'Probability', value: `${(selectedApp.ml_probability * 100).toFixed(1)}%` }]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment info */}
              {selectedApp.payment && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment received</p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    {[
                      { label: 'Amount', value: `₦${selectedApp.payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
                      { label: 'Transaction ID', value: selectedApp.payment.transaction_id },
                      { label: 'Date', value: format(new Date(selectedApp.payment.payment_date), 'MMM d, yyyy · HH:mm') },
                      { label: 'Status', value: selectedApp.payment.status },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-emerald-700">{label}</span>
                        <span className="font-medium text-emerald-900 text-right max-w-[60%] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account info used for payment */}
              {selectedApp.payment && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Account information</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    {[
                      { label: 'Account name', value: selectedApp.payment.account_name || '—' },
                      { label: 'Account number', value: selectedApp.payment.account_number || '—' },
                      { label: 'Bank', value: selectedApp.payment.bank_name || '—' },
                      { label: 'Bank code', value: selectedApp.payment.bank_abbreviation || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">{label}</span>
                        <span className="font-medium text-blue-900 text-right max-w-[60%] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsDetailDialogOpen(false)} className="h-9">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        prefill={paymentPrefill}
        onSaved={handlePaymentDetailsSaved}
      />
    </UserLayout>
  );
}