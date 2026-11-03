import React, { useEffect, useState } from 'react';
import { adminAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, Trash2, Building2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Bank {
  id: number;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = { name: '', abbreviation: '' };

export default function AdminBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmBank, setDeleteConfirmBank] = useState<Bank | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getBanks();
      setBanks(res.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingBank(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({ name: bank.name, abbreviation: bank.abbreviation });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      showErrorToast({ message: 'Both bank name and abbreviation are required' });
      return;
    }
    try {
      setIsSaving(true);
      if (editingBank) {
        await adminAPI.updateBank(editingBank.id, formData);
        showSuccessToast('Bank updated successfully');
      } else {
        await adminAPI.createBank(formData);
        showSuccessToast('Bank created successfully');
      }
      setIsFormOpen(false);
      fetchBanks();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmBank) return;
    try {
      setIsDeleting(true);
      await adminAPI.deleteBank(deleteConfirmBank.id);
      showSuccessToast('Bank deleted successfully');
      setDeleteConfirmBank(null);
      fetchBanks();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = banks.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bank Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage supported banks for user payments</p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white border-0 flex items-center gap-2 self-start"
            >
              <Plus size={16} />
              Add Bank
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 shadow-none border-t-2 border-t-cyan-500">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Building2 size={18} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{banks.length}</p>
                  <p className="text-xs text-slate-500">Total banks</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search + Table */}
          <Card className="shadow-none p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {filtered.length} of {banks.length}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-600 mb-1">No banks found</p>
                <p className="text-xs text-slate-400">
                  {banks.length === 0 ? 'Add your first bank to get started.' : 'Try a different search.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bank Name</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Abbreviation</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date Added</TableHead>
                      <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((bank) => (
                      <TableRow key={bank.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{bank.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {bank.abbreviation}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {format(new Date(bank.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(bank)}
                              className="h-8 w-8 p-0 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmBank(bank)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>{editingBank ? 'Edit Bank' : 'Add New Bank'}</DialogTitle>
              <DialogDescription>
                {editingBank
                  ? 'Update the bank name and abbreviation.'
                  : 'Enter the details for the new bank.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Bank Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. United Bank for Africa"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Abbreviation *
                </Label>
                <Input
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="e.g. UBA"
                  maxLength={20}
                  className="h-9 text-sm uppercase"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="h-9">
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
                ) : editingBank ? 'Update Bank' : 'Add Bank'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmBank} onOpenChange={(o) => !o && setDeleteConfirmBank(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bank</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteConfirmBank?.name}</strong>? This action cannot be undone. If any users currently have this bank set as their payment bank, the deletion will be blocked.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end mt-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
