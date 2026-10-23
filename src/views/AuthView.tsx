import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SnazzyLogo } from '../components/SnazzyLogo';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Check,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const {
    login,
    googleSignIn,
    signup,
    forgotPassword,
    departments,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Available departments list from Firestore
  const availableDepartments = (departments || []).filter((d) => !d.archived);

  // Default selection if available and none selected yet
  const activeSelectedDept = selectedDept || (availableDepartments.length > 0 ? availableDepartments[0].id : '');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLoginError('');
    setSignupError('');
    const res = await googleSignIn();
    setIsSubmitting(false);
    if (!res.success) {
      if (authMode === 'signup') {
        setSignupError(res.message || 'Google sign in failed');
      } else {
        setLoginError(res.message || 'Google sign in failed');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    const res = await login(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (!res.success) {
      setLoginError(res.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!signupFirstName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError('Please fill in all required fields (First Name, Email, Password).');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    const finalDept = activeSelectedDept;
    if (availableDepartments.length > 0 && !finalDept) {
      setSignupError('Please select a department.');
      return;
    }
    setIsSubmitting(true);
    const res = await signup(
      signupFirstName.trim(),
      signupLastName.trim(),
      signupEmail.trim(),
      signupPassword,
      'Team Member',
      finalDept ? [finalDept] : []
    );
    setIsSubmitting(false);
    if (!res.success) {
      setSignupError(res.message || 'Signup failed');
    } else {
      setSignupSuccess(true);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    if (!forgotEmail.trim()) {
      setForgotMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }
    setIsSubmitting(true);
    const res = await forgotPassword(forgotEmail);
    setIsSubmitting(false);
    if (!res.success) {
      setForgotMessage({ type: 'error', text: res.message || 'Email not found.' });
    } else {
      setForgotMessage({
        type: 'success',
        text: `Password reset link sent to ${forgotEmail}. Please check your inbox.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001C42] via-[#00224D] to-slate-900 flex flex-col justify-center items-center p-4 text-slate-800 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#005CBD]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl mb-1">
            <SnazzyLogo size="lg" className="text-white" />
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Operational Alignment & Task Management
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Admin Account Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-100 dark:border-blue-900/50 px-4 py-2.5 flex items-center gap-2 text-xs text-[#005CBD] dark:text-blue-300 font-semibold">
            <Shield className="w-4 h-4 shrink-0 text-[#005CBD] dark:text-blue-400" />
            <span>Default Admin: <strong>fasinujoshua0@gmail.com</strong></span>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Card Header Title based on authMode */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {authMode === 'login' && 'Sign In'}
                {authMode === 'signup' && 'Create an Account'}
                {authMode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authMode === 'login' && 'Enter your credentials to access your operations dashboard.'}
                {authMode === 'signup' && 'Enter your details and select your department to join.'}
                {authMode === 'forgot' && 'Enter your registered email and we will send you a reset link.'}
              </p>
            </div>

            {/* ======================= LOGIN FORM ======================= */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      placeholder="someone@mail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                    />
                  </div>
                  {/* Reset Password text right under the password field as a clickable obvious link */}
                  <div className="flex justify-end pt-1.5">
                    <button
                      type="button"
                      id="auth-forgot-password-link"
                      onClick={() => {
                        setAuthMode('forgot');
                        setForgotMessage(null);
                      }}
                      className="text-xs font-semibold text-[#005CBD] dark:text-blue-400 hover:underline focus:outline-hidden"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-login-submit-btn"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <LogIn className="w-4 h-4" /> {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Classical Divider */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-10">
                    or
                  </span>
                </div>

                {/* Google Sign In Button placed at the bottom in classical way */}
                <button
                  type="button"
                  id="auth-google-signin-btn"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                {/* Switch to Signup Prompt */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    id="auth-switch-to-signup-btn"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupError('');
                    }}
                    className="font-bold text-[#005CBD] dark:text-blue-400 hover:underline ml-1 focus:outline-hidden"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}

            {/* ======================= SIGNUP FORM ======================= */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
                {signupError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Account created successfully! You are logged in.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-first-name-input"
                        type="text"
                        required
                        placeholder="e.g. Joshua"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-last-name-input"
                        type="text"
                        placeholder="e.g. Fasinu"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      placeholder="someone@mail.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-password-input"
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-dept-select" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="signup-dept-select"
                      required
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium appearance-none cursor-pointer text-xs"
                    >
                      {availableDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-signup-submit-btn"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <UserPlus className="w-4 h-4" /> {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Classical Divider */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-10">
                    or
                  </span>
                </div>

                {/* Google Sign In Button placed at the bottom */}
                <button
                  type="button"
                  id="auth-signup-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                {/* Switch to Login Prompt */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    id="auth-switch-to-login-from-signup-btn"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                    }}
                    className="font-bold text-[#005CBD] dark:text-blue-400 hover:underline ml-1 focus:outline-hidden"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {/* ======================= FORGOT PASSWORD FORM ======================= */}
            {authMode === 'forgot' && (
              <div className="space-y-4 text-xs">
                {forgotMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      forgotMessage.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {forgotMessage.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span>{forgotMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgot-email-input"
                        type="email"
                        required
                        placeholder="someone@mail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="auth-send-reset-btn"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <KeyRound className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send Password Reset Link'}
                  </button>
                </form>

                {/* Back to Login Prompt */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                  Remember your password?{' '}
                  <button
                    type="button"
                    id="auth-back-to-login-from-forgot-btn"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                    }}
                    className="font-bold text-[#005CBD] dark:text-blue-400 hover:underline ml-1 focus:outline-hidden"
                  >
                    Back to Sign in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[11px] text-slate-400">
          Snazzy Operations • Secure Real-Time Workspace
        </div>
      </div>
    </div>
  );
};
