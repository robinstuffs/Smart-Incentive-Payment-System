import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { userAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import { CreditCard } from 'lucide-react';

interface Bank {
  id: number;
  name: string;
  abbreviation: string;
}

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after payment details are successfully saved */
  onSaved: (details: { account_name: string; account_number: string; bank_id: number; bank: Bank }) => void;
  /** Pre-fill values if user already has payment details */
  prefill?: {
    account_name?: string;
    account_number?: string;
    bank_id?: number;
  };
}

export default function PaymentDetailsModal({
  open,
  onOpenChange,
  onSaved,
  prefill,
}: PaymentDetailsModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankId, setBankId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBanks();
      // Pre-fill existing values
      setAccountName(prefill?.account_name || '');
      setAccountNumber(prefill?.account_number || '');
      setBankId(prefill?.bank_id ? String(prefill.bank_id) : '');
    }
  }, [open, prefill?.account_name, prefill?.account_number, prefill?.bank_id]);

  const fetchBanks = async () => {
    try {
      setIsFetchingBanks(true);
      const res = await userAPI.getBanks();
      setBanks(res.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsFetchingBanks(false);
    }
  };

  const handleSave = async () => {
    if (!accountName.trim()) {
      showErrorToast({ message: 'Account name is required' });
      return;
    }
    if (!accountNumber.trim()) {
      showErrorToast({ message: 'Account number is required' });
      return;
    }
    if (!bankId) {
      showErrorToast({ message: 'Please select a bank' });
      return;
    }

    try {
      setIsSaving(true);
      await userAPI.updatePaymentDetails({
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        bank_id: Number(bankId),
      });
      showSuccessToast('Payment details saved');
      const bank = banks.find((b) => b.id === Number(bankId))!;
      onSaved({ account_name: accountName.trim(), account_number: accountNumber.trim(), bank_id: Number(bankId), bank });
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
              <CreditCard size={20} className="text-cyan-600" />
            </div>
            <div>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Enter your bank account details to receive your incentive
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Account Name *</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. John Adewale Doe"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Account Number *</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit account number"
              maxLength={20}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Bank *</Label>
            {isFetchingBanks ? (
              <div className="h-9 flex items-center text-xs text-slate-400">Loading banks...</div>
            ) : (
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={String(bank.id)}>
                      {bank.name} ({bank.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : 'Save & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
