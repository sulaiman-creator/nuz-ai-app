import React, { useState } from 'react';
import {
  Database, Calendar, Mail, CheckCircle2, Map, CloudSun, Menu, Plus, Zap,
  ArrowRight, FileText, Presentation, CheckSquare, Video, Users, Play,
  ClipboardList
} from 'lucide-react';

const Connectors = ({ onUpdateActivities, onMenuClick }) => {
  const [connections, setConnections] = useState(() => ({
    gmail:     localStorage.getItem('nuz_conn_gmail')     === 'true',
    drive:     localStorage.getItem('nuz_conn_drive')     === 'true',
    calendar:  localStorage.getItem('nuz_conn_calendar')  === 'true',
    docs:      localStorage.getItem('nuz_conn_docs')      === 'true',
    slides:    localStorage.getItem('nuz_conn_slides')    === 'true',
    tasks:     localStorage.getItem('nuz_conn_tasks')     === 'true',
    meet:      localStorage.getItem('nuz_conn_meet')      === 'true',
    contacts:  localStorage.getItem('nuz_conn_contacts')  === 'true',
    youtube:   localStorage.getItem('nuz_conn_youtube')   === 'true',
    forms:     localStorage.getItem('nuz_conn_forms')     === 'true',
  }));

  const clientId = localStorage.getItem('nuz_google_client_id') || '299837825330-gk7atoifobjged0opibo0cp4pidumuji.apps.googleusercontent.com';

  // Define the scopes for each connector
  const SCOPES = {
    gmail:    'https://www.googleapis.com/auth/gmail.readonly',
    drive:    'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
    calendar: 'https://www.googleapis.com/auth/calendar.readonly',
    docs:     'https://www.googleapis.com/auth/documents.readonly',
    slides:   'https://www.googleapis.com/auth/presentations.readonly',
    tasks:    'https://www.googleapis.com/auth/tasks.readonly',
    meet:     'https://www.googleapis.com/auth/calendar.readonly', // Meet events via Calendar
    contacts: 'https://www.googleapis.com/auth/contacts.readonly',
    youtube:  'https://www.googleapis.com/auth/youtube.readonly',
    forms:    'https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/drive.readonly',
  };

  const handleToggleConnection = (appId) => {
    const isCurrentlyConnected = connections[appId];
    if (isCurrentlyConnected) {
      const updated = { ...connections, [appId]: false };
      setConnections(updated);
      localStorage.setItem(`nuz_conn_${appId}`, 'false');
      localStorage.removeItem(`nuz_token_${appId}`);
      localStorage.removeItem(`nuz_status_${appId}`);
      if (onUpdateActivities) {
        onUpdateActivities({
          id: Date.now().toString(),
          type: 'system',
          text: `Disconnected from ${appId} integration.`,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const scope = SCOPES[appId] || 'https://www.googleapis.com/auth/drive.readonly';
      const redirectUri = window.location.origin;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=${appId}&include_granted_scopes=true&prompt=consent`;

      if (window.AndroidInterface && window.AndroidInterface.launchAuth) {
        window.AndroidInterface.launchAuth(oauthUrl);
      } else {
        window.location.href = oauthUrl;
      }
    }
  };

  // ─── Google Workspace Core Apps ───────────────────────────────
  const coreApps = [
    {
      id: 'gmail',
      name: 'Gmail',
      tagline: 'Read emails & draft replies with AI',
      description: 'Ask Nuz to find emails, summarize threads, or write professional replies — all from your inbox.',
      icon: <Mail size={22} style={{ color: '#EA4335' }} />,
      iconBg: 'rgba(234, 67, 53, 0.1)',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      tagline: 'Search and analyze your files',
      description: 'Instantly find documents, read spreadsheets, and get AI-powered summaries of your files.',
      icon: <Database size={22} style={{ color: '#34A853' }} />,
      iconBg: 'rgba(52, 168, 83, 0.1)',
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      tagline: 'Manage your schedule effortlessly',
      description: 'Check upcoming meetings, plan your day, and get smart scheduling suggestions from Nuz.',
      icon: <Calendar size={22} style={{ color: '#4285F4' }} />,
      iconBg: 'rgba(66, 133, 244, 0.1)',
    },
    {
      id: 'docs',
      name: 'Google Docs',
      tagline: 'Read & summarize your documents',
      description: 'Let Nuz read your Google Docs, extract key insights, summarize long reports, and answer questions about your content.',
      icon: <FileText size={22} style={{ color: '#4285F4' }} />,
      iconBg: 'rgba(66, 133, 244, 0.1)',
    },
    {
      id: 'slides',
      name: 'Google Slides',
      tagline: 'Understand your presentations instantly',
      description: 'Ask Nuz to summarize presentations, extract speaker notes, and outline your slide decks with AI.',
      icon: <Presentation size={22} style={{ color: '#F4B400' }} />,
      iconBg: 'rgba(244, 180, 0, 0.1)',
    },
    {
      id: 'tasks',
      name: 'Google Tasks',
      tagline: 'Manage tasks & to-dos with AI',
      description: 'View, track, and get AI-driven recommendations on your Google Tasks. Stay on top of your workload effortlessly.',
      icon: <CheckSquare size={22} style={{ color: '#34A853' }} />,
      iconBg: 'rgba(52, 168, 83, 0.1)',
    },
    {
      id: 'meet',
      name: 'Google Meet',
      tagline: 'Upcoming meetings & call links',
      description: 'Nuz pulls your upcoming Google Meet sessions, gives you join links, summaries, and smart prep notes before each call.',
      icon: <Video size={22} style={{ color: '#00897B' }} />,
      iconBg: 'rgba(0, 137, 123, 0.1)',
    },
    {
      id: 'contacts',
      name: 'Google Contacts',
      tagline: 'Smart contact lookup & insights',
      description: 'Ask Nuz to find contact details, email addresses, or phone numbers from your Google Contacts directory.',
      icon: <Users size={22} style={{ color: '#7B1FA2' }} />,
      iconBg: 'rgba(123, 31, 162, 0.1)',
    },
    {
      id: 'forms',
      name: 'Google Forms',
      tagline: 'Analyze form responses with AI',
      description: 'Connect your Google Forms to have Nuz summarize response trends, highlight key answers, and generate reports.',
      icon: <ClipboardList size={22} style={{ color: '#7B1FA2' }} />,
      iconBg: 'rgba(123, 31, 162, 0.1)',
    },
  ];

  // ─── YouTube (separate section) ────────────────────────────────
  const youtubeApp = {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Search & summarize YouTube content',
    description: 'Ask Nuz to search YouTube, discover top videos on any topic, and get AI-powered video summaries and insights.',
    icon: <Play size={22} style={{ color: '#FF0000' }} />,
    iconBg: 'rgba(255, 0, 0, 0.1)',
  };

  // ─── Built-in capabilities ─────────────────────────────────────
  const builtInApps = [
    {
      id: 'maps',
      name: 'Google Maps',
      tagline: 'Interactive maps in your chat',
      description: 'Ask Nuz for any location, get live interactive maps, navigation help, and place details.',
      icon: <Map size={22} style={{ color: '#4285F4' }} />,
      iconBg: 'rgba(66, 133, 244, 0.1)',
    },
    {
      id: 'weather',
      name: 'Live Weather',
      tagline: 'Real-time weather anywhere',
      description: 'Get current weather conditions, forecasts, temperature, humidity, and wind data for any city.',
      icon: <CloudSun size={22} style={{ color: '#10b981' }} />,
      iconBg: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );

  const renderConnectorCard = (app, index, animStagger) => (
    <div
      key={app.id}
      className={`connector-card animate-slide-up animate-stagger-${animStagger} ${connections[app.id] ? 'connected' : ''}`}
    >
      <div className="connector-card-top">
        <div className="connector-icon-wrap" style={{ background: app.iconBg }}>
          {app.icon}
        </div>
        {connections[app.id] && (
          <div className="connector-connected-badge">
            <CheckCircle2 size={12} />
            <span>Connected</span>
          </div>
        )}
      </div>
      <div className="connector-card-body">
        <h3 className="connector-name">{app.name}</h3>
        <p className="connector-tagline">{app.tagline}</p>
        <p className="connector-desc">{app.description}</p>
      </div>
      <div className="connector-card-footer">
        {connections[app.id] ? (
          <button className="connector-btn disconnect" onClick={() => handleToggleConnection(app.id)}>
            Disconnect
          </button>
        ) : (
          <button className="connector-btn connect" onClick={() => handleToggleConnection(app.id)}>
            <Plus size={14} />
            Connect
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="connectors-page">
      {/* Page Header */}
      <div className="connectors-header flex-shrink-0">
        <button className="mobile-menu-btn mobile-only" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="connectors-title">Connect your apps</h1>
          <p className="connectors-subtitle">Link all your Google Workspace tools so Nuz can supercharge your productivity.</p>
        </div>
      </div>

      <div className="connectors-scroll-body">

        {/* ── Google Workspace Section ── */}
        <section className="connectors-section animate-slide-up animate-stagger-1">
          <div className="connectors-section-label">
            <div className="connectors-section-icon" style={{ background: 'rgba(234,67,53,0.08)' }}>
              <GoogleIcon />
            </div>
            Google Workspace
          </div>
          <div className="connectors-grid">
            {coreApps.map((app, index) => renderConnectorCard(app, index, Math.min(index + 2, 6)))}
          </div>
        </section>

        {/* ── YouTube Section ── */}
        <section className="connectors-section animate-slide-up animate-stagger-3">
          <div className="connectors-section-label">
            <div className="connectors-section-icon" style={{ background: 'rgba(255,0,0,0.08)' }}>
              <Play size={16} style={{ color: '#FF0000' }} />
            </div>
            YouTube
          </div>
          <div className="connectors-grid">
            {renderConnectorCard(youtubeApp, 0, 4)}
          </div>
        </section>

        {/* ── Built-in Capabilities Section ── */}
        <section className="connectors-section animate-slide-up animate-stagger-4">
          <div className="connectors-section-label">
            <div className="connectors-section-icon" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <Zap size={16} style={{ color: 'var(--primary-hybrid)' }} />
            </div>
            Built-in Capabilities
          </div>
          <div className="connectors-grid">
            {builtInApps.map((app, index) => (
              <div key={app.id} className={`connector-card connected animate-slide-up animate-stagger-${index + 5}`}>
                <div className="connector-card-top">
                  <div className="connector-icon-wrap" style={{ background: app.iconBg }}>
                    {app.icon}
                  </div>
                  <div className="connector-connected-badge always-on">
                    <Zap size={11} />
                    <span>Always on</span>
                  </div>
                </div>
                <div className="connector-card-body">
                  <h3 className="connector-name">{app.name}</h3>
                  <p className="connector-tagline">{app.tagline}</p>
                  <p className="connector-desc">{app.description}</p>
                </div>
                <div className="connector-card-footer">
                  <span className="connector-builtin-label">
                    Included with Nuz <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Connectors;
