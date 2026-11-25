'use client';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { isValidPhone, normalizePhone } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';

function AuthContent() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') || searchParams.get('tab');

  const [authMode, setAuthMode] = useState(
    urlMode === 'register' || urlMode === 'signup' ? 'register' : urlMode === 'forgot' ? 'forgot' : 'login'
  );
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [resetOtpVerified, setResetOtpVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const otpRefs = useRef([]);
  const emailRef = useRef(null);
  const timerRef = useRef(null);

  const login = useAuthStore(s => s.login);
  const showToast = useUIStore(s => s.showToast);
  const router = useRouter();

  // Switch mode if URL param changes
  useEffect(() => {
    if (urlMode === 'register' || urlMode === 'signup') {
      setAuthMode('register');
    } else if (urlMode === 'forgot') {
      setAuthMode('forgot');
    }
  }, [urlMode]);

  // Auto-focus email on mode change
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [authMode, loginMethod]);

  // Show redirect notice if user came from direct Buy Now
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ggsLoginRedirect') === '/cart?direct=1') {
      showToast('Buy Now ke liye pehle apna account login ya register karein.', 'info');
    }
  }, [showToast]);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [otpTimer]);

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());
  }

  function validatePassword(value) {
    return String(value || '').length >= 8;
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setLoginMethod(mode === 'forgot' ? 'otp' : 'password');
    setOtpSent(false);
    setResetOtpVerified(false);
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTimeout(() => emailRef.current?.focus(), 100);
  }

  // 6-digit OTP box handlers
  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => verifyEmailOtp(newOtp.join('')), 150);
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();

      if (pasted.length === 6) {
        setTimeout(() => verifyEmailOtp(pasted), 150);
      }
    }
  }

  const otpString = otp.join('');
  const cleanEmail = email.trim().toLowerCase();
  const isEmailValid = validateEmail(cleanEmail);

  // ── 1. LOGIN WITH PASSWORD ───────────────────────────────────
  async function loginWithPassword() {
    if (!validateEmail(cleanEmail)) {
      showToast('Kripya valid email address daalein.', 'error');
      return;
    }
    if (!password) {
      showToast('Kripya password enter karein.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Login failed.');
      login({ ...data.user, sessionToken: data.token, authType: 'password' });
      showToast('✅ Login successful! Welcome back.', 'success');
      const redirect = localStorage.getItem('ggsLoginRedirect');
      localStorage.removeItem('ggsLoginRedirect');
      router.push(redirect || '/');
    } catch (error) {
      showToast(error.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── 2. SEND EMAIL VERIFICATION OTP (REGISTER / LOGIN OTP / FORGOT) ──
  async function sendEmailOtp() {
    if (!validateEmail(cleanEmail)) {
      showToast('Kripya valid email address enter karein.', 'error');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        showToast('Kripya apna poora naam enter karein.', 'error');
        return;
      }
      if (!isValidPhone(normalizePhone(phone))) {
        showToast('Kripya 10-digit mobile number enter karein.', 'error');
        return;
      }
      if (!validatePassword(password)) {
        showToast('Password kam se kam 8 characters ka hona chahiye.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords match nahi ho rahe. Kripya check karein.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          type: 'email',
          mode: authMode === 'forgot' ? 'reset_password' : authMode,
          name: authMode === 'register' ? name.trim() : undefined,
          phone: authMode === 'register' ? normalizePhone(phone) : undefined,
          password: authMode === 'register' ? password : undefined,
          address: authMode === 'register' ? address.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.message || 'Verification OTP send nahi ho saka.', 'error');
        return;
      }
      setOtpSent(true);
      setOtpTimer(120);
      setOtp(['', '', '', '', '', '']);
      showToast(`✉️ 6-digit OTP code ${cleanEmail} par bhej diya gaya hai`, 'success');
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (error) {
      showToast(error.message || 'Could not send verification code.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── 3. VERIFY EMAIL OTP ──────────────────────────────────────
  const verifyEmailOtp = useCallback(async (otpValue) => {
    if (!validateEmail(cleanEmail)) {
      showToast('Kripya valid email enter karein.', 'error');
      return;
    }
    const code = otpValue || otpString;
    if (!otpSent || code.length !== 6) {
      showToast('Kripya poora 6-digit OTP code enter karein.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      if (authMode === 'forgot') {
        setResetOtpVerified(true);
        setOtpSent(false);
        setOtpTimer(0);
        showToast('✅ Email verified! Set your new password.', 'success');
        return;
      }
      if (!data.user) throw new Error('Could not retrieve account details.');

      login({
        ...data.user,
        sessionToken: data.token,
        authType: 'email_otp',
      });
      showToast(
        authMode === 'register'
          ? '🎉 Welcome! Your email has been verified & account created.'
          : '✅ Login successful! Welcome back.',
        'success'
      );
      const redirect = localStorage.getItem('ggsLoginRedirect');
      localStorage.removeItem('ggsLoginRedirect');
      router.push(redirect || '/');
    } catch (error) {
      showToast(error.message || 'Verification failed. Sahi code daalein.', 'error');
    } finally {
      setLoading(false);
    }
  }, [cleanEmail, otpString, otpSent, authMode, login, showToast, router]);

  // ── 4. RESET PASSWORD ────────────────────────────────────────
  async function resetPassword() {
    if (!validatePassword(password)) {
      showToast('Password kam se kam 8 characters ka hona chahiye.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords match nahi kar rahe.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_PASSWORD', email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Password update failed.');
      showToast('✅ Password successfully update ho gaya! Ab login karein.', 'success');
      switchAuthMode('login');
    } catch (error) {
      showToast(error.message || 'Password update failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetOtpState() {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setResetOtpVerified(false);
    setOtpTimer(0);
  }

  const strengthColors = ['#e2e8f0', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

  return (
    <div className="auth-page">
      <div className="auth-card-pro">
        
        {/* ── STORE BRANDING ─────────────────────────── */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Gupta Store Logo" />
          </div>
          <h1 className="auth-title">
            Gupta <span>Store</span>
          </h1>
          <p className="auth-subtitle">
            Bakani&apos;s #1 Stationery Store
          </p>
        </div>

        {/* ── PILL TABS: SIGN IN / CREATE ACCOUNT ───── */}
        {!otpSent && !resetOtpVerified && authMode !== 'forgot' && (
          <div className="auth-segmented-tabs" role="tablist">
            <button
              type="button"
              className={`auth-seg-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => switchAuthMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-seg-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => switchAuthMode('register')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* ── CONTEXT HEADER ────────────────────────── */}
        <div className="auth-view-header">
          <h2>
            {otpSent
              ? 'Verify Your Email'
              : authMode === 'register'
              ? 'Create Your Account'
              : authMode === 'forgot'
              ? (resetOtpVerified ? 'Set New Password' : 'Reset Password')
              : 'Welcome Back'}
          </h2>
          <p>
            {otpSent
              ? 'Enter the 6-digit verification code sent to your email'
              : authMode === 'register'
              ? 'Enter your details. An email verification code will be sent.'
              : authMode === 'forgot'
              ? (resetOtpVerified ? 'Enter your new secure password below' : 'Enter your registered email to receive a recovery code')
              : 'Enter your credentials to access your account'}
          </p>
        </div>

        {/* ══════════════════════════════════════════════
            1. REGISTER FORM (WITH EMAIL VERIFICATION)
           ══════════════════════════════════════════════ */}
        {authMode === 'register' && !otpSent && (
          <div className="auth-form-body">
            {/* Email Field */}
            <div className="auth-field-group">
              <div className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="mail" size={15} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
                </span>
                {cleanEmail && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isEmailValid ? '#16a34a' : '#d97706' }}>
                    {isEmailValid ? '✓ Valid format' : 'Incomplete email'}
                  </span>
                )}
              </div>
              <input
                ref={emailRef}
                className="auth-input-control"
                type="email"
                placeholder="e.g. rahul.gupta@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                autoComplete="email"
                required
              />
            </div>

            {/* Full Name */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="user" size={15} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <input
                className="auth-input-control"
                type="text"
                placeholder="e.g. Rahul Gupta"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                autoComplete="name"
                required
              />
            </div>

            {/* Mobile Number with country code */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="phone" size={15} /> Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <div className="auth-phone-control">
                <span className="auth-phone-flag">🇮🇳 +91</span>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Delivery Address (Optional) */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="mapPin" size={15} /> Address / Landmark <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
                </span>
              </label>
              <input
                className="auth-input-control"
                type="text"
                placeholder="e.g. Near Bus Stand, Main Market, Bakani"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
              />
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="key" size={15} /> Create Password <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <div className="auth-password-control">
                <input
                  className="auth-input-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
              {password && (
                <div className="auth-pwd-strength">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="auth-pwd-seg"
                      style={{ background: i <= passwordStrength ? strengthColors[passwordStrength] : '#e2e8f0' }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="shield" size={15} /> Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </span>
                {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                  <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700 }}>✓ Passwords match</span>
                )}
                {confirmPassword && password !== confirmPassword && (
                  <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 600 }}>Passwords do not match</span>
                )}
              </label>
              <div className="auth-password-control">
                <input
                  className="auth-input-control"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label="Toggle confirm password visibility"
                >
                  <AppIcon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            {/* Submit: Send Email Verification OTP */}
            <button
              className="auth-btn-primary"
              onClick={sendEmailOtp}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Sending Verification Code...</>
              ) : (
                <><AppIcon name="mail" size={18} /> Verify Email &amp; Create Account →</>
              )}
            </button>

            <div className="auth-card-footer">
              Already have an account?{' '}
              <button type="button" onClick={() => switchAuthMode('login')}>
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            2. LOGIN FORM (PASSWORD METHOD)
           ══════════════════════════════════════════════ */}
        {authMode === 'login' && loginMethod === 'password' && (
          <div className="auth-form-body">
            {/* Email Field */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="mail" size={15} /> Email Address
                </span>
              </label>
              <input
                ref={emailRef}
                className="auth-input-control"
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loginWithPassword()}
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            <div className="auth-field-group" style={{ marginBottom: '1.25rem' }}>
              <div className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="key" size={15} /> Password
                </span>
                <button
                  type="button"
                  onClick={() => switchAuthMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-password-control">
                <input
                  className="auth-input-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginWithPassword()}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              className="auth-btn-primary"
              onClick={loginWithPassword}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Signing In...</>
              ) : (
                <><AppIcon name="login" size={18} /> Sign In Securely</>
              )}
            </button>

            <div className="auth-sep-divider">
              <span>or</span>
            </div>

            {/* Login with Email OTP alternative */}
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => setLoginMethod('otp')}
            >
              <AppIcon name="mail" size={16} /> Sign In with Email OTP
            </button>

            <div className="auth-card-footer">
              New to Gupta Store?{' '}
              <button type="button" onClick={() => switchAuthMode('register')}>
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            3. LOGIN FORM (EMAIL OTP METHOD)
           ══════════════════════════════════════════════ */}
        {authMode === 'login' && loginMethod === 'otp' && !otpSent && (
          <div className="auth-form-body">
            <div className="auth-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="mail" size={15} /> Registered Email Address
                </span>
              </label>
              <input
                ref={emailRef}
                className="auth-input-control"
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                autoComplete="email"
                required
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                We will send a 6-digit one-time passcode to this email
              </span>
            </div>

            <button
              className="auth-btn-primary"
              onClick={sendEmailOtp}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Sending Code...</>
              ) : (
                <><AppIcon name="send" size={17} /> Send Login OTP Code →</>
              )}
            </button>

            <div className="auth-sep-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => setLoginMethod('password')}
            >
              <AppIcon name="key" size={16} /> Sign In with Password instead
            </button>

            <div className="auth-card-footer">
              New to Gupta Store?{' '}
              <button type="button" onClick={() => switchAuthMode('register')}>
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            4. FORGOT PASSWORD (REQUEST OTP)
           ══════════════════════════════════════════════ */}
        {authMode === 'forgot' && !otpSent && !resetOtpVerified && (
          <div className="auth-form-body">
            <div className="auth-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="mail" size={15} /> Registered Email Address
                </span>
              </label>
              <input
                ref={emailRef}
                className="auth-input-control"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                autoComplete="email"
                required
              />
            </div>

            <button
              className="auth-btn-primary"
              onClick={sendEmailOtp}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Sending Recovery Code...</>
              ) : (
                <><AppIcon name="send" size={17} /> Send Recovery Code →</>
              )}
            </button>

            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => switchAuthMode('login')}
              style={{ marginTop: '0.75rem' }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            5. RESET PASSWORD FORM (AFTER OTP VERIFIED)
           ══════════════════════════════════════════════ */}
        {authMode === 'forgot' && resetOtpVerified && (
          <div className="auth-form-body">
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#065f46', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span> Email verified! Enter your new password below.
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="key" size={15} /> New Password
                </span>
              </label>
              <div className="auth-password-control">
                <input
                  className="auth-input-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && resetPassword()}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <div className="auth-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="auth-field-label">
                <span className="auth-field-label-left">
                  <AppIcon name="shield" size={15} /> Confirm New Password
                </span>
              </label>
              <div className="auth-password-control">
                <input
                  className="auth-input-control"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && resetPassword()}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <AppIcon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <button
              className="auth-btn-primary"
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Updating Password...</>
              ) : (
                '🔑 Update Password & Sign In'
              )}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            6. EMAIL OTP VERIFICATION SCREEN
           ══════════════════════════════════════════════ */}
        {otpSent && (
          <div className="auth-form-body" style={{ textAlign: 'center' }}>
            <div className="auth-otp-badge">
              <AppIcon name="mail" size={15} />
              <span>{cleanEmail}</span>
              <button
                type="button"
                onClick={resetOtpState}
                style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', paddingLeft: 4, textDecoration: 'underline' }}
              >
                Edit
              </button>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="auth-otp-grid" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className={`auth-otp-digit ${digit ? 'filled' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Countdown Timer / Resend */}
            <div className="auth-timer-row">
              {otpTimer > 0 ? (
                <>
                  <AppIcon name="clock" size={15} />
                  <span>Resend code in <strong>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong></span>
                </>
              ) : (
                <button
                  type="button"
                  className="auth-resend-link"
                  onClick={sendEmailOtp}
                  disabled={loading}
                >
                  Didn&apos;t receive code? Resend OTP
                </button>
              )}
            </div>

            <button
              className="auth-btn-primary"
              onClick={() => verifyEmailOtp()}
              disabled={loading || otpString.length < 6}
            >
              {loading ? (
                <><span className="auth-spinner" /> Verifying Code...</>
              ) : (
                `Verify & ${authMode === 'register' ? 'Complete Registration' : authMode === 'forgot' ? 'Continue' : 'Sign In'} →`
              )}
            </button>

            <div style={{ marginTop: '1rem', fontSize: '0.76rem', color: '#94a3b8' }}>
              Tip: Can&apos;t find the email? Check your <strong>Spam / Promotions</strong> folder.
            </div>
          </div>
        )}

        {/* ── SECURITY TRUST BAR ─────────────────────── */}
        <div className="auth-trust-bar">
          <AppIcon name="shield" size={14} />
          <span>256-Bit SSL Encrypted • Fast &amp; Secure Checkout in Bakani</span>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--orange)' }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
