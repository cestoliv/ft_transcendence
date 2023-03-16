import React, { Navigate, Outlet } from 'react-router';
import useAuth from '../hooks/useAuth';

const RequireAuth = () => {
	const { auth } = useAuth();

	return auth?.bearer && auth?.otp_ok ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
