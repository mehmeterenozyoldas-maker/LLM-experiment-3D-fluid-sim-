import React, { useState, useRef, useEffect } from 'react';
import { generateFluidExplanation, aiOptimizeSimulation } from '../services/geminiService';
import { ChatMessage, FluidConfig, FluidMetrics } from '../types';
import { Bot, Sparkles, X, Send, SlidersHorizontal, Check } from 'lucide-react';

interface ChatInterfaceProps {
  config: FluidConfig;
  setConfig: React.Dispatch<React.SetStateAction<FluidConfig>>;
  metrics: FluidMetrics;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ config, setConfig, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Greetings, Researcher! I am your AI Astrophysics & Hydrodynamics Co-pilot. Ask me about the Navier-Stokes momentum equations, vorticity confinement, or tell me to "simulate a supernova blast with high turbulence" to auto-tune the 3D solver.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: promptText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    // Check if the user is asking to change/simulate something in natural language
    const lowerPrompt = promptText.toLowerCase();
    const isActionRequest = lowerPrompt.includes('simulate') || lowerPrompt.includes('make') || lowerPrompt.includes('change') || lowerPrompt.includes('set') || lowerPrompt.includes('create') || lowerPrompt.includes('turn');

    if (isActionRequest) {
      const result = await aiOptimizeSimulation(promptText, config);
      if (result.configChanges) {
        setConfig(prev => ({ ...prev, ...result.configChanges }));
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: result.text,
          timestamp: Date.now(),
          suggestedAction: result.configChanges
        }
      ]);
    } else {
      const responseText = await generateFluidExplanation(promptText, config, metrics);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    }

    setIsLoading(false);
  };

  const quickPrompts = [
    "Simulate a high-turbulence supernova explosion",
    "Explain vorticity confinement math",
    "How does viscosity impact Reynolds number?",
    "Simulate a black hole accretion disk"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 z-20 px-4 py-3 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center gap-2.5 text-white hover:scale-105 transition-all duration-200 border border-white/20 group"
      >
        <Bot className="w-5 h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-semibold tracking-wide">AI Physics Co-pilot</span>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 z-20 w-80 sm:w-96 h-[520px] bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white">Gemini Hydrodynamics AI</h3>
            <span className="text-[9px] text-slate-400 font-mono">Gemini 3 Flash • Real-Time CFD Engine</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-bl-none shadow-sm space-y-2'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.suggestedAction && (
                <div className="p-2 bg-black/40 rounded-lg border border-cyan-500/30 text-[10px] flex items-center justify-between text-cyan-300">
                  <span className="flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3 text-emerald-400" /> Auto-tuned simulation parameters
                  </span>
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 p-3 rounded-2xl rounded-bl-none border border-white/10 flex gap-1.5 items-center text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[10px] font-mono text-slate-400">Solving Navier-Stokes equations...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-1.5 bg-slate-900/40 border-t border-white/5 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="text-[9px] bg-slate-800/80 hover:bg-cyan-950 text-cyan-300 hover:text-white px-2 py-1 rounded-full border border-cyan-500/20 hover:border-cyan-400/40 transition-all flex-shrink-0"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-slate-950">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask physics query or type 'simulate supernova'..."
            className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50 text-white placeholder:text-slate-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
