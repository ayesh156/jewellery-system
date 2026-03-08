import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Settings,
  Tag,
  Gem,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Grid3X3,
  List,
  Scale,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { categoriesApi, goldApi } from '../services/api';
import toast from 'react-hot-toast';
import type { ProductCategory, GoldTypeConfig, GoldKarat, MetalType } from '../types';

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'white-gold', 'rose-gold'];
const goldKarats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

const categoryIcons: Record<string, string> = {
  'Rings': '💍',
  'Necklaces': '📿',
  'Earrings': '✨',
  'Bangles & Bracelets': '⭕',
  'Chains': '🔗',
  'Pendants': '💎',
  'Anklets': '⚪',
  'Nose Pins': '👃',
  'Mangalsutra': '🪬',
  'Sets': '🎁',
  "Men's Jewellery": '👔',
  'Silver Items': '🥈',
  'Coins & Bars': '🪙',
  'Watches': '⌚',
};

// Convert API gold type (numeric strings) → frontend GoldTypeConfig (numbers)
function toGoldType(raw: any): GoldTypeConfig {
  return {
    ...raw,
    purityPercentage: Number(raw.purityPercentage),
    defaultWastagePercentage: Number(raw.defaultWastagePercentage),
  };
}

export function Categories() {
  // View mode
  const [viewMode, setViewMode] = useState<'categories' | 'goldTypes'>('categories');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Gold types state
  const [goldTypes, setGoldTypes] = useState<GoldTypeConfig[]>([]);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
    icon: '💎',
    defaultMetalType: 'gold' as MetalType,
    defaultKarat: '22K' as GoldKarat,
    defaultWastage: 8,
    isActive: true,
  });

  // Gold type modal
  const [showGoldTypeModal, setShowGoldTypeModal] = useState(false);
  const [editingGoldType, setEditingGoldType] = useState<GoldTypeConfig | null>(null);
  const [goldTypeForm, setGoldTypeForm] = useState({
    karat: '22K' as GoldKarat,
    purityPercentage: 91.67,
    description: '',
    defaultWastagePercentage: 8,
    isActive: true,
  });

  // ==========================================
  // Data Loading
  // ==========================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, goldRes] = await Promise.all([
        categoriesApi.getAll(),
        goldApi.getTypes(),
      ]);
      setCategories(catRes.data.map((c: any, i: number) => ({
        id: c.id,
        name: c.name,
        code: c.id.replace('cat-', '').toUpperCase(),
        description: c.description,
        icon: categoryIcons[c.name] || c.icon || '💎',
        defaultMetalType: 'gold' as MetalType,
        defaultKarat: '22K' as GoldKarat,
        defaultWastage: 8,
        sortOrder: i + 1,
        isActive: c.isActive,
        createdAt: c.createdAt || '',
        updatedAt: c.updatedAt || '',
      })));
      setGoldTypes(goldRes.data.map(toGoldType));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // Filtered gold types
  const filteredGoldTypes = useMemo(() => {
    return goldTypes.filter(g => 
      g.karat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [goldTypes, searchQuery]);

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      code: '',
      description: '',
      icon: '💎',
      defaultMetalType: 'gold',
      defaultKarat: '22K',
      defaultWastage: 8,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      code: category.code,
      description: category.description || '',
      icon: category.icon || '💎',
      defaultMetalType: category.defaultMetalType || 'gold',
      defaultKarat: category.defaultKarat || '22K',
      defaultWastage: category.defaultWastage || 8,
      isActive: category.isActive,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.code) {
      toast.error('Please enter category name and code');
      return;
    }
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await categoriesApi.update(editingCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          icon: categoryForm.icon,
          isActive: categoryForm.isActive,
        });
        setCategories(prev => prev.map(c =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: res.data.name,
                description: res.data.description,
                icon: categoryIcons[res.data.name] || res.data.icon || '💎',
                isActive: res.data.isActive,
                updatedAt: res.data.updatedAt || new Date().toISOString(),
                // Keep front-end only fields from form
                code: categoryForm.code,
                defaultMetalType: categoryForm.defaultMetalType,
                defaultKarat: categoryForm.defaultKarat,
                defaultWastage: categoryForm.defaultWastage,
              }
            : c
        ));
      } else {
        const newId = `cat-${categoryForm.code.toLowerCase()}`;
        const res = await categoriesApi.create({
          id: newId,
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          icon: categoryForm.icon,
          isActive: categoryForm.isActive,
        });
        const newCategory: ProductCategory = {
          id: res.data.id,
          name: res.data.name,
          code: categoryForm.code,
          description: res.data.description,
          icon: categoryIcons[res.data.name] || res.data.icon || '💎',
          defaultMetalType: categoryForm.defaultMetalType,
          defaultKarat: categoryForm.defaultKarat,
          defaultWastage: categoryForm.defaultWastage,
          sortOrder: categories.length + 1,
          isActive: res.data.isActive,
          createdAt: res.data.createdAt || new Date().toISOString(),
          updatedAt: res.data.updatedAt || new Date().toISOString(),
        };
        setCategories(prev => [...prev, newCategory]);
      }
      setShowCategoryModal(false);
      toast.success(editingCategory ? 'Category updated successfully' : 'Category added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setSaving(true);
    try {
      await categoriesApi.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryActive = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    try {
      await categoriesApi.update(id, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  // Gold type handlers
  const handleAddGoldType = () => {
    setEditingGoldType(null);
    setGoldTypeForm({
      karat: '22K',
      purityPercentage: 91.67,
      description: '',
      defaultWastagePercentage: 8,
      isActive: true,
    });
    setShowGoldTypeModal(true);
  };

  const handleEditGoldType = (goldType: GoldTypeConfig) => {
    setEditingGoldType(goldType);
    setGoldTypeForm({
      karat: goldType.karat,
      purityPercentage: goldType.purityPercentage,
      description: goldType.description,
      defaultWastagePercentage: goldType.defaultWastagePercentage,
      isActive: goldType.isActive,
    });
    setShowGoldTypeModal(true);
  };

  const handleSaveGoldType = async () => {
    if (!goldTypeForm.karat) {
      toast.error('Please select a karat');
      return;
    }
    setSaving(true);
    try {
      if (editingGoldType) {
        const res = await goldApi.updateType(editingGoldType.id, {
          purityPercentage: String(goldTypeForm.purityPercentage),
          description: goldTypeForm.description,
          isActive: goldTypeForm.isActive,
          defaultWastagePercentage: String(goldTypeForm.defaultWastagePercentage),
        });
        setGoldTypes(prev => prev.map(g =>
          g.id === editingGoldType.id ? toGoldType(res.data) : g
        ));
      } else {
        // Gold types don't have a create endpoint in the backend yet
        // For now, add locally
        const newGoldType: GoldTypeConfig = {
          id: `gold-${Date.now()}`,
          ...goldTypeForm,
          color: '#FFD700',
        };
        setGoldTypes(prev => [...prev, newGoldType]);
      }
      setShowGoldTypeModal(false);
      toast.success(editingGoldType ? 'Gold type updated successfully' : 'Gold type added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save gold type');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoldType = (id: string) => {
    if (confirm('Are you sure you want to delete this gold type?')) {
      setGoldTypes(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleToggleGoldTypeActive = async (id: string) => {
    const gt = goldTypes.find(g => g.id === id);
    if (!gt) return;
    try {
      await goldApi.updateType(id, { isActive: !gt.isActive });
      setGoldTypes(prev => prev.map(g =>
        g.id === id ? { ...g, isActive: !g.isActive } : g
      ));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update gold type');
    }
  };

  // Purity percentages
  const purityMap: Record<GoldKarat, number> = {
    '24K': 99.9,
    '22K': 91.67,
    '21K': 87.5,
    '18K': 75.0,
    '14K': 58.3,
    '10K': 41.7,
    '9K': 37.5,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Category Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage product categories and gold type configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'categories' ? 'default' : 'outline'}
            onClick={() => setViewMode('categories')}
          >
            <Grid3X3 className="w-4 h-4" />
            Categories
          </Button>
          <Button
            variant={viewMode === 'goldTypes' ? 'default' : 'outline'}
            onClick={() => setViewMode('goldTypes')}
          >
            <Scale className="w-4 h-4" />
            Gold Types
          </Button>
        </div>
      </div>

      {/* Search & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={`Search ${viewMode === 'categories' ? 'categories' : 'gold types'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button onClick={viewMode === 'categories' ? handleAddCategory : handleAddGoldType}>
              <Plus className="w-4 h-4" />
              Add {viewMode === 'categories' ? 'Category' : 'Gold Type'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories View */}
      {viewMode === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} hover className={!category.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center text-2xl">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{category.name}</h3>
                      <p className="text-xs text-slate-500">Code: {category.code}</p>
                    </div>
                  </div>
                  <Badge variant={category.isActive ? 'success' : 'default'} className="text-xs">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {category.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{category.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {category.defaultMetalType}
                  </Badge>
                  {category.defaultKarat && (
                    <Badge variant="warning" className="text-xs">
                      {category.defaultKarat}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Wastage: {category.defaultWastage}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <button
                    onClick={() => handleToggleCategoryActive(category.id)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {category.isActive ? (
                      <ToggleRight className="w-6 h-6 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <Grid3X3 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No categories found</h3>
                  <p className="text-slate-400 mb-4">Create your first product category</p>
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Gold Types View */}
      {viewMode === 'goldTypes' && (
        <div className="space-y-4">
          {filteredGoldTypes.map((goldType) => (
            <Card key={goldType.id} hover className={!goldType.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Icon and Title */}
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${goldType.color || '#FFD700'}40, ${goldType.color || '#FFD700'}10)`,
                        border: `1px solid ${goldType.color || '#FFD700'}40`
                      }}
                    >
                      <span style={{ color: goldType.color || '#FFD700' }}>{goldType.karat}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-100 text-lg">{goldType.karat} Gold</h3>
                        <Badge variant={goldType.isActive ? 'success' : 'default'} className="sm:hidden">
                          {goldType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{goldType.description}</p>
                    </div>
                  </div>

                  {/* Middle: Stats - Grid on mobile, flex on desktop */}
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
                    <div className="text-center sm:text-center">
                      <p className="text-xl sm:text-2xl font-bold text-amber-400">{goldType.purityPercentage}%</p>
                      <p className="text-xs text-slate-500">Purity</p>
                    </div>
                    <div className="text-center sm:text-center">
                      <p className="text-xl sm:text-2xl font-bold text-slate-300">{goldType.defaultWastagePercentage}%</p>
                      <p className="text-xs text-slate-500">Default Wastage</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700">
                    <Badge variant={goldType.isActive ? 'success' : 'default'} className="hidden sm:inline-flex">
                      {goldType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleGoldTypeActive(goldType.id)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {goldType.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGoldType(goldType)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoldType(goldType.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredGoldTypes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No gold types found</h3>
                <p className="text-slate-400 mb-4">Configure gold types for your business</p>
                <Button onClick={handleAddGoldType}>
                  <Plus className="w-4 h-4" />
                  Add Gold Type
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Gold Purity Reference */}
          <Card className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5" />
                Gold Purity Reference Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(purityMap).map(([karat, purity]) => (
                  <div key={karat} className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="font-bold text-amber-400">{karat}</p>
                    <p className="text-xl font-semibold text-slate-200">{purity}%</p>
                    <p className="text-xs text-slate-500">Pure Gold</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                24K = Pure gold (99.9%). Lower karats contain alloy metals for durability.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category Name *"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rings"
            />
            <Input
              label="Category Code *"
              value={categoryForm.code}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., RNG"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Category description..."
              className="w-full h-20 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(categoryIcons).map((icon, idx) => (
                <button
                  key={idx}
                  onClick={() => setCategoryForm(prev => ({ ...prev, icon }))}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    categoryForm.icon === icon
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Default Metal"
              value={categoryForm.defaultMetalType}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, defaultMetalType: e.target.value as MetalType }))}
            >
              {metalTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </Select>
            <Select
              label="Default Karat"
              value={categoryForm.defaultKarat}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, defaultKarat: e.target.value as GoldKarat }))}
            >
              {goldKarats.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
            <Input
              label="Default Wastage %"
              type="number"
              value={categoryForm.defaultWastage}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, defaultWastage: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label className="text-sm text-slate-300">Category is active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gold Type Modal */}
      <Modal
        isOpen={showGoldTypeModal}
        onClose={() => setShowGoldTypeModal(false)}
        title={editingGoldType ? 'Edit Gold Type' : 'Add New Gold Type'}
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Karat *"
              value={goldTypeForm.karat}
              onChange={(e) => {
                const karat = e.target.value as GoldKarat;
                setGoldTypeForm(prev => ({
                  ...prev,
                  karat,
                  purityPercentage: purityMap[karat] || 91.67,
                }));
              }}
            >
              {goldKarats.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
            <Input
              label="Purity Percentage *"
              type="number"
              step="0.01"
                value={goldTypeForm.purityPercentage}
                onChange={(e) => setGoldTypeForm(prev => ({ ...prev, purityPercentage: Number(e.target.value) }))}
              />
          </div>

          <div>
            <Input
              label="Description"
              value={goldTypeForm.description}
              onChange={(e) => setGoldTypeForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Most popular for jewellery in Sri Lanka"
            />
          </div>

          <div>
            <Input
              label="Default Wastage Percentage"
              type="number"
              step="0.5"
              value={goldTypeForm.defaultWastagePercentage}
              onChange={(e) => setGoldTypeForm(prev => ({ ...prev, defaultWastagePercentage: Number(e.target.value) }))}
            />
            <p className="text-xs text-slate-500 mt-1">Typical wastage: 8-12% for intricate work</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              checked={goldTypeForm.isActive}
              onChange={(e) => setGoldTypeForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label className="text-sm text-slate-300">Gold type is active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => setShowGoldTypeModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoldType} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingGoldType ? 'Update' : 'Create'} Gold Type
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
