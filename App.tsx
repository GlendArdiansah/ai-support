import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ChatSession, GeminiModel } from './types';
import { geminiService } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { Button } from './components/Button';
import { GeminiLogo } from './components/GeminiLogo';
import { WELCOME_MESSAGE, EXAMPLE_PROMPTS, MAX_MESSAGE_LENGTH, DEFAULT_SYSTEM_INSTRUCTION } from './constants';

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GeminiModel.FLASH);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [WELCOME_MESSAGE];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createNewSession = (): string => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '',
      messages: [{ ...WELCOME_MESSAGE, id: generateId() }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const handleNewChat = () => {
    createNewSession();
    setSidebarOpen(false);
    setInputMessage('');
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, messages: newMessages, updatedAt: new Date() }
          : session
      )
    );
  };

  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId && !session.title
          ? { ...session, title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') }
          : session
      )
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageContent = inputMessage.trim();
    if (messageContent.length > MAX_MESSAGE_LENGTH) {
      alert(`Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    const currentMessages = sessions.find(s => s.id === sessionId)?.messages || [WELCOME_MESSAGE];
    const updatedMessages = [...currentMessages, userMessage];
    updateSessionMessages(sessionId, updatedMessages);
    updateSessionTitle(sessionId, messageContent);

    setInputMessage('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'model',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    const messagesWithAssistant = [...updatedMessages, assistantMessage];
    updateSessionMessages(sessionId, messagesWithAssistant);

    try {
      const contextMessages = updatedMessages.slice(-10);
      const prompt = geminiService.formatMessagesForContext(contextMessages) + `\n\nUser: ${messageContent}\n\nAssistant:`;

      const stream = geminiService.generateContentStream({
        prompt,
        model: selectedModel,
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        const finalMessages = [...updatedMessages, {
          ...assistantMessage,
          content: fullResponse,
          isStreaming: true,
        }];
        updateSessionMessages(sessionId, finalMessages);
      }

      const finalMessages = [...updatedMessages, {
        ...assistantMessage,
        content: fullResponse,
        isStreaming: false,
      }];
      updateSessionMessages(sessionId, finalMessages);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessages = [...updatedMessages, {
        ...assistantMessage,
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        isStreaming: false,
      }];
      updateSessionMessages(sessionId, errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  const clearAllChats = () => {
    if (confirm('Are you sure you want to clear all chats? This cannot be undone.')) {
      setSessions([]);
      setCurrentSessionId(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <GeminiLogo className="w-6 h-6 text-gemini-blue" />
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Gemini Chat</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline-block">
              {selectedModel === GeminiModel.FLASH ? 'Flash' : 'Pro'}
            </span>
            {sessions.length > 0 && (
              <button
                onClick={clearAllChats}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                title="Clear all chats"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 1 && messages[0].id === 'welcome' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gemini-blue via-gemini-red to-gemini-yellow flex items-center justify-center">
                  <GeminiLogo className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Gemini Chat</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start a conversation with Google's most capable AI model. Ask questions, get creative, or explore ideas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(prompt)}
                      className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <p className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                        {prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-gray-100 rounded-2xl p-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-0 resize-none px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50 max-h-32"
              />
              <div className="flex items-center gap-1 pb-1">
                <span className={`text-xs ${inputMessage.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
                  {inputMessage.length}/{MAX_MESSAGE_LENGTH}
                </span>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || inputMessage.length > MAX_MESSAGE_LENGTH}
                  size="sm"
                  className="rounded-xl"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Gemini may display inaccurate info. Consider verifying important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
