import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, Shield } from 'lucide-react';
import './Login.css';

const Login = ({ onLoginSuccess, externalError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync external redirect errors
  useEffect(() => {
    if (externalError) {
      setError(externalError);
      setLoading(false);
    }
  }, [externalError]);

  const clientId = '299837825330-gk7atoifobjged0opibo0cp4pidumuji.apps.googleusercontent.com';

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError(null);

    // Dynamic scopes for ALL Google Workspace resources (single consent flow)
    const scopes = [
      'openid',
      'email',
      'profile',
      // Gmail
      'https://www.googleapis.com/auth/gmail.readonly',
      // Drive, Sheets (includes Docs/Slides/Forms via Drive)
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      // Calendar + Meet (Meet events come from Calendar)
      'https://www.googleapis.com/auth/calendar.readonly',
      // Docs
      'https://www.googleapis.com/auth/documents.readonly',
      // Slides
      'https://www.googleapis.com/auth/presentations.readonly',
      // Tasks
      'https://www.googleapis.com/auth/tasks.readonly',
      // Contacts (People API)
      'https://www.googleapis.com/auth/contacts.readonly',
      // YouTube
      'https://www.googleapis.com/auth/youtube.readonly',
      // Forms
      'https://www.googleapis.com/auth/forms.body.readonly',
    ].join(' ');

    const redirectUri = window.location.origin;
    const isAndroid = /NuzAndroid/i.test(navigator.userAgent) || !!(window.AndroidInterface && window.AndroidInterface.launchAuth);
    const state = isAndroid ? 'android-login' : 'login';
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${state}&include_granted_scopes=true&prompt=consent`;

    // Use native bridge if available (for Android app)
    if (isAndroid && window.AndroidInterface && window.AndroidInterface.launchAuth) {
      window.AndroidInterface.launchAuth(oauthUrl);
      setLoading(false);
    } else {
      // Redirect to Google Consent (for web or fallback if bridge not yet bound)
      window.location.href = oauthUrl;
    }
  };

  return (
    <div className="login-container">
      <div className="starfield-overlay" />
      <div className="ambient-blob blob-1" style={{ filter: 'blur(160px)', background: 'var(--primary-hybrid)', width: '350px', height: '350px', top: '10%', left: '15%', opacity: 0.15 }} />
      <div className="ambient-blob blob-2" style={{ filter: 'blur(180px)', background: '#3b82f6', width: '450px', height: '450px', bottom: '15%', right: '15%', opacity: 0.12 }} />

      <div className="login-box premium-card floating">
        <div className="login-logo-container">
          <div className="nuz-logo-glow"></div>
          <span className="nuz-brand-text">NUZ</span>
        </div>
        
        <h1 className="login-title">Sign in to Nuz AI</h1>
        <p className="login-subtitle">Connect your Google Workspace to continue</p>
        
        {error && <p className="login-error-msg">{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {/* Main Action: Secure OAuth Sign In */}
          <button 
            onClick={handleGoogleSignIn}
            className="google-signin-btn pulse-glow"
            disabled={loading}
            style={{
              background: 'var(--primary-hybrid-gradient)',
              border: 'none',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px var(--border-glow)',
              cursor: 'pointer'
            }}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.42v2.85h2.64c1.55-1.44 2.44-3.56 2.44-6.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.85c-.73.49-1.66.78-2.64.78-2.85 0-5.27-1.92-6.13-4.51H1.05v3c1.8 3.59 5.51 6.04 9.8 6.04z" fill="#34A853"/>
              <path d="M5.87 13.76c-.22-.65-.35-1.35-.35-2.07s.13-1.42.35-2.07V6.62H1.05C.38 8.12 0 9.77 0 11.5s.38 3.38 1.05 4.88l4.82-3.62z" fill="#FBBC05"/>
              <path d="M12 4.14c1.62 0 3.08.56 4.22 1.66l3.17-3.17C17.45 1.05 14.97 0 12 0 7.7 0 3.99 2.45 2.19 6.04l4.82 3.62c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
            </svg>
            <span>{loading ? 'Connecting...' : 'Sign In with Google'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
            <Shield size={12} style={{ color: 'var(--primary-hybrid)' }} />
            <span>End-to-End Encryption Enabled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
            <Globe size={12} style={{ color: 'var(--primary-hybrid)' }} />
            <span>Secure Enterprise Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
