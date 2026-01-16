
import React from 'react';
import { Message, Role } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start animate-fade-in'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[90%] sm:max-w-[80%]`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isUser ? 'bg-orange-100 text-orange-600 ml-2' : 'bg-gray-100 text-gray-600 mr-2'
        }`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-om"></i>}
        </div>
        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${
          isUser 
            ? 'bg-orange-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
        }`}>
          <div className="whitespace-pre-wrap">
            {message.text || (
                <div className="flex space-x-1 py-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
          </div>

          {message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingChunks.map((chunk, idx) => {
                  if (chunk.web) {
                    return (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-gray-50 hover:bg-orange-50 text-orange-600 px-2 py-1 rounded border border-gray-100 transition-colors"
                      >
                        {chunk.web.title || 'Source'} <i className="fa-solid fa-arrow-up-right-from-square ml-1"></i>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <div className={`text-[10px] mt-1 opacity-50 text-right`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
