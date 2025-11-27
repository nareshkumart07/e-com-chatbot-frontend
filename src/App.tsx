import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, MessageSquare, Send, Package, X, Trash2, Menu, Zap, ArrowLeft, CreditCard } from 'lucide-react';

// --- CONFIGURATION ---
// <--- BACKEND INTEGRATION POINT: Set your actual backend URL here
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// --- TYPES & INTERFACES ---

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

interface UserData {
  id: string;
  name: string;
}

interface Order {
  id: string;
  items: Product[];
  total: number;
  customer: UserData;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  deliveryDate: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface Faq {
  question: string;
  answer: string;
}

interface AppSettings {
  storeName: string;
  supportEmail: string;
  botName: string;
  botActive: boolean;
  welcomeMessage: string;
  faqs: Faq[];
}

// --- MOCK DATA (FALLBACKS) ---

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, title: "Urban Explorer Backpack 2025", price: 119.95, category: "men's clothing", stock: 50, active: true, description: "Updated 2025 model for everyday use.", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60" },
  { id: 2, title: "Slim Fit Cotton T-Shirt", price: 24.50, category: "men's clothing", stock: 100, active: true, description: "Light weight & soft fabric.", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60" },
  { id: 3, title: "Winter Explorer Jacket '25", price: 69.99, category: "men's clothing", stock: 30, active: true, description: "Great for Winter.", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=60" },
  { id: 4, title: "Gold Plated Ring", price: 175.00, category: "jewelery", stock: 15, active: true, description: "Satisfaction Guaranteed.", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=60" },
  { id: 5, title: "Smart Wireless Headset Gen 2", price: 99.99, category: "electronics", stock: 25, active: true, description: "Improved noise cancelling.", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60" },
  { id: 6, title: "Classic Leather Watch", price: 125.50, category: "accessories", stock: 10, active: true, description: "Timeless elegance.", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=60" }
];

const INITIAL_SETTINGS: AppSettings = {
  storeName: "Nexa AI Store",
  supportEmail: "support@nexa.com",
  botName: "NexaBot",
  botActive: true,
  welcomeMessage: "Hello! I'm NexaBot. You can ask me to 'Add items to cart', 'Check stock', or 'Track order'. How can I help?",
  faqs: [
    { question: "shipping", answer: "We ship within 24 hours." },
    { question: "return", answer: "Returns accepted within 30 days." }
  ]
};

const SUGGESTED_QUESTIONS: string[] = [
  "Show my cart",
  "Track my order",
  "Shipping policy",
  "Best selling items",
  "Clear my cart",
  "Contact support"
];

// --- API SERVICE ---
const apiService = {
    // 1. Fetch Products
    getProducts: async (): Promise<Product[] | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn("Backend offline, using mock products:", error);
            return null; // Signal to use fallback
        }
    },

    // 2. Chat with Bot
    sendChat: async (message: string, userId: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message, 
                    context: { user: { id: userId, name: 'Web User' } } 
                })
            });
            if (!response.ok) throw new Error('Chat failed');
            return await response.json();
        } catch (error) {
            console.warn("Backend offline, using local chat logic:", error);
            return null;
        }
    }
};

// --- COMPONENTS ---

// 1. CHATBOT WIDGET
interface ChatWidgetProps {
  chatLog: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  settings: AppSettings;
  suggestedQuestions: string[];
  isOffline: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ chatLog, onSendMessage, isOpen, setIsOpen, settings, suggestedQuestions, isOffline }) => {
  const [input, setInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatLog, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handleQuickQuestion = (question: string) => {
    onSendMessage(question);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-80 sm:w-96 h-[600px]' : 'w-16 h-16'}`}>
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full border border-gray-200 font-sans">
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                <MessageSquare size={18} />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-indigo-600 rounded-full ${isOffline ? 'bg-orange-400' : 'bg-green-400'}`}></div>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{settings.botName}</h3>
                <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">
                    {isOffline ? 'Offline Mode' : 'AI Assistant'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                     <Zap size={12} className="text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-100">
             {/* Suggested Questions */}
             <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-2">
                {suggestedQuestions.map((q, i) => (
                   <button 
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-medium rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm whitespace-nowrap"
                   >
                      {q}
                   </button>
                ))}
             </div>

             <form onSubmit={handleSend} className="p-3 flex gap-2 items-center">
               <input
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type your message..."
                 className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder-gray-400"
               />
               <button type="submit" className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm transform active:scale-95">
                 <Send size={18} />
               </button>
             </form>
             
             {/* Branding Footer */}
             <div className="pb-2 text-center">
                <p className="text-[10px] text-gray-400 font-medium">
                   Powered by <span className="text-indigo-500">Nexa AI Solution</span>
                </p>
             </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group w-full h-full bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 animate-bounce-subtle"
        >
           {/* Blinking Red Dot Feature */}
           <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
          <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </div>
  );
};

// 2. PRODUCT CARD
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden group">
    <div className="relative h-48 overflow-hidden bg-gray-100">
      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700">
        ${product.price}
      </div>
    </div>
    <div className="p-4">
      <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">{product.category}</div>
      <h3 className="font-bold text-gray-800 mb-2 truncate">{product.title}</h3>
      <p className="text-gray-500 text-xs mb-4 line-clamp-2">{product.description}</p>
      <button 
        onClick={() => onAddToCart(product)}
        className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
      >
        <ShoppingCart size={14} /> Add to Cart
      </button>
    </div>
  </div>
);

// 3. CART VIEW (Replaces Admin Dashboard)
interface CartViewProps {
    cart: Product[];
    onRemove: (index: number) => void;
    onCheckout: () => void;
    onContinueShopping: () => void;
    onClear: () => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, onRemove, onCheckout, onContinueShopping, onClear }) => {
    const total = cart.reduce((acc, item) => acc + item.price, 0);

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <button onClick={onContinueShopping} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600"/>
                     </button>
                     <h1 className="text-3xl font-bold text-gray-900">Your Shopping Cart</h1>
                 </div>
                 {cart.length > 0 && (
                     <button onClick={onClear} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-transparent hover:border-red-100">
                        <Trash2 size={16} /> Clear Cart
                     </button>
                 )}
            </div>

            {cart.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart size={32} className="text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't added any items yet.</p>
                    <button 
                        onClick={onContinueShopping}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                    <div className="mt-1 font-bold text-indigo-600">${item.price}</div>
                                </div>
                                <button 
                                    onClick={() => onRemove(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (Estimate)</span>
                                    <span>${(total * 0.08).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total</span>
                                    <span>${(total * 1.08).toFixed(2)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={onCheckout}
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <CreditCard size={18} /> Checkout
                            </button>
                            <p className="text-xs text-gray-400 text-center mt-4">
                                Secure Checkout powered by Nexa Pay
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 4. MAIN APP COMPONENT
const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'shop' | 'cart'>('shop');
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [cart, setCart] = useState<Product[]>([]);
  // Fix for unused variable 'orders'. Used a dummy variable or destructuring skip.
  const [, setOrders] = useState<Order[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    { sender: 'bot', text: INITIAL_SETTINGS.welcomeMessage, timestamp: new Date() }
  ]);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [settings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [userId] = useState<string>("user_web_demo");
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isBackendOffline, setIsBackendOffline] = useState<boolean>(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
        // 1. Fetch Products
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

  // --- LOGIC ---
  
  const handleAddToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
    setCart(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleClearCart = () => {
      setCart([]);
  };

  const processOrder = (): Order | null => {
    if (cart.length === 0) return null;
    const total = cart.reduce((acc, i) => acc + i.price, 0);
    const newOrder: Order = {
        id: Math.floor(10000 + Math.random() * 90000).toString(),
        items: [...cart],
        total: parseFloat(total.toFixed(2)),
        customer: { id: userId, name: "Web User" },
        status: 'Pending',
        date: new Date().toLocaleDateString(),
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  };

  const handleChat = async (message: string) => {
    // 1. Add User Message
    const userMsg: ChatMessage = { sender: 'user', text: message, timestamp: new Date() };
    setChatLog(prev => [...prev, userMsg]);

    let reply = "";
    const lowerMsg = message.toLowerCase();
    
    // Flag to see if we solved it locally (High priority for Cart reads)
    let handledLocally = false;

    // --- PRIORITIZE LOCAL CART INTENT ---
    
    // 1. Clear Cart (Highest Priority Local Action)
    // FIX: Updated logic to correctly catch "Clear my cart" by looking for "clear" AND "cart"
    if ((lowerMsg.includes("clear") || lowerMsg.includes("empty")) && lowerMsg.includes("cart")) {
        setCart([]);
        reply = "I've emptied your cart.";
        handledLocally = true;
    }
    
    // 2. Place Order (High Priority Local Action)
    else if (lowerMsg.includes("place order") || lowerMsg.includes("checkout")) {
        if (cart.length === 0) {
            reply = "Your cart is empty. Add some cool gear first!";
        } else {
            const order = processOrder();
            if (order) reply = `Order #${order.id} placed successfully! It will arrive by ${order.deliveryDate}.`;
            else reply = "Error placing order.";
        }
        handledLocally = true;
    }
    
    // 3. Show Cart (Check this AFTER Clear/Order, and ensure it's not an 'Add' intent)
    // We explicitly exclude action verbs so "Add to my cart" falls through to the backend/fallback logic
    else if (
        (lowerMsg.includes("show cart") || lowerMsg.includes("my cart") || lowerMsg.includes("in cart")) &&
        !lowerMsg.includes("add") && 
        !lowerMsg.includes("buy") &&
        !lowerMsg.includes("place") &&
        !lowerMsg.includes("checkout")
    ) {
        if (cart.length === 0) reply = "Your cart is currently empty.";
        else {
            const itemsList = cart.map(i => i.title).join(', ');
            const total = cart.reduce((acc, i) => acc + i.price, 0).toFixed(2);
            reply = `You have ${cart.length} items in your cart: ${itemsList}. Total: $${total}. Say 'Place Order' to checkout.`;
        }
        handledLocally = true;
    }

    // 4. Try Backend AI (Only if not handled locally)
    if (!handledLocally) {
        const backendResponse = await apiService.sendChat(message, userId);
        
        if (backendResponse && backendResponse.text) {
            // Success from backend
            reply = backendResponse.text;
            
            // Handle specific actions from backend if structured
            if (backendResponse.type === 'cart-update' || lowerMsg.includes('add to cart')) {
                 const product = products.find(p => lowerMsg.includes(p.title.toLowerCase()) || lowerMsg.includes(p.category.toLowerCase().split("'")[0]));
                 if(product) {
                     setCart(prev => [...prev, product]);
                 }
            }
        } else {
            // Fallback to Local Logic (if backend is offline)
            setIsBackendOffline(true);
            await new Promise(r => setTimeout(r, 600)); // Simulate delay

            // A. Cart Add Logic (Fallback)
            if (lowerMsg.includes("add to cart") || lowerMsg.includes("buy")) {
                const product = products.find(p => lowerMsg.includes(p.title.toLowerCase()) || lowerMsg.includes(p.category.toLowerCase().split("'")[0]));
                if (product) {
                    setCart(prev => [...prev, product]);
                    reply = `I've added '${product.title}' to your cart. Total items: ${cart.length + 1}.`;
                } else {
                    reply = "I couldn't find that product directly. Try checking our catalog above!";
                }
            }
            // B. Smart Handlers
            else if (lowerMsg.includes("best selling")) {
                reply = "Our best-selling item is the 'Urban Explorer Backpack'. Would you like to add it to your cart?";
            }
            else if (lowerMsg.includes("contact") || lowerMsg.includes("support")) {
                reply = `You can reach our human support team at ${settings.supportEmail}.`;
            }
            // C. Fallback
            else {
                const faqMatch = settings.faqs.find(f => lowerMsg.includes(f.question));
                reply = faqMatch ? faqMatch.answer : "I'm running in offline mode. I can help you browse products and manage your cart!";
            }
        }
    }

    setChatLog(prev => [...prev, { sender: 'bot', text: reply, timestamp: new Date() }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden">
                <Menu size={24} />
              </button>
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setView('shop')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Package size={20} />
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block">{settings.storeName}</span>
              </div>
              <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
                <button 
                  onClick={() => setView('shop')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${view === 'shop' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                >
                  Storefront
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* UPDATED: Cart Icon now sets View to 'cart' instead of opening Chat */}
              <div className="relative cursor-pointer group" onClick={() => setView('cart')}>
                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                  <ShoppingCart size={20} className="text-gray-600 group-hover:text-indigo-600" />
                </div>
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-red-500 text-center text-[10px] font-bold text-white leading-tight">
                    {cart.length}
                  </span>
                )}
              </div>
              <div className="bg-indigo-50 p-1 pr-3 rounded-full flex items-center gap-2 border border-indigo-100">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  JS
                </div>
                <span className="text-sm font-medium text-indigo-900 hidden sm:block">Jane Smith</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'shop' && (
          <div className="animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10 max-w-xl">
                 <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Summer Collection 2025</h1>
                 <p className="text-indigo-100 mb-6 text-lg">Discover the latest trends in techwear and accessories. Powered by AI shopping assistance.</p>
                 <button onClick={() => setChatOpen(true)} className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-colors">
                   Chat with {settings.botName}
                 </button>
               </div>
               <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <div className="flex gap-2">
                 <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Filter</button>
                 <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Sort</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        )}

        {view === 'cart' && (
            <CartView 
                cart={cart} 
                onRemove={handleRemoveFromCart} 
                onCheckout={() => {
                    const order = processOrder();
                    if(order) {
                        setView('shop');
                        setChatOpen(true);
                        setChatLog(prev => [...prev, {
                            sender: 'bot',
                            text: `Order #${order.id} placed successfully! Thank you for your purchase.`,
                            timestamp: new Date()
                        }]);
                    }
                }}
                onContinueShopping={() => setView('shop')}
                onClear={handleClearCart}
            />
        )}
      </main>

      {/* Chat Bot */}
      <ChatWidget 
        chatLog={chatLog} 
        onSendMessage={handleChat} 
        isOpen={chatOpen} 
        setIsOpen={setChatOpen} 
        settings={settings}
        suggestedQuestions={SUGGESTED_QUESTIONS}
        isOffline={isBackendOffline}
      />

    </div>
  );
};

export default App;
