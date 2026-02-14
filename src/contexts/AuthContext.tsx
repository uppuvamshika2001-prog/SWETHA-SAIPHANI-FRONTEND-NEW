import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppRole, Profile } from '@/types';
import { api, User as ApiUser } from '@/services/api';

// Adapt types to maintain compatibility or define new ones
// We intentionally diverge from Supabase types here.
type User = ApiUser

interface AuthContextType {
  user: User | null;
  // Session is legacy from Supabase, we'll keep it as object or null for compatibility if needed,
  // but strictly we don't have a Supabase session. We'll mark it any or null.
  session: any | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string, expectedRole: AppRole) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard to prevent multiple bootstrap attempts
  const bootstrapAttempted = React.useRef(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('[AUTH_BOOTSTRAP] Calling /auth/me...');
      const userData = await api.getMe();
      const userRole = userData.role.toLowerCase() as AppRole;

      const currentUser: User = {
        id: userData.userId,
        email: userData.email,
        role: userRole,
      };

      setUser(currentUser);
      setRole(userRole);

      // Mock profile/session since backend user structure differs from Supabase
      // In a real app, you'd fetch /api/users/profile or similar
      const names = userData.email.split('@')[0];
      setProfile({
        id: userData.userId,
        user_id: userData.userId,
        full_name: names, // Temporary fallback
        email: userData.email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setSession({
        user: currentUser,
        access_token: localStorage.getItem('accessToken'),
      });

      console.log('[AUTH_BOOTSTRAP_SUCCESS] User authenticated:', userRole);

    } catch (error) {
      console.error('[AUTH_BOOTSTRAP_ERROR] Error fetching profile:', error);
      // Token might be invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setRole(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent multiple bootstrap attempts (e.g., from StrictMode double-render)
    if (bootstrapAttempted.current) {
      console.log('[AUTH_BOOTSTRAP] Already attempted, skipping...');
      return;
    }
    bootstrapAttempted.current = true;

    console.log('[AUTH_BOOTSTRAP_START] Checking for existing session...');
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('[AUTH_BOOTSTRAP] Token found, fetching user profile...');
      fetchUserProfile().then(() => {
        console.log('[AUTH_BOOTSTRAP_END] Profile fetch complete');
      });
    } else {
      console.log('[AUTH_BOOTSTRAP_END] No token found, user is not authenticated');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - bootstrap runs EXACTLY once

  const signIn = async (email: string, password: string, expectedRole: AppRole): Promise<{ error: string | null }> => {
    try {
      const { user: authUser, tokens } = await api.login(email, password);

      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      const userRole = authUser.role.toLowerCase() as AppRole;

      if (userRole !== expectedRole) {
        // In strict mode we might logout, but here we just warn if needed or block.
        // Actually, if backend allows login, we are logged in.
        // But front-end logic requires strict portal separation.
        // We'll check compatibility.
        if (userRole !== expectedRole) {
          await signOut();
          return { error: `This login page is for ${expectedRole.replace('_', ' ')}s only.` };
        }
      }

      const currentUser: User = {
        id: authUser.id,
        email: authUser.email,
        role: userRole,
      };

      setUser(currentUser);
      setRole(userRole);

      // Mock profile/session logic duplicated from fetchUserProfile
      const names = authUser.email.split('@')[0];
      setProfile({
        id: authUser.id,
        user_id: authUser.id,
        full_name: names,
        email: authUser.email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setSession({
        user: currentUser,
        access_token: tokens.accessToken,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error.message || 'Authentication failed' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole): Promise<{ error: string | null }> => {
    try {
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ') || 'User';

      await api.register(email, password, firstName, lastName, role);

      // Auto login after register? Backend register returns tokens?
      // Check backend controller: register returns result.
      // authService.register returns { user, tokens }.
      // So yes, we can auto login.

      // For now, let's just return success and let user login or auto-trigger login.
      // Actually, standard is to require login or just set tokens.
      // I'll require login for simplicity or just return null error.

      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: error.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    // Capture current role before clearing state
    const currentRole = role;

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch (e) {
        console.error('Logout error', e);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);

    // Redirect to role-specific login page
    let loginPath = '/';
    if (currentRole === 'admin') loginPath = '/admin/login';
    else if (currentRole === 'doctor') loginPath = '/doctor/login';
    else if (currentRole === 'receptionist') loginPath = '/reception/login';
    else if (currentRole === 'pharmacist') loginPath = '/pharmacy/login';
    else if (currentRole === 'lab_technician') loginPath = '/lab/login';
    else if (currentRole === 'patient') loginPath = '/patient/login';

    console.log(`[AUTH] Signed out, redirecting to ${loginPath}`);
    window.location.href = loginPath;
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    return { error: 'Please contact administrator to reset password.' };
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile: fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
