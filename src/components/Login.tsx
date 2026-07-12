import React, { useState } from 'react';
import { ShieldAlert, LogIn, ShieldCheck, Wrench, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'admin' | 'technician', email: string, techId?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Pre-configured profiles for easy 1-click login
  const quickProfiles = [
    {
      id: 'admin',
      name: 'Elena Rostova',
      email: 'admin@maintix.io',
      role: 'admin' as const,
      roleLabel: 'Facility Administrator',
      avatar: 'ER',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'TECH-02',
      name: 'Carlos Ramirez',
      email: 'c.ramirez@maintix.io',
      role: 'technician' as const,
      roleLabel: 'Mechanical Specialist (TECH-02)',
      avatar: 'CR',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'TECH-01',
      name: 'Sarah Jenkins',
      email: 's.jenkins@maintix.io',
      role: 'technician' as const,
      roleLabel: 'Electrical Systems Lead (TECH-01)',
      avatar: 'SJ',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'TECH-03',
      name: 'David Chen',
      email: 'd.chen@maintix.io',
      role: 'technician' as const,
      roleLabel: 'Robotics & Automation (TECH-03)',
      avatar: 'DC',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      id: 'TECH-04',
      name: 'Samantha Patel',
      email: 's.patel@maintix.io',
      role: 'technician' as const,
      roleLabel: 'Heavy Machinery / Safety (TECH-04)',
      avatar: 'SP',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Resolve user profile by email matches
    const lowercaseEmail = email.toLowerCase().trim();
    const matchedProfile = quickProfiles.find(p => p.email.toLowerCase() === lowercaseEmail);

    if (matchedProfile) {
      onLogin(matchedProfile.role, matchedProfile.email, matchedProfile.id !== 'admin' ? matchedProfile.id : undefined);
    } else {
      // Default to admin role if general email, or warn
      if (lowercaseEmail.includes('tech')) {
        // Mock a generic technician
        onLogin('technician', lowercaseEmail, 'TECH-01');
      } else {
        // Log in as admin by default for demo ease, or show simple message
        onLogin('admin', lowercaseEmail);
      }
    }
  };

  const handleQuickLogin = (profile: typeof quickProfiles[0]) => {
    onLogin(profile.role, profile.email, profile.id !== 'admin' ? profile.id : undefined);
  };

  return (
    <div id="login-viewport" className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-blue-100">
      {/* Brand Header */}
      <div id="login-brand" className="flex items-center gap-2.5 mb-8 animate-fade-in">
        <div id="login-logo-wrapper" className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <ShieldAlert id="login-logo-icon" className="w-6 h-6" />
        </div>
        <div id="login-logo-text" className="flex flex-col">
          <span id="login-brand-name" className="font-display font-bold text-2xl text-gray-900 tracking-tight leading-none">Maintix</span>
          <span id="login-subtext" className="text-xs text-gray-400 font-mono tracking-wider uppercase mt-0.5">Enterprise Operations</span>
        </div>
      </div>

      <div id="login-grid-container" className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Standard Login Credentials Form */}
        <div id="login-form-card" className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col h-full justify-between">
          <div>
            <h1 id="login-form-title" className="text-xl font-display font-semibold text-gray-900 tracking-tight">Sign in to workspace</h1>
            <p id="login-form-desc" className="text-sm text-gray-500 mt-1">Enter your credentials to access your technician workbench or facility dashboard.</p>

            {error && (
              <div id="login-error-alert" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label id="label-email" className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="name@maintix.io"
                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label id="label-password" className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="input-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div id="login-security-notice" className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-gray-300" />
            <span>Maintix Single Sign-on (Mock SSO Active)</span>
          </div>
        </div>

        {/* Right Side: Quick Select Prebuilt Profiles (Instant Demo Login) */}
        <div id="login-profiles-card" className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 id="login-profiles-title" className="text-sm font-semibold text-gray-400 uppercase tracking-wider font-mono">Quick Access Profiles</h2>
            <span id="login-profiles-tag" className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-blue-100 text-blue-700 rounded-full">Interactive Demo</span>
          </div>
          <p id="login-profiles-desc" className="text-xs text-gray-500 mt-1 mb-6">Select a profile below to bypass credentials and instantly open the tailored role dashboard.</p>

          <div id="profiles-grid" className="space-y-3">
            {quickProfiles.map((profile) => (
              <button
                id={`btn-profile-select-${profile.id}`}
                key={profile.id}
                onClick={() => handleQuickLogin(profile)}
                className="w-full text-left flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <div id={`profile-info-${profile.id}`} className="flex items-center gap-3.5">
                  <div id={`profile-avatar-${profile.id}`} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${profile.color}`}>
                    {profile.avatar}
                  </div>
                  <div id={`profile-texts-${profile.id}`} className="flex flex-col">
                    <span id={`profile-name-${profile.id}`} className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {profile.name}
                    </span>
                    <span id={`profile-role-${profile.id}`} className="text-xs text-gray-500">
                      {profile.roleLabel}
                    </span>
                  </div>
                </div>
                <div id={`profile-action-${profile.id}`} className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-900 transition-colors font-mono">
                  <span>Sign in</span>
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
