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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit2, Lock, Unlock, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Admin User Management Page
 * Design: Modern Civic Dashboard
 * - Table view with all users
 * - Inline actions: block/unblock, edit, delete
 * - Modal forms for editing user details
 * - Confirmation dialogs for destructive actions
 */

interface User {
  id: number;
  surname: string;
  firstname: string;
  middlename: string;
  username: string;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
  // extended profile
  phone_number?: string;
  street_address?: string;
  city?: string;
  state?: string;
  lga?: string;
  country?: string;
  // payment
  account_name?: string;
  account_number?: string;
  bank?: { id: number; name: string; abbreviation: string } | null;
  is_profile_complete?: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', role: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      await adminAPI.blockUser(userId);
      showSuccessToast('User blocked successfully');
      fetchUsers();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      await adminAPI.unblockUser(userId);
      showSuccessToast('User unblocked successfully');
      fetchUsers();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, email: user.email, role: user.role });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      await adminAPI.editUser(editingUser.id, editFormData);
      showSuccessToast('User updated successfully');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    try {
      setIsDeleting(true);
      await adminAPI.deleteUser(deleteConfirmUser.id);
      showSuccessToast('User deleted successfully');
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
            <p className="text-slate-600">Manage all users in the system</p>
          </div>

          {/* Search Bar */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Spinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-200">
                      <TableHead className="text-slate-700 font-semibold">Username</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Fullname</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Email</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Role</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-700 font-semibold">Created</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-900">{user.username}</TableCell>
                        <TableCell className="font-medium text-slate-900">{user.surname} {user.firstname} {user.middlename}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_blocked ? 'destructive' : 'default'}
                            className="capitalize"
                          >
                            {user.is_blocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Edit2 size={16} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {user.is_blocked ? (
                                <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                                  <Unlock size={16} className="mr-2" />
                                  Unblock
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                                  <Lock size={16} className="mr-2" />
                                  Block
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmUser(user)}
                                className="text-red-600"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete
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

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <Input
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <Input
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Email"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Read-only profile/payment info */}
              {editingUser && (editingUser.account_name || editingUser.phone_number || editingUser.city) && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Profile Information (read-only)</p>
                  {editingUser.phone_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-medium text-slate-800">{editingUser.phone_number}</span>
                    </div>
                  )}
                  {editingUser.city && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Location</span>
                      <span className="font-medium text-slate-800">{[editingUser.city, editingUser.lga, editingUser.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {editingUser.account_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Account name</span>
                      <span className="font-medium text-slate-800">{editingUser.account_name}</span>
                    </div>
                  )}
                  {editingUser.account_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Account number</span>
                      <span className="font-medium text-slate-800">{editingUser.account_number}</span>
                    </div>
                  )}
                  {editingUser.bank && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bank</span>
                      <span className="font-medium text-slate-800">{editingUser.bank.name} ({editingUser.bank.abbreviation})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Profile status</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${editingUser.is_profile_complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {editingUser.is_profile_complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteConfirmUser?.username}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-4 justify-end pt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
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
