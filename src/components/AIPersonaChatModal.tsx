import React, { useState } from 'react';
import { bleService } from '../ble/BLEManager';
import { CMD_CODES } from '../ble/Protocol';
import { Send, Bot, Sparkles, Volume2 } from 'lucide-react';

interface Props {
  activePersona: string;
}

const PERSONA_INFO: Record<string, { name: string; title: string; avatar: string; greeting: string; color: string }> = {
  alkhwarizmi: {
    name: 'الخوارزمي',
    title: 'عالم الرياضيات ومؤسس علم الجبر والخوارزميات',
    avatar: '📜',
    greeting: 'أهلاً بك يا بني! هل تعلم أن الخوارزميات التي تبرمج بها سميت تيمناً باسمي؟ اسألني عن أي مفهوم في الرياضيات أو البرمجة!',
    color: 'from-amber-500 to-yellow-600',
  },
  astronaut: {
    name: 'رائد الفضاء',
    title: 'مستكشف الكواكب ومحطة الفضاء الدولية',
    avatar: '🚀',
    greeting: 'مرحباً من مدار الأرض! الروبوتات تساعدنا كثيراً في الفضاء لاستكشاف المريخ والقمر. ماذا تريد أن نستكشف اليوم؟',
    color: 'from-cyan-500 to-blue-600',
  },
  einstein: {
    name: 'ألبرت أينشتاين',
    title: 'عالم الفيزياء وصاحب النظرية النسبية',
    avatar: '💡',
    greeting: 'أهلاً يا صديقي الصغير! الخيال أهم من المعرفة، وبرمجة الروبوت هي أجمل طريقة لإطلاق خيالك العلمي!',
    color: 'from-purple-500 to-indigo-600',
  },
  friendly_bot: {
    name: 'ميني جي الذكي',
    title: 'رفيقك الآلي ومساعدك في الصف',
    avatar: '🤖',
    greeting: 'أهلاً وسهلاً يا بطل! أنا روبوت Mini G، جاهز لتنفيذ أوامرك وشرح أي درس من دروس البرمجة!',
    color: 'from-pink-500 to-rose-600',
  },
};

export const AIPersonaChatModal: React.FC<Props> = ({ activePersona }) => {
  const current = PERSONA_INFO[activePersona] || PERSONA_INFO['friendly_bot'];
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: current.greeting },
  ]);
  const [inputText, setInputText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsReplying(true);

    // Simulate AI generation response tailored for kids
    setTimeout(async () => {
      let botReply = '';
      if (userMsg.includes('برمجة') || userMsg.includes('كود')) {
        botReply = 'البرمجة هي لغة التفكير المنطقي! بالبلوكات يمكنك إعطاء أوامر دقيقة تجعلني أتحرك وأضيء كما تحب.';
      } else if (userMsg.includes('روبوت') || userMsg.includes('حركة')) {
        botReply = 'رائع! أنا مجهز بمحركات دقيقة في عجلاتي وأذرعي، جرب استخدام كتل الحركة لتشاهدني وأنا أتحرك.';
      } else {
        botReply = `سؤال ذكي جداً يا بطل! كـ ${current.name}، أشجعك دائماً على التجربة والتعلم. لنجرب برمجة تحدٍ جديد معاً!`;
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
      setIsReplying(false);

      // Trigger robot speech & lip-sync
      await bleService.sendCommand(CMD_CODES.G_SPEAK_PHRASE, botReply as any);
    }, 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[320px]">
      {/* Persona Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{current.avatar}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-white">{current.name}</h4>
              <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full bg-gradient-to-r ${current.color} text-white`}>
                شخصية تفاعلية
              </span>
            </div>
            <p className="text-[10px] text-slate-400">{current.title}</p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-purple-600 text-white self-end rounded-br-xs'
                : 'bg-slate-800 text-slate-200 self-start rounded-bl-xs border border-slate-700/60'
            }`}
          >
            {m.text}
          </div>
        ))}
        {isReplying && (
          <div className="bg-slate-800 text-slate-400 p-2 rounded-2xl text-xs self-start flex items-center gap-1.5 animate-pulse">
            <Bot className="w-3.5 h-3.5" />
            <span>يفكر بالصوت الذكي...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`تحدث مع ${current.name}...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isReplying}
          className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl disabled:opacity-50 transition shadow"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
