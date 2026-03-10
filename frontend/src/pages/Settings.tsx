import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  User,
  Palette,
  Save,
  Upload,
  DollarSign,
  Type,
  Sun,
  Moon,
  Monitor,
  Check,
  X,
  Loader2,
  Store,
  Hash,
  RefreshCw,
  Shield,
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  FileText,
  ListChecks,
  ScrollText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { companyApi, countersApi, usersApi, authApi, type AuthUser } from '../services/api';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

type SettingsTab = 'company' | 'numbering' | 'users' | 'user' | 'appearance';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user: authUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Business settings
  const [shopCode, setShopCode] = useState(authUser?.shopCode || localStorage.getItem('shopCode') || 'A');
  const [shopCounters, setShopCounters] = useState<any[]>([]);
  const [loadingCounters, setLoadingCounters] = useState(false);
  const [initializingShop, setInitializingShop] = useState(false);

  // Keep shopCode in sync with authUser
  useEffect(() => {
    if (authUser?.shopCode) {
      setShopCode(authUser.shopCode);
    }
  }, [authUser?.shopCode]);

  // Company settings
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyPhone2, setCompanyPhone2] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [currency, setCurrency] = useState('LKR');
  const [invoiceTerms, setInvoiceTerms] = useState<string[]>(['']);
  const [clearanceTerms, setClearanceTerms] = useState<string[]>(['']);

  // Load company data from API
  const loadCompanyData = useCallback(async () => {
    try {
      setLoadingCompany(true);
      const res = await companyApi.get();
      const c = res.data;
      setCompanyName(c.name || '');
      setCompanyTagline(c.tagline || '');
      setCompanyAddress(c.address || '');
      setCompanyCity(c.city || '');
      setCompanyCountry(c.country || '');
      setCompanyPhone(c.phone || '');
      setCompanyPhone2(c.phone2 || '');
      setCompanyEmail(c.email || '');
      setCompanyWebsite(c.website || '');
      setRegistrationNumber(c.registrationNumber || '');
      setTaxId(c.taxNumber || '');
      setDefaultTaxRate(c.defaultTaxRate || '0');
      setCurrency(c.currency || 'LKR');
      setInvoiceTerms(c.invoiceTerms ? c.invoiceTerms.split('\n').filter((t: string) => t.trim()) : ['']);
      setClearanceTerms(c.clearanceTerms ? c.clearanceTerms.split('\n').filter((t: string) => t.trim()) : ['']);
    } catch {
      toast.error('Failed to load company data');
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  useEffect(() => { loadCompanyData(); }, [loadCompanyData]);

  // Load counters for current shop code
  const loadCounters = useCallback(async (code?: string) => {
    try {
      setLoadingCounters(true);
      const res = await countersApi.getAll(code || shopCode);
      setShopCounters(res.data);
    } catch {
      // Counters may not exist yet for this shop
      setShopCounters([]);
    } finally {
      setLoadingCounters(false);
    }
  }, [shopCode]);

  useEffect(() => { loadCounters(); }, [loadCounters]);

  // User settings (from auth)
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Users management (admin)
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // New/Edit user form
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('sales');
  const [formShopCode, setFormShopCode] = useState('A');
  const [formPassword, setFormPassword] = useState('');

  // Load user info from auth
  useEffect(() => {
    if (authUser) {
      setUserName(authUser.fullName);
      setUserEmail(authUser.email);
      setUserRole(authUser.role);
      setUserPhone(authUser.phone || '');
    }
  }, [authUser]);

  // Appearance settings
  const [accentColor, setAccentColor] = useState('gold');
  const [fontSize, setFontSize] = useState('medium');

  const tabs = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'numbering', label: 'Numbering', icon: Hash },
    ...(authUser?.role === 'admin' ? [{ key: 'users', label: 'Users', icon: Users }] : []),
    { key: 'user', label: 'My Profile', icon: User },
    { key: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSave = async () => {
    if (activeTab === 'company') {
      setSaving(true);
      try {
        await companyApi.update({
          name: companyName,
          tagline: companyTagline,
          address: companyAddress,
          city: companyCity,
          country: companyCountry,
          phone: companyPhone,
          phone2: companyPhone2,
          email: companyEmail,
          website: companyWebsite,
          registrationNumber,
          taxNumber: taxId,
          defaultTaxRate,
          currency,
          invoiceTerms: invoiceTerms.filter(t => t.trim()).join('\n') || null,
          clearanceTerms: clearanceTerms.filter(t => t.trim()).join('\n') || null,
        });
        toast.success('Company settings saved successfully!');
      } catch {
        toast.error('Failed to save company settings');
      } finally {
        setSaving(false);
      }
    } else if (activeTab === 'numbering') {
      // Save shop code change + initialize counters
      setSaving(true);
      try {
        const newCode = shopCode.trim().toUpperCase();
        if (!newCode) { toast.error('Shop code is required'); setSaving(false); return; }

        // If shop code changed, update the current user's shopCode
        if (authUser && newCode !== authUser.shopCode) {
          await usersApi.update(authUser.id, { shopCode: newCode });
          await refreshUser();
        }

        await countersApi.initShop(newCode);
        await loadCounters(newCode);
        toast.success(`Shop "${newCode}" — counters ready!`);
      } catch {
        toast.error('Failed to save shop settings');
      } finally {
        setSaving(false);
      }
    } else if (activeTab === 'user') {
      // Save profile changes via API
      if (!authUser) return;
      setSaving(true);
      try {
        await usersApi.update(authUser.id, {
          fullName: userName,
          email: userEmail,
          phone: userPhone,
        });

        // Change password if provided
        if (newPassword) {
          if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            setSaving(false);
            return;
          }
          if (!currentPassword) {
            toast.error('Enter your current password');
            setSaving(false);
            return;
          }
          await authApi.changePassword(currentPassword, newPassword);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }

        await refreshUser();
        toast.success('Profile updated!');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    } else {
      toast.success('Settings saved successfully!');
    }
  };

  const renderCompanySettings = () => {
    if (loadingCompany) {
      return (
        <div className="space-y-6">
          <div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Company Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
              <img src="/logo.jpg" alt="Shop Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4" />
                Upload Logo
              </Button>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">PNG, JPG up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Tagline"
              value={companyTagline}
              onChange={(e) => setCompanyTagline(e.target.value)}
              placeholder="e.g. Exquisite Craftsmanship Since 1985"
            />
          </div>

          <Input
            label="Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              value={companyCity}
              onChange={(e) => setCompanyCity(e.target.value)}
            />
            <Input
              label="Country"
              value={companyCountry}
              onChange={(e) => setCompanyCountry(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
            <Input
              label="Phone 2"
              value={companyPhone2}
              onChange={(e) => setCompanyPhone2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
            <Input
              label="Website"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            <Input
              label="Tax Number"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Billing Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Default Tax Rate (%)"
            type="number"
            value={defaultTaxRate}
            onChange={(e) => setDefaultTaxRate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Currency
            </label>
            <Combobox
              value={currency}
              onChange={(val) => setCurrency(val)}
              options={[
                { value: 'LKR', label: 'Sri Lankan Rupee (Rs.)', icon: <DollarSign className="w-4 h-4" /> },
                { value: 'USD', label: 'US Dollar ($)', icon: <DollarSign className="w-4 h-4" /> },
                { value: 'EUR', label: 'Euro (€)', icon: <DollarSign className="w-4 h-4" /> },
                { value: 'INR', label: 'Indian Rupee (₹)', icon: <DollarSign className="w-4 h-4" /> }
              ]}
              placeholder="Select currency..."
            />
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Terms & Conditions</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Add terms that appear at the bottom of your printed invoices and clearance receipts. Each line becomes a bullet point.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Terms */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border-b border-slate-200 dark:border-slate-700">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Invoice Terms</span>
            </div>
            <div className="p-4 space-y-2">
              {invoiceTerms.map((term, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <Input
                    value={term}
                    onChange={(e) => {
                      const updated = [...invoiceTerms];
                      updated[idx] = e.target.value;
                      setInvoiceTerms(updated);
                    }}
                    placeholder={`Term ${idx + 1}...`}
                    className="flex-1"
                  />
                  {invoiceTerms.length > 1 && (
                    <button
                      onClick={() => setInvoiceTerms(invoiceTerms.filter((_, i) => i !== idx))}
                      className="mt-1.5 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setInvoiceTerms([...invoiceTerms, ''])}
                className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add term
              </button>
            </div>
            {invoiceTerms.some(t => t.trim()) && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" /> Preview
                </p>
                <ul className="space-y-1">
                  {invoiceTerms.filter(t => t.trim()).map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clearance Terms */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-700">
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Clearance Terms</span>
            </div>
            <div className="p-4 space-y-2">
              {clearanceTerms.map((term, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <Input
                    value={term}
                    onChange={(e) => {
                      const updated = [...clearanceTerms];
                      updated[idx] = e.target.value;
                      setClearanceTerms(updated);
                    }}
                    placeholder={`Term ${idx + 1}...`}
                    className="flex-1"
                  />
                  {clearanceTerms.length > 1 && (
                    <button
                      onClick={() => setClearanceTerms(clearanceTerms.filter((_, i) => i !== idx))}
                      className="mt-1.5 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setClearanceTerms([...clearanceTerms, ''])}
                className="flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add term
              </button>
            </div>
            {clearanceTerms.some(t => t.trim()) && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" /> Preview
                </p>
                <ul className="space-y-1">
                  {clearanceTerms.filter(t => t.trim()).map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  };

  const ENTITY_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
    invoice: { label: 'Invoices', icon: '🧾', desc: 'Sales invoices & bills' },
    clearance: { label: 'Clearances', icon: '🏷️', desc: 'Clearance sale numbers' },
    product: { label: 'Products', icon: '💍', desc: 'Jewellery items & SKUs' },
    category: { label: 'Categories', icon: '📂', desc: 'Product categories' },
    customer: { label: 'Customers', icon: '👥', desc: 'Customer records' },
  };

  const [editingCounter, setEditingCounter] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCounter, setSavingCounter] = useState<string | null>(null);

  const handleInitShop = async () => {
    setInitializingShop(true);
    try {
      await countersApi.initShop(shopCode);
      await loadCounters(shopCode);
      toast.success(`Counters initialized for shop "${shopCode}"`);
    } catch {
      toast.error('Failed to initialize counters');
    } finally {
      setInitializingShop(false);
    }
  };

  const handleSetNextNumber = async (entityType: string) => {
    const num = parseInt(editValue);
    if (isNaN(num) || num < 0) {
      toast.error('Enter a valid number (0 or above)');
      return;
    }
    // We set lastNumber = num - 1 so the NEXT number generated is `num`
    const newLastNumber = Math.max(0, num - 1);
    setSavingCounter(entityType);
    try {
      await countersApi.updatePrefix(entityType, {
        shopCode: localStorage.getItem('shopCode') || 'A',
        lastNumber: newLastNumber,
      });
      await loadCounters();
      setEditingCounter(null);
      setEditValue('');
      toast.success(`Next ${ENTITY_LABELS[entityType]?.label || entityType} number set to ${num}`);
    } catch {
      toast.error('Failed to update number');
    } finally {
      setSavingCounter(null);
    }
  };

  const renderNumberingSettings = () => (
    <div className="space-y-6">
      {/* Shop Code — editable */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Shop Identifier</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Set your shop code here or from the <span className="font-medium text-amber-500">Users</span> tab — both stay in sync.
        </p>
        <div className="flex items-end gap-3">
          <div className="w-28">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shop Code</label>
            <input
              type="text"
              value={shopCode}
              onChange={(e) => setShopCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              className="h-10 w-full text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xl font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              placeholder="A"
            />
          </div>
          <div className="flex-1 pb-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              e.g. <span className="font-mono text-amber-500">A</span> = Shop 1, <span className="font-mono text-amber-500">B</span> = Shop 2, <span className="font-mono text-amber-500">HQ</span> = Head Office
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Store className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Active: <span className="font-bold">{authUser?.shopCode || shopCode}</span>
            {shopCode !== (authUser?.shopCode || '') && (
              <span className="ml-1 text-yellow-600 dark:text-yellow-400"> → {shopCode} (unsaved)</span>
            )}
          </span>
        </div>
      </div>

      {/* Counters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sequence Numbers</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set the next starting number for each section
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCounters()}
            disabled={loadingCounters}
          >
            {loadingCounters ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {loadingCounters ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span className="ml-2 text-sm text-slate-500">Loading...</span>
          </div>
        ) : shopCounters.length === 0 ? (
          <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Hash className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">
              No counters for shop &ldquo;{shopCode}&rdquo;
            </p>
            <p className="text-sm text-slate-500 mb-4">Click save to initialize counters for this shop</p>
            <Button variant="gold" onClick={handleInitShop} disabled={initializingShop}>
              {initializingShop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              Initialize
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {shopCounters.map((counter) => {
              const meta = ENTITY_LABELS[counter.entityType] || { label: counter.entityType, icon: '📄', desc: '' };
              const isEditing = editingCounter === counter.entityType;
              const isSaving = savingCounter === counter.entityType;

              return (
                <div
                  key={counter.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all bg-white dark:bg-slate-900/50"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                    {meta.icon}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{meta.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{meta.desc}</p>
                  </div>

                  {/* Next Number */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSetNextNumber(counter.entityType);
                            if (e.key === 'Escape') { setEditingCounter(null); setEditValue(''); }
                          }}
                          autoFocus
                          className="w-20 px-2 py-1 text-center font-mono text-sm rounded-lg border border-amber-500 bg-amber-500/5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <button
                          onClick={() => handleSetNextNumber(counter.entityType)}
                          disabled={isSaving}
                          className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => { setEditingCounter(null); setEditValue(''); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCounter(counter.entityType);
                          setEditValue(String(counter.nextNumber));
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group/btn cursor-pointer"
                        title="Click to change next number"
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400">Next</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                          {counter.nextFormatted}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <span className="font-medium text-slate-700 dark:text-slate-300">💡 Tip:</span>{' '}
          Click any &ldquo;Next&rdquo; badge to change the starting number.
          Each shop has independent sequences — e.g. Shop A generates A0001, A0002… and Shop B generates B0001, B0002… with no conflicts.
          Numbers are assigned atomically by the server.
        </p>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-500">{userName.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Username: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{authUser?.username}</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Shop: <span className="font-mono text-amber-500">{authUser?.shopCode}</span> &middot; Role: <span className="capitalize">{authUser?.role}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
              <div className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm capitalize">
                {authUser?.role || 'user'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Change Password</h3>
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // Users Management Tab (Admin only)
  // ==========================================

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await usersApi.getAll();
      setAllUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && authUser?.role === 'admin') {
      loadUsers();
    }
  }, [activeTab, authUser?.role, loadUsers]);

  const openCreateUserModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormFullName('');
    setFormPhone('');
    setFormRole('sales');
    setFormShopCode(authUser?.shopCode || 'A');
    setFormPassword('');
    setShowNewPassword(false);
    setShowUserModal(true);
  };

  const openEditUserModal = (u: AuthUser) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormEmail(u.email);
    setFormFullName(u.fullName);
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setFormShopCode(u.shopCode);
    setFormPassword('');
    setShowNewPassword(false);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formFullName.trim()) { toast.error('Full name is required'); return; }
    if (!formEmail.trim()) { toast.error('Email is required'); return; }

    setSavingUser(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: formEmail.trim(),
          fullName: formFullName.trim(),
          phone: formPhone.trim() || undefined,
          role: formRole,
          shopCode: formShopCode.trim().toUpperCase(),
        };
        if (formPassword) updateData.password = formPassword;

        await usersApi.update(editingUser.id, updateData);

        // If the edited user is the current user and shop code changed, refresh auth
        if (editingUser.id === authUser?.id && updateData.shopCode !== authUser?.shopCode) {
          await refreshUser();
          await loadCounters(updateData.shopCode);
        }

        toast.success('User updated successfully!');
      } else {
        // Create new user
        if (!formUsername.trim()) { toast.error('Username is required'); setSavingUser(false); return; }
        if (!formPassword || formPassword.length < 6) { toast.error('Password must be at least 6 characters'); setSavingUser(false); return; }

        await usersApi.create({
          username: formUsername.trim().toLowerCase(),
          email: formEmail.trim(),
          password: formPassword,
          fullName: formFullName.trim(),
          phone: formPhone.trim() || undefined,
          role: formRole,
          shopCode: formShopCode.trim().toUpperCase(),
        });
        toast.success('User registered successfully!');
      }

      setShowUserModal(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await usersApi.delete(userId);
      toast.success('User deleted');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (u: AuthUser) => {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    sales: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    accountant: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  const renderUsersManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Registered Users</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage system users and their access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loadingUsers}>
            {loadingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button variant="gold" size="sm" onClick={openCreateUserModal}>
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {loadingUsers ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="ml-2 text-sm text-slate-500">Loading users...</span>
        </div>
      ) : allUsers.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No users found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {allUsers.map((u) => (
            <div
              key={u.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-all bg-white dark:bg-slate-900/50',
                u.isActive !== false
                  ? 'border-slate-200 dark:border-slate-700 hover:border-amber-500/30'
                  : 'border-slate-200/50 dark:border-slate-800 opacity-60'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm',
                u.isActive !== false
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                  : 'bg-slate-400'
              )}>
                {u.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{u.fullName}</p>
                  <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border', ROLE_COLORS[u.role] || ROLE_COLORS.sales)}>
                    {u.role}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {u.shopCode}
                  </span>
                  {u.isActive === false && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                  <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                  {u.phone && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.phone}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(u)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    u.isActive !== false
                      ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  title={u.isActive !== false ? 'Deactivate' : 'Activate'}
                >
                  {u.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditUserModal(u)}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {u.id !== authUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.fullName)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Register New User'} size="lg">
        <ModalContent>
          <div className="space-y-4">
            {!editingUser && (
              <Input
                label="Username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. john_doe"
              />
            )}
            <Input
              label="Full Name"
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="e.g. john@onelkajewellery.lk"
            />
            <Input
              label="Phone"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+94 77 123 4567"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                <Combobox
                  value={formRole}
                  onChange={setFormRole}
                  options={[
                    { value: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> },
                    { value: 'manager', label: 'Manager', icon: <User className="w-4 h-4" /> },
                    { value: 'sales', label: 'Sales', icon: <User className="w-4 h-4" /> },
                    { value: 'accountant', label: 'Accountant', icon: <User className="w-4 h-4" /> },
                  ]}
                  placeholder="Select role..."
                />
              </div>
              <Input
                label="Shop Code"
                value={formShopCode}
                onChange={(e) => setFormShopCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                placeholder="A"
                className="text-center font-mono font-bold tracking-widest"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
              />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
          <Button variant="gold" onClick={handleSaveUser} disabled={savingUser}>
            {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {editingUser ? 'Update User' : 'Register'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={cn(
          'text-lg font-semibold mb-4',
          resolvedTheme === 'light' ? 'text-slate-900' : 'text-slate-100'
        )}>Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'light' as Theme, label: 'Light', icon: Sun, preview: 'bg-white border-slate-200' },
            { key: 'dark' as Theme, label: 'Dark', icon: Moon, preview: 'bg-slate-900 border-slate-700' },
            { key: 'system' as Theme, label: 'System', icon: Monitor, preview: 'bg-gradient-to-r from-slate-900 to-white' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all relative',
                theme === t.key
                  ? 'border-amber-500 bg-amber-500/10'
                  : resolvedTheme === 'light'
                    ? 'border-slate-200 hover:border-slate-300 bg-white'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
              )}
            >
              {theme === t.key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={cn('w-full h-16 rounded-lg mb-3 border', t.preview)} />
              <div className="flex items-center justify-center gap-2">
                <t.icon className={cn(
                  'w-4 h-4',
                  theme === t.key 
                    ? 'text-amber-500' 
                    : resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-400'
                )} />
                <p className={cn(
                  'text-sm font-medium',
                  theme === t.key 
                    ? 'text-amber-500' 
                    : resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'
                )}>{t.label}</p>
              </div>
            </button>
          ))}
        </div>
        <p className={cn(
          'mt-3 text-sm',
          resolvedTheme === 'light' ? 'text-slate-500' : 'text-slate-400'
        )}>
          {theme === 'system' 
            ? `Currently using ${resolvedTheme} theme based on your system preferences.`
            : `Using ${theme} theme.`}
        </p>
      </div>

      <div>
        <h3 className={cn(
          'text-lg font-semibold mb-4',
          resolvedTheme === 'light' ? 'text-slate-900' : 'text-slate-100'
        )}>Accent Color</h3>
        <div className="flex gap-3">
          {[
            { key: 'gold', color: 'bg-amber-500' },
            { key: 'blue', color: 'bg-blue-500' },
            { key: 'green', color: 'bg-emerald-500' },
            { key: 'purple', color: 'bg-purple-500' },
            { key: 'rose', color: 'bg-rose-500' },
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => setAccentColor(c.key)}
              className={cn(
                'w-10 h-10 rounded-full transition-all',
                c.color,
                accentColor === c.key 
                  ? 'ring-2 ring-offset-2 ring-white ' + (resolvedTheme === 'light' ? 'ring-offset-white' : 'ring-offset-slate-900')
                  : ''
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className={cn(
          'text-lg font-semibold mb-4',
          resolvedTheme === 'light' ? 'text-slate-900' : 'text-slate-100'
        )}>Font Size</h3>
        <Combobox
          value={fontSize}
          onChange={setFontSize}
          options={[
            { value: 'small', label: 'Small', icon: <Type className="w-4 h-4" /> },
            { value: 'medium', label: 'Medium', icon: <Type className="w-4 h-4" /> },
            { value: 'large', label: 'Large', icon: <Type className="w-4 h-4" /> }
          ]}
          placeholder="Select font size..."
          className="w-48"
        />
      </div>
    </div>
  );





  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application preferences</p>
        </div>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SettingsTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'company' && renderCompanySettings()}
          {activeTab === 'numbering' && renderNumberingSettings()}
          {activeTab === 'users' && authUser?.role === 'admin' && renderUsersManagement()}
          {activeTab === 'user' && renderUserSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
        </CardContent>
      </Card>
    </div>
  );
}
