import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Invoices } from './pages/Invoices';
import { CreateInvoice } from './pages/CreateInvoice';
import { EditInvoice } from './pages/EditInvoice';
import { Clearances } from './pages/Clearances';
import { CreateClearance } from './pages/CreateClearance';
import { EditClearance } from './pages/EditClearance';
import { Categories } from './pages/Categories';
import { GoldTypes } from './pages/GoldTypes';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { PrintableInvoice } from './components/PrintableInvoice';
import { PrintableClearance } from './components/PrintableClearance';
import { invoicesApi, clearanceApi, companyApi } from './services/api';
import { Toaster } from 'react-hot-toast';
import type { CompanyInfo } from './types';
import './index.css';

// Private route wrapper — redirects to login if not authenticated
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
          <div className="w-12 h-12 border-3 border-slate-700 border-t-amber-500 rounded-full" style={{ animation: 'appSpin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Hook to load company data from API for print pages
function useCompanyData(): CompanyInfo | undefined {
  const [company, setCompany] = React.useState<CompanyInfo | undefined>(undefined);
  React.useEffect(() => {
    companyApi.get().then(res => setCompany(res.data)).catch(() => {});
  }, []);
  return company;
}

// Print preview wrapper with modern print button
function PrintPreviewWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <>
      <style>{`
        .print-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: #1e293b;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        .print-toolbar .toolbar-title {
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
        }
        .print-toolbar .toolbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .print-toolbar .btn-print {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: #f59e0b;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .print-toolbar .btn-print:hover {
          background: #d97706;
        }
        .print-toolbar .btn-back {
          padding: 8px 16px;
          background: transparent;
          color: #94a3b8;
          border: 1px solid #475569;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .print-toolbar .btn-back:hover {
          background: #334155;
          color: #f1f5f9;
        }
        .print-preview-body {
          padding-top: 56px;
          background: #e2e8f0;
          min-height: 100vh;
        }
        @media print {
          .print-toolbar { display: none !important; }
          .print-preview-body { padding-top: 0; background: white; min-height: auto; }
        }
      `}</style>
      <div className="print-toolbar">
        <span className="toolbar-title">{title}</span>
        <div className="toolbar-actions">
          <button className="btn-back" onClick={() => window.history.back()}>← Back</button>
          <button className="btn-print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>
      </div>
      <div className="print-preview-body">
        {children}
      </div>
    </>
  );
}

// Wrapper component for PrintableInvoice that gets the invoice from API or localStorage
function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = React.useState<any>(null);
  const [notFound, setNotFound] = React.useState(false);
  const company = useCompanyData();

  React.useEffect(() => {
    // First check localStorage for newly created invoice
    const storedInvoice = localStorage.getItem('printInvoice');
    if (storedInvoice) {
      try {
        const parsed = JSON.parse(storedInvoice);
        if (parsed.id === id) {
          localStorage.removeItem('printInvoice');
          setInvoice(parsed);
          return;
        }
      } catch (e) {
        console.error('Error parsing stored invoice:', e);
      }
    }

    // Fall back to API
    if (id) {
      invoicesApi.getById(id).then(res => {
        const inv = res.data;
        setInvoice({
          ...inv,
          subtotal: Number(inv.subtotal),
          discount: Number(inv.discount),
          tax: Number(inv.tax),
          total: Number(inv.total),
          amountPaid: Number(inv.amountPaid),
          balanceDue: Number(inv.balanceDue),
          items: (inv.items || []).map((item: any) => ({
            ...item,
            metalWeight: item.metalWeight ? Number(item.metalWeight) : 0,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
        });
      }).catch(() => setNotFound(true));
    }
  }, [id]);

  if (notFound) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif' }}>
      <div style={{ textAlign:'center',padding:'48px',background:'white',borderRadius:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',maxWidth:'420px',width:'100%' }}>
        <div style={{ width:'64px',height:'64px',borderRadius:'50%',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize:'20px',fontWeight:700,color:'#1e293b',margin:'0 0 8px' }}>Invoice Not Found</h2>
        <p style={{ fontSize:'14px',color:'#64748b',margin:'0 0 24px' }}>The invoice you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => window.close()} style={{ padding:'10px 28px',background:'#1e293b',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer' }}>Close Tab</button>
      </div>
    </div>
  );
  if (!invoice) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <style>{`
          @keyframes invoiceSpin { to { transform: rotate(360deg); } }
          @keyframes invoicePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        `}</style>
        <div style={{ width:'48px',height:'48px',border:'3px solid #e2e8f0',borderTopColor:'#f59e0b',borderRadius:'50%',animation:'invoiceSpin 0.8s linear infinite',margin:'0 auto 20px' }} />
        <p style={{ fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 4px' }}>Preparing Invoice</p>
        <p style={{ fontSize:'13px',color:'#94a3b8',animation:'invoicePulse 1.5s ease-in-out infinite' }}>Loading document...</p>
      </div>
    </div>
  );

  return (
    <PrintPreviewWrapper title="Invoice Preview">
      <PrintableInvoice invoice={invoice} company={company} />
    </PrintPreviewWrapper>
  );
}

// Wrapper component for PrintableClearance that gets the clearance from API or localStorage
function PrintClearancePage() {
  const { id } = useParams<{ id: string }>();
  const [clearance, setClearance] = React.useState<any>(null);
  const [notFound, setNotFound] = React.useState(false);
  const company = useCompanyData();

  React.useEffect(() => {
    // First check localStorage for newly created clearance
    const storedClearance = localStorage.getItem('printClearance');
    if (storedClearance) {
      try {
        const parsed = JSON.parse(storedClearance);
        if (parsed.id === id) {
          localStorage.removeItem('printClearance');
          setClearance(parsed);
          return;
        }
      } catch (e) {
        console.error('Error parsing stored clearance:', e);
      }
    }

    // Fall back to API
    if (id) {
      clearanceApi.getById(id).then(res => {
        const clr = res.data;
        setClearance({
          ...clr,
          subtotal: Number(clr.subtotal),
          discount: Number(clr.discount),
          tax: Number(clr.tax),
          total: Number(clr.total),
          amountPaid: Number(clr.amountPaid),
          balanceDue: Number(clr.balanceDue),
          items: (clr.items || []).map((item: any) => ({
            ...item,
            metalWeight: item.metalWeight ? Number(item.metalWeight) : 0,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
        });
      }).catch(() => setNotFound(true));
    }
  }, [id]);

  if (notFound) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif' }}>
      <div style={{ textAlign:'center',padding:'48px',background:'white',borderRadius:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',maxWidth:'420px',width:'100%' }}>
        <div style={{ width:'64px',height:'64px',borderRadius:'50%',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize:'20px',fontWeight:700,color:'#1e293b',margin:'0 0 8px' }}>Clearance Not Found</h2>
        <p style={{ fontSize:'14px',color:'#64748b',margin:'0 0 24px' }}>The clearance sale you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => window.close()} style={{ padding:'10px 28px',background:'#1e293b',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:'pointer' }}>Close Tab</button>
      </div>
    </div>
  );
  if (!clearance) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <style>{`
          @keyframes clearanceSpin { to { transform: rotate(360deg); } }
          @keyframes clearancePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        `}</style>
        <div style={{ width:'48px',height:'48px',border:'3px solid #e2e8f0',borderTopColor:'#f59e0b',borderRadius:'50%',animation:'clearanceSpin 0.8s linear infinite',margin:'0 auto 20px' }} />
        <p style={{ fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 4px' }}>Preparing Clearance</p>
        <p style={{ fontSize:'13px',color:'#94a3b8',animation:'clearancePulse 1.5s ease-in-out infinite' }}>Loading document...</p>
      </div>
    </div>
  );

  return (
    <PrintPreviewWrapper title="Clearance Preview">
      <PrintableClearance clearance={clearance} company={company} />
    </PrintPreviewWrapper>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #1e293b)',
              color: 'var(--toast-color, #f1f5f9)',
              border: '1px solid var(--toast-border, #334155)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            },
            success: {
              iconTheme: { primary: '#f59e0b', secondary: '#1e293b' },
              style: { borderColor: 'rgba(245,158,11,0.3)' },
            },
            error: {
              duration: 5000,
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
              style: { borderColor: 'rgba(239,68,68,0.3)' },
            },
          }}
        />
        <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Print Routes - No Layout */}
        <Route path="/invoices/:id/print" element={<PrintInvoicePage />} />
        <Route path="/clearance/:id/print" element={<PrintClearancePage />} />

        {/* Main App Routes with Layout — Protected */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/invoices/:id/edit" element={<EditInvoice />} />
          <Route path="/clearance" element={<Clearances />} />
          <Route path="/clearance/create" element={<CreateClearance />} />
          <Route path="/clearance/:id/edit" element={<EditClearance />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/gold-types" element={<GoldTypes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Redirect to dashboard if already logged in
function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <style>{`@keyframes loginSpin { to { transform: rotate(360deg); } }`}</style>
          <div className="w-12 h-12 border-3 border-slate-700 border-t-amber-500 rounded-full" style={{ animation: 'loginSpin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
}

export default App;
