import React, { useState } from 'react';
import { Sliders, Sparkles, Save, CheckCircle2, User, RefreshCw, Menu, Trash2 } from 'lucide-react';

const Settings = ({ 
  userProfile, 
  activeTheme, 
  setActiveTheme,
  onMenuClick,
  onPurgeCanvas
}) => {
  const [agentPersonality, setAgentPersonality] = useState(() => {
    return localStorage.getItem('nuz_agent_personality') || 'Nuz Professional (An elite, highly structured standalone workspace companion automating documents and communication streams).';
  });
  const [systemInstructions, setSystemInstructions] = useState(() => {
    return localStorage.getItem('nuz_system_instructions') || 'Always represent yourself as Nuz, an advanced standalone productivity agent. Help automate local workflows, analyze code or documents, draft communication, and optimize business strategies.';
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);

  const handleExecutePurge = () => {
    setShowConfirmPurge(false);
    if (onPurgeCanvas) {
      onPurgeCanvas();
    }
  };


  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Save configurations to storage
    localStorage.setItem('nuz_agent_personality', agentPersonality);
    localStorage.setItem('nuz_system_instructions', systemInstructions);

    // Simulate async saving
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto fade-in p-6 p-mobile-4 gap-4 gap-mobile-2" style={{ background: 'var(--bg-main)' }}>
      
      {/* Settings Banner */}
      <div className="flex justify-between items-center premium-card p-6 flex-shrink-0" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--primary-hybrid-gradient)', color: '#ffffff', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)' }}>
        <div className="flex items-center gap-4">
          <button className="mobile-menu-btn mobile-only" onClick={onMenuClick} style={{ marginRight: '8px', color: '#ffffff' }}>
            <Menu size={20} />
          </button>
          <div className="pulse-glow flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={20} style={{ color: '#ffffff' }} />
          </div>
          <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{ fontSize: '24px', fontFamily: 'Outfit, sans-serif', margin: 0, color: '#ffffff', fontWeight: '800' }}>
              Workspace Preferences
            </h1>
            <p className="desktop-only" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0' }}>Configure your NUZ persona style and customize core system instructions.</p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 desktop-only" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 14px', borderRadius: '50px', color: '#10b981', fontSize: '12px', fontWeight: '600', display: 'flex' }}>
            <CheckCircle2 size={14} /> Saved
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
        
        {/* Core Settings: Instructions & Persona */}
        <div className="premium-card p-6 flex flex-col gap-6 animate-slide-up animate-stagger-1" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary-hybrid)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0 }}>Persona Customization</h3>
          </div>

          <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-col gap-2" style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', alignSelf: 'flex-start' }}>Agent Persona Style</label>
              <input 
                type="text"
                value={agentPersonality}
                onChange={(e) => setAgentPersonality(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontSize: '12.5px',
                  outline: 'none',
                  width: '100%',
                  marginTop: '4px'
                }}
              />
            </div>

            <div className="flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', alignSelf: 'flex-start' }}>Base System Prompt</label>
              <textarea 
                rows="6"
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: '1.5',
                  width: '100%',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Appearance Details */}
        <div className="premium-card p-6 flex flex-col justify-between animate-slide-up animate-stagger-2" style={{ gap: '24px', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          
          <div className="flex-col gap-5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            

            <div className="flex-col gap-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '16px' }}>
              <div className="flex gap-2 text-xs" style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Authorized User:</span>
                <strong style={{ color: 'var(--text-main)' }}>{userProfile?.name || 'Nuz User'}</strong>
              </div>
              <div className="flex gap-2 text-xs" style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Workspace Email:</span>
                <strong style={{ color: 'var(--text-main)' }}>{userProfile?.email || ''}</strong>
              </div>
              <div className="flex gap-2 text-xs" style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Workspace State:</span>
                <strong style={{ color: '#10b981' }}>Standalone Secure Environment</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button 
              className="flex items-center gap-1.5"
              onClick={handleSaveSettings}
              disabled={isSaving}
              style={{
                background: 'var(--primary-hybrid-gradient)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="pulse-glow" style={{ animation: 'spin 1s linear infinite' }} /> Committing...
                </>
              ) : (
                <>
                  <Save size={14} /> Commit Preferences
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Danger Zone Card */}
      <div className="premium-card p-6 flex flex-col gap-4 animate-slide-up animate-stagger-3" style={{ 
        marginTop: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)', 
        background: 'rgba(239, 68, 68, 0.04)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={18} style={{ color: '#ef4444' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', color: '#ef4444', margin: 0 }}>Danger Zone</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', margin: 0 }}>Clear Chat History & Reset Cache</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>This action will permanently delete all chat history, clear active Google integration sessions, and reset your local settings. This cannot be undone.</p>
          </div>
          <div>
            {!showConfirmPurge ? (
              <button
                onClick={() => setShowConfirmPurge(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} /> Clear History & Cache
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>Are you absolutely sure?</span>
                <button
                  onClick={handleExecutePurge}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowConfirmPurge(false)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
