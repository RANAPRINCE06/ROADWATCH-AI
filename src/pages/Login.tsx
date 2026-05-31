import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getAuth, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

import { realFirebaseActive, db, setDocument, getDocRef } from '../utils/firebase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  Network
} from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  // Selected access type/role
  const [role, setRole] = useState<'authority' | 'maintenance' | 'citizen'>('authority');

  // Mouse position state for interactive parallax background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePos({ x, y });
  };

  // Error/Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper to parse Firebase error codes
  const handleFirebaseError = (error: any) => {
    console.error('Auth error:', error);
    const code = error.code || '';
    if (code === 'auth/invalid-email' || code === 'auth/invalid-credential') {
      showToast('Invalid Email', 'error');
    } else if (code === 'auth/wrong-password') {
      showToast('Incorrect Password', 'error');
    } else if (code === 'auth/user-not-found') {
      showToast('Account Not Found', 'error');
    } else if (code === 'auth/network-request-failed') {
      showToast('Network Error', 'error');
    } else if (code === 'auth/operation-not-allowed') {
      showToast('Operation Not Allowed: Please enable Email/Password and Google Sign-in in your Firebase Console.', 'error');
    } else if (code === 'auth/unauthorized-domain') {
      showToast('Unauthorized Domain: Please add localhost to your Firebase Auth Authorized Domains.', 'error');
    } else if (code === 'auth/popup-blocked') {
      showToast('Popup Blocked: Please allow popups to sign in with Google.', 'error');
    } else if (code === 'auth/popup-closed-by-user') {
      showToast('Popup Closed: Google sign-in was canceled before completion.', 'error');
    } else {
      showToast(error.message || 'An error occurred during authentication.', 'error');
    }
  };

  // On mount: handle Google redirect result after returning from accounts.google.com
  useEffect(() => {
    if (!realFirebaseActive) return;
    const auth = getAuth();
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return; // No pending redirect — normal page load
        const user = result.user;
        // Restore role that was saved before the redirect
        const savedRole = (localStorage.getItem('roadwatch_pending_google_role') as typeof role) || 'authority';
        localStorage.removeItem('roadwatch_pending_google_role');
        // Save role to Firestore (non-blocking)
        try {
          const userDocRef = getDocRef('users', user.uid);
          await setDocument(userDocRef, { email: user.email, role: savedRole });
        } catch (_) {}
        // Persist session
        const sessionUser = { email: user.email, uid: user.uid, role: savedRole, provider: 'google' };
        localStorage.setItem('roadwatch_user', JSON.stringify(sessionUser));
        showToast('Google Sign-In successful! Redirecting...', 'success');
        setTimeout(() => routeUser(savedRole), 1200);
      })
      .catch((err) => {
        // auth/no-auth-event fires on every normal page load — ignore it
        if (err?.code && err.code !== 'auth/no-auth-event') {
          showToast('Google Sign-In failed: ' + (err.message || err.code), 'error');
        }
      });
  }, []);

  // Handle Google Login — uses redirect flow (no popup) to avoid COOP browser warnings
  const handleGoogleLogin = () => {
    if (!realFirebaseActive) {
      // Mock mode simulation
      setIsAuthenticating(true);
      setTimeout(() => {
        const sessionUser = {
          email: 'google.demo@roadwatch.gov',
          uid: 'mock_google_uid_123',
          role: role,
          provider: 'google'
        };
        localStorage.setItem('roadwatch_user', JSON.stringify(sessionUser));
        showToast('Demo Google Login successful! Redirecting...', 'success');
        setTimeout(() => routeUser(role), 1200);
      }, 1500);
      return;
    }

    // Save role before redirect so we can restore it when Google returns us here
    localStorage.setItem('roadwatch_pending_google_role', role);
    setIsAuthenticating(true);

    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // signInWithRedirect: browser navigates to Google, then back — no popup, no COOP issue
    signInWithRedirect(auth, provider).catch((err: any) => {
      localStorage.removeItem('roadwatch_pending_google_role');
      handleFirebaseError(err);
      setIsAuthenticating(false);
    });
  };

  // Handle Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setToast(null);

    // Testing triggers for mock error states
    if (!realFirebaseActive) {
      setTimeout(() => {
        const lowerEmail = email.toLowerCase();
        if (!lowerEmail.includes('@')) {
          showToast('Invalid Email', 'error');
          setIsAuthenticating(false);
          return;
        }
        if (password.length < 6) {
          showToast('Incorrect Password', 'error');
          setIsAuthenticating(false);
          return;
        }
        if (lowerEmail === 'unknown@roadwatch.gov') {
          showToast('Account Not Found', 'error');
          setIsAuthenticating(false);
          return;
        }
        if (lowerEmail === 'network@roadwatch.gov') {
          showToast('Network Error', 'error');
          setIsAuthenticating(false);
          return;
        }

        // Successful mock sign-in
        const sessionUser = {
          email: email,
          uid: 'mock_uid_456',
          role: role,
          provider: 'email'
        };
        localStorage.setItem('roadwatch_user', JSON.stringify(sessionUser));
        showToast('Login successful! Welcome back.', 'success');

        setTimeout(() => {
          routeUser(role);
        }, 1200);
      }, 1500);
      return;
    }

    // Real Firebase auth
    try {
      const auth = getAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Store user role in Firestore (catch errors to prevent blocking login)
      try {
        const userDocRef = getDocRef('users', user.uid);
        await setDocument(userDocRef, { email: user.email, role: role });
      } catch (firestoreErr) {
        console.warn('Firestore write failed, proceeding with login:', firestoreErr);
      }

      const sessionUser = {
        email: user.email,
        uid: user.uid,
        role: role,
        provider: 'email'
      };
      localStorage.setItem('roadwatch_user', JSON.stringify(sessionUser));
      showToast('Login successful! Loading dashboard...', 'success');

      setTimeout(() => {
        routeUser(role);
      }, 1200);
    } catch (err: any) {
      handleFirebaseError(err);
      setIsAuthenticating(false);
    }
  };

  // Redirect based on selected role
  const routeUser = (selectedRole: typeof role) => {
    if (redirect) {
      navigate(decodeURIComponent(redirect));
      return;
    }

    if (selectedRole === 'authority') {
      navigate('/dashboard');
    } else if (selectedRole === 'maintenance') {
      navigate('/gov-dashboard');
    } else {
      navigate('/citizen');
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col lg:flex-row relative font-sans">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in-up border max-w-sm transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white border-green-500' 
            : toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-slate-800 text-white border-slate-700'
        }`}>
          <div className="relative w-4 h-4 flex-shrink-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Zap className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <div className="flex-1 text-xs font-bold leading-normal">
            {toast.message}
          </div>
        </div>
      )}

      {/* LEFT SIDE: Hero Content (60%) */}
      <div 
        onMouseMove={handleMouseMove}
        className="lg:w-3/5 bg-slate-100 border-r border-slate-200 p-8 lg:p-16 flex flex-col justify-between min-h-[500px] relative overflow-hidden group/hero"
      >
        {/* Interactive Parallax Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.25] bg-cover bg-center transition-transform duration-300 ease-out scale-[1.08]"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80')`,
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          }}
        />
        {/* Interactive map grid dot overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.25] map-bg transition-transform duration-500 ease-out"
          style={{
            transform: `translate(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px)`,
          }}
        />
        
        <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center max-w-2xl mx-auto lg:mx-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm w-fit">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Road Safety Command Center</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-900">
              Making Roads Safer Through Real-Time Intelligence
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
              Monitor hazards, track repairs, and improve road safety using AI-powered infrastructure monitoring.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="space-y-3 pt-4 border-t border-slate-200/60">
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-bold text-lg">✓</span>
              <span className="text-sm font-bold text-slate-800">Faster Hazard Detection</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-bold text-lg">✓</span>
              <span className="text-sm font-bold text-slate-800">Smarter Repair Prioritization</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-bold text-lg">✓</span>
              <span className="text-sm font-bold text-slate-800">Transparent Resolution Tracking</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-slate-400 mt-12 flex justify-between border-t border-slate-200/60 pt-4 max-w-2xl mx-auto lg:mx-0 w-full">
          <p>© {new Date().getFullYear()} ROADWATCH AI. All rights reserved.</p>
          <a href="#" className="hover:underline font-semibold">Government Operations Guide</a>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Card & Role switch (40%) */}
      <div className="lg:w-2/5 p-6 lg:p-12 flex flex-col justify-between items-center bg-slate-50 min-h-[600px] w-full">
        
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-slate-200/60 my-auto">
          
          {/* Logo & Headline */}
          <div className="mb-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <Network className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">ROADWATCH AI</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Sign in to access the Road Safety Command Center
            </p>
          </div>

          {/* Google SSO Login */}
          <button 
            type="button"
            disabled={isAuthenticating}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm mb-5"
          >
            {/* Google G logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or email credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. administrator@roadwatch.gov" 
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                <a href="#" className="text-[10px] font-bold text-slate-800 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center py-1">
              <input 
                id="remember-me-checkbox" 
                type="checkbox" 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded cursor-pointer accent-slate-900"
              />
              <label htmlFor="remember-me-checkbox" className="ml-2.5 block text-xs text-slate-500 font-semibold cursor-pointer select-none">
                Remember my session on this device
              </label>
            </div>

            {/* Role Switcher */}
            <div className="pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Select Access Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'authority', label: '🏛 Authority' },
                  { key: 'maintenance', label: '👷 Maintenance Team' },
                  { key: 'citizen', label: '👤 Citizen' }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key as any)}
                    className={`py-2.5 rounded-lg border text-[10px] font-black text-center transition-all cursor-pointer select-none ${
                      role === opt.key 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                        : 'border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign In Submit Button */}
            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Testing info helper */}
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[10px] text-slate-500 leading-relaxed font-semibold">
            <span className="font-bold text-slate-800 block mb-0.5">Quick Testing Tips:</span>
            Use any email/pass combination. To trigger error testing states:
            <ul className="list-disc pl-3.5 mt-1 font-semibold space-y-0.5">
              <li>Input <code className="text-red-600">unknown@roadwatch.gov</code> for Account Not Found.</li>
              <li>Input <code className="text-red-600">network@roadwatch.gov</code> for Network Error.</li>
              <li>Enter a short password (&lt;6 chars) for Incorrect Password.</li>
            </ul>
          </div>
        </div>

        {/* Security indicators */}
        <div className="w-full max-w-md mt-6 flex items-center justify-between text-[9px] text-slate-400 uppercase font-black tracking-widest gap-2 px-2">
          <span className="flex items-center gap-1">🔒 Secure Authentication</span>
          <span className="flex items-center gap-1">☁ Firebase Protected</span>
          <span className="flex items-center gap-1">⚡ Real-Time Monitoring Platform</span>
        </div>
      </div>
    </div>
  );
}

