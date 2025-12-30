import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Crown,
  Star,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import type { Customer, CustomerType } from '../types';

// Mock data - would come from API in real app
const initialCustomers: Customer[] = [
  {
    id: 'C001',
    name: 'Kamal Perera',
    businessName: undefined,
    email: 'kamal.perera@email.com',
    phone: '0771234567',
    address: '123 Galle Road',
    city: 'Colombo',
    registrationDate: '2023-01-15',
    totalPurchased: 450000,
    customerType: 'vip',
    isActive: true,
    creditLimit: 500000,
    creditBalance: 75000,
  },
  {
    id: 'C002',
    name: 'Nimal Silva',
    businessName: 'Silva Jewellers',
    email: 'nimal@silvajewellers.lk',
    phone: '0112345678',
    address: '45 Main Street',
    city: 'Kandy',
    registrationDate: '2023-03-20',
    totalPurchased: 1250000,
    customerType: 'wholesale',
    isActive: true,
    creditLimit: 1000000,
    creditBalance: 250000,
  },
  {
    id: 'C003',
    name: 'Amaya Fernando',
    email: 'amaya.fernando@gmail.com',
    phone: '0769876543',
    address: '78 Beach Road',
    city: 'Galle',
    registrationDate: '2023-06-10',
    totalPurchased: 125000,
    customerType: 'retail',
    isActive: true,
    creditLimit: 100000,
    creditBalance: 0,
  },
  {
    id: 'C004',
    name: 'Sunil Jayawardena',
    email: 'sunil.jay@yahoo.com',
    phone: '0756543210',
    address: '22 Temple Road',
    city: 'Negombo',
    registrationDate: '2024-01-05',
    totalPurchased: 85000,
    customerType: 'credit',
    isActive: true,
    creditLimit: 200000,
    creditBalance: 45000,
  },
];

// Mock invoices for stats
const mockInvoices = [
  { id: 'INV001', customerId: 'C001', total: 150000 },
  { id: 'INV002', customerId: 'C001', total: 200000 },
  { id: 'INV003', customerId: 'C001', total: 100000 },
  { id: 'INV004', customerId: 'C002', total: 500000 },
  { id: 'INV005', customerId: 'C002', total: 750000 },
  { id: 'INV006', customerId: 'C003', total: 125000 },
  { id: 'INV007', customerId: 'C004', total: 85000 },
];

const customerTypes: CustomerType[] = ['retail', 'wholesale', 'vip', 'credit'];

interface FormData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  customerType: CustomerType;
  creditLimit: number;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  customerType: 'retail',
  creditLimit: 0,
  isActive: true,
};

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Stats
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c) => c.customerType === 'vip').length;
  const wholesaleCustomers = customers.filter((c) => c.customerType === 'wholesale').length;

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.businessName?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = !typeFilter || customer.customerType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, typeFilter]);

  // Get customer stats from invoices
  const getCustomerStats = (customerId: string) => {
    const customerInvoices = mockInvoices.filter((inv) => inv.customerId === customerId);
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    return {
      invoiceCount: customerInvoices.length,
      totalSpent,
    };
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Modal handlers
  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      businessName: customer.businessName || '',
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      customerType: customer.customerType,
      creditLimit: customer.creditLimit || 0,
      isActive: customer.isActive,
    });
    setEditMode(true);
    setShowAddModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditMode(false);
    setSelectedCustomer(null);
    setShowAddModal(false);
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (editMode && selectedCustomer) {
      // Update existing customer
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                name: formData.name,
                businessName: formData.businessName || undefined,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                customerType: formData.customerType,
                creditLimit: formData.creditLimit,
                isActive: formData.isActive,
              }
            : c
        )
      );
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: `C${String(customers.length + 1).padStart(3, '0')}`,
        name: formData.name,
        businessName: formData.businessName || undefined,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        registrationDate: new Date().toISOString().split('T')[0],
        totalPurchased: 0,
        customerType: formData.customerType,
        isActive: formData.isActive,
        creditLimit: formData.creditLimit,
        creditBalance: 0,
      };
      setCustomers((prev) => [...prev, newCustomer]);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (selectedCustomer) {
      setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    }
  };

  const getCustomerTypeIcon = (type: CustomerType) => {
    switch (type) {
      case 'vip':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'wholesale':
        return <Star className="w-4 h-4 text-purple-400" />;
      case 'credit':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getCustomerTypeBadge = (type: CustomerType) => {
    switch (type) {
      case 'vip':
        return <Badge variant="gold">VIP</Badge>;
      case 'wholesale':
        return <Badge variant="info">Wholesale</Badge>;
      case 'credit':
        return <Badge variant="warning">Credit</Badge>;
      default:
        return <Badge variant="default">Retail</Badge>;
    }
  };

  const getCustomerTypeLabel = (type: CustomerType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Customers</h1>
          <p className="mt-1 text-slate-400">Manage your customer database</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Customers</p>
              <p className="text-2xl font-bold text-slate-100">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">VIP Customers</p>
              <p className="text-2xl font-bold text-slate-100">{vipCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Star className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Wholesale</p>
              <p className="text-2xl font-bold text-slate-100">{wholesaleCustomers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="lg:w-48"
            >
              <option value="">All Types</option>
              {customerTypes.map((type) => (
                <option key={type} value={type}>
                  {getCustomerTypeLabel(type)}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Purchased</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-right">Credit Balance</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer.id);
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-400">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-200">{customer.name}</p>
                            {getCustomerTypeIcon(customer.customerType)}
                          </div>
                          {customer.businessName ? (
                            <p className="text-xs text-slate-400">{customer.businessName}</p>
                          ) : (
                            <p className="text-xs text-slate-400">{customer.city}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone className="w-3 h-3" />
                          {formatPhone(customer.phone)}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCustomerTypeBadge(customer.customerType)}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-200">
                      {formatCurrency(stats.totalSpent)}
                    </TableCell>
                    <TableCell className="text-center text-slate-300">
                      {stats.invoiceCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={customer.creditBalance && customer.creditBalance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                        {formatCurrency(customer.creditBalance || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewModal(customer)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(customer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(customer)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editMode ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Kamal Perera"
              required
            />
            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="e.g., Silva Jewellers (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g., 0771234567"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g., kamal@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Street address"
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="e.g., Colombo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Customer Type
              </label>
              <Select
                value={formData.customerType}
                onChange={(e) => handleInputChange('customerType', e.target.value)}
              >
                {customerTypes.map((type) => (
                  <option key={type} value={type}>
                    {getCustomerTypeLabel(type)}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-700">
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSubmit}>
              {editMode ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Customer Details"
        size="md"
      >
        {selectedCustomer && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">
                  {getInitials(selectedCustomer.name)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                  {getCustomerTypeBadge(selectedCustomer.customerType)}
                </div>
                {selectedCustomer.businessName && (
                  <p className="text-slate-400">{selectedCustomer.businessName}</p>
                )}
                <p className="text-sm text-slate-500">
                  Customer since {formatDate(selectedCustomer.registrationDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <p className="font-medium text-slate-200">{formatPhone(selectedCustomer.phone)}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="font-medium text-slate-200">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 col-span-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </div>
                <p className="font-medium text-slate-200">
                  {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.city}` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 text-center min-w-0">
                <p className="text-xs text-slate-400 mb-1">Total Purchased</p>
                <p className="text-sm font-bold text-slate-200 truncate">
                  {formatCurrency(selectedCustomer.totalPurchased)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center min-w-0">
                <p className="text-xs text-slate-400 mb-1">Credit Limit</p>
                <p className="text-sm font-bold text-slate-200 truncate">
                  {formatCurrency(selectedCustomer.creditLimit || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center min-w-0">
                <p className="text-xs text-slate-400 mb-1">Credit Balance</p>
                <p className={`text-sm font-bold truncate ${selectedCustomer.creditBalance && selectedCustomer.creditBalance > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {formatCurrency(selectedCustomer.creditBalance || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
        {selectedCustomer && (
          <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-700/50">
            <Button variant="ghost" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedCustomer);
              }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="font-medium text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-400">
                This will permanently delete "{selectedCustomer?.name}". This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
