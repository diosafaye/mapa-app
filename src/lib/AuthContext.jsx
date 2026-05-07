import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setIsLoadingAuth(false);
      return;
    }
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        setUser({ ...authUser, role: 'user' });
      } else {
        setUser({ ...authUser, ...profile });
      }
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user);
      else setIsLoadingAuth(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        // ✅ Explicitly clear all state on logout
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = async () => {
  try {
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout failed:", err);
  }
};
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);