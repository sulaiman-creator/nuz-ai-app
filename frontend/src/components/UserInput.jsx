import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, MicOff, Paperclip, X, FileText } from 'lucide-react';
import './UserInput.css';

const UserInput = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState(() => {
    const draft = localStorage.getItem('nuz_chat_draft');
    if (draft) {
      localStorage.removeItem('nuz_chat_draft');
      return draft;
    }
    return '';
  });
  const [attachment, setAttachment] = useState(null); // { type: 'image'|'document', name: 'filename', base64: '...', content: '...' }
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try using Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((text.trim() || attachment) && !isLoading) {
      onSendMessage(text.trim(), attachment);
      setText('');
      setAttachment(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();

    if (file.type.startsWith('image/')) {
      fileReader.onload = () => {
        setAttachment({
          type: 'image',
          name: file.name,
          base64: fileReader.result
        });
      };
      fileReader.readAsDataURL(file);
    } else {
      fileReader.onload = () => {
        setAttachment({
          type: 'document',
          name: file.name,
          content: fileReader.result
        });
      };
      fileReader.readAsText(file);
    }
    // reset input
    e.target.value = '';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  return (
    <div className="input-outer-wrapper flex-col gap-2" style={{ display: 'flex', width: '100%' }}>
      {attachment && (
        <div className="attachment-preview-container fade-in" style={{ display: 'flex', alignSelf: 'flex-start', margin: '0 0 8px 12px' }}>
          <div className="attachment-preview-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            {attachment.type === 'image' ? (
              <img src={attachment.base64} alt="Upload preview" className="image-preview-thumbnail" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
            ) : (
              <div className="document-preview-icon flex items-center gap-2" style={{ display: 'flex', alignItems: 'center' }}>
                <FileText size={16} style={{ color: 'var(--primary-hybrid)' }} />
                <span className="doc-name" style={{ fontSize: '12px', color: 'var(--text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
              </div>
            )}
            <button onClick={() => setAttachment(null)} className="remove-attachment-btn" title="Remove file" style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#ffffff', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', padding: 0 }}>
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      <div className={`input-box ${isLoading ? 'thinking' : ''}`}>
        <button 
          className="icon-action-btn" 
          onClick={triggerFileInput} 
          title="Upload image or document"
          disabled={isLoading}
        >
          <Paperclip size={20} />
        </button>
        
        <button 
          className={`icon-action-btn speech-btn ${isListening ? 'listening' : ''}`} 
          onClick={toggleListening} 
          title={isListening ? "Listening..." : "Use voice input"}
          disabled={isLoading}
        >
          {isListening ? <MicOff size={20} style={{ color: '#ef4444' }} /> : <Mic size={20} />}
        </button>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... Speak now." : "Ask Nuz..."}
          rows={1}
          disabled={isLoading}
        />

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,.txt,.csv,.json"
          onChange={handleFileChange}
        />
        
        {(text.trim() || attachment) ? (
          <button 
            className="send-action-btn active" 
            onClick={handleSend}
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        ) : (
          <div className="send-action-placeholder"></div>
        )}
      </div>
    </div>
  );
};

export default UserInput;
