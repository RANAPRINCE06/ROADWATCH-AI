import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BrainCircuit, Activity, DollarSign, ShieldAlert, BarChart3, ChevronRight, HelpCircle } from 'lucide-react';
import { getReports, getSensors, getComplaints, Report } from '../utils/storage';
import { realGeminiActive, geminiApiKey } from '../utils/firebase';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  charts?: 'budget' | 'risk' | 'repairs' | 'failures';
}

export function AICommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Welcome to the RoadWatch AI Command Center. I have synthesized data from 5 IoT nodes, the citizen complaints ledger, and live satellite scans. Ask me to prioritize dispatches, estimate repair budgets, or forecast road failures.',
      timestamp: 'Just now'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [reports] = useState<Report[]>(() => getReports());
  const [sensors] = useState(() => getSensors());
  const [complaints] = useState(() => getComplaints());

  const activeReports = reports.filter(r => !r.resolved);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const runLocalFallback = (text: string): string => {
    const low = text.toLowerCase();
    const active = reports.filter(r => !r.resolved);
    const criticals = active.filter(r => r.severity === 'Critical');
    
    if (low.includes('budget') || low.includes('cost') || low.includes('estimate')) {
      const totalCost = active.length * 1200 + 4000;
      return `[Local AI Engine] Based on current active hazards (${active.length} unresolved reports) and contractor cost rates, the estimated total repair budget is $${totalCost.toLocaleString()} SGD. Detailed cost breakdown is shown below.`;
    } else if (low.includes('risk') || low.includes('accident') || low.includes('safety')) {
      if (criticals.length > 0) {
        const locations = criticals.map(c => c.location).join(', ');
        return `[Local AI Engine] High-risk zones identified at: ${locations}. Critical hazards are accelerating vehicle collision probabilities in these sectors. Rerouting traffic is advised.`;
      }
      return `[Local AI Engine] Sector 4, Orchard Road (decay index 8.4) and Bayfront Ave North (15cm flooding) present the highest collision probabilities due to speed limits and severe hazard conditions.`;
    } else if (low.includes('failure') || low.includes('predict') || low.includes('decay')) {
      return `[Local AI Engine] Predictive analysis flags Orchard Road segment A12 (84% probability of failure within 21 days) and Napier Road bus lane (72% probability within 30 days) for immediate preventive sealing.`;
    } else if (low.includes('dispatch') || low.includes('team') || low.includes('urgent') || low.includes('repair')) {
      const pendingAssign = active.filter(r => r.status === 'Detected' || r.status === 'Verified');
      if (pendingAssign.length > 0) {
        const titles = pendingAssign.map(p => `"${p.title}" at ${p.location}`).join(', ');
        return `[Local AI Engine] Immediate repair dispatches needed for: ${titles}. Crews should be deployed with corresponding work orders.`;
      }
      return `[Local AI Engine] All critical dispatches scheduled. Team Gamma is currently active on site.`;
    } else if (low.includes('report') || low.includes('generate') || low.includes('weekly')) {
      return `[Local AI Engine] Weekly City Infrastructure Briefing generated. Total reported hazards: ${reports.length}, Resolved: ${reports.filter(r => r.resolved).length}, Active IoT sensors: ${sensors.filter(s => s.status === 'Online').length}/5.`;
    } else {
      return `[Local AI Engine] I am ready to run diagnostics on Singapore municipal grids. I can estimate repair budgets, map out high-risk accident zones, list team work schedules, or run forecast models for pavement failures.`;
    }
  };

  const queryGemini = async (text: string): Promise<{ text: string; charts?: Message['charts'] }> => {
    const low = text.toLowerCase();
    let charts: Message['charts'] = undefined;
    if (low.includes('budget') || low.includes('cost') || low.includes('estimate')) {
      charts = 'budget';
    } else if (low.includes('risk') || low.includes('accident') || low.includes('safety')) {
      charts = 'risk';
    } else if (low.includes('failure') || low.includes('predict') || low.includes('decay')) {
      charts = 'failures';
    } else if (low.includes('dispatch') || low.includes('team') || low.includes('urgent') || low.includes('repair')) {
      charts = 'repairs';
    }

    if (!realGeminiActive) {
      return { text: runLocalFallback(text), charts };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      const context = {
        hazards: reports.filter(r => !r.resolved).map(r => ({
          id: r.id,
          title: r.title,
          location: r.location,
          severity: r.severity,
          status: r.status,
          priorityScore: r.priorityScore
        })),
        sensors: sensors.map(s => ({
          id: s.id,
          name: s.name,
          location: s.locationName,
          status: s.status,
          vibration: s.vibration,
          temperature: s.temperature,
          roadHealthScore: s.roadHealthScore
        })),
        complaints: complaints.map(c => ({
          id: c.id,
          title: c.title,
          location: c.locationName,
          status: c.status,
          votes: c.votes
        }))
      };

      const systemPrompt = `You are the RoadWatch AI Operations Copilot, an autonomous smart city coordinator.
Below is the current real-time state of the municipal grids in Singapore (hazards, IoT edge sensors, and citizen complaints).
Use this data to answer the user's questions accurately and dynamically. Do not make up mock data.

Current State Context:
${JSON.stringify(context)}

Provide clear, concise, and professional answers. If the user asks for budget, cost estimation, risk areas, or dispatches, give answers matching these data values.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${text}`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botText) {
        return { text: botText, charts };
      }
      throw new Error('Invalid response structure from Gemini API');
    } catch (e) {
      console.warn('Gemini API call failed. Falling back to local rules engine:', e);
      return { text: runLocalFallback(text), charts };
    }
  };

  const handleSend = async (text: string) => {
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

    const result = await queryGemini(text);

    setIsTyping(false);
    const botMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      sender: 'bot',
      text: result.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      charts: result.charts
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  const getSuggestedQuestion = (index: number) => {
    switch (index) {
      case 1: return 'Which roads need urgent maintenance?';
      case 2: return 'Show highest accident risk zones.';
      case 3: return 'Predict next month\'s road failures.';
      case 4: return 'Estimate repair budget.';
      default: return 'Generate weekly report.';
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 h-[calc(100vh-64px)] flex flex-col relative overflow-hidden text-primary animate-fade-in-up">
      {/* Top row header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">AI Command Center</h2>
        <p className="text-text-secondary mt-1">Autonomous smart city infrastructure coordinator powered by RoadWatch Neural Mesh.</p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow min-h-0 overflow-hidden">
        
        {/* Left Side: ChatGPT Chat Interface */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-border-subtle shadow-sm flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border-subtle bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Operations Copilot</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>

          {/* Messages list */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/20"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-safety-yellow/10 text-primary border-safety-yellow/30'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-2">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white border-primary rounded-tr-none' 
                      : 'bg-white text-primary border-border-subtle rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Optional chart renders inline in the chat */}
                  {msg.charts === 'budget' && (
                    <div className="bg-white border border-border-subtle p-4 rounded-xl shadow-md w-[280px] sm:w-[350px]">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Budget Allocation</span>
                      <div className="space-y-2 text-[10px] font-bold">
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Drainage & Floods</span>
                          <span>$8,500 (58%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: '58%' }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Asphalt Resurfacing</span>
                          <span>$3,600 (25%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-safety-yellow h-full" style={{ width: '25%' }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Emergency Obstacles</span>
                          <span>$2,400 (17%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: '17%' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.charts === 'risk' && (
                    <div className="bg-white border border-border-subtle p-4 rounded-xl shadow-md w-[280px] sm:w-[350px] space-y-2">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">High Accident Risk Index</span>
                      <div className="space-y-2">
                        <div className="p-2 bg-red-50 border border-red-100 rounded-lg flex justify-between text-[10px] font-bold text-red-700">
                          <span>📍 Sector 4, Orchard Rd</span>
                          <span>92% Collision Risk</span>
                        </div>
                        <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg flex justify-between text-[10px] font-bold text-orange-700">
                          <span>📍 Bayfront Ave North</span>
                          <span>76% Collision Risk</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.charts === 'failures' && (
                    <div className="bg-white border border-border-subtle p-4 rounded-xl shadow-md w-[280px] sm:w-[350px] space-y-2 text-[10px]">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Decay Predictions</span>
                      <table className="w-full text-left font-semibold">
                        <thead>
                          <tr className="border-b border-border-subtle pb-1 text-text-secondary text-[8px]">
                            <th>SEGMENT</th>
                            <th>PROBABILITY</th>
                            <th>EST. DAYS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border-subtle/40">
                            <td className="py-1">A12 Orchard</td>
                            <td className="py-1 text-red-600 font-extrabold">84%</td>
                            <td className="py-1">21 Days</td>
                          </tr>
                          <tr className="border-b border-border-subtle/40">
                            <td className="py-1">E15 Napier</td>
                            <td className="py-1 text-orange-500 font-bold">72%</td>
                            <td className="py-1">30 Days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <span className={`text-[9px] block text-text-secondary ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-safety-yellow/10 border border-safety-yellow/20 flex items-center justify-center flex-shrink-0">
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

          {/* Quick Suggestions grid */}
          <div className="p-4 border-t border-border-subtle flex-shrink-0 bg-slate-50 flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(idx => {
              const query = getSuggestedQuestion(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(query)}
                  className="bg-white hover:bg-slate-100 border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-primary px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> {query}
                </button>
              );
            })}
          </div>

          {/* Prompt Entry Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="p-4 border-t border-border-subtle bg-white flex gap-2 items-center flex-shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask AI command center (e.g. Estimate repair budget)..."
              className="flex-1 px-4 py-3 bg-surface-container-low border border-border-subtle rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary transition-all text-primary font-semibold"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-3 bg-primary text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* Right Side: Command Metrics Overview */}
        <section className="lg:col-span-5 flex flex-col gap-6 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {/* Quick Budget overview */}
          <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Budget Utilization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-border-subtle/50 pr-4">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Allocated Budget</span>
                <div className="text-2xl font-black text-primary mt-1">$100,000</div>
              </div>
              <div className="pl-2">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Spent to Date</span>
                <div className="text-2xl font-black text-green-600 mt-1">$42,500</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
              <div className="bg-green-500 h-full" style={{ width: '42.5%' }}></div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-text-secondary font-bold mt-2">
              <span>42.5% Utilized</span>
              <span>$57,500 Remaining</span>
            </div>
          </div>

          {/* District Intelligence panel */}
          <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex-grow">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">City Intelligence Feed</h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
                <span className="text-xs font-bold text-primary">Unresolved Hazards</span>
                <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                  {activeReports.length} Active
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
                <span className="text-xs font-bold text-primary">Edge Sensors Connected</span>
                <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                  {sensors.filter(s => s.status === 'Online').length} / 5 Online
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
                <span className="text-xs font-bold text-primary">Citizen Complaints Verified</span>
                <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                  {complaints.filter(c => c.status === 'Verified').length} Verified
                </span>
              </div>

              {/* District Overview List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Sector Safety Index</span>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Orchard Sector</span>
                  <span className="font-bold text-amber-600">85 (Warning)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Marina Bay</span>
                  <span className="font-bold text-green-600">92 (Optimal)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Downtown Core</span>
                  <span className="font-bold text-green-600">90 (Optimal)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Geylang East</span>
                  <span className="font-bold text-amber-600">76 (Warning)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
