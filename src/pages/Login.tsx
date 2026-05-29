import React from 'react';
import { Shield, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Login() {
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none map-bg"></div>
      
      <header className="bg-surface/80 dark:bg-deep-slate/80 backdrop-blur-md w-full top-0 border-b border-border-subtle shadow-sm z-50 sticky">
        <div className="flex justify-between items-center w-full px-8 max-w-[1440px] mx-auto h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">RoadWatch AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-body-md text-text-secondary hover:text-primary transition-colors duration-200 hidden md:block">Support</button>
            <button className="bg-surface-container-low text-primary px-4 py-2 rounded-lg text-title-md font-semibold hover:bg-surface-container-high transition-colors btn-inset">Request Access</button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10 w-full">
        <div className="glass-panel w-full max-w-md rounded-xl p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container-high mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title-md font-semibold text-primary mb-2">RoadWatch AI</h1>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Sign in to Urban Intelligence</h2>
            <p className="text-body-md text-text-secondary">Access secure infrastructure data & analytics.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Government Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-text-secondary" />
                </div>
                <input 
                  type="email" 
                  required 
                  placeholder="official@city.gov" 
                  className="block w-full pl-10 pr-3 py-2 bg-surface-bright border border-border-subtle rounded-lg focus:ring-1 focus:ring-deep-slate focus:bg-surface-container-lowest text-body-md text-on-surface placeholder-text-secondary/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Passkey / Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-text-secondary" />
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-3 py-2 bg-surface-bright border border-border-subtle rounded-lg focus:ring-1 focus:ring-deep-slate focus:bg-surface-container-lowest text-body-md text-on-surface placeholder-text-secondary/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 text-deep-slate focus:ring-deep-slate border-border-subtle rounded bg-surface-bright"
                />
                <label htmlFor="remember-me" className="ml-2 block text-body-md text-text-secondary">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-body-sm text-on-surface hover:text-safety-yellow transition-colors font-medium">
                  Forgot password?
                </a>
              </div>
            </div>

            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-primary bg-safety-yellow hover:bg-secondary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safety-yellow text-title-md transition-all duration-200 btn-inset active:scale-95 shadow-sm">
              Sign In securely
            </button>
          </form>

          <div className="mt-8 border-t border-border-subtle pt-6 text-center">
            <p className="text-body-sm text-text-secondary">
              New official? <a href="#" className="text-title-md text-primary hover:text-safety-yellow transition-colors">Request Access</a>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-surface-bright dark:bg-deep-slate w-full bottom-0 border-t border-border-subtle z-50 relative">
        <div className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="text-title-md font-semibold text-primary">RoadWatch AI</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#" className="text-body-sm text-text-secondary hover:text-primary underline transition-opacity">Privacy Policy</a>
            <a href="#" className="text-body-sm text-text-secondary hover:text-primary underline transition-opacity">Terms of Service</a>
            <a href="#" className="text-body-sm text-text-secondary hover:text-primary underline transition-opacity">GDPR Compliance</a>
            <a href="#" className="text-body-sm text-text-secondary hover:text-primary underline transition-opacity">System Status</a>
          </nav>
          <div className="text-body-sm text-text-secondary">
            © {new Date().getFullYear()} RoadWatch AI. Precision Infrastructure Safety.
          </div>
        </div>
      </footer>
    </div>
  );
}
