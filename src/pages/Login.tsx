import React, { useState } from 'react';
import { Shield, Mail, Lock, RefreshCw } from 'lucide-react';
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

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
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
        emailAddress = 'citizen.google@gmail.com';
        uid = `mock-google-uid-${Date.now()}`;
        displayName = 'Mock Google Citizen';
      }

      const isGov = emailAddress.toLowerCase().endsWith('.gov');
      const role = isGov ? 'admin' : 'citizen';
      const title = isGov ? 'Chief Safety Officer' : 'Resident';

      const userProfile = {
        email: emailAddress,
        role,
        name: displayName,
        title,
        avatarUrl: isGov 
          ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCs1aCxQRSRbOaSzSN0IuWNbUJMmA7-n88Bk5LD4_K6qzpBufNOp4ON04PdaGd-6-uBjiKVCdr2mPAwmYYdV6QXSFIfY9KgQ26ieTh2PaUU8Pq_Pi0uJHs009XW8NUmUcs8A4YU9g8fcs64ACg6MdPUHf8zW3q_OC2LVklLfTeLw_jsslfuu1m2RmnaMjt8csa0tP2wz3yqfGriYWlrRAeUY4NOAVadZ0MhgJPuHurxSxVRqqJ_ENSQdjRfgP8zLYtLy7cRvNbG-l0"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      };

      const completeProfile = { ...userProfile, uid };
      if (realFirebaseActive) {
        await setDocument(getDocRef('users', uid), completeProfile);
      }
      
      localStorage.setItem('roadwatch_user_profile', JSON.stringify(completeProfile));
      localStorage.setItem('user_role', role);
      window.dispatchEvent(new Event('roadwatch-user-updated'));
      
      navigate(redirect || (role === 'admin' ? '/dashboard' : '/citizen'));
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const isGov = email.toLowerCase().endsWith('.gov');
    const role = isGov ? 'admin' : 'citizen';
    const namePart = email.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const title = isGov ? 'Chief Safety Officer' : 'Resident';

    const userProfile = {
      email,
      role,
      name: displayName,
      title,
      avatarUrl: isGov 
        ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCs1aCxQRSRbOaSzSN0IuWNbUJMmA7-n88Bk5LD4_K6qzpBufNOp4ON04PdaGd-6-uBjiKVCdr2mPAwmYYdV6QXSFIfY9KgQ26ieTh2PaUU8Pq_Pi0uJHs009XW8NUmUcs8A4YU9g8fcs64ACg6MdPUHf8zW3q_OC2LVklLfTeLw_jsslfuu1m2RmnaMjt8csa0tP2wz3yqfGriYWlrRAeUY4NOAVadZ0MhgJPuHurxSxVRqqJ_ENSQdjRfgP8zLYtLy7cRvNbG-l0"
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    };

    if (realFirebaseActive) {
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (loginErr: any) {
          if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/cannot-find-user') {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (signupErr: any) {
              throw new Error(signupErr.message || 'Authentication failed.');
            }
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
        
        navigate(redirect || (role === 'admin' ? '/dashboard' : '/citizen'));
      } catch (err: any) {
        console.error('Firebase Auth Error:', err);
        setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const completeProfile = { ...userProfile, uid: `mock-uid-${Date.now()}` };
        localStorage.setItem('roadwatch_user_profile', JSON.stringify(completeProfile));
        localStorage.setItem('user_role', role);
        window.dispatchEvent(new Event('roadwatch-user-updated'));
        
        setIsLoading(false);
        navigate(redirect || (role === 'admin' ? '/dashboard' : '/citizen'));
      }, 1000);
    }
  };

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

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg leading-normal">
              {errorMsg}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Government / Public Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-text-secondary" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="official@city.gov or citizen@gmail.com" 
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-primary bg-safety-yellow hover:bg-secondary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safety-yellow text-title-md font-bold transition-all duration-200 btn-inset active:scale-95 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLoading ? 'Verifying Credentials...' : 'Sign In securely'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-deep-slate/85 px-3 text-text-secondary font-bold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-border-subtle rounded-lg bg-surface-bright hover:bg-slate-100 dark:hover:bg-slate-800 text-primary font-bold transition-all duration-200 active:scale-95 text-body-md gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Sign in with Google</span>
          </button>

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
