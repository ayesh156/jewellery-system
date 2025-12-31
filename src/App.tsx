import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Invoices } from './pages/Invoices';
import { CreateInvoice } from './pages/CreateInvoice';
import { CreateSalesInvoice } from './pages/CreateSalesInvoice';
import { GRNPage } from './pages/GRN';
import { CreateGRN } from './pages/CreateGRN';
import { RepairJobs } from './pages/RepairJobs';
import { CreateRepairJob } from './pages/CreateRepairJob';
import { Pawning } from './pages/Pawning';
import { CreatePawnTicket } from './pages/CreatePawnTicket';
import { RedeemPawnTicket } from './pages/RedeemPawnTicket';
import { PayInterest } from './pages/PayInterest';
import { Categories } from './pages/Categories';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { PrintableInvoice } from './components/PrintableInvoice';
import { PrintableGRN } from './components/PrintableGRN';
import { PrintableRepairReceipt } from './components/PrintableRepairReceipt';
import { PrintablePawnTicket } from './components/PrintablePawnTicket';
import { PrintableRedemptionReceipt } from './components/PrintableRedemptionReceipt';
import { PrintableInterestReceipt } from './components/PrintableInterestReceipt';
import { mockInvoices, mockGRNs, mockRepairJobs, mockPawnTickets, mockPawnRedemptions } from './data/mockData';
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

// Wrapper component for PrintableRepairReceipt
function PrintRepairReceiptPage() {
  const { id } = useParams<{ id: string }>();
  
  // First check localStorage for newly created repair job
  const storedJob = localStorage.getItem('printRepairReceipt');
  if (storedJob) {
    try {
      const job = JSON.parse(storedJob);
      if (job.id === id) {
        // Clear localStorage after reading
        localStorage.removeItem('printRepairReceipt');
        return <PrintableRepairReceipt job={job} />;
      }
    } catch (e) {
      console.error('Error parsing stored repair job:', e);
    }
  }
  
  // Fall back to mock data
  const job = mockRepairJobs.find(j => j.id === id);
  
  if (!job) {
    return <div className="p-8 text-center">Repair job not found</div>;
  }
  
  return <PrintableRepairReceipt job={job} />;
}

// Wrapper component for PrintablePawnTicket
function PrintPawnTicketPage() {
  const { id } = useParams<{ id: string }>();
  
  // First check localStorage for newly created pawn ticket
  const storedTicket = localStorage.getItem('printPawnTicket');
  if (storedTicket) {
    try {
      const ticket = JSON.parse(storedTicket);
      if (ticket.id === id) {
        // Clear localStorage after reading
        localStorage.removeItem('printPawnTicket');
        return <PrintablePawnTicket ticket={ticket} />;
      }
    } catch (e) {
      console.error('Error parsing stored pawn ticket:', e);
    }
  }
  
  // Fall back to mock data
  const ticket = mockPawnTickets.find(t => t.id === id);
  
  if (!ticket) {
    return <div className="p-8 text-center">Pawn ticket not found</div>;
  }
  
  return <PrintablePawnTicket ticket={ticket} />;
}

// Wrapper component for PrintableRedemptionReceipt
function PrintRedemptionReceiptPage() {
  const { id } = useParams<{ id: string }>();
  
  // First check localStorage for newly created redemption
  const storedData = localStorage.getItem('printRedemption');
  if (storedData) {
    try {
      const { redemption, ticket } = JSON.parse(storedData);
      if (redemption.id === id) {
        // Clear localStorage after reading
        localStorage.removeItem('printRedemption');
        return <PrintableRedemptionReceipt redemption={redemption} ticket={ticket} />;
      }
    } catch (e) {
      console.error('Error parsing stored redemption:', e);
    }
  }
  
  // Fall back to mock data
  const redemption = mockPawnRedemptions.find(r => r.id === id);
  if (redemption) {
    const ticket = mockPawnTickets.find(t => t.id === redemption.ticketId);
    if (ticket) {
      return <PrintableRedemptionReceipt redemption={redemption} ticket={ticket} />;
    }
  }
  
  return <div className="p-8 text-center">Redemption receipt not found</div>;
}

// Wrapper component for PrintableInterestReceipt
function PrintInterestReceiptPage() {
  // The interest receipt data is stored in localStorage
  const storedData = localStorage.getItem('printInterestReceipt');
  if (storedData) {
    return <PrintableInterestReceipt />;
  }
  
  return <div className="p-8 text-center">Interest receipt not found</div>;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        {/* Print Routes - No Layout */}
        <Route path="/invoices/:id/print" element={<PrintInvoicePage />} />
        <Route path="/grn/:id/print" element={<PrintGRNPage />} />
        <Route path="/repairs/:id/print" element={<PrintRepairReceiptPage />} />
        <Route path="/pawning/:id/print" element={<PrintPawnTicketPage />} />
        <Route path="/pawning/redemption/:id/print" element={<PrintRedemptionReceiptPage />} />
        <Route path="/pawning/:ticketId/interest-receipt/:id/print" element={<PrintInterestReceiptPage />} />

        {/* Main App Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/invoices/create-sales" element={<CreateSalesInvoice />} />
          <Route path="/grn" element={<GRNPage />} />
          <Route path="/grn/create" element={<CreateGRN />} />
          <Route path="/repairs" element={<RepairJobs />} />
          <Route path="/repairs/create" element={<CreateRepairJob />} />
          <Route path="/pawning" element={<Pawning />} />
          <Route path="/pawning/create" element={<CreatePawnTicket />} />
          <Route path="/pawning/redeem/:id" element={<RedeemPawnTicket />} />
          <Route path="/pawning/pay-interest/:id" element={<PayInterest />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
