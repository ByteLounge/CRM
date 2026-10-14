import {
  ArrowRight,
  Database,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, signup, loginDemo } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('operator@flowcrm.store');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || err.message || 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginDemo();
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-2">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            Welcome to FlowCRM
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Intelligent CRM for WooCommerce stores with Supabase Auth & Multi-Tenant Isolation.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* 1-Click Fast-Track Demo Login for Evaluators */}
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-center space-y-2">
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Hackathon Evaluator Fast-Track
              </span>
              <p className="text-xs text-muted-foreground">
                Instant one-click access with pre-configured WooCommerce store and AI retention scan.
              </p>
              <Button
                type="button"
                onClick={handleDemoLogin}
                isLoading={isLoading}
                className="w-full text-xs font-semibold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Instant 1-Click Demo Login
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border/80 w-full" />
              <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                Or Supabase Authentication
              </span>
            </div>

            {/* Mode Toggle Pills (Sign In vs Create Account) */}
            <div className="flex rounded-lg bg-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                  mode === 'signin'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                  mode === 'signup'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* Standard Supabase Login/Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="operator@flowcrm.store"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Password</label>
                  {mode === 'signin' && (
                    <span className="text-[10px] text-muted-foreground">Demo: password123</span>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant={mode === 'signup' ? 'primary' : 'outline'}
                className="w-full text-xs h-10 font-semibold"
                isLoading={isLoading}
              >
                {mode === 'signup' ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Register with Supabase Auth
                  </>
                ) : (
                  'Sign In with Supabase'
                )}
              </Button>
            </form>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <Database className="w-3.5 h-3.5" /> Supabase Auth
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Multi-Tenant RLS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-blue-500" /> WooCommerce v3
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
