import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Combobox, type ComboboxOption } from '../components/ui/Combobox';
import { Gem, Package, Users, Building2, MapPin, Tag } from 'lucide-react';

// Generate massive datasets for testing
function generateLargeDataset(count: number, prefix: string): ComboboxOption[] {
  const categories = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Emerald', 'Sapphire'];
  const types = ['Ring', 'Necklace', 'Bracelet', 'Earring', 'Pendant', 'Chain', 'Bangle', 'Anklet'];
  const weights = ['1g', '2g', '5g', '10g', '15g', '20g', '25g', '50g'];
  
  return Array.from({ length: count }, (_, i) => {
    const category = categories[i % categories.length];
    const type = types[Math.floor(i / categories.length) % types.length];
    const weight = weights[i % weights.length];
    
    return {
      value: `${prefix}-${i + 1}`,
      label: `${category} ${type} ${weight} - #${String(i + 1).padStart(5, '0')}`,
      description: `Premium ${category.toLowerCase()} ${type.toLowerCase()} weighing ${weight}`,
      count: Math.floor(Math.random() * 100) + 1,
    };
  });
}

// Generate customer dataset
function generateCustomers(count: number): ComboboxOption[] {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Emma'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const cities = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Matara', 'Kurunegala', 'Ratnapura'];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const city = cities[i % cities.length];
    
    return {
      value: `cust-${i + 1}`,
      label: `${firstName} ${lastName}`,
      description: `${city} • Customer ID: C${String(i + 1).padStart(6, '0')}`,
    };
  });
}

// Generate suppliers
function generateSuppliers(count: number): ComboboxOption[] {
  const prefixes = ['Royal', 'Golden', 'Diamond', 'Pearl', 'Emerald', 'Crown', 'Star', 'Elite', 'Premium', 'Classic'];
  const suffixes = ['Jewellers', 'Gems', 'Trading', 'Exports', 'Industries', 'Corporation', 'Enterprises', 'Holdings'];
  const countries = ['Sri Lanka', 'India', 'Thailand', 'Dubai', 'Singapore', 'Hong Kong', 'Italy', 'Switzerland'];
  
  return Array.from({ length: count }, (_, i) => {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const country = countries[i % countries.length];
    
    return {
      value: `sup-${i + 1}`,
      label: `${prefix} ${suffix}`,
      description: `${country} • Supplier Code: S${String(i + 1).padStart(5, '0')}`,
      count: Math.floor(Math.random() * 500) + 10,
    };
  });
}

// Generate locations
function generateLocations(count: number): ComboboxOption[] {
  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const district = districts[i % districts.length];
    const zone = Math.floor(i / districts.length) + 1;
    
    return {
      value: `loc-${i + 1}`,
      label: `${district} Zone ${zone}`,
      description: `District: ${district} • Area Code: ${String(i + 1).padStart(4, '0')}`,
    };
  });
}

export default function ComboboxTest() {
  // State for different comboboxes
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedMassive, setSelectedMassive] = useState('');

  // Generate datasets with different sizes
  const products = useMemo(() => generateLargeDataset(1000, 'prod'), []);
  const customers = useMemo(() => generateCustomers(5000), []);
  const suppliers = useMemo(() => generateSuppliers(2000), []);
  const locations = useMemo(() => generateLocations(500), []);
  const massiveDataset = useMemo(() => generateLargeDataset(50000, 'item'), []);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">High-Performance Combobox Test</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Testing with large datasets to verify performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products - 1,000 items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gem className="w-5 h-5 text-amber-400" />
              Products (1,000 items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={products}
              value={selectedProduct}
              onChange={(val) => setSelectedProduct(val)}
              placeholder="Search products..."
              searchPlaceholder="Type to search..."
              defaultIcon={<Package className="w-4 h-4" />}
              showAllOption
              allOptionLabel="All Products"
              clearable
            />
            {selectedProduct && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: <span className="text-amber-400">{selectedProduct}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customers - 5,000 items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-sky-400" />
              Customers (5,000 items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={customers}
              value={selectedCustomer}
              onChange={(val) => setSelectedCustomer(val)}
              placeholder="Search customers..."
              searchPlaceholder="Name or ID..."
              defaultIcon={<Users className="w-4 h-4" />}
              showAllOption
              allOptionLabel="All Customers"
              clearable
            />
            {selectedCustomer && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: <span className="text-sky-400">{selectedCustomer}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Suppliers - 2,000 items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Suppliers (2,000 items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={suppliers}
              value={selectedSupplier}
              onChange={(val) => setSelectedSupplier(val)}
              placeholder="Search suppliers..."
              searchPlaceholder="Company name..."
              defaultIcon={<Building2 className="w-4 h-4" />}
              showAllOption
              allOptionLabel="All Suppliers"
              clearable
            />
            {selectedSupplier && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: <span className="text-emerald-400">{selectedSupplier}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Locations - 500 items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-rose-400" />
              Locations (500 items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={locations}
              value={selectedLocation}
              onChange={(val) => setSelectedLocation(val)}
              placeholder="Search locations..."
              searchPlaceholder="District or zone..."
              defaultIcon={<MapPin className="w-4 h-4" />}
              showAllOption
              allOptionLabel="All Locations"
              clearable
              showFooter={false}
            />
            {selectedLocation && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: <span className="text-rose-400">{selectedLocation}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Massive Dataset - 50,000 items */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Tag className="w-6 h-6 text-amber-400" />
            🚀 Stress Test: 50,000 Items
            <span className="ml-2 px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded">
              Virtual Scrolling + Trie Index
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This combobox contains <strong className="text-amber-400">50,000 items</strong>. 
            Try searching - the fuzzy search, Trie index, and virtual scrolling ensure smooth performance.
          </p>
          <Combobox
            options={massiveDataset}
            value={selectedMassive}
            onChange={(val) => setSelectedMassive(val)}
            placeholder="Search through 50,000 items..."
            searchPlaceholder="Try: 'gold ring', 'diamond 10g', '#00500'..."
            defaultIcon={<Gem className="w-4 h-4" />}
            showAllOption
            allOptionLabel="All Items"
            clearable
          />
          {selectedMassive && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Selected: <span className="text-amber-400 font-medium">{selectedMassive}</span>
            </p>
          )}
          
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Performance Features:</h4>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>✓ Virtual scrolling - only visible items rendered (~20 DOM nodes)</li>
              <li>✓ Trie-based prefix index for O(m) searches on large datasets</li>
              <li>✓ LRU cache (15K entries) with proper eviction policy</li>
              <li>✓ Advanced fuzzy matching with word boundary bonuses</li>
              <li>✓ RequestAnimationFrame-based scroll handling</li>
              <li>✓ Debounced input (100ms) prevents excessive filtering</li>
              <li>✓ Memoized option components prevent re-renders</li>
              <li>✓ GPU-accelerated transforms with will-change hints</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
