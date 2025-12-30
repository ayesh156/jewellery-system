import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Invoices } from './pages/Invoices';
import { CreateInvoice } from './pages/CreateInvoice';
import { GRNPage } from './pages/GRN';
import { CreateGRN } from './pages/CreateGRN';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { PrintableInvoice } from './components/PrintableInvoice';
import { PrintableGRN } from './components/PrintableGRN';
import { mockInvoices, mockGRNs } from './data/mockData';
import './index.css';

// Wrapper component for PrintableInvoice that gets the invoice from mock data or localStorage
function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>();
  
  // First check localStorage for newly created invoice
  const storedInvoice = localStorage.getItem('printInvoice');
  if (storedInvoice) {
    try {
      const invoice = JSON.parse(storedInvoice);
      if (invoice.id === id) {
        // Clear localStorage after reading
        localStorage.removeItem('printInvoice');
        return <PrintableInvoice invoice={invoice} />;
      }
    } catch (e) {
      console.error('Error parsing stored invoice:', e);
    }
  }
  
  // Fall back to mock data
  const invoice = mockInvoices.find(inv => inv.id === id);
  
  if (!invoice) {
    return <div className="p-8 text-center">Invoice not found</div>;
  }
  
  return <PrintableInvoice invoice={invoice} />;
}

// Wrapper component for PrintableGRN that gets the GRN from mock data or localStorage
function PrintGRNPage() {
  const { id } = useParams<{ id: string }>();
  
  // First check localStorage for newly created GRN
  const storedGRN = localStorage.getItem('printGRN');
  if (storedGRN) {
    try {
      const grn = JSON.parse(storedGRN);
      if (grn.id === id) {
        // Clear localStorage after reading
        localStorage.removeItem('printGRN');
        return <PrintableGRN grn={grn} />;
      }
    } catch (e) {
      console.error('Error parsing stored GRN:', e);
    }
  }
  
  // Fall back to mock data
  const grn = mockGRNs.find(g => g.id === id);
  
  if (!grn) {
    return <div className="p-8 text-center">GRN not found</div>;
  }
  
  return <PrintableGRN grn={grn} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Print Routes - No Layout */}
        <Route path="/invoices/:id/print" element={<PrintInvoicePage />} />
        <Route path="/grn/:id/print" element={<PrintGRNPage />} />

        {/* Main App Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/grn" element={<GRNPage />} />
          <Route path="/grn/create" element={<CreateGRN />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
