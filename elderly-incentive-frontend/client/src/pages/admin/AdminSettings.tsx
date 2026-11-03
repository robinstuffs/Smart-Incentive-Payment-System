import React, { useEffect, useState } from 'react';
import { adminAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Save } from 'lucide-react';

/**
 * Admin System Settings Page
 * Design: Modern Civic Dashboard
 * - Configure system-wide settings
 * - Max applications per user
 * - Incentive amount
 * - Enable/disable application period
 * - Real-time form validation and updates
 */

interface Settings {
  max_applications_per_user?: string;
  incentive_amount?: string;
  application_period_enabled?: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Settings>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getSettings();
      setSettings(response.data);
      setFormData(response.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await adminAPI.updateSettings(formData);
      showSuccessToast('Settings updated successfully');
      setSettings(formData);
      setHasChanges(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
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

  const isApplicationPeriodEnabled = formData.application_period_enabled === 'True' || formData.application_period_enabled === 'true';

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6 max-w-2xl">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">System Settings</h1>
            <p className="text-slate-600">Configure system-wide parameters and policies</p>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Max Applications Per User */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Maximum Applications Per User
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Limit the number of applications each user can submit
                  </p>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Applications
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_applications_per_user || ''}
                      onChange={(e) => handleInputChange('max_applications_per_user', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-slate-600">
                    Current: {settings.max_applications_per_user || '—'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Incentive Amount */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Incentive Amount</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Set the default incentive amount for eligible applicants
                  </p>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Amount (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">₦</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.incentive_amount || ''}
                        onChange={(e) => handleInputChange('incentive_amount', e.target.value)}
                        className="w-full pl-7"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Current: ₦{settings.incentive_amount || '—'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Application Period */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Application Period</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Enable or disable the application submission period
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">
                      {isApplicationPeriodEnabled ? 'Applications Open' : 'Applications Closed'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {isApplicationPeriodEnabled
                        ? 'Users can submit new applications'
                        : 'Users cannot submit new applications'}
                    </p>
                  </div>
                  <Switch
                    checked={isApplicationPeriodEnabled}
                    onCheckedChange={(checked) =>
                      handleInputChange('application_period_enabled', checked ? 'True' : 'False')
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Info Alert */}
            <Card className="p-4 bg-cyan-50 border-cyan-200">
              <div className="flex gap-3">
                <AlertCircle className="text-cyan-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-cyan-900">Settings Information</p>
                  <p className="text-sm text-cyan-800 mt-1">
                    Changes to these settings will take effect immediately and apply to all new applications.
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold flex items-center gap-2"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
              {hasChanges && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
