import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Save,
  Upload,
  DollarSign,
  Type,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { companyInfo } from '../data/mockData';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

type SettingsTab = 'company' | 'user' | 'notifications' | 'appearance' | 'security' | 'data';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Company settings
  const [companyName, setCompanyName] = useState(companyInfo.name);
  const [companyAddress, setCompanyAddress] = useState(companyInfo.address);
  const [companyPhone, setCompanyPhone] = useState(companyInfo.phone);
  const [companyEmail, setCompanyEmail] = useState(companyInfo.email);
  const [taxId, setTaxId] = useState(companyInfo.taxNumber || '');

  // User settings
  const [userName, setUserName] = useState('Admin User');
  const [userEmail, setUserEmail] = useState('admin@jewelshop.lk');
  const [userRole, setUserRole] = useState('Administrator');

  // Appearance settings
  const [accentColor, setAccentColor] = useState('gold');
  const [fontSize, setFontSize] = useState('medium');

  const tabs = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'user', label: 'User Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'data', label: 'Data & Backup', icon: Database },
  ];

  const handleSave = () => {
    // In a real app, save settings to backend
    toast.success('Settings saved successfully!');
  };

  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Company Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-amber-400" />
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
              label="Tax ID / Business Registration"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>

          <Input
            label="Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Invoice Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Invoice Prefix" defaultValue="INV-" />
            <Input label="GRN Prefix" defaultValue="GRN-" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Default Tax Rate (%)" type="number" defaultValue="0" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Currency
              </label>
              <Combobox
                value="LKR"
                onChange={() => {}}
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
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-400">AU</span>
            </div>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4" />
                Change Photo
              </Button>
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
            <Input label="Phone" defaultValue="+94 77 123 4567" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
              <Combobox
                value={userRole}
                onChange={setUserRole}
                options={[
                  { value: 'Administrator', label: 'Administrator', icon: <Shield className="w-4 h-4" /> },
                  { value: 'Manager', label: 'Manager', icon: <User className="w-4 h-4" /> },
                  { value: 'Sales', label: 'Sales Staff', icon: <User className="w-4 h-4" /> },
                  { value: 'Accountant', label: 'Accountant', icon: <User className="w-4 h-4" /> }
                ]}
                placeholder="Select role..."
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Change Password</h3>
        <div className="space-y-4">
          <Input label="Current Password" type="password" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="New Password" type="password" />
            <Input label="Confirm New Password" type="password" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Email Notifications</h3>
      <div className="space-y-3">
        {[
          { label: 'New Invoice Created', description: 'Get notified when a new invoice is created' },
          { label: 'Payment Received', description: 'Get notified when a payment is recorded' },
          { label: 'Low Stock Alert', description: 'Get notified when products are running low' },
          { label: 'New GRN Received', description: 'Get notified when goods are received' },
          { label: 'Daily Summary', description: 'Receive a daily summary of business activity' },
        ].map((notification) => (
          <div
            key={notification.label}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">{notification.label}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{notification.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        ))}
      </div>
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

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Two-Factor Authentication</h3>
        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">2FA is disabled</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline">Enable 2FA</Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">Current Session</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Windows • Chrome • Colombo, Sri Lanka</p>
                <p className="text-xs text-slate-500 mt-1">Started: Today at 9:30 AM</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Login History</h3>
        <Button variant="outline">View Login History</Button>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Backup</h3>
        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Automatic Backups</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Last backup: Today at 2:00 AM</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Download Backup</Button>
            <Button variant="gold">Backup Now</Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Import Data</h3>
        <div className="p-4 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">Drag and drop a file or click to browse</p>
          <p className="text-xs text-slate-500 mt-1">Supports CSV, Excel files</p>
          <Button variant="outline" className="mt-4">
            Browse Files
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Export Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Products', 'Customers', 'Invoices', 'GRNs'].map((type) => (
            <Button key={type} variant="outline" className="w-full">
              Export {type}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="font-medium text-slate-800 dark:text-slate-200">Delete All Data</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This will permanently delete all your data. This action cannot be undone.
          </p>
          <Button variant="destructive">Delete All Data</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {tabs.find((t) => t.key === activeTab)?.label}
            </CardTitle>
            <Button variant="gold" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </CardHeader>
          <CardContent>
            {activeTab === 'company' && renderCompanySettings()}
            {activeTab === 'user' && renderUserSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'data' && renderDataSettings()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
