import React, { useState } from 'react';
import { Menu, Plus, MessageSquare, Settings, LayoutDashboard, BarChart2, Link2, X } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ 
  currentView, 
  setCurrentView, 
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  isMobileOpen
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const navItem = (view, icon, label) => (
    <button
      className={`sidebar-nav-item ${currentView === view ? 'active' : ''}`}
      onClick={() => setCurrentView(view)}
      title={label}
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </button>
  );

  return (
    <div className={`sidebar flex-col ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top">
        <div className="flex items-center justify-between w-full" style={{ padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {isExpanded && (
            <div className="app-logo flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="logo-glow" />
              <span className="logo-text">NUZ</span>
            </div>
          )}
          <button className="icon-btn menu-btn" onClick={() => setIsExpanded(!isExpanded)}>
            <Menu size={18} />
          </button>
        </div>

        {/* New Chat — calls onNewChat which resets/adds conversations */}
        <button className="new-chat-btn pulse-glow" onClick={onNewChat}>
          <Plus size={18} />
          {isExpanded && <span>New Chat</span>}
        </button>
      </div>

      {/* Conversations History List */}
      <div className="sidebar-middle flex-1" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isExpanded && (
          <div className="recent-section">
            <h3 className="section-title">Workspace</h3>
            {navItem('chat', <MessageSquare size={16} />, 'Chat Board')}
          </div>
        )}

        {isExpanded && conversations && conversations.length > 0 && (
          <div className="recent-section" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            <h3 className="section-title">Recent Streams</h3>
            <div className="recent-chats-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`sidebar-nav-item ${activeConversationId === conv.id && currentView === 'chat' ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    <MessageSquare size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)', fontWeight: activeConversationId === conv.id ? '600' : '400' }}>
                      {conv.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(239, 68, 68, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px'
                    }}
                    title="Delete Chat"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-bottom">
        {navItem('dashboard', <LayoutDashboard size={18} />, 'Dashboard')}
        {navItem('analytics', <BarChart2 size={18} />, 'Analytics')}
        {navItem('connectors', <Link2 size={18} />, 'Connectors')}
        {navItem('settings', <Settings size={18} />, 'Settings')}
      </div>
    </div>
  );
};

export default Sidebar;
