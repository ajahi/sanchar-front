import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
  Bell,
  Cpu,
  Shield,
  Smartphone,
  Flame,
  Save,
  Key,
} from 'lucide-react';
import { MerchantSettings, LanguageCode } from '../types';

interface OnboardingSettingsProps {
  settings: MerchantSettings;
  onUpdateSettings: (newSettings: MerchantSettings) => void;
}

export const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<MerchantSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [metaAuthConnected, setMetaAuthConnected] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Ribbon */}
      <div className="bg-[#FAF3E0] border-3 border-[#1A1A1A] p-4 shadow-[5px_5px_0_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
              STAGE 1 & 4
            </span>
            <span className="text-xs font-mono-retro text-[#B8251B] font-bold uppercase">
              MERCHANT PROFILE & AUTOMATION THRESHOLDS
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif-vintage font-bold text-[#1A2B4C] mt-1">
            Authentication, Language Policy & Escalation Guards
          </h2>
          <p className="text-xs font-mono-retro text-[#1A1A1A]/80 mt-0.5">
            Configure default response dialects, Meta/Google OAuth handshakes, and strict human safety thresholds.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-xs font-mono-retro font-bold flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>PREFERENCES STORED!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: OAUTH 2.0 HANDSHAKES */}
        <div className="matchbox-card p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#1A1A1A]">
            <Lock className="w-4 h-4 text-[#B8251B]" />
            <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] uppercase">
              1. OAUTH 2.0 PROVIDERS & PERMISSIONS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google OAuth */}
            <div className="p-3.5 bg-[#FAF3E0] border-2 border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-[#1A1A1A] flex items-center justify-center font-bold text-base shadow-[1px_1px_0_#1A1A1A]">
                  G
                </div>
                <div>
                  <div className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                    Google OAuth 2.0
                  </div>
                  <div className="text-[11px] font-mono-retro text-gray-600">
                    Logged in as himaliamit1@gmail.com
                  </div>
                </div>
              </div>
              <span className="bg-emerald-700 text-white text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
                AUTHENTICATED
              </span>
            </div>

            {/* Meta OAuth */}
            <div className="p-3.5 bg-[#FAF3E0] border-2 border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1877F2] text-white border border-[#1A1A1A] flex items-center justify-center font-bold text-base shadow-[1px_1px_0_#1A1A1A]">
                  f
                </div>
                <div>
                  <div className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                    Meta Business OAuth
                  </div>
                  <div className="text-[11px] font-mono-retro text-gray-600">
                    Pages, Instagram & WhatsApp Direct Handshake
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMetaAuthConnected(!metaAuthConnected)}
                className={`text-[10px] font-mono-retro font-bold px-2 py-1 border border-[#1A1A1A] cursor-pointer ${
                  metaAuthConnected
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#B8251B] text-white'
                }`}
              >
                {metaAuthConnected ? 'CONNECTED' : 'CONNECT META'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: MERCHANT STORE SETUP */}
        <div className="matchbox-card p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#1A1A1A]">
            <Globe className="w-4 h-4 text-[#B8251B]" />
            <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] uppercase">
              2. STORE PROFILE & DIALECT PREFERENCES
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-retro">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1">Business Store Name:</label>
              <input
                id="input-business-name"
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1">Official Merchant Email:</label>
              <input
                id="input-business-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1">
                Default AI Dialect & Language Setting:
              </label>
              <select
                id="select-default-language"
                value={formData.defaultLanguage}
                onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value as LanguageCode })}
                className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A] font-bold"
              >
                <option value="ne_roman">
                  Romanized Nepali (Nepglish) — Recommended for Social Commerce
                </option>
                <option value="ne">Nepali (Devanagari: नेपाली)</option>
                <option value="en">English (Formal & International)</option>
                <option value="auto">Auto-Detect & Mirror Customer Dialect</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1">Operating Business Hours:</label>
              <input
                id="input-operating-hours"
                type="text"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: AUTOMATION & ESCALATION CONTROLS */}
        <div className="matchbox-card p-4 border-[#B8251B]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#1A1A1A]">
            <Cpu className="w-4 h-4 text-[#B8251B]" />
            <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] uppercase">
              3. STAGE 4 CONFIDENCE THRESHOLD & ESCALATION GUARDS
            </h3>
          </div>

          <div className="space-y-4 text-xs font-mono-retro">
            {/* Threshold Slider */}
            <div className="bg-[#FAF3E0] p-4 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-sm text-[#1A2B4C]">
                  Confidence Escalation Safety Threshold:
                </label>
                <span className="text-base font-serif-vintage font-extrabold text-[#B8251B] bg-white px-2 py-0.5 border border-[#1A1A1A]">
                  {(formData.confidenceThreshold * 100).toFixed(0)}% (
                  {formData.confidenceThreshold.toFixed(2)})
                </span>
              </div>

              <input
                id="slider-confidence-threshold"
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={formData.confidenceThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, confidenceThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-[#B8251B] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0.50 (Permissive)</span>
                <span className="font-bold text-[#B8251B]">0.75 (PRD Standard Safety Level)</span>
                <span>0.95 (Strict Handover)</span>
              </div>

              <p className="text-[11px] text-gray-700 mt-2 leading-relaxed">
                If the RAG engine's calculated confidence drops below{' '}
                <span className="font-bold text-[#B8251B]">
                  {(formData.confidenceThreshold * 100).toFixed(0)}%
                </span>
                , or if the customer explicitly requests a human manager (*"Manager sanga kura garnu cha"*), the thread status automatically shifts to <span className="font-bold">NEEDS_HUMAN</span> and dispatches an alert.
              </p>
            </div>

            {/* Notification alert phone & audio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">
                  Manager WhatsApp / SMS Alert Phone:
                </label>
                <input
                  id="input-alert-phone"
                  type="text"
                  value={formData.smsAlertPhone}
                  onChange={(e) => setFormData({ ...formData, smsAlertPhone: e.target.value })}
                  placeholder="+977-9801234567"
                  className="w-full p-2 bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  id="checkbox-audio-alerts"
                  type="checkbox"
                  checked={formData.audioAlerts}
                  onChange={(e) => setFormData({ ...formData, audioAlerts: e.target.checked })}
                  className="w-4 h-4 accent-[#B8251B] cursor-pointer"
                />
                <label htmlFor="checkbox-audio-alerts" className="font-bold cursor-pointer">
                  Play acoustic chime on human escalation alert
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            id="btn-save-settings"
            type="submit"
            className="matchbox-button-primary px-6 py-2.5 text-xs font-mono-retro font-bold flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#E09A25]" />
            <span>SAVE PREFERENCES & ACTIVATE ENGINE</span>
          </button>
        </div>
      </form>
    </div>
  );
};
