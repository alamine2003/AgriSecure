import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import RequireRole from './components/RequireRole';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterAgent from './pages/RegisterAgent';
import ChangePassword from './pages/ChangePasswordV3';
import Dashboard from './pages/Dashboard';
import AgentDashboardModular from './pages/AgentDashboardModular';
import PerimeterDefinitionAdvanced from './pages/PerimeterDefinitionAdvanced';
import MaintenancierDashboard from './pages/MaintenancierDashboard';
import AgentsManagement from './pages/AgentsManagement';
import RegistrationRequests from './pages/RegistrationRequests';
import InstallationAppointments from './pages/InstallationAppointments';
import Surveillance from './pages/Surveillance';
import Reports from './pages/Reports';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-agent" element={<RegisterAgent />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées avec layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/agent/dashboard"
            element={
              <RequireRole role="agent_agricole">
                <AgentDashboardModular />
              </RequireRole>
            }
          />
          <Route
            path="/agent/perimeter"
            element={
              <RequireRole role="agent_agricole">
                <PerimeterDefinitionAdvanced />
              </RequireRole>
            }
          />
          <Route
            path="/maintenancier/dashboard"
            element={
              <RequireRole role="maintenancier">
                <MaintenancierDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/maintenancier/agents"
            element={
              <RequireRole role="maintenancier">
                <AgentsManagement />
              </RequireRole>
            }
          />
          <Route
            path="/maintenancier/inscription"
            element={
              <RequireRole role="maintenancier">
                <RegistrationRequests />
              </RequireRole>
            }
          />
          <Route
            path="/maintenancier/rendezvous"
            element={
              <RequireRole role="maintenancier">
                <InstallationAppointments />
              </RequireRole>
            }
          />
          <Route
            path="/surveillance"
            element={
              <RequireRole role="agent_agricole">
                <Surveillance />
              </RequireRole>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireRole role="agent_agricole">
                <Reports />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;