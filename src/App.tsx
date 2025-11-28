import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, MessageSquare, Send, Package, X, Trash2, Menu, Zap, ArrowLeft, CreditCard, User, Phone, Search, Sparkles, Loader } from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// --- TYPES ---
interface Product {
  id: number;
  title: string;
  price: number;
  discountedPrice: number; // Feature 4
  discountPercentage: number; // Feature 4
  category: string;
  description: string;
  image: string;
}

interface UserAuth {
    name: string;
    mobile: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  product?: Product; // Feature 6: Product Cards in Chat
}

// --- COMPONENTS ---

// 1. LOGIN FORM (Feature 1: Name & 10-digit Mobile)
const ChatAuthForm: React.FC<{ onLogin: (u: UserAuth) => void }> = ({ onLogin }) => {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mobileRegex = /^\d{10}$/; // Strict 10 digit validation
        if (!name.trim()) return setError("Name is required.");
        if (!mobileRegex.test(mobile)) return setError("Enter valid 10-digit mobile number.");
        onLogin({ name, mobile });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl w-full shadow-xl border border-white/20">
                <div className="text-center mb-6">
                    <div className="bg-white text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User size={24} />
                    </div>
                    <h3 className="text-xl font-bold">Nexa Login</h3>
                    <p className="text-indigo-200 text-xs">Enter details to start chat</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full bg-white/20 border border-indigo-400/30 rounded-lg px-4 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="w-full bg-white/20 border border-indigo-400/30 rounded-lg px-4 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Mobile (10 digits)" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value)} />
                    {error && <p className="text-red-300 text-xs font-bold text-center">{error}</p>}
                    <button type="submit" className="w-full bg-white text-indigo-700 font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg">Start Conversation</button>
                </form>
            </div>
        </div>
    );
};

// 2. CHAT WIDGET
const ChatWidget: React.FC<{ 
    isOpen: boolean; 
    setIsOpen: (o: boolean) => void;
    user: UserAuth | null;
    setUser: (u: UserAuth) => void;
    chatLog: ChatMessage[];
    onSendMessage: (msg: string) => void;
    isTyping: boolean;
}> = ({ isOpen, setIsOpen, user, setUser, chatLog, onSendMessage, isTyping }) => {
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if(isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog, isOpen, user]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if(!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    const renderText = (text: string) => text.split(/(\*\*.*?\*\*)/).map((p, i) => 
        p.startsWith('**') ? <strong key={i} className="text-indigo-800">{p.slice(2, -2)}</strong> : p
    );

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-80 sm:w-96 h-[600px]' : 'w-16 h-16'}`}>
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border border-gray-200 font-sans">
                    <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><MessageSquare size={18} /></div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">NexaBot AI</h3>
                                <span className="text-[10px] text-indigo-200 uppercase font-semibold">{user ? user.name : 'Login Required'}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}><X size={20} /></button>
                    </div>
                    
                    {!user ? <ChatAuthForm onLogin={setUser} /> : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                                {chatLog.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                            msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}>
                                            {renderText(msg.text)}
                                        </div>
                                        {/* Feature 6 & 7: Render Image Card in Chat */}
                                        {msg.product && (
                                            <div className="mt-2 w-48 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                                                <img src={msg.product.image} className="w-full h-32 object-cover" />
                                                <div className="p-2">
                                                    <h4 className="font-bold text-xs truncate">{msg.product.title}</h4>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-indigo-600 font-bold text-sm">${msg.product.discountedPrice}</span>
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">-{msg.product.discountPercentage}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && <div className="text-xs text-gray-400 ml-4">NexaBot is typing...</div>}
                                <div ref={endRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                                <input className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Type in any language..." value={input} onChange={e => setInput(e.target.value)} />
                                <button type="submit" className="w-10 h-10 bg-indigo-600 rounded-full text-white flex items-center justify-center hover:bg-indigo-700"><Send size={16} /></button>
                            </form>
                        </>
                    )}
                </div>
            ) : (
                <button onClick={() => setIsOpen(true)} className="w-full h-full bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform animate-bounce-subtle">
                    <MessageSquare size={28} />
                </button>
            )}
        </div>
    );
};

// 3. MAIN APP
const App = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<Product[]>([]);
    const [user, setUser] = useState<UserAuth | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [view, setView] = useState<'shop' | 'cart'>('shop');

    useEffect(() => {
        fetch(`${API_BASE_URL}/products`)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error("API Offline", err));
    }, []);

    useEffect(() => {
        if(user) {
            setChatLog([{ sender: 'bot', text: `Namaste ${user.name}! I speak 22 languages. Ask me anything!`, timestamp: new Date() }]);
        }
    }, [user]);

    const handleAddToCart = (product: Product) => {
        setCart([...cart, product]);
        setChatOpen(true);
    };

    const handleSendMessage = async (text: string) => {
        setChatLog(prev => [...prev, { sender: 'user', text, timestamp: new Date() }]);
        setIsTyping(true);
        
        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text, 
                    context: { user } // Sending User ID to Backend
                })
            });
            const data = await res.json();
            setIsTyping(false);

            const botMsg: ChatMessage = {
                sender: 'bot',
                text: data.text,
                timestamp: new Date(),
                product: data.type === 'product-card' ? data.data : undefined
            };

            setChatLog(prev => [...prev, botMsg]);

            if (data.type === 'cart-update') {
                setCart(prev => [...prev, data.data]);
            }
        } catch (e) {
            setIsTyping(false);
            setChatLog(prev => [...prev, { sender: 'bot', text: "Server offline. Ensure server.js is running.", timestamp: new Date() }]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('shop')}>
                    <div className="bg-indigo-600 text-white p-2 rounded-lg"><Package size={20}/></div>
                    <span className="font-bold text-xl hidden sm:block tracking-tight">Nexa Store</span>
                </div>
                <div className="flex gap-4 items-center">
                    {user && <span className="text-sm font-bold text-indigo-900 hidden sm:block">Hi, {user.name}</span>}
                    <button onClick={() => setView('cart')} className="relative p-2 bg-gray-100 rounded-full hover:bg-indigo-50 transition-colors">
                        <ShoppingCart size={20} className="text-gray-700"/>
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{cart.length}</span>}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {view === 'shop' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Hero */}
                        <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 max-w-xl">
                                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">AI Shopping Gen 2.0</h1>
                                <p className="text-indigo-100 mb-8 text-lg">Your multilingual assistant is here. Discounts, tracking, and styling advice in your language.</p>
                                <button onClick={() => setChatOpen(true)} className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                                    <Sparkles size={18} className="text-yellow-500" /> Start Chat
                                </button>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map(p => (
                                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                            {p.discountPercentage}% OFF
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">{p.category}</div>
                                        <h3 className="font-bold text-gray-900 truncate mb-auto">{p.title}</h3>
                                        <div className="flex items-end gap-2 mt-4 mb-4">
                                            <span className="text-xl font-bold text-indigo-600">${p.discountedPrice}</span>
                                            <span className="text-sm text-gray-400 line-through">${p.price}</span>
                                        </div>
                                        <button onClick={() => handleAddToCart(p)} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 flex justify-center gap-2 transition-colors">
                                            <ShoppingCart size={16}/> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Cart View */
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setView('shop')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
                            <h2 className="text-2xl font-bold">Shopping Cart ({cart.length})</h2>
                        </div>
                        {cart.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-6 text-lg">Your cart is currently empty.</p>
                                <button onClick={() => setView('shop')} className="text-indigo-600 font-bold hover:underline">Start Shopping</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item, i) => (
                                    <div key={i} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm items-center border border-gray-100">
                                        <img src={item.image} className="w-20 h-20 rounded-lg object-cover bg-gray-50" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                                            <p className="text-indigo-600 font-bold mt-1">${item.discountedPrice}</p>
                                        </div>
                                        <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20}/></button>
                                    </div>
                                ))}
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-8 sticky bottom-6">
                                    <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                                        <span>Total</span>
                                        <span>${cart.reduce((a, b) => a + b.discountedPrice, 0).toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => { setView('shop'); setChatOpen(true); handleSendMessage("Place Order"); }} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex justify-center items-center gap-2">
                                        <CreditCard size={20} /> Checkout with AI
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <ChatWidget 
                isOpen={chatOpen} 
                setIsOpen={setChatOpen} 
                user={user} 
                setUser={setUser} 
                chatLog={chatLog}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
            />
        </div>
    );
};

export default App;
