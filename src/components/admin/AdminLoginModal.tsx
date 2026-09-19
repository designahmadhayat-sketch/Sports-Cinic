import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ShieldAlert,
  X,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Ban,
  HelpCircle,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { api, hasUsedOneTimeAccessLocally } from '../../services/api';
import { AdminUser } from '../../types';
import { clinicImages } from '../../assets';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'onetime'>('standard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimePassword, setOneTimePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOneTimePassword, setShowOneTimePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  // Quick access tracking state for this device/person (Strictly 1-time 5-minute session)
  const [oneTimeUsed, setOneTimeUsed] = useState(false);
  const [oneTimeCount, setOneTimeCount] = useState(0);
  const [oneTimeRemaining, setOneTimeRemaining] = useState(1);
  const [oneTimeUsedAt, setOneTimeUsedAt] = useState<string | undefined>(undefined);

  // Check one-time status on modal open
  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setShowCredentialsHelp(false);
      return;
    }

    const checkStatus = async () => {
      // 1. First check local device state immediately
      const local = hasUsedOneTimeAccessLocally();
      setOneTimeCount(local.count);
      setOneTimeRemaining(local.remaining);
      if (local.used) {
        setOneTimeUsed(true);
        setOneTimeUsedAt(local.usedAt);
      }

      // 2. Query server for device/IP status
      try {
        const res = await api.checkOneTimeStatus();
        if (typeof res.count === 'number') {
          setOneTimeCount(res.count);
          setOneTimeRemaining(res.remaining);
        }
        if (res.used) {
          setOneTimeUsed(true);
          setOneTimeUsedAt(res.redeemedAt || local.usedAt);
        }
      } catch {
        // use local
      }
    };

    checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  // Standard Admin Login handler
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both Admin email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.loginAdmin({ email: email.trim(), password });
      setSuccessMsg('Authentication successful. Loading Admin Dashboard...');
      setTimeout(() => {
        onSuccess(res.admin);
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Access Passcode Login handler (Strictly One-Time 5-minute session)
  const handleOneTimeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (oneTimeUsed) {
      setErrorMsg(
        'This one-time quick access passcode has already been used on this device. The 5-minute session has ended and is permanently locked.'
      );
      return;
    }

    const trimmedPass = oneTimePassword.trim();
    if (!trimmedPass) {
      setErrorMsg('Please enter the quick access password.');
      return;
    }

    // Valid quick access passcodes: dr.tariq1212, sporc1212, iftikhar1122, sporc2026, irfan1212
    const validPasscodes = ['dr.tariq1212', 'drtariq1212', 'sporc1212', 'iftikhar1122', 'sporc2026', 'irfan1212', 'irfanchandia1122'];
    if (!validPasscodes.includes(trimmedPass.toLowerCase())) {
      setErrorMsg('Invalid quick access passcode. Please verify the code provided by Dr. Iftikhar Ali.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.loginOneTimeAdmin(trimmedPass);
      const updatedLocal = hasUsedOneTimeAccessLocally();
      setOneTimeCount(updatedLocal.count);
      setOneTimeRemaining(0);
      setOneTimeUsed(true);
      setOneTimeUsedAt(new Date().toISOString());

      // Set 5-minute expiration timestamp in localStorage
      const expiresAt = Date.now() + 5 * 60 * 1000;
      localStorage.setItem('dr_waqas_onetime_expires_at', String(expiresAt));

      setSuccessMsg('Quick Access Verified! One-Time 5-Minute Admin Session Started.');
      setTimeout(() => {
        onSuccess(res.admin);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate quick access.');
      if (err.message?.includes('already been used') || err.message?.includes('limit of') || err.message?.includes('permanently disabled') || err.message?.includes('expired')) {
        setOneTimeUsed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedUsedDate = oneTimeUsedAt
    ? new Date(oneTimeUsedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'previously';

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1740]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#101F50] text-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          id="btn-close-admin-modal"
          aria-label="Close Admin Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2.5 pb-2">
          <div className="relative mx-auto w-14 h-14">
            <img
              src={clinicImages.clinicLogo}
              alt="SPORC Clinic Logo"
              width={56}
              height={56}
              className="w-14 h-14 rounded-2xl object-contain bg-white p-1 border border-white/20 shadow-xl shadow-black/20 mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#008C78] border-2 border-[#101F50] flex items-center justify-center text-white">
              <Lock className="w-2.5 h-2.5" />
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#008C78]">
              Clinical Security
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-['Manrope',sans-serif] text-white">
              Admin Portal Login
            </h3>
            <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              SPORC Clinic By Dr. Iftikhar Ali • Rawalpindi
            </p>
          </div>
        </div>

        {/* Tab Selector: Standard vs One-Time Access */}
        <div className="mt-4 mb-4 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('standard');
              setErrorMsg('');
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-[#008C78] text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            id="tab-standard-login"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Standard Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('onetime');
              setErrorMsg('');
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'onetime'
                ? oneTimeUsed
                  ? 'bg-amber-600/90 text-white shadow-sm'
                  : 'bg-[#008C78] text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            id="tab-onetime-login"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>1-Time Passcode</span>
            {oneTimeUsed ? (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-500 text-[9px] font-extrabold text-white tracking-tight uppercase">
                Locked
              </span>
            ) : (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/40 text-[9px] font-extrabold text-emerald-200 tracking-tight uppercase">
                5 Min
              </span>
            )}
          </button>
        </div>

        {/* Alerts: Error & Success Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: STANDARD ADMIN LOGIN (Email & Password) */}
        {/* ======================================================== */}
        {activeTab === 'standard' && (
          <form onSubmit={handleStandardLogin} className="space-y-3.5" id="form-admin-login">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. design.ahmadhayat@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-[#008C78] focus:ring-1 focus:ring-[#008C78]"
                  id="input-admin-email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-[#008C78] focus:ring-1 focus:ring-[#008C78]"
                  id="input-admin-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* DIRECT LINE: How to get Gmail & Password? */}
            <div className="py-0.5">
              <button
                type="button"
                onClick={() => setShowCredentialsHelp(true)}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between transition-colors group cursor-pointer"
                id="btn-how-to-get-credentials"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>How to get Admin Email &amp; Password?</span>
                </span>
                <span className="text-[11px] text-teal-200 group-hover:underline flex items-center gap-1 font-bold">
                  Contact Here &rarr;
                </span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-sm shadow-lg shadow-[#008C78]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                id="btn-submit-admin-login"
              >
                {loading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In with Admin Account</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-1 text-center">
              <p className="text-[11px] text-gray-400">
                Have the quick access passcode? Switch to{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('onetime');
                    setErrorMsg('');
                  }}
                  className="text-[#008C78] hover:underline font-bold inline-flex items-center gap-0.5 ml-0.5 cursor-pointer"
                >
                  1-Time Passcode ({oneTimeRemaining} left) &rarr;
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUICK ACCESS PASSCODE (Passcode: irfan1212)      */}
        {/* Single-use only (1 use) with strict 5-minute timeout     */}
        {/* ======================================================== */}
        {activeTab === 'onetime' && (
          <div className="space-y-3.5" id="section-onetime-access">
            {oneTimeUsed ? (
              /* ALREADY USED: Disabled for this person/device */
              <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-red-200">
                    Quick Access Expired / Locked (1/1 Used)
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    You have already redeemed your one-time quick access passcode on this device (redeemed on{' '}
                    <strong className="text-white">{formattedUsedDate}</strong>).
                  </p>
                  <p className="text-[11px] text-red-300/90 mt-2 bg-red-950/40 p-2.5 rounded-lg border border-red-500/20">
                    The <strong>5-minute temporary session</strong> has ended. This passcode cannot be used again on this device. Please sign in with official administrator credentials.
                  </p>
                </div>

                {/* Disabled Input Preview */}
                <div className="opacity-50 pointer-events-none">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 text-left">
                    Quick Access Passcode (Locked - 1/1 Used)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      disabled
                      value="••••••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('standard');
                      setErrorMsg('');
                    }}
                    className="w-full py-3 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="btn-switch-to-standard-login"
                  >
                    <span>Use Standard Admin Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCredentialsHelp(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-teal-300 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>How to get Admin Email &amp; Password?</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE STATE: Strictly 1-time 5-minute session */
              <form onSubmit={handleOneTimeLogin} className="space-y-3.5" id="form-onetime-access">
                <div className="p-3 rounded-xl bg-[#008C78]/15 border border-[#008C78]/30 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-gray-200 leading-snug">
                    <strong className="text-teal-300 block mb-0.5">
                      One-Time 5-Minute Access Notice (1 Use Only):
                    </strong>
                    <span>
                      Entering this passcode starts a <strong>5-minute active session</strong>. After 5 minutes, you will be <strong>automatically logged out</strong> and this passcode cannot be used again on this device.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Quick Access Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showOneTimePassword ? 'text' : 'password'}
                      required
                      placeholder="Enter quick access passcode"
                      value={oneTimePassword}
                      onChange={(e) => setOneTimePassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[#008C78] focus:ring-1 focus:ring-[#008C78]"
                      id="input-onetime-password"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOneTimePassword(!showOneTimePassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                      aria-label={showOneTimePassword ? 'Hide password' : 'Show password'}
                    >
                      {showOneTimePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>Passcode for Dr. Iftikhar Ali.</span>
                    </span>
                    <span className="text-teal-300 font-semibold">
                      Strictly 1 Use (5-Min Session)
                    </span>
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !oneTimePassword.trim()}
                    className="w-full py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#008C78] to-[#087C72] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#008C78]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    id="btn-submit-onetime-login"
                  >
                    {loading ? (
                      <span>Verifying Passcode...</span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Start 5-Minute Admin Session</span>
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[11px] text-gray-400">
                    Standard administrator credentials?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('standard');
                        setErrorMsg('');
                      }}
                      className="text-[#008C78] hover:underline font-bold inline-flex items-center gap-0.5 ml-0.5 cursor-pointer"
                    >
                      Standard Login &rarr;
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-5 pt-3 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008C78]" />
            <span>End-to-End Encrypted Clinical Administration</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: HOW TO GET ADMIN EMAIL & PASSWORD                 */}
      {/* User contact for admin credentials: 03094785847          */}
      {/* ======================================================== */}
      {showCredentialsHelp && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          id="modal-credentials-help"
        >
          <div className="bg-[#101F50] text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-teal-500/30 animate-in zoom-in-95 relative">
            <button
              onClick={() => setShowCredentialsHelp(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-lg shadow-teal-500/10">
                <Phone className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  How to get Admin Email &amp; Password?
                </h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  To obtain authorized administrator credentials (Gmail &amp; Password) for SPORC Clinic Rawalpindi, please contact clinic administration directly on this number:
                </p>
              </div>

              {/* High-visibility phone number card */}
              <div className="p-4 rounded-2xl bg-white/10 border border-teal-500/40 text-center shadow-inner">
                <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                  Clinic Admin Hotline
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1 tracking-wider select-all">
                  0333-5182963
                </div>
                <div className="text-[11px] text-gray-300 mt-1">
                  Dr. Iftikhar Ali • SPORC Clinic Rawalpindi
                </div>
              </div>

              {/* Action Buttons: Direct Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:03335182963"
                  className="py-2.5 px-3 rounded-xl bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  id="btn-call-admin"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
                <a
                  href="https://wa.me/923335182963?text=Hello%20Dr.%20Iftikhar%20Ali%2C%20I%20need%20the%20Admin%20Email%20and%20Password%20for%20the%20SPORC%20Clinic%20portal."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  id="btn-whatsapp-admin"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowCredentialsHelp(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
