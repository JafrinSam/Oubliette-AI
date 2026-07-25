import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Datasets from './pages/Datasets';
import Upload from './pages/Upload';
import JobDetail from './pages/JobDetail';
import ScriptLab from './pages/ScriptLab';
import RuntimeManager from './pages/RuntimeManager';
import Docs from './pages/Docs';
import CreateJob from './pages/CreateJob';
import ModelRegistry from './pages/ModelRegistry';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';
import AuditDashboard from './pages/AuditDashboard';

// Protected route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-text-muted">Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-text-muted">Initializing secure session...</div>;

    return (
        <Routes>
            {/* Public route */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="datasets" element={<Datasets />} />
                <Route path="upload" element={<Upload />} />
                <Route path="script-lab" element={<ScriptLab />} />
                <Route path="runtimes" element={<RuntimeManager />} />
                <Route path="docs" element={<Docs />} />
                <Route path="create-job" element={<CreateJob />} />
                <Route path="models" element={<ModelRegistry />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="audit" element={<AuditDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
