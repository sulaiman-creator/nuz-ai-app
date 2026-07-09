import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, CheckSquare, MessageSquare, Clipboard, Activity, Play, Plus, Trash2, Clock, Menu } from 'lucide-react';

const Dashboard = ({ userProfile, activities, setCurrentView, onMenuClick }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('nuz_local_tasks');
    try {
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'Review quarterly budget proposal', done: true },
        { id: '2', text: 'Draft executive summary for enterprise clients', done: false },
        { id: '3', text: 'Refine workflow automation roadmap', done: false }
      ];
    } catch {
      return [
        { id: '1', text: 'Review quarterly budget proposal', done: true },
        { id: '2', text: 'Draft executive summary for enterprise clients', done: false },
        { id: '3', text: 'Refine workflow automation roadmap', done: false }
      ];
    }
  });

  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    localStorage.setItem('nuz_local_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const handleToggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Retrieve chat message count
  const [chatCount, setChatCount] = useState(0);
  useEffect(() => {
    const savedMsg = localStorage.getItem('nuz_messages');
    if (savedMsg) {
      try {
        const msgs = JSON.parse(savedMsg);
        setChatCount(msgs.length);
      } catch (e) {}
    }
  }, []);

  const quickPrompts = [
    { title: "Strategic Roadmap", text: "Create a 5-step operational automation roadmap for a logistics company." },
    { title: "Marketing Draft", text: "Draft a high-conversion email proposal introducing our new consulting services." },
    { title: "Data Analysis Plan", text: "Explain how to audit database memory and query response speeds." }
  ];

  const triggerQuickPrompt = (promptText) => {
    // Put message text in local input draft and redirect
    localStorage.setItem('nuz_chat_draft', promptText);
    setCurrentView('chat');
    // Dispatch custom event if ChatWindow is listening, or App will handle it
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = promptText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg-main)' }} className="page-wipe-in p-6 p-mobile-4 gap-4 gap-mobile-2">

      {/* ── Header Banner ── */}
      <div className="premium-card flex-mobile-col flex-shrink-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'var(--primary-hybrid-gradient)', color: '#ffffff', gap: '16px', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="mobile-menu-btn mobile-only" onClick={onMenuClick} style={{ marginRight: '8px', color: '#ffffff' }}>
            <Menu size={20} />
          </button>
          <div className="pulse-glow" style={{ display: 'flex', alignItems: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', flexShrink: 0, justifyContent: 'center' }}>
            <Sparkles size={20} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', margin: 0, color: '#ffffff' }}>
              Good day, {userProfile?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="desktop-only" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0' }}>
              Here's a quick look at your workspace today.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <Radio size={12} className="pulse-glow" style={{ color: '#10b981' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#10b981' }}>
            Active
          </span>
        </div>
      </div>

      {/* ── Stat Widgets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
        <div className="premium-card animate-slide-up animate-stagger-1" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: 'var(--primary-hybrid)', flexShrink: 0 }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Messages</span>
            <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', lineHeight: 1.1, marginTop: '4px' }}>
              {chatCount} messages
            </div>
          </div>
        </div>

        <div className="premium-card animate-slide-up animate-stagger-2" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', flexShrink: 0 }}>
            <CheckSquare size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Tasks Completed</span>
            <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', lineHeight: 1.1, marginTop: '4px' }}>
              {completionRate}%
            </div>
          </div>
        </div>

        <div className="premium-card animate-slide-up animate-stagger-3" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Session</span>
            <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', lineHeight: 1.1, marginTop: '4px' }}>
              Unlimited
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Panels Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>

        {/* Local Task Tracker Panel */}
        <div className="premium-card animate-slide-up animate-stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', minHeight: '380px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 className="text-gradient" style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>My Tasks</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saved Locally</span>
          </div>

          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input 
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new priority task..."
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button 
              type="submit"
              style={{
                background: 'var(--primary-hybrid-gradient)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={16} />
            </button>
          </form>

          {tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 12px', 
                    background: task.done ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-surface)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    flexShrink: 0 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleToggleTask(task.id)}>
                    <input 
                      type="checkbox"
                      checked={task.done}
                      readOnly
                      style={{ accentColor: 'var(--primary-hybrid)', cursor: 'pointer' }}
                    />
                    <span style={{ 
                      fontSize: '12.5px', 
                      color: task.done ? 'var(--text-muted)' : 'var(--text-main)', 
                      textDecoration: task.done ? 'line-through' : 'none',
                      fontWeight: '500', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {task.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' }}>
              <Clipboard size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>All caught up! Add a task to start tracking priorities.</p>
            </div>
          )}
        </div>

        {/* Direct Action Templates Panel */}
        <div className="premium-card animate-slide-up animate-stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', minHeight: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 className="text-gradient" style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Quick Start Prompts</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Chat</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Click any prompt below to start a conversation right away.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
            {quickPrompts.map((p, i) => (
              <div 
                key={i} 
                onClick={() => triggerQuickPrompt(p.text)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  transition: 'border-color 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', overflow: 'hidden', width: '90%' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: '700' }}>{p.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'left' }}>{p.text}</span>
                </div>
                <Play size={11} style={{ color: 'var(--primary-hybrid)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── System Activity Panel ── */}
      <div className="premium-card animate-slide-up animate-stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', minHeight: '280px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 className="text-gradient" style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Recent Activity</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {activities.map((act, i) => (
            <div key={act.id || i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--bg-surface)', borderLeft: '2px solid var(--primary-hybrid)', borderRadius: '4px', flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4, margin: 0, textAlign: 'left' }}>{act.text}</p>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
