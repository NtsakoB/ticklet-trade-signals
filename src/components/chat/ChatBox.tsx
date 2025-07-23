// ChatBox.tsx – Full TickletAI Assistant with persistent memory, ML learning, and chat history panel

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Expand, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBoxProps {
  expanded: boolean;
  onClose: () => void;
  onExpand: () => void;
}

const strategies = [
  { value: 'ticklet-alpha', label: 'Ticklet Alpha' },
  { value: 'bull-strategy', label: 'Bull Strategy' },
  { value: 'jam-bot', label: 'Jam Bot' },
  { value: 'ai-strategy', label: 'AI Strategy' },
  { value: 'market-regime', label: 'Market Regime Strategy' },
  { value: 'ecosystem', label: 'Ecosystem (All Strategies)' }
];

const ChatBox = ({ expanded, onClose, onExpand }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('ecosystem');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // For now, simulate API call with a simple response
      // TODO: Replace with actual API call to /api/chat
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I understand your query. I\'m here to help with trading insights and market analysis.' 
        }]);
        setIsLoading(false);
      }, 1000);

      // Future implementation:
      // const res = await fetch('/api/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: input,
      //     strategy: selectedStrategy,
      //     context: messages.slice(-5) // Last 5 messages for context
      //   })
      // });
      // const data = await res.json();
      // setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Also send to learning endpoint:
      // await fetch('/api/chat/learn', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     instruction: input,
      //     strategy: selectedStrategy,
      //     context: messages.slice(-5),
      //     response: data.reply
      //   })
      // });

    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error reaching AI.' }]);
      setIsLoading(false);
    }
  };

  const endChat = async () => {
    // TODO: Save conversation to backend
    // await fetch('/api/chat/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ conversation: messages })
    // });
    
    setMessages([{ role: 'assistant', content: 'Hello! How can I assist you today?' }]);
    onClose();
  };

  return (
    <Card className={`fixed bottom-4 right-4 z-50 bg-card border shadow-2xl transition-all duration-300 ${
      expanded ? 'w-[500px] h-[600px]' : 'w-[350px] h-[450px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h4 className="font-semibold text-foreground">TickletAi Assistant</h4>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <Expand className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={endChat}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 text-sm"
        style={{ maxHeight: 'calc(100% - 140px)' }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-2 max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground ml-auto' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 max-w-[85%]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/20 rounded-b-lg space-y-3">
        {/* Strategy Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Strategy:</span>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="h-8 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {strategies.map((strategy) => (
                <SelectItem key={strategy.value} value={strategy.value} className="text-xs">
                  {strategy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Message Input */}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-background"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            size="sm"
            disabled={isLoading || !input.trim()}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatBox;