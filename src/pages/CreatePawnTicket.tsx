import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Calculator,
  Printer,
  Save,
  ArrowLeft,
  Scale,
  Coins,
  User,
  Phone,
  MapPin,
  CreditCard,
  Info,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Combobox } from '../components/ui/Combobox';
import { DateCombobox } from '../components/ui/DateCombobox';
import { mockCustomers, mockPawnInterestConfigs } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import {
  calculateLoanAmount,
  calculateMaturityDate,
  getKaratPurity,
  generateTicketNumber,
  estimateInterestForPeriod,
} from '../utils/pawnCalculations';
import type { PawnedItem, MetalType, GoldKarat } from '../types';

// Options for dropdowns
const metalTypeOptions = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'platinum', label: 'Platinum' },
];

const karatOptions = [
  { value: '24K', label: '24K (99.9%)', description: 'Pure Gold' },
  { value: '22K', label: '22K (91.67%)', description: 'Traditional Jewelry' },
  { value: '21K', label: '21K (87.5%)', description: 'Middle Eastern' },
  { value: '18K', label: '18K (75%)', description: 'European Standard' },
  { value: '14K', label: '14K (58.33%)', description: 'Affordable' },
  { value: '10K', label: '10K (41.67%)', description: 'Budget' },
  { value: '9K', label: '9K (37.5%)', description: 'Entry Level' },
];

const conditionOptions = [
  { value: 'excellent', label: 'Excellent', description: 'Like new condition' },
  { value: 'good', label: 'Good', description: 'Minor wear' },
  { value: 'fair', label: 'Fair', description: 'Visible wear' },
  { value: 'poor', label: 'Poor', description: 'Significant damage' },
];

const itemTypeOptions = [
  { value: 'Chain', label: 'Chain' },
  { value: 'Necklace', label: 'Necklace' },
  { value: 'Ring', label: 'Ring' },
  { value: 'Bangle', label: 'Bangle' },
  { value: 'Bracelet', label: 'Bracelet' },
  { value: 'Earrings', label: 'Earrings' },
  { value: 'Pendant', label: 'Pendant' },
  { value: 'Anklet', label: 'Anklet' },
  { value: 'Nose Pin', label: 'Nose Pin' },
  { value: 'Coin', label: 'Coin/Bar' },
  { value: 'Other', label: 'Other' },
];

const loanPeriodOptions = [
  { value: '1', label: '1 Month' },
  { value: '2', label: '2 Months' },
  { value: '3', label: '3 Months' },
  { value: '6', label: '6 Months' },
  { value: '12', label: '12 Months' },
];

// Default market rates per gram (configurable)
const DEFAULT_GOLD_RATES: Record<string, number> = {
  '24K': 20500,
  '22K': 18500,
  '21K': 17500,
  '18K': 15000,
  '14K': 12000,
  '10K': 8500,
  '9K': 7500,
};

interface PawnItemForm extends Omit<PawnedItem, 'id' | 'valuedAmount' | 'purityPercentage'> {
  id: string;
}

const createEmptyItem = (): PawnItemForm => ({
  id: `item-${Date.now()}`,
  itemType: '',
  description: '',
  metalType: 'gold',
  karat: '22K',
  grossWeight: 0,
  netWeight: 0,
  marketRate: DEFAULT_GOLD_RATES['22K'],
  hasGemstones: false,
  gemstoneDescription: '',
  gemstoneDeductionWeight: 0,
  condition: 'good',
  conditionNotes: '',
});

export function CreatePawnTicket() {
  const navigate = useNavigate();
  
  // Get default config
  const defaultConfig = mockPawnInterestConfigs.find(c => c.isDefault) || mockPawnInterestConfigs[0];
  
  // Form state
  const [ticketNumber] = useState(generateTicketNumber());
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNIC, setCustomerNIC] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pawnDate, setPawnDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanPeriodMonths, setLoanPeriodMonths] = useState('3');
  const [interestRate, setInterestRate] = useState(defaultConfig.ratePerMonth.toString());
  const [ltvRatio, setLtvRatio] = useState((defaultConfig.loanToValueRatio * 100).toString());
  const [items, setItems] = useState<PawnItemForm[]>([createEmptyItem()]);
  const [manualPrincipal, setManualPrincipal] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Customer options for combobox
  const customerOptions = useMemo(() => {
    return mockCustomers.map(c => ({
      value: c.id,
      label: c.name,
      description: c.phone,
    }));
  }, []);

  // Calculate totals
  const calculations = useMemo(() => {
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalValuation = 0;

    items.forEach(item => {
      totalGrossWeight += item.grossWeight || 0;
      const netWt = item.netWeight || item.grossWeight || 0;
      totalNetWeight += netWt;
      
      const purity = getKaratPurity(item.karat);
      const pureWeight = netWt * (purity / 100);
      const value = pureWeight * (item.marketRate || 0);
      totalValuation += value;
    });

    const ltvRatioNum = parseFloat(ltvRatio) / 100 || defaultConfig.loanToValueRatio;
    const suggestedLoan = calculateLoanAmount(totalValuation, ltvRatioNum);
    const principalAmount = manualPrincipal ? parseFloat(manualPrincipal) : suggestedLoan;
    
    const maturityDate = calculateMaturityDate(pawnDate, parseInt(loanPeriodMonths));
    
    const interestRateNum = parseFloat(interestRate) || defaultConfig.ratePerMonth;
    const interestEstimate = estimateInterestForPeriod(
      principalAmount,
      parseInt(loanPeriodMonths),
      interestRateNum
    );

    return {
      totalGrossWeight,
      totalNetWeight,
      totalValuation,
      suggestedLoan,
      principalAmount,
      maturityDate: maturityDate.toISOString().split('T')[0],
      interestEstimate,
      ltvRatioNum,
      interestRateNum,
    };
  }, [items, ltvRatio, manualPrincipal, pawnDate, loanPeriodMonths, interestRate, defaultConfig]);

  // Handle customer selection
  const handleCustomerSelect = useCallback((value: string) => {
    setCustomerId(value);
    const customer = mockCustomers.find(c => c.id === value);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerAddress(`${customer.address}, ${customer.city}`);
      setCustomerNIC(customer.nic || '');
    }
  }, []);

  // Handle item changes
  const handleItemChange = useCallback((index: number, field: keyof PawnItemForm, value: unknown) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-update market rate when karat changes
      if (field === 'karat' && typeof value === 'string') {
        updated[index].marketRate = DEFAULT_GOLD_RATES[value] || DEFAULT_GOLD_RATES['22K'];
      }
      
      // Auto-calculate net weight
      if (field === 'grossWeight' || field === 'gemstoneDeductionWeight') {
        const gross = field === 'grossWeight' ? (value as number) : updated[index].grossWeight;
        const deduction = field === 'gemstoneDeductionWeight' ? (value as number) : (updated[index].gemstoneDeductionWeight || 0);
        updated[index].netWeight = Math.max(0, gross - deduction);
      }
      
      return updated;
    });
  }, []);

  // Add new item
  const handleAddItem = useCallback(() => {
    setItems(prev => [...prev, createEmptyItem()]);
  }, []);

  // Remove item
  const handleRemoveItem = useCallback((index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  }, [items.length]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!customerNIC.trim()) newErrors.customerNIC = 'NIC is required for pawning';
    if (!customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    if (!customerAddress.trim()) newErrors.customerAddress = 'Address is required';
    
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, index) => {
        if (!item.itemType) newErrors[`item_${index}_type`] = 'Item type required';
        if (!item.grossWeight || item.grossWeight <= 0) newErrors[`item_${index}_weight`] = 'Valid weight required';
      });
    }

    if (calculations.principalAmount <= 0) {
      newErrors.principal = 'Loan amount must be greater than 0';
    }

    if (calculations.principalAmount > calculations.totalValuation) {
      newErrors.principal = 'Loan amount cannot exceed valuation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerName, customerNIC, customerPhone, customerAddress, items, calculations]);

  // Handle save
  const handleSave = useCallback((print: boolean = false) => {
    if (!validateForm()) return;

    const pawnTicket = {
      id: `pawn-${Date.now()}`,
      ticketNumber,
      customerId: customerId || undefined,
      customerName,
      customerNIC,
      customerPhone,
      customerAddress,
      items: items.map(item => ({
        ...item,
        purityPercentage: getKaratPurity(item.karat),
        valuedAmount: (item.netWeight || item.grossWeight) * (getKaratPurity(item.karat) / 100) * item.marketRate,
      })),
      totalGrossWeight: calculations.totalGrossWeight,
      totalNetWeight: calculations.totalNetWeight,
      totalValuation: calculations.totalValuation,
      loanToValueRatio: calculations.ltvRatioNum,
      principalAmount: calculations.principalAmount,
      interestRatePerMonth: calculations.interestRateNum,
      pawnDate,
      maturityDate: calculations.maturityDate,
      gracePeriodDays: defaultConfig.gracePeriodDays,
      status: 'active' as const,
      interestPaid: 0,
      internalNotes: internalNotes || undefined,
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store for print
    localStorage.setItem('printPawnTicket', JSON.stringify(pawnTicket));

    if (print) {
      window.open(`/pawning/${pawnTicket.id}/print`, '_blank');
    }

    // Navigate back to list
    navigate('/pawning');
  }, [validateForm, ticketNumber, customerId, customerName, customerNIC, customerPhone, customerAddress, items, calculations, pawnDate, defaultConfig, internalNotes, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pawning')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">New Pawn Ticket</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ticket #: <span className="font-mono text-amber-600 dark:text-amber-400">{ticketNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/pawning')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSave(true)}>
            <Printer className="w-4 h-4 mr-2" />
            Save & Print
          </Button>
          <Button variant="primary" onClick={() => handleSave(false)}>
            <Save className="w-4 h-4 mr-2" />
            Save Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Search existing customer or enter new details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox
                  label="Search Customer"
                  options={customerOptions}
                  value={customerId}
                  onChange={handleCustomerSelect}
                  placeholder="Search by name or phone..."
                  clearable
                />
                <Input
                  label="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  error={!!errors.customerName}
                  icon={<User className="w-4 h-4" />}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NIC Number"
                  value={customerNIC}
                  onChange={(e) => setCustomerNIC(e.target.value)}
                  placeholder="e.g., 901234567V"
                  required
                  error={!!errors.customerNIC}
                  icon={<CreditCard className="w-4 h-4" />}
                />
                <Input
                  label="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  required
                  error={!!errors.customerPhone}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>
              <Input
                label="Address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Full address"
                required
                error={!!errors.customerAddress}
                icon={<MapPin className="w-4 h-4" />}
              />
              {errors.customerNIC && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.customerNIC}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pawned Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-500" />
                    Pawned Items
                  </CardTitle>
                  <CardDescription>
                    Add gold items to be pawned with weight and valuation
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Combobox
                      label="Item Type"
                      options={itemTypeOptions}
                      value={item.itemType}
                      onChange={(value) => handleItemChange(index, 'itemType', value)}
                      placeholder="Select type"
                      required
                    />
                    <Combobox
                      label="Metal Type"
                      options={metalTypeOptions}
                      value={item.metalType}
                      onChange={(value) => handleItemChange(index, 'metalType', value as MetalType)}
                      placeholder="Select metal"
                    />
                    <Combobox
                      label="Karat"
                      options={karatOptions}
                      value={item.karat}
                      onChange={(value) => handleItemChange(index, 'karat', value as GoldKarat)}
                      placeholder="Select karat"
                    />
                  </div>

                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="e.g., 22K Gold rope chain, 24 inches"
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      label="Gross Weight (g)"
                      type="number"
                      step="0.01"
                      value={item.grossWeight || ''}
                      onChange={(e) => handleItemChange(index, 'grossWeight', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                      error={!!errors[`item_${index}_weight`]}
                    />
                    <Input
                      label="Stone Deduction (g)"
                      type="number"
                      step="0.01"
                      value={item.gemstoneDeductionWeight || ''}
                      onChange={(e) => handleItemChange(index, 'gemstoneDeductionWeight', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <Input
                      label="Net Weight (g)"
                      type="number"
                      step="0.01"
                      value={item.netWeight || item.grossWeight || ''}
                      onChange={(e) => handleItemChange(index, 'netWeight', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled
                      className="bg-slate-200 dark:bg-slate-700/30 text-slate-500 placeholder-slate-400 px-6 py-2"
                    />
                    <Input
                      label="Market Rate/g"
                      type="number"
                      value={item.marketRate || ''}
                      onChange={(e) => handleItemChange(index, 'marketRate', parseFloat(e.target.value) || 0)}
                      placeholder="18500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Combobox
                      label="Condition"
                      options={conditionOptions}
                      value={item.condition}
                      onChange={(value) => handleItemChange(index, 'condition', value)}
                      placeholder="Select condition"
                    />
                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.hasGemstones}
                            onChange={(e) => handleItemChange(index, 'hasGemstones', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Has Gemstones</span>
                        </label>
                        {item.hasGemstones && (
                          <Input
                            value={item.gemstoneDescription || ''}
                            onChange={(e) => handleItemChange(index, 'gemstoneDescription', e.target.value)}
                            placeholder="Describe gemstones..."
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Item valuation display */}
                  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-right">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Valued Amount: </span>
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(
                          (item.netWeight || item.grossWeight || 0) * 
                          (getKaratPurity(item.karat) / 100) * 
                          (item.marketRate || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {errors.items && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.items}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal notes (not printed on ticket)..."
                className="w-full h-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Loan Configuration & Summary */}
        <div className="space-y-6">
          {/* Loan Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Loan Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateCombobox
                label="Pawn Date"
                value={pawnDate}
                onChange={(value) => setPawnDate(value)}
                required
              />
              
              <Combobox
                label="Loan Period"
                options={loanPeriodOptions}
                value={loanPeriodMonths}
                onChange={(value) => setLoanPeriodMonths(value)}
                placeholder="Select period"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Interest Rate (%)"
                  type="number"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="5"
                />
                <Input
                  label="LTV Ratio (%)"
                  type="number"
                  step="5"
                  value={ltvRatio}
                  onChange={(e) => setLtvRatio(e.target.value)}
                  placeholder="70"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Maturity Date</p>
                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  {new Date(calculations.maturityDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  + {defaultConfig.gracePeriodDays} days grace period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                Valuation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Items</span>
                <span className="text-slate-800 dark:text-slate-200">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Gross Weight</span>
                <span className="text-slate-800 dark:text-slate-200">{formatWeight(calculations.totalGrossWeight)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Net Weight</span>
                <span className="text-slate-800 dark:text-slate-200">{formatWeight(calculations.totalNetWeight)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Total Valuation</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(calculations.totalValuation)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">LTV Ratio</span>
                <span className="text-slate-800 dark:text-slate-200">{(calculations.ltvRatioNum * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Suggested Loan</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(calculations.suggestedLoan)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <Input
                  label="Loan Amount (Principal)"
                  type="number"
                  value={manualPrincipal || calculations.suggestedLoan}
                  onChange={(e) => setManualPrincipal(e.target.value)}
                  placeholder={calculations.suggestedLoan.toString()}
                  error={!!errors.principal}
                />
                {errors.principal && (
                  <p className="text-red-400 text-xs mt-1">{errors.principal}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interest Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Interest Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-2">At Maturity ({loanPeriodMonths} month{parseInt(loanPeriodMonths) > 1 ? 's' : ''})</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Principal</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(calculations.principalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Interest ({calculations.interestEstimate.effectiveRate}%)</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(calculations.interestEstimate.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Total Payable</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{formatCurrency(calculations.interestEstimate.totalPayable)}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Interest calculated at {calculations.interestRateNum}% per month
                </p>
                <p>• 5% applies even for 1 day (first month)</p>
                <p>• Pro-rata daily after first month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
