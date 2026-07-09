import React, { useState, useEffect } from 'react';
import { TrendingUp, Database, Timer, Gauge, ArrowUpRight, Activity, Clipboard, CheckCircle2, AlertCircle, Menu } from 'lucide-react';

const Analytics = ({ activities, setCurrentView, onMenuClick }) => {
  const [tasks, setTasks] = useState([]);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    // Read local tasks
    const savedTasks = localStorage.getItem('nuz_local_tasks');
    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch (e) {}
    }

    // Read messages
    const savedMsg = localStorage.getItem('nuz_messages');
    if (savedMsg) {
      try { setChatCount(JSON.parse(savedMsg).length); } catch (e) {}
    }
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Pie chart calculation
  const totalItems = totalTasks || 1;
  const compPct = totalTasks > 0 ? Math.round((completedTasks / totalItems) * 100) : 40; // placeholder defaults if empty
  const pendPct = totalTasks > 0 ? Math.round((pendingTasks / totalItems) * 100) : 60;

  // Dynamic distribution lists
  const activityDistribution = {
    system: activities.filter(a => a.type === 'system').length,
    chat: activities.filter(a => a.type === 'chat' || a.type === 'user' || a.type === 'assistant').length,
    other: activities.filter(a => a.type !== 'system' && a.type !== 'chat' && a.type !== 'user' && a.type !== 'assistant').length
  };

  const totalLogs = activities.length || 1;
  const systemLogPct = Math.round((activityDistribution.system / totalLogs) * 100);
  const chatLogPct = Math.round((activityDistribution.chat / totalLogs) * 100);
  const otherLogPct = Math.round((activityDistribution.other / totalLogs) * 100);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto page-wipe-in p-6 p-mobile-4 gap-4 gap-mobile-2" style={{ background: 'var(--bg-main)' }}>
      
      {/* Header Banner */}
      <div className="premium-card p-6 flex-shrink-0" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--primary-hybrid-gradient)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="mobile-menu-btn mobile-only" onClick={onMenuClick} style={{ marginRight: '8px', color: '#ffffff' }}>
            <Menu size={20} />
          </button>
          <div className="pulse-glow flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} style={{ color: '#ffffff' }} />
          </div>
          <div className="flex-col" style={{ alignItems: 'flex-start', display: 'flex' }}>
            <h1 style={{ fontSize: '24px', fontFamily: 'Outfit, sans-serif', margin: 0, color: '#ffffff', fontWeight: '800' }}>
              Workspace Analytics
            </h1>
            <p className="desktop-only" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0' }}>Track your productivity and workspace usage over time.</p>
          </div>
        </div>
      </div>

      {/* Grid of Metric Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
        
        <div className="premium-card p-5 animate-slide-up animate-stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Gauge size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Checklist Rate</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '2px 0 0' }}>{completionRate}%</h2>
          </div>
        </div>

        <div className="premium-card p-5 animate-slide-up animate-stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Activity size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Activity Status</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '2px 0 0' }}>Active</h2>
          </div>
        </div>

        <div className="premium-card p-5 animate-slide-up animate-stagger-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Timer size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response Time</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '2px 0 0' }}>Instant</h2>
          </div>
        </div>

      </div>

      {/* Main Charts Block */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
        
        {/* Glowing Donut Chart */}
        <div className="premium-card p-6 animate-slide-up animate-stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="text-gradient" style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', width: '100%', textAlign: 'left', margin: 0 }}>Task Distribution Ratio</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', justifyContent: 'center', width: '100%', flex: 1 }}>
            
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(0,0,0,0.04)" strokeWidth="3" />
                
                {/* Completed circle */}
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--primary-hybrid)" strokeWidth="3" 
                  strokeDasharray={`${compPct} ${100 - compPct}`}
                  strokeDashoffset="25"
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
                
                {/* Pending circle */}
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(0,0,0,0.12)" strokeWidth="3.2" 
                  strokeDasharray={`${pendPct} ${100 - pendPct}`}
                  strokeDashoffset={`${25 - compPct}`}
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)' }}>{totalTasks}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Total Tasks</span>
              </div>
            </div>

            {/* Legend Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-hybrid)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>Completed ({completedTasks})</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{compPct}% weight</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>Pending ({pendingTasks})</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pendPct}% weight</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Categories Analysis */}
        <div className="premium-card p-6 animate-slide-up animate-stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="text-gradient" style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Workspace Activity Breakdown</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            
            {/* Category 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Chat History & Prompts</span>
                <span style={{ color: 'var(--text-muted)' }}>{activityDistribution.chat} Entries ({chatLogPct || 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${chatLogPct || 0}%`, height: '100%', background: 'var(--primary-hybrid-gradient)', borderRadius: '10px' }} />
              </div>
            </div>

            {/* Category 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Account & Workspace Events</span>
                <span style={{ color: 'var(--text-muted)' }}>{activityDistribution.system} Entries ({systemLogPct || 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${systemLogPct || 0}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '10px' }} />
              </div>
            </div>

            {/* Category 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Sync & Storage Settings</span>
                <span style={{ color: 'var(--text-muted)' }}>{activityDistribution.other} Entries ({otherLogPct || 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${otherLogPct || 0}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '10px' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
