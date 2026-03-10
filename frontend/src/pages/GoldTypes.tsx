import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Scale,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CircleDot,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { DateCombobox } from '../components/ui/DateCombobox';
import { Combobox } from '../components/ui/Combobox';
import { Select } from '../components/ui/Select';
import { goldApi, productsApi } from '../services/api';
import toast from 'react-hot-toast';
import type { GoldTypeConfig, GoldKarat } from '../types';

const goldKarats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

const purityMap: Record<GoldKarat, number> = {
  '24K': 99.9,
  '22K': 91.67,
  '21K': 87.5,
  '18K': 75.0,
  '14K': 58.3,
  '10K': 41.7,
  '9K': 37.5,
};

function toGoldType(raw: any): GoldTypeConfig {
  return {
    ...raw,
    purityPercentage: Number(raw.purityPercentage),
    defaultWastagePercentage: Number(raw.defaultWastagePercentage),
  };
}

type SortField = 'karat' | 'purityPercentage' | 'defaultWastagePercentage' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Skeleton component
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-pulse">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-xl bg-slate-700/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-700/50 rounded w-28" />
              <div className="h-4 bg-slate-700/30 rounded w-48" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center space-y-1">
              <div className="h-7 bg-slate-700/50 rounded w-16 mx-auto" />
              <div className="h-3 bg-slate-700/30 rounded w-10 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <div className="h-7 bg-slate-700/50 rounded w-12 mx-auto" />
              <div className="h-3 bg-slate-700/30 rounded w-14 mx-auto" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 bg-slate-700/30 rounded w-14" />
            <div className="h-8 bg-slate-700/30 rounded w-8" />
            <div className="h-8 bg-slate-700/30 rounded w-8" />
            <div className="h-8 bg-slate-700/30 rounded w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoldTypes() {
  const [goldTypes, setGoldTypes] = useState<GoldTypeConfig[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField>('karat');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingGoldType, setEditingGoldType] = useState<GoldTypeConfig | null>(null);
  const [form, setForm] = useState({
    karat: '22K' as GoldKarat,
    purityPercentage: 91.67,
    description: '',
    defaultWastagePercentage: 8,
    isActive: true,
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<GoldTypeConfig | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, countsRes] = await Promise.all([
        goldApi.getTypes(),
        productsApi.getCounts(),
      ]);
      setProductCounts(countsRes.data.byKarat);
      setGoldTypes(res.data.map(toGoldType));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load gold types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Karat sort order for proper sorting
  const karatOrder: Record<string, number> = { '24K': 1, '22K': 2, '21K': 3, '18K': 4, '14K': 5, '10K': 6, '9K': 7 };

  // Filtered + sorted
  const filteredGoldTypes = useMemo(() => {
    let result = goldTypes.filter(g => {
      const matchesSearch = g.karat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? g.isActive : !g.isActive);

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const created = g.createdAt ? new Date(g.createdAt).getTime() : 0;
        if (dateFrom) matchesDate = matchesDate && created >= new Date(dateFrom).getTime();
        if (dateTo) matchesDate = matchesDate && created <= new Date(dateTo + 'T23:59:59').getTime();
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'karat':
          cmp = (karatOrder[a.karat] || 99) - (karatOrder[b.karat] || 99);
          break;
        case 'purityPercentage':
          cmp = a.purityPercentage - b.purityPercentage;
          break;
        case 'defaultWastagePercentage':
          cmp = a.defaultWastagePercentage - b.defaultWastagePercentage;
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [goldTypes, searchQuery, statusFilter, sortField, sortDirection, dateFrom, dateTo]);

  // Paginated
  const paginatedGoldTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGoldTypes.slice(start, start + pageSize);
  }, [filteredGoldTypes, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortField, sortDirection, dateFrom, dateTo]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortField('karat');
    setSortDirection('asc');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

  // Handlers
  const handleAdd = () => {
    setEditingGoldType(null);
    setForm({ karat: '22K', purityPercentage: 91.67, description: '', defaultWastagePercentage: 8, isActive: true });
    setShowModal(true);
  };

  const handleEdit = (gt: GoldTypeConfig) => {
    setEditingGoldType(gt);
    setForm({
      karat: gt.karat,
      purityPercentage: gt.purityPercentage,
      description: gt.description || '',
      defaultWastagePercentage: gt.defaultWastagePercentage,
      isActive: gt.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.karat) { toast.error('Please select a karat'); return; }
    setSaving(true);
    try {
      if (editingGoldType) {
        const res = await goldApi.updateType(editingGoldType.id, {
          purityPercentage: String(form.purityPercentage),
          description: form.description,
          isActive: form.isActive,
          defaultWastagePercentage: String(form.defaultWastagePercentage),
        });
        const updated = toGoldType(res.data);
        setGoldTypes(prev => prev.map(g => g.id === editingGoldType.id ? updated : g));
        toast.success('Gold type updated');
      } else {
        const newId = `gold-${form.karat.replace('K', 'k')}-${Date.now()}`;
        const res = await goldApi.createType({
          id: newId,
          karat: form.karat,
          purityPercentage: String(form.purityPercentage),
          description: form.description || '',
          isActive: form.isActive,
          defaultWastagePercentage: String(form.defaultWastagePercentage),
          color: '#FFD700',
        });
        setGoldTypes(prev => [...prev, toGoldType(res.data)]);
        toast.success('Gold type created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await goldApi.deleteType(deleteTarget.id);
      setGoldTypes(prev => prev.filter(g => g.id !== deleteTarget.id));
      toast.success('Gold type deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const gt = goldTypes.find(g => g.id === id);
    if (!gt) return;
    // Optimistic update
    setGoldTypes(prev => prev.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g));
    try {
      await goldApi.updateType(id, { isActive: !gt.isActive });
    } catch (err) {
      // Revert on error
      setGoldTypes(prev => prev.map(g => g.id === id ? { ...g, isActive: gt.isActive } : g));
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gold Types</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? '...' : `${filteredGoldTypes.length} of ${goldTypes.length} gold type${goldTypes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Gold Type</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Search gold types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Combobox
                options={[
                  { value: 'all', label: 'All Status', icon: <CircleDot className="w-3.5 h-3.5 text-slate-400" /> },
                  { value: 'active', label: 'Active', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
                  { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                placeholder="Status"
                clearable={false}
                showFooter={false}
                className="w-[120px] sm:w-[160px]"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
              <button
                onClick={() => toggleSort('karat')}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  sortField === 'karat' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Karat <SortIcon field="karat" />
              </button>
              <button
                onClick={() => toggleSort('purityPercentage')}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  sortField === 'purityPercentage' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Purity <SortIcon field="purityPercentage" />
              </button>
              <button
                onClick={() => toggleSort('defaultWastagePercentage')}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  sortField === 'defaultWastagePercentage' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Wastage <SortIcon field="defaultWastagePercentage" />
              </button>
            </div>
            <button
              onClick={() => setShowMoreFilters(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                showMoreFilters || dateFrom || dateTo || sortField === 'createdAt'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              More
              {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* More filters (collapsible) */}
          {showMoreFilters && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-slate-700/50">
              <button
                onClick={() => toggleSort('createdAt')}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  sortField === 'createdAt' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Date Added <SortIcon field="createdAt" />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Range:
              </div>
              <div className="flex gap-2 flex-1">
                <div className="w-full sm:w-44">
                  <DateCombobox
                    value={dateFrom}
                    onChange={(v) => setDateFrom(v)}
                    placeholder="From date"
                    clearable
                  />
                </div>
                <div className="w-full sm:w-44">
                  <DateCombobox
                    value={dateTo}
                    onChange={(v) => setDateTo(v)}
                    placeholder="To date"
                    clearable
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gold Types List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : paginatedGoldTypes.length > 0 ? (
          paginatedGoldTypes.map((goldType) => (
            <Card key={goldType.id} hover className={`transition-opacity ${!goldType.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${goldType.color || '#FFD700'}40, ${goldType.color || '#FFD700'}10)`,
                        border: `1px solid ${goldType.color || '#FFD700'}40`,
                      }}
                    >
                      <span style={{ color: goldType.color || '#FFD700' }}>{goldType.karat}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(goldType)}
                          className="font-semibold text-slate-100 text-base sm:text-lg truncate hover:text-amber-400 transition-colors text-left"
                        >
                          {goldType.karat} Gold
                        </button>
                        <Badge variant={goldType.isActive ? 'success' : 'default'} className="sm:hidden shrink-0 text-[10px]">
                          {goldType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{goldType.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <p className="text-lg sm:text-2xl font-bold text-amber-400">{goldType.purityPercentage}%</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Purity</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg sm:text-2xl font-bold text-slate-300">{goldType.defaultWastagePercentage}%</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Wastage</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg sm:text-2xl font-bold ${productCounts[goldType.karat] ? 'text-blue-400' : 'text-slate-500'}`}>{productCounts[goldType.karat] || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Products</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 border-l border-slate-700 pl-3 sm:pl-4">
                      <Badge variant={goldType.isActive ? 'success' : 'default'} className="hidden sm:inline-flex text-xs">
                        {goldType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <button
                        onClick={() => handleToggleActive(goldType.id)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {goldType.isActive ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMoreMenuId(moreMenuId === goldType.id ? null : goldType.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {moreMenuId === goldType.id && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-[70] w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                              <button
                                onClick={() => { handleEdit(goldType); setMoreMenuId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(goldType); setMoreMenuId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="w-12 h-12 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No gold types found</h3>
              <p className="text-slate-400 mb-4">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Configure gold types for your business'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              ) : (
                <Button onClick={handleAdd}><Plus className="w-4 h-4" /> Add Gold Type</Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredGoldTypes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredGoldTypes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Gold Purity Reference */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400 text-sm sm:text-base">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            Gold Purity Reference Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
            {Object.entries(purityMap).map(([karat, purity]) => (
              <div key={karat} className="text-center p-2 sm:p-3 bg-slate-800/50 rounded-lg">
                <p className="font-bold text-amber-400 text-sm sm:text-base">{karat}</p>
                <p className="text-lg sm:text-xl font-semibold text-slate-200">{purity}%</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Pure Gold</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            24K = Pure gold (99.9%). Lower karats contain alloy metals for durability.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGoldType ? 'Edit Gold Type' : 'Add New Gold Type'}
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Karat *"
              value={form.karat}
              onChange={(e) => {
                const karat = e.target.value as GoldKarat;
                setForm(prev => ({
                  ...prev,
                  karat,
                  purityPercentage: purityMap[karat] ?? prev.purityPercentage,
                }));
              }}
              disabled={!!editingGoldType}
            >
              {goldKarats.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
            <Input
              label="Purity Percentage *"
              type="number"
              step="0.01"
              value={form.purityPercentage}
              onChange={(e) => setForm(prev => ({ ...prev, purityPercentage: Number(e.target.value) }))}
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Most popular for jewellery in Sri Lanka"
          />
          <div>
            <Input
              label="Default Wastage Percentage"
              type="number"
              step="0.5"
              value={form.defaultWastagePercentage}
              onChange={(e) => setForm(prev => ({ ...prev, defaultWastagePercentage: Number(e.target.value) }))}
            />
            <p className="text-xs text-slate-500 mt-1">Typical wastage: 8-12% for intricate work</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label className="text-sm text-slate-300">Gold type is active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingGoldType ? 'Update' : 'Create'} Gold Type
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Gold Type"
        size="sm"
      >
        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Are you sure?</h3>
            <p className="text-sm text-slate-400">
              This will permanently delete <span className="font-medium text-slate-200">{deleteTarget?.karat} Gold</span>.
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 border-red-500"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
