import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, Mail, MapPin, Leaf, ArrowRight, Share2, Calendar, 
  ShieldCheck, LayoutDashboard, ShoppingCart, User, LogOut,
  TrendingUp, Package, AlertCircle, Search, Filter,
  CheckCircle2, Clock, Map as MapIcon, Menu, X,
  Calculator, DollarSign, Users, Briefcase, Plus, Save, Edit2,
  Trash2, ArrowLeft, Lock, Eye, EyeOff
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Tab = "home" | "login" | "signup" | "dashboard" | "products" | "profile" | "accounting" | "employees" | "admin_center";

// --- Mock Data ---
const DASHBOARD_DATA = [
  { name: 'Jan', procurement: 4000, distribution: 2400 },
  { name: 'Feb', procurement: 3000, distribution: 3200 },
  { name: 'Mar', procurement: 5000, distribution: 4800 },
  { name: 'Apr', procurement: 4780, distribution: 5508 },
  { name: 'May', procurement: 5890, distribution: 5200 },
  { name: 'Jun', procurement: 6390, distribution: 6800 },
];

const PRODUCTS = [
  { id: 1, name: "Premium Red Potatoes", price: "৳1,450", unit: "per sack (50kg)", category: "Groceries", stock: "45 Sacks", image: "https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?q=80&w=400&auto=format&fit=crop" },
  { id: 2, name: "Nashik Onions", price: "৳2,800", unit: "per quintal", category: "Groceries", stock: "12 Quintals", image: "https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=400&auto=format&fit=crop" },
  { id: 3, name: "Deshi Garlic", price: "৳850", unit: "per basket", category: "Spices", stock: "120 Baskets", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?q=80&w=400&auto=format&fit=crop" },
  { id: 4, name: "Fresh Ginger", price: "৳1,200", unit: "per crate", category: "Spices", stock: "34 Crates", image: "https://images.unsplash.com/photo-1599249300675-939f130027f3?q=80&w=400&auto=format&fit=crop" },
  { id: 5, name: "Green Chili", price: "৳3,400", unit: "per bag", category: "Vegetables", stock: "15 Bags", image: "https://images.unsplash.com/photo-1590779033100-9f60705a6382?q=80&w=400&auto=format&fit=crop" },
  { id: 6, name: "Hybrid Tomatoes", price: "৳1,100", unit: "per crate", category: "Groceries", stock: "64 Crates", image: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?q=80&w=400&auto=format&fit=crop" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccountantMode, setIsAccountantMode] = useState(false);
  const [autoCalculateEarnings, setAutoCalculateEarnings] = useState(true);

  // General App State
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("agronext_users");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: "Hafijul", number: "01711000000", username: "haf1j", password: "agronext.me", role: "admin" },
      { id: 2, name: "Hasan", number: "01811000000", username: "hasan", password: "agronext.me", role: "admin" }
    ];
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("agronext_currentUser");
    if (saved) return JSON.parse(saved);
    return null;
  }); // To store current logged in user
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupNumber, setSignupNumber] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem("agronext_employees");
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: "Abdul Ali", phone: "01711000000", role: "Driver", salary: 15000 },
      { id: 2, name: "Rahim Mia", phone: "01811000000", role: "Warehouse Manager", salary: 20000 },
    ];
  });

  const [newEmployee, setNewEmployee] = useState({ name: "", phone: "", role: "", salary: 0 });

  // Accounting State
  const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem("agronext_metrics");
    if (saved) return JSON.parse(saved);
    return {
      revenue: 1450000,
      cost: 820000,
      salary: 150000,
      orderCount: 1420,
      employeeCount: 24,
      earning: 480000 // Can be manual or auto-calculated
    };
  });

  const handleMetricChange = (field: keyof typeof metrics, value: string) => {
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
        return; // Prevent negative numbers
    }
    setMetrics(prev => {
        const next = { ...prev, [field]: numValue };
        if (autoCalculateEarnings && (field === 'revenue' || field === 'cost' || field === 'salary')) {
             next.earning = next.revenue - next.cost - next.salary;
        }
        return next;
    });
  };

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem("agronext_inventory");
    if (saved) return JSON.parse(saved);
    return PRODUCTS;
  });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "per item", category: "", stock: "", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop" });
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem("agronext_companyLogo");
  });

  // Effects to sync state
  useEffect(() => { localStorage.setItem("agronext_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("agronext_employees", JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem("agronext_metrics", JSON.stringify(metrics)); }, [metrics]);
  useEffect(() => { localStorage.setItem("agronext_inventory", JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { 
    if (companyLogo) localStorage.setItem("agronext_companyLogo", companyLogo);
    else localStorage.removeItem("agronext_companyLogo");
  }, [companyLogo]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem("agronext_currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("agronext_currentUser");
  }, [currentUser]);

  const handleUpdateProduct = (id: number, field: string, value: string) => {
    setInventory(inventory.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddProduct = () => {
     if (!newProduct.name || !newProduct.category) return;
     const newId = inventory.length ? Math.max(...inventory.map(p => p.id)) + 1 : 1;
     setInventory([...inventory, { id: newId, ...newProduct }]);
     setNewProduct({ name: "", price: "", unit: "per item", category: "", stock: "", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop" });
  };

  const handleRemoveProduct = (id: number) => {
     setInventory(inventory.filter(p => p.id !== id));
  };

  const contactInfo = {
    name: currentUser ? currentUser.name : "Guest",
    phone: "+880 16 10 678 109",
    email: "agronextbd.official.com",
    address: "272/3, East Nakhal Para, Tejgaon, Dhaka",
    join: "20/01/2026",
    expire: "21/01/2028"
  };

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
        activeTab === id 
          ? "bg-green-600 text-white shadow-lg shadow-green-200" 
          : "text-slate-500 hover:bg-green-50 hover:text-green-600"
      )}
    >
      <Icon className={cn("h-5 w-5", activeTab === id ? "text-white" : "text-slate-400 group-hover:text-green-500")} />
      {label}
    </button>
  );

  const Logo = ({ className }: { className?: string }) => (
    companyLogo ? (
      <img src={companyLogo} alt="AgroNext Logo" className={cn("object-contain rounded-lg", className)} />
    ) : (
      <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 C 65 15, 60 45, 50 60 C 40 45, 35 15, 50 15 Z" fill="#84CC16" />
        <path d="M45 55 C 10 50, 15 85, 45 90 C 55 85, 55 65, 45 55 Z" fill="#22A34A" />
        <path d="M55 55 C 90 50, 85 85, 55 90 C 45 85, 45 65, 55 55 Z" fill="#15803d" />
        <path d="M50 55 Q 50 90 45 100" stroke="#15803d" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </svg>
    )
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-green-900">AgroNext</h1>
            <p className="text-[10px] font-bold tracking-widest uppercase text-green-600 leading-none">Bangladesh</p>
          </div>
        </div>

        <nav className="space-y-3 flex-1">
          <NavItem id="home" icon={Leaf} label="Main Page" />
          <NavItem id="products" icon={ShoppingCart} label="Products" />
          {currentUser && (
            <>
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="profile" icon={User} label="My Profile" />
            </>
          )}
          {currentUser?.role === "admin" && (
            <>
              <NavItem id="accounting" icon={Calculator} label="Accounting Portal" />
              <NavItem id="employees" icon={Users} label="Employees" />
              <NavItem id="admin_center" icon={ShieldCheck} label="Admin Center" />
            </>
          )}
        </nav>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="rounded-2xl bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                 {currentUser ? currentUser.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="text-xs font-bold text-green-800">{contactInfo.name}</p>
                <p className="text-[10px] text-green-600 font-medium">{currentUser?.role === "admin" ? "Accountant Admin" : (currentUser ? "Standard Member" : "Not Logged In")}</p>
              </div>
            </div>
            {!currentUser ? (
              <button 
                onClick={() => { setActiveTab("login"); }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-slate-500 transition-colors hover:text-green-600 bg-white shadow-sm"
              >
                <Lock className="h-4 w-4" /> Sign In
              </button>
            ) : (
              <button 
                onClick={() => { 
                  setCurrentUser(null);
                  setActiveTab("home"); 
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-slate-500 transition-colors hover:text-red-500 bg-white shadow-sm"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/80 px-6 backdrop-blur-md lg:hidden border-b border-slate-100">
        <div className="flex items-center gap-2" onClick={() => setActiveTab("home")}>
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold text-green-900">AgroNext</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6 text-slate-600" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 z-[70] flex h-full w-4/5 flex-col bg-white p-6 shadow-2xl lg:hidden max-w-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Logo className="h-10 w-10" />
                  <span className="text-2xl font-bold text-green-900">AgroNext</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="space-y-4 flex-1">
                <NavItem id="home" icon={Leaf} label="Main Page" />
                <NavItem id="products" icon={ShoppingCart} label="Products" />
                {currentUser && (
                  <>
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="profile" icon={User} label="My Profile" />
                  </>
                )}
                {currentUser?.role === "admin" && (
                  <>
                    <NavItem id="accounting" icon={Calculator} label="Accounting Portal" />
                     <NavItem id="employees" icon={Users} label="Employees" />
                     <NavItem id="admin_center" icon={ShieldCheck} label="Admin Center" />
                  </>
                )}
              </nav>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="rounded-2xl bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {currentUser ? currentUser.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-800">{contactInfo.name}</p>
                      <p className="text-[10px] text-green-600 font-medium">{currentUser?.role === "admin" ? "Accountant Admin" : (currentUser ? "Standard Member" : "Not Logged In")}</p>
                    </div>
                  </div>
                  {!currentUser ? (
                    <button 
                      onClick={() => { setActiveTab("login"); setSidebarOpen(false); }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-slate-500 transition-colors hover:text-green-600 bg-white shadow-sm"
                    >
                      <Lock className="h-4 w-4" /> Sign In
                    </button>
                  ) : (
                    <button 
                      onClick={() => { 
                        setCurrentUser(null);
                        setActiveTab("home"); 
                        setSidebarOpen(false); 
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-slate-500 transition-colors hover:text-red-500 bg-white shadow-sm"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="min-h-screen w-full lg:pl-64">
        <div className="mx-auto max-w-7xl pt-24 lg:pt-8 p-6 lg:p-10">
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12 pb-20"
              >
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-green-900 p-10 text-white lg:p-20 shadow-2xl shadow-green-900/20">
                  <div className="relative z-10 max-w-2xl">
                    <motion.span 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-green-400 backdrop-blur-md"
                    >
                      Official Partner
                    </motion.span>
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-4xl font-extrabold leading-[1.1] lg:text-7xl"
                    >
                      Fresh from <span className="text-green-400">Farm to Shop</span>
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-8 text-lg text-green-100/90 leading-relaxed max-w-xl"
                    >
                      AgroNext Bangladesh bridges the gap between local growers and your neighborhood shops. We procure the best harvests directly and deliver them fresh everywhere.
                    </motion.p>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-12 flex flex-wrap gap-4"
                    >
                      <button 
                        onClick={() => setActiveTab("login")}
                        className="group flex items-center gap-2 rounded-2xl bg-green-500 px-8 py-4 font-bold text-white shadow-xl shadow-green-500/20 transition-all hover:bg-green-400 active:scale-95"
                      >
                        Portal Login <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button 
                        onClick={() => setActiveTab("products")}
                        className="rounded-2xl bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                      >
                        Shop Catalog
                      </button>
                    </motion.div>
                  </div>
                  {/* Decorative blobs */}
                  <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-green-700/30 blur-[100px] animate-pulse" />
                  <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-64 w-64 rounded-full bg-green-500/20 blur-[80px]" />
                </div>

                {/* Features Grid */}
                <div className="grid gap-8 md:grid-cols-3">
                  {[
                    { title: "Direct Sourcing", icon: Leaf, color: "bg-green-50 text-green-600", desc: "Buying directly from farmers at fair market prices" },
                    { title: "B2B Distribution", icon: ShoppingCart, color: "bg-blue-50 text-blue-600", desc: "Wholesale delivery to retail shops and supermarkets" },
                    { title: "Quality Logistics", icon: Package, color: "bg-purple-50 text-purple-600", desc: "Temperature controlled transport for maximum freshness" },
                  ].map((feat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -8 }}
                      className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-xl"
                    >
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner", feat.color)}>
                        <feat.icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-slate-900">{feat.title}</h3>
                      <p className="mt-3 text-slate-500 leading-relaxed">{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Section */}
                <div className="mt-20 pt-10 border-t border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">Contact Us</h4>
                      <div className="space-y-2 text-slate-600">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {contactInfo.address}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(contactInfo.phone); alert('Number copied to clipboard!'); }} className="hover:text-green-600 hover:underline cursor-pointer">{contactInfo.phone}</a>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <a href={`mailto:${contactInfo.email}`} className="hover:text-green-600 hover:underline cursor-pointer">{contactInfo.email}</a>
                        </p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-2 justify-start md:justify-end mb-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold text-green-900">AgroNext</span>
                      </div>
                      <p className="text-slate-400 text-sm">© {new Date().getFullYear()} AgroNext Bangladesh.</p>
                      <p className="text-slate-400 text-sm">All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Farm Insight</h2>
                    <p className="text-lg text-slate-500">Live data streaming from your active zones.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      <Calendar className="h-4 w-4" /> Reports
                    </button>
                    <button className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95">
                      Refresh Core
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Procurement", value: "840 Ton", trend: "+12%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Partner Farms", value: "84 Areas", trend: "Active", icon: Leaf, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Retail Clients", value: "342 Shops", trend: "Online", icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Pending Orders", value: "14 Orders", trend: "Check", icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
                  ].map((s, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-100"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", s.bg, s.color)}>
                          <s.icon className="h-6 w-6" />
                        </div>
                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", 
                          s.trend.includes("+") ? "bg-emerald-100 text-emerald-700" : 
                          s.trend === "Check" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {s.trend}
                        </span>
                      </div>
                      <h4 className="mt-8 text-3xl font-extrabold text-slate-900">{s.value}</h4>
                      <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-bold">Performance Analytics</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" /> Revenue
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-blue-500" /> Yield
                        </div>
                      </div>
                    </div>
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DASHBOARD_DATA}>
                          <defs>
                            <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: "#94a3b8", fontSize: 13, fontWeight: 600}} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: "#94a3b8", fontSize: 13, fontWeight: 600}} 
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#dashboardGradient)" 
                            strokeWidth={4} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="yield" 
                            stroke="#3b82f6" 
                            fillOpacity={0} 
                            strokeWidth={4} 
                            strokeDasharray="8 8"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100 flex flex-col">
                    <h3 className="text-2xl font-bold mb-8">System Health</h3>
                    <div className="flex-1 space-y-6">
                      {[
                        { title: "Procurement Hub", status: "Operational", color: "text-emerald-500", progress: 100 },
                        { title: "Fleet Management", status: "Active", color: "text-emerald-500", progress: 92 },
                        { title: "Inventory Level", status: "Stable", color: "text-blue-500", progress: 65 },
                        { title: "Order Fulfillment", status: "Processing", color: "text-indigo-500", progress: 84 },
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-700">{item.title}</span>
                            <span className={item.color}>{item.status}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={cn("h-full rounded-full", item.color.replace('text', 'bg'))} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 rounded-[2rem] bg-slate-900 p-6 text-white overflow-hidden relative">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Uptime</span>
                       <p className="mt-2 text-3xl font-extrabold">99.98%</p>
                       <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div 
                key="products"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10 pb-20"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Supply Catalog</h2>
                    <p className="text-lg text-slate-500">Fresh wholesale inventory sourced from partner farms.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search inventory..." 
                        className="w-full sm:w-72 rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                      />
                    </div>
                    <button className="flex h-14 w-full sm:w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                      <Filter className="h-5 w-5" />
                    </button>
                    <button className="flex h-14 w-full sm:w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95">
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {inventory.map((p, i) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -8 }}
                      className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-2xl"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute left-6 top-6">
                           <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-900 backdrop-blur-md shadow-sm">
                             {p.category}
                           </span>
                        </div>
                        <div className="absolute bottom-0 h-24 w-full bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <div className="flex flex-1 flex-col p-8">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">{p.name}</h4>
                          <div className="text-right">
                             <span className="text-2xl font-black text-green-600 block">{p.price}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{p.unit}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500 font-medium">Stock: {p.stock}</p>
                        <div className="mt-4 flex items-center gap-2">
                           <div className="flex -space-x-2">
                              {[1, 2, 3].map(j => (
                                <div key={j} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${j + p.id}`} alt="Shop Owner" />
                                </div>
                              ))}
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplied to 1k+ shops</span>
                        </div>
                        <div className="mt-auto pt-8">
                           <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98]">
                             Wholesale Order <ArrowRight className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "accounting" && currentUser?.role === "admin" && (
              <motion.div 
                key="accounting"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Accountant Portal</h2>
                  <p className="mt-2 text-lg text-slate-500">Manage financial records, stock levels, sales numbers, and company expenses.</p>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Financial Overview</h3>
                    </div>
                  </div>
                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><DollarSign className="h-4 w-4"/> Total Revenue</label>
                       <input 
                         type="number" 
                         value={metrics.revenue} 
                         min="0"
                         onChange={(e) => handleMetricChange('revenue', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><MapIcon className="h-4 w-4"/> Total Cost</label>
                       <input 
                         type="number" 
                         value={metrics.cost} 
                         min="0"
                         onChange={(e) => handleMetricChange('cost', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Users className="h-4 w-4"/> Member Salary</label>
                       <input 
                         type="number" 
                         value={metrics.salary} 
                         min="0"
                         onChange={(e) => handleMetricChange('salary', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2 relative">
                       <div className="flex justify-between items-end">
                           <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500"/> Net Earnings</label>
                           <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer mb-1">
                               <input type="checkbox" checked={autoCalculateEarnings} onChange={(e) => {
                                   setAutoCalculateEarnings(e.target.checked);
                                   if (e.target.checked) {
                                       setMetrics(m => ({ ...m, earning: m.revenue - m.cost - m.salary }));
                                   }
                               }} className="accent-emerald-500 w-3 h-3" />
                               AUTO
                           </label>
                       </div>
                       <input 
                         type="number" 
                         value={metrics.earning} 
                         min="0"
                         disabled={autoCalculateEarnings}
                         onChange={(e) => handleMetricChange('earning', e.target.value)}
                         className="w-full rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 px-6 py-4 text-xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ShoppingCart className="h-4 w-4"/> Order Count</label>
                       <input 
                         type="number" 
                         value={metrics.orderCount} 
                         min="0"
                         onChange={(e) => handleMetricChange('orderCount', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User className="h-4 w-4"/> Employee Count</label>
                       <input 
                         type="number" 
                         value={metrics.employeeCount} 
                         min="0"
                         onChange={(e) => handleMetricChange('employeeCount', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500 transition-all focus:bg-white"
                       />
                    </div>
                  </div>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Add New Product</h3>
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                    <input 
                      type="text" placeholder="Product Name" 
                      value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="text" placeholder="Category" 
                      value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="text" placeholder="Price (e.g. ৳1,450)" 
                      value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewProduct({...newProduct, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                  <div className="flex justify-start">
                    <button 
                      onClick={handleAddProduct}
                      className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
                    >
                      <Plus className="h-5 w-5" /> Add Product
                    </button>
                  </div>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Inventory & Product Pricing</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-400">
                           <th className="pb-4 pt-2">Product Name</th>
                           <th className="pb-4 pt-2">Category</th>
                           <th className="pb-4 pt-2">Pricing</th>
                           <th className="pb-4 pt-2">Stock Level</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {inventory.map(item => (
                           <tr key={item.id} className="group">
                             <td className="py-4">
                               <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                   <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                 </div>
                                 <input 
                                   type="text" 
                                   value={item.name}
                                   onChange={(e) => handleUpdateProduct(item.id, 'name', e.target.value)}
                                   className="font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-green-500 outline-none w-full"
                                 />
                               </div>
                             </td>
                             <td className="py-4 font-medium text-slate-500">{item.category}</td>
                             <td className="py-4">
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="text" 
                                   value={item.price}
                                   onChange={(e) => handleUpdateProduct(item.id, 'price', e.target.value)}
                                   className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                                 />
                               </div>
                             </td>
                             <td className="py-4">
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="text" 
                                   value={item.stock}
                                   onChange={(e) => handleUpdateProduct(item.id, 'stock', e.target.value)}
                                   className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                                 />
                               </div>
                             </td>
                             <td className="py-4">
                               <button 
                                 onClick={() => handleRemoveProduct(item.id)}
                                 className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                  <div className="mt-8 flex justify-end items-center">
                    <button 
                      onClick={() => setActiveTab("products")}
                      className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Save and Check
                    </button>
                  </div>
                </div>

              </motion.div>
            )}


            {activeTab === "employees" && currentUser?.role === "admin" && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Employees</h2>
                  <p className="mt-2 text-lg text-slate-500">Manage your company's staff and their salaries.</p>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Add New Employee</h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <input 
                      type="text" placeholder="Name" 
                      value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="text" placeholder="Phone Number" 
                      value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="text" placeholder="Role" 
                      value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input 
                      type="number" placeholder="Salary" 
                      value={newEmployee.salary || ""} onChange={e => setNewEmployee({...newEmployee, salary: Number(e.target.value)})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if(newEmployee.name) {
                        setEmployees([...employees, { id: Date.now(), ...newEmployee }]);
                        setNewEmployee({ name: "", phone: "", role: "", salary: 0 });
                      }
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Add Employee
                  </button>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-4 pt-2">Name</th>
                          <th className="pb-4 pt-2">Phone</th>
                          <th className="pb-4 pt-2">Role</th>
                          <th className="pb-4 pt-2">Salary</th>
                          <th className="pb-4 pt-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employees.map(emp => (
                          <tr key={emp.id} className="group">
                            <td className="py-4">
                              <input 
                                type="text"
                                value={emp.name}
                                onChange={e => setEmployees(employees.map(x => x.id === emp.id ? { ...x, name: e.target.value } : x))}
                                className="w-full bg-transparent font-bold text-slate-900 outline-none border-b border-transparent focus:border-green-500"
                              />
                            </td>
                            <td className="py-4">
                              <input 
                                type="text"
                                value={emp.phone}
                                onChange={e => setEmployees(employees.map(x => x.id === emp.id ? { ...x, phone: e.target.value } : x))}
                                className="w-full bg-transparent font-medium text-slate-500 outline-none border-b border-transparent focus:border-green-500"
                              />
                            </td>
                            <td className="py-4">
                              <input 
                                type="text"
                                value={emp.role}
                                onChange={e => setEmployees(employees.map(x => x.id === emp.id ? { ...x, role: e.target.value } : x))}
                                className="w-full bg-transparent font-medium text-slate-500 outline-none border-b border-transparent focus:border-green-500"
                              />
                            </td>
                            <td className="py-4 flex items-center gap-1 font-bold text-green-600">
                              <span>৳</span>
                              <input 
                                type="number"
                                value={emp.salary}
                                onChange={e => setEmployees(employees.map(x => x.id === emp.id ? { ...x, salary: Number(e.target.value) } : x))}
                                className="w-full bg-transparent outline-none border-b border-transparent focus:border-green-500"
                              />
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setEmployees(employees.filter(e => e.id !== emp.id))}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "login" && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex items-center justify-center min-h-[70vh]"
              >
                <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 ring-1 ring-slate-100 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6 text-green-600">
                    <User className="h-8 w-8" />
                  </div>
                  
                  {forgotPasswordStep === 0 ? (
                    <>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
                      <p className="text-slate-500 mb-8">Sign in to your dashboard</p>
                      
                      {errorMsg && <p className="text-rose-500 text-sm font-bold bg-rose-50 py-2 rounded-xl mb-6">{errorMsg}</p>}

                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                          <input 
                            type="text" 
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-bold text-slate-700 mb-1 flex justify-between">
                            Password
                            <button 
                              tabIndex={-1}
                              onClick={() => {
                                setErrorMsg("");
                                setForgotPasswordStep(1);
                                setForgotUsername("");
                                setForgotOtp("");
                                setForgotNewPassword("");
                              }} 
                              className="text-green-600 font-bold hover:underline"
                            >
                              Forgot Password?
                            </button>
                          </label>
                          <input 
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-medium outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-4 top-[34px] text-slate-400 hover:text-slate-600"
                          >
                            {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            const user = users.find(u => u.username === loginUsername && u.password === loginPassword);
                            if (user) {
                              setCurrentUser(user);
                              setErrorMsg("");
                              setLoginUsername("");
                              setLoginPassword("");
                              setActiveTab("dashboard");
                            } else {
                              setErrorMsg("Invalid username or password");
                            }
                          }}
                          className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                        >
                          Sign In
                        </button>
                        <div className="text-center mt-6">
                          <p className="text-sm text-slate-500 font-medium">
                            Don't have an account?{" "}
                            <button onClick={() => { setErrorMsg(""); setActiveTab("signup"); }} className="text-green-600 font-bold hover:underline">
                              Sign Up
                            </button>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reset Password</h2>
                      <p className="text-slate-500 mb-8">Follow the steps to recover your access</p>
                      
                      {errorMsg && <p className="text-rose-500 text-sm font-bold bg-rose-50 py-2 rounded-xl mb-6">{errorMsg}</p>}

                      <div className="space-y-4 text-left">
                        {forgotPasswordStep === 1 && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Enter Username</label>
                              <input 
                                type="text" 
                                value={forgotUsername}
                                onChange={e => setForgotUsername(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const user = users.find(u => u.username === forgotUsername);
                                if (user) {
                                  setErrorMsg("");
                                  setForgotPasswordStep(2);
                                  // In a real app we would send the OTP to their number here
                                  alert(`(Simulation) OTP sent to registered number: ${user.number}`);
                                } else {
                                  setErrorMsg("Username not found");
                                }
                              }}
                              className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Send OTP
                            </button>
                          </motion.div>
                        )}

                        {forgotPasswordStep === 2 && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Enter 4-Digit OTP</label>
                              <input 
                                type="text" 
                                maxLength={4}
                                placeholder="1234"
                                value={forgotOtp}
                                onChange={e => setForgotOtp(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium tracking-widest text-center outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (forgotOtp.length === 4) {
                                  setErrorMsg("");
                                  setForgotPasswordStep(3);
                                } else {
                                  setErrorMsg("Please enter a valid 4-digit OTP");
                                }
                              }}
                              className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Verify OTP
                            </button>
                          </motion.div>
                        )}

                        {forgotPasswordStep === 3 && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="relative">
                              <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                              <input 
                                type={showLoginPassword ? "text" : "password"}
                                value={forgotNewPassword}
                                onChange={e => setForgotNewPassword(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-medium outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-4 top-[34px] text-slate-400 hover:text-slate-600"
                              >
                                {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                if (forgotNewPassword.length < 3) {
                                  setErrorMsg("Password must be at least 3 characters");
                                  return;
                                }
                                setUsers(users.map(u => u.username === forgotUsername ? { ...u, password: forgotNewPassword } : u));
                                setForgotPasswordStep(0);
                                setForgotUsername("");
                                setForgotOtp("");
                                setForgotNewPassword("");
                                setErrorMsg("");
                                alert("Password upgraded successfully! You can now sign in.");
                              }}
                              className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Update Password
                            </button>
                          </motion.div>
                        )}

                        <div className="text-center mt-6">
                          <button onClick={() => { setErrorMsg(""); setForgotPasswordStep(0); setForgotUsername(""); setForgotOtp(""); setForgotNewPassword(""); }} className="text-slate-400 font-bold hover:text-slate-600 text-sm">
                            Cancel & Return to Login
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "signup" && (
              <motion.div 
                key="signup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex items-center justify-center min-h-[70vh]"
              >
                <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 ring-1 ring-slate-100 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6 text-blue-600">
                    <User className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create Account</h2>
                  <p className="text-slate-500 mb-8">Join AgroNext portal</p>
                  
                  {errorMsg && <p className="text-rose-500 text-sm font-bold bg-rose-50 py-2 rounded-xl mb-6">{errorMsg}</p>}

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={signupNumber}
                        onChange={e => setSignupNumber(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                      <input 
                        type="text" 
                        value={signupUsername}
                        onChange={e => setSignupUsername(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                      <input 
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-4 top-[34px] text-slate-400 hover:text-slate-600"
                      >
                        {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
                      <input 
                        type={showSignupPassword ? "text" : "password"}
                        value={signupConfirm}
                        onChange={e => setSignupConfirm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!signupName || !signupNumber || signupUsername.length < 3 || signupPassword.length < 3) {
                          setErrorMsg("Please fill all fields and ensure username/password are at least 3 characters");
                          return;
                        }
                        if (signupPassword !== signupConfirm) {
                          setErrorMsg("Passwords do not match");
                          return;
                        }
                        if (users.find(u => u.username === signupUsername)) {
                          setErrorMsg("Username already exists");
                          return;
                        }
                        setUsers([...users, { id: Date.now(), name: signupName, number: signupNumber, username: signupUsername, password: signupPassword, role: "user" }]);
                        setSignupName("");
                        setSignupNumber("");
                        setSignupUsername("");
                        setSignupPassword("");
                        setSignupConfirm("");
                        setErrorMsg("");
                        setActiveTab("login");
                      }}
                      className="mt-4 w-full flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Sign Up
                    </button>
                    <div className="text-center mt-6">
                      <p className="text-sm text-slate-500 font-medium">
                        Already have an account?{" "}
                        <button onClick={() => { setErrorMsg(""); setActiveTab("login"); }} className="text-blue-600 font-bold hover:underline">
                          Log In
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "profile" && currentUser && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
                  <p className="mt-2 text-lg text-slate-500">View and update your personal information.</p>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100 max-w-2xl mx-auto">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Personal Details</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={currentUser.name}
                        onChange={e => {
                          const newName = e.target.value;
                          setUsers(users.map(u => u.id === currentUser.id ? { ...u, name: newName } : u));
                          setCurrentUser({ ...currentUser, name: newName });
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                      <input 
                        type="text" 
                        value={currentUser.number}
                        onChange={e => {
                          const newNumber = e.target.value;
                          setUsers(users.map(u => u.id === currentUser.id ? { ...u, number: newNumber } : u));
                          setCurrentUser({ ...currentUser, number: newNumber });
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                      <input 
                        type="text" 
                        value={currentUser.username}
                        disabled
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-medium text-slate-500 cursor-not-allowed outline-none"
                      />
                      <p className="mt-2 text-xs text-slate-400 font-medium">Username cannot be changed after registration.</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={() => alert("Profile updated successfully!")}
                        className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-5 w-5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "admin_center" && currentUser?.role === "admin" && (
              <motion.div 
                key="admin_center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Center</h2>
                  <p className="mt-2 text-lg text-slate-500">Manage user access and administrative roles.</p>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">User Management</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-4 pt-2">Full Name</th>
                          <th className="pb-4 pt-2">Username</th>
                          <th className="pb-4 pt-2">Phone</th>
                          <th className="pb-4 pt-2">Role</th>
                          <th className="pb-4 pt-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                          <tr key={u.id} className="group">
                            <td className="py-4 font-bold text-slate-900">{u.name}</td>
                            <td className="py-4 font-medium text-slate-500">@{u.username}</td>
                            <td className="py-4 font-medium text-slate-500">{u.number}</td>
                            <td className="py-4 font-medium">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                u.role === "admin" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                              )}>
                                {u.role === "admin" ? "Administrator" : "Standard User"}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => {
                                  if (u.username === "haf1j" || u.username === "hasan") return; // Keep main admins
                                  setUsers(users.map(user => user.id === u.id ? { ...user, role: user.role === "admin" ? "user" : "admin" } : user));
                                }}
                                disabled={u.username === "haf1j" || u.username === "hasan"}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4">
                    <select 
                      className="w-full md:w-auto flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-green-500" 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        
                        if (val.startsWith('emp-')) {
                          const empId = Number(val.replace('emp-', ''));
                          const emp = employees.find(e => e.id === empId);
                          if (emp) {
                            // Check if they already have an account based on phone number
                            const existingUser = users.find(u => u.number === emp.phone);
                            if (existingUser) {
                              setUsers(users.map(u => u.id === existingUser.id ? {...u, role: "admin"} : u));
                            } else {
                              // Gen default username based on name
                              const tempUsername = emp.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100);
                              setUsers([...users, { id: Date.now(), name: emp.name, number: emp.phone, username: tempUsername, password: 'password123', role: 'admin' }]);
                              alert(`Created new admin account for ${emp.name}.\nUsername: ${tempUsername}\nPassword: password123`);
                            }
                          }
                        } else {
                          setUsers(users.map(u => u.username === val ? {...u, role: "admin"} : u));
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">Select a user or employee down below to make them an administrator...</option>
                      <optgroup label="Registered Users">
                        {users.filter(u => u.role !== "admin").map(u => (
                          <option key={'u-'+u.id} value={u.username}>{u.name} ({u.username})</option>
                        ))}
                      </optgroup>
                      <optgroup label="Employees">
                        {employees.map(e => (
                          <option key={'emp-'+e.id} value={`emp-${e.id}`}>{e.name} - {e.role}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Platform Settings</h3>
                    <p className="text-slate-500">Update global platform configurations.</p>
                  </div>
                  
                  <div className="max-w-xl">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Logo</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={companyLogo || ""}
                          placeholder="https://example.com/logo.png"
                          onChange={e => setCompanyLogo(e.target.value || null)}
                          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button 
                          onClick={() => setCompanyLogo(null)}
                          className="px-6 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-sm font-bold">OR</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCompanyLogo(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>
                    </div>
                    {companyLogo && (
                      <div className="mt-4 p-4 rounded-2xl border border-slate-200 inline-block bg-slate-50 relative">
                        <img src={companyLogo} alt="Logo Preview" className="h-16 object-contain" />
                      </div>
                    )}
                    <div className="pt-8 flex justify-start">
                      <button 
                        onClick={() => alert("Company logo and platform settings saved successfully!")}
                        className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-5 w-5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button (Always Visible) */}
      <motion.a 
        href="https://wa.me/8801610678109"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[100] flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="h-8 w-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </motion.a>
    </div>
  );
}
