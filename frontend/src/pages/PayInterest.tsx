import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Printer,
  DollarSign,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  CreditCard,
  Banknote,
  Receipt,
  TrendingDown,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Combobox } from '../components/ui/Combobox';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { mockPawnTickets } from '../data/mockData';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  calculatePreciseInterest,
  calculateRemainingInterestToMaturity,
  generateInterestReceiptNumber,
  formatTimeElapsed,
  formatPreciseInterestBreakdown,
  getPreciseTimeDifference,
} from '../utils/pawnCalculations';
import type { PawnTicket, PaymentMethod, InterestPayment } from '../types';

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: <DollarSign className="w-4 h-4" /> },
];

export function PayInterest() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State
  const [ticket, setTicket] = useState<PawnTicket | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaying, setAmountPaying] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<InterestPayment | null>(null);

  // Load ticket
  useEffect(() => {
    const foundTicket = mockPawnTickets.find(t => t.id === id);
    if (foundTicket) {
      setTicket(foundTicket);
    }
  }, [id]);

  // Update current time every minute for live calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Determine the start datetime for interest calculation
  // If there were previous payments, start from the last payment datetime
  // Otherwise, start from pawn date
  const interestStartDateTime = useMemo(() => {
    if (!ticket) return null;
    
    if (ticket.lastInterestPaidToDateTime) {
      return new Date(ticket.lastInterestPaidToDateTime);
    }
    
    // If no previous payments, start from pawn date at midnight
    const pawnDateTime = new Date(ticket.pawnDate);
    pawnDateTime.setHours(0, 0, 0, 0);
    return pawnDateTime;
  }, [ticket]);

  // Calculate interest up to current moment
  const calculation = useMemo(() => {
    if (!ticket || !interestStartDateTime) return null;

    return calculatePreciseInterest(
      ticket.principalAmount,
      interestStartDateTime,
      currentDateTime,
      ticket.interestRatePerMonth,
      ticket.interestPayments || []
    );
  }, [ticket, interestStartDateTime, currentDateTime]);

  // Calculate remaining interest to maturity (after this payment)
  const remainingToMaturity = useMemo(() => {
    if (!ticket) return null;

    // Maturity datetime - assume end of day
    const maturityDateTime = new Date(ticket.maturityDate);
    maturityDateTime.setHours(23, 59, 59, 999);

    return calculateRemainingInterestToMaturity(
      ticket.principalAmount,
      currentDateTime,
      maturityDateTime,
      ticket.interestRatePerMonth
    );
  }, [ticket, currentDateTime]);

  // Time elapsed since last payment
  const timeElapsed = useMemo(() => {
    if (!interestStartDateTime) return null;
    return getPreciseTimeDifference(interestStartDateTime, currentDateTime);
  }, [interestStartDateTime, currentDateTime]);

  // Interest breakdown for display
  const interestBreakdown = useMemo(() => {
    if (!calculation) return [];
    return formatPreciseInterestBreakdown(calculation);
  }, [calculation]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(amountPaying) || 0;

    if (!amountPaying || amount <= 0) {
      newErrors.amount = 'Please enter amount to pay';
    } else if (calculation && amount < calculation.outstandingInterest * 0.1) {
      // Minimum 10% of outstanding interest
      newErrors.amount = `Minimum payment is ${formatCurrency(calculation.outstandingInterest * 0.1)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amountPaying, calculation]);

  // Handle payment
  const handlePayment = useCallback(() => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  }, [validateForm]);

  // Confirm and process payment
  const processPayment = useCallback((print: boolean = false) => {
    if (!ticket || !calculation || !interestStartDateTime) return;

    setIsProcessing(true);

    const receiptNumber = generateInterestReceiptNumber();
    const amountPaid = parseFloat(amountPaying);
    const excessAmount = amountPaid > calculation.outstandingInterest 
      ? amountPaid - calculation.outstandingInterest 
      : 0;

    const interestPayment: InterestPayment = {
      id: `ip-${Date.now()}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      receiptNumber,
      
      paymentDateTime: currentDateTime.toISOString(),
      paymentMethod,
      
      periodStart: interestStartDateTime.toISOString(),
      periodEnd: currentDateTime.toISOString(),
      
      daysCharged: calculation.daysElapsed,
      hoursCharged: calculation.hoursElapsed,
      interestRate: ticket.interestRatePerMonth,
      
      principalAmount: ticket.principalAmount,
      interestDue: calculation.outstandingInterest,
      amountPaid,
      excessAmount: excessAmount > 0 ? excessAmount : undefined,
      
      customerName: ticket.customerName,
      customerNIC: ticket.customerNIC,
      customerPhone: ticket.customerPhone,
      
      processedBy: 'Admin',
      createdAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    // Store for printing
    localStorage.setItem('printInterestReceipt', JSON.stringify({
      receipt: interestPayment,
      ticket,
      calculation,
      remainingToMaturity,
    }));

    setGeneratedReceipt(interestPayment);
    setShowConfirmModal(false);
    setShowSuccessModal(true);

    if (print) {
      window.open(`/pawning/${ticket.id}/interest-receipt/${interestPayment.id}/print`, '_blank');
    }
  }, [ticket, calculation, interestStartDateTime, currentDateTime, paymentMethod, amountPaying, notes, remainingToMaturity]);

  // Auto-fill outstanding amount
  const handlePayFullInterest = useCallback(() => {
    if (calculation) {
      setAmountPaying(calculation.outstandingInterest.toFixed(2));
    }
  }, [calculation]);

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
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Ticket Not Active</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">This ticket has been {ticket.status}.</p>
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pay Interest</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ticket #: <span className="font-mono text-amber-600 dark:text-amber-400">{ticket.ticketNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="text-base px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            {currentDateTime.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
          <Badge variant="warning" className="text-base px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(currentDateTime.toISOString())}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket & Calculation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Customer Name</p>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{ticket.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">NIC Number</p>
                    <p className="text-slate-800 dark:text-slate-200">{ticket.customerNIC}</p>
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
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Principal Amount</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(ticket.principalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Interest Rate</p>
                    <p className="text-slate-800 dark:text-slate-200">{ticket.interestRatePerMonth}% per month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previous Interest Payments */}
          {ticket.interestPayments && ticket.interestPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-500" />
                  Previous Interest Payments
                </CardTitle>
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
                          <p className="text-xs text-slate-500">{formatDate(payment.paymentDateTime)}</p>
                        </div>
                      </div>
                      <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(payment.amountPaid)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Interest Paid</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(ticket.interestPaid)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interest Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                Interest Calculation (Real-Time)
              </CardTitle>
              <CardDescription>
                Calculating interest from{' '}
                {ticket.lastInterestPaidToDateTime
                  ? formatDate(ticket.lastInterestPaidToDateTime) + ' ' + new Date(ticket.lastInterestPaidToDateTime).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
                  : formatDate(ticket.pawnDate)}{' '}
                to now
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculation && timeElapsed && (
                <div className="space-y-4">
                  {/* Time Elapsed */}
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-5 h-5 text-blue-500" />
                      <p className="font-medium text-blue-700 dark:text-blue-300">Time Elapsed Since Last Payment</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatTimeElapsed(timeElapsed.days, timeElapsed.hours, timeElapsed.minutes)}
                    </p>
                  </div>

                  {/* Breakdown */}
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

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                      <p className="text-xs text-purple-600 dark:text-purple-400">Total Interest Accrued</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(calculation.totalInterest)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                      <p className="text-xs text-green-600 dark:text-green-400">Previously Paid</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(calculation.previousPaymentsTotal)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-400">Outstanding Interest</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(calculation.outstandingInterest)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                      <p className="text-xs text-red-600 dark:text-red-400">Full Redemption Amount</p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(ticket.principalAmount + calculation.outstandingInterest)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remaining Interest to Maturity */}
          {remainingToMaturity && remainingToMaturity.remainingInterest > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-amber-500" />
                  Interest After This Payment (To Maturity)
                </CardTitle>
                <CardDescription>
                  If you pay now, remaining interest from now to maturity ({formatDate(ticket.maturityDate)})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-amber-600 dark:text-amber-400">Time Remaining to Maturity</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {formatTimeElapsed(
                          remainingToMaturity.timeRemaining.days,
                          remainingToMaturity.timeRemaining.hours,
                          remainingToMaturity.timeRemaining.minutes
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-amber-600 dark:text-amber-400">Additional Interest to Maturity</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(remainingToMaturity.remainingInterest)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-500/20">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <Info className="w-3 h-3 inline mr-1" />
                      This amount will continue accruing if not redeemed before maturity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Payment Form */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-500/20">
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
                Make Interest Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Outstanding Interest */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">Interest Due Now</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {calculation ? formatCurrency(calculation.outstandingInterest) : '-'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  onClick={handlePayFullInterest}
                >
                  Pay Full Amount
                </Button>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <Combobox
                  options={paymentMethodOptions.map(m => ({ value: m.value, label: m.label }))}
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  placeholder="Select method..."
                />
              </div>

              {/* Amount Paying */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Amount Paying <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaying}
                  onChange={(e) => setAmountPaying(e.target.value)}
                  placeholder="Enter amount..."
                  error={!!errors.amount}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Interest Payment
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/pawning/redeem/${ticket.id}`)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Full Redemption Instead
                </Button>
              </div>

              {/* Info */}
              <div className="text-xs text-slate-500 space-y-1 p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                <p className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                  <Info className="w-3 h-3" /> Partial Payment Info:
                </p>
                <p>• Pay interest only; principal remains with us</p>
                <p>• Interest resets from payment time</p>
                <p>• Receipt issued for each payment</p>
                <p>• Final bill at full redemption</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Interest Payment"
      >
        <ModalContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Ticket Number</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.ticketNumber}</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Customer</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Interest Due</p>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    {calculation ? formatCurrency(calculation.outstandingInterest) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Amount Paying</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(parseFloat(amountPaying) || 0)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This will record an interest payment and reset the interest accrual period from this moment.
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => processPayment(false)}>
            Confirm
          </Button>
          <Button variant="primary" onClick={() => processPayment(true)}>
            <Printer className="w-4 h-4 mr-2" />
            Confirm & Print
          </Button>
        </ModalFooter>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/pawning');
        }}
        title="Payment Recorded"
      >
        <ModalContent>
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Interest Payment Successful
            </h3>
            {generatedReceipt && (
              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-400">
                  Receipt Number: <span className="font-mono text-amber-600 dark:text-amber-400">{generatedReceipt.receiptNumber}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Amount: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(generatedReceipt.amountPaid)}</span>
                </p>
              </div>
            )}
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => navigate('/pawning')}>
            Back to Pawning
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (generatedReceipt) {
                window.open(`/pawning/${ticket.id}/interest-receipt/${generatedReceipt.id}/print`, '_blank');
              }
            }}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
