import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Scale,
  Coins,
  TrendingUp,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Combobox } from '../components/ui/Combobox';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { mockPawnTickets, mockPawnInterestConfigs } from '../data/mockData';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import { 
  calculatePawnInterest, 
  getDaysUntilMaturity, 
  isPawnOverdue,
  formatInterestBreakdown,
} from '../utils/pawnCalculations';
import type { PawnTicket, PawnStatus } from '../types';

const statusConfig: Record<PawnStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; icon: typeof CheckCircle }> = {
  active: { label: 'Active', variant: 'success', icon: Clock },
  redeemed: { label: 'Redeemed', variant: 'default', icon: CheckCircle },
  forfeited: { label: 'Forfeited', variant: 'error', icon: XCircle },
  auctioned: { label: 'Auctioned', variant: 'warning', icon: DollarSign },
  extended: { label: 'Extended', variant: 'info', icon: RefreshCw },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'extended', label: 'Extended' },
  { value: 'forfeited', label: 'Forfeited' },
  { value: 'auctioned', label: 'Auctioned' },
];

export function Pawning() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<PawnTicket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Get default interest rate
  const defaultConfig = mockPawnInterestConfigs.find(c => c.isDefault) || mockPawnInterestConfigs[0];

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return mockPawnTickets.filter((ticket) => {
      const matchesSearch =
        !searchQuery ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerNIC.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerPhone.includes(searchQuery);

      const matchesStatus = !statusFilter || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const activeTickets = mockPawnTickets.filter(t => t.status === 'active' || t.status === 'extended');
    const totalPrincipal = activeTickets.reduce((sum, t) => sum + t.principalAmount, 0);
    const totalWeight = activeTickets.reduce((sum, t) => sum + t.totalNetWeight, 0);
    
    let totalExpectedInterest = 0;
    activeTickets.forEach(ticket => {
      const calc = calculatePawnInterest(
        ticket.principalAmount,
        ticket.pawnDate,
        new Date().toISOString().split('T')[0],
        ticket.interestRatePerMonth
      );
      totalExpectedInterest += calc.totalInterest - ticket.interestPaid;
    });

    const overdueTickets = activeTickets.filter(t => isPawnOverdue(t.maturityDate, t.gracePeriodDays)).length;

    return {
      activeCount: activeTickets.length,
      totalPrincipal,
      totalWeight,
      totalExpectedInterest,
      overdueCount: overdueTickets,
    };
  }, []);

  const handleViewDetails = (ticket: PawnTicket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleRedeem = (ticket: PawnTicket) => {
    navigate(`/pawning/redeem/${ticket.id}`);
  };

  const handlePayInterest = (ticket: PawnTicket) => {
    navigate(`/pawning/pay-interest/${ticket.id}`);
  };

  const handlePrint = (ticket: PawnTicket) => {
    // Store ticket in localStorage for printing
    localStorage.setItem('printPawnTicket', JSON.stringify(ticket));
    window.open(`/pawning/${ticket.id}/print`, '_blank');
  };

  // Calculate current interest for a ticket
  const getCurrentInterest = (ticket: PawnTicket) => {
    if (ticket.status === 'redeemed') {
      return ticket.redemptionInterest || 0;
    }
    const calc = calculatePawnInterest(
      ticket.principalAmount,
      ticket.pawnDate,
      new Date().toISOString().split('T')[0],
      ticket.interestRatePerMonth
    );
    return calc.totalInterest - ticket.interestPaid;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pawning (Gold Loans)</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage gold loan tickets, redemptions, and interest calculations</p>
        </div>
        <Link to="/pawning/create">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            New Pawn Ticket
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Tickets</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Principal</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(summaryStats.totalPrincipal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Scale className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Gold Weight</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatWeight(summaryStats.totalWeight)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Accrued Interest</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(summaryStats.totalExpectedInterest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Overdue</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interest Rate Info */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Current Interest Rate:</span>
            <Badge variant="warning">{defaultConfig.ratePerMonth}% per month</Badge>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-600 dark:text-slate-400">LTV Ratio:</span>
            <Badge variant="info">{(defaultConfig.loanToValueRatio * 100).toFixed(0)}%</Badge>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-600 dark:text-slate-400">Grace Period:</span>
            <Badge variant="default">{defaultConfig.gracePeriodDays} days</Badge>
            <Link to="/settings" className="ml-auto text-amber-500 dark:text-amber-400 hover:text-amber-400 dark:hover:text-amber-300">
              Configure Rates →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by ticket #, customer, NIC, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Combobox
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filter by status"
                showAllOption={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pawn Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Current Interest</TableHead>
                <TableHead>Pawn Date</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status].icon;
                const daysToMaturity = getDaysUntilMaturity(ticket.maturityDate);
                const isOverdue = ticket.status === 'active' && isPawnOverdue(ticket.maturityDate, ticket.gracePeriodDays);
                const currentInterest = getCurrentInterest(ticket);

                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                        {ticket.ticketNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.customerName}</p>
                        <p className="text-xs text-slate-500">{ticket.customerNIC}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {ticket.items.map(i => i.itemType).join(', ')}
                        </p>
                        <p className="text-xs text-slate-500">{ticket.items.length} item(s)</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatWeight(ticket.totalNetWeight)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrency(ticket.principalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={currentInterest > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                        {formatCurrency(currentInterest)}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {formatDate(ticket.pawnDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}>
                          {formatDate(ticket.maturityDate)}
                        </span>
                        {ticket.status === 'active' && (
                          <span className={`text-xs ${
                            isOverdue ? 'text-red-600 dark:text-red-400' : 
                            daysToMaturity <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500'
                          }`}>
                            ({daysToMaturity > 0 ? `${daysToMaturity}d left` : `${Math.abs(daysToMaturity)}d overdue`})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[ticket.status].variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[ticket.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(ticket)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(ticket)}
                          title="Print Ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {(ticket.status === 'active' || ticket.status === 'extended') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePayInterest(ticket)}
                              title="Pay Interest"
                              className="text-amber-500 hover:text-amber-400"
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRedeem(ticket)}
                              title="Redeem"
                              className="text-green-500 hover:text-green-400"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    No pawn tickets found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Pawn Ticket: ${selectedTicket?.ticketNumber}`}
        size="xl"
      >
        {selectedTicket && (
          <>
            <ModalContent>
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Customer Details</h4>
                    <div className="space-y-1">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedTicket.customerName}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">NIC: {selectedTicket.customerNIC}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedTicket.customerPhone}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedTicket.customerAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Loan Details</h4>
                    <div className="space-y-1">
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="text-slate-600 dark:text-slate-400">Principal:</span>{' '}
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(selectedTicket.principalAmount)}</span>
                      </p>
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="text-slate-600 dark:text-slate-400">Interest Rate:</span>{' '}
                        {selectedTicket.interestRatePerMonth}% per month
                      </p>
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="text-slate-600 dark:text-slate-400">Pawn Date:</span>{' '}
                        {formatDate(selectedTicket.pawnDate)}
                      </p>
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="text-slate-600 dark:text-slate-400">Maturity:</span>{' '}
                        {formatDate(selectedTicket.maturityDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Pawned Items</h4>
                  <div className="space-y-2">
                    {selectedTicket.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{item.itemType}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                            <div className="flex gap-4 mt-1 text-xs text-slate-500">
                              <span>{item.karat} {item.metalType}</span>
                              <span>Gross: {formatWeight(item.grossWeight)}</span>
                              <span>Net: {formatWeight(item.netWeight)}</span>
                              <span>Condition: {item.condition}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(item.valuedAmount)}</p>
                            <p className="text-xs text-slate-500">Valued Amount</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interest Calculation */}
                {(selectedTicket.status === 'active' || selectedTicket.status === 'extended') && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Current Interest Calculation</h4>
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      {(() => {
                        const calc = calculatePawnInterest(
                          selectedTicket.principalAmount,
                          selectedTicket.pawnDate,
                          new Date().toISOString().split('T')[0],
                          selectedTicket.interestRatePerMonth
                        );
                        const breakdown = formatInterestBreakdown(calc);
                        return (
                          <div className="space-y-2">
                            {breakdown.map((line, i) => (
                              <p key={i} className="text-sm text-slate-700 dark:text-slate-300">{line}</p>
                            ))}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                              <p className="text-slate-800 dark:text-slate-200">
                                <span className="text-slate-600 dark:text-slate-400">Total Interest:</span>{' '}
                                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(calc.totalInterest)}</span>
                              </p>
                              {selectedTicket.interestPaid > 0 && (
                                <p className="text-slate-800 dark:text-slate-200">
                                  <span className="text-slate-600 dark:text-slate-400">Interest Paid:</span>{' '}
                                  <span className="font-semibold">{formatCurrency(selectedTicket.interestPaid)}</span>
                                </p>
                              )}
                              <p className="text-slate-800 dark:text-slate-200">
                                <span className="text-slate-600 dark:text-slate-400">Interest Due:</span>{' '}
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  {formatCurrency(calc.totalInterest - selectedTicket.interestPaid)}
                                </span>
                              </p>
                              <p className="text-lg text-slate-900 dark:text-slate-100 mt-2">
                                <span className="text-slate-600 dark:text-slate-400">Total Payable:</span>{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {formatCurrency(calc.totalPayable - selectedTicket.interestPaid)}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Extensions History */}
                {selectedTicket.extensions && selectedTicket.extensions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Extension History</h4>
                    <div className="space-y-2">
                      {selectedTicket.extensions.map((ext) => (
                        <div
                          key={ext.id}
                          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm text-slate-800 dark:text-slate-200">
                                Extended on {formatDate(ext.extensionDate)}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                From {formatDate(ext.previousMaturityDate)} to {formatDate(ext.newMaturityDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {formatCurrency(ext.interestPaidToDate)} paid
                              </p>
                            </div>
                          </div>
                          {ext.notes && <p className="text-xs text-slate-500 mt-1">{ext.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button variant="secondary" onClick={() => handlePrint(selectedTicket)}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              {(selectedTicket.status === 'active' || selectedTicket.status === 'extended') && (
                <Button variant="primary" onClick={() => handleRedeem(selectedTicket)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Redeem
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
