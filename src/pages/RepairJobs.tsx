import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Phone,
  Calendar,
  ChevronRight,
  Eye,
  Printer,
  MoreHorizontal,
  Scale,
  User,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalContent } from '../components/ui/Modal';
import { mockRepairJobs } from '../data/mockData';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import type { RepairJob, RepairStatus } from '../types';

const statusConfig: Record<RepairStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  'received': { label: 'Received', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package },
  'assessment': { label: 'Under Assessment', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Search },
  'quoted': { label: 'Quote Sent', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  'approved': { label: 'Approved', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: CheckCircle2 },
  'in-repair': { label: 'In Repair', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Wrench },
  'quality-check': { label: 'Quality Check', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: Eye },
  'ready-for-collection': { label: 'Ready for Collection', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  'collected': { label: 'Collected', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: CheckCircle2 },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
};

const priorityConfig = {
  'normal': { label: 'Normal', color: 'bg-slate-500/20 text-slate-400' },
  'urgent': { label: 'Urgent', color: 'bg-orange-500/20 text-orange-400' },
  'express': { label: 'Express', color: 'bg-red-500/20 text-red-400' },
};

export function RepairJobs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<RepairJob | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState<RepairStatus>('received');
  const [statusNote, setStatusNote] = useState('');

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return mockRepairJobs.filter((job) => {
      const matchesSearch = 
        job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerPhone.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = mockRepairJobs.length;
    const pending = mockRepairJobs.filter(j => ['received', 'assessment', 'quoted'].includes(j.status)).length;
    const inProgress = mockRepairJobs.filter(j => ['approved', 'in-repair', 'quality-check'].includes(j.status)).length;
    const ready = mockRepairJobs.filter(j => j.status === 'ready-for-collection').length;
    const completed = mockRepairJobs.filter(j => j.status === 'collected').length;

    return { total, pending, inProgress, ready, completed };
  }, []);

  const handleViewJob = (job: RepairJob) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleUpdateStatus = (job: RepairJob) => {
    setSelectedJob(job);
    setNewStatus(job.status);
    setStatusNote('');
    setShowUpdateModal(true);
  };

  const handlePrintReceipt = (job: RepairJob) => {
    localStorage.setItem('printRepairReceipt', JSON.stringify(job));
    navigate(`/repairs/${job.id}/print`);
  };

  const getStatusBadge = (status: RepairStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Repair & Service Jobs</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage customer repair requests and job cards</p>
        </div>
        <Button onClick={() => navigate('/repairs/create')}>
          <Plus className="w-4 h-4" />
          New Repair Job
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Jobs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700/50">
                <Wrench className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-400/70 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-400/70 uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Wrench className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-400/70 uppercase tracking-wider">Ready</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.ready}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400/70 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-slate-300 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/20">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by job number, customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RepairStatus | 'all')}
                className="w-44"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </Select>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-36"
              >
                <option value="all">All Priority</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="express">Express</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No repair jobs found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">Try adjusting your filters or create a new repair job</p>
              <Button onClick={() => navigate('/repairs/create')}>
                <Plus className="w-4 h-4" />
                Create Repair Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} hover className="overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{job.jobNumber}</h3>
                          {getStatusBadge(job.status)}
                          <Badge className={priorityConfig[job.priority].color}>
                            {priorityConfig[job.priority].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {job.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {job.customerPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-lg text-sm"
                        >
                          <Scale className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          <span className="text-slate-700 dark:text-slate-300">{item.itemType}</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-amber-600 dark:text-amber-400">{formatWeight(item.initialWeight)}</span>
                          {item.karat && (
                            <Badge variant="outline" className="text-xs">{item.karat}</Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Repair Types */}
                    <div className="flex flex-wrap gap-1.5">
                      {job.items.flatMap(item => item.repairTypes).slice(0, 4).map((type, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs capitalize">
                          {type.replace('-', ' ')}
                        </Badge>
                      ))}
                      {job.items.flatMap(item => item.repairTypes).length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.items.flatMap(item => item.repairTypes).length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Dates & Price */}
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 lg:text-right lg:min-w-[180px]">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Received</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(job.receivedDate)}</p>
                    </div>
                    {job.estimatedCompletionDate && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Est. Completion</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(job.estimatedCompletionDate)}</p>
                      </div>
                    )}
                    {job.estimate && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Estimate</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(job.estimate.totalEstimate)}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleViewJob(job)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(job)}>
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(job)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              {job.statusHistory && job.statusHistory.length > 0 && (
                <div className="px-4 sm:px-6 pb-4 pt-0">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {job.statusHistory.slice(-5).map((update, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${statusConfig[update.status].color.split(' ')[0]}`} />
                        <span className="text-xs text-slate-500">
                          {statusConfig[update.status].label}
                        </span>
                        {idx < job.statusHistory.slice(-5).length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        title={`Job Details - ${selectedJob?.jobNumber}`}
        size="lg"
      >
        {selectedJob && (
          <ModalContent>
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Name</p>
                    <p className="text-slate-800 dark:text-slate-200">{selectedJob.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="text-slate-800 dark:text-slate-200">{selectedJob.customerPhone}</p>
                  </div>
                  {selectedJob.customerEmail && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-slate-800 dark:text-slate-200">{selectedJob.customerEmail}</p>
                    </div>
                  )}
                  {selectedJob.customerNIC && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">NIC</p>
                      <p className="text-slate-800 dark:text-slate-200">{selectedJob.customerNIC}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-3">Items for Repair</h4>
                <div className="space-y-3">
                  {selectedJob.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-800 dark:text-slate-200">{item.itemType}</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.metalType}</Badge>
                          {item.karat && <Badge variant="warning">{item.karat}</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.itemDescription}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Initial Weight</p>
                          <p className="text-amber-600 dark:text-amber-400 font-semibold">{formatWeight(item.initialWeight)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Issue</p>
                          <p className="text-slate-700 dark:text-slate-300">{item.issueDescription}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.repairTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs capitalize">
                            {type.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimate */}
              {selectedJob.estimate && (
                <div className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-500/10 to-yellow-50 dark:to-yellow-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                  <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3">Repair Estimate</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Labor Cost</span>
                      <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedJob.estimate.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Material Cost</span>
                      <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedJob.estimate.materialCost)}</span>
                    </div>
                    {selectedJob.estimate.additionalMetalCost && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Additional Metal</span>
                        <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedJob.estimate.additionalMetalCost)}</span>
                      </div>
                    )}
                    {selectedJob.estimate.otherCosts && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Other Costs</span>
                        <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedJob.estimate.otherCosts)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-amber-200 dark:border-amber-500/20">
                      <span className="font-medium text-slate-800 dark:text-slate-200">Total Estimate</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(selectedJob.estimate.totalEstimate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status */}
              <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Advance Payment</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedJob.advancePayment)}</p>
                </div>
                <Badge className={
                  selectedJob.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                  selectedJob.paymentStatus === 'partial' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                }>
                  {selectedJob.paymentStatus.charAt(0).toUpperCase() + selectedJob.paymentStatus.slice(1)}
                </Badge>
              </div>

              {/* Status History */}
              {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-3">Status History</h4>
                  <div className="space-y-2">
                    {selectedJob.statusHistory.map((update, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${statusConfig[update.status].color.split(' ')[0]}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{statusConfig[update.status].label}</span>
                            <span className="text-xs text-slate-500">{formatDate(update.date)}</span>
                          </div>
                          {update.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{update.notes}</p>}
                          <p className="text-xs text-slate-500">By: {update.updatedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => handlePrintReceipt(selectedJob)}>
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </Button>
                <Button onClick={() => { setShowJobModal(false); handleUpdateStatus(selectedJob); }}>
                  Update Status
                </Button>
              </div>
            </div>
          </ModalContent>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Job Status"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Current Status</p>
              {getStatusBadge(selectedJob.status)}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Status</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as RepairStatus)}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add any notes about this status change..."
                className="w-full h-24 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // In a real app, update the status
                alert(`Status updated to: ${statusConfig[newStatus].label}`);
                setShowUpdateModal(false);
              }}>
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
