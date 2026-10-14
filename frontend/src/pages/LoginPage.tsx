import { ArrowRight, Bot, Lock, Mail, ShieldCheck, Sparkles, Store } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('operator@flowcrm.store');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await login(email);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await login('operator@flowcrm.store');
      navigate('/');
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
            Intelligent Customer Relationship Management designed for WooCommerce stores.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* 1-Click Demo Sign-in for Evaluators */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-center space-y-2">
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Hackathon Evaluator Fast-Track
              </span>
              <p className="text-xs text-muted-foreground">
                One-click instant access to the pre-loaded store, real customers, and AI retention scout.
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
                Or sign in with email
              </span>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="operator@flowcrm.store"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Password</label>
                  <span className="text-[10px] text-muted-foreground">Demo: any password</span>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full text-xs h-10 font-semibold"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-Tenant RLS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-indigo-500" /> WooCommerce v3
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
