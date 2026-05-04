import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ name: 'Guest User', email: 'guest@example.com' });
  const loading = false;

  const login = (userData, token) => {
    setUser(userData);
  };

  const logout = () => {
    setUser({ name: 'Guest User', email: 'guest@example.com' });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
