import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Show loading spinner while checking session
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="animate-spin text-[var(--accent-color)]" size={40} />
      </div>
    );
  }

  // 2. Not Logged In? -> Go to Login
  if (!isAuthenticated) {
    // state={{ from: location }} allows you to redirect them back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged in but wrong Role? -> Go to 404 or Unauthorized page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  // 4. Authorized -> Render the Admin Layout (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;