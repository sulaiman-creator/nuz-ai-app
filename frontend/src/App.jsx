import React, { useState, useEffect } from 'react';
import { MessageSquare, LayoutDashboard, BarChart2, Link2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Connectors from './components/Connectors';
import './index.css';

// ─── Connector ID list (all Google Workspace apps) ─────────────
const ALL_CONNECTORS = ['gmail', 'drive', 'calendar', 'docs', 'slides', 'tasks', 'meet', 'contacts', 'youtube', 'forms'];

// Helper to extract search terms and build Gmail/Drive queries dynamically from user prompt
function buildSearchQueries(userMessage) {
  if (!userMessage) return { gmailQ: 'is:unread', driveQ: 'trashed=false' };
  
  const text = userMessage.toLowerCase();
  
  // Default fallbacks
  let gmailQ = 'is:unread';
  let driveQ = 'trashed=false';
  
  // Clean terms to extract keywords
  let cleanText = userMessage
    .replace(/[?.!,]/g, '')
    .replace(/\b(search|find|show|get|list|retrieve|look\s+for|check|read|open|download|view)\b/gi, '')
    .replace(/\b(my|me|the|a|an|any|in|on|from|about|named|called|containing|with|for|email|emails|gmail|file|files|drive|document|documents|doc|docs|spreadsheet|spreadsheets|sheet|sheets|calendar|events|meetings|schedule)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (cleanText.length > 1) {
    gmailQ = cleanText;
    const escapedText = cleanText.replace(/'/g, "\\'");
    driveQ = `trashed=false and (name contains '${escapedText}' or fullText contains '${escapedText}')`;
  }
  
  // Specific override for "new/unread email" queries
  if (/\b(unread|new|recent|latest)\b/i.test(text) && /\b(email|emails|mail|mails|message|messages|inbox)\b/i.test(text)) {
    gmailQ = 'is:unread';
  }
  
  // Specific override for "from [name]" queries
  const fromMatch = text.match(/\bfrom\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}|[a-zA-Z]+)/i);
  if (fromMatch && /\b(email|emails|mail|mails|message|messages)\b/i.test(text)) {
    gmailQ = `from:${fromMatch[1]}`;
    if (cleanText) {
      const remaining = cleanText.replace(new RegExp(`\\bfrom\\s+${fromMatch[1]}\\b`, 'gi'), '').replace(/\s+/g, ' ').trim();
      if (remaining) gmailQ += ` ${remaining}`;
    }
  }

  return { gmailQ, driveQ };
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('nuz_is_authenticated') === 'true';
  });

  useEffect(() => {
    // Simulated secure workspace cognitive core initialization sequence
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1250);
    return () => clearTimeout(timer);
  }, []);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('nuz_user_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'dashboard', 'analytics', 'settings'
  const [loginError, setLoginError] = useState(null);
  
  const [showAndroidRedirect, setShowAndroidRedirect] = useState(false);
  const [androidRedirectUrl, setAndroidRedirectUrl] = useState('');
  
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('nuz_activities');
    try {
      return saved ? JSON.parse(saved) : [
        { id: '1', type: 'system', text: 'Assistant initialized successfully.', timestamp: new Date().toISOString() },
        { id: '2', type: 'system', text: 'Workspace preferences loaded.', timestamp: new Date().toISOString() }
      ];
    } catch {
      return [
        { id: '1', type: 'system', text: 'Assistant initialized successfully.', timestamp: new Date().toISOString() },
        { id: '2', type: 'system', text: 'Workspace preferences loaded.', timestamp: new Date().toISOString() }
      ];
    }
  });

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('nuz_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse conversations:", e);
      }
    }
    return [{
      id: 'default',
      title: 'Welcome Discussion',
      messages: [{
        id: '1',
        role: 'model',
        content: 'Welcome to Nuz! I am your intelligent AI Workspace companion. How can I help you today?'
      }]
    }];
  });

  const [activeConversationId, setActiveConversationId] = useState(() => {
    return localStorage.getItem('nuz_active_conversation_id') || 'default';
  });

  const [activeModel, setActiveModel] = useState(() => {
    return localStorage.getItem('nuz_active_model') || 'gemini';
  });

  // Keep a local messages state synchronized with active conversation
  const [messages, setMessages] = useState(() => {
    const savedId = localStorage.getItem('nuz_active_conversation_id') || 'default';
    const savedConvs = localStorage.getItem('nuz_conversations');
    let loadedConvs = conversations;
    if (savedConvs) {
      try { loadedConvs = JSON.parse(savedConvs); } catch {}
    }
    const active = loadedConvs.find(c => c.id === savedId) || loadedConvs[0];
    return active ? active.messages : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  // When active conversation ID changes, load its messages
  useEffect(() => {
    const active = conversations.find(c => c.id === activeConversationId);
    if (active) {
      setMessages(active.messages);
    }
    localStorage.setItem('nuz_active_conversation_id', activeConversationId);
  }, [activeConversationId]);

  // When messages update, save back to conversations and localStorage
  useEffect(() => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === activeConversationId) {
          let title = c.title;
          if (title === 'Welcome Discussion' || title === 'New Discussion Stream') {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
              const text = firstUserMsg.content;
              title = text.length > 25 ? text.substring(0, 25) + '...' : text;
            }
          }
          return { ...c, messages, title };
        }
        return c;
      });
      localStorage.setItem('nuz_conversations', JSON.stringify(updated));
      return updated;
    });
  }, [messages, activeConversationId]);

  // Sync active model to localStorage
  useEffect(() => {
    localStorage.setItem('nuz_active_model', activeModel);
  }, [activeModel]);

  useEffect(() => {
    localStorage.setItem('nuz_activities', JSON.stringify(activities));
  }, [activities]);

  // ─── Fetch Conversations from Backend ───
  const fetchConversations = async (email, userName) => {
    try {
      const res = await fetch(`/api/conversations?userEmail=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data);
          
          // Set active conversation & load messages
          const lastActiveId = localStorage.getItem('nuz_active_conversation_id');
          const active = data.find(c => c.id === lastActiveId) || data[0];
          if (active) {
            setActiveConversationId(active.id);
            setMessages(active.messages);
          }
        } else {
          const name = userName || userProfile?.name || 'User';
          const welcomeConv = {
            id: 'default',
            title: 'Welcome Discussion',
            messages: [{
              id: '1',
              role: 'model',
              content: `Welcome to Nuz, ${name}! I am your secure, highly intelligent workspace companion. How can I help you today?`
            }]
          };
          setConversations([welcomeConv]);
          setActiveConversationId('default');
          setMessages(welcomeConv.messages);
        }
      }
    } catch (e) {
      console.error("Failed to load backend conversations:", e);
    }
  };

  // ─── Fetch Conversations on Mount/Auth ───
  useEffect(() => {
    if (isAuthenticated && userProfile?.email) {
      fetchConversations(userProfile.email);
    }
  }, [isAuthenticated, userProfile?.email]);

  // ─── Debounced Conversation Sync to Backend ───
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.email || !activeConversationId) return;
    const active = conversations.find(c => c.id === activeConversationId);
    if (!active) return;

    const delayDebounce = setTimeout(() => {
      const saveActiveConv = async () => {
        try {
          await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: userProfile.email,
              conversation: active
            })
          });
        } catch (e) {
          console.error("Error syncing conversation to backend:", e);
        }
      };
      saveActiveConv();
    }, 1000); // 1-second debounce

    return () => clearTimeout(delayDebounce);
  }, [conversations, activeConversationId, isAuthenticated, userProfile?.email]);

  // Google OAuth redirect token interceptor
  useEffect(() => {
    const handleHashAndLogin = () => {
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const state = params.get('state'); // State is appId e.g. 'gmail', 'drive', 'calendar' or 'login'
        const errorParam = params.get('error');
        const errorDesc = params.get('error_description');

        if (errorParam) {
          console.error('Google OAuth redirect error:', errorParam, errorDesc);
          setLoginError(`Google Sign-In failed: ${errorDesc || errorParam}`);
          window.history.replaceState(null, null, window.location.pathname);
          return;
        }

        if (accessToken) {
          if (state === 'android-login') {
            // Clear any lingering authenticated session in this browser container
            localStorage.removeItem('nuz_is_authenticated');
            localStorage.removeItem('nuz_user_profile');
            localStorage.removeItem('nuz_activities');
            
            // Attempt automatic redirection first
            window.location.href = "nuz-ai://oauth-callback" + window.location.hash;
            // Set state to show the premium interactive redirect page as fallback for Chrome block
            setAndroidRedirectUrl("nuz-ai://oauth-callback" + window.location.hash);
            setShowAndroidRedirect(true);
            return;
          }

          if (state === 'login') {
            setLoginError(null);
            // Retrieve user profile
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
            .then(res => {
              if (!res.ok) {
                throw new Error(`Profile endpoint returned HTTP ${res.status}`);
              }
              return res.json();
            })
            .then(profile => {
              if (profile.error) {
                throw new Error(profile.error_description || profile.error);
              }
              const userProfile = {
                name: profile.name || profile.given_name || 'Google User',
                email: profile.email,
                picture: profile.picture
              };
              
              // Auto-authorize ALL connectors with a single oauth token
              ALL_CONNECTORS.forEach(id => {
                localStorage.setItem(`nuz_token_${id}`, accessToken);
                localStorage.setItem(`nuz_conn_${id}`, 'true');
              });
              // Legacy spreadsheets key for backward compat
              localStorage.setItem('nuz_token_spreadsheets', accessToken);
              localStorage.setItem('nuz_conn_spreadsheets', 'true');

              handleLoginSuccess(userProfile, accessToken);
            })
            .catch(err => {
              console.error('Error fetching Google profile:', err);
              setLoginError(`Google profile fetch failed: ${err.message}. Please try again.`);
            });
          } else if (state) {
            localStorage.setItem(`nuz_token_${state}`, accessToken);
            localStorage.setItem(`nuz_conn_${state}`, 'true');
            
            const log = {
              id: Date.now().toString(),
              type: 'system',
              text: `Successfully authenticated and connected Google ${state.toUpperCase()} live stream!`,
              timestamp: new Date().toISOString()
            };
            setActivities(prev => [log, ...prev].slice(0, 15));
          }

          // Clear hash from URL immediately for clean routing
          window.history.replaceState(null, null, window.location.pathname);
        }
      }
    };

    handleHashAndLogin();
    window.addEventListener('hashchange', handleHashAndLogin);
    return () => {
      window.removeEventListener('hashchange', handleHashAndLogin);
    };
  }, []);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConv = {
      id: newId,
      title: 'New Discussion Stream',
      messages: [{
        id: '1',
        role: 'model',
        content: 'Canvas updated. Let\'s continue our deep workspace execution! How can I assist you with your next task?'
      }]
    };
    
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    setCurrentView('chat');
    
    // Add local log to activities
    const log = {
      id: Date.now().toString(),
      type: 'chat',
      text: 'Initiated a new discussion session.',
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [log, ...prev].slice(0, 15));
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setCurrentView('chat');
  };

  const handleDeleteConversation = async (id, e) => {
    if (e) e.stopPropagation();
    
    const filtered = conversations.filter(c => c.id !== id);
    let nextConversations = filtered;
    if (filtered.length === 0) {
      nextConversations = [{
        id: 'default',
        title: 'Welcome Discussion',
        messages: [{
          id: '1',
          role: 'model',
          content: 'Welcome to Nuz! I am your intelligent AI Workspace companion. How can I help you today?'
        }]
      }];
    }
    
    setConversations(nextConversations);
    localStorage.setItem('nuz_conversations', JSON.stringify(nextConversations));

    if (activeConversationId === id) {
      setActiveConversationId(nextConversations[0].id);
    }

    if (isAuthenticated && userProfile?.email) {
      try {
        await fetch(`/api/conversations?userEmail=${encodeURIComponent(userProfile.email)}&id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Failed to delete conversation on backend:", err);
      }
    }
  };

  const handleSendMessage = async (text, attachment) => {
    const newUserMsg = { id: Date.now().toString(), role: 'user', content: text };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Dynamic Google API live resolution
    let gmailData = null;
    let driveData = null;
    let calendarData = null;
    let docsData = null;
    let slidesData = null;
    let tasksData = null;
    let meetData = null;
    let contactsData = null;
    let youtubeData = null;
    let formsData = null;

    const gmailConnected    = localStorage.getItem('nuz_conn_gmail')    === 'true';
    const driveConnected    = localStorage.getItem('nuz_conn_drive')    === 'true';
    const calendarConnected = localStorage.getItem('nuz_conn_calendar') === 'true';
    const docsConnected     = localStorage.getItem('nuz_conn_docs')     === 'true';
    const slidesConnected   = localStorage.getItem('nuz_conn_slides')   === 'true';
    const tasksConnected    = localStorage.getItem('nuz_conn_tasks')    === 'true';
    const meetConnected     = localStorage.getItem('nuz_conn_meet')     === 'true';
    const contactsConnected = localStorage.getItem('nuz_conn_contacts') === 'true';
    const youtubeConnected  = localStorage.getItem('nuz_conn_youtube')  === 'true';
    const formsConnected    = localStorage.getItem('nuz_conn_forms')    === 'true';

    const gmailToken    = localStorage.getItem('nuz_token_gmail');
    const driveToken    = localStorage.getItem('nuz_token_drive');
    const calendarToken = localStorage.getItem('nuz_token_calendar');
    const docsToken     = localStorage.getItem('nuz_token_docs');
    const slidesToken   = localStorage.getItem('nuz_token_slides');
    const tasksToken    = localStorage.getItem('nuz_token_tasks');
    const meetToken     = localStorage.getItem('nuz_token_meet');
    const contactsToken = localStorage.getItem('nuz_token_contacts');
    const youtubeToken  = localStorage.getItem('nuz_token_youtube');
    const formsToken    = localStorage.getItem('nuz_token_forms');

    const { gmailQ, driveQ } = buildSearchQueries(text);

    // Track activity log with search terms
    const userLog = {
      id: Date.now().toString(),
      type: 'user',
      text: `Sent user query: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => {
      const next = [userLog];
      if (gmailConnected && gmailQ !== 'is:unread') {
        next.push({
          id: Date.now().toString() + '_sync_g',
          type: 'system',
          text: `Searching Gmail for: "${gmailQ}"`,
          timestamp: new Date().toISOString()
        });
      }
      if (driveConnected && driveQ !== 'trashed=false') {
        next.push({
          id: Date.now().toString() + '_sync_d',
          type: 'system',
          text: `Searching Drive for: "${driveQ}"`,
          timestamp: new Date().toISOString()
        });
      }
      return [...next, ...prev].slice(0, 15);
    });

    if (gmailToken && gmailConnected) {
      try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(gmailQ)}&maxResults=8`, {
          headers: { Authorization: `Bearer ${gmailToken}` }
        });
        if (res.ok) {
          localStorage.setItem('nuz_status_gmail', 'success');
          const data = await res.json();
          if (data && data.messages) {
            gmailData = await Promise.all(data.messages.map(async (msg) => {
              try {
                const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                  headers: { Authorization: `Bearer ${gmailToken}` }
                });
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  const headers = detail.payload.headers;
                  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
                  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
                  const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
                  return {
                    sender: from,
                    subject: subject,
                    time: date,
                    summary: detail.snippet
                  };
                } else {
                  return { sender: 'System', subject: 'Error details failed', time: '', summary: `Failed to fetch headers: HTTP ${detailRes.status}` };
                }
              } catch (e) {
                return { sender: 'System', subject: 'Error details catch', time: '', summary: `Exception: ${e.message}` };
              }
            }));
            gmailData = gmailData.filter(Boolean);
          } else {
            gmailData = [];
          }
        } else {
          const errText = await res.text().catch(() => '');
          let errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson?.error?.message) {
              errMsg = errJson.error.message;
            }
          } catch {}
          gmailData = { error: errMsg };
          localStorage.setItem('nuz_status_gmail', errMsg);

          // Add a failure event directly to the activities feed
          const errLog = {
            id: Date.now().toString() + '_err_g',
            type: 'system',
            text: `Gmail sync failed: ${errMsg.substring(0, 80)}...`,
            timestamp: new Date().toISOString()
          };
          setActivities(prev => [errLog, ...prev].slice(0, 15));

          if (res.status === 401) {
            localStorage.removeItem('nuz_token_gmail');
            localStorage.setItem('nuz_conn_gmail', 'false');
            localStorage.removeItem('nuz_status_gmail');
          }
        }
      } catch (e) {
        console.error("Gmail fetch failed:", e);
        const errMsg = `Network/CORS fetch error: ${e.message}. Please check if the Gmail API is enabled in your Google Cloud Console for Client ID: ${localStorage.getItem('nuz_google_client_id') || 'your-client-id'} and if the Origin is allowed.`;
        gmailData = { error: errMsg };
        localStorage.setItem('nuz_status_gmail', errMsg);

        // Add a network failure event to the activities feed
        const errLog = {
          id: Date.now().toString() + '_err_g_net',
          type: 'system',
          text: `Gmail network sync error: ${e.message}`,
          timestamp: new Date().toISOString()
        };
        setActivities(prev => [errLog, ...prev].slice(0, 15));
      }
    }

    if (driveToken && driveConnected) {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQ)}&pageSize=30&fields=files(id,name,mimeType,size,modifiedTime)`, {
          headers: { Authorization: `Bearer ${driveToken}` }
        });
        if (res.ok) {
          localStorage.setItem('nuz_status_drive', 'success');
          const data = await res.json();
          const files = data.files || [];
          driveData = files;

          // Dynamically fetch and attach sheet data for Google Sheets spreadsheets
          const spreadsheets = files.filter(f => f.mimeType === 'application/vnd.google-apps.spreadsheet');
          if (spreadsheets.length > 0) {
            // Fetch content for the top 3 spreadsheets to optimize performance
            const targetSheets = spreadsheets.slice(0, 3);
            await Promise.all(targetSheets.map(async (sheet) => {
              try {
                // Fetch first 100 rows and 26 columns of the sheet (A1:Z100)
                const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.id}/values/A1:Z100`, {
                  headers: { Authorization: `Bearer ${driveToken}` }
                });
                if (valuesRes.ok) {
                  const valuesJson = await valuesRes.json();
                  sheet.sheetsData = valuesJson.values || [];
                } else {
                  sheet.sheetsData = { error: `Sheets API HTTP ${valuesRes.status}` };
                }
              } catch (err) {
                sheet.sheetsData = { error: err.message };
              }
            }));
          }
        } else {
          const errText = await res.text().catch(() => '');
          let errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson?.error?.message) {
              errMsg = errJson.error.message;
            }
          } catch {}
          driveData = { error: errMsg };
          localStorage.setItem('nuz_status_drive', errMsg);

          // Add a failure event directly to the activities feed
          const errLog = {
            id: Date.now().toString() + '_err_d',
            type: 'system',
            text: `Drive sync failed: ${errMsg.substring(0, 80)}...`,
            timestamp: new Date().toISOString()
          };
          setActivities(prev => [errLog, ...prev].slice(0, 15));

          if (res.status === 401) {
            localStorage.removeItem('nuz_token_drive');
            localStorage.setItem('nuz_conn_drive', 'false');
            localStorage.removeItem('nuz_status_drive');
          }
        }
      } catch (e) {
        console.error("Drive fetch failed:", e);
        const errMsg = `Network/CORS fetch error: ${e.message}. Please check if the Google Drive API is enabled in your Google Cloud Console for Client ID: ${localStorage.getItem('nuz_google_client_id') || 'your-client-id'} and if the Origin is allowed.`;
        driveData = { error: errMsg };
        localStorage.setItem('nuz_status_drive', errMsg);

        // Add a network failure event to the activities feed
        const errLog = {
          id: Date.now().toString() + '_err_d_net',
          type: 'system',
          text: `Drive network sync error: ${e.message}`,
          timestamp: new Date().toISOString()
        };
        setActivities(prev => [errLog, ...prev].slice(0, 15));
      }
    }

    if (calendarToken && calendarConnected) {
      try {
        const timeMin = new Date().toISOString();
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=8&orderBy=startTime&singleEvents=true`, {
          headers: { Authorization: `Bearer ${calendarToken}` }
        });
        if (res.ok) {
          localStorage.setItem('nuz_status_calendar', 'success');
          const data = await res.json();
          calendarData = (data.items || []).map(item => ({
            event: item.summary || '(No Title)',
            time: item.start?.dateTime || item.start?.date || '',
            details: item.description || ''
          }));
        } else {
          const errText = await res.text().catch(() => '');
          let errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson?.error?.message) {
              errMsg = errJson.error.message;
            }
          } catch {}
          calendarData = { error: errMsg };
          localStorage.setItem('nuz_status_calendar', errMsg);

          // Add a failure event directly to the activities feed
          const errLog = {
            id: Date.now().toString() + '_err_c',
            type: 'system',
            text: `Calendar sync failed: ${errMsg.substring(0, 80)}...`,
            timestamp: new Date().toISOString()
          };
          setActivities(prev => [errLog, ...prev].slice(0, 15));

          if (res.status === 401) {
            localStorage.removeItem('nuz_token_calendar');
            localStorage.setItem('nuz_conn_calendar', 'false');
            localStorage.removeItem('nuz_status_calendar');
          }
        }
      } catch (e) {
        console.error("Calendar fetch failed:", e);
        const errMsg = `Network/CORS fetch error: ${e.message}. Please check if the Google Calendar API is enabled in your Google Cloud Console for Client ID: ${localStorage.getItem('nuz_google_client_id') || 'your-client-id'} and if the Origin is allowed.`;
        calendarData = { error: errMsg };
        localStorage.setItem('nuz_status_calendar', errMsg);

        // Add a network failure event to the activities feed
        const errLog = {
          id: Date.now().toString() + '_err_c_net',
          type: 'system',
          text: `Calendar network sync error: ${e.message}`,
          timestamp: new Date().toISOString()
        };
        setActivities(prev => [errLog, ...prev].slice(0, 15));
      }
    }

    // ── Google Docs Fetcher ──────────────────────────────────────
    if (docsToken && docsConnected) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document' and trashed=false&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          { headers: { Authorization: `Bearer ${docsToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const files = data.files || [];
          // Fetch content of top 3 docs
          docsData = await Promise.all(
            files.slice(0, 3).map(async (doc) => {
              try {
                const exportRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`,
                  { headers: { Authorization: `Bearer ${docsToken}` } }
                );
                const textContent = exportRes.ok ? (await exportRes.text()).substring(0, 2000) : '';
                return { name: doc.name, modifiedTime: doc.modifiedTime, content: textContent };
              } catch (e) {
                return { name: doc.name, modifiedTime: doc.modifiedTime, content: '' };
              }
            })
          );
        } else {
          docsData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_docs'); localStorage.setItem('nuz_conn_docs', 'false'); }
        }
      } catch (e) {
        docsData = { error: e.message };
      }
    }

    // ── Google Slides Fetcher ────────────────────────────────────
    if (slidesToken && slidesConnected) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation' and trashed=false&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          { headers: { Authorization: `Bearer ${slidesToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const files = data.files || [];
          slidesData = await Promise.all(
            files.slice(0, 3).map(async (slide) => {
              try {
                const exportRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${slide.id}/export?mimeType=text/plain`,
                  { headers: { Authorization: `Bearer ${slidesToken}` } }
                );
                const textContent = exportRes.ok ? (await exportRes.text()).substring(0, 1500) : '';
                return { name: slide.name, modifiedTime: slide.modifiedTime, content: textContent };
              } catch (e) {
                return { name: slide.name, modifiedTime: slide.modifiedTime, content: '' };
              }
            })
          );
        } else {
          slidesData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_slides'); localStorage.setItem('nuz_conn_slides', 'false'); }
        }
      } catch (e) {
        slidesData = { error: e.message };
      }
    }

    // ── Google Tasks Fetcher ─────────────────────────────────────
    if (tasksToken && tasksConnected) {
      try {
        const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=5', {
          headers: { Authorization: `Bearer ${tasksToken}` }
        });
        if (listsRes.ok) {
          const listsData = await listsRes.json();
          const lists = listsData.items || [];
          tasksData = await Promise.all(
            lists.slice(0, 3).map(async (list) => {
              try {
                const tasksRes = await fetch(
                  `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?maxResults=15&showCompleted=false`,
                  { headers: { Authorization: `Bearer ${tasksToken}` } }
                );
                if (tasksRes.ok) {
                  const tData = await tasksRes.json();
                  return {
                    listName: list.title,
                    tasks: (tData.items || []).map(t => ({ title: t.title, due: t.due || '', notes: t.notes || '', status: t.status }))
                  };
                }
                return { listName: list.title, tasks: [] };
              } catch (e) {
                return { listName: list.title, tasks: [], error: e.message };
              }
            })
          );
        } else {
          tasksData = { error: `HTTP ${listsRes.status}` };
          if (listsRes.status === 401) { localStorage.removeItem('nuz_token_tasks'); localStorage.setItem('nuz_conn_tasks', 'false'); }
        }
      } catch (e) {
        tasksData = { error: e.message };
      }
    }

    // ── Google Meet (via Calendar with conferenceData) ───────────
    if (meetToken && meetConnected) {
      try {
        const timeMin = new Date().toISOString();
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&orderBy=startTime&singleEvents=true`,
          { headers: { Authorization: `Bearer ${meetToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          meetData = (data.items || [])
            .filter(item => item.conferenceData && item.conferenceData.entryPoints)
            .map(item => ({
              event: item.summary || '(No Title)',
              time: item.start?.dateTime || item.start?.date || '',
              meetLink: item.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || '',
              attendees: (item.attendees || []).map(a => a.email).join(', ')
            }));
        } else {
          meetData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_meet'); localStorage.setItem('nuz_conn_meet', 'false'); }
        }
      } catch (e) {
        meetData = { error: e.message };
      }
    }

    // ── Google Contacts Fetcher ──────────────────────────────────
    if (contactsToken && contactsConnected) {
      try {
        const res = await fetch(
          `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=50`,
          { headers: { Authorization: `Bearer ${contactsToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          contactsData = (data.connections || []).map(p => ({
            name: p.names?.[0]?.displayName || '(No Name)',
            email: p.emailAddresses?.[0]?.value || '',
            phone: p.phoneNumbers?.[0]?.value || '',
            org: p.organizations?.[0]?.name || ''
          }));
        } else {
          contactsData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_contacts'); localStorage.setItem('nuz_conn_contacts', 'false'); }
        }
      } catch (e) {
        contactsData = { error: e.message };
      }
    }

    // ── YouTube Fetcher ──────────────────────────────────────────
    if (youtubeToken && youtubeConnected) {
      try {
        // Extract potential search query from user message
        const ytQuery = text.replace(/youtube|video|watch|find|search/gi, '').trim() || 'trending';
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(ytQuery)}&maxResults=8&type=video`,
          { headers: { Authorization: `Bearer ${youtubeToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          youtubeData = (data.items || []).map(item => ({
            title: item.snippet?.title || '',
            channel: item.snippet?.channelTitle || '',
            published: item.snippet?.publishedAt || '',
            description: (item.snippet?.description || '').substring(0, 200),
            videoId: item.id?.videoId || '',
            url: item.id?.videoId ? `https://youtu.be/${item.id.videoId}` : ''
          }));
        } else {
          youtubeData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_youtube'); localStorage.setItem('nuz_conn_youtube', 'false'); }
        }
      } catch (e) {
        youtubeData = { error: e.message };
      }
    }

    // ── Google Forms Fetcher ─────────────────────────────────────
    if (formsToken && formsConnected) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form' and trashed=false&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          { headers: { Authorization: `Bearer ${formsToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const files = data.files || [];
          formsData = await Promise.all(
            files.slice(0, 3).map(async (form) => {
              try {
                const formRes = await fetch(
                  `https://forms.googleapis.com/v1/forms/${form.id}`,
                  { headers: { Authorization: `Bearer ${formsToken}` } }
                );
                if (formRes.ok) {
                  const formDetail = await formRes.json();
                  return {
                    name: form.name,
                    modifiedTime: form.modifiedTime,
                    title: formDetail.info?.title || form.name,
                    description: formDetail.info?.description || '',
                    questionCount: (formDetail.items || []).length
                  };
                }
                return { name: form.name, modifiedTime: form.modifiedTime };
              } catch (e) {
                return { name: form.name, modifiedTime: form.modifiedTime };
              }
            })
          );
        } else {
          formsData = { error: `HTTP ${res.status}` };
          if (res.status === 401) { localStorage.removeItem('nuz_token_forms'); localStorage.setItem('nuz_conn_forms', 'false'); }
        }
      } catch (e) {
        formsData = { error: e.message };
      }
    }

    try {
      const savedSystemInstructions = localStorage.getItem('nuz_system_instructions') || '';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          attachment: attachment,
          systemInstruction: savedSystemInstructions,
          model: activeModel,
          connectors: {
            gmail:    gmailConnected,
            drive:    driveConnected,
            calendar: calendarConnected,
            docs:     docsConnected,
            slides:   slidesConnected,
            tasks:    tasksConnected,
            meet:     meetConnected,
            contacts: contactsConnected,
            youtube:  youtubeConnected,
            forms:    formsConnected,
          },
          realData: {
            gmail:    gmailData,
            drive:    driveData,
            calendar: calendarData,
            docs:     docsData,
            slides:   slidesData,
            tasks:    tasksData,
            meet:     meetData,
            contacts: contactsData,
            youtube:  youtubeData,
            forms:    formsData,
          },
          userEmail: userProfile?.email || 'sulaiman@cloudpartners.biz'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages([...updatedMessages, { 
          id: Date.now().toString() + 'r', 
          role: 'model', 
          content: data.message
        }]);

        const agentLog = {
          id: Date.now().toString(),
          type: 'assistant',
          text: 'Generated cognitive stream response.',
          timestamp: new Date().toISOString()
        };
        setActivities(prev => [agentLog, ...prev].slice(0, 15));
      } else {
        setMessages([...updatedMessages, { 
          id: Date.now().toString() + 'e', 
          role: 'model', 
          content: "Error: " + (data.error || "Failed to generate response.") 
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...updatedMessages, { 
        id: Date.now().toString() + 'e', 
        role: 'model', 
        content: "Error: Could not connect to the workspace brain backend." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (profileData, token) => {
    setUserProfile(profileData);
    setIsAuthenticated(true);
    
    // Set fresh local activities
    const freshLogs = [
      { id: '1', type: 'system', text: `Authorized workspace session for ${profileData.name}.`, timestamp: new Date().toISOString() },
      { id: '2', type: 'system', text: 'Assistant initialized successfully.', timestamp: new Date().toISOString() }
    ];
    setActivities(freshLogs);

    localStorage.setItem('nuz_is_authenticated', 'true');
    localStorage.setItem('nuz_user_profile', JSON.stringify(profileData));
    localStorage.setItem('nuz_activities', JSON.stringify(freshLogs));
    
    // Fetch user's persistent threads from backend
    fetchConversations(profileData.email, profileData.name);
  };

  const handleLogout = () => {
    localStorage.removeItem('nuz_is_authenticated');
    localStorage.removeItem('nuz_user_profile');
    localStorage.removeItem('nuz_activities');
    localStorage.removeItem('nuz_messages');
    localStorage.removeItem('nuz_conversations');
    localStorage.removeItem('nuz_active_conversation_id');
    
    // Clear Google OAuth tokens & connection status
    ALL_CONNECTORS.forEach(id => {
      localStorage.removeItem(`nuz_token_${id}`);
      localStorage.removeItem(`nuz_conn_${id}`);
      localStorage.removeItem(`nuz_status_${id}`);
    });
    localStorage.removeItem('nuz_token_spreadsheets');
    localStorage.removeItem('nuz_conn_spreadsheets');

    setIsAuthenticated(false);
    setUserProfile(null);
    setActivities([]);
    setConversations([{
      id: 'default',
      title: 'Welcome Discussion',
      messages: [{
        id: '1',
        role: 'model',
        content: 'Welcome to Nuz! I am your intelligent AI Workspace companion. How can I elevate your productivity today?'
      }]
    }]);
    setActiveConversationId('default');
    setMessages([{
      id: '1',
      role: 'model',
      content: 'Welcome to Nuz! I am your intelligent AI Workspace companion. How can I elevate your productivity today?'
    }]);
    setCurrentView('chat');
  };

  const handlePurgeCanvas = async () => {
    // Clear tokens
    ALL_CONNECTORS.forEach(id => {
      localStorage.removeItem(`nuz_token_${id}`);
      localStorage.removeItem(`nuz_conn_${id}`);
      localStorage.removeItem(`nuz_status_${id}`);
    });
    localStorage.removeItem('nuz_token_spreadsheets');
    localStorage.removeItem('nuz_conn_spreadsheets');
    
    // Clear discussions & activities
    localStorage.removeItem('nuz_conversations');
    localStorage.removeItem('nuz_active_conversation_id');
    localStorage.removeItem('nuz_activities');
    
    // Reset state variables
    const defaultConv = {
      id: 'default',
      title: 'Welcome Discussion',
      messages: [{
        id: '1',
        role: 'model',
        content: `Welcome back, ${userProfile?.name || 'User'}! I am your intelligent AI Workspace companion. Let's start with a fresh slate!`
      }]
    };
    
    setConversations([defaultConv]);
    setActiveConversationId('default');
    setMessages(defaultConv.messages);
    
    const freshLogs = [
      { id: Date.now().toString() + '_1', type: 'system', text: 'Workspace cache and history cleared.', timestamp: new Date().toISOString() },
      { id: Date.now().toString() + '_2', type: 'system', text: 'Assistant re-initialized successfully.', timestamp: new Date().toISOString() }
    ];
    setActivities(freshLogs);
    localStorage.setItem('nuz_activities', JSON.stringify(freshLogs));
    localStorage.setItem('nuz_conversations', JSON.stringify([defaultConv]));
    localStorage.setItem('nuz_active_conversation_id', 'default');

    setCurrentView('chat');

    if (isAuthenticated && userProfile?.email) {
      try {
        await fetch(`/api/conversations?userEmail=${encodeURIComponent(userProfile.email)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Failed to purge conversations on backend:", err);
      }
    }
  };

  // Mobile nav items
  const mobileNavItems = [
    { view: 'chat',       icon: <MessageSquare size={20} />,  label: 'Chat'       },
    { view: 'dashboard',  icon: <LayoutDashboard size={20} />, label: 'Dashboard'  },
    { view: 'connectors', icon: <Link2 size={20} />,           label: 'Connect'    },
    { view: 'analytics',  icon: <BarChart2 size={20} />,       label: 'Analytics'  },
    { view: 'settings',   icon: <SettingsIcon size={20} />,    label: 'Settings'   },
  ];

  if (showAndroidRedirect) {
    return (
      <div 
        className="app-container" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100vw', 
          height: '100vh', 
          background: '#070A13',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Starfield / Ambient glowing blobs */}
        <div className="starfield-overlay" style={{ opacity: 0.4 }} />
        <div className="ambient-blob blob-1" style={{ filter: 'blur(160px)', background: 'var(--primary-hybrid, #8b5cf6)', width: '350px', height: '350px', top: '10%', left: '15%', opacity: 0.15 }} />
        <div className="ambient-blob blob-2" style={{ filter: 'blur(180px)', background: '#3b82f6', width: '450px', height: '450px', bottom: '15%', right: '15%', opacity: 0.12 }} />

        <div 
          className="premium-card floating" 
          style={{ 
            zIndex: 10, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            maxWidth: '380px', 
            width: '90%', 
            padding: '40px 24px', 
            borderRadius: '24px', 
            background: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}
        >
          {/* Shaded Google-colored folded "N" Ribbon Logo */}
          <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '28px' }}>
            <div style={{ position: 'absolute', inset: '-12px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)', filter: 'blur(10px)', borderRadius: '50%' }} />
            <svg viewBox="0 0 24 24" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 1, position: 'relative' }}>
              <defs>
                <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="100%" stopColor="#1A5AB5" />
                </linearGradient>
                <linearGradient id="greenG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34A853" />
                  <stop offset="100%" stopColor="#137333" />
                </linearGradient>
                <linearGradient id="redG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#EA4335" />
                  <stop offset="100%" stopColor="#B31412" />
                </linearGradient>
                <linearGradient id="yellowG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FBBC05" />
                  <stop offset="100%" stopColor="#E38E00" />
                </linearGradient>
                <linearGradient id="shadowG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
                <linearGradient id="centerShadowG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              
              {/* Left Pillar */}
              <path d="M5,5 L8,5 L8,19 L5,19 Z" fill="url(#blueG)" />
              {/* Right Pillar */}
              <path d="M16,5 L19,5 L19,19 L16,19 Z" fill="url(#greenG)" />
              {/* Upper Diagonal */}
              <path d="M5,5 L8,5 L13.5,12 L10.5,12 Z" fill="url(#redG)" />
              {/* Lower Diagonal */}
              <path d="M10.5,12 L13.5,12 L19,19 L16,19 Z" fill="url(#yellowG)" />
              
              {/* Overlapping Shadows */}
              <path d="M8,5 L9,5.8 L9,10 L8,9.2 Z" fill="url(#shadowG)" />
              <path d="M16,14 L16.8,14.6 L16.8,19 L16,19 Z" fill="url(#shadowG)" />
              <path d="M10.5,12 L13.5,12 L12.8,13.8 L11.2,13.8 Z" fill="url(#centerShadowG)" />
            </svg>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '0.5px', color: '#ffffff' }}>
            AUTHENTICATION COMPLETE
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: '0 0 32px 0', lineHeight: '1.5' }}>
            Your secure session has been initialized. Tap below to launch your Nuz AI workspace.
          </p>

          <a
            href={androidRedirectUrl}
            className="pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              padding: '16px 28px',
              borderRadius: '16px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sparkles size={18} />
            <span>Open Nuz AI App</span>
          </a>

          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '24px', letterSpacing: '0.5px' }}>
            SECURE COGNITIVE SHIELD ENABLED
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg-main)' }}
    >
      {isInitializing && (
        <div className="nuz-splash-screen">
          <div className="nuz-splash-logo-container">
            <div className="nuz-splash-ring" />
            <div className="nuz-splash-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
              <svg viewBox="0 0 24 24" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="splashBlueG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#1A5AB5" />
                  </linearGradient>
                  <linearGradient id="splashGreenG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34A853" />
                    <stop offset="100%" stopColor="#137333" />
                  </linearGradient>
                  <linearGradient id="splashRedG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EA4335" />
                    <stop offset="100%" stopColor="#B31412" />
                  </linearGradient>
                  <linearGradient id="splashYellowG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FBBC05" />
                    <stop offset="100%" stopColor="#E38E00" />
                  </linearGradient>
                  <linearGradient id="splashShadowG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </linearGradient>
                  <linearGradient id="splashCenterShadowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </linearGradient>
                </defs>
                
                {/* Left Pillar */}
                <path d="M5,5 L8,5 L8,19 L5,19 Z" fill="url(#splashBlueG)" />
                {/* Right Pillar */}
                <path d="M16,5 L19,5 L19,19 L16,19 Z" fill="url(#splashGreenG)" />
                {/* Upper Diagonal */}
                <path d="M5,5 L8,5 L13.5,12 L10.5,12 Z" fill="url(#splashRedG)" />
                {/* Lower Diagonal */}
                <path d="M10.5,12 L13.5,12 L19,19 L16,19 Z" fill="url(#splashYellowG)" />
                
                {/* Overlapping Shadows */}
                <path d="M8,5 L9,5.8 L9,10 L8,9.2 Z" fill="url(#splashShadowG)" />
                <path d="M16,14 L16.8,14.6 L16.8,19 L16,19 Z" fill="url(#splashShadowG)" />
                <path d="M10.5,12 L13.5,12 L12.8,13.8 L11.2,13.8 Z" fill="url(#splashCenterShadowG)" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '0.5px', margin: 0 }}>
            NUZ AI WORKSPACE
          </h2>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1.2px', margin: '6px 0 0' }}>
            Initializing workspace...
          </p>
          <div className="nuz-splash-progress-track">
            <div className="nuz-splash-progress-bar" />
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '32px', opacity: 0.6 }}>
            Secure Enterprise Application
          </p>
        </div>
      )}

      {/* Ambient glow blobs */}
      <div className="ambient-glow-container">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
      </div>

      {!isAuthenticated ? (
        <div style={{ zIndex: 1, width: '100%', height: '100%' }}>
          <Login onLoginSuccess={handleLoginSuccess} externalError={loginError} />
        </div>
      ) : (
        <div style={{ display: 'flex', width: '100%', height: '100%', zIndex: 1 }}>

          {/* Sidebar overlay (mobile) */}
          <div
            className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Desktop sidebar */}
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            onNewChat={handleNewChat}
            isMobileOpen={isMobileMenuOpen}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />

          {/* Main content */}
          <div className="main-content-area" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>


            {/* Views — all rendered into the full remaining height */}
            <div className="view-swap-transition" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {currentView === 'chat' && (
                <ChatWindow
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  userProfile={userProfile}
                  onLogout={handleLogout}
                  onMenuClick={() => setIsMobileMenuOpen(true)}
                  activeModel={activeModel}
                  setActiveModel={setActiveModel}
                />
              )}
              {currentView === 'dashboard' && (
                <Dashboard
                  userProfile={userProfile}
                  activities={activities}
                  setCurrentView={setCurrentView}
                  onMenuClick={() => setIsMobileMenuOpen(true)}
                />
              )}
              {currentView === 'analytics' && (
                <Analytics
                  activities={activities}
                  setCurrentView={setCurrentView}
                  onMenuClick={() => setIsMobileMenuOpen(true)}
                />
              )}
              {currentView === 'connectors' && (
                <Connectors
                  onUpdateActivities={(newLog) => setActivities(prev => [newLog, ...prev].slice(0, 15))}
                  onMenuClick={() => setIsMobileMenuOpen(true)}
                />
              )}
              {currentView === 'settings' && (
                <Settings
                  userProfile={userProfile}
                  onMenuClick={() => setIsMobileMenuOpen(true)}
                  onPurgeCanvas={handlePurgeCanvas}
                />
              )}
            </div>

            {/* ── Mobile Bottom Navigation ── */}
            <nav className="mobile-bottom-nav">
              {mobileNavItems.map(({ view, icon, label }) => (
                <button
                  key={view}
                  className={`mobile-nav-btn ${currentView === view ? 'active' : ''}`}
                  onClick={() => setCurrentView(view)}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </nav>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
