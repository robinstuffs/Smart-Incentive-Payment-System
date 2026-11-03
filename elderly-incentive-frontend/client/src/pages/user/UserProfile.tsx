import React, { useEffect, useState } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLocation } from 'wouter';
import UserLayout from '@/components/UserLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userAPI, showErrorToast, showSuccessToast } from '@/lib/api';
import { User, Mail, Calendar, Shield, Save, AtSign, Edit2, Phone, MapPin, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

// ── Nigeria geo data ──────────────────────────────────────────────────────────
// Place nigeria_states_and_lgas.json in the same directory as this file.
import nigeriaStatesLgas from './nigeria_states_and_lgas.json';

const NIGERIA_STATES_LGAS = nigeriaStatesLgas as Record<string, string[]>;
const NIGERIAN_STATES = Object.keys(NIGERIA_STATES_LGAS).sort();

const getLgas = (state: string): string[] => NIGERIA_STATES_LGAS[state] ?? [];

interface UserProfile {
  id: number;
  surname: string;
  firstname: string;
  middlename?: string;
  username: string;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
  // Extended
  phone_number?: string;
  street_address?: string;
  area_district?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  // Payment
  account_name?: string;
  account_number?: string;
  bank_id?: number;
  bank?: { id: number; name: string; abbreviation: string };
  is_profile_complete?: boolean;
}

interface Bank {
  id: number;
  name: string;
  abbreviation: string;
}

// ── helpers ────────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | undefined, fmt: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return format(date, fmt);
};

const getInitials = (profile: UserProfile | null): string => {
  if (!profile) return '?';
  const f = profile.firstname?.[0] ?? '';
  const s = profile.surname?.[0] ?? '';
  return (f + s).toUpperCase() || profile.username?.[0]?.toUpperCase() || '?';
};

const getDisplayName = (profile: UserProfile | null): string => {
  if (!profile) return 'User Account';
  const parts = [profile.firstname, profile.middlename, profile.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : profile.username;
};

const labelClass = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

const LockedField = ({
  icon: Icon,
  value,
  hint,
}: {
  icon: React.ElementType;
  value: string;
  hint?: string;
}) => (
  <div>
    <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <Icon size={15} className="text-slate-400 flex-shrink-0" />
      <span className="text-sm text-slate-500 font-medium">{value}</span>
    </div>
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const ViewField = ({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
    <Icon size={15} className="text-slate-400 flex-shrink-0" />
    <span className="text-sm text-slate-800 font-medium">
      {value || <span className="text-slate-400 italic">Not provided</span>}
    </span>
  </div>
);

const EditField = ({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-cyan-400 ring-2 ring-cyan-400/10 focus-within:ring-cyan-400/20 transition-all">
    <Icon size={15} className="text-cyan-500 flex-shrink-0" />
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 h-7 border-0 p-0 text-sm font-medium text-slate-800 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
    />
  </div>
);

const EditSelect = ({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ring-2 transition-all ${
    disabled
      ? 'bg-slate-50 border-slate-200 ring-slate-100/10 opacity-60 cursor-not-allowed'
      : 'bg-white border-cyan-400 ring-cyan-400/10'
  }`}>
    <Icon size={15} className={`flex-shrink-0 ${disabled ? 'text-slate-400' : 'text-cyan-500'}`} />
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="flex-1 h-7 border-0 p-0 text-sm font-medium text-slate-800 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none disabled:cursor-not-allowed">
        <SelectValue placeholder={placeholder || 'Select'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

// ── main component ─────────────────────────────────────────────────────────────

export default function UserProfile() {
  const { isAuthenticated, refreshUser } = useUserAuth();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  type FormData = {
    surname: string; firstname: string; middlename: string; email: string;
    phone_number: string; street_address: string; area_district: string;
    city: string; lga: string; state: string; postal_code: string;
    account_name: string; account_number: string; bank_id: string;
  };

  const [formData, setFormData] = useState<FormData>({
    surname: '', firstname: '', middlename: '', email: '',
    phone_number: '', street_address: '', area_district: '',
    city: '', lga: '', state: '', postal_code: '',
    account_name: '', account_number: '', bank_id: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/user/login');
      return;
    }
    fetchProfile();
    fetchBanks();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getUserProfile();
      setProfile(response.data);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await userAPI.getBanks();
      setBanks(res.data);
    } catch { /* silent */ }
  };

  const startEditing = () => {
    setFormData({
      surname: profile?.surname ?? '',
      firstname: profile?.firstname ?? '',
      middlename: profile?.middlename ?? '',
      email: profile?.email ?? '',
      phone_number: profile?.phone_number ?? '',
      street_address: profile?.street_address ?? '',
      area_district: profile?.area_district ?? '',
      city: profile?.city ?? '',
      lga: profile?.lga ?? '',
      state: profile?.state ?? '',
      postal_code: profile?.postal_code ?? '',
      account_name: profile?.account_name ?? '',
      account_number: profile?.account_number ?? '',
      bank_id: profile?.bank_id ? String(profile.bank_id) : '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Save main profile — country is always Nigeria
      await userAPI.updateUserProfile({
        surname: formData.surname,
        firstname: formData.firstname,
        middlename: formData.middlename,
        email: formData.email,
        phone_number: formData.phone_number,
        street_address: formData.street_address,
        area_district: formData.area_district,
        city: formData.city,
        lga: formData.lga,
        state: formData.state,
        country: 'Nigeria',
        postal_code: formData.postal_code,
      });

      // Save payment details if all three fields are provided
      if (formData.account_name && formData.account_number && formData.bank_id) {
        await userAPI.updatePaymentDetails({
          account_name: formData.account_name,
          account_number: formData.account_number,
          bank_id: Number(formData.bank_id),
        });
      }

      await fetchProfile();
      await refreshUser();
      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsSaving(false);
    }
  };

  const set = (key: keyof FormData) => (value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner />
        </div>
      </UserLayout>
    );
  }

  // LGAs available only after a state is chosen
  const lgas = formData.state ? getLgas(formData.state) : [];
  const lgaDisabled = !formData.state;

  return (
    <UserLayout>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My profile</h1>
          <p className="text-sm text-slate-500">Manage your account and payment information</p>
        </div>

        {/* Profile completion status */}
        {profile && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${profile.is_profile_complete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <CheckCircle2 size={18} className={profile.is_profile_complete ? 'text-emerald-600 flex-shrink-0' : 'text-amber-500 flex-shrink-0'} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: profile.is_profile_complete ? '#065f46' : '#92400e' }}>
                {profile.is_profile_complete ? 'Profile complete' : 'Profile incomplete'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: profile.is_profile_complete ? '#047857' : '#b45309' }}>
                {profile.is_profile_complete
                  ? 'Your profile is complete and you can apply for incentives.'
                  : 'Please fill in all required fields (address, phone number) to be eligible to apply.'}
              </p>
            </div>
            {!profile.is_profile_complete && !isEditing && (
              <Button size="sm" onClick={startEditing} className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0 flex-shrink-0">
                Complete now
              </Button>
            )}
          </div>
        )}

        {/* Profile card */}
        <Card className="overflow-hidden border-slate-200 shadow-sm p-0">

          {/* Avatar band */}
          <div className="bg-gradient-to-r from-cyan-700 to-teal-600 px-6 pt-6 pb-12 relative">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">{getInitials(profile)}</span>
            </div>
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-white">{getDisplayName(profile)}</h2>
              <p className="text-sm text-white/70">
                @{profile?.username} · Member since {formatDate(profile?.created_at, 'MMM yyyy')}
              </p>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 rounded-full px-3 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${profile?.is_blocked ? 'bg-red-400' : 'bg-green-400'}`} />
              {profile?.is_blocked ? 'Blocked' : 'Active account'}
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 pb-6 -mt-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">

              {/* ── Personal details ── */}
              <div>
                <SectionHeader label="Personal details" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Surname</label>
                    {isEditing ? <EditField icon={User} value={formData.surname} onChange={set('surname')} placeholder="Surname" /> : <ViewField icon={User} value={profile?.surname ?? ''} />}
                  </div>
                  <div>
                    <label className={labelClass}>First name</label>
                    {isEditing ? <EditField icon={User} value={formData.firstname} onChange={set('firstname')} placeholder="First name" /> : <ViewField icon={User} value={profile?.firstname ?? ''} />}
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Middle name <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase">optional</span></label>
                    {isEditing ? <EditField icon={User} value={formData.middlename} onChange={set('middlename')} placeholder="Middle name (optional)" /> : <ViewField icon={User} value={profile?.middlename ?? ''} />}
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Phone number *</label>
                    {isEditing ? <EditField icon={Phone} type="tel" value={formData.phone_number} onChange={set('phone_number')} placeholder="+234 800 000 0000" /> : <ViewField icon={Phone} value={profile?.phone_number ?? ''} />}
                  </div>
                </div>
              </div>

              {/* ── Account details ── */}
              <div>
                <SectionHeader label="Account details" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Email address</label>
                    {isEditing ? <EditField icon={Mail} type="email" value={formData.email} onChange={set('email')} placeholder="your@email.com" /> : <ViewField icon={Mail} value={profile?.email ?? ''} />}
                  </div>
                  <div>
                    <label className={labelClass}>Username</label>
                    <LockedField icon={AtSign} value={profile?.username ?? ''} hint="Cannot be changed" />
                  </div>
                  <div>
                    <label className={labelClass}>Member since</label>
                    <LockedField icon={Calendar} value={formatDate(profile?.created_at, 'MMMM d, yyyy')} />
                  </div>
                </div>
              </div>

              {/* ── Address information ── */}
              <div>
                <SectionHeader label="Address information" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Street address *</label>
                    {isEditing ? <EditField icon={MapPin} value={formData.street_address} onChange={set('street_address')} placeholder="House number, street name" /> : <ViewField icon={MapPin} value={profile?.street_address ?? ''} />}
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Area / District <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase">optional</span></label>
                    {isEditing ? <EditField icon={MapPin} value={formData.area_district} onChange={set('area_district')} placeholder="Area or district (optional)" /> : <ViewField icon={MapPin} value={profile?.area_district ?? ''} />}
                  </div>

                  {/* State — select from full list */}
                  <div>
                    <label className={labelClass}>State *</label>
                    {isEditing ? (
                      <EditSelect
                        icon={MapPin}
                        value={formData.state}
                        onChange={(v) => setFormData((p) => ({ ...p, state: v, lga: '' }))}
                        options={NIGERIAN_STATES}
                        placeholder="Select state"
                      />
                    ) : (
                      <ViewField icon={MapPin} value={profile?.state ?? ''} />
                    )}
                  </div>

                  {/* LGA — disabled until state is chosen */}
                  <div>
                    <label className={labelClass}>
                      LGA *
                      {isEditing && lgaDisabled && (
                        <span className="ml-1 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase normal-case">
                          select state first
                        </span>
                      )}
                    </label>
                    {isEditing ? (
                      <EditSelect
                        icon={MapPin}
                        value={formData.lga}
                        onChange={set('lga')}
                        options={lgas}
                        placeholder={lgaDisabled ? 'Select state first' : 'Select LGA'}
                        disabled={lgaDisabled}
                      />
                    ) : (
                      <ViewField icon={MapPin} value={profile?.lga ?? ''} />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>City / Town *</label>
                    {isEditing ? <EditField icon={MapPin} value={formData.city} onChange={set('city')} placeholder="City or town" /> : <ViewField icon={MapPin} value={profile?.city ?? ''} />}
                  </div>

                  {/* Country — always Nigeria, never editable */}
                  <div>
                    <label className={labelClass}>Country</label>
                    <LockedField icon={MapPin} value="Nigeria" hint="Country cannot be changed" />
                  </div>

                  <div>
                    <label className={labelClass}>Postal code <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-px tracking-wide uppercase">optional</span></label>
                    {isEditing ? <EditField icon={MapPin} value={formData.postal_code} onChange={set('postal_code')} placeholder="Postal code (optional)" /> : <ViewField icon={MapPin} value={profile?.postal_code ?? ''} />}
                  </div>
                </div>
              </div>

              {/* ── Payment / Bank details ── */}
              <div>
                <SectionHeader label="Payment details" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Account name</label>
                    {isEditing ? <EditField icon={CreditCard} value={formData.account_name} onChange={set('account_name')} placeholder="Account name as on bank records" /> : <ViewField icon={CreditCard} value={profile?.account_name ?? ''} />}
                  </div>
                  <div>
                    <label className={labelClass}>Account number</label>
                    {isEditing ? <EditField icon={CreditCard} value={formData.account_number} onChange={(v) => set('account_number')(v.replace(/\D/g, ''))} placeholder="10-digit account number" /> : <ViewField icon={CreditCard} value={profile?.account_number ?? ''} />}
                  </div>
                  <div>
                    <label className={labelClass}>Bank</label>
                    {isEditing ? (
                      <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-cyan-400 ring-2 ring-cyan-400/10 transition-all">
                        <Building2 size={15} className="text-cyan-500 flex-shrink-0" />
                        <Select value={formData.bank_id} onValueChange={set('bank_id')}>
                          <SelectTrigger className="flex-1 h-7 border-0 p-0 text-sm font-medium text-slate-800 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={String(bank.id)}>
                                {bank.name} ({bank.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <ViewField icon={Building2} value={profile?.bank ? `${profile.bank.name} (${profile.bank.abbreviation})` : ''} />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-10 text-sm border-slate-200 text-slate-600 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 h-10 text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold flex items-center justify-center gap-2 border-0"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <><Save size={15} /> Save changes</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={startEditing}
                    className="w-full h-10 text-sm bg-white border border-cyan-400 text-cyan-700 hover:bg-cyan-50 font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit2 size={15} />
                    Edit profile
                  </Button>
                )}
              </div>

            </div>
          </div>
        </Card>

        {/* Security notice */}
        <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <Shield className="text-teal-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-0.5">Account security</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account is protected with secure password encryption. Never share your login credentials with anyone.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}