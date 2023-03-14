import React, { createContext, useState, ReactNode } from 'react';
import { IAuth } from '../interfaces';
import { useCookies } from 'react-cookie';

interface AuthContextType {
	auth: IAuth;
	setAuth: (auth: IAuth) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [cookies] = useCookies(['bearer']);
	const [auth, setAuth] = useState<IAuth>({
		bearer: cookies.bearer,
		otp_ok: false,
		user: null,
	});

	return <AuthContext.Provider value={{ auth, setAuth }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
