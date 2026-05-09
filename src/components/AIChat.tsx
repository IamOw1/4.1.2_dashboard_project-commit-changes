import { useState } from 'react';
import { Send, Bot } from 'lucide-react';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function AIChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; offline?: boolean }[]>(
    [{ role: 'assistant', content: 'Здравствуйте! Я ИИ-помощник COBA. Задайте вопрос — ответ придёт с бэка (DeepSeek при наличии ключа).', offline: false }]
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const q = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setSending(true);
    try {
      const r = await api.subAgentAsk(q);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: r.answer,
          offline: r.offline === true,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Ошибка запроса',
          offline: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">ИИ-Помощник</h3>
              <HelpTooltip text={HELP.chatSend} />
            </div>
            <p className="text-xs text-gray-400">Ответы через /api/v1/sub_agent/ask</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-200'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.role === 'assistant' && msg.offline && (
                <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
                  Офлайн / демо
                  <HelpTooltip text={HELP.chatOffline} />
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-cyan-500/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            placeholder="Задайте вопрос..."
            className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
