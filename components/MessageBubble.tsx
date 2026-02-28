import React from 'react';
import { Message } from '../types';
import { GeminiLogo } from './GeminiLogo';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('```')) {
        return null;
      }
      if (lines[index - 1]?.startsWith('```')) {
        return (
          <pre key={index} className="bg-gray-800 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto">
            <code>{line}</code>
          </pre>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index} className="font-semibold block my-1">{line.slice(2, -2)}</strong>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 my-0.5">{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={index} className="ml-4 my-0.5 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="my-1">{line}</p>;
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary-600' : 'bg-gradient-to-br from-gemini-blue via-gemini-red to-gemini-yellow'
        }`}>
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <GeminiLogo className="w-5 h-5 text-white" />
          )}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`message-bubble px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-primary-600 text-white rounded-br-md' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
          }`}>
            {message.isStreaming && message.content === '' ? (
              <div className="flex items-center space-x-1 h-6">
                <div className="w-2 h-2 bg-current rounded-full typing-dot" />
                <div className="w-2 h-2 bg-current rounded-full typing-dot" />
                <div className="w-2 h-2 bg-current rounded-full typing-dot" />
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                {renderContent(message.content)}
              </div>
            )}
          </div>
          <span className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};
