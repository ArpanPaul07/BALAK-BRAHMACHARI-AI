
import React from 'react';
import { Message, Role } from '../types';

interface ChatBubbleProps {
  message: Message;
  language: string;
  isDarkMode: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isDarkMode }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-5 ${isUser ? 'justify-end' : 'justify-start animate-fade-in'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[92%] sm:max-w-[80%]`}>
        <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
          isUser 
            ? 'bg-orange-700 text-white ml-2' 
            : (isDarkMode ? 'bg-slate-800 text-slate-400 mr-2' : 'bg-white border border-gray-200 text-gray-400 mr-2')
        }`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-om"></i>}
        </div>
        
        <div className={`relative px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed transition-all ${
          isUser 
            ? 'bg-orange-600 text-white rounded-tr-none' 
            : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none')
        }`}>
          {message.imageUrl && (
            <img src={message.imageUrl} className="w-full h-auto rounded-xl mb-3 shadow-md" alt="attachment" />
          )}
          
          <div className="whitespace-pre-wrap">
            {message.text || (
              <div className="flex space-x-1.5 py-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between opacity-50 text-[10px] font-bold uppercase tracking-wider">
            <span className="whitespace-nowrap">{isUser ? 'Santan' : 'THAKUR BALAK BRAHMACHARI'}</span>
            <span className="ml-4 flex-shrink-0">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
