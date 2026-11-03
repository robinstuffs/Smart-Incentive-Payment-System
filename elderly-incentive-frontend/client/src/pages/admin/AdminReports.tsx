import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileSpreadsheet,
  Users,
  MapPin,
  Building2,
  BarChart3,
  CalendarDays,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportMeta {
  earliest_year: number;
  latest_year: number;
  total_participants: number;
  total_payments: number;
  total_disbursed: number;
}

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  borderColor: string;
  badge: string;
  params?: 'month-year' | 'year-only' | 'year-optional' | 'none';
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'eligible-participants',
    title: 'Monthly Eligible Participants',
    description:
      'Full list of approved beneficiaries for a specific month — includes name, transaction ID, bank account, constituency (LGA), state, city and age.',
    icon: Users,
    color: 'text-cyan-700',
    borderColor: 'border-t-cyan-500',
    badge: 'Monthly',
    params: 'month-year',
  },
  {
    id: 'monthly-expenditure',
    title: 'Monthly Expenditure by LGA',
    description:
      'Total amount disbursed per LGA and state for a given month, with beneficiary counts and percentage share.',
    icon: MapPin,
    color: 'text-teal-700',
    borderColor: 'border-t-teal-500',
    badge: 'Monthly',
    params: 'month-year',
  },
  {
    id: 'yearly-expenditure',
    title: 'Yearly Expenditure (All Months)',
    description:
      'Multi-sheet workbook — an annual summary sheet plus one sheet per month, all showing LGA-level spending breakdown.',
    icon: CalendarDays,
    color: 'text-blue-700',
    borderColor: 'border-t-blue-500',
    badge: 'Yearly',
    params: 'year-only',
  },
  {
    id: 'participants-master',
    title: 'Participants Master List',
    description:
      'Complete registry of all registered participants with profile, payment bank, state, LGA, city and registration date. For audit and reference.',
    icon: ClipboardList,
    color: 'text-indigo-700',
    borderColor: 'border-t-indigo-500',
    badge: 'Full Data',
    params: 'none',
  },
  {
    id: 'application-summary',
    title: 'Application Status Summary',
    description:
      'Pivot of pending, approved and rejected applications grouped by state and LGA. Optional year filter. Colour-coded for quick review.',
    icon: BarChart3,
    color: 'text-violet-700',
    borderColor: 'border-t-violet-500',
    badge: 'Summary',
    params: 'year-optional',
  },
  {
    id: 'bank-distribution',
    title: 'Bank Distribution Report',
    description:
      'How many participants are registered with each bank and total amounts disbursed through each bank to date.',
    icon: Building2,
    color: 'text-amber-700',
    borderColor: 'border-t-amber-500',
    badge: 'Full Data',
    params: 'none',
  },
  {
    id: 'age-demographics',
    title: 'Age Demographics Report',
    description:
      'Applicants broken down by age bracket (Under 60, 60–64, 65–69, 70–74, 75–79, 80+) per state with approval outcomes.',
    icon: TrendingUp,
    color: 'text-rose-700',
    borderColor: 'border-t-rose-500',
    badge: 'Analytics',
    params: 'none',
  },
];

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminReports() {
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Per-card selections
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selections, setSelections] = useState<
    Record<string, { year: string; month: string }>
  >(() =>
    Object.fromEntries(
      REPORT_CARDS.map((c) => [
        c.id,
        {
          year: c.params === 'year-optional' ? 'all' : String(currentYear),
          month: String(currentMonth),
        },
      ])
    )
  );

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      setIsMetaLoading(true);
      const res = await adminAPI.getReportMeta();
      setMeta(res.data);
    } catch {
      // non-fatal – summary cards just won't show
    } finally {
      setIsMetaLoading(false);
    }
  };

  const buildYearOptions = () => {
    if (!meta) return [String(currentYear)];
    const years: string[] = [];
    for (let y = meta.latest_year; y >= meta.earliest_year; y--) {
      years.push(String(y));
    }
    return years;
  };

  const updateSelection = (
    id: string,
    field: 'year' | 'month',
    value: string
  ) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleDownload = async (report: ReportCard) => {
    const sel = selections[report.id];
    let params = new URLSearchParams();

    if (report.params === 'month-year') {
      params.set('year', sel.year);
      params.set('month', sel.month);
    } else if (report.params === 'year-only') {
      params.set('year', sel.year);
    } else if (report.params === 'year-optional') {
      if (sel.year && sel.year !== 'all') params.set('year', sel.year);
    }

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('user_access_token');
    const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    const url = `${BASE}/admin/reports/${report.id}?${params.toString()}`;

    try {
      setDownloading(report.id);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const nameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = nameMatch ? nameMatch[1] : `${report.id}.xlsx`;

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      toast.success(`${report.title} downloaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(v);

  const yearOptions = buildYearOptions();

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileSpreadsheet className="text-cyan-600" size={26} />
              Reports &amp; Data Exports
            </h1>
            <p className="text-sm text-slate-500">
              Generate and download structured spreadsheets for auditing,
              reporting and analysis.
            </p>
          </div>

          {/* Summary Stats */}
          {isMetaLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
              <Spinner />
              <span>Loading statistics…</span>
            </div>
          ) : meta ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 shadow-none border-t-2 border-t-cyan-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Participants
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {meta.total_participants.toLocaleString()}
                </p>
              </Card>
              <Card className="p-5 shadow-none border-t-2 border-t-teal-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Payments
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {meta.total_payments.toLocaleString()}
                </p>
              </Card>
              <Card className="p-5 shadow-none border-t-2 border-t-blue-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Disbursed
                </p>
                <p className="text-2xl font-bold text-teal-700">
                  {formatCurrency(meta.total_disbursed)}
                </p>
              </Card>
            </div>
          ) : null}

          {/* Report Grid */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Available Reports
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {REPORT_CARDS.map((report) => {
                const Icon = report.icon;
                const sel = selections[report.id];
                const isDownloading = downloading === report.id;

                return (
                  <Card
                    key={report.id}
                    className={`p-5 shadow-none border-t-2 ${report.borderColor} flex flex-col gap-4`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 ${report.color} flex-shrink-0`}
                        >
                          <Icon size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 text-[15px]">
                              {report.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0 h-5"
                            >
                              {report.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Parameter Selectors */}
                    {report.params !== 'none' && (
                      <div className="flex flex-wrap gap-3 items-end">
                        {/* Year selector */}
                        {(report.params === 'month-year' ||
                          report.params === 'year-only' ||
                          report.params === 'year-optional') && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-600">
                              Year
                              {report.params === 'year-optional' && (
                                <span className="ml-1 text-slate-400 font-normal">
                                  (optional)
                                </span>
                              )}
                            </label>
                            <Select
                              value={sel.year}
                              onValueChange={(v) =>
                                updateSelection(report.id, 'year', v)
                              }
                            >
                              <SelectTrigger className="w-28 h-9 text-sm">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {report.params === 'year-optional' && (
                                  <SelectItem value="all">All Years</SelectItem>
                                )}
                                {yearOptions.map((y) => (
                                  <SelectItem key={y} value={y}>
                                    {y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Month selector */}
                        {report.params === 'month-year' && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-600">
                              Month
                            </label>
                            <Select
                              value={sel.month}
                              onValueChange={(v) =>
                                updateSelection(report.id, 'month', v)
                              }
                            >
                              <SelectTrigger className="w-36 h-9 text-sm">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download Button */}
                    <div className="mt-auto pt-1">
                      <Button
                        onClick={() => handleDownload(report)}
                        disabled={isDownloading}
                        className="w-full sm:w-auto gap-2 bg-slate-800 hover:bg-slate-900 text-white"
                        size="sm"
                      >
                        {isDownloading ? (
                          <>
                            <Spinner />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Download size={15} />
                            Download Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Info Banner */}
          <Card className="p-4 shadow-none bg-slate-50 border-slate-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500 leading-relaxed">
              All reports are generated in real time from the live database and
              downloaded as <strong>.xlsx</strong> files compatible with Microsoft
              Excel, LibreOffice Calc and Google Sheets. Reports only include
              data for <strong>approved</strong> applications unless otherwise
              noted.
            </p>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}