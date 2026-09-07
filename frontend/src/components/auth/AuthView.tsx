import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCharter } from '../../context/CharterContext';
import { CharterMindLogo } from '../common/CharterMindLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Ship,
  ChevronDown,
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

interface DemoProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  badge: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Capt. Aryan Mehta',
    email: 'aryan.mehta@steelmarine.in',
    company: 'Steel Authority & Coastal Logistics Corp',
    role: 'Chief Chartering Lead',
    badge: 'Enterprise Admin',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@pacificbulk.com',
    company: 'Pacific Bulk Carriers Singapore',
    role: 'Senior Freight Trader',
    badge: 'Charterer',
  },
  {
    name: 'Arjun Singhal',
    email: 'arjun.singhal@paradipterminals.gov.in',
    company: 'Paradip Port & Coastal Terminals',
    role: 'Port Operations Lead',
    badge: 'Port Authority',
  },
];

export const AuthView: React.FC = () => {
  const { login, signup, loginWithGoogle, forgotPassword, setActiveTab } = useCharter();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('Chartering Lead & Voyage Operations');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Compact demo dropdown state
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  // Quick Demo Login Handler
  const handleQuickDemo = async (profile: DemoProfile) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setActiveTab('voyage-planner');
      const res = await login(profile.email, 'demo-auth-token', true, {
        name: profile.name,
        company: profile.company,
        role: profile.role,
      });
      if (res.success) {
        setActiveTab('voyage-planner');
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage('Authentication service temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
      setErrorMessage('Please provide a valid corporate email address.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(loginEmail, loginPassword, rememberMe);
      if (res.success) {
        setActiveTab('voyage-planner');
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Submit Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signupCompany.trim()) {
      setErrorMessage('Please specify your shipping or chartering organization.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!signupPassword) {
      setErrorMessage('Please create a password for your account.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please accept the maritime data access terms to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(
        {
          name: signupName,
          email: signupEmail,
          company: signupCompany,
          role: signupRole,
          password: signupPassword,
        },
        rememberMe
      );
      if (res.success) {
        setActiveTab('voyage-planner');
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create maritime account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Submit Handler — real Firebase email
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);
    const res = await forgotPassword(forgotEmail);
    setIsLoading(false);

    if (res.success) {
      setForgotSent(true);
    } else {
      setErrorMessage(res.error ?? 'Failed to send reset email.');
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.success) {
      setActiveTab('voyage-planner');
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between font-sans selection:bg-[#0EA5E9]/20 selection:text-[#101828] overflow-x-hidden bg-[#0A1A2A]">
      {/* ========================================================================= */}
      {/* 1. REALISTIC MARITIME SCENE: OPEN OCEAN, ATMOSPHERIC SKY & CARGO SHIP    */}
      {/* Real commercial cargo container vessel sailing open deep-blue ocean        */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Ocean & Sky Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C3D5A] via-[#2A527A] to-[#0A1A2F]" />

        {/* High-resolution realistic commercial cargo vessel sailing across open deep-blue ocean */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2600&q=85"
            alt="Large commercial container cargo ship sailing on deep blue ocean under natural sky"
            className="w-full h-full object-cover object-[center_38%] filter brightness-[0.95] contrast-[1.05]"
          />
        </div>

        {/* Ambient Maritime Floating Orbs matching reference image */}
        <div className="absolute top-[18%] left-[25%] w-96 h-96 rounded-full bg-[#38BDF8]/20 blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] right-[20%] w-[420px] h-[420px] rounded-full bg-[#0284C7]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[10%] left-[30%] w-80 h-80 rounded-full bg-[#06B6D4]/20 blur-3xl pointer-events-none" />

        {/* Soft atmospheric gradient overlays ensuring natural daylight ocean aesthetics and crisp card readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061424]/60 via-transparent 55% to-[#0E2742]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#08182B]/10 to-[#08182B]/40" />
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTERED TRUE GLASSMORPHISM AUTHENTICATION CARD                        */}
      {/* Positioned centrally matching reference image recipe                      */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[490px] sm:max-w-[510px]">
          {/* True Glassmorphism Card Container */}
          <div className="bg-white/[0.55] backdrop-blur-[14px] [will-change:backdrop-filter] [transform:translateZ(0)] isolate rounded-[20px] border border-white/35 shadow-[0_8px_32px_rgba(10,30,50,0.18)] p-6 sm:p-7 sm:px-8 text-[#101828]">
            
            {/* Top Brand & Context Title */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.55] text-[#0B5D63] text-[10px] font-semibold tracking-wider uppercase font-mono-data mb-2.5 border border-white/35 shadow-xs">
                <Ship className="w-3 h-3 text-[#0EA5E9]" />
                <span>Smart India Hackathon</span>
              </div>
              
              <div className="flex items-center justify-center my-1.5">
                <CharterMindLogo variant="stacked" size="lg" animated={false} />
              </div>

              {mode === 'signup' && (
                <div className="mt-2">
                  <h2 className="text-sm font-bold font-heading text-[#101828] tracking-tight">
                    Create Enterprise Account
                  </h2>
                  <p className="text-xs text-[#2B3342] mt-0.5 font-sans">
                    Provision your chartering desk for AI voyage intelligence.
                  </p>
                </div>
              )}
              {mode === 'forgot' && (
                <div className="mt-2">
                  <h2 className="text-sm font-bold font-heading text-[#101828] tracking-tight">
                    Reset Security Token
                  </h2>
                  <p className="text-xs text-[#2B3342] mt-0.5 font-sans">
                    Enter work email to recover credentials.
                  </p>
                </div>
              )}
            </div>

            {/* Segmented Mode Switcher (Sign In vs Create Account) */}
            {mode !== 'forgot' && (
              <div className="flex p-1 mb-5 rounded-2xl bg-white/[0.55] border border-white/35">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white/[0.55] text-[#101828] shadow-xs font-heading border border-white/35'
                      : 'text-[#2B3342] hover:text-[#101828]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white/[0.55] text-[#101828] shadow-xs font-heading border border-white/35'
                      : 'text-[#2B3342] hover:text-[#101828]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Alert / Feedback Messages */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-2.5 rounded-xl bg-[#FEF2F2]/95 border border-[#FCA5A5] flex items-start gap-2 text-xs text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-2.5 rounded-xl bg-[#ECFDF5]/95 border border-[#6EE7B7] flex items-start gap-2 text-xs text-[#065F46]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ================================================================= */}
            {/* VIEW A: SIGN IN FORM                                              */}
            {/* ================================================================= */}
            {mode === 'login' && (
              <motion.div
                key="login-form-view"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.12 }}
              >
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#101828] mb-1">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B3342]" strokeWidth={2.25} />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. aryan.mehta@steelmarine.in"
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs sm:text-sm placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] focus:ring-2 focus:ring-white/10 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#101828]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setForgotSent(false);
                          setErrorMessage(null);
                        }}
                        className="text-xs font-semibold text-[#0B5D63] hover:text-[#0EA5E9] hover:underline underline-offset-2 transition-all cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B3342]" strokeWidth={2.25} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your security token"
                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs sm:text-sm placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] focus:ring-2 focus:ring-white/10 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2B3342] hover:text-[#101828] transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2.25} /> : <Eye className="w-4 h-4" strokeWidth={2.25} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#2B3342] select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/60 text-[#101828] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#101828]"
                      />
                      <span>Remember session</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#101828] hover:bg-[#0B5D63] active:bg-[#000000] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Terminal</span>
                        <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign-In */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex items-center w-full gap-2">
                    <div className="flex-1 h-[1px] bg-white/30" />
                    <span className="text-[10px] text-[#2B3342] font-mono-data tracking-wider">OR</span>
                    <div className="flex-1 h-[1px] bg-white/30" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-[#101828] bg-white/[0.75] hover:bg-white/90 border border-white/35 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Compact SIH Demo 1-Click Access */}
                <div className="mt-3.5 pt-2 relative flex flex-col items-center">
                  <div className="w-28 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-2.5" />
                  {showDemoDropdown && (
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowDemoDropdown(false)}
                    />
                  )}

                  <div className="relative z-20">
                    <button
                      type="button"
                      onClick={() => setShowDemoDropdown((prev) => !prev)}
                      disabled={isLoading}
                      aria-expanded={showDemoDropdown}
                      aria-label="Select demo profile"
                      className="py-1.5 px-3.5 rounded-xl font-medium text-xs text-[#101828] bg-white/[0.55] hover:bg-white/[0.65] active:bg-white/[0.55] border border-white/35 shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer font-heading group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
                      title="Select Demo Profile"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9] group-hover:scale-110 transition-transform" />
                      <span>Try Demo</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#2B3342] transition-transform duration-200 ${
                          showDemoDropdown ? 'rotate-180' : ''
                        }`}
                        strokeWidth={2.25}
                      />
                    </button>

                    {showDemoDropdown && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-1.5 rounded-[20px] bg-white/[0.94] border border-white/35 shadow-[0_8px_32px_rgba(10,30,50,0.22)] z-30 space-y-1">
                        <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold text-[#0B5D63] font-mono-data">
                          Select SIH Demo Persona
                        </div>
                        {DEMO_PROFILES.map((profile, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setShowDemoDropdown(false);
                              handleQuickDemo(profile);
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-white/90 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-[#101828] group-hover:text-[#0EA5E9] flex items-center gap-1.5 truncate">
                                <span>{profile.name}</span>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-white/[0.55] text-[#2B3342] font-mono-data font-normal">
                                  {profile.badge}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#2B3342] truncate font-sans">
                                {profile.company} · {profile.role}
                              </div>
                            </div>
                            <ArrowRight className="w-3 h-3 text-[#2B3342] group-hover:text-[#101828] group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.25} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* VIEW B: SIGN UP FORM                                              */}
            {/* ================================================================= */}
            {mode === 'signup' && (
              <motion.div
                key="signup-form-view"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.12 }}
              >
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#101828] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B3342]" strokeWidth={2.25} />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Vikramaditya Roy"
                        className="w-full pl-10 pr-3.5 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#101828] mb-1">
                        Organization
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} />
                        <input
                          type="text"
                          required
                          value={signupCompany}
                          onChange={(e) => setSignupCompany(e.target.value)}
                          placeholder="JSW Maritime"
                          className="w-full pl-8.5 pr-2.5 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#101828] mb-1">
                        Operational Role
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs focus:outline-none focus:border-white/60 transition-all"
                      >
                        <option value="Chartering Lead & Voyage Operations">Chartering Lead</option>
                        <option value="Commercial Freight Trader">Freight Trader</option>
                        <option value="Fleet Operations Manager">Fleet Manager</option>
                        <option value="Port Logistics Coordinator">Port Authority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101828] mb-1">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B3342]" strokeWidth={2.25} />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-3.5 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#101828] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full pl-8.5 pr-7 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2B3342] hover:text-[#101828] cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2.25} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2.25} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#101828] mb-1">
                        Confirm
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Repeat"
                          className="w-full pl-8.5 pr-7 py-1.5 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2B3342] hover:text-[#101828] cursor-pointer"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2.25} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2.25} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-[#2B3342] select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-3.5 h-3.5 mt-0.5 rounded border-white/60 text-[#101828] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#101828]"
                      />
                      <span className="text-[10px] leading-tight">
                        I agree to Maritime Security and Data Access protocols.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#101828] hover:bg-[#0B5D63] active:bg-[#000000] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Provisioning...</span>
                      </div>
                    ) : (
                      <>
                        <span>Create Maritime Account</span>
                        <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign-In */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex items-center w-full gap-2">
                    <div className="flex-1 h-[1px] bg-white/30" />
                    <span className="text-[10px] text-[#2B3342] font-mono-data tracking-wider">OR</span>
                    <div className="flex-1 h-[1px] bg-white/30" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-[#101828] bg-white/[0.75] hover:bg-white/90 border border-white/35 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* VIEW C: FORGOT PASSWORD FORM                                      */}
            {/* ================================================================= */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-form-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B5D63] hover:text-[#0EA5E9] hover:underline underline-offset-2 mb-4 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>

                {forgotSent ? (
                    <div className="p-4 rounded-2xl bg-[#ECFDF5]/95 border border-[#6EE7B7] text-center space-y-2.5">
                    <CheckCircle2 className="w-7 h-7 text-[#059669] mx-auto" />
                    <h3 className="text-sm font-bold text-[#065F46] font-heading">
                      Recovery Link Dispatched
                    </h3>
                    <p className="text-xs text-[#047857] leading-relaxed">
                      Token sent to <span className="font-semibold">{forgotEmail}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setForgotSent(false);
                      }}
                      className="mt-2 w-full py-2 rounded-xl bg-[#101828] hover:bg-[#0B5D63] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer font-heading"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#101828] mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B3342]" strokeWidth={2.25} />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="aryan.mehta@steelmarine.in"
                          className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.55] border border-white/35 text-[#101828] text-xs placeholder-[#2B3342] focus:outline-none focus:border-white/60 focus:bg-white/[0.55] transition-all font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#101828] hover:bg-[#0B5D63] active:bg-[#000000] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching...</span>
                        </div>
                      ) : (
                        <>
                          <span>Send Recovery Link</span>
                          <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. BOTTOM AMBIENT STATUS BAR                                              */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.55] backdrop-blur-[14px] [will-change:backdrop-filter] [transform:translateZ(0)] isolate border border-white/35 shadow-[0_8px_32px_rgba(10,30,50,0.18)] text-[#101828] text-[10px] font-mono-data tracking-wide text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          <span>© 2026 Maritime Freight & Voyage Decision Terminal</span>
        </div>
      </footer>
    </div>
  );
};
