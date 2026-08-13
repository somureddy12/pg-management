import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Owner pages
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/Dashboard';
import Floors from './pages/owner/Floors';
import Tenants from './pages/owner/Tenants';
import AddTenant from './pages/owner/AddTenant';
import TenantDetail from './pages/owner/TenantDetail';
import RentManagement from './pages/owner/RentManagement';
import Communications from './pages/owner/Communications';
import FoodMenu from './pages/owner/FoodMenu';
import Reports from './pages/owner/Reports';
import Expenses from './pages/owner/Expenses';

// Tenant pages
import TenantLayout from './components/tenant/TenantLayout';
import TenantDashboard from './pages/tenant/Dashboard';
import TenantRent from './pages/tenant/Rent';
import TenantMenu from './pages/tenant/Menu';
import TenantComplaints from './pages/tenant/Complaints';
import TenantNotices from './pages/tenant/Notices';

const OwnerRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'OWNER') return <Navigate to="/tenant" />;
  return children;
};

const TenantRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'TENANT') return <Navigate to="/owner" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Owner routes */}
          <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
            <Route index element={<OwnerDashboard />} />
            <Route path="floors" element={<Floors />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenants/add" element={<AddTenant />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="rent" element={<RentManagement />} />
            <Route path="communications" element={<Communications />} />
            <Route path="menu" element={<FoodMenu />} />
            <Route path="reports" element={<Reports />} />
            <Route path="expenses" element={<Expenses />} />
          </Route>

          {/* Tenant routes */}
          <Route path="/tenant" element={<TenantRoute><TenantLayout /></TenantRoute>}>
            <Route index element={<TenantDashboard />} />
            <Route path="rent" element={<TenantRent />} />
            <Route path="menu" element={<TenantMenu />} />
            <Route path="complaints" element={<TenantComplaints />} />
            <Route path="notices" element={<TenantNotices />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
