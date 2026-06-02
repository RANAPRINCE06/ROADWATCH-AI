import React, { useState } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Building2, 
  HardHat, 
  User, 
  Check, 
  Cloud, 
  Zap, 
  Activity, 
  Map, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  Network
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  auth, 
  realFirebaseActive, 
  setDocument, 
  getDocRef 
} from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [accessType, setAccessType] = useState<'authority' | 'maintenance' | 'citizen'>('authority');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const getRoleSettings = (emailStr: string) => {
    let role: 'admin' | 'citizen' = 'admin';
    let title = 'Municipal Authority';
    let dest = '/dashboard';
    let avatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80';

    if (accessType === 'maintenance') {
      role = 'admin';
      title = 'Maintenance Supervisor';
      dest = '/gov-dashboard';
      avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
    } else if (accessType === 'citizen') {
      role = 'citizen';
      title = 'Resident Citizen';
      dest = '/citizen';
      avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
    }

    return { role, title, dest, avatar };
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      let emailAddress = '';
      let uid = '';
      let displayName = 'Google User';

      if (realFirebaseActive) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        emailAddress = user.email || '';
        uid = user.uid;
        displayName = user.displayName || emailAddress.split('@')[0];
      } else {
        emailAddress = accessType === 'citizen' ? 'citizen.google@gmail.com' : 'authority.google@city.gov';
        uid = `mock-google-uid-${Date.now()}`;
        displayName = accessType === 'citizen' ? 'Mock Google Citizen' : 'Mock Google Authority';
      }

      const { role, title, dest, avatar } = getRoleSettings(emailAddress);

      const userProfile = {
        email: emailAddress,
        role,
        name: displayName,
        title,
        avatarUrl: avatar
      };

      const completeProfile = { ...userProfile, uid };
      if (realFirebaseActive) {
        await setDocument(getDocRef('users', uid), completeProfile);
      }
      
      localStorage.setItem('roadwatch_user_profile', JSON.stringify(completeProfile));
      localStorage.setItem('user_role', role);
      window.dispatchEvent(new Event('roadwatch-user-updated'));
      
      addToast('Authenticated successfully with Google.', 'success');
      setTimeout(() => {
        navigate(redirect || dest);
      }, 800);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let errMsg = 'Google Sign-In failed.';
      if (err.code === 'auth/network-request-failed') {
        errMsg = 'Network Error';
      }
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Invalid Email', 'error');
      return;
    }
    if (!password.trim() || password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);

    const { role, title, dest, avatar } = getRoleSettings(email);
    const namePart = email.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const userProfile = {
      email,
      role,
      name: displayName,
      title,
      avatarUrl: avatar
    };

    if (realFirebaseActive) {
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (loginErr: any) {
          if (
            loginErr.code === 'auth/user-not-found' || 
            loginErr.code === 'auth/invalid-credential' || 
            loginErr.code === 'auth/cannot-find-user'
          ) {
            try {
              // Sign up if user doesn't exist
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (signupErr: any) {
              if (signupErr.code === 'auth/invalid-email') {
                throw new Error('Invalid Email');
              } else if (signupErr.code === 'auth/weak-password') {
                throw new Error('Password is too weak');
              } else {
                throw new Error(signupErr.message || 'Authentication failed.');
              }
            }
          } else if (loginErr.code === 'auth/invalid-email') {
            throw new Error('Invalid Email');
          } else if (loginErr.code === 'auth/wrong-password') {
            throw new Error('Incorrect Password');
          } else if (loginErr.code === 'auth/network-request-failed') {
            throw new Error('Network Error');
          } else {
            throw new Error(loginErr.message || 'Authentication failed.');
          }
        }

        const user = userCredential.user;
        const completeProfile = { ...userProfile, uid: user.uid };
        
        await setDocument(getDocRef('users', user.uid), completeProfile);

        localStorage.setItem('roadwatch_user_profile', JSON.stringify(completeProfile));
        localStorage.setItem('user_role', role);
        window.dispatchEvent(new Event('roadwatch-user-updated'));
        
        addToast('Sign in successful. Entering system...', 'success');
        setTimeout(() => {
          navigate(redirect || dest);
        }, 800);
      } catch (err: any) {
        console.error('Firebase Auth Error:', err);
        let message = err.message || 'Authentication failed. Please verify credentials.';
        if (message.includes('auth/invalid-email') || message.includes('invalid-email')) {
          message = 'Invalid Email';
        } else if (message.includes('wrong-password') || message.includes('invalid-credential')) {
          message = 'Incorrect Password';
        } else if (message.includes('user-not-found')) {
          message = 'Account Not Found';
        } else if (message.includes('network-request-failed')) {
          message = 'Network Error';
        }
        addToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mock Login
      setTimeout(() => {
        const completeProfile = { ...userProfile, uid: `mock-uid-${Date.now()}` };
        localStorage.setItem('roadwatch_user_profile', JSON.stringify(completeProfile));
        localStorage.setItem('user_role', role);
        window.dispatchEvent(new Event('roadwatch-user-updated'));
        
        setIsLoading(false);
        addToast('Authenticated successfully (Offline Demo Mode).', 'success');
        setTimeout(() => {
          navigate(redirect || dest);
        }, 800);
      }, 1200);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen grid grid-cols-1 lg:grid-cols-10 relative overflow-hidden font-sans">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold transition-all duration-350 transform translate-y-0 animate-fade-in-up ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-650 shrink-0" />
            ) : toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-655 shrink-0" />
            ) : (
              <Shield className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 transition-colors font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* LEFT COLUMN: HERO & VISUAL PLATFORM PREVIEWS (60%) */}
      <section className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 bg-slate-100 border-r border-border-subtle relative overflow-hidden">
        {/* Background micro grid layout */}
        <div className="absolute inset-0 z-0 pointer-events-none map-bg opacity-40"></div>
        
        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Network className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">ROADWATCH AI</span>
        </div>

        {/* Hero Section & Interactive Simulated Preview */}
        <div className="relative z-10 my-auto py-8">
          <div className="max-w-xl">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Making Roads Safer Through Real-Time Intelligence
            </h1>
            <p className="text-sm xl:text-base text-text-secondary mt-3 leading-relaxed">
              Monitor hazards, track repairs, and improve road safety using AI-powered infrastructure monitoring.
            </p>
          </div>

          {/* Realistic Dashboard Previews Stack */}
          <div className="relative h-[290px] w-full max-w-[480px] mt-10">
            
            {/* Preview 1: System Analytics (Back layer) */}
            <div className="absolute top-0 left-0 bg-white border border-border-subtle rounded-xl shadow-md p-4 w-64 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 z-10">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600" /> Dashboard Analytics
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-text-secondary">Inference Speed</div>
                  <div className="text-lg font-bold text-slate-800">12.8ms <span className="text-[9px] text-emerald-600 font-medium">Optimal</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-text-secondary">Edge IoT Streams</div>
                  <div className="text-lg font-bold text-slate-800">1,280 <span className="text-[9px] text-slate-400 font-normal">Active</span></div>
                </div>
              </div>
            </div>

            {/* Preview 2: Live Heatmap (Middle layer, offset right) */}
            <div className="absolute top-6 right-0 bg-white border border-border-subtle rounded-xl shadow-md p-4 w-64 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 z-20">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Map className="w-3 h-3 text-red-500" /> Heatmap Coordinates
                </span>
                <span className="text-[8px] bg-red-55 px-1.5 py-0.5 rounded font-black text-red-700">14 Active</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 border border-slate-200/50 rounded">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-semibold text-slate-800">Orchard Rd</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Crater (Priority 92)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 border border-slate-200/50 rounded">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="font-semibold text-slate-800">Bayfront Ave</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Water (Priority 80)</span>
                </div>
              </div>
            </div>

            {/* Preview 3: Road Health Score (Front layer, offset bottom-left) */}
            <div className="absolute bottom-0 left-8 bg-white border border-border-subtle rounded-xl shadow-lg p-4 w-64 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-30">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> District Safety Scores
                </span>
                <span className="text-[9px] text-emerald-700 font-bold">82.5% Avg</span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-700">
                    <span>Marina Bay</span>
                    <span className="text-emerald-600">92%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-700">
                    <span>Orchard Sector</span>
                    <span className="text-blue-600">85%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Benefits Checklist Footer */}
        <div className="relative z-10 border-t border-slate-200/60 pt-6">
          <ul className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-800">
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-250 shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span>Faster Hazard Detection</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-250 shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span>Smarter Repair Prioritization</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-250 shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span>Transparent Tracking</span>
            </li>
          </ul>
        </div>
      </section>

      {/* RIGHT COLUMN: AUTHENTICATION CARD & CONTROLS (40%) */}
      <main className="lg:col-span-4 flex flex-col justify-center items-center p-6 bg-white relative z-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto animate-fade-in-up">
          
          {/* Header Mobile Brand & Welcomer */}
          <div className="mb-6 text-center lg:text-left">
            <div className="flex lg:hidden justify-center items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-primary tracking-tight">ROADWATCH AI</span>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-body-md text-text-secondary mt-1.5">
              Sign in to access the Road Safety Command Center
            </p>
          </div>

          {/* Access Type Role Selector Card UI */}
          <div className="mb-6 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1.5">Select Access Type</span>
            <div className="grid grid-cols-3 gap-1">
              
              <button
                type="button"
                onClick={() => setAccessType('authority')}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                  accessType === 'authority'
                    ? 'bg-white border border-border-subtle shadow-sm text-primary'
                    : 'text-text-secondary hover:text-slate-800'
                }`}
              >
                <Building2 className={`w-4 h-4 ${accessType === 'authority' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Authority</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('maintenance')}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                  accessType === 'maintenance'
                    ? 'bg-white border border-border-subtle shadow-sm text-primary'
                    : 'text-text-secondary hover:text-slate-800'
                }`}
              >
                <HardHat className={`w-4 h-4 ${accessType === 'maintenance' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Maintenance</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('citizen')}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                  accessType === 'citizen'
                    ? 'bg-white border border-border-subtle shadow-sm text-primary'
                    : 'text-text-secondary hover:text-slate-800'
                }`}
              >
                <User className={`w-4 h-4 ${accessType === 'citizen' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Citizen</span>
              </button>

            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            
            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov or citizen@gmail.com" 
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:bg-white text-body-md text-slate-900 placeholder-slate-400/80 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:bg-white text-body-md text-slate-900 placeholder-slate-400/80 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-200 rounded bg-slate-50 cursor-pointer"
                />
                <span className="text-text-secondary hover:text-slate-800 transition-colors select-none">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:underline" onClick={(e) => {
                e.preventDefault();
                addToast('Password reset email feature is in demo mode.', 'info');
              }}>
                Forgot Password?
              </a>
            </div>

            {/* Primary Sign In Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-safety-yellow text-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-wider">
              <span className="bg-white px-3 text-slate-450">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-800 font-bold transition-all active:scale-[0.98] text-xs gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.37 1 3.48 3.67 1.63 7.57l3.78 2.93c.88-2.65 3.37-4.46 6.59-4.46z"
              />
              <path
                fill="#4285F4"
                d="M23.45 12.3c0-.82-.07-1.6-.21-2.3H12v4.4h6.43c-.28 1.44-1.1 2.67-2.33 3.5l3.6 2.8c2.1-1.94 3.75-5.2 3.75-8.4z"
              />
              <path
                fill="#FBBC05"
                d="M5.41 14.5l-3.78 2.93c1.85 3.9 5.74 6.57 10.37 6.57 2.93 0 5.4-.97 7.2-2.63l-3.6-2.8c-.98.66-2.23 1.07-3.6 1.07-3.22 0-5.71-1.81-6.59-4.46L5.41 14.5z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.93l-3.6-2.8c-.98.66-2.23 1.07-3.6 1.07-3.22 0-5.71-1.81-6.59-4.46L1.63 10.97l-3.78 2.93C1.63 20.33 7.37 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Footer Security / Trust Indicators */}
          <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 shrink-0">
              <Lock className="w-3 h-3" /> Secure Auth
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
            <span className="flex items-center gap-1 shrink-0">
              <Cloud className="w-3 h-3" /> Firebase Protected
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
            <span className="flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3" /> Real-Time
            </span>
          </div>

        </div>
      </main>

    </div>
  );
}
