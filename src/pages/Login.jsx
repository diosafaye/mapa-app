import { useState } from 'react';
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Loader2, Map, Shield, User } from "lucide-react";

export default function Login() {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // ✅ Sign up flow
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
      } else {
        // ✅ Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Map className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-foreground tracking-tight">
            MAPA sa Bohol
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Heritage Information System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">

          {/* Tab switcher — only show on sign in */}
          {!isSignUp && (
            <div className="flex border-b border-border">
              <button
                onClick={() => setIsAdminLogin(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                  !isAdminLogin
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                User
              </button>
              <button
                onClick={() => setIsAdminLogin(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                  isAdminLogin
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="p-6 space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isSignUp
                  ? "Join to explore Bohol's heritage"
                  : isAdminLogin
                  ? "Administrator access only"
                  : ""}
              </p>
            </div>

            <div className="space-y-3">
              {/* Full name only on sign up */}
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${
                isAdminLogin && !isSignUp
                  ? 'bg-foreground text-background hover:opacity-90 shadow-foreground/20'
                  : 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/30'
              }`}
            >
              {loading
                ? <Loader2 className="animate-spin mx-auto w-5 h-5" />
                : isSignUp
                ? "Create Account"
                : isAdminLogin
                ? "Access Admin Panel"
                : "Sign In"
              }
            </button>

            {/* ✅ Toggle between sign in and sign up */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={switchMode}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </form>

          {/* Footer inside card */}
          <div className="px-6 pb-6 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Bohol Heritage Documentation Project
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}