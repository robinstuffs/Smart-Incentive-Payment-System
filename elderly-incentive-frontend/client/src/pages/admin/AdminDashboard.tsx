import React, { useEffect, useState } from 'react';
import { adminAPI, showErrorToast } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, FileText, CheckCircle, XCircle, CreditCard, TrendingUp } from 'lucide-react';

/**
 * Admin Dashboard Page
 * Design: Modern Civic Dashboard
 * - Key metrics displayed as cards with icons
 * - Data visualizations using Recharts
 * - Warm color scheme reflecting care mission
 */

interface DashboardStats {
  total_users: number;
  total_applications: number;
  eligible_applications: number;
  non_eligible_applications: number;
  total_payments: number;
  total_incentive_amount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Failed to load dashboard data</p>
        </div>
      </AdminLayout>
    );
  }

  // Prepare chart data
  const applicationStatusData = [
    { name: 'Eligible', value: stats.eligible_applications, fill: '#10b981' },
    { name: 'Not Eligible', value: stats.non_eligible_applications, fill: '#f43f5e' },
  ];

  const metricsData = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Applications',
      value: stats.total_applications,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Eligible',
      value: stats.eligible_applications,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Not Eligible',
      value: stats.non_eligible_applications,
      icon: XCircle,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      label: 'Payments Processed',
      value: stats.total_payments,
      icon: CreditCard,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Total Incentives',
      value: `₦${stats.total_incentive_amount.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-cyan-500 to-teal-600',
      bgColor: 'bg-cyan-50',
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back! Here's an overview of the system.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metricsData.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{metric.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`text-${metric.color.split('-')[1]}-600`} size={24} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Status Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Application Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {applicationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} applications`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Summary Statistics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">System Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Eligibility Rate</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {stats.total_applications > 0
                      ? ((stats.eligible_applications / stats.total_applications) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Avg Incentive Amount</span>
                  <span className="text-lg font-bold text-cyan-600">
                    ₦
                    {stats.total_payments > 0
                      ? (stats.total_incentive_amount / stats.total_payments).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Applications per User</span>
                  <span className="text-lg font-bold text-purple-600">
                    {stats.total_users > 0 ? (stats.total_applications / stats.total_users).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Payment Success Rate</span>
                  <span className="text-lg font-bold text-amber-600">
                    {stats.eligible_applications > 0
                      ? ((stats.total_payments / stats.eligible_applications) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="p-6 bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">System Health</h3>
                <p className="text-slate-700">
                  The system is operating normally. All features are available and functioning as expected.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
