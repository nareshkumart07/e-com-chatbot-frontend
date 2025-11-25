import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ShoppingCart, User, Search, X, 
  Send, Package, Settings, LogOut, Plus, Trash2, Check,
  Bot, Loader2, Star, Filter, MapPin, Phone
} from 'lucide-react';

// --- Configuration ---
// NOTE: For deployment, uncomment the line below to use Environment Variables.
// For this live preview, we use the hardcoded localhost URL to avoid build warnings.
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'; 
const BACKEND_URL = 'http://localhost:5000/api';

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
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Admin State
  const [adminToken, setAdminToken] = useState('');
  const [adminStats, setAdminStats] = useState<any>(null);

  // --- Initial Fetch ---
  useEffect(() => {
    const init = async () => {
      try {
        const [prodRes, userRes, orderRes] = await Promise.all([
          fetch(`${BACKEND_URL}/products`),
          fetch(`${BACKEND_URL}/user`),
          fetch(`${BACKEND_URL}/orders`)
        ]);

        if (!prodRes.ok) throw new Error("Backend connection failed");
        
        setProducts(await prodRes.json());
        setUser(await userRes.json());
        setOrders(await orderRes.json());
        setLoading(false);
        
        // Initial Chat
        setMessages([{ 
           sender: 'bot', 
           text: `Hello! I am connected to the server. How can I help?`,
           timestamp: new Date()
        }]);

      } catch (err) {
        console.error(err);
        setError(`Could not connect to Backend at ${BACKEND_URL}.`);
        setLoading(false);
      }
    };
    init();
  }, []);

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
      const newOrder = await res.json();
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setView('profile');
      alert(`Order #${newOrder.id} placed!`);
    } catch (err) {
      alert("Failed to place order");
    }
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           message: userText,
           context: { user, cart } 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.text, timestamp: new Date(), type: data.type, data: data.data }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Server error. Try again later.", timestamp: new Date() }]);
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;
  
  if (error) return (
    <div className="flex h-screen items-center justify-center flex-col p-4 text-center">
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 className="text-red-700 font-bold text-xl mb-2">Backend Disconnected</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600">Please ensure the backend is running and reachable.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm h-16 px-6 flex items-center justify-between">
         <div className="font-bold text-xl text-indigo-900 cursor-pointer" onClick={() => setView('home')}>StyleStore</div>
         <div className="flex gap-4">
            <button onClick={() => setView('cart')} className="relative p-2 text-gray-600 hover:text-indigo-600">
               <ShoppingCart />
               {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
            </button>
            <button onClick={() => setView('profile')} className="p-2 text-gray-600 hover:text-indigo-600"><User /></button>
         </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
         {view === 'home' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {products.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <img src={p.image} className="h-40 object-contain mb-4"/>
                    <h3 className="font-semibold line-clamp-2">{p.title}</h3>
                    <div className="mt-auto flex justify-between items-center pt-4">
                       <span className="font-bold text-indigo-600">${p.price}</span>
                       <button onClick={() => addToCart(p)} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Plus size={16}/></button>
                    </div>
                 </div>
              ))}
           </div>
         )}

         {view === 'cart' && (
           <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm">
             <h2 className="text-2xl font-bold mb-4">Cart</h2>
             {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-4 border-b">
                   <div className="flex items-center gap-4">
                      <img src={item.image} className="w-12 h-12 object-contain"/>
                      <div>
                         <p className="font-bold">{item.title}</p>
                         <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                      </div>
                   </div>
                   <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
             ))}
             {cart.length > 0 && (
                <button onClick={() => placeOrder({})} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-bold">Place Order</button>
             )}
           </div>
         )}

         {view === 'profile' && user && (
            <div className="max-w-2xl mx-auto">
               <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}</h2>
                  <p className="text-gray-600">Email: {user.email}</p>
               </div>
               <div className="space-y-4">
                  {orders.map(o => (
                     <div key={o.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between">
                        <div>
                           <p className="font-bold">Order #{o.id}</p>
                           <p className="text-sm text-gray-500">{o.date}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-indigo-600">${o.total.toFixed(2)}</p>
                           <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{o.status}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {view === 'admin' && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm">
               {!adminToken ? (
                  <div className="max-w-sm mx-auto">
                     <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
                     <input type="password" placeholder="Password (admin)" className="w-full border p-2 rounded mb-4" onKeyDown={(e) => e.key === 'Enter' && loginAdmin((e.target as HTMLInputElement).value)}/>
                  </div>
               ) : (
                  <div>
                     <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                     {adminStats && (
                        <div className="grid grid-cols-3 gap-6 mb-8">
                           <div className="bg-indigo-50 p-4 rounded-lg">
                              <p className="text-gray-500">Orders</p>
                              <p className="text-3xl font-bold">{adminStats.totalOrders}</p>
                           </div>
                           <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-gray-500">Messages</p>
                              <p className="text-3xl font-bold">{adminStats.totalMessages}</p>
                           </div>
                           <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-gray-500">Pending Support</p>
                              <p className="text-3xl font-bold">{adminStats.pendingSupport}</p>
                           </div>
                        </div>
                     )}
                     <button onClick={() => setAdminToken('')} className="text-red-500 underline">Logout</button>
                  </div>
               )}
            </div>
         )}
      </main>

      {/* Chat Widget */}
      <div className={`fixed bottom-4 right-4 z-50 ${isChatOpen ? 'w-96 h-[500px]' : 'w-16 h-16'}`}>
         {!isChatOpen && (
            <button onClick={() => setIsChatOpen(true)} className="w-full h-full bg-indigo-600 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
               <MessageSquare />
            </button>
         )}
         {isChatOpen && (
            <div className="bg-white w-full h-full rounded-2xl shadow-2xl flex flex-col border border-gray-200">
               <div className="bg-indigo-700 p-4 text-white rounded-t-2xl flex justify-between items-center">
                  <span className="font-bold">Support AI</span>
                  <button onClick={() => setIsChatOpen(false)}><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((m, i) => (
                     <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[80%] text-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'}`}>
                           {m.text}
                        </div>
                     </div>
                  ))}
                  {isTyping && <div className="text-xs text-gray-500 italic ml-2">AI is typing...</div>}
               </div>
               <form onSubmit={sendChatMessage} className="p-3 border-t flex gap-2">
                  <input className="flex-1 bg-gray-100 rounded-full px-4 text-sm" placeholder="Ask anything..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                  <button className="p-2 bg-indigo-600 text-white rounded-full"><Send size={16}/></button>
               </form>
            </div>
         )}
      </div>

      {/* Footer Link for Admin */}
      <footer className="text-center py-6 text-gray-400 text-sm">
         <button onClick={() => setView('admin')} className="hover:text-indigo-600">Admin Panel</button>
      </footer>
    </div>
  );
}
