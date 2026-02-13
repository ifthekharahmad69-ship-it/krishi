import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sprout, Sparkles, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import OfflineChatBot from '@/components/chat/OfflineChatBot';

export default function AIAssistant() {
  const [mode, setMode] = useState('online');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🌾 **Namaste! I'm KrishiSahay, your AI farming assistant.**

I'm here to help you with:
- **Crop Selection** - Best crops for your soil and season
- **Pest & Disease Management** - Identify and treat crop issues
- **Fertilizer Recommendations** - Optimal nutrition for your crops
- **Irrigation Advice** - Water management strategies
- **Market Insights** - Best time to sell your produce

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content) => {
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const systemPrompt = `You are KrishiSahay, an expert AI farming assistant for Indian farmers. You provide practical, actionable advice on:
- Crop selection based on soil, climate, and season
- Pest and disease identification and treatment
- Fertilizer and nutrient management
- Irrigation and water management
- Market prices and selling strategies
- Government schemes and subsidies for farmers
- Organic and sustainable farming practices

Guidelines:
- Give specific, practical advice tailored to Indian agriculture
- Use simple language that farmers can understand
- Include costs in Indian Rupees (₹) when relevant
- Mention local crop varieties and practices
- Be encouraging and supportive
- Format responses with bullet points and headers for clarity
- If asked about a specific region, consider local conditions`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nFarmer's question: ${content}`,
      add_context_from_internet: true,
    });

    const assistantMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: `🌾 **Namaste! I'm KrishiSahay, your AI farming assistant.**

I'm here to help you with:
- **Crop Selection** - Best crops for your soil and season
- **Pest & Disease Management** - Identify and treat crop issues
- **Fertilizer Recommendations** - Optimal nutrition for your crops
- **Irrigation Advice** - Water management strategies
- **Market Insights** - Best time to sell your produce

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <div 
      className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/30"
      style={{ overscrollBehaviorY: 'none' }}
    >
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
            </div>
          </div>
        </div>
        
        {mode === 'online' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 select-none"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <Tabs value={mode} onValueChange={setMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-white select-none">
              <Wifi className="w-4 h-4 mr-2" />
              Online AI
            </TabsTrigger>
            <TabsTrigger value="offline" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-white select-none">
              <WifiOff className="w-4 h-4 mr-2" />
              Offline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === 'offline' ? (
        <div className="flex-1 overflow-hidden">
          <OfflineChatBot />
        </div>
      ) : (
        <>
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ 
          overscrollBehaviorY: 'none',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)'
        }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-md px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
        </>
      )}
    </div>
  );
}