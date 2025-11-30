import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { generateFitnessAdvice } from '../services/geminiService';
import { Send, Bot, User as UserIcon } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const ChatInterface: React.FC<{ user: User }> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: `Hello ${user.name}! I'm your AI Fitness Assistant. Ask me anything about your workout, diet, or form.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const userContext = `
      Name: ${user.name}, 
      Weight: ${user.currentWeight}kg, 
      Goal: General Fitness, 
      Current Diet Plan: ${user.dietPlan.substring(0, 100)}..., 
      Current Workout: ${user.workoutPlan.substring(0, 100)}...
    `;

    const responseText = await generateFitnessAdvice(userMsg.text, userContext);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: responseText }]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[600px]">
       <div className="p-4 border-b border-slate-800 flex items-center bg-slate-950/50 rounded-t-2xl">
          <div className="h-8 w-8 bg-cyan-600 rounded-full flex items-center justify-center mr-3">
             <Bot className="text-white h-5 w-5" />
          </div>
          <div>
            <h3 className="text-white font-bold">Dream Body AI</h3>
            <div className="text-xs text-green-500 flex items-center">
              <span className="block h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
            </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.sender === 'user' 
                  ? 'bg-cyan-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
               }`}>
                  {msg.text}
               </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-slate-800 rounded-2xl p-4 rounded-bl-none flex space-x-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
       </div>

       <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl">
          <div className="flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask about exercises, macros, or motivation..."
               className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isTyping}
               className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
             >
               <Send className="h-5 w-5" />
             </button>
          </div>
       </div>
    </div>
  );
};

export default ChatInterface;
