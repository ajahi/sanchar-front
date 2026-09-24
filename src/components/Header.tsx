import React from 'react';
import { Sparkles, Settings, Database, Flame, User, LogOut, Menu, X } from 'lucide-react';
import { MetaConnectionStatus, AuthUser } from '../types';
import Link from 'next/link';
import { SancharLogo } from './SancharLogo';

interface HeaderProps {
  businessName: string;
  activeTab: 'inbox' | 'sandbox' | 'inventory' | 'settings' | 'dashboard';
  setActiveTab: (tab: 'inbox' | 'sandbox' | 'inventory' | 'settings') => void;
  metaStatus: MetaConnectionStatus;
  unresolvedEscalationsCount: number;
  onOpenNewInboundModal: () => void;
  currentUser?: AuthUser | null;
  onOpenAuthPage?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  activeTab,
  setActiveTab,
  unresolvedEscalationsCount,
  onOpenNewInboundModal,
  currentUser,
  onOpenAuthPage,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <header className="relative flex items-center justify-between px-3 sm:px-4 py-2.5 border-b-4 border-black vermilion-bg text-white select-none shrink-0 flex-wrap gap-2">
      {/* Brand & Vintage Matchbox Emblem */}
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 bg-[#FAF3E0] border-2 border-black flex items-center justify-center p-1 shadow-[2px_2px_0px_#1A1A1A]">
          <SancharLogo className="w-7 h-7 text-[#1A1A1A]" />
        </div>
        
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="serif-heading text-lg sm:text-xl md:text-2xl tracking-tighter drop-shadow-[1px_1px_0px_#000]">
              SANCHAR (सञ्चार)
            </h1>
            <span className="text-[8px] sm:text-[9px] bg-[#FAF3E0] text-[#1A1A1A] px-1 py-0.5 font-bold border border-black uppercase hidden md:inline-block">
              Safety Match Grade
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#FAF3E0]/90 font-mono tracking-wide truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {businessName} • Omnichannel v21.0
          </p>
        </div>
      </div>

      {/* Hamburger (below lg only) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
        aria-expanded={menuOpen}
        className="lg:hidden pill aged-paper text-black cursor-pointer shadow-[2px_2px_0px_#1A1A1A]"
      >
        {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Below lg: panel floating over the page under the header. lg+: `contents` drops this
          wrapper so the layout is unchanged. Any click inside (tab, logout…) closes the panel. */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`${menuOpen ? 'flex' : 'hidden'} absolute top-full inset-x-0 z-[9999] flex-col items-start gap-2 p-3 vermilion-bg border-b-4 border-black shadow-[0_4px_0_#1A1A1A] lg:contents`}
      >
      {/* Navigation tabs & Action Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          id="nav-inbox-btn"
          onClick={() => setActiveTab('inbox')}
          className={`pill transition-all cursor-pointer ${
            activeTab === 'inbox'
              ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]'
              : 'aged-paper text-black opacity-90 hover:opacity-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
          <span>INBOX</span>
          {unresolvedEscalationsCount > 0 && (
            <span className="ml-0.5 px-1 bg-red-700 text-white rounded text-[9px] animate-pulse">
              {unresolvedEscalationsCount}
            </span>
          )}
        </button>

        <Link
          id="nav-dashboard-link"
          href="/dashboard"
          className={`pill transition-all ${
            activeTab === 'dashboard'
              ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]'
              : 'aged-paper text-black opacity-90 hover:opacity-100'
          }`}
        >
          <span>DASHBOARD</span>
        </Link>

        <button
          id="nav-sandbox-btn"
          onClick={() => setActiveTab('sandbox')}
          className={`pill transition-all cursor-pointer ${
            activeTab === 'sandbox'
              ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]'
              : 'aged-paper text-black opacity-90 hover:opacity-100'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#B8251B]" />
          <span>RAG SANDBOX</span>
        </button>

        <button
          id="nav-inventory-btn"
          onClick={() => setActiveTab('inventory')}
          className={`pill transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]'
              : 'aged-paper text-black opacity-90 hover:opacity-100'
          }`}
        >
          <Database className="w-3 h-3 text-[#1A2B4C]" />
          <span>CATALOG</span>
        </button>

        <button
          id="nav-settings-btn"
          onClick={() => setActiveTab('settings')}
          className={`pill transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]'
              : 'aged-paper text-black opacity-90 hover:opacity-100'
          }`}
        >
          <Settings className="w-3 h-3 text-[#1A1A1A]" />
          <span>CHANNELS</span>
        </button>

        {/* Quick inbound message simulation trigger */}
        <button
          id="trigger-inbound-btn"
          onClick={onOpenNewInboundModal}
          className="pill bg-[#1A1A1A] text-white hover:bg-black cursor-pointer shadow-[2px_2px_0px_#FAF3E0] flex items-center gap-1"
          title="Simulate incoming WhatsApp/Instagram/Facebook customer query"
        >
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>+ INBOUND</span>
        </button>
      </div>

      {/* Account & Engine Status Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {currentUser ? (
          <div className="flex items-center gap-1">
            <button
              id="header-user-profile-btn"
              onClick={onOpenAuthPage}
              className="pill aged-paper text-black hover:bg-[#FCEFD2] font-mono cursor-pointer flex items-center gap-1.5 shadow-[1px_1px_0px_#1A1A1A]"
              title={`Logged in as ${currentUser.ownerName} (${currentUser.email}). Click to view or switch account.`}
            >
              <span className="w-4 h-4 vermilion-bg text-white text-[8px] flex items-center justify-center font-bold border border-black">
                {currentUser.avatarInitials || 'NP'}
              </span>
              <span className="font-bold text-[10px] max-w-[100px] truncate">
                {currentUser.ownerName || currentUser.email.split('@')[0]}
              </span>
            </button>

            {onSignOut && (
              <button
                id="header-signout-btn"
                onClick={onSignOut}
                className="pill bg-[#1A1A1A] text-[#FAF3E0] hover:bg-black font-mono cursor-pointer text-[9px] flex items-center gap-1"
                title="Sign out to Root Login / Signup page"
              >
                <LogOut className="w-3 h-3 text-amber-300" />
                <span>LOGOUT</span>
              </button>
            )}
          </div>
        ) : (
          <button
            id="header-auth-login-btn"
            onClick={onOpenAuthPage}
            className="pill aged-paper text-black hover:bg-[#FCEFD2] font-mono cursor-pointer flex items-center gap-1 font-bold"
          >
            <User className="w-3 h-3 text-[#B8251B]" />
            <span>LOGIN / SIGN UP</span>
          </button>
        )}
      </div>
      </div>
    </header>
  );
};
