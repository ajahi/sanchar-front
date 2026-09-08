import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Instagram, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Layers 
} from 'lucide-react';
import { AuthUser } from '../types';
import { SancharLogo } from './SancharLogo';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  currentUser: AuthUser | null;
  onContinueAsGuest?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  currentUser,
  onContinueAsGuest,
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('himaliamit1@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'instagram' | 'email' | null>(null);

  const handleGoogleAuth = () => {
    setLoadingProvider('google');
    setIsLoading(true);
    setTimeout(() => {
      const user: AuthUser = {
        id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
        email: email.trim() || 'himaliamit1@gmail.com',
        businessName: 'Sanchar Himalayan Crafts (काठमाडौँ)',
        ownerName: 'Amit Shrestha',
        phone: '+977 9801234567',
        city: 'Kathmandu Valley',
        primaryChannel: 'all',
        role: 'MERCHANT_ADMIN',
        avatarInitials: 'AS',
        loginTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        localStorage.setItem('socialsync_auth_user', JSON.stringify(user));
      } catch {
        // ignore
      }

      setLoadingProvider(null);
      setIsLoading(false);
      onLoginSuccess(user);
    }, 600);
  };

  const handleInstagramAuth = () => {
    setLoadingProvider('instagram');
    setIsLoading(true);
    setTimeout(() => {
      const user: AuthUser = {
        id: 'usr_ig_' + Math.random().toString(36).substring(2, 9),
        email: email.trim() || 'himaliamit1@gmail.com',
        businessName: 'Sanchar Himalayan Crafts (काठमाडौँ)',
        ownerName: 'Amit Shrestha',
        phone: '+977 9841234567',
        city: 'Kathmandu Valley',
        primaryChannel: 'instagram',
        role: 'MERCHANT_ADMIN',
        avatarInitials: 'IG',
        loginTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        localStorage.setItem('socialsync_auth_user', JSON.stringify(user));
      } catch {
        // ignore
      }

      setLoadingProvider(null);
      setIsLoading(false);
      onLoginSuccess(user);
    }, 600);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoadingProvider('email');
    setIsLoading(true);
    setTimeout(() => {
      const user: AuthUser = {
        id: 'usr_em_' + Math.random().toString(36).substring(2, 9),
        email: email.trim(),
        businessName: 'Sanchar Merchant Store (काठमाडौँ)',
        ownerName: email.split('@')[0],
        phone: '+977 9841000000',
        city: 'Kathmandu Valley',
        primaryChannel: 'all',
        role: 'MERCHANT_ADMIN',
        avatarInitials: email.slice(0, 2).toUpperCase(),
        loginTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        localStorage.setItem('socialsync_auth_user', JSON.stringify(user));
      } catch {
        // ignore
      }

      setLoadingProvider(null);
      setIsLoading(false);
      onLoginSuccess(user);
    }, 650);
  };

  return (
    <div className="min-h-screen aged-paper text-[#1A1A1A] flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Lithograph Print Corner Marks */}
      <div className="hidden sm:block absolute top-3 left-4 text-[9px] font-mono text-[#B8251B] font-bold select-none">
        + REG: 0.5MM SIVAKASI NO. 42
      </div>
      <div className="hidden sm:block absolute top-3 right-4 text-[9px] font-mono text-[#B8251B] font-bold select-none">
        BATCH: 2026-NP • 100% SULPHUR-FREE
      </div>

      {/* Top Heritage Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-3 border-b-2 border-black flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Sanchar Mailbox Logo Mini Badge */}
          <div className="w-9 h-9 vermilion-bg border-2 border-black flex items-center justify-center p-1 shadow-[2px_2px_0px_#1A1A1A]">
            <SancharLogo className="w-6 h-6 text-[#FAF3E0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-serif font-black tracking-wider uppercase text-[#1A1A1A]">
                SANCHAR
              </span>
              <span className="text-xs font-serif font-bold text-[#B8251B] tracking-wide">
                (सञ्चार)
              </span>
              <span className="pill mustard-bg text-black text-[9px] font-mono font-bold hidden md:inline-block">
                ESTD. 1932
              </span>
            </div>
            <p className="text-[10px] font-mono text-stone-600 tracking-wide">
              SIVAKASI SAFETY MATCH GRADE • HIMALAYAN SOCIAL COMMERCE
            </p>
          </div>
        </div>

        {currentUser && onContinueAsGuest && (
          <button
            id="btn-return-workstation"
            onClick={onContinueAsGuest}
            className="pill vermilion-bg text-[#FFFDF9] hover:bg-black font-mono cursor-pointer text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#1A1A1A]"
          >
            <span>RETURN TO WORKSTATION ({currentUser.ownerName})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Main Split Section: Left Hero Text vs Right Matchbox Signup Card */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Hero Text, Matchbox Medallion, and Value Props */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Trust Badges in Vintage Matchbox Pill Style */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono font-bold">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mustard-bg text-black border-2 border-black shadow-[2px_2px_0px_#1A1A1A]">
              <Check className="w-3.5 h-3.5 stroke-[3] text-black" />
              <span>FREE FOREVER FOR CORE FEATURES</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 aged-paper text-black border-2 border-black shadow-[2px_2px_0px_#1A1A1A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B8251B]" />
              <span>META GRAPH API v21.0 | 24-HR WINDOW</span>
            </div>
          </div>

          {/* Main Headline in Vintage Matchbox Display Typography */}
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 vermilion-bg text-white font-mono text-[10px] font-bold uppercase tracking-widest border border-black shadow-[1px_1px_0px_#1A1A1A]">
              TRILINGUAL DISPATCH • DEV / NEPGLISH / EN
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-serif font-black text-[#1A1A1A] uppercase leading-[1.08] tracking-tight drop-shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
              SANCHAR, AUTOMATE SOCIAL REPLIES.
            </h1>
          </div>

          {/* Value Copy */}
          <p className="text-base sm:text-lg font-serif text-stone-800 leading-relaxed max-w-2xl">
            Connect your Social Media in one place and let Sanchar handle your customer replies.
          </p>

          {/* Visual Matchbox Artwork Banner with Sanchar Mailbox Logo */}
          <div className="p-4 border-2 border-black bg-[#FAF3E0] shadow-[4px_4px_0px_#1A1A1A] flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            {/* Mailbox Emblem */}
            <div className="w-20 h-20 shrink-0 rounded-full vermilion-bg border-3 border-black flex items-center justify-center p-2 shadow-[3px_3px_0px_#1A1A1A]">
              <SancharLogo className="w-14 h-14 text-[#FAF3E0]" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-serif font-black uppercase text-[#B8251B] tracking-wider">
                  SANCHAR MAILBOX BRAND • NO. 108
                </span>
                <span className="text-[9px] font-mono mustard-bg px-1.5 py-0.5 border border-black font-bold text-black">
                  PRICE 50 PAISA
                </span>
              </div>
              <p className="text-xs font-mono text-stone-700">
                Guaranteed safe ignition for social customer replies. Automatic delivery rates, stock availability, and operator takeover when confidence drops below 0.75.
              </p>
            </div>
          </div>

          {/* Feature Checklist in Vintage Stamp Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-mono font-bold text-[#1A1A1A]">
            <div className="flex items-center gap-2 p-2 bg-[#FFFDF9] border border-black shadow-[1px_1px_0px_#1A1A1A]">
              <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span> Facebook</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-[#FFFDF9] border border-black shadow-[1px_1px_0px_#1A1A1A]">
              <svg className="w-3.5 h-3.5 text-[#25D366] shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.926 0-3.72-.516-5.263-1.416l-.377-.22-3.916 1.027 1.045-3.817-.242-.385c-1.012-1.612-1.547-3.481-1.547-5.405 0-5.497 4.472-9.969 9.97-9.969 2.664 0 5.168 1.037 7.05 2.922 1.883 1.884 2.918 4.389 2.918 7.053 0 5.498-4.472 9.972-9.968 9.972m0-21.84c-6.558 0-11.898 5.34-11.898 11.898 0 2.094.546 4.14 1.583 5.941l-1.683 6.148 6.291-1.65c1.742.95 3.71 1.45 5.707 1.45 6.557 0 11.897-5.34 11.897-11.898 0-3.178-1.237-6.165-3.483-8.411-2.247-2.247-5.235-3.483-8.414-3.483" />
              </svg>
              <span>Whats App</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-[#FFFDF9] border border-black shadow-[1px_1px_0px_#1A1A1A]">
              <svg className="w-3.5 h-3.5 text-[#E4405F] shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Vintage Matchbox Signup Box */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md matchbox-card p-6 sm:p-7 bg-[#FFFDF9] border-4 border-black shadow-[8px_8px_0px_#1A1A1A] relative">
            
            {/* Inset Dashed Litho Border */}
            <div className="border-2 border-dashed border-[#B8251B] p-4 sm:p-5 bg-[#FAF3E0]/70 relative">
              
              {/* Corner Litho Pins */}
              <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#B8251B] border border-black" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#B8251B] border border-black" />
              <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#B8251B] border border-black" />
              <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#B8251B] border border-black" />

              {/* Card Top Label */}
              <div className="text-center pb-3 border-b-2 border-black mb-4">
                <div className="inline-block px-2.5 py-0.5 mustard-bg text-black font-mono text-[9px] font-black tracking-widest uppercase border border-black mb-1 shadow-[1px_1px_0px_#1A1A1A]">
                  SAFETY MATCH GRADE • DISPATCH GATEWAY
                </div>
                <div className="text-xl sm:text-2xl font-serif font-black tracking-wider text-[#1A1A1A] uppercase">
                  SANCHAR (सञ्चार)
                </div>
              </div>

              {/* Social Login Buttons in Matchbox Style */}
              <div className="space-y-2.5">
                {/* Button 1: Sign up with Google */}
                <button
                  id="btn-auth-google"
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#FFFDF9] hover:bg-[#F5EBE0] active:translate-y-0.5 border-2 border-black font-serif font-bold text-sm text-[#1A1A1A] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-[3px_3px_0px_#1A1A1A]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>
                    {loadingProvider === 'google'
                      ? 'Connecting Google...'
                      : authMode === 'signup'
                      ? 'Sign up with Google'
                      : 'Log in with Google'}
                  </span>
                </button>

                {/* Button 2: Sign up with Instagram */}
                <button
                  id="btn-auth-instagram"
                  type="button"
                  onClick={handleInstagramAuth}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#FFFDF9] hover:bg-[#F5EBE0] active:translate-y-0.5 border-2 border-black font-serif font-bold text-sm text-[#1A1A1A] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-[3px_3px_0px_#1A1A1A]"
                >
                  <Instagram className="w-4 h-4 text-[#B8251B] shrink-0" />
                  <span>
                    {loadingProvider === 'instagram'
                      ? 'Connecting Instagram...'
                      : authMode === 'signup'
                      ? 'Sign up with Instagram'
                      : 'Log in with Instagram'}
                  </span>
                </button>
              </div>

              {/* Vintage Matchbox OR Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-black/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#FAF3E0] px-3 font-mono font-bold text-stone-700 uppercase tracking-widest text-[10px]">
                    OR / अथवा
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                    Work email *
                  </label>
                  <input
                    id="input-work-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full px-3 py-2 bg-white border-2 border-black font-mono text-sm text-gray-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B8251B] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                  />
                </div>

                <p className="text-[10px] font-mono text-stone-600 leading-tight">
                  By signing up, you agree to Sanchar&apos;s{' '}
                  <span className="underline cursor-pointer font-bold text-[#B8251B]">terms of service</span>{' '}
                  and{' '}
                  <span className="underline cursor-pointer font-bold text-[#B8251B]">privacy policy</span>.
                </p>

                {/* Primary Vermilion Action Button */}
                <button
                  id="btn-submit-cta"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 vermilion-bg hover:bg-[#961c13] active:translate-y-0.5 text-white font-serif font-black text-sm tracking-wider uppercase border-3 border-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[4px_4px_0px_#1A1A1A]"
                >
                  <span>
                    {loadingProvider === 'email'
                      ? 'Igniting Workstation...'
                      : authMode === 'signup'
                      ? 'Get started for free'
                      : 'Log in to Sanchar'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Already have an account switch */}
              <div className="mt-4 text-center text-xs font-mono">
                {authMode === 'signup' ? (
                  <>
                    <span className="text-stone-600">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold text-[#B8251B] hover:underline cursor-pointer"
                    >
                      Log In
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-stone-600">Need a new merchant node? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="font-bold text-[#B8251B] hover:underline cursor-pointer"
                    >
                      Sign Up for free
                    </button>
                  </>
                )}
              </div>

              {/* Authentic Tactile Strikepad Edge across the Base */}
              <div className="mt-5 pt-3 border-t-2 border-black">
                <div className="strikepad-edge h-6 w-full border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#1A1A1A]">
                  <span className="text-[8px] font-mono text-[#FAF3E0] font-black tracking-widest px-2 bg-black/80 uppercase">
                    ★ STRIKE ANYWHERE TO IGNITE REPLIES ★
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Bottom Heritage Colophon */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-stone-600">
        <div>
          <span>SANCHAR SAFETY MATCH CO. (सञ्चार) • SIVAKASI NO. 42 LITHOGRAPH PRESS • KATHMANDU</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Meta Graph v21.0 Compliant</span>
          <span>•</span>
          <span>GDPR / Nepal Telecomm Ready</span>
          <span>•</span>
          <span className="text-[#B8251B] font-bold">100% Sulphur-Free Automation</span>
        </div>
      </footer>
    </div>
  );
};
