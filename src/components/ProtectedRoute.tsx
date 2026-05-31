import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('authority' | 'maintenance' | 'citizen')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const userStr = localStorage.getItem('roadwatch_user');

  if (!userStr) {
    // Redirect to login page and keep the target path in redirect search param
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check if user has an allowed role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their default dashboard based on their role
      if (user.role === 'citizen') {
        return <Navigate to="/citizen" replace />;
      } else if (user.role === 'maintenance') {
        return <Navigate to="/gov-dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  } catch (e) {
    console.error('Failed to parse user session, logging out:', e);
    localStorage.removeItem('roadwatch_user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
