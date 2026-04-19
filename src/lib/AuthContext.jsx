import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check current session on load
    checkUser();

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchProfile(session.user);
    } else {
      setIsLoadingAuth(false);
    }
  };

 const fetchProfile = async (authUser) => {
    try {
      // This gets the 'role' (Admin vs User) from your Supabase table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn("Profile not found, using default user data.");
        setUser(authUser); // Just use basic auth data if profile fails
      } else {
        setUser({ ...authUser, ...profile });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setUser(authUser);
    } finally {
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const navigateToLogin = () => {
    // Since we are in a demo, we will just send them to your login page
    window.location.href = '/login'; 
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false, // Set to false to bypass old builder checks
      authError,
      logout,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};