import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Contractor } from '@/types';
import type { AccountType, BuyerProfile } from '@/lib/buyer';

const accountTypeOf = (s: Session | null): AccountType | null =>
  !s ? null : s.user.user_metadata?.account_type === 'buyer' ? 'buyer' : 'contractor';

export interface CompanySignupProfile {
  company_name: string;
  contact_person: string;
  phone: string;
  region: string;
  address: string;
  pcab_license_no: string;
}

export const UNCONFIRMED_EMAIL_MESSAGE =
  'Your email address has not been confirmed yet. Check your inbox for the confirmation link.';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  accountType: AccountType | null;
  buyer: BuyerProfile | null;
  contractor: Contractor | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    profile: CompanySignupProfile,
    captchaToken?: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (
    email: string,
    password: string,
    as: AccountType,
    captchaToken?: string,
  ) => Promise<{ error: string | null; unconfirmed: boolean }>;
  signUpBuyer: (
    email: string,
    password: string,
    profile: BuyerProfile,
    captchaToken?: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  updateBuyer: (profile: BuyerProfile) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshContractor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadContractor(userId: string) {
    const { data } = await supabase
      .from('contractors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setContractor(data as Contractor | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadContractor(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadContractor(session.user.id);
          setLoading(false);
        })();
      } else {
        setContractor(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, profile: CompanySignupProfile, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profile,
        emailRedirectTo: `${window.location.origin}/signin`,
        captchaToken,
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string, as: AccountType, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (!error) {
      const actual = accountTypeOf(data.session);
      if (actual === as) return { error: null, unconfirmed: false };
      await supabase.auth.signOut();
      return {
        error: actual === 'buyer'
          ? 'This is a buyer account. Switch to "For Buyers" to sign in.'
          : 'This is a contractor account. Switch to "For Contractors" to sign in.',
        unconfirmed: false,
      };
    }
    const unconfirmed =
      error.code === 'email_not_confirmed' || error.message === 'Email not confirmed';
    return { error: unconfirmed ? UNCONFIRMED_EMAIL_MESSAGE : error.message, unconfirmed };
  };

  const signUpBuyer = async (email: string, password: string, profile: BuyerProfile, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...profile, account_type: 'buyer' },
        emailRedirectTo: `${window.location.origin}/signin?as=buyer`,
        captchaToken,
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  };

  const updateBuyer = async (profile: BuyerProfile) => {
    const { data, error } = await supabase.auth.updateUser({ data: { ...profile, account_type: 'buyer' } });
    if (!error && data.user) setUser(data.user);
    return { error: error?.message ?? null };
  };

  const resendConfirmation = async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/signin`, captchaToken },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setContractor(null);
  };

  const refreshContractor = async () => {
    if (user) {
      await loadContractor(user.id);
    }
  };

  const accountType = accountTypeOf(session);
  const buyer = accountType === 'buyer' && user ? (user.user_metadata as BuyerProfile) : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        accountType,
        buyer,
        contractor,
        loading,
        signUp,
        signIn,
        signUpBuyer,
        updateBuyer,
        resendConfirmation,
        signOut,
        refreshContractor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
