import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface JwtPayload {
  userId: number;
  role: 'admin' | 'trainee';
  username: string;
}

interface AuthUser extends JwtPayload {}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as AuthUser;
  } catch {
    return null;
  }
}

function getStoredUser(): AuthUser | null {
  const token = localStorage.getItem('token');
  return token ? parseToken(token) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setUser(parseToken(token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
