import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProjectsPage from './pages/ProjectsPage';
import PaymentsPage from './pages/PaymentsPage';
import ContractsPage from './pages/ContractsPage';
import BudgetPage from './pages/BudgetPage';
import AuditPage from './pages/AuditPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}

export default App;
