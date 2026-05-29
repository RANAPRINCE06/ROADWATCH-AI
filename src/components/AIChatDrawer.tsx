import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, X, Sparkles, AlertTriangle, HelpCircle, Navigation } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export function AIChatDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello, Chief Safety Officer Marcus Thorne. I am the RoadWatch AI assistant. I have cataloged 12 active hazards and optimized 3 emergency dispatch routes today. How can I help you manage municipal transit safety?',
      timestamp: 'Just now',
      suggestions: [
        'Analyze Orchard Road Pothole',
        'Show safest route from Marina to Orchard',
        'Check flooding alerts',
        'Generate transit report'
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate AI thinking and context-sensitive response
    setTimeout(() => {
      setIsTyping(false);
      const lowText = text.toLowerCase();
      let botReply = '';
      let suggestions: string[] = [];

      if (lowText.includes('pothole') || lowText.includes('orchard')) {
        botReply = 'AI Vision systems have detected a critical asphalt pothole at Sector 4, Orchard Road (lat: 1.3048, lng: 103.8318). Severity score: 8.4/10. Depth: 10cm. Local maintenance crews (Team Gamma) have been dispatched with an ETA of 38 minutes. Route diversions are active.';
        suggestions = ['Plot detour around Orchard Road', 'Dispatch status update', 'Notify transit authority'];
      } else if (lowText.includes('route') || lowText.includes('marina') || lowText.includes('navigation') || lowText.includes('safest')) {
        botReply = 'Routing engine has plotted an optimized detour path between Marina Boulevard and Orchard Road. The safety router successfully bypasses the Orchard Road waterlogging zones and the active pothole hazard, saving 4 minutes of dispatch transit time.';
        suggestions = ['Apply route to live navigation', 'Compare alternate routes', 'Send to emergency responders'];
      } else if (lowText.includes('flood') || lowText.includes('water') || lowText.includes('ponding')) {
        botReply = 'Bayfront Avenue North is experiencing moderate road ponding (15cm water accumulation) on the left lane. Team Delta is en route with water pumping equipment. Estimated clearance time is 2 hours. Speed limit reduced to 20 km/h.';
        suggestions = ['Show current rainfall density', 'Alert status: Bayfront', 'Reroute traffic'];
      } else if (lowText.includes('report') || lowText.includes('generate')) {
        botReply = 'I have generated the Daily Infrastructure Integrity Briefing for May 29, 2026. The document highlights a 12% increase in pothole detections due to seasonal rain, and lists 4 completed street repairs in Sector 7G.';
        suggestions = ['Download briefing (PDF)', 'Open AI Report Details', 'Email report to director'];
      } else {
        botReply = 'Understood. I am monitoring the live GIS feeds for road anomalies, structural safety violations, and flood hazards. Please let me know if you would like me to plot a safe dispatch route, analyze an active alert, or check crew deployments.';
        suggestions = ['Check active alerts', 'Show safety score breakdown', 'Request manual inspection'];
      }

      const botMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 12000 / 8); // ~1.5s delay
  };

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-outline-variant z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-deep-slate text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-safety-yellow flex items-center justify-center text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">RoadWatch Assistant</h3>
            <span className="text-[10px] text-safety-yellow font-bold uppercase tracking-wider">AI Operations Online</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Log */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.sender === 'user' ? 'bg-primary text-white' : 'bg-safety-yellow/10 text-primary border border-safety-yellow/20'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className="space-y-1.5">
              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white border border-border-subtle text-primary rounded-tl-none'
              }`}>
                {msg.text}
              </div>

              <span className={`text-[9px] block text-text-secondary ${msg.sender === 'user' ? 'text-right' : ''}`}>
                {msg.timestamp}
              </span>

              {/* Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="text-[10px] bg-white hover:bg-safety-yellow/10 border border-border-subtle hover:border-safety-yellow/50 text-text-secondary hover:text-primary px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-safety-yellow/10 text-primary border border-safety-yellow/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-border-subtle text-primary p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputVal);
        }}
        className="p-4 border-t border-outline-variant bg-white flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask AI operations..."
          className="flex-1 px-3 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary transition-all text-primary"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2.5 bg-primary text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.aside>
  );
}
