import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Datasets from './pages/Datasets';
import Upload from './pages/Upload';
import JobDetail from './pages/JobDetail';
import ScriptLab from './pages/ScriptLab';
import RuntimeManager from './pages/RuntimeManager';
import Docs from './pages/Docs';
import CreateJob from './pages/CreateJob'; // Imported RuntimeManager

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="datasets" element={<Datasets />} />
              <Route path="upload" element={<Upload />} />
              <Route path="script-lab" element={<ScriptLab />} />
              <Route path="runtimes" element={<RuntimeManager />} />
              <Route path="docs" element={<Docs />} />
              <Route path="create-job" element={<CreateJob />} />
              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
