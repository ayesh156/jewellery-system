import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Gem,
  Layers,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox, type ComboboxOption } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardHeader, MobileCardContent, MobileCardRow, MobileCardActions, MobileCardsContainer } from '../components/ui/Table';
import { mockProducts, mockCategories } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { JewelleryItem, MetalType, GoldKarat } from '../types';

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold'];
const karats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

// Convert categories to ComboboxOption format
const categoryOptions: ComboboxOption[] = mockCategories.map((cat) => ({
  value: cat.id,
  label: cat.name,
  icon: <Layers className="w-4 h-4" />,
}));

// Convert metal types to ComboboxOption format
const metalOptions: ComboboxOption[] = metalTypes.map((metal) => ({
  value: metal,
  label: metal.charAt(0).toUpperCase() + metal.slice(1).replace('-', ' '),
  icon: <Gem className="w-4 h-4" />,
}));

export function Products() {
  const [products, setProducts] = useState<JewelleryItem[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [metalFilter, setMetalFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<JewelleryItem | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<JewelleryItem>>({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    metalType: 'gold',
    karat: '22K',
    metalWeight: 0,
    makingCharges: 0,
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 1,
    reorderLevel: 2,
    description: '',
    isActive: true,
    hasGemstones: false,
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
      const matchesMetal = !metalFilter || product.metalType === metalFilter;

      return matchesSearch && matchesCategory && matchesMetal;
    });
  }, [products, searchQuery, categoryFilter, metalFilter]);

  // Stats
  const totalValue = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= (p.reorderLevel || 2)).length;

  const handleInputChange = (field: keyof JewelleryItem, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (editMode && selectedProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, ...formData, lastUpdated: new Date().toISOString() } : p
        )
      );
    } else {
      const newProduct: JewelleryItem = {
        ...formData,
        id: `JI${String(products.length + 1).padStart(3, '0')}`,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        metalRate: 18500,
      } as JewelleryItem;
      setProducts((prev) => [...prev, newProduct]);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (selectedProduct) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      metalType: 'gold',
      karat: '22K',
      metalWeight: 0,
      makingCharges: 0,
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 1,
      reorderLevel: 2,
      description: '',
      isActive: true,
      hasGemstones: false,
    });
    setShowAddModal(false);
    setEditMode(false);
    setSelectedProduct(null);
  };

  const openEditModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setFormData(product);
    setEditMode(true);
    setShowAddModal(true);
  };

  const openViewModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const openDeleteModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Products</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your jewellery inventory</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Gem className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lowStockCount}</p>
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
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="lg:w-56">
              <Combobox
                options={categoryOptions}
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                placeholder="All Categories"
                searchPlaceholder="Search categories..."
                defaultIcon={<Layers className="w-4 h-4" />}
                showAllOption
                allOptionLabel="All Categories"
                clearable
                showFooter={false}
              />
            </div>
            <div className="lg:w-48">
              <Combobox
                options={metalOptions}
                value={metalFilter}
                onChange={(val) => setMetalFilter(val)}
                placeholder="All Metals"
                searchPlaceholder="Search metals..."
                defaultIcon={<Gem className="w-4 h-4" />}
                showAllOption
                allOptionLabel="All Metals"
                clearable
                showFooter={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          {/* Desktop Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                        <Gem className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{product.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{product.barcode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="default">{product.categoryName || product.categoryId}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700 dark:text-slate-300">
                      {product.metalType.charAt(0).toUpperCase() + product.metalType.slice(1).replace('-', ' ')}
                      {product.karat && ` ${product.karat}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {formatWeight(product.metalWeight)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        product.stockQuantity <= (product.reorderLevel || 2)
                          ? 'error'
                          : product.stockQuantity <= (product.reorderLevel || 2) * 2
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {product.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewModal(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(product)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mobile Cards */}
          <MobileCardsContainer className="p-4">
            {filteredProducts.map((product) => (
              <MobileCard key={product.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                      <Gem className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      product.stockQuantity <= (product.reorderLevel || 2)
                        ? 'error'
                        : product.stockQuantity <= (product.reorderLevel || 2) * 2
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {product.stockQuantity} in stock
                  </Badge>
                </MobileCardHeader>
                <MobileCardContent>
                  <MobileCardRow 
                    label="Category" 
                    value={<Badge variant="default">{product.categoryName || product.categoryId}</Badge>} 
                  />
                  <MobileCardRow 
                    label="Metal" 
                    value={`${product.metalType.charAt(0).toUpperCase() + product.metalType.slice(1).replace('-', ' ')}${product.karat ? ` ${product.karat}` : ''}`} 
                  />
                  <MobileCardRow 
                    label="Weight" 
                    value={formatWeight(product.metalWeight)} 
                  />
                  <MobileCardRow 
                    label="Price" 
                    value={<span className="text-amber-500 font-bold">{formatCurrency(product.sellingPrice)}</span>} 
                  />
                </MobileCardContent>
                <MobileCardActions>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(product)}>
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(product)}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(product)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardsContainer>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editMode ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Product Name</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Gold Wedding Ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="e.g., GWR-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Barcode</label>
              <Input
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="e.g., 8901234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Category</label>
              <Combobox
                value={formData.categoryId}
                onChange={(val) => handleInputChange('categoryId', val)}
                options={[
                  { value: '', label: 'Select Category', icon: <Tag className="w-4 h-4" /> },
                  ...mockCategories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                    icon: <Tag className="w-4 h-4" />
                  }))
                ]}
                placeholder="Select category..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Metal Type</label>
              <Combobox
                value={formData.metalType}
                onChange={(val) => handleInputChange('metalType', val)}
                options={metalTypes.map((metal) => ({
                  value: metal,
                  label: metal.charAt(0).toUpperCase() + metal.slice(1).replace('-', ' '),
                  icon: <Gem className="w-4 h-4" />
                }))}
                placeholder="Select metal type..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Karat</label>
              <Combobox
                value={formData.karat}
                onChange={(val) => handleInputChange('karat', val)}
                options={karats.map((k) => ({
                  value: k,
                  label: k,
                  icon: <Gem className="w-4 h-4" />
                }))}
                placeholder="Select karat..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Metal Weight (g)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.metalWeight}
                onChange={(e) => handleInputChange('metalWeight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Cost Price</label>
              <Input
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Selling Price</label>
              <Input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Making Charges</label>
              <Input
                type="number"
                value={formData.makingCharges}
                onChange={(e) => handleInputChange('makingCharges', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Stock Quantity</label>
              <Input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Reorder Level</label>
              <Input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description..."
            />
          </div>

        </div>
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit}>
            {editMode ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Product Details"
        size="md"
      >
        {selectedProduct && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                <Gem className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selectedProduct.name}</h3>
                <p className="text-slate-600 dark:text-slate-400">SKU: {selectedProduct.sku}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Metal Type</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">
                  {selectedProduct.metalType.charAt(0).toUpperCase() + selectedProduct.metalType.slice(1).replace('-', ' ')}
                  {selectedProduct.karat && ` ${selectedProduct.karat}`}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Metal Weight</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">{formatWeight(selectedProduct.metalWeight)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Selling Price</p>
                <p className="text-amber-400 font-semibold mt-1">{formatCurrency(selectedProduct.sellingPrice)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Stock Quantity</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">{selectedProduct.stockQuantity}</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Description</p>
                <p className="text-slate-800 dark:text-slate-200">{selectedProduct.description}</p>
              </div>
            )}

          </div>
        )}
        {selectedProduct && (
          <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedProduct);
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-slate-800 dark:text-slate-200">Are you sure you want to delete this product?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedProduct?.name}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone. This will permanently delete the product from your inventory.
          </p>
        </div>
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete Product
            </Button>
          </div>
      </Modal>
    </div>
  );
}
