import { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockSuppliers, mockGRNs } from '../data/mockData';
import { formatCurrency, formatPhone, formatDate } from '../utils/formatters';
import type { Supplier } from '../types';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Supplier>>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    bankAccount: '',
    bankName: '',
    paymentTerms: 'net30',
    creditLimit: 0,
    currentBalance: 0,
    notes: '',
    isActive: true,
  });

  // Get unique countries
  const countries = [...new Set(suppliers.map((s) => s.country))].filter(Boolean);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCountry = !countryFilter || supplier.country === countryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [suppliers, searchQuery, countryFilter]);

  // Calculate supplier statistics
  const getSupplierStats = (supplierId: string) => {
    const supplierGRNs = mockGRNs.filter((grn) => grn.supplierId === supplierId);
    const totalPurchases = supplierGRNs.reduce((sum, grn) => sum + grn.total, 0);
    const grnCount = supplierGRNs.length;
    return { totalPurchases, grnCount };
  };

  // Stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const totalCreditUsed = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  const handleInputChange = (field: keyof Supplier, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (editMode && selectedSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === selectedSupplier.id ? { ...s, ...formData, updatedAt: new Date().toISOString() } : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        ...formData,
        id: `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Supplier;
      setSuppliers((prev) => [...prev, newSupplier]);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (selectedSupplier) {
      setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
      setShowDeleteModal(false);
      setSelectedSupplier(null);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      taxId: '',
      bankAccount: '',
      bankName: '',
      paymentTerms: 'net30',
      creditLimit: 0,
      currentBalance: 0,
      notes: '',
      isActive: true,
    });
    setShowAddModal(false);
    setEditMode(false);
    setSelectedSupplier(null);
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData(supplier);
    setEditMode(true);
    setShowAddModal(true);
  };

  const openViewModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const openDeleteModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Suppliers</h1>
          <p className="mt-1 text-slate-400">Manage your supplier network</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Suppliers</p>
              <p className="text-2xl font-bold text-slate-100">{totalSuppliers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Suppliers</p>
              <p className="text-2xl font-bold text-slate-100">{activeSuppliers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Payables</p>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalCreditUsed)}</p>
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
                  placeholder="Search by company, contact, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="lg:w-48"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead className="text-center">GRNs</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => {
                const stats = getSupplierStats(supplier.id);
                return (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{supplier.companyName}</p>
                          {supplier.taxId && (
                            <p className="text-xs text-slate-400">Tax ID: {supplier.taxId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contactPerson && (
                          <p className="text-sm text-slate-200">{supplier.contactPerson}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          {formatPhone(supplier.phone)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Globe className="w-3 h-3" />
                        {supplier.city}, {supplier.country}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-200">
                      {formatCurrency(stats.totalPurchases)}
                    </TableCell>
                    <TableCell className="text-center text-slate-300">
                      {stats.grnCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={supplier.isActive ? 'success' : 'error'}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewModal(supplier)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(supplier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(supplier)}
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
          {filteredSuppliers.length === 0 && (
            <div className="p-8 text-center">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No suppliers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editMode ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
      >
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="e.g., Gold Imports Ltd"
              required
            />
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              placeholder="e.g., Mr. Sharma"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g., +91 9876543210"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g., contact@supplier.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder="e.g., Mumbai"
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="e.g., India"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Tax ID"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder="e.g., GST12345678"
            />
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="e.g., State Bank"
            />
            <Input
              label="Bank Account"
              value={formData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              placeholder="Account number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Terms
              </label>
              <Select
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              >
                <option value="immediate">Immediate</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net45">Net 45</option>
                <option value="net60">Net 60</option>
              </Select>
            </div>
            <Input
              label="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value))}
              placeholder="0"
            />
            <div className="flex items-center pb-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-300">Active Supplier</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this supplier..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-700">
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSubmit}>
              {editMode ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Supplier Details"
        size="md"
      >
        {selectedSupplier && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedSupplier.companyName}</h3>
                {selectedSupplier.contactPerson && (
                  <p className="text-slate-400">Contact: {selectedSupplier.contactPerson}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <p className="font-medium text-slate-200">{formatPhone(selectedSupplier.phone)}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="font-medium text-slate-200">{selectedSupplier.email || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 col-span-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </div>
                <p className="font-medium text-slate-200">
                  {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.country}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Tax ID</p>
                <p className="font-medium text-slate-200">{selectedSupplier.taxId || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Payment Terms</p>
                <p className="font-medium text-slate-200">
                  {selectedSupplier.paymentTerms?.replace('net', 'Net ')}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Bank</p>
                <p className="font-medium text-slate-200">{selectedSupplier.bankName || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Account</p>
                <p className="font-medium text-slate-200">{selectedSupplier.bankAccount || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 text-center min-w-0">
                <p className="text-xs text-slate-400 mb-1">Credit Limit</p>
                <p className="text-sm font-bold text-slate-200 truncate">
                  {formatCurrency(selectedSupplier.creditLimit || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center min-w-0">
                <p className="text-xs text-slate-400 mb-1">Current Balance</p>
                <p className="text-sm font-bold text-amber-400 truncate">
                  {formatCurrency(selectedSupplier.currentBalance || 0)}
                </p>
              </div>
            </div>

            {selectedSupplier.notes && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400 mb-1">Notes</p>
                <p className="text-slate-200">{selectedSupplier.notes}</p>
              </div>
            )}
          </div>
        )}
        {selectedSupplier && (
          <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-700/50">
            <Button variant="ghost" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedSupplier);
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
        title="Delete Supplier"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="font-medium text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-400">
                This will permanently delete "{selectedSupplier?.companyName}". This action cannot be undone.
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
