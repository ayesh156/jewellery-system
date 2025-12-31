import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
  Printer,
  Camera,
  Wrench,
  Scale,
  AlertCircle,
  Gem,
  Calendar,
  FileText,
  Calculator,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { mockCustomers } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { 
  RepairJob, 
  RepairItem, 
  RepairEstimate, 
  RepairType, 
  RepairPriority,
  MetalType,
  GoldKarat,
  Customer,
  StatusUpdate,
} from '../types';

const repairTypes: { value: RepairType; label: string }[] = [
  { value: 'resizing', label: 'Ring Resizing' },
  { value: 'polishing', label: 'Polishing & Cleaning' },
  { value: 'stone-setting', label: 'Stone Setting' },
  { value: 'stone-replacement', label: 'Stone Replacement' },
  { value: 'chain-repair', label: 'Chain Repair' },
  { value: 'clasp-repair', label: 'Clasp Repair' },
  { value: 'rhodium-plating', label: 'Rhodium Plating' },
  { value: 'cleaning', label: 'Deep Cleaning' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'custom-modification', label: 'Custom Modification' },
  { value: 'restoration', label: 'Antique Restoration' },
  { value: 'other', label: 'Other' },
];

const itemTypes = [
  'Ring', 'Necklace', 'Chain', 'Bracelet', 'Bangle', 'Earring', 
  'Pendant', 'Anklet', 'Nose Pin', 'Watch', 'Brooch', 'Other'
];

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'white-gold', 'rose-gold'];
const goldKarats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

interface ItemFormData {
  itemType: string;
  itemDescription: string;
  metalType: MetalType;
  karat?: GoldKarat;
  initialWeight: number;
  hasGemstones: boolean;
  gemstoneDescription: string;
  gemstoneCount: number;
  issueDescription: string;
  repairTypes: RepairType[];
}

const defaultItemForm: ItemFormData = {
  itemType: 'Ring',
  itemDescription: '',
  metalType: 'gold',
  karat: '22K',
  initialWeight: 0,
  hasGemstones: false,
  gemstoneDescription: '',
  gemstoneCount: 0,
  issueDescription: '',
  repairTypes: [],
};

export function CreateRepairJob() {
  const navigate = useNavigate();

  // Customer selection
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    nic: '',
  });

  // Items
  const [items, setItems] = useState<RepairItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormData>(defaultItemForm);

  // Job details
  const [priority, setPriority] = useState<RepairPriority>('normal');
  const [repairDescription, setRepairDescription] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(7);
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Estimate
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimate, setEstimate] = useState<RepairEstimate>({
    laborCost: 0,
    materialCost: 0,
    additionalMetalWeight: 0,
    additionalMetalRate: 0,
    additionalMetalCost: 0,
    gemstoneReplacementCost: 0,
    otherCosts: 0,
    otherCostsDescription: '',
    totalEstimate: 0,
  });

  // Advance payment
  const [advancePayment, setAdvancePayment] = useState(0);

  // Filtered customers
  const filteredCustomers = mockCustomers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    c.nic?.includes(customerSearch)
  );

  // Calculate estimate total
  const calculateEstimateTotal = useCallback(() => {
    const additionalMetalCost = (estimate.additionalMetalWeight || 0) * (estimate.additionalMetalRate || 0);
    const total = estimate.laborCost + estimate.materialCost + additionalMetalCost + 
                  (estimate.gemstoneReplacementCost || 0) + (estimate.otherCosts || 0);
    setEstimate(prev => ({ ...prev, additionalMetalCost, totalEstimate: total }));
  }, [estimate.laborCost, estimate.materialCost, estimate.additionalMetalWeight, estimate.additionalMetalRate, estimate.gemstoneReplacementCost, estimate.otherCosts]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const handleToggleRepairType = (type: RepairType) => {
    setItemForm(prev => ({
      ...prev,
      repairTypes: prev.repairTypes.includes(type)
        ? prev.repairTypes.filter(t => t !== type)
        : [...prev.repairTypes, type]
    }));
  };

  const handleAddItem = () => {
    if (!itemForm.itemType || itemForm.initialWeight <= 0 || itemForm.repairTypes.length === 0) {
      alert('Please fill in all required fields and select at least one repair type');
      return;
    }

    const newItem: RepairItem = {
      id: `item-${Date.now()}`,
      itemType: itemForm.itemType,
      itemDescription: itemForm.itemDescription,
      metalType: itemForm.metalType,
      karat: itemForm.karat,
      initialWeight: itemForm.initialWeight,
      hasGemstones: itemForm.hasGemstones,
      gemstoneDescription: itemForm.gemstoneDescription,
      gemstoneCount: itemForm.gemstoneCount,
      issueDescription: itemForm.issueDescription,
      repairTypes: itemForm.repairTypes,
    };

    setItems(prev => [...prev, newItem]);
    setItemForm(defaultItemForm);
    setShowItemModal(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const generateJobNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REP-${year}${month}-${random}`;
  };

  const getEstimatedCompletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + estimatedDays);
    return date.toISOString().split('T')[0];
  };

  const handleSaveJob = (printReceipt: boolean = false) => {
    // Validation
    if (customerMode === 'existing' && !selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (customerMode === 'new' && (!newCustomer.name || !newCustomer.phone)) {
      alert('Please enter customer name and phone number');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item for repair');
      return;
    }

    const customerName = customerMode === 'existing' ? selectedCustomer!.name : newCustomer.name;
    const customerPhone = customerMode === 'existing' ? selectedCustomer!.phone : newCustomer.phone;

    const job: RepairJob = {
      id: `job-${Date.now()}`,
      jobNumber: generateJobNumber(),
      customerId: customerMode === 'existing' ? selectedCustomer!.id : undefined,
      customerName,
      customerPhone,
      customerEmail: customerMode === 'existing' ? selectedCustomer!.email : newCustomer.email,
      customerAddress: customerMode === 'existing' ? selectedCustomer!.address : newCustomer.address,
      customerNIC: customerMode === 'existing' ? selectedCustomer!.nic : newCustomer.nic,
      items,
      repairDescription,
      priority,
      estimate: showEstimate ? estimate : undefined,
      estimateApproved: false,
      receivedDate: new Date().toISOString().split('T')[0],
      estimatedCompletionDate: getEstimatedCompletionDate(),
      advancePayment,
      paymentStatus: advancePayment > 0 ? 'partial' : 'pending',
      status: 'received',
      statusHistory: [{
        status: 'received',
        date: new Date().toISOString(),
        updatedBy: 'Admin',
        notes: 'Job created',
      }],
      customerNotes,
      internalNotes,
      receivedBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store job for printing
    localStorage.setItem('printRepairReceipt', JSON.stringify(job));

    if (printReceipt) {
      navigate(`/repairs/${job.id}/print`);
    } else {
      navigate('/repairs');
    }
  };

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.initialWeight, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/repairs')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Repair Job</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Generate repair receipt & job card</p>
          </div>
        </div>
        <Badge variant="warning" className="text-sm">
          <Clock className="w-4 h-4" />
          Est. {estimatedDays} days
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="relative z-30 overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible">
              {/* Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={customerMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomerMode('existing')}
                >
                  Existing Customer
                </Button>
                <Button
                  variant={customerMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomerMode('new')}
                >
                  New Customer
                </Button>
              </div>

              {customerMode === 'existing' ? (
                <>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-amber-500 dark:text-amber-400">
                            {selectedCustomer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{selectedCustomer.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCustomer.phone}</p>
                          {selectedCustomer.nic && (
                            <p className="text-xs text-slate-500">NIC: {selectedCustomer.nic}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Search by name, phone or NIC..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        icon={<User className="w-4 h-4" />}
                      />
                      {showCustomerDropdown && customerSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                  <span className="text-sm font-medium text-amber-500 dark:text-amber-400">
                                    {customer.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400">No customers found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Customer Name *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    icon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone Number *"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+94 77 123 4567"
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="NIC Number"
                    value={newCustomer.nic}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, nic: e.target.value }))}
                    placeholder="National ID"
                    icon={<CreditCard className="w-4 h-4" />}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items for Repair */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Items for Repair
              </CardTitle>
              <Button onClick={() => setShowItemModal(true)}>
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm mt-1">Click "Add Item" to add jewellery for repair</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-amber-500 dark:text-amber-400">{idx + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{item.itemType}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <Badge variant="outline" className="text-xs">{item.metalType}</Badge>
                              {item.karat && <Badge variant="warning" className="text-xs">{item.karat}</Badge>}
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">{formatWeight(item.initialWeight)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {item.itemDescription && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{item.itemDescription}</p>
                      )}

                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Issue Description</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{item.issueDescription}</p>
                      </div>

                      {item.hasGemstones && (
                        <div className="mb-3 p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                          <p className="text-xs text-pink-400">
                            <Gem className="w-3 h-3 inline mr-1" />
                            {item.gemstoneCount} gemstone(s): {item.gemstoneDescription}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {item.repairTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs capitalize">
                            {type.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Overall Repair Description</label>
                <textarea
                  value={repairDescription}
                  onChange={(e) => setRepairDescription(e.target.value)}
                  placeholder="Describe the overall repair work required..."
                  className="w-full h-24 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RepairPriority)}
                  >
                    <option value="normal">Normal (7-10 days)</option>
                    <option value="urgent">Urgent (3-5 days)</option>
                    <option value="express">Express (1-2 days)</option>
                  </Select>
                </div>
                <div>
                  <Input
                    label="Estimated Days"
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Notes</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special instructions from the customer..."
                  className="w-full h-20 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Internal Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes for internal use (not printed on receipt)..."
                  className="w-full h-20 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Estimate */}
        <div className="space-y-6">
          {/* Quick Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Job Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items Count */}
              <div className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-500/10 to-yellow-50 dark:to-yellow-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Items</span>
                  <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Weight</span>
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">{formatWeight(totalWeight)}</span>
                </div>
              </div>

              {/* Estimate Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">Add Estimate</span>
                <button
                  onClick={() => setShowEstimate(!showEstimate)}
                  className={`w-12 h-6 rounded-full transition-colors ${showEstimate ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${showEstimate ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Estimate Form */}
              {showEstimate && (
                <div className="space-y-3 p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Repair Estimate
                  </h4>
                  
                  <Input
                    label="Labor Cost"
                    type="number"
                    value={estimate.laborCost || ''}
                    onChange={(e) => setEstimate(prev => ({ ...prev, laborCost: Number(e.target.value) }))}
                    placeholder="0"
                  />
                  
                  <Input
                    label="Material Cost"
                    type="number"
                    value={estimate.materialCost || ''}
                    onChange={(e) => setEstimate(prev => ({ ...prev, materialCost: Number(e.target.value) }))}
                    placeholder="0"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Add. Metal (g)"
                      type="number"
                      step="0.001"
                      value={estimate.additionalMetalWeight || ''}
                      onChange={(e) => setEstimate(prev => ({ ...prev, additionalMetalWeight: Number(e.target.value) }))}
                      placeholder="0"
                    />
                    <Input
                      label="Rate/g"
                      type="number"
                      value={estimate.additionalMetalRate || ''}
                      onChange={(e) => setEstimate(prev => ({ ...prev, additionalMetalRate: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>

                  <Input
                    label="Stone Replacement"
                    type="number"
                    value={estimate.gemstoneReplacementCost || ''}
                    onChange={(e) => setEstimate(prev => ({ ...prev, gemstoneReplacementCost: Number(e.target.value) }))}
                    placeholder="0"
                  />

                  <Input
                    label="Other Costs"
                    type="number"
                    value={estimate.otherCosts || ''}
                    onChange={(e) => setEstimate(prev => ({ ...prev, otherCosts: Number(e.target.value) }))}
                    placeholder="0"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={calculateEstimateTotal}
                  >
                    Calculate Total
                  </Button>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex justify-between text-lg">
                      <span className="text-slate-700 dark:text-slate-300">Total Estimate</span>
                      <span className="font-bold text-amber-500 dark:text-amber-400">{formatCurrency(estimate.totalEstimate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advance Payment */}
              <div className="space-y-2">
                <Input
                  label="Advance Payment"
                  type="number"
                  value={advancePayment || ''}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  placeholder="0"
                />
                {advancePayment > 0 && showEstimate && estimate.totalEstimate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Balance Due</span>
                    <span className="text-red-600 dark:text-red-400">{formatCurrency(estimate.totalEstimate - advancePayment)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  className="w-full"
                  onClick={() => handleSaveJob(true)}
                  disabled={items.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Save & Print Receipt
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveJob(false)}
                  disabled={items.length === 0}
                >
                  <Save className="w-4 h-4" />
                  Save Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setItemForm(defaultItemForm);
        }}
        title="Add Item for Repair"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Item Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Type *</label>
              <Select
                value={itemForm.itemType}
                onChange={(e) => setItemForm(prev => ({ ...prev, itemType: e.target.value }))}
              >
                {itemTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metal Type</label>
              <Select
                value={itemForm.metalType}
                onChange={(e) => setItemForm(prev => ({ ...prev, metalType: e.target.value as MetalType }))}
              >
                {metalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Karat (if gold)</label>
              <Select
                value={itemForm.karat || ''}
                onChange={(e) => setItemForm(prev => ({ ...prev, karat: e.target.value as GoldKarat }))}
              >
                <option value="">Not Applicable</option>
                {goldKarats.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </Select>
            </div>
            <div>
              <Input
                label="Initial Weight (grams) *"
                type="number"
                step="0.001"
                value={itemForm.initialWeight || ''}
                onChange={(e) => setItemForm(prev => ({ ...prev, initialWeight: Number(e.target.value) }))}
                placeholder="0.000"
              />
            </div>
          </div>

          <div>
            <Input
              label="Item Description"
              value={itemForm.itemDescription}
              onChange={(e) => setItemForm(prev => ({ ...prev, itemDescription: e.target.value }))}
              placeholder="e.g., Traditional wedding band with engraving"
            />
          </div>

          {/* Gemstones */}
          <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={itemForm.hasGemstones}
                onChange={(e) => setItemForm(prev => ({ ...prev, hasGemstones: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Item has gemstones</label>
            </div>
            
            {itemForm.hasGemstones && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <Input
                    label="Number of Stones"
                    type="number"
                    min="1"
                    value={itemForm.gemstoneCount || ''}
                    onChange={(e) => setItemForm(prev => ({ ...prev, gemstoneCount: Number(e.target.value) }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Input
                    label="Stone Description"
                    value={itemForm.gemstoneDescription}
                    onChange={(e) => setItemForm(prev => ({ ...prev, gemstoneDescription: e.target.value }))}
                    placeholder="e.g., 1 carat blue sapphire"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Description *</label>
            <textarea
              value={itemForm.issueDescription}
              onChange={(e) => setItemForm(prev => ({ ...prev, issueDescription: e.target.value }))}
              placeholder="Describe the damage or issue with the item..."
              className="w-full h-20 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Repair Types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repair Type(s) Required *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {repairTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleToggleRepairType(type.value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    itemForm.repairTypes.includes(type.value)
                      ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/50 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  {itemForm.repairTypes.includes(type.value) ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-400 dark:border-slate-500" />
                  )}
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowItemModal(false);
                setItemForm(defaultItemForm);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
