import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, MapPin, Navigation, CloudSun, Thermometer, Droplets, Wind, CloudRain, AlertCircle, RefreshCw } from 'lucide-react';
import './MessageBubble.css';

// Helper to escape regex special characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text, query) => {
  if (!query || !query.trim() || typeof text !== 'string') {
    return text;
  }
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const highlightChildren = (children, query) => {
  if (!query || !query.trim()) return children;
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return highlightText(child, query);
    }
    if (React.isValidElement(child)) {
      if (child.props && child.props.children) {
        return React.cloneElement(child, {
          children: highlightChildren(child.props.children, query)
        });
      }
    }
    return child;
  });
};

const getMarkdownComponents = (query) => ({
  p({ children }) {
    return <p>{highlightChildren(children, query)}</p>;
  },
  li({ children }) {
    return <li>{highlightChildren(children, query)}</li>;
  },
  strong({ children }) {
    return <strong>{highlightChildren(children, query)}</strong>;
  },
  em({ children }) {
    return <em>{highlightChildren(children, query)}</em>;
  },
  h1({ children }) {
    return <h1>{highlightChildren(children, query)}</h1>;
  },
  h2({ children }) {
    return <h2>{highlightChildren(children, query)}</h2>;
  },
  h3({ children }) {
    return <h3>{highlightChildren(children, query)}</h3>;
  },
  h4({ children }) {
    return <h4>{highlightChildren(children, query)}</h4>;
  },
  h5({ children }) {
    return <h5>{highlightChildren(children, query)}</h5>;
  },
  h6({ children }) {
    return <h6>{highlightChildren(children, query)}</h6>;
  },
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{highlightChildren(children, query)}</a>;
  }
});

// Google Map Light-Themed Premium Embed
const GoogleMapWidget = ({ query }) => {
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-panel)',
      overflow: 'hidden',
      marginTop: '16px',
      marginBottom: '16px',
      maxWidth: '650px',
      width: '100%',
      boxShadow: 'var(--shadow-md)',
      animation: 'message-slide-in 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <MapPin size={16} style={{ color: 'var(--primary-hybrid)' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              📍 Google Maps Live Frame
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              {query}
            </p>
          </div>
        </div>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            fontSize: '11px',
            color: 'var(--primary-hybrid)',
            textDecoration: 'none',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(139, 92, 246, 0.05)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(139, 92, 246, 0.1)'
          }}
        >
          <Navigation size={11} /> Open App
        </a>
      </div>

      {/* Map Embed Frame */}
      <div style={{ position: 'relative', width: '100%', height: '320px', background: 'var(--bg-main)' }}>
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
        />
      </div>
    </div>
  );
};

// Open-Meteo Satellite Feed Cosmic Weather Widget
const WeatherWidget = ({ city, lat, lon }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Meteorological satellite offline");
        const json = await res.json();
        if (active) {
          setData(json.current);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchWeather();
    return () => { active = false; };
  }, [lat, lon]);

  const getWeatherDetails = (code) => {
    const codes = {
      0: { text: "Sunny & Clear", emoji: "☀️", color: "#eab308" },
      1: { text: "Mainly Clear", emoji: "🌤️", color: "#f59e0b" },
      2: { text: "Partly Cloudy", emoji: "⛅", color: "#94a3b8" },
      3: { text: "Overcast Atmosphere", emoji: "☁️", color: "#64748b" },
      45: { text: "Fog & Haze", emoji: "🌫️", color: "#cbd5e1" },
      48: { text: "Depositing Rime Fog", emoji: "🌫️", color: "#cbd5e1" },
      51: { text: "Light Drizzle", emoji: "🌧️", color: "#60a5fa" },
      53: { text: "Moderate Drizzle", emoji: "🌧️", color: "#3b82f6" },
      55: { text: "Dense Drizzle", emoji: "🌧️", color: "#2563eb" },
      61: { text: "Slight Rain", emoji: "🌦️", color: "#60a5fa" },
      63: { text: "Moderate Rain", emoji: "🌧️", color: "#3b82f6" },
      65: { text: "Heavy Downpour", emoji: "🌧️⛈️", color: "#1d4ed8" },
      80: { text: "Slight Rain Showers", emoji: "🌦️", color: "#60a5fa" },
      81: { text: "Moderate Rain Showers", emoji: "🌧️", color: "#3b82f6" },
      82: { text: "Heavy Rain Showers", emoji: "⛈️🌧️", color: "#1e3a8a" },
      95: { text: "Severe Thunderstorm", emoji: "⚡⛈️", color: "#a855f7" },
      96: { text: "Storm with Mild Hail", emoji: "⛈️❄️", color: "#c084fc" },
      99: { text: "Violent Hailstorm", emoji: "⛈️❄️", color: "#d8b4fe" }
    };
    return codes[code] || { text: "Dynamic Atmosphere", emoji: "🛰️", color: "var(--primary-hybrid)" };
  };

  if (loading) {
    return (
      <div style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-panel)',
        padding: '20px',
        maxWidth: '550px',
        width: '100%',
        marginTop: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <RefreshCw size={16} style={{ color: 'var(--primary-hybrid)', animation: 'spin 1.5s linear infinite' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Fetching Live Meteorological Satellite Streams...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        background: 'rgba(239, 68, 68, 0.02)',
        padding: '16px 20px',
        maxWidth: '550px',
        width: '100%',
        marginTop: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <AlertCircle size={16} style={{ color: '#ef4444' }} />
        <span style={{ fontSize: '13px', color: '#ef4444' }}>Failed to link weather satellite feeds. Stream offline.</span>
      </div>
    );
  }

  const weather = getWeatherDetails(data.weather_code);

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${weather.color}33`,
      background: 'var(--bg-panel)',
      overflow: 'hidden',
      marginTop: '16px',
      marginBottom: '16px',
      maxWidth: '550px',
      width: '100%',
      boxShadow: `0 4px 20px ${weather.color}08, var(--shadow-md)`,
      animation: 'message-slide-in 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: `${weather.color}11`,
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${weather.color}33`
          }}>
            <CloudSun size={16} style={{ color: weather.color }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              📡 Meteorologic Live Stream
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time atmospheric telemetry for {city}
            </p>
          </div>
        </div>
        <div style={{
          fontSize: '10px',
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.08)',
          padding: '2px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontWeight: '700',
          textTransform: 'uppercase'
        }}>
          Satellite Active
        </div>
      </div>

      {/* Temp Metrics */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-panel) 100%)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif', lineHeight: '1' }}>
            {Math.round(data.temperature_2m)}°C
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: weather.color, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {weather.emoji} {weather.text}
          </span>
        </div>
        <div style={{ fontSize: '56px', userSelect: 'none', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
          {weather.emoji}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1px',
        background: 'var(--border-color)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ background: 'var(--bg-surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <Thermometer size={16} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em' }}>Feels Like</span>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700', marginTop: '2px' }}>{Math.round(data.apparent_temperature)}°C</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <Droplets size={16} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em' }}>Humidity</span>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700', marginTop: '2px' }}>{data.relative_humidity_2m}%</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <Wind size={16} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em' }}>Wind Speed</span>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700', marginTop: '2px' }}>{data.wind_speed_10m} km/h</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <CloudRain size={16} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em' }}>Precipitation</span>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700', marginTop: '2px' }}>{data.precipitation} mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const parseWidgets = (text) => {
  if (!text) return [];

  // Robust tag finder
  const regex = /(<google-map\s+[^>]*\/>|<weather-widget\s+[^>]*\/>)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const tag = match[0];

    // Push text before this tag
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, matchIndex)
      });
    }

    if (tag.toLowerCase().startsWith('<google-map')) {
      const queryMatch = /query=["']([^"']+)["']/i.exec(tag);
      const query = queryMatch ? queryMatch[1] : '';
      if (query) {
        parts.push({ type: 'map', query });
      }
    } else if (tag.toLowerCase().startsWith('<weather-widget')) {
      const cityMatch = /city=["']([^"']+)["']/i.exec(tag);
      const latMatch = /lat=["']([^"']+)["']/i.exec(tag);
      const lonMatch = /lon=["']([^"']+)["']/i.exec(tag);

      const city = cityMatch ? cityMatch[1] : '';
      const lat = latMatch ? latMatch[1] : '';
      const lon = lonMatch ? lonMatch[1] : '';

      if (city && lat && lon) {
        parts.push({ type: 'weather', city, lat, lon });
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts;
};

const MessageBubble = ({ message, searchQuery }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="message-row user message-slide-in">
        <div className="message-content-wrapper flex-col user">
          <div className="message-content bubble">
            <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {highlightText(message.content, searchQuery)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Model Message parsing and rendering sequential segments (Text -> Maps -> Weather)
  const segments = parseWidgets(message.content);
  const mdComponents = getMarkdownComponents(searchQuery);

  return (
    <div className="message-row model message-slide-in">
      <div className="agent-avatar pulse-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-hybrid-gradient)', borderRadius: '50%', width: '36px', height: '36px' }}>
        <Sparkles size={16} style={{ color: '#ffffff' }} />
      </div>
      
      <div className="message-content-wrapper flex-col model" style={{ width: '100%' }}>
        <div className="message-content plaintext" style={{ width: '100%' }}>
          {segments.length === 0 ? (
            <div className="markdown-body">
              <ReactMarkdown components={mdComponents}>{message.content}</ReactMarkdown>
            </div>
          ) : (
            segments.map((seg, idx) => {
              if (seg.type === 'text') {
                return (
                  <div key={idx} className="markdown-body" style={{ width: '100%', marginBottom: idx < segments.length - 1 ? '16px' : 0 }}>
                    <ReactMarkdown components={mdComponents}>{seg.content}</ReactMarkdown>
                  </div>
                );
              } else if (seg.type === 'map') {
                return <GoogleMapWidget key={idx} query={seg.query} />;
              } else if (seg.type === 'weather') {
                return <WeatherWidget key={idx} city={seg.city} lat={seg.lat} lon={seg.lon} />;
              }
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
