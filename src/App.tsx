import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, MessageSquare, Send, Package, X, Trash2, Zap, ArrowLeft, Info, Globe } from 'lucide-react';

const DEMO_MODE = false;
const API_BASE_URL =  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  description: string;
  image: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  image?: string;
  images?: string[];
  products?: Product[];
}

interface UserRegistration {
  name: string;
  mobile: string;
  registered: boolean;
}

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, title: "Urban Explorer Backpack 2025", price: 119.95, category: "men's clothing", stock: 50, active: true, description: "Updated 2025 model", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60" },
  { id: 2, title: "Slim Fit Cotton T-Shirt", price: 24.50, category: "men's clothing", stock: 100, active: true, description: "Lightweight fabric", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60" },
  { id: 3, title: "Winter Explorer Jacket", price: 69.99, category: "men's clothing", stock: 30, active: true, description: "Perfect for winter", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=60" },
  { id: 4, title: "Gold Plated Ring", price: 175.00, category: "jewelery", stock: 15, active: true, description: "Premium quality", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=60" },
  { id: 5, title: "Smart Wireless Headset", price: 99.99, category: "electronics", stock: 25, active: true, description: "Noise cancelling", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60" },
  { id: 6, title: "Classic Leather Watch", price: 125.50, category: "accessories", stock: 10, active: true, description: "Timeless elegance", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=60" }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'hinglish', name: 'Hinglish', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' }
];

const apiService = {
  getProducts: async (): Promise<Product[] | null> => {
    if (DEMO_MODE) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  sendChat: async (message: string, userId: string, userName: string, language: string): Promise<any> => {
    if (DEMO_MODE) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          context: { 
            user: { id: userId, name: userName },
            language: language
          } 
        })
      });
      if (!response.ok) throw new Error('Chat failed');
      return await response.json();
    } catch (error) {
      return null;
    }
  }
};

interface ChatWidgetProps {
  chatLog: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isOffline: boolean;
  userReg: UserRegistration;
  onRegister: (name: string, mobile: string) => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  chatLog, onSendMessage, isOpen, setIsOpen, isOffline, 
  userReg, onRegister, currentLanguage, onLanguageChange 
}) => {
  const [input, setInput] = useState("");
  const [regStep, setRegStep] = useState<'name' | 'mobile' | 'done'>('name');
  const [tempName, setTempName] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    if (!userReg.registered) {
      if (regStep === 'name') {
        setTempName(input);
        setRegStep('mobile');
        setInput("");
      } else if (regStep === 'mobile') {
        const mobileRegex = /^\d{10}$/;
        if (mobileRegex.test(input.trim())) {
          onRegister(tempName, input.trim());
          setRegStep('done');
          setInput("");
        } else {
          alert("Please enter a valid 10-digit mobile number");
        }
      }
    } else {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const parseMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={index} className="font-bold text-indigo-600">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  const getPlaceholder = () => {
    if (!userReg.registered) {
      return regStep === 'name' ? "Enter your name..." : "Enter 10-digit mobile...";
    }
    return "Type your message...";
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-80 sm:w-96 h-[600px]' : 'w-16 h-16'}`}>
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border border-gray-200">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                <MessageSquare size={18} />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-indigo-600 rounded-full ${isOffline ? 'bg-blue-400' : 'bg-green-400'}`}></div>
              </div>
              <div>
                <h3 className="font-bold text-base">NexaBot</h3>
                <span className="text-[10px] text-indigo-200 uppercase tracking-wider">
                  {isOffline ? 'Demo Mode' : 'AI Assistant'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <button 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full"
                >
                  <Globe size={20} />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border max-h-64 overflow-y-auto w-48 z-50">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 ${currentLanguage === lang.code ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700'}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Zap size={12} className="text-indigo-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {parseMessage(msg.text)}
                  </div>
                </div>
                
                {msg.image && (
                  <div className={`mt-2 max-w-[80%] rounded-xl overflow-hidden border shadow-sm ${msg.sender === 'bot' ? 'ml-8' : ''}`}>
                    <img src={msg.image} alt="Product" className="w-full h-40 object-cover" />
                  </div>
                )}

                {msg.images && msg.images.length > 0 && (
                  <div className={`mt-2 grid grid-cols-2 gap-2 max-w-[80%] ${msg.sender === 'bot' ? 'ml-8' : ''}`}>
                    {msg.images.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border shadow-sm">
                        <img src={img} alt={`Product ${i+1}`} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {msg.products && msg.products.length > 0 && (
                  <div className={`mt-2 space-y-2 max-w-[80%] ${msg.sender === 'bot' ? 'ml-8' : ''}`}>
                    {msg.products.map((prod, i) => (
                      <div key={i} className="bg-white rounded-lg p-2 border shadow-sm flex gap-2">
                        <img src={prod.image} alt={prod.title} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <div className="font-bold text-xs text-gray-800 truncate">{prod.title}</div>
                          <div className="text-indigo-600 text-xs font-bold">${prod.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t p-3 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button onClick={handleSend} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700">
              <Send size={18} />
            </button>
          </div>
          <div className="pb-2 text-center">
            <p className="text-[10px] text-gray-400">Powered by <span className="text-indigo-500">Nexa AI</span></p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full h-full bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700"
        >
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ product, onAddToCart }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border overflow-hidden group">
    <div className="relative h-48 overflow-hidden bg-gray-100">
      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md text-xs font-bold">
        ${product.price}
      </div>
    </div>
    <div className="p-4">
      <div className="text-xs text-indigo-500 font-semibold uppercase mb-1">{product.category}</div>
      <h3 className="font-bold text-gray-800 mb-2 truncate">{product.title}</h3>
      <p className="text-gray-500 text-xs mb-4 line-clamp-2">{product.description}</p>
      <button 
        onClick={() => onAddToCart(product)}
        className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
      >
        <ShoppingCart size={14} /> Add to Cart
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'shop' | 'cart'>('shop');
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [cart, setCart] = useState<Product[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Hello! 👋 Welcome to Nexa AI Store. To get started, please share your name and mobile number.", timestamp: new Date() }
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const [userReg, setUserReg] = useState<UserRegistration>({ name: '', mobile: '', registered: false });
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const remoteProducts = await apiService.getProducts();
      if (remoteProducts) {
        setProducts(remoteProducts);
        setIsBackendOffline(false);
      } else {
        setIsBackendOffline(true);
        setProducts(FALLBACK_PRODUCTS);
      }
    };
    initData();
  }, []);

  const handleRegister = (name: string, mobile: string) => {
    setUserReg({ name, mobile, registered: true });
    setChatLog(prev => [
      ...prev,
      { sender: 'user', text: `${name} | ${mobile}`, timestamp: new Date() },
      { sender: 'bot', text: `Welcome **${name}**! 🎉 How can I help you today? You can ask about products, track orders, or get recommendations!`, timestamp: new Date() }
    ]);
  };

  const handleChat = async (message: string) => {
    const userMsg: ChatMessage = { sender: 'user', text: message, timestamp: new Date() };
    setChatLog(prev => [...prev, userMsg]);

    const backendResponse = await apiService.sendChat(message, userReg.mobile, userReg.name, currentLanguage);
    
    if (backendResponse && backendResponse.text) {
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: backendResponse.text,
        timestamp: new Date(),
        image: backendResponse.image,
        images: backendResponse.images,
        products: backendResponse.products
      };
      setChatLog(prev => [...prev, botMsg]);
    } else {
      setChatLog(prev => [...prev, {
        sender: 'bot',
        text: "I'm having trouble connecting. Please try again!",
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('shop')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Package size={20} />
                </div>
                <span className="font-bold text-xl">Nexa AI Store</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer" onClick={() => setView('cart')}>
                <ShoppingCart size={20} className="text-gray-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'shop' && (
          <div className="space-y-6">
            {isBackendOffline && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3">
                <Info size={20} />
                <span className="text-sm font-medium">Demo Mode Active</span>
              </div>
            )}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-3xl p-8 text-white">
              <h1 className="text-4xl font-extrabold mb-4">Summer Collection 2025</h1>
              <p className="text-indigo-100 mb-6">AI-Powered Shopping Assistant</p>
              <button onClick={() => setChatOpen(true)} className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold">
                Chat with NexaBot
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={(p) => setCart(prev => [...prev, p])} />
              ))}
            </div>
          </div>
        )}

        {view === 'cart' && (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <button onClick={() => setView('shop')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold">Your Cart</h1>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl flex gap-4 items-center">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-indigo-600 font-bold">${item.price}</p>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 size={20} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <ChatWidget 
        chatLog={chatLog}
        onSendMessage={handleChat}
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        isOffline={isBackendOffline}
        userReg={userReg}
        onRegister={handleRegister}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
    </div>
  );
};

export default App;
