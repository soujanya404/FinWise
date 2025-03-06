// Bot.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function Bot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/', {
        message: input,
        level: expertiseLevel
      });

      // Process the response to remove unwanted asterisks and format text properly
      const processedResponse = processResponseText(response.data.response);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: processedResponse, sender: 'bot', level: expertiseLevel }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Sorry, there was an error processing your request.', sender: 'bot', error: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.post('http://localhost:5000/clear-history');
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  // Process response text to clean up markdown formatting before displaying
  const processResponseText = (text) => {
    if (!text) return '';
    
    // Replace ** with <strong> tags for HTML rendering
    let processedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Remove any remaining single asterisks that are used as bullet points
    processedText = processedText.replace(/^\s*\*\s+/gm, '• ');
    processedText = processedText.replace(/\s\*\s+/g, ' • ');
    
    return processedText;
  };

  // Format message text with proper HTML and line breaks
  const formatMessage = (text) => {
    if (!text) return '';
    
    // For bot messages that have HTML content
    if (text.includes('<strong>')) {
      return (
        <div dangerouslySetInnerHTML={{ 
          __html: text.split('\n').join('<br />') 
        }} />
      );
    }
    
    // For regular text messages (user messages)
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">FinWise Advisor</h1>
          <div className="flex items-center space-x-4">
            <label className="text-sm">Expertise Level:</label>
            <select
              value={expertiseLevel}
              onChange={(e) => setExpertiseLevel(e.target.value)}
              className="bg-blue-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              onClick={clearChat}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center mt-20 text-gray-500">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to FinWise!</h2>
              <p className="mb-6">Ask me anything about personal finance, investments, or financial planning.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <SuggestionButton
                  text="What's the best way to start investing with $1000?"
                  onClick={() => {
                    setInput("What's the best way to start investing with $1000?");
                  }}
                />
                <SuggestionButton
                  text="How do I create a budget?"
                  onClick={() => {
                    setInput("How do I create a budget?");
                  }}
                />
                <SuggestionButton
                  text="Explain ETFs vs mutual funds"
                  onClick={() => {
                    setInput("Explain ETFs vs mutual funds");
                  }}
                />
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-3xl rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  {message.sender === 'bot' && !message.error && (
                    <div className="text-xs text-gray-500 mb-1">
                      Level: {message.level}
                    </div>
                  )}
                  <div className={`${message.sender === 'bot' ? 'text-sm md:text-base' : ''}`}>
                    {formatMessage(message.text)}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block rounded-lg px-4 py-2 bg-white text-gray-400 shadow">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t border-gray-300 p-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask a financial question..."
            />
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 text-white px-6 py-2 rounded-r-lg ${
                loading ? 'opacity-70' : 'hover:bg-blue-700'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Suggestion button component
function SuggestionButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow text-sm text-left transition-all hover:shadow-md"
    >
      {text}
    </button>
  );
}

export default Bot;