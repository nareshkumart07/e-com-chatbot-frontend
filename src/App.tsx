import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ShoppingCart, User, X, 
  Send, Loader2, Plus, ServerCrash, ChevronDown, Zap
} from 'lucide-react';

// --- Configuration ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// --- Constants ---
const DEFAULT_FAQS = [
  "Where is my order?",
  "What is your return policy?",
  "Do you offer free shipping?",
  "Show me best sellers",
  "How to contact support?",
  "Payment methods"
];

// --- Types ---
interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  image: string;
  rating: { rate: number, count: number };
}

interface CartItem extends Product { quantity: number; }

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: string;
  date: string;
  deliveryDate: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'options';
  options?: string[];
  data?: any;
}

// --- Main App ---
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
       sender: 'bot', 
       text: "Hello! Welcome to StyleStore. I'm your AI assistant. How can I help you today?",
       timestamp: new Date(),
       type: 'options',
       options: DEFAULT_FAQS
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Admin State
  const [adminToken, setAdminToken] = useState('');
  const [adminStats, setAdminStats] = useState<any>(null);

  // --- Initial Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      console.log("Attempting to connect to:", BACKEND_URL);

      try {
        // 1. Fetch Products (Critical)
        const prodRes = await fetch(`${BACKEND_URL}/products`);
        
        if (!prodRes.ok) {
          throw new Error(`Backend Error (${prodRes.status}): ${prodRes.statusText}`);
        }
        
        const prodData = await prodRes.json();
        setProducts(prodData);

        // 2. Fetch User & Orders (Non-Critical - Fail silently)
        try {
          const userRes = await fetch(`${BACKEND_URL}/user`);
          if (userRes.ok) setUser(await userRes.json());
          
          const orderRes = await fetch(`${BACKEND_URL}/orders`);
          if (orderRes.ok) setOrders(await orderRes.json());
        } catch (secondaryErr) {
          console.warn("Secondary data failed to load", secondaryErr);
        }

      } catch (err: any) {
        console.error("Critical Network Error:", err);
        setError(err.message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // --- Actions ---

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      return existing 
        ? prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
        : [...prev, { ...product, quantity: 1 }];
    });
  };

  const placeOrder = async (customerDetails: any) => {
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    try {
      const res = await fetch(`${BACKEND_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total, customer: { ...user, ...customerDetails } })
      });
      if (res.ok) {
        const newOrder = await res.json();
        setOrders(prev => [newOrder, ...prev]);
        setCart([]);
        setView('profile');
        alert(`Order #${newOrder.id} placed successfully!`);
      } else {
        throw new Error("Order failed");
      }
    } catch (err) {
      alert("Failed to place order. Please try again.");
    }
  };

  const handleChatSubmit = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend, timestamp: new Date() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           message: textToSend,
           context: { user, cart } 
        })
      });
      
      if (!res.ok) throw new Error("Chat API failed");
      
      const data = await res.json();
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: data.text, 
        timestamp: new Date(), 
        type: data.type, 
        data: data.data 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "I'm having trouble connecting to my brain right now. Please try again later.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const loginAdmin = async (password: string) => {
     try {
       const res = await fetch(`${BACKEND_URL}/admin/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ password })
       });
       const data = await res.json();
       if (data.success) {
         setAdminToken(data.token);
         fetchAdminStats();
       } else {
         alert("Invalid Password");
       }
     } catch (err) { alert("Server Error"); }
  };

  const fetchAdminStats = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/stats`);
    setAdminStats(await res.json());
  };

  // --- Views ---

  if (loading) return <div className="flex h-screen items-center justify-center gap-2"><Loader2 className="animate-spin text-indigo-600"/> Loading Store...</div>;
  
  // Robust Error Display
  const renderErrorBanner = () => error && (
    <div className="bg-red-50 p-6 flex flex-col items-center justify-center gap-3 text-red-800 border-b border-red-200">
      <div className="flex items-center gap-2 font-bold text-lg"><ServerCrash size={24}/> Connection Failed</div>
      <p className="text-sm">{error}</p>
      <div className="text-xs bg-white p-2 rounded border border-red-100 font-mono text-gray-500">
        Trying to connect to: {BACKEND_URL}
      </div>
      <p className="text-xs text-red-600 mt-2">Tip: Check if your VITE_BACKEND_URL in Railway Settings ends with <b>/api</b></p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      {renderErrorBanner()}
      
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm h-16 px-6 flex items-center justify-between">
         <div className="font-bold text-xl text-indigo-900 cursor-pointer flex items-center gap-2" onClick={() => setView('home')}>
            StyleStore
         </div>
         <div className="flex gap-4">
            <button onClick={() => setView('cart')} className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
               <ShoppingCart />
               {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{cart.length}</span>}
            </button>
            <button onClick={() => setView('profile')} className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"><User /></button>
         </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full mb-20 sm:mb-0">
         {view === 'home' && (
           <>
             {products.length === 0 && !loading && !error ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg mb-2">No products found.</p>
                    <p className="text-sm text-gray-400">The backend returned an empty list.</p>
                </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map(p => (
                     <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-shadow">
                        <div className="h-48 w-full flex items-center justify-center mb-4 bg-white p-2">
                            <img 
                              src={p.image} 
                              alt={p.title}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                            />
                        </div>
                        <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm mb-2 h-10">{p.title}</h3>
                        <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-50">
                           <span className="font-bold text-indigo-600 text-lg">${p.price}</span>
                           <button 
                             onClick={() => addToCart(p)} 
                             className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                             aria-label="Add to cart"
                           >
                             <Plus size={18}/>
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
             )}
           </>
         )}

         {view === 'cart' && (
           <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShoppingCart className="text-indigo-600"/> Your Cart</h2>
             {cart.length === 0 ? (
               <div className="text-center py-12 text-gray-400">Your cart is empty</div>
             ) : (
               <>
                 {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b last:border-0">
                       <div className="flex items-center gap-4">
                          <img src={item.image} className="w-16 h-16 object-contain bg-gray-50 rounded" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50'}/>
                          <div>
                             <p className="font-bold text-gray-800 line-clamp-1">{item.title}</p>
                             <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                          </div>
                       </div>
                       <span className="font-bold text-indigo-600">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                 ))}
                 <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between text-xl font-bold mb-6">
                      <span>Total</span>
                      <span>${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>
                    <button onClick={() => placeOrder({})} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                      Place Order
                    </button>
                 </div>
               </>
             )}
           </div>
         )}

         {view === 'profile' && (
            <div className="max-w-2xl mx-auto">
               <div className="bg-white p-8 rounded-xl shadow-sm mb-6 border-l-4 border-indigo-600">
                  <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name || 'Guest'}</h2>
                  <p className="text-gray-600">{user?.email || 'Please log in to see account details'}</p>
               </div>
               <h3 className="font-bold text-gray-700 mb-4 ml-1">Order History</h3>
               <div className="space-y-4">
                  {orders.length === 0 && <p className="text-gray-400 ml-1">No past orders found.</p>}
                  {orders.map(o => (
                     <div key={o.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                           <p className="font-bold text-gray-800 flex items-center gap-2">Order #{o.id}</p>
                           <p className="text-xs text-gray-400 mt-1">{o.date}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-indigo-600 text-lg">${o.total.toFixed(2)}</p>
                           <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                             {o.status}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {view === 'admin' && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
               {!adminToken ? (
                  <div className="max-w-sm mx-auto text-center">
                     <h2 className="text-2xl font-bold mb-6 text-gray-800">Admin Login</h2>
                     <input type="password" placeholder="Password (admin)" className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && loginAdmin((e.target as HTMLInputElement).value)}/>
                     <button className="text-sm text-indigo-600 hover:underline">Forgot Password?</button>
                  </div>
               ) : (
                  <div>
                     <h2 className="text-2xl font-bold mb-8 flex justify-between items-center">
                       Dashboard
                       <button onClick={() => setAdminToken('')} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded border border-red-200">Logout</button>
                     </h2>
                     {adminStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                           <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Orders</p>
                              <p className="text-4xl font-bold text-indigo-700 mt-2">{adminStats.totalOrders}</p>
                           </div>
                           <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Messages</p>
                              <p className="text-4xl font-bold text-green-700 mt-2">{adminStats.totalMessages}</p>
                           </div>
                           <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Support Queue</p>
                              <p className="text-4xl font-bold text-red-700 mt-2">{adminStats.pendingSupport}</p>
                           </div>
                        </div>
                     ) : <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-indigo-500"/></div>}
                  </div>
               )}
            </div>
         )}
      </main>

      {/* Chat Widget (Mobile Friendly Redesign) */}
      <div 
        className={`fixed z-50 transition-all duration-300 ease-in-out shadow-2xl
          ${isChatOpen 
             ? 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[650px] sm:rounded-2xl' 
             : 'bottom-6 right-6 w-16 h-16 rounded-full'
          }
        `}
      >
         {!isChatOpen && (
            <button 
              onClick={() => setIsChatOpen(true)} 
              className="w-full h-full bg-indigo-600 rounded-full text-white shadow-xl flex items-center justify-center hover:scale-110 hover:bg-indigo-700 transition-all active:scale-95"
            >
               <MessageSquare size={28} />
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
               </span>
            </button>
         )}
         
         {isChatOpen && (
            <div className="bg-white w-full h-full sm:rounded-2xl flex flex-col border border-gray-200 overflow-hidden">
               {/* Header */}
               <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-white flex justify-between items-center shadow-md shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                       <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <MessageSquare size={20} />
                       </div>
                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-700 rounded-full"></span>
                    </div>
                    <div>
                       <h3 className="font-bold text-base">Nexa Assistant</h3>
                       <p className="text-xs text-indigo-200 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                         Online
                       </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(false)} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-90"
                  >
                    <ChevronDown size={24} className="sm:hidden" />
                    <X size={20} className="hidden sm:block" />
                  </button>
               </div>

               {/* Messages Area */}
               <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50 scroll-smooth">
                  <div className="text-center py-4">
                     <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                       Today
                     </span>
                  </div>
                  
                  {messages.map((m, i) => (
                     <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`p-3.5 sm:p-3 rounde
