import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import ProtectedRoute from './components/common/ProtectedRoute';
import NotFound from './components/common/NotFound';

import Landing from './pages/public/Landing';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';

import AdminDashboard from './pages/dashboards/AdminDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';

import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';

import ClientList from './pages/clients/ClientList';
import ClientDetail from './pages/clients/ClientDetail';

import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';

import ProjectRequests from './pages/projects/ProjectRequests';

import TaskList from './pages/tasks/TaskList';
import TaskDetail from './pages/tasks/TaskDetail';

import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';

import FileManager from './pages/files/FileManager';
import Profile from './pages/profile/Profile';

const DashboardRedirect = () => {
  const { user, token, isLoading } = useSelector((state) => state.auth);

  // Important: do not render different trees while auth is still settling
  if (isLoading) {
    return (
      <div className="card">
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'developer':
      return <DeveloperDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/project-requests" element={<ProjectRequests />} />
          </Route>

          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'client']} />}>
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
          </Route>

          <Route path="/files" element={<FileManager />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<NotFound message="You are not authorized to view this page" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;