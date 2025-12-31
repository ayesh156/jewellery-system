import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Printer,
  DollarSign,
  User,
  Calendar,
  Scale,
  Coins,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  CreditCard,
  Banknote,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Combobox } from '../components/ui/Combobox';
import { DateCombobox } from '../components/ui/DateCombobox';
import { mockPawnTickets } from '../data/mockData';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import {
  calculatePawnInterest,
  formatInterestBreakdown,
  getDaysBetween,
} from '../utils/pawnCalculations';
import type { PawnTicket, PaymentMethod } from '../types';

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'cheque', label: 'Cheque', icon: <DollarSign className="w-4 h-4" /> },
];

export function RedeemPawnTicket() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Find the pawn ticket
  const [ticket, setTicket] = useState<PawnTicket | null>(null);
  const [redemptionDate, setRedemptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Load ticket
  useEffect(() => {
    const foundTicket = mockPawnTickets.find(t => t.id === id);
    if (foundTicket) {
      setTicket(foundTicket);
    }
  }, [id]);

  // Calculate interest - accounting for last interest paid date if exists
  const calculation = useMemo(() => {
    if (!ticket) return null;
    
    // If customer has made partial interest payments, calculate from last payment
    const startDate = ticket.lastInterestPaidToDateTime 
      ? new Date(ticket.lastInterestPaidToDateTime).toISOString().split('T')[0]
      : ticket.pawnDate;
    
    return calculatePawnInterest(
      ticket.principalAmount,
      startDate,
      redemptionDate,
      ticket.interestRatePerMonth
    );
  }, [ticket, redemptionDate]);

  // Interest breakdown for display
  const interestBreakdown = useMemo(() => {
    if (!calculation) return [];
    return formatInterestBreakdown(calculation);
  }, [calculation]);

  // Total payable (accounting for any interest already paid)
  const totalPayable = useMemo(() => {
    if (!calculation || !ticket) return 0;
    return calculation.totalPayable - ticket.interestPaid;
  }, [calculation, ticket]);

  // Change calculation
  const change = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return received - totalPayable;
  }, [amountReceived, totalPayable]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const received = parseFloat(amountReceived) || 0;

    if (!amountReceived || received <= 0) {
      newErrors.amount = 'Please enter amount received';
    } else if (received < totalPayable) {
      newErrors.amount = `Amount must be at least ${formatCurrency(totalPayable)}`;
    }

    if (!redemptionDate) {
      newErrors.date = 'Redemption date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amountReceived, totalPayable, redemptionDate]);

  // Handle redemption
  const handleRedeem = useCallback((print: boolean = false) => {
    if (!validateForm() || !ticket || !calculation) return;

    setIsProcessing(true);

    const redemption = {
      id: `redeem-${Date.now()}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      customerNIC: ticket.customerNIC,
      principalAmount: ticket.principalAmount,
      interestCalculation: calculation,
      totalPayable,
      amountReceived: parseFloat(amountReceived),
      changeGiven: Math.max(0, change),
      paymentMethod,
      pawnDate: ticket.pawnDate,
      redemptionDate,
      processedBy: 'Admin',
      createdAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    // Store for printing
    localStorage.setItem('printRedemption', JSON.stringify({
      redemption,
      ticket,
    }));

    if (print) {
      window.open(`/pawning/redemption/${redemption.id}/print`, '_blank');
    }

    // Navigate back
    setTimeout(() => {
      navigate('/pawning');
    }, 100);
  }, [validateForm, ticket, calculation, totalPayable, amountReceived, change, paymentMethod, redemptionDate, notes, navigate]);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Ticket Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">The pawn ticket you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/pawning')}>
            Back to Pawning
          </Button>
        </div>
      </div>
    );
  }

  if (ticket.status !== 'active' && ticket.status !== 'extended') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Already Redeemed</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">This ticket has already been {ticket.status}.</p>
          <Button variant="primary" onClick={() => navigate('/pawning')}>
            Back to Pawning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pawning')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Redeem Pawn Ticket</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ticket #: <span className="font-mono text-amber-600 dark:text-amber-400">{ticket.ticketNumber}</span>
            </p>
          </div>
        </div>
        <Badge variant="warning" className="text-base px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {getDaysBetween(new Date(ticket.pawnDate), new Date(redemptionDate))} Days
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Customer Name</p>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{ticket.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">NIC Number</p>
                    <p className="text-slate-800 dark:text-slate-200">{ticket.customerNIC}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                    <p className="text-slate-800 dark:text-slate-200">{ticket.customerPhone}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pawn Date</p>
                    <p className="text-slate-800 dark:text-slate-200">{formatDate(ticket.pawnDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Maturity Date</p>
                    <p className="text-slate-800 dark:text-slate-200">{formatDate(ticket.maturityDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Principal Amount</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(ticket.principalAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pawned Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                Pawned Items to Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticket.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.itemType}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">{item.karat}</span>
                          <span>Gross: {formatWeight(item.grossWeight)}</span>
                          <span>Net: {formatWeight(item.netWeight)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Valued at</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(item.valuedAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Items</p>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{ticket.items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Weight</p>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{formatWeight(ticket.totalNetWeight)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Valuation</p>
                  <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{formatCurrency(ticket.totalValuation)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previous Interest Payments - Show if any exist */}
          {ticket.interestPayments && ticket.interestPayments.length > 0 && (
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-500" />
                  Previous Interest Payments
                </CardTitle>
                <CardDescription>
                  Interest paid prior to this redemption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.interestPayments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{payment.receiptNumber}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(payment.paymentDateTime)} - Covered to{' '}
                            {new Date(payment.periodEnd).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(payment.amountPaid)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Interest Already Paid</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(ticket.interestPaid)}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Interest below is calculated from the last payment time: {ticket.lastInterestPaidToDateTime && formatDate(ticket.lastInterestPaidToDateTime)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interest Calculation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                Interest Calculation {ticket.interestPayments && ticket.interestPayments.length > 0 ? '(Remaining)' : 'Breakdown'}
              </CardTitle>
              <CardDescription>
                Interest rate: {ticket.interestRatePerMonth}% per month
                {ticket.lastInterestPaidToDateTime && (
                  <span className="ml-2 text-green-500">
                    • Calculating from last payment
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculation && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-2">
                      {interestBreakdown.map((line, index) => (
                        <p key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Days Elapsed</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{calculation.daysElapsed}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                      <p className="text-xs text-purple-600 dark:text-purple-400">Complete Months</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{calculation.monthsCompleted}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-400">Remaining Days</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{calculation.remainingDays}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                      <p className="text-xs text-green-600 dark:text-green-400">Daily Rate</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">{calculation.dailyRate.toFixed(4)}%</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                    <p className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                      <Info className="w-3 h-3" /> Interest Calculation Logic:
                    </p>
                    <p>1. First month: Full {ticket.interestRatePerMonth}% interest applies (even for 1 day)</p>
                    <p>2. Additional months: {ticket.interestRatePerMonth}% per complete month</p>
                    <p>3. Remaining days: Pro-rata at {calculation.dailyRate.toFixed(4)}%/day</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment */}
        <div className="space-y-6">
          {/* Redemption Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Redemption Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateCombobox
                value={redemptionDate}
                onChange={(value) => setRedemptionDate(value)}
                minDate={ticket.pawnDate}
                required
                error={!!errors.date}
                errorMessage={errors.date}
              />
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-amber-500/30">
            <CardHeader className="bg-amber-500/5">
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {calculation && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Principal Amount</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(ticket.principalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">First Month Interest</span>
                      <span className="text-slate-800 dark:text-slate-200">{formatCurrency(calculation.firstMonthInterest)}</span>
                    </div>
                    
                    {calculation.additionalMonthsInterest > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Additional Months Interest</span>
                        <span className="text-slate-800 dark:text-slate-200">{formatCurrency(calculation.additionalMonthsInterest)}</span>
                      </div>
                    )}
                    
                    {calculation.proratedDailyInterest > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Pro-rated Interest ({calculation.remainingDays} days)</span>
                        <span className="text-slate-800 dark:text-slate-200">{formatCurrency(calculation.proratedDailyInterest)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Total Interest</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(calculation.totalInterest)}</span>
                    </div>

                    {ticket.interestPaid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Interest Already Paid</span>
                        <span className="text-slate-800 dark:text-slate-200">- {formatCurrency(ticket.interestPaid)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-amber-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-slate-800 dark:text-slate-200">Total Payable</span>
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalPayable)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Receive Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Combobox
                label="Payment Method"
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as PaymentMethod)}
                placeholder="Select method"
              />

              <Input
                label="Amount Received"
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={totalPayable.toFixed(2)}
                error={!!errors.amount}
                icon={<DollarSign className="w-4 h-4" />}
              />
              {errors.amount && (
                <p className="text-red-400 text-sm">{errors.amount}</p>
              )}

              {parseFloat(amountReceived) > 0 && (
                <div className={`p-3 rounded-lg ${change >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex justify-between items-center">
                    <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {change >= 0 ? 'Change to Return' : 'Amount Short'}
                    </span>
                    <span className={`text-xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(Math.abs(change))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this redemption..."
                  className="w-full h-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => handleRedeem(true)}
              disabled={isProcessing || change < 0}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete Redemption & Print
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleRedeem(false)}
              disabled={isProcessing || change < 0}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Complete Redemption
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/pawning')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
