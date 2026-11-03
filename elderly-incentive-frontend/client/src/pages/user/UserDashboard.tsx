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
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  FileText,
  Wallet,
  FilePlus,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  total_applications: number;
  eligible_count: number;
  pending_count: number;
  total_payments: number;
}

interface Application {
  id: number;
  submission_date: string;
  status: string;
  ml_prediction: string;
  payment_status: string;
  amount: number | null;
}

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

export default function UserDashboard() {
  const { isAuthenticated, isLoading: authLoading, user, refreshUser } = useUserAuth();
  const [, setLocation] = useLocation();

  const [stats, setStats] = useState<DashboardStats>({
    total_applications: 0,
    eligible_count: 0,
    pending_count: 0,
    total_payments: 0,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Payment details modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingClaimAppId, setPendingClaimAppId] = useState<number | null>(null);
  // Cached user payment details (updated after saving)
  const [paymentPrefill, setPaymentPrefill] = useState<{
    account_name?: string;
    account_number?: string;
    bank_id?: number;
  }>({});

  // Profile incomplete modal
  const [isProfileIncompleteOpen, setIsProfileIncompleteOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/user/login');
      return;
    }
    if (!authLoading) fetchDashboardData();
  }, [authLoading, isAuthenticated]);

  // Sync payment prefill from user context
  useEffect(() => {
    if (user) {
      setPaymentPrefill({
        account_name: (user as any).account_name || '',
        account_number: (user as any).account_number || '',
        bank_id: (user as any).bank_id || undefined,
      });
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const appsRes = await userAPI.getApplications();
      const apps: Application[] = appsRes.data;

      const totalApplications = apps.length;
      const eligibleCount = apps.filter((a) => a.ml_prediction === 'Eligible').length;
      const pendingCount = apps.filter((a) => a.status === 'pending').length;
      const totalPayments = apps.reduce((sum, a) => sum + (a.amount ?? 0), 0);

      setStats({ total_applications: totalApplications, eligible_count: eligibleCount, pending_count: pendingCount, total_payments: totalPayments });
      setRecentApplications(apps.slice(0, 5));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewApplicationClick = () => {
    // Check profile completeness from user context
    if (user && !(user as any).is_profile_complete) {
      setIsProfileIncompleteOpen(true);
      return;
    }
    setIsNewAppDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!formData.age || !formData.income || !formData.employment_status) {
      showErrorToast({ message: 'Please fill in all required fields' });
      return;
    }
    try {
      setIsSubmitting(true);
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        income: parseFloat(formData.income),
      };
      const response = await userAPI.submitApplication(submitData);
      setResultData({
        application_id: response.data.application_id,
        ml_prediction: response.data.ml_prediction,
        probability: response.data.probability,
        confidence: response.data.confidence,
      });
      setIsResultDialogOpen(true);
      setIsNewAppDialogOpen(false);
      setFormData(EMPTY_FORM);
      fetchDashboardData();
      showSuccessToast('Application submitted successfully!');
    } catch (error: any) {
      if (error.response?.data?.profile_incomplete) {
        setIsNewAppDialogOpen(false);
        setIsProfileIncompleteOpen(true);
      } else {
        showErrorToast(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimClick = (applicationId?: number) => {
    const appId = applicationId ?? resultData?.application_id;
    if (!appId) return;
    // Open payment details modal first
    setPendingClaimAppId(appId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentDetailsSaved = async (details: any) => {
    // Payment details saved, now proceed to claim
    setPaymentPrefill({ account_name: details.account_name, account_number: details.account_number, bank_id: details.bank_id });
    await refreshUser();
    if (pendingClaimAppId) {
      await doClaim(pendingClaimAppId);
    }
  };

  const doClaim = async (appId: number) => {
    try {
      setIsClaiming(true);
      await userAPI.claimIncentive(appId);
      showSuccessToast('Incentive claimed successfully!');
      setIsResultDialogOpen(false);
      setResultData(null);
      setPendingClaimAppId(null);
      fetchDashboardData();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsClaiming(false);
    }
  };

  const firstName = user?.firstname || user?.username || 'there';
  const isProfileComplete = (user as any)?.is_profile_complete !== false;

  const statCards = [
    {
      label: 'Total applications',
      value: stats.total_applications,
      icon: FileText,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      accent: 'border-t-2 border-t-cyan-500',
      sub: 'All time',
    },
    {
      label: 'Eligible',
      value: stats.eligible_count,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-t-2 border-t-emerald-500',
      sub:
        stats.total_applications > 0
          ? `${Math.round((stats.eligible_count / stats.total_applications) * 100)}% rate`
          : '0% rate',
    },
    {
      label: 'Pending review',
      value: stats.pending_count,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accent: 'border-t-2 border-t-amber-500',
      sub: 'Awaiting result',
    },
    {
      label: 'Total received',
      value: `₦${stats.total_payments.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      accent: 'border-t-2 border-t-teal-500',
      sub: 'Claimed payments',
    },
  ];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <UserLayout>
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-slate-500">
              Here's a summary of your incentive program applications
            </p>
          </div>
          <p className="text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1.5 whitespace-nowrap self-start sm:self-auto flex-shrink-0">
            {format(new Date(), 'EEE, d MMM yyyy')}
          </p>
        </div>

        {/* Profile Incomplete Warning */}
        {!isLoading && !isProfileComplete && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 mb-0.5">Complete your profile</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your profile is incomplete. You must complete your profile before you can apply for the incentive program.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setLocation('/user/profile')}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0 flex items-center gap-1.5 flex-shrink-0"
            >
              Complete profile
              <ArrowRight size={13} />
            </Button>
          </div>
        )}

        {/* Stat Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className={`p-4 shadow-none ${card.accent}`}>
                  <div className="mb-3">
                    <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                      <Icon size={18} className={card.iconColor} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{card.value}</p>
                  <p className="text-xs text-slate-500 mb-2">{card.label}</p>
                  <p className="text-[11px] text-slate-400">{card.sub}</p>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent applications</h2>
              <p className="text-xs text-slate-500">Your last 5 submissions</p>
            </div>
            <Button
              onClick={handleNewApplicationClick}
              size="sm"
              className="h-9 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-sm font-medium border-0 shadow-none flex items-center gap-2"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New application</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          <Card className="shadow-none overflow-hidden p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Spinner />
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-14 px-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">No applications yet</p>
                <p className="text-xs text-slate-500 mb-4">Submit your first application to get started</p>
                <Button
                  onClick={handleNewApplicationClick}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0 h-9 text-sm"
                >
                  <FilePlus size={15} className="mr-2" />
                  Submit application
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Eligibility</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app, idx) => (
                      <tr
                        key={app.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          idx === recentApplications.length - 1 ? 'border-b-0' : ''
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
                          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusStyle(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                          {app.amount
                            ? `₦${app.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                            : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Profile Incomplete Modal ── */}
      <Dialog open={isProfileIncompleteOpen} onOpenChange={setIsProfileIncompleteOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <DialogTitle>Profile Incomplete</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  You need to complete your profile first
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <p className="text-sm text-slate-600 leading-relaxed">
            Before you can apply for the incentive program, please complete all required profile fields including your address information and phone number.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsProfileIncompleteOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => { setIsProfileIncompleteOpen(false); setLocation('/user/profile'); }}
              className="h-9 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 flex items-center gap-2"
            >
              Go to profile
              <ArrowRight size={14} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {(([
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
            ] as { label: string; key: keyof typeof EMPTY_FORM; options: string[] }[])
              .reduce<JSX.Element[]>((rows, field, i, arr) => {
                if (i % 2 === 0) {
                  const next = arr[i + 1];
                  rows.push(
                    <div key={field.key} className="grid grid-cols-2 gap-4">
                      {[field, next].filter(Boolean).map(
                        (f) =>
                          f && (
                            <div key={f.key} className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                {f.label}
                              </Label>
                              <Select
                                value={formData[f.key]}
                                onValueChange={(v) => setFormData({ ...formData, [f.key]: v })}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {f.options.map((o) => (
                                    <SelectItem key={o} value={o}>
                                      {o}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                      )}
                    </div>
                  );
                }
                return rows;
              }, []))}
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
              ) : (
                'Submit application'
              )}
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
                onClick={() => handleClaimClick()}
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
                  <>
                    <Zap size={15} />
                    Claim incentive
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payment Details Modal ── */}
      <PaymentDetailsModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        prefill={paymentPrefill}
        onSaved={handlePaymentDetailsSaved}
      />
    </UserLayout>
  );
}
