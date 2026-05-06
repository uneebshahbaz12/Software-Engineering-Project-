import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        const { data } = await authAPI.getMe();
        setUser(data.user);
        setProfiles(data.profiles);
        const savedProfileId = await AsyncStorage.getItem('activeProfileId');
        const active = data.profiles.find((p) => String(p.id) === String(savedProfileId)) || data.profiles[0];
        setActiveProfile(active);
      }
    } catch (err) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['token', 'activeProfileId']);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('activeProfileId', String(data.profiles[0]?.id || ''));
    setToken(data.token);
    setUser(data.user);
    setProfiles(data.profiles);
    setActiveProfile(data.profiles[0]);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password, agreedToTerms: true });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('activeProfileId', String(data.profile?.id || ''));
    setToken(data.token);
    setUser(data.user);
    setProfiles([data.profile]);
    setActiveProfile(data.profile);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'activeProfileId']);
    setToken(null);
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
  };

  const switchProfile = async (profile, pin) => {
    // If profile has PIN and no pin provided, request it
    if (profile.pin && !pin) {
      throw new Error('PIN_REQUIRED');
    }
    // If profile has PIN, verify it
    if (profile.pin && pin) {
      try {
        await authAPI.verifyPin(profile.id, pin);
      } catch (e) {
        throw new Error('INVALID_PIN');
      }
    }
    await AsyncStorage.setItem('activeProfileId', String(profile.id));
    setActiveProfile(profile);
  };

  return (
    <AuthContext.Provider value={{
      user, profiles, activeProfile, token, loading,
      login, register, logout, switchProfile, setProfiles, checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
