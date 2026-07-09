import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserCircle2, Sparkles, LogOut, Search, X, ChevronUp, ChevronDown, Menu } from 'lucide-react';
import MessageBubble from './MessageBubble';
import UserInput from './UserInput';
import './ChatWindow.css';

const ChatWindow = ({ messages, onSendMessage, isLoading, userProfile, onLogout, onMenuClick, activeModel, setActiveModel }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ── Search State ─────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]); // [{msgIndex, matchStart, matchEnd}]
  const [currentResult, setCurrentResult] = useState(0);
  const searchInputRef = useRef(null);
  const msgRefs = useRef({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!searchOpen) scrollToBottom();
  }, [messages, isLoading, searchOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentResult(0);
    }
  }, [searchOpen]);

  // Intercept Ctrl+F or Cmd+F to open custom search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Run search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResult(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const hits = [];
    messages.forEach((msg, idx) => {
      let contentString = '';
      if (typeof msg.content === 'string') {
        contentString = msg.content;
      } else if (msg.content) {
        contentString = JSON.stringify(msg.content);
      } else if (msg.text) {
        contentString = msg.text;
      } else {
        contentString = JSON.stringify(msg);
      }
      if (contentString.toLowerCase().includes(q)) {
        hits.push(idx);
      }
    });
    setSearchResults(hits);
    setCurrentResult(0);
    if (hits.length > 0) {
      scrollToMsg(hits[0]);
    }
  }, [searchQuery, messages]);

  const scrollToMsg = useCallback((idx) => {
    const el = msgRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const goPrev = () => {
    if (!searchResults.length) return;
    const next = (currentResult - 1 + searchResults.length) % searchResults.length;
    setCurrentResult(next);
    scrollToMsg(searchResults[next]);
  };
  const goNext = () => {
    if (!searchResults.length) return;
    const next = (currentResult + 1) % searchResults.length;
    setCurrentResult(next);
    scrollToMsg(searchResults[next]);
  };

  return (
    <div className="chat-window">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="chat-header">
        {/* Left: mobile menu + Nuz branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="model-selector" style={{ flexShrink: 0 }}>
            <div className="avatar-hybrid mini pulse-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-hybrid-gradient)', borderRadius: '50%', width: '28px', height: '28px', flexShrink: 0 }}>
              <Sparkles size={12} style={{ color: '#ffffff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif', background: 'var(--primary-hybrid-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                NUZ
              </h2>
              <span className="hide-xs" style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Intelligent Workspace Companion</span>
            </div>
          </div>
        </div>

        {/* Right: search + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Search toggle */}
          <button
            className="header-icon-btn"
            onClick={() => setSearchOpen(v => !v)}
            title="Search messages (Ctrl+F)"
            style={{ color: searchOpen ? 'var(--primary-hybrid)' : undefined }}
          >
            <Search size={18} />
          </button>

          {/* Profile dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="user-profile-btn" title={userProfile?.name || 'User Profile'} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {userProfile?.picture
                ? <img src={userProfile.picture} alt="Profile" className="user-avatar-img" />
                : <UserCircle2 size={24} style={{ color: 'var(--text-muted)' }} />
              }
            </button>

            {isDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsDropdownOpen(false)} />
                <div className="profile-dropdown" style={{ position: 'absolute', right: 0, top: '40px', zIndex: 100 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{userProfile?.name || 'Nuz User'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>{userProfile?.email || ''}</p>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button
                      onClick={() => { setIsDropdownOpen(false); onLogout?.(); }}
                      className="dropdown-btn danger"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────── */}
      {searchOpen && (
        <div className="search-bar-container fade-in">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            className="search-bar-input"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.shiftKey ? goPrev() : goNext(); }
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
          {searchQuery && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {searchResults.length > 0 ? `${currentResult + 1} / ${searchResults.length}` : 'No results'}
            </span>
          )}
          <button className="search-nav-btn" onClick={goPrev} disabled={!searchResults.length} title="Previous (Shift+Enter)"><ChevronUp size={14}/></button>
          <button className="search-nav-btn" onClick={goNext} disabled={!searchResults.length} title="Next (Enter)"><ChevronDown size={14}/></button>
          <button className="search-nav-btn" onClick={() => setSearchOpen(false)} title="Close search"><X size={14}/></button>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="messages-container" ref={messagesContainerRef}>
        <div className="messages-inner">
          {messages.map((msg, idx) => {
            const isHighlighted = searchResults.includes(idx);
            const isActive = searchResults[currentResult] === idx;
            return (
              <div
                key={msg.id || idx}
                ref={el => { msgRefs.current[idx] = el; }}
                className={isHighlighted ? `search-highlight-bubble ${isActive ? 'search-highlight-bubble-active' : ''}` : ''}
              >
                <MessageBubble message={msg} searchQuery={searchOpen ? searchQuery : ''} />
              </div>
            );
          })}

          {isLoading && (
            <div className="nuz-breathing-loader fade-in">
              <div className="agent-avatar pulse-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-hybrid-gradient)', borderRadius: '50%', width: '32px', height: '32px', flexShrink: 0 }}>
                <Sparkles size={14} style={{ color: '#fff' }} />
              </div>
              <div className="loading-dots">
                <span className="dot" style={{ animationDelay: '-0.32s' }} />
                <span className="dot" style={{ animationDelay: '-0.16s' }} />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="input-container-wrapper">
        <div className="input-inner">
          <UserInput onSendMessage={onSendMessage} isLoading={isLoading} />
          <p className="disclaimer">Nuz may display inaccurate info, including about people, so double-check its responses.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
