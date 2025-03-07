import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Footer from './Footer';
import IVIS from '../assets/IVIS.png'
import NIE from '../assets/NIE.png'
import PULSE from '../assets/PULSE.png'

function Bot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [favoriteResponses, setFavoriteResponses] = useState([]);
  const [showTips, setShowTips] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedFavorites = localStorage.getItem('favoriteResponses');
    const savedLevel = localStorage.getItem('expertiseLevel');
    
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedFavorites) setFavoriteResponses(JSON.parse(savedFavorites));
    if (savedLevel) setExpertiseLevel(savedLevel);
  }, []);

  
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('expertiseLevel', expertiseLevel);
    localStorage.setItem('favoriteResponses', JSON.stringify(favoriteResponses));
  }, [darkMode, fontSize, expertiseLevel, favoriteResponses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user', timestamp: new Date().toISOString() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('https://finwise-advisor.onrender.com/', {
        message: input,
        level: expertiseLevel
      });

   
      const processedResponse = processResponseText(response.data.response);
      const botMessage = { 
        text: processedResponse, 
        sender: 'bot', 
        level: expertiseLevel,
        timestamp: new Date().toISOString(),
        id: `response-${Date.now()}`
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          text: 'Sorry, there was an error processing your request.', 
          sender: 'bot', 
          error: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.post('https://finwise-advisor.onrender.com/clear-history');
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  
  const processResponseText = (text) => {
    if (!text) return '';
    
  
    let processedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    
    processedText = processedText.replace(/\\-\s+/g, '- ');
    
   
    processedText = processedText.replace(/^\s*\*\s+/gm, '• ');
    processedText = processedText.replace(/\s\*\s+/g, ' • ');
    
    return processedText;
  };

 
  const formatMessage = (text) => {
    if (!text) return '';
    
  
    if (text.includes('<strong>')) {
      return (
        <div dangerouslySetInnerHTML={{ 
          __html: text.split('\n').join('<br />') 
        }} />
      );
    }
    
   
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const addToFavorites = (responseId) => {
    const response = messages.find(msg => msg.id === responseId);
    if (response && !favoriteResponses.some(fav => fav.id === responseId)) {
      const favorite = {
        ...response,
        savedAt: new Date().toISOString()
      };
      setFavoriteResponses([...favoriteResponses, favorite]);
    }
  };

  const removeFromFavorites = (responseId) => {
    setFavoriteResponses(favoriteResponses.filter(fav => fav.id !== responseId));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
  
    alert("Copied to clipboard!");
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  
  const financialTips = [
    "The 50/30/20 rule: Spend 50% on needs, 30% on wants, and save 20%.",
    "Emergency fund: Aim to save 3-6 months of expenses.",
    "Pay yourself first: Set up automatic transfers to savings on payday.",
    "Consider index funds for long-term investing with lower fees.",
    "Review your subscriptions regularly to cut unnecessary expenses.",
    "Use tax-advantaged accounts like 401(k)s and IRAs for retirement."
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % financialTips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

 
  useEffect(() => {
    const handleKeyDown = (e) => {
     
      if (e.ctrlKey && e.key === 'Enter') {
        sendMessage();
      }
     
      if (e.key === 'Escape') {
        setInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [input]);

  
  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Header */}
      <header className={`transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-800' : 'bg-blue-600'} text-white p-4 shadow-md`}>
  <div className="container mx-auto flex justify-between items-center">
    
    {/* Left Section: Sidebar Button and Title */}
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => setShowSidebar(!showSidebar)}
        className="p-1 rounded hover:bg-blue-700 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-2xl font-bold">FinWise Advisor</h1>
    </div>

    {/* Center Section: Logos */}
    <div className="flex items-center space-x-4">
      <img src={IVIS} alt="Logo 1" className="h-10 w-10 object-contain rounded-3xl" />
      <img src={NIE} alt="Logo 2" className="h-10 w-10 object-contain rounded-3xl" />
      <img src={PULSE} alt="Logo 3" className="h-10 w-10 object-contain rounded-3xl" />
    </div>

    {/* Right Section: Controls */}
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <button
          onClick={toggleDarkMode}
          className="p-1 rounded hover:bg-blue-700 mr-2 transition-colors duration-200"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className={`transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-900' : 'bg-blue-700'} text-white rounded px-2 py-1 text-xs mr-2`}
          title="Adjust Text Size"
        >
          <option value="small">Small Text</option>
          <option value="medium">Medium Text</option>
          <option value="large">Large Text</option>
        </select>
        <select
          value={expertiseLevel}
          onChange={(e) => setExpertiseLevel(e.target.value)}
          className={`transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-900' : 'bg-blue-700'} text-white rounded px-2 py-1 text-xs`}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      
      <button
        onClick={clearChat}
        className={`transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-900 hover:bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'} px-3 py-1 rounded text-xs`}
        title="Clear conversation"
      >
        Clear Chat
      </button>
    </div>
  </div>
</header>


      {/* Main Content with optional Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className={`w-64 transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-y-auto`}>
            <div className="p-4">
              <h2 className="font-bold text-lg mb-4">Saved Responses</h2>
              {favoriteResponses.length > 0 ? (
                favoriteResponses.map((fav) => (
                  <div key={fav.id} className={`mb-4 p-3 rounded transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="text-xs mb-1">{new Date(fav.savedAt).toLocaleDateString()}</div>
                    <div className={`${getFontSizeClass()} max-h-20 overflow-hidden`}>{formatMessage(fav.text.substring(0, 100))}...</div>
                    <div className="flex justify-end mt-2 space-x-2">
                      <button 
                        onClick={() => copyToClipboard(fav.text)} 
                        className={`text-xs transition-colors duration-300 ease-in-out ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                      >
                        Copy
                      </button>
                      <button 
                        onClick={() => removeFromFavorites(fav.id)} 
                        className={`text-xs transition-colors duration-300 ease-in-out ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No saved responses yet. Click the star icon on any response to save it.</p>
              )}
              
              <h2 className="font-bold text-lg mt-6 mb-3">Financial Dictionary</h2>
              <div className={`p-3 rounded transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <select 
                  className={`w-full p-2 rounded mb-2 transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                  onChange={(e) => handleSuggestionClick(`What does ${e.target.value} mean?`)}
                  defaultValue=""
                >
                  <option value="" disabled>Select a term to learn...</option>
                  <option value="ETF">ETF</option>
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="Compound Interest">Compound Interest</option>
                  <option value="P/E Ratio">P/E Ratio</option>
                  <option value="SIP">SIP</option>
                  <option value="Bull Market">Bull Market</option>
                  <option value="Bear Market">Bear Market</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className={`flex-1 p-4 overflow-y-auto ${getFontSizeClass()}`}>
          <div className="container mx-auto max-w-4xl">
            {showTips && messages.length > 0 && (
              <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-2">💡</span>
                    <span className="font-medium">Tip:</span>
                  </div>
                  <button 
                    onClick={() => setShowTips(false)} 
                    className="text-sm hover:text-gray-500 transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm mt-1">{financialTips[currentTipIndex]}</p>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className={`text-center mt-16 transition-colors duration-300 ease-in-out ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="text-5xl mb-4">💰</div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to FinWise!</h2>
                <p className="mb-6">Ask me anything about personal finance, investments, or financial planning.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <SuggestionButton
                    text="What's the best way to start investing with ₹1000?"
                    onClick={() => handleSuggestionClick("What's the best way to start investing with ₹1000?")}
                    darkMode={darkMode}
                  />
                  <SuggestionButton
                    text="How do I create a monthly budget?"
                    onClick={() => handleSuggestionClick("How do I create a monthly budget?")}
                    darkMode={darkMode}
                  />
                  <SuggestionButton
                    text="Explain ETFs vs mutual funds"
                    onClick={() => handleSuggestionClick("Explain ETFs vs mutual funds")}
                    darkMode={darkMode}
                  />
                  <SuggestionButton
                    text="How to reduce my tax liability?"
                    onClick={() => handleSuggestionClick("How to reduce my tax liability?")}
                    darkMode={darkMode}
                  />
                  <SuggestionButton
                    text="What is the 50/30/20 budget rule?"
                    onClick={() => handleSuggestionClick("What is the 50/30/20 budget rule?")}
                    darkMode={darkMode}
                  />
                  <SuggestionButton
                    text="How to plan for retirement in my 30s?"
                    onClick={() => handleSuggestionClick("How to plan for retirement in my 30s?")}
                    darkMode={darkMode}
                  />
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-sm mb-2">Popular financial calculators:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['SIP Calculator', 'EMI Calculator', 'PPF Calculator', 'Retirement Planner'].map((calc) => (
                      <button
                        key={calc}
                        onClick={() => handleSuggestionClick(`I want to use the ${calc}`)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors duration-300 ease-in-out ${
                          darkMode ? 'bg-blue-900 hover:bg-blue-800' : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                        {calc}
                      </button>
                    ))}
                  </div>
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
                    className={`inline-block max-w-3xl rounded-lg px-4 py-2 transition-colors duration-300 ease-in-out ${
                      message.sender === 'user'
                        ? darkMode 
                          ? 'bg-blue-700 text-white' 
                          : 'bg-blue-600 text-white'
                        : message.error
                        ? darkMode
                          ? 'bg-red-900 text-red-100'
                          : 'bg-red-100 text-red-800'
                        : darkMode
                          ? 'bg-gray-800 text-gray-100 shadow'
                          : 'bg-white text-gray-800 shadow'
                    }`}
                  >
                    {message.sender === 'bot' && !message.error && (
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-gray-500">
                          Level: {message.level}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(message.text)}
                            className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-200"
                            title="Copy to clipboard"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          {message.id && (
                            <button
                              onClick={() => 
                                favoriteResponses.some(fav => fav.id === message.id)
                                  ? removeFromFavorites(message.id)
                                  : addToFavorites(message.id)
                              }
                              className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-200"
                              title={favoriteResponses.some(fav => fav.id === message.id) 
                                ? "Remove from favorites" 
                                : "Save to favorites"}
                            >
                              {favoriteResponses.some(fav => fav.id === message.id) ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      {formatMessage(message.text)}
                    </div>
                    {message.timestamp && (
                      <div className="text-xs mt-1 opacity-50 text-right">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="text-left mb-4">
                <div className={`inline-block rounded-lg px-4 py-2 transition-colors duration-300 ease-in-out ${
                  darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-400'
                } shadow`}>
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
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className={`border-t transition-colors duration-300 ease-in-out ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} p-4`}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col space-y-2">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                ref={inputRef}
                className={`flex-1 border transition-colors duration-300 ease-in-out ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                } rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2`}
                placeholder="Ask a financial question..."
              />
              <button
                type="submit"
                disabled={loading}
                className={`transition-colors duration-300 ease-in-out ${
                  darkMode
                    ? 'bg-blue-700 hover:bg-blue-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-r-lg ${
                  loading ? 'opacity-70' : ''
                }`}
              >
                <span className="hidden sm:inline">Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <div>Ctrl+Enter to send</div>
              <div>Esc to clear</div>
            </div>
          </div>
        </div>
      </form>
      <Footer darkMode={darkMode} />
    </div>
  );
}

// Suggestion button component
function SuggestionButton({ text, onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`transition-colors duration-300 ease-in-out ${
        darkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' 
          : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
      } font-semibold py-2 px-4 border rounded shadow text-sm text-left transition-all hover:shadow-md`}
    >
      {text}
    </button>
  );
}

export default Bot;