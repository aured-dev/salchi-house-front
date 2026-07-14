import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import productsData from './data/products.json';
import { ShoppingCart, LayoutDashboard, CheckCircle2, Phone, MessageSquare, PackageCheck, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const ADMIN_PASSWORD = "admin123";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
console.log("DEBUG: La API_URL cargada es:", API_URL);

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'salchipapas', label: 'Salchipapas' },
  { id: 'hamburguesas', label: 'Hamburguesas' },
  { id: 'platos', label: 'Platos' },
  { id: 'perros', label: 'Perros' }
];

// --- USER VIEW ---
const UserView = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sauces, setSauces] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);

  const SAUCE_OPTIONS = ["Ajo de la casa", "Rosada", "Piña", "Tomate"];

  const filteredProducts = activeCategory === 'todos' 
    ? productsData 
    : productsData.filter(p => p.categoria === activeCategory);

  const toggleSauce = (sauce) => {
    setSauces(prev => 
      prev.includes(sauce) ? prev.filter(s => s !== sauce) : [...prev, sauce]
    );
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const cartItem = {
      cartId: Date.now(),
      productId: selectedProduct.id,
      nombre: selectedProduct.nombre,
      imagen: selectedProduct.imagen,
      precio: selectedProduct.precio,
      quantity: quantity,
      sauces: [...sauces]
    };
    
    setCart(prev => [...prev, cartItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setSauces([]);
    // setShowCart(true); // Removido para que no se abra automáticamente
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const finishOrder = async () => {
    if (cart.length === 0 || isSending) return;
    if (!phoneNumber) {
      alert("Por favor ingresa tu número de teléfono para contactarte.");
      return;
    }

    setIsSending(true);
    try {
      const newOrder = {
        items: cart,
        phone: phoneNumber,
        total: cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0)
      };
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        setShowConfirm(true);
        setCart([]);
        setShowCart(false);
      } else {
        alert("Error al enviar el pedido. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsSending(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);

  return (
    <div className="min-h-screen bg-black text-white p-2 md:p-4">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/">
          <img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2 text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <ShoppingCart size={32} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {cart.length}
              </span>
            )}
          </button>
          <Link to="/admin" className="text-gray-500 hover:text-white flex items-center gap-2 font-bold text-sm">
            <LayoutDashboard size={20} />
            <span>ADMIN</span>
          </Link>
        </div>
      </header>

      {/* Cart Sidebar/Modal */}
      {showCart && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/80 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic text-yellow-500 tracking-tighter flex items-center gap-2">
                <ShoppingCart /> MI PEDIDO
              </h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-white font-black text-xl">✕</button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                  <ShoppingCart size={64} className="opacity-20" />
                  <p className="font-black uppercase italic">Tu carrito está vacío</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="text-yellow-500 underline font-bold"
                  >VER MENÚ</button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartId} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 relative group">
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                    <div className="flex gap-4">
                      <img src={item.imagen} className="w-16 h-16 rounded-xl object-cover border border-gray-600" />
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-black text-white uppercase text-sm leading-tight">{item.nombre}</h4>
                          <span className="font-black text-yellow-500 text-sm">${(item.precio * item.quantity).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 mb-2">CANTIDAD: {item.quantity}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.sauces.map(s => (
                            <span key={s} className="text-[8px] font-black bg-black text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 uppercase">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-800 bg-black/20">
                <div className="mb-6">
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2 tracking-widest">TU TELÉFONO (PARA CONTACTARTE)</label>
                  <input 
                    type="tel" 
                    placeholder="Escribe tu número aquí..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-yellow-500 outline-none text-white font-bold"
                  />
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-black uppercase italic">TOTAL A PAGAR:</span>
                  <span className="text-3xl font-black text-yellow-500 tracking-tighter">${cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={finishOrder}
                  disabled={isSending}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-xl transition-all transform active:scale-95 uppercase italic shadow-lg shadow-red-900/20",
                    isSending ? "bg-gray-700 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  {isSending ? "ENVIANDO..." : "FINALIZAR PEDIDO"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="h-40 relative">
              <img src={selectedProduct.imagen} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-black/50 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >✕</button>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-black uppercase italic text-white mb-4">{selectedProduct.nombre}</h2>
              
              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-xs font-black uppercase text-gray-500 mb-2 tracking-widest">CANTIDAD</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center font-black text-2xl hover:bg-gray-700"
                  >−</button>
                  <span className="text-2xl font-black w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center font-black text-2xl hover:bg-gray-700"
                  >+</button>
                </div>
              </div>

              {/* Sauces */}
              <div className="mb-8">
                <label className="block text-xs font-black uppercase text-gray-500 mb-3 tracking-widest">SALSAS</label>
                <div className="grid grid-cols-2 gap-3">
                  {SAUCE_OPTIONS.map(sauce => (
                    <button
                      key={sauce}
                      onClick={() => toggleSauce(sauce)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-xs font-black uppercase transition-all flex items-center gap-2",
                        sauces.includes(sauce) 
                          ? "bg-yellow-500 border-yellow-500 text-black" 
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-yellow-500/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        sauces.includes(sauce) ? "border-black bg-black text-yellow-500" : "border-gray-600"
                      )}>
                        {sauces.includes(sauce) && "✓"}
                      </div>
                      {sauce}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={addToCart}
                className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black text-xl hover:bg-yellow-600 transition-all transform active:scale-95 uppercase italic"
              >
                AGREGAR AL CARRITO - ${(selectedProduct.precio * quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm ? (

        <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-2xl shadow-2xl border-2 border-yellow-500 text-center animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="mx-auto text-yellow-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-4 text-white uppercase italic">¡Pedido Recibido!</h2>
          <p className="text-gray-400 mb-6">Para confirmar tu pedido, comunícate al número 3127802437 o al 3206533409:</p>
          <div className="space-y-4">
            
            <a href="https://wa.me/+573127802437" className="flex items-center justify-center gap-3 bg-yellow-500 text-black py-4 rounded-xl font-black hover:bg-yellow-600 transition-all transform hover:scale-105">
              <MessageSquare size={20} />
              WHATSAPP 3127802437
            </a>
            <a href="https://wa.me/+573206533409" className="flex items-center justify-center gap-3 bg-yellow-500 text-black py-4 rounded-xl font-black hover:bg-yellow-600 transition-all transform hover:scale-105">
              <MessageSquare size={20} />
              WHATSAPP 3206533409
            </a>
          </div>
          <button 
            onClick={() => setShowConfirm(false)}
            className="mt-8 text-gray-500 hover:text-white text-sm font-bold underline"
          >
            VOLVER AL MENÚ
          </button>
        </div>
      ) : (
        <>
          {/* Categorías */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-2 rounded-full font-bold transition-all border-2",
                  activeCategory === cat.id 
                    ? "bg-red-600 border-red-600 text-white" 
                    : "bg-transparent border-gray-700 text-gray-400 hover:border-red-600"
                )}
              >
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden hover:shadow-red-900/20 transition-all border-2 border-gray-800 flex flex-col group"
              >
                <div className="h-56 bg-gray-800 relative overflow-hidden">
                  <img 
                    src={product.imagen} 
                    alt={product.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300/333/fff?text=' + product.nombre;
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
                      {product.categoria}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{product.nombre}</h3>
                  <p className="text-sm text-gray-400 mb-6 flex-grow leading-relaxed">{product.descripcion}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black text-yellow-500">${product.precio.toLocaleString()}</span>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="bg-red-600 text-white px-6 py-2 rounded-xl font-black hover:bg-red-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <ShoppingCart size={18} />
                      PEDIR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- ADMIN VIEW ---
const AdminView = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  // Sound effect for new orders
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play blocked by browser", e));
  };

  useEffect(() => {
    if (isAuthenticated) {
      const loadOrders = async () => {
        try {
          const response = await fetch(`${API_URL}/orders`);
          const data = await response.json();
          const storedOrders = data;
          
          // Notify if there's a new order
          if (storedOrders.length > prevOrderCount && prevOrderCount !== 0) {
            playNotificationSound();
            if ("Notification" in window && Notification.permission === "granted") {
              const lastOrder = storedOrders[storedOrders.length - 1];
              new Notification("¡Nuevo Pedido!", {
                body: `Pedido #${lastOrder.id.toString().slice(-4)} por $${lastOrder.total?.toLocaleString()}`,
                icon: "/logo.png"
              });
            }
          }
          
          setOrders([...storedOrders].reverse());
          setPrevOrderCount(storedOrders.length);
        } catch (error) {
          console.error("Error al cargar pedidos:", error);
        }
      };

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      loadOrders();
      const interval = setInterval(loadOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, prevOrderCount]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      }
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
    }
  };

  const clearOrders = async () => {
    if (window.confirm("¿BORRAR TODO EL HISTORIAL EN EL SERVIDOR?")) {
      try {
        await fetch(`${API_URL}/orders`, { method: 'DELETE' });
        setOrders([]);
        setPrevOrderCount(0);
      } catch (error) {
        console.error("Error al limpiar historial:", error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <form onSubmit={(e) => { e.preventDefault(); if(password === ADMIN_PASSWORD) setIsAuthenticated(true); else alert("Error"); }} 
          className="bg-gray-900 p-8 rounded-2xl shadow-2xl border-2 border-red-600 w-full max-w-sm"
        >
          <h2 className="text-3xl font-black mb-8 text-center text-white italic uppercase tracking-tighter">CONTROL ADMIN</h2>
          <input 
            type="password" 
            placeholder="CONTRASEÑA"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl mb-6 focus:border-yellow-500 outline-none text-white font-bold"
          />
          <button className="w-full bg-red-600 text-white py-4 rounded-xl font-black hover:bg-red-700 transition-all uppercase">
            ENTRAR
          </button>
          <Link to="/" className="block text-center mt-6 text-gray-500 hover:text-white text-sm font-bold uppercase underline">SALIR</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-2 md:p-4">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b-2 border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">PEDIDOS RECIBIDOS</h1>
          <p className="text-yellow-500 font-bold">PANEL DE GESTIÓN EN VIVO</p>
        </div>
        <div className="flex gap-6 items-center">
          <button 
            onClick={clearOrders}
            className="text-gray-500 hover:text-red-500 text-xs font-black uppercase tracking-widest"
          >
            LIMPIAR HISTORIAL
          </button>
          <Link to="/" className="bg-gray-800 text-white px-6 py-2 rounded-xl font-black hover:bg-white hover:text-black transition-all text-sm uppercase">
            CERRAR SESIÓN
          </Link>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="text-center py-32 bg-gray-900 rounded-3xl border-4 border-dashed border-gray-800">
          <PackageCheck className="mx-auto text-gray-800 mb-4" size={80} />
          <p className="text-gray-600 text-xl font-black uppercase tracking-widest">Esperando pedidos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              className={cn(
                "p-6 rounded-2xl border-4 transition-all duration-300 relative overflow-hidden flex flex-col",
                order.status === 'confirmed' && "bg-yellow-500/10 border-yellow-500 shadow-yellow-500/20",
                order.status === 'delivered' && "bg-green-500/10 border-green-500 opacity-60",
                order.status === 'pending' && "bg-gray-900 border-gray-800"
              )}
            >
              {/* Header de la Orden */}
              <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                <div>
                  <h3 className="font-black text-white text-lg uppercase italic tracking-tighter">ORDEN #{order.id.toString().slice(-4)}</h3>
                  <div className="flex items-center gap-2 text-yellow-500 font-black text-xs mt-1">
                    <Phone size={12} />
                    <span>{order.phone || 'SIN TELÉFONO'}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">
                    {new Date(order.id).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-yellow-500 font-black text-xl italic">${order.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Lista de Items */}
              <div className="space-y-4 mb-6 flex-grow">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-black/30 p-3 rounded-xl border border-gray-800">
                    <img 
                      src={item.imagen} 
                      className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/100/333/fff?text=FOOD'; }}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-white text-xs uppercase truncate">{item.nombre}</h4>
                        <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">x{item.quantity}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.sauces?.map(s => (
                          <span key={s} className="text-[8px] font-black uppercase text-yellow-500/70">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botones de Acción */}
              <div className="grid grid-cols-1 gap-3 mt-auto">
                <div className={cn(
                  "inline-block w-full text-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2",
                  order.status === 'confirmed' ? "bg-yellow-500 text-black" : 
                  order.status === 'delivered' ? "bg-green-500 text-white" : "bg-red-600 text-white"
                )}>
                  {order.status === 'confirmed' ? 'CONFIRMADO' : 
                    order.status === 'delivered' ? 'ENTREGADO' : 'PENDIENTE'}
                </div>

                {order.status === 'pending' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black hover:bg-yellow-600 transition-all uppercase tracking-tighter shadow-lg shadow-yellow-900/20"
                  >
                    CONFIRMAR
                  </button>
                )}
                
                {order.status === 'confirmed' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-black hover:bg-green-700 transition-all uppercase tracking-tighter flex items-center justify-center gap-2"
                  >
                    <PackageCheck size={20} />
                    ENTREGADO
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div className="text-center text-green-500 font-black py-3 uppercase italic tracking-widest border-2 border-green-500 rounded-xl">
                    ✓ LISTO
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- APP ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

