import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, MessageSquare, Send, Package, X, Trash2, Menu, Zap, ArrowLeft, CreditCard, Info, Sparkles, User, Phone } from 'lucide-react';

// --- CONFIGURATION ---
const DEMO_MODE = false; 
// FIX: Removed import.meta to prevent compilation errors in es2015 environments
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// --- TYPES ---
interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  active: boolean;
  description: string;
  image: string;
  discount?: number; // Added discount field
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  image?: string;
}

interface UserRegistration {
    name: string;
    phone: string;
    isRegistered: boolean;
}

// --- MOCK DATA ---
const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, title: "Urban Explorer Backpack 2025", price: 119.95, category: "men's clothing", active: true, description: "Updated 2025 model.", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60", discount: 15 },
  { id: 2, title: "Slim Fit Cotton T-Shirt", price: 24.50, category: "men's clothing", active: true, description: "Light weight.", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60", discount: 20 },
  { id: 3, title: "Winter Explorer Jacket", price: 69.99, category: "men's clothing", active: true, description: "Great for Winter.", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=60", discount: 25 },
  { id: 4, title: "Gold Plated Ring", price: 175.00, category: "jewelery", active: true, description: "Satisfaction Guaranteed.", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=60", discount: 30 },
];

const SUGGESTED_QUESTIONS: string[] = [
  "Track Order",
  "Latest Offers",
  "Show Watches",
  "Recommend Gift",
  "Contact Support"
];

// --- API SERVICE ---
const apiService = {
    getProducts: async (): Promise<Product[] | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            return null;
        }
    },
    sendChat: async (message: string, user: {id: string, name: string, phone: string}): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message, 
                    context: { user } 
                })
            });
            return await response.json();
        } catch (error) {
            return null;
        }
    }
};

// --- COMPONENT: CHAT WIDGET ---
interface ChatWidgetProps {
  chatLog: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  suggestedQuestions: string[];
  userReg: UserRegistration;
  onRegister: (name: string, phone: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ chatLog, onSendMessage, isOpen, setIsOpen, suggestedQuestions, userReg, onRegister }) => {
  const [input, setInput] = useState("");
  
  // Registration State
  const [regStep, setRegStep] = useState<'name' | 'phone' | 'done'>('name');
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, regStep, isOpen]);

  // Handle Registration Input
  const handleRegistrationSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");

      if (regStep === 'name') {
          if (tempName.trim().length < 2) {
              setErrorMsg("Please enter a valid name.");
              return;
          }
          setRegStep('phone');
      } else if (regStep === 'phone') {
          // Validate 10 digit phone
          if (!/^\d{10}$/.test(tempPhone)) {
              setErrorMsg("Please enter a valid 10-digit mobile number.");
              return;
          }
          onRegister(tempName, tempPhone);
          setRegStep('done');
      }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const parseMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <span key={index} className="font-bold text-indigo-700">{part.slice(2, -2)}</span>;
        }
        return part;
    });
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-80 sm:w-96 h-[550px]' : 'w-16 h-16'}`}>
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border border-gray-200 font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base">NexaBot AI</h3>
                <span className="text-[10px] text-indigo-100 uppercase tracking-wider font-semibold">
                    {userReg.isRegistered ? 'Online' : 'Registration'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            
            {/* 1. REGISTRATION FLOW UI */}
            {!userReg.isRegistered && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                    {/* Bot Greeting */}
                    <div className="flex justify-start w-full">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                            <Zap size={14} className="text-indigo-600" />
                        </div>
                        <div className="max-w-[85%] bg-white p-3 rounded-2xl rounded-bl-none text-gray-800 border border-gray-100 shadow-sm text-sm">
                            {regStep === 'name' 
                                ? "Hello! Before we start, may I know your Name?" 
                                : `Thanks ${tempName}! Now, please enter your 10-digit Mobile Number.`}
                        </div>
                    </div>

                    {/* User Form */}
                    <div className="flex justify-end w-full">
                         <form onSubmit={handleRegistrationSubmit} className="w-3/4 flex flex-col gap-2">
                             <div className="relative">
                                {regStep === 'name' ? (
                                    <User size={16} className="absolute left-3 top-3 text-gray-400" />
                                ) : (
                                    <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                                )}
                                <input 
                                    type={regStep === 'name' ? "text" : "tel"}
                                    value={regStep === 'name' ? tempName : tempPhone}
                                    onChange={(e) => regStep === 'name' ? setTempName(e.target.value) : setTempPhone(e.target.value)}
                                    placeholder={regStep === 'name' ? "Your Name..." : "9876543210"}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                                    autoFocus
                                />
                             </div>
                             {errorMsg && <p className="text-xs text-red-500 text-right">{errorMsg}</p>}
                             <button type="submit" className="bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md">
                                 {regStep === 'name' ? "Next" : "Start Chatting"}
                             </button>
                         </form>
                    </div>
                </div>
            )}

            {/* 2. MAIN CHAT UI (Only shows after registration) */}
            {userReg.isRegistered && (
                <>
                    {chatLog.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                            {msg.sender === 'bot' && (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <Zap size={12} className="text-indigo-600" />
                            </div>
                            )}
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                            msg.sender === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                                {parseMessage(msg.text)}
                            </div>
                        </div>
                        {msg.image && (
                            <div className={`mt-2 max-w-[85%] rounded-xl overflow-hidden border-2 border-indigo-50 shadow-sm ${msg.sender === 'bot' ? 'ml-8' : ''}`}>
                                <img src={msg.image} alt="Product" className="w-full h-32 object-cover" />
                            </div>
                        )}
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                </>
            )}
          </div>

          {/* Input Area (Disabled until registered) */}
          {userReg.isRegistered && (
            <div className="bg-white border-t border-gray-100 p-3">
                 <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                    {suggestedQuestions.map((q, i) => (
                        <button key={i} onClick={() => onSendMessage(q)} className="whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-indigo-50 text-indigo-600 text-xs rounded-full border border-gray-200 transition-colors">
                            {q}
                        </button>
                    ))}
                 </div>
                 <form onSubmit={handleSend} className="flex gap-2 items-center">
                   <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder="Type in English, Hindi, Marathi..."
                     className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                   />
                   <button type="submit" className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-sm">
                     <Send size={16} />
                   </button>
                 </form>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full h-full bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-105"
        >
          <MessageSquare size={28} />
          {!userReg.isRegistered && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      )}
    </div>
  );
};

// --- COMPONENT: PRODUCT CARD ---
const ProductCard: React.FC<{product: Product, onAdd: (p: Product) => void}> = ({ product, onAdd }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col relative">
    {/* Discount Badge */}
    {product.discount && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10 shadow-sm">
            {product.discount}% OFF
        </div>
    )}
    
    <div className="relative h-56 overflow-hidden bg-gray-100">
      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-1">
          <div className="text-xs text-indigo-500 font-bold uppercase tracking-wide">{product.category}</div>
          <div className="flex items-center text-xs text-yellow-500 font-bold">
              <Sparkles size={10} className="mr-1" /> Best Seller
          </div>
      </div>
      <h3 className="font-bold text-gray-800 mb-1 truncate">{product.title}</h3>
      <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">${(product.price * (1 - (product.discount || 0)/100)).toFixed(2)}</span>
          <span className="text-sm text-gray-400 line-through">${product.price}</span>
      </div>
      
      <button onClick={() => onAdd(product)} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
        <ShoppingCart size={16} /> Add to Cart
      </button>
    </div>
  </div>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [view, setView] = useState<'shop' | 'cart'>('shop');
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [cart, setCart] = useState<Product[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  
  // User Registration State
  const [userReg, setUserReg] = useState<UserRegistration>({ name: '', phone: '', isRegistered: false });

  useEffect(() => {
    apiService.getProducts().then(data => {
        if (data) setProducts(data);
    });
  }, []);

  const handleRegister = (name: string, phone: string) => {
      setUserReg({ name, phone, isRegistered: true });
      // Add initial welcome message after registration
      setChatLog([{ 
          sender: 'bot', 
          text: `Welcome **${name}**! I'm NexaBot. I speak English, Hindi, Marathi & more. Ask me about products or type **"Track Order"** to see our new random delivery system!`, 
          timestamp: new Date() 
      }]);
  };

  const handleChat = async (msg: string) => {
    // Optimistic UI Update
    setChatLog(prev => [...prev, { sender: 'user', text: msg, timestamp: new Date() }]);
    
    // Call Backend
    const response = await apiService.sendChat(msg, { id: userReg.phone, name: userReg.name, phone: userReg.phone });
    
    let replyText = "I'm connecting to the server...";
    let replyImage = undefined;

    if (response) {
        replyText = response.text;
        if (response.type === 'image') replyImage = response.data.image;
        
        // Handle Cart Updates from Bot
        if (response.type === 'cart-update' && msg.toLowerCase().includes('add')) {
             const product = products.find(p => msg.toLowerCase().includes(p.title.toLowerCase()));
             if (product) setCart(prev => [...prev, product]);
        }
        if (response.type === 'cart-update' && msg.toLowerCase().includes('clear')) {
             setCart([]);
        }
    } else {
        // Offline Fallback
        replyText = "Server is offline, but I can tell you: Our discounts are 15-30% today!";
    }

    setChatLog(prev => [...prev, { sender: 'bot', text: replyText, timestamp: new Date(), image: replyImage }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl text-indigo-900 cursor-pointer" onClick={() => setView('shop')}>
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Package size={20}/></div>
                Nexa Store
            </div>
            <div className="flex items-center gap-6">
                <button className="relative p-2" onClick={() => setView('cart')}>
                    <ShoppingCart size={22} className="text-gray-600" />
                    {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
                </button>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'shop' ? (
            <div className="space-y-8">
                {/* Hero */}
                <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-lg">
                        <h1 className="text-3xl font-bold mb-4">Flash Sale: 15-30% OFF Randomly!</h1>
                        <p className="text-indigo-200 mb-6">Chat with our bot in Hindi, Marathi or English to find hidden deals.</p>
                        <button onClick={() => setChatOpen(true)} className="bg-white text-indigo-900 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-colors">
                            {userReg.isRegistered ? 'Ask NexaBot' : 'Register & Chat'}
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-purple-500/30 to-transparent"></div>
                </div>
                
                {/* Grid */}
                <h2 className="text-2xl font-bold">Trending Now</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(p => <ProductCard key={p.id} product={p} onAdd={(prod) => setCart(c => [...c, prod])} />)}
                </div>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('shop')}><ArrowLeft className="text-gray-500"/></button>
                    <h2 className="text-2xl font-bold">Your Cart ({cart.length})</h2>
                </div>
                {cart.length === 0 ? <p className="text-gray-500 text-center py-10">Cart is empty.</p> : (
                    <div className="space-y-4">
                        {cart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <div className="flex gap-4">
                                    <img src={item.image} className="w-16 h-16 rounded-md object-cover bg-gray-100"/>
                                    <div>
                                        <h3 className="font-bold">{item.title}</h3>
                                        <p className="text-sm text-green-600 font-medium">{item.discount}% Discount Applied</p>
                                    </div>
                                </div>
                                <div className="font-bold">${(item.price * (1 - (item.discount||0)/100)).toFixed(2)}</div>
                            </div>
                        ))}
                        <div className="pt-4 flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>${cart.reduce((sum, i) => sum + (i.price * (1 - (i.discount||0)/100)), 0).toFixed(2)}</span>
                        </div>
                        <button onClick={() => { 
                            setChatOpen(true); 
                            handleChat("Place order"); 
                            setView('shop');
                        }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-6 hover:bg-indigo-700">
                            Place Order (Demo)
                        </button>
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
        suggestedQuestions={SUGGESTED_QUESTIONS}
        userReg={userReg}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default App;
