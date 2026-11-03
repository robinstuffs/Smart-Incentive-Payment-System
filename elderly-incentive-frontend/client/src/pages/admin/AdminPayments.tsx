import React, { useEffect, useState } from 'react';
import { adminAPI, showErrorToast } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Eye, AlertTriangle, CreditCard, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: number;
  application_id: number;
  transaction_id: string;
  amount: number;
  payment_date: string;
  status: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  bank_abbreviation?: string;
  user_id?: number;
  username?: string;
}

interface DuplicatePayment {
  application_id: number;
  payment_count: number;
  payments: Payment[];
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [duplicatePayments, setDuplicatePayments] = useState<DuplicatePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchPaymentData(); }, []);

  const fetchPaymentData = async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, duplicatesRes] = await Promise.all([
        adminAPI.getPayments(),
        adminAPI.detectDuplicatePayments(),
      ]);
      setPayments(paymentsRes.data);
      setDuplicatePayments(duplicatesRes.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'failed': return 'bg-rose-100 text-rose-800';
      case 'refunded': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Payment Monitoring</h1>
            <p className="text-sm text-slate-500">Track all payments and detect anomalies</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 shadow-none border-t-2 border-t-cyan-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-slate-900">{payments.length}</p>
            </Card>
            <Card className="p-5 shadow-none border-t-2 border-t-teal-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-teal-600">
                ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className={`p-5 shadow-none border-t-2 ${duplicatePayments.length > 0 ? 'border-t-rose-500 bg-rose-50' : 'border-t-slate-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${duplicatePayments.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>Duplicate Alerts</p>
              <p className={`text-3xl font-bold ${duplicatePayments.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{duplicatePayments.length}</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="duplicates" className="flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Duplicates {duplicatePayments.length > 0 && <span className="ml-1 bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{duplicatePayments.length}</span>}
              </TabsTrigger>
            </TabsList>

            {/* All Payments Tab */}
            <TabsContent value="all" className="mt-4">
              <Card className="overflow-hidden shadow-none p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64"><Spinner /></div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-14">
                    <CreditCard size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">App / User</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Account Details</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                          <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-mono text-xs text-slate-600">
                              {payment.transaction_id.substring(0, 12)}…
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-slate-900">#{payment.application_id}</p>
                              {payment.username && <p className="text-xs text-slate-400">@{payment.username}</p>}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-800">{payment.account_name || <span className="text-slate-300 italic">—</span>}</p>
                              <p className="text-xs text-slate-500">
                                {payment.account_number}
                                {payment.bank_abbreviation && ` · ${payment.bank_abbreviation}`}
                              </p>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900">
                              ₦{payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {format(new Date(payment.payment_date), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)} className="h-8 w-8 p-0 hover:bg-cyan-50 hover:text-cyan-700">
                                <Eye size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Duplicates Tab */}
            <TabsContent value="duplicates" className="mt-4">
              {duplicatePayments.length === 0 ? (
                <Card className="p-10 text-center shadow-none">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="text-emerald-600" size={22} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No duplicates detected</p>
                  <p className="text-xs text-slate-500">All payments appear to be legitimate</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {duplicatePayments.map((dup) => (
                    <Card key={dup.application_id} className="p-5 border-rose-200 bg-rose-50 shadow-none">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-rose-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="text-rose-600" size={17} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">Application #{dup.application_id}</p>
                          <p className="text-xs text-rose-700">{dup.payment_count} payments detected</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {dup.payments.map((payment, idx) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-200">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                Payment {idx + 1}: ₦{payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-slate-500">{format(new Date(payment.payment_date), 'MMM d, yyyy HH:mm')}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)} className="h-8 w-8 p-0">
                              <Eye size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>Full transaction information</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-slate-900 break-all bg-slate-50 rounded-lg p-2.5">{selectedPayment.transaction_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Application', value: `#${selectedPayment.application_id}` },
                    { label: 'User', value: selectedPayment.username ? `@${selectedPayment.username}` : '—' },
                    { label: 'Amount', value: `₦${selectedPayment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
                    { label: 'Date', value: format(new Date(selectedPayment.payment_date), 'MMM d, yyyy HH:mm') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <Badge className={getStatusColor(selectedPayment.status)}>{selectedPayment.status}</Badge>
                </div>

                {/* Account details */}
                {(selectedPayment.account_name || selectedPayment.bank_name) && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Information</p>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                      {selectedPayment.account_name && (
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-slate-400 flex-shrink-0" />
                          <div>
                            <span className="text-slate-500 text-xs">Name: </span>
                            <span className="font-medium text-slate-800">{selectedPayment.account_name}</span>
                          </div>
                        </div>
                      )}
                      {selectedPayment.account_number && (
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-slate-400 flex-shrink-0" />
                          <div>
                            <span className="text-slate-500 text-xs">Number: </span>
                            <span className="font-medium text-slate-800">{selectedPayment.account_number}</span>
                          </div>
                        </div>
                      )}
                      {selectedPayment.bank_name && (
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                          <div>
                            <span className="text-slate-500 text-xs">Bank: </span>
                            <span className="font-medium text-slate-800">
                              {selectedPayment.bank_name}
                              {selectedPayment.bank_abbreviation && ` (${selectedPayment.bank_abbreviation})`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
