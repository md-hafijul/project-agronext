import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, Mail, MapPin, Leaf, ArrowRight, Share2, Calendar, 
  ShieldCheck, LayoutDashboard, ShoppingCart, User, LogOut,
  TrendingUp, Package, AlertCircle, Search, Filter,
  CheckCircle2, Clock, Map as MapIcon, Menu, X,
  Calculator, DollarSign, Users, Briefcase, Plus, Save, Edit2,
  Trash2, ArrowLeft, Lock, Eye, EyeOff, Upload, LineChart, PackagePlus, RefreshCw, RefreshCcw, ChevronDown, Camera, AlertTriangle, Truck, FileText
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db, initAuth, googleSignIn, getAccessToken, googleSignOut } from "./firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, getDocs, getDoc } from "firebase/firestore";

// --- Utilities ---
const resizeImage = (file: File, callback: (dataUrl: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 400; // Smaller dimensions for firestore compatibility
      const maxHeight = 400;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      callback(canvas.toDataURL("image/png"));
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Tab = "home" | "login" | "signup" | "dashboard" | "products" | "profile" | "accounting" | "employees" | "admin_center" | "restock" | "orders" | "shops" | "deliveries" | "history" | "analytics";

type DialogType = 'alert' | 'confirm' | 'prompt';
interface DialogConfig {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (val?: string) => void;
  onCancel?: () => void;
}

// --- Mock Data ---

const PRODUCTS = [
  { id: 1, name: "Premium Red Potatoes", price: "৳1,450", unit: "per sack (50kg)", category: "Groceries", stock: "45 Sacks", image: "https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?q=80&w=400&auto=format&fit=crop" },
  { id: 2, name: "Nashik Onions", price: "৳2,800", unit: "per quintal", category: "Groceries", stock: "12 Quintals", image: "https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=400&auto=format&fit=crop" },
  { id: 3, name: "Deshi Garlic", price: "৳850", unit: "per basket", category: "Spices", stock: "120 Baskets", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?q=80&w=400&auto=format&fit=crop" },
  { id: 4, name: "Fresh Ginger", price: "৳1,200", unit: "per crate", category: "Spices", stock: "34 Crates", image: "https://images.unsplash.com/photo-1599249300675-939f130027f3?q=80&w=400&auto=format&fit=crop" },
  { id: 5, name: "Green Chili", price: "৳3,400", unit: "per bag", category: "Vegetables", stock: "15 Bags", image: "https://images.unsplash.com/photo-1590779033100-9f60705a6382?q=80&w=400&auto=format&fit=crop" },
  { id: 6, name: "Hybrid Tomatoes", price: "৳1,100", unit: "per crate", category: "Groceries", stock: "64 Crates", image: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?q=80&w=400&auto=format&fit=crop" },
];

const THEMES = [
  { key: "dark-green", class: "bg-[#15803d]", name: "Dark Green" },
  { key: "forest", class: "bg-[#065f46]", name: "Forest" },
  { key: "light", class: "bg-white border border-slate-300", name: "Light Mode" },
  { key: "dark", class: "bg-slate-800", name: "Dark Mode" },
  { key: "sunset", class: "bg-amber-600", name: "Sunset" },
  { key: "ocean", class: "bg-sky-600", name: "Ocean" },
  { key: "purple", class: "bg-purple-600", name: "Purple" },
  { key: "rose", class: "bg-rose-600", name: "Rose" }
];

const SkeletonLoader = ({ columns = 3 }: { columns?: number }) => (
  <div className="animate-pulse space-y-6 w-full">
    <div className="h-10 bg-slate-200 rounded-xl w-1/3 mb-8"></div>
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: columns * 2 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="w-full h-40 bg-slate-200 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
          </div>
          <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded-full w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function App() {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({ isOpen: false, type: 'alert', title: '', message: '' });

  const customAlert = (message: string, title = "Notification") => {
    setDialogConfig({ isOpen: true, type: 'alert', title, message });
  };

  const customConfirm = (message: string, onConfirm: () => void, title = "Confirm Action") => {
    setDialogConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  const customPrompt = (message: string, defaultValue: string, onConfirm: (val: string) => void, title = "Input Required") => {
    setDialogConfig({ isOpen: true, type: 'prompt', title, message, defaultValue, onConfirm });
  };

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const [activeTab, _setActiveTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    const validTabs: Tab[] = ["home", "login", "signup", "dashboard", "products", "profile", "accounting", "employees", "admin_center", "restock", "orders", "shops", "deliveries", "history", "analytics"];
    return validTabs.includes(hash) ? hash : "home";
  });
  const [tabHistory, setTabHistory] = useState<Tab[]>([activeTab]);

  useEffect(() => {
    window.history.replaceState({ tab: activeTab }, "", `#${activeTab}`);
    const handlePopState = (event: PopStateEvent) => {
      const hash = window.location.hash.replace("#", "") as Tab;
      const validTabs: Tab[] = ["home", "login", "signup", "dashboard", "products", "profile", "accounting", "employees", "admin_center", "restock", "orders", "shops", "deliveries", "history", "analytics"];
      if (event.state && event.state.tab) {
         _setActiveTab(event.state.tab);
         setTabHistory(prev => {
            if (prev.length > 1 && prev[prev.length - 2] === event.state.tab) {
                return prev.slice(0, -1);
            }
            return [...prev, event.state.tab];
         });
      } else {
         if (validTabs.includes(hash)) {
            _setActiveTab(hash);
         } else {
            _setActiveTab("home");
         }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setActiveTab = (tab: Tab) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, "", `#${tab}`);
      _setActiveTab(tab);
      setTabHistory(prev => [...prev, tab]);
    }
  };

  const handleBack = () => {
    if (tabHistory.length > 1) {
      window.history.back();
    } else if (window.history.length > 2) {
      window.history.back();
    } else {
      setActiveTab("home");
    }
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccountantMode, setIsAccountantMode] = useState(false);
  const [autoCalculateEarnings, setAutoCalculateEarnings] = useState(true);

  // General App State
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
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

  const [newEmployee, setNewEmployee] = useState({ name: "", phone: "", role: "", salary: 0 });

  // Dynamic User themes state (persisted per user)
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem("agronext_currentUser");
    const userKey = saved ? JSON.parse(saved).username : "guest";
    return localStorage.getItem(`agronext_theme_${userKey}`) || "dark-green";
  });
  
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileThemeMenuOpen, setIsMobileThemeMenuOpen] = useState(false);

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    const userKey = currentUser ? currentUser.username : "guest";
    localStorage.setItem(`agronext_theme_${userKey}`, newTheme);
  };

  useEffect(() => {
    const userKey = currentUser ? currentUser.username : "guest";
    const savedTheme = localStorage.getItem(`agronext_theme_${userKey}`) || "dark-green";
    setActiveTheme(savedTheme);
  }, [currentUser]);

  // Profile Change Password States
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileShowPassword, setProfileShowPassword] = useState(false);

  // Accounting State
  const [metrics, setMetrics] = useState<any>({
    revenue: 0,
    cost: 0,
    salary: 0,
    orderCount: 0,
    employeeCount: 0,
    earning: 0,
    monthlyData: [],
    dailyData: []
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
        setDoc(doc(db, "singletons", "metrics"), next);
        return next;
    });
  };

  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "per item", category: "", stock: "0 Sacks", image: "", kgPerUnit: "" });
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isRestockDropdownOpen, setIsRestockDropdownOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [archiveDuration, setArchiveDuration] = useState("3");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("All");
  const [employeeZoneFilter, setEmployeeZoneFilter] = useState("All");
  const [editingUserRole, setEditingUserRole] = useState<number | null>(null);
  const [editingZone, setEditingZone] = useState<number | null>(null);
  const [editingPages, setEditingPages] = useState<number | null>(null);
  const [historySubTab, setHistorySubTab] = useState<'general' | 'deliveries'>('general');
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);

  // Lazy data subscription states
  const [needsShops, setNeedsShops] = useState(false);
  const [needsInv, setNeedsInv] = useState(false);
  const [needsOrders, setNeedsOrders] = useState(false);
  const [needsMetrics, setNeedsMetrics] = useState(false);
  const [needsPW, setNeedsPW] = useState(false);
  const [isLoaded, setIsLoaded] = useState({
    shops: false,
    inventory: false,
    orders: false,
    metrics: false,
    pw: false
  });

  useEffect(() => {
    if (currentUser?.zone) {
      setZoneFilter(currentUser.zone);
    }
  }, [currentUser]);
  const [restockProduct, setRestockProduct] = useState<string>("");
  const [restockQuantity, setRestockQuantity] = useState<number | string>("");
  const [restockCost, setRestockCost] = useState<number | string>("");
  const [restockDate, setRestockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyCost, setDailyCost] = useState<number | string>("");
  const [dailyEarning, setDailyEarning] = useState<number | string>("");
  const [orderModal, setOrderModal] = useState<{isOpen: boolean, step: number, product: any, quantity: number | string, sellType: 'unit' | 'kg', shopDetails: any}>({ isOpen: false, step: 1, product: null, quantity: "", sellType: 'unit', shopDetails: { id: "", name: "", ownerName: "", phone: "", address: "", zone: "Gulshan", image: null } });
  const [dashboardTimeRange, setDashboardTimeRange] = useState<string>("lifetime");
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [shopToDelete, setShopToDelete] = useState<any>(null);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState<boolean>(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({ maxInventory: 500, uptimeStart: Date.now() });
  const [workspaceUser, setWorkspaceUser] = useState<any>(null);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  const [workspaceSheetId, setWorkspaceSheetId] = useState("1TEGhRgGbFgKw-6S_nI_ohc6fJE0Q1g_ptA_B9bbrr9Y");

  useEffect(() => {
    setNeedsShops(prev => prev || ["products", "orders", "shops", "deliveries", "accounting", "admin_center"].includes(activeTab) || !!orderModal?.isOpen);
    setNeedsInv(prev => prev || ["products", "restock", "orders", "deliveries", "accounting", "admin_center"].includes(activeTab) || !!orderModal?.isOpen || isCartOpen);
    setNeedsOrders(prev => prev || ["orders", "deliveries", "accounting", "admin_center"].includes(activeTab));
    setNeedsMetrics(prev => prev || ["dashboard", "accounting", "admin_center"].includes(activeTab));
    setNeedsPW(prev => prev || ["admin_center", "employees"].includes(activeTab));
  }, [activeTab, orderModal?.isOpen, isCartOpen]);
  const [workspaceFormId, setWorkspaceFormId] = useState("1Pf2RepP6KaxToyvg3UDXHlWfTjDNnvIettkkAH0lTGI");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleWorkspaceSync = async () => {
    if (!workspaceToken) {
       customAlert("Please sign in to Google Workspace first.");
       return;
    }
    customConfirm("Are you sure you want to sync data? This will update system records and inventory files.", async () => {
      setIsSyncing(true);
      let newSyncCount = 0;
      try {
        if (workspaceSheetId) {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${workspaceSheetId}/values/Sheet1!A2:Z`, {
            headers: { Authorization: `Bearer ${workspaceToken}` }
        });
        if (res.ok) {
           const data = await res.json();
           const rows = data.values || [];
           
           for (const row of rows) {
             const historyId = Date.now() + Math.floor(Math.random() * 100000);
             // Best effort map, assume minimum 3 cols for restock
             if (row.length >= 3) {
                 const idStr = row[0] + "-" + row[1]; // make a semi-unique string
                 if (orders.find(o => String(o.id) === idStr || String(o.id) === String(historyId))) continue;

                 const qty = parseInt(row[2]) || 0;
                 const cost = parseFloat(row[3]) || 0;
                 const newHistoryItem = {
                    id: String(historyId),
                    productId: historyId,
                    productName: row[1] || "Synced Product",
                    type: "restock",
                    userId: "workspace-sync",
                    userName: "Google Sheets Sync",
                    quantity: qty,
                    unitPrice: qty > 0 ? cost / qty : 0,
                    totalPrice: cost,
                    timestamp: row[0] ? new Date(row[0]).toISOString() : new Date().toISOString(),
                    source: "Sheets"
                 };
                 await setDoc(doc(db, "orders", newHistoryItem.id), newHistoryItem);

                 const existingProduct = inventory.find(p => p.name.toLowerCase() === newHistoryItem.productName.toLowerCase());
                 if (existingProduct) {
                    await setDoc(doc(db, "inventory", existingProduct.id.toString()), {
                       ...existingProduct,
                       volume: Number(existingProduct.volume) + qty,
                       stockStatus: (Number(existingProduct.volume) + qty) > 0 ? "In Stock" : "Out of Stock"
                    });
                 }
                 newSyncCount++;
             }
           }
        }
      }

      if (workspaceFormId) {
         const res = await fetch(`https://forms.googleapis.com/v1/forms/${workspaceFormId}/responses`, {
             headers: { Authorization: `Bearer ${workspaceToken}` }
         });
         const schemaRes = await fetch(`https://forms.googleapis.com/v1/forms/${workspaceFormId}`, {
             headers: { Authorization: `Bearer ${workspaceToken}` }
         });

         if (res.ok && schemaRes.ok) {
             const data = await res.json();
             const schema = await schemaRes.json();
             
             const nameQuestionId = schema.items?.find((i: any) => i.title?.toLowerCase().includes("name"))?.questionItem?.question?.questionId;
             const productQuestionId = schema.items?.find((i: any) => i.title?.toLowerCase().includes("product") || i.title?.toLowerCase().includes("item"))?.questionItem?.question?.questionId;
             const qtyQuestionId = schema.items?.find((i: any) => i.title?.toLowerCase().includes("quantity") || i.title?.toLowerCase().includes("qty"))?.questionItem?.question?.questionId;
             const priceQuestionId = schema.items?.find((i: any) => i.title?.toLowerCase().includes("price") || i.title?.toLowerCase().includes("amount") || i.title?.toLowerCase().includes("total"))?.questionItem?.question?.questionId;
             const fileQuestionId = schema.items?.find((i: any) => i.title?.toLowerCase().includes("file") || i.title?.toLowerCase().includes("bill") || i.title?.toLowerCase().includes("upload"))?.questionItem?.question?.questionId || 
                                     schema.items?.find((i: any) => i.questionItem?.question?.fileUploadQuestion)?.questionItem?.question?.questionId;

             for (const response of data.responses || []) {
                const historyId = response.responseId || Date.now().toString();
                if (orders.find((o: any) => o.id === historyId)) continue;
                
                const answers = response.answers || {};
                const getTxt = (qId: string) => answers[qId]?.textAnswers?.answers?.[0]?.value || "";
                
                const purchaserName = nameQuestionId ? getTxt(nameQuestionId) : "Form Submitter";
                const productName = productQuestionId ? getTxt(productQuestionId) : "General Item";
                const qtyVal = qtyQuestionId ? parseInt(getTxt(qtyQuestionId)) : 1;
                const qty = isNaN(qtyVal) ? 1 : qtyVal;
                const priceStr = priceQuestionId ? getTxt(priceQuestionId) : "0";
                const price = parseFloat(priceStr.replace(/[^0-9.-]+/g,"")) || 0;
                
                let fileId = "";
                if (fileQuestionId && answers[fileQuestionId]?.fileUploadAnswers?.answers?.[0]?.fileId) {
                   fileId = answers[fileQuestionId].fileUploadAnswers.answers[0].fileId;
                }

                const newHistoryItem = {
                    id: historyId,
                    productId: historyId,
                    productName: productName,
                    type: "sale",
                    userId: "workspace-sync",
                    userName: "Google Forms Sync",
                    purchaserName: purchaserName,
                    fileId: fileId,
                    quantity: qty,
                    unitPrice: qty > 0 ? price / qty : 0,
                    totalPrice: price,
                    timestamp: response.createTime || new Date().toISOString(),
                    source: "Forms"
                 };

                 await setDoc(doc(db, "orders", newHistoryItem.id), newHistoryItem);

                 const existingProduct = inventory.find(p => p.name.toLowerCase() === newHistoryItem.productName.toLowerCase());
                 if (existingProduct) {
                    await setDoc(doc(db, "inventory", existingProduct.id.toString()), {
                       ...existingProduct,
                       volume: existingProduct.volume > qty ? existingProduct.volume - qty : 0,
                       stockStatus: existingProduct.volume - qty > 0 ? "In Stock" : "Out of Stock"
                    });
                 }
                 newSyncCount++;
             }
         }
      }

      customAlert(`Workspace Sync Completed. ${newSyncCount} new item(s) logged.`);
    } catch(err: any) {
      customAlert("Failed to sync: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  });
};

  useEffect(() => {
    const unsubAuth = initAuth(
      (user, token) => {
        setWorkspaceUser(user);
        setWorkspaceToken(token);
      },
      () => {
        setWorkspaceUser(null);
        setWorkspaceToken(null);
      }
    );
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Effects to sync state
  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, "users"), limit(500)), (snapshot) => {
      let data = snapshot.docs.map(d => d.data()) as any[];
      const defaultAdmins = [
        { id: 1, name: "Hafijul", number: "01711000000", username: "haf1j", password: "agronext.me", role: "admin", status: "approved" },
        { id: 2, name: "Hasan", number: "01811000000", username: "hasan", password: "agronext.me", role: "admin", status: "approved" }
      ];

      defaultAdmins.forEach(admin => {
        const foundIdx = data.findIndex(u => u.username === admin.username);
        if (foundIdx === -1) {
          data.push(admin);
        } else {
          const existing = data[foundIdx];
          if (existing.role !== "admin" || existing.status !== "approved") {
            const updated = { ...existing, role: "admin", status: "approved" };
            data[foundIdx] = updated;
          }
        }
      });
      setUsers(data);
    }, console.error);

    const unsubPlatform = onSnapshot(doc(db, "singletons", "platform"), (snapshot) => {
      if (snapshot.exists()) {
         setCompanyLogo(snapshot.data()?.companyLogo || null);
      } else {
         setCompanyLogo(null);
      }
    }, console.error);

    const unsubConfig = onSnapshot(doc(db, "singletons", "config"), (snapshot) => {
      if (snapshot.exists()) {
         setConfig({ maxInventory: 500, ...snapshot.data() });
      } else {
         setConfig({ maxInventory: 500 });
      }
    }, console.error);

    return () => {
      unsubUsers();
      unsubPlatform();
      unsubConfig();
    };
  }, []);

  useEffect(() => {
    if (!needsShops) return;
    const unsubShops = onSnapshot(query(collection(db, "shops"), limit(500)), (snapshot) => {
      setShops(snapshot.docs.map(d => ({...d.data(), id: d.id, _docId: d.id})));
      setIsLoaded(p => ({ ...p, shops: true }));
    }, console.error);
    return () => unsubShops();
  }, [needsShops]);

  useEffect(() => {
    if (!needsInv) return;
    const unsubInv = onSnapshot(query(collection(db, "inventory"), limit(500)), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      setInventory(data.sort((a: any, b: any) => a.id - b.id) as any[]);
      setIsLoaded(p => ({ ...p, inventory: true }));
    }, console.error);
    return () => unsubInv();
  }, [needsInv]);

  useEffect(() => {
    if (!needsOrders) return;
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc"), limit(300)), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      setOrders(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as any[]);
      setIsLoaded(p => ({ ...p, orders: true }));
    }, console.error);
    return () => unsubOrders();
  }, [needsOrders]);

  useEffect(() => {
    if (!needsPW) return;
    const unsubPasswordRequests = onSnapshot(query(collection(db, "password_requests"), limit(100)), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      setPasswordRequests(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as any[]);
      setIsLoaded(p => ({ ...p, pw: true }));
    }, console.error);
    return () => unsubPasswordRequests();
  }, [needsPW]);

  useEffect(() => {
    if (!needsMetrics) return;
    const unsubMetrics = onSnapshot(doc(db, "singletons", "metrics"), (snapshot) => {
      if (snapshot.exists()) {
         const data = snapshot.data();
         
         if (!data.monthlyData || data.monthlyData.length < 12) {
            const currentData = data.monthlyData || [];
            data.monthlyData = Array.from({ length: 12 }, (_, j) => ({
              name: new Date(0, j).toLocaleString('default', { month: 'short' }),
              cost: 0,
              earning: 0
            })).map((d, i) => {
              if (currentData[i]) return currentData[i];
              return { ...d };
            });
         }
         if (!data.dailyData) {
            data.dailyData = [];
         }
         setMetrics(data);
         setIsLoaded(p => ({ ...p, metrics: true }));
      } else {
         const defaultData = {
            revenue: 0,
            cost: 0,
            salary: 0,
            orderCount: 0,
            employeeCount: 0,
            earning: 0,
            monthlyData: Array.from({ length: 12 }, (_, i) => ({
              name: new Date(0, i).toLocaleString('default', { month: 'short' }),
              cost: 0,
              earning: 0
            })),
            dailyData: []
         };
         setMetrics(defaultData);
         setIsLoaded(p => ({ ...p, metrics: true }));
      }
    }, console.error);

    let backupTimeout: any;

    const unsubBackup = onSnapshot(doc(db, "singletons", "backup"), (snapshot) => {
      if (backupTimeout) clearTimeout(backupTimeout);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBackupData(data); // Unconditionally set backup data
      } else {
        setBackupData(null);
      }
    }, console.error);

    return () => {
      unsubMetrics();
      unsubBackup();
      if (backupTimeout) clearTimeout(backupTimeout);
    }
  }, [needsMetrics]);

  useEffect(() => { 
    if (currentUser) {
       localStorage.setItem("agronext_currentUser", JSON.stringify(currentUser));
       const freshUser = users.find(u => u.id === currentUser.id);
       if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
         setCurrentUser(freshUser);
       }
    } else {
      localStorage.removeItem("agronext_currentUser");
    }
  }, [currentUser, users]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (companyLogo) {
      link.href = companyLogo;
    } else {
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 15 C 65 15, 60 45, 50 60 C 40 45, 35 15, 50 15 Z" fill="%2384CC16" /><path d="M45 55 C 10 50, 15 85, 45 90 C 55 85, 55 65, 45 55 Z" fill="%2322A34A" /><path d="M55 55 C 90 50, 85 85, 55 90 C 45 85, 45 65, 55 55 Z" fill="%2315803d" /></svg>';
    }
  }, [companyLogo]);

  const handleUpdateProduct = (id: number, field: string, value: string) => {
    const updatedInv = inventory.map(p => p.id === id ? { ...p, [field]: value } : p);
    setInventory(updatedInv);
    const item = updatedInv.find(p => p.id === id);
    if(item) setDoc(doc(db, "inventory", item.id.toString()), item);
  };

  const handleAddProduct = () => {
     if (!newProduct.name || !newProduct.category) return;
     const newId = inventory.length ? Math.max(...inventory.map(p => p.id)) + 1 : 1;
     const finalImage = newProduct.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
     
     // Enforce stock to be 0 matching unit
     const selectedUnit = newProduct.stock.replace(/[0-9]+/, '').trim() || 'Sacks'; 
     const finalStock = `0 ${selectedUnit}`;
     
     const item = { ...newProduct, id: newId, stock: finalStock, image: finalImage };
     setDoc(doc(db, "inventory", item.id.toString()), item);
     setNewProduct({ name: "", price: "", unit: "per item", category: "", stock: "0 Sacks", image: "", kgPerUnit: "" });
     setIsAddProductModalOpen(false);
  };

  const handleRemoveProduct = (id: number) => {
     deleteDoc(doc(db, "inventory", id.toString()));
  };

  const contactInfo = {
    name: currentUser ? currentUser.name : "Guest",
    phone: "01611160094",
    email: "agronextbd.official.com",
    address: "272/3, East Nakhal Para, Tejgaon, Dhaka",
    join: "20/01/2026",
    expire: "21/01/2028"
  };

  const hasAccess = (user: any, tab: string) => {
    if (!user) return false;
    if (tab === "profile") return true;
    if (user.role === "admin") return true;
    if (user.role === "employee" && tab === "orders") return true;
    if (user.accessiblePages && user.accessiblePages.length > 0) {
      return user.accessiblePages.includes(tab);
    }
    // Fallback logic for old accounts without accessiblePages
    if (tab === "products") return true;
    if (user.role === "employee" && (tab === "shops" || tab === "dashboard")) return true;
    if (tab === "deliveries") return user.role?.toLowerCase().includes("delivery") || user.jobTitle?.toLowerCase().includes("delivery");
    if (tab === "restock") return user.role?.toLowerCase().includes("supplier") || user.jobTitle?.toLowerCase().includes("supplier") || user.role?.toLowerCase().includes("warehouse") || user.jobTitle?.toLowerCase().includes("warehouse");
    return false;
  };

  const CustomSelect = ({ value, onChange, options, className }: { value: string, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
       <div className={cn("relative", className)}>
          <button
             type="button"
             onClick={() => setIsOpen(!isOpen)}
             className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none hover:bg-slate-50 transition text-left"
          >
             {options.find(o => o.value === value)?.label || value}
             <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
          <AnimatePresence>
             {isOpen && (
                <>
                   <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute top-[110%] left-0 min-w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[90] overflow-hidden"
                   >
                      <div className="max-h-60 overflow-y-auto w-full">
                         {options.map(opt => (
                            <button 
                               key={opt.value}
                               type="button"
                               className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition font-bold text-slate-700 flex items-center justify-between"
                               onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            >
                               {opt.label}
                               {value === opt.value && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </button>
                         ))}
                      </div>
                   </motion.div>
                </>
             )}
          </AnimatePresence>
       </div>
    );
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
    <div data-theme={activeTheme} className="flex min-h-screen font-sans selection:bg-green-100 selection:text-green-900 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col transition-colors duration-300">
        <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-green-900">AgroNext</h1>
            <p className="text-[10px] font-bold tracking-widest uppercase text-green-600 leading-none">Bangladesh</p>
          </div>
        </div>

        <nav className="space-y-3 flex-1">
          <NavItem id="home" icon={Leaf} label="Main Page" />
          <NavItem id="products" icon={ShoppingCart} label="Shop Catalog" />
          {currentUser && currentUser.status !== "pending" && (
            <>
               {hasAccess(currentUser, "shops") && <NavItem id="shops" icon={Briefcase} label="Shop List" />}
               {hasAccess(currentUser, "orders") && <NavItem id="orders" icon={Package} label="History" />}
               {hasAccess(currentUser, "dashboard") && <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />}
               {hasAccess(currentUser, "deliveries") && <NavItem id="deliveries" icon={Truck} label="Delivery Portal" />}
               {hasAccess(currentUser, "restock") && <NavItem id="restock" icon={PackagePlus} label="Restock Inventory" />}
               {hasAccess(currentUser, "profile") && <NavItem id="profile" icon={User} label="My Profile" />}
               {currentUser.role === "admin" && (
                 <>
                   <NavItem id="accounting" icon={Calculator} label="Accounting Portal" />
                   <NavItem id="employees" icon={Users} label="Employees & Roles" />
                   <NavItem id="admin_center" icon={ShieldCheck} label="System Center" />
                 </>
               )}
            </>
          )}
        </nav>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="rounded-2xl bg-green-50 p-4">
            {/* Theme switcher on desktop sidebar */}
            <div className="mb-4 relative">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-green-700 mb-2">Website Theme</p>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="w-full flex items-center justify-between bg-white px-3 py-2 text-sm font-bold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                style={{ backgroundColor: 'var(--theme-input)', color: 'var(--theme-text)', borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded-full shadow-sm", THEMES.find(t => t.key === activeTheme)?.class)} />
                  <span>{THEMES.find(t => t.key === activeTheme)?.name}</span>
                </div>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
                  {THEMES.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => {
                        handleThemeChange(theme.key);
                        setIsThemeMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-slate-50",
                        activeTheme === theme.key ? 'bg-slate-50' : ''
                      )}
                      style={{ color: 'var(--theme-text)', backgroundColor: activeTheme === theme.key ? 'var(--theme-input)' : 'transparent' }}
                    >
                      <div className={cn("h-4 w-4 rounded-full shadow-sm", theme.class)} />
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => { if (currentUser) setActiveTab("profile"); }}
              className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <div className="h-10 w-10 overflow-hidden rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                 {currentUser?.photo ? (
                    <img src={currentUser.photo} className="h-full w-full object-cover" alt="Profile" />
                 ) : (
                    currentUser ? currentUser.name.charAt(0).toUpperCase() : "?"
                 )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-800 truncate">{contactInfo.name}</p>
                <p className="text-[10px] text-green-600 font-medium truncate">{currentUser?.role === "admin" ? "Accountant Admin" : (currentUser ? "Standard Member" : "Not Logged In")}</p>
              </div>
            </button>
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
      <div className="fixed top-0 z-50 flex h-16 w-full items-center justify-between px-4 sm:px-6 shadow-md lg:hidden mobile-header">
        <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <Logo className="h-8 w-8 logo-icon" />
          <span className="text-sm sm:text-lg font-extrabold leading-none logo-text">agronext Bangladesh</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Dynamic Theme Picker - Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMobileThemeMenuOpen(!isMobileThemeMenuOpen)}
              className="flex justify-center items-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
            >
              <div className={cn("h-4 w-4 rounded-full shadow-sm", THEMES.find(t => t.key === activeTheme)?.class)} />
            </button>

            {isMobileThemeMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
                {THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => {
                      handleThemeChange(theme.key);
                      setIsMobileThemeMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-slate-50",
                      activeTheme === theme.key ? 'bg-slate-50' : ''
                    )}
                    style={{ color: 'var(--theme-text)', backgroundColor: activeTheme === theme.key ? 'var(--theme-input)' : 'transparent' }}
                  >
                    <div className={cn("h-4 w-4 rounded-full shadow-sm", theme.class)} />
                    {theme.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2">
            <Menu className="h-6 w-6 menu-icon" />
          </button>
        </div>
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
              className="fixed left-0 top-0 z-[70] flex h-full w-4/5 flex-col bg-white p-6 shadow-2xl lg:hidden max-w-sm overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Logo className="h-10 w-10" />
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-green-900 block leading-none">AgroNext</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-green-600 block leading-none mt-1">Bangladesh</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="space-y-4 flex-1">
                <NavItem id="home" icon={Leaf} label="Main Page" />
                <NavItem id="products" icon={ShoppingCart} label="Shop Catalog" />
                {currentUser && currentUser.status !== "pending" && (
                  <>
                     {hasAccess(currentUser, "shops") && <NavItem id="shops" icon={Briefcase} label="Shop List" />}
                     {hasAccess(currentUser, "orders") && <NavItem id="orders" icon={Package} label="History" />}
                     {hasAccess(currentUser, "dashboard") && <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />}
                     {hasAccess(currentUser, "deliveries") && <NavItem id="deliveries" icon={Truck} label="Delivery Portal" />}
                     {hasAccess(currentUser, "restock") && <NavItem id="restock" icon={PackagePlus} label="Restock Inventory" />}
                     {hasAccess(currentUser, "profile") && <NavItem id="profile" icon={User} label="My Profile" />}
                     {currentUser.role === "admin" && (
                       <>
                         <NavItem id="accounting" icon={Calculator} label="Accounting Portal" />
                         <NavItem id="employees" icon={Users} label="Employees & Roles" />
                         <NavItem id="admin_center" icon={ShieldCheck} label="System Center" />
                       </>
                     )}
                  </>
                )}
              </nav>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="rounded-2xl bg-green-50 p-4">
                  <button 
                    onClick={() => { if (currentUser) { setActiveTab("profile"); setSidebarOpen(false); } }}
                    className="flex items-center gap-3 text-left w-full hover:opacity-80 transition-opacity"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {currentUser?.photo ? (
                         <img src={currentUser.photo} className="h-full w-full object-cover" alt="Profile" />
                      ) : (
                         currentUser ? currentUser.name.charAt(0).toUpperCase() : "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-green-800 truncate">{contactInfo.name}</p>
                      <p className="text-[10px] text-green-600 font-medium truncate">{currentUser?.role === "admin" ? "Accountant Admin" : (currentUser ? "Standard Member" : "Not Logged In")}</p>
                    </div>
                  </button>
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
      <main className="min-h-screen w-full flex flex-col lg:pl-64 relative">
        {activeTab !== "home" && (
          <button
            onClick={handleBack}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/20 transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
            title="Go Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <div className="mx-auto max-w-7xl pt-24 lg:pt-8 p-6 lg:p-10 flex-1 w-full">
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
                      Next Generation <span className="text-green-400">Agriculture</span>
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
                      {!currentUser ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          {currentUser.role === "admin" && (
                             <button onClick={() => setActiveTab("dashboard")} className="group flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-95">Open Dashboard <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" /></button>
                          )}
                          {(currentUser.role !== "admin" && (currentUser.role?.toLowerCase().includes("delivery") || currentUser.jobTitle?.toLowerCase().includes("delivery"))) && (
                             <button onClick={() => setActiveTab("deliveries")} className="group flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-95">Open Deliveries <Truck className="h-5 w-5 transition-transform group-hover:scale-110" /></button>
                          )}
                          {(currentUser.role !== "admin" && (currentUser.role?.toLowerCase().includes("supplier") || currentUser.jobTitle?.toLowerCase().includes("supplier") || currentUser.role?.toLowerCase().includes("warehouse") || currentUser.jobTitle?.toLowerCase().includes("warehouse"))) && (
                             <button onClick={() => setActiveTab("restock")} className="group flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-95">Open Restock <PackagePlus className="h-5 w-5 transition-transform group-hover:scale-110" /></button>
                          )}
                          {(currentUser.role !== "admin" && (currentUser.role?.toLowerCase().includes("sr") || currentUser.jobTitle?.toLowerCase().includes("sr"))) && (
                             <button onClick={() => setActiveTab("products")} className="group flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-95">Open Catalog <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" /></button>
                          )}
                          
                          {(!currentUser.role?.toLowerCase().includes("sr") && !currentUser.jobTitle?.toLowerCase().includes("sr") && !currentUser.role?.toLowerCase().includes("delivery") && !currentUser.jobTitle?.toLowerCase().includes("delivery") && !currentUser.role?.toLowerCase().includes("supplier") && !currentUser.jobTitle?.toLowerCase().includes("supplier") && !currentUser.role?.toLowerCase().includes("warehouse") && !currentUser.jobTitle?.toLowerCase().includes("warehouse")) && currentUser.role !== "admin" && (
                             <button onClick={() => setActiveTab("dashboard")} className="group flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-95">Open Dashboard <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" /></button>
                          )}

                          {(currentUser.role === "admin" || (!currentUser.role?.toLowerCase().includes("sr") && !currentUser.jobTitle?.toLowerCase().includes("sr"))) && (
                            <button 
                              onClick={() => setActiveTab("products")}
                              className="rounded-2xl bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                            >
                              Shop Catalog
                            </button>
                          )}
                        </>
                      )}
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
                          <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} onClick={() => { navigator.clipboard.writeText(contactInfo.phone); customAlert('Number copied to clipboard!'); }} className="hover:text-green-600 hover:underline cursor-pointer">{contactInfo.phone}</a>
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

            {activeTab === "dashboard" && currentUser && currentUser.status !== "pending" && (currentUser.role === "admin" || currentUser.role === "employee") && (
              !isLoaded.metrics ? <SkeletonLoader /> : (
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
                  <div className="flex gap-2 items-center">
                    <CustomSelect 
                       value={dashboardTimeRange}
                       onChange={v => setDashboardTimeRange(v)}
                       options={[
                          { label: "Daily", value: "daily" },
                          { label: "Weekly", value: "weekly" },
                          { label: "Monthly", value: "monthly" },
                          { label: "Yearly", value: "yearly" },
                          { label: "Lifetime", value: "lifetime" }
                       ]}
                       className="w-36"
                    />
                    <button className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      <Calendar className="h-4 w-4" /> Reports
                    </button>
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95">
                      Refresh Core
                    </button>
                  </div>
                </div>

                {(() => {
                  let rev = 0;
                  let cst = 0;
                  let net = 0;
                  let orderCountStats = 0;
                  let cancelledOrdersCountStats = 0;
                  
                  const today = new Date();
                  const todayStr = today.toISOString().split('T')[0];
                  
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
                  
                  const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                  const startOfYearStr = `${today.getFullYear()}-01-01`;

                  if (dashboardTimeRange === "lifetime") {
                      rev = metrics?.revenue || 0;
                      cst = metrics?.cost || 0;
                      net = rev - cst;
                      
                      orderCountStats = metrics?.orderCount || 0;
                      cancelledOrdersCountStats = metrics?.cancelledCount || 0;
                  } else {
                      const daily = metrics?.dailyData || [];
                      
                      let filtered = daily;
                      if (dashboardTimeRange === "daily") {
                          filtered = daily.filter((d: any) => d.date === todayStr);
                      } else if (dashboardTimeRange === "weekly") {
                          filtered = daily.filter((d: any) => d.date >= startOfWeekStr && d.date <= todayStr);
                      } else if (dashboardTimeRange === "monthly") {
                          filtered = daily.filter((d: any) => d.date >= startOfMonthStr && d.date <= todayStr);
                      } else if (dashboardTimeRange === "yearly") {
                          filtered = daily.filter((d: any) => d.date >= startOfYearStr && d.date <= todayStr);
                      }
                      
                      cst = filtered.reduce((acc: number, d: any) => acc + (d.cost || 0), 0);
                      rev = filtered.reduce((acc: number, d: any) => acc + (d.earning || 0), 0);
                      net = rev - cst;
                      
                      orderCountStats = filtered.reduce((acc: number, d: any) => acc + (d.orderCount || 0), 0) || 0;
                      cancelledOrdersCountStats = filtered.reduce((acc: number, d: any) => acc + (d.cancelledCount || 0), 0) || 0;
                  }

                  return (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                      {[
                        { label: "Total Revenue", value: `৳${rev.toLocaleString()}`, trend: "Growing", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Total Cost", value: `৳${cst.toLocaleString()}`, trend: "Active", icon: MapIcon, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Net Earnings", value: `৳${net.toLocaleString()}`, trend: net < 0 ? "Loss" : "Profit", icon: DollarSign, color: net < 0 ? "text-rose-600" : "text-blue-600", bg: net < 0 ? "bg-rose-50" : "bg-blue-50", isNet: true },
                        { label: "Total Order Count", value: `${dashboardTimeRange === "lifetime" ? (metrics?.orderCount || 0) : orderCountStats} Orders`, trend: dashboardTimeRange === "lifetime" ? "Check" : "Active", icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Cancelled Deliveries", value: `${cancelledOrdersCountStats} Deliveries`, trend: "Declined", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
                      ].map((s, i) => (
                        <motion.div 
                          key={`${i}-${s.value}`}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
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
                          <h4 className={cn("mt-8 text-3xl font-extrabold", (s as any).isNet && net < 0 ? "text-rose-600" : "text-slate-900")}>{s.value}</h4>
                          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-bold">Performance Analytics</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" /> Earning
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-rose-500" /> Cost
                        </div>
                      </div>
                    </div>
                    {(() => {
                      let rawData = metrics.monthlyData || Array.from({ length: 12 }, (_, j) => ({
              name: new Date(0, j).toLocaleString('default', { month: 'short' }),
              cost: 0,
              earning: 0
            }));
                      if (dashboardTimeRange !== "lifetime") {
                          const daily = metrics.dailyData || [];
                          const today = new Date();
                          const todayStr = today.toISOString().split('T')[0];
                          
                          const startOfWeek = new Date(today);
                          startOfWeek.setDate(today.getDate() - today.getDay());
                          const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
                          
                          const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                          const startOfYearStr = `${today.getFullYear()}-01-01`;
                          
                          if (dashboardTimeRange === "daily") {
                              const last7Days = daily.slice(-7);
                              rawData = last7Days;
                          } else if (dashboardTimeRange === "weekly") {
                              rawData = daily.filter((d: any) => d.date >= startOfWeekStr && d.date <= todayStr);
                          } else if (dashboardTimeRange === "monthly") {
                              rawData = daily.filter((d: any) => d.date >= startOfMonthStr && d.date <= todayStr);
                          } else if (dashboardTimeRange === "yearly") {
                              rawData = daily.filter((d: any) => d.date >= startOfYearStr && d.date <= todayStr);
                          }
                      }
                      
                      const chartData = rawData.map((d: any) => ({
                        ...d,
                        name: dashboardTimeRange === "daily" ? d.name : (d.date ? d.date.split('-').slice(1).join('/') : d.name),
                        profit: (d.earning || 0) - (d.cost || 0)
                      }));
                      
                      const dataMax = Math.max(...chartData.map(d => d.profit), 1);
                      const dataMin = Math.min(...chartData.map(d => d.profit), -1);
                      const off = dataMax <= 0 ? 0 : dataMin >= 0 ? 1 : dataMax / (dataMax - dataMin);

                      return (
                        <div className="h-96 w-full" style={{ minWidth: 10, minHeight: 10 }}>
                          <ResponsiveContainer width="100%" height={384}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={off} stopColor="#3b82f6" stopOpacity={0.8}/>
                                  <stop offset={off} stopColor="#ec4899" stopOpacity={0.8}/>
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
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#000000' }}
                                itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="profit" 
                                name="Net Earnings"
                                stroke="url(#splitColor)" 
                                fillOpacity={1} 
                                fill="url(#splitColor)" 
                                strokeWidth={4} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 mt-8 mb-8">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-bold">Daily Analytics</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" /> Earning
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <div className="h-3 w-3 rounded-full bg-rose-500" /> Cost
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const chartData = [];
                      const todayDate = new Date();
                      for (let i = 13; i >= 0; i--) {
                        const d = new Date(todayDate);
                        d.setDate(todayDate.getDate() - i);
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = (metrics.dailyData || []).find((x: any) => x.date === dateStr);
                        chartData.push({
                           shortDate: dateStr.slice(5).replace('-', '/'),
                           earning: dayData ? dayData.earning : 0,
                           cost: dayData ? dayData.cost : 0,
                           profit: dayData ? (dayData.earning || 0) - (dayData.cost || 0) : 0
                        });
                      }
                      
                      const dataMax = Math.max(...chartData.map(d => d.profit), 1);
                      const dataMin = Math.min(...chartData.map(d => d.profit), -1);
                      const off = dataMax <= 0 ? 0 : dataMin >= 0 ? 1 : dataMax / (dataMax - dataMin);

                      return (
                        <div className="h-96 w-full" style={{ minWidth: 10, minHeight: 10 }}>
                          <ResponsiveContainer width="100%" height={384}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="splitColorDaily" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={off} stopColor="#10b981" stopOpacity={0.8}/> {/* green for up */}
                                  <stop offset={off} stopColor="#f43f5e" stopOpacity={0.8}/> {/* red for down */}
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="shortDate" 
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
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#000000' }}
                                itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="profit" 
                                name="Net Earnings"
                                stroke="url(#splitColorDaily)" 
                                fillOpacity={1} 
                                fill="url(#splitColorDaily)" 
                                strokeWidth={4} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 flex flex-col">
                    <h3 className="text-2xl font-bold mb-8">System Health</h3>
                    <div className="flex-1 space-y-6">
                      {(() => {
                        const now = Date.now();
                        const successRateVal = metrics?.orderCount > 0 ? Math.round(((metrics.orderCount - (metrics.cancelledCount || 0)) / metrics.orderCount) * 100) : 100;
                        
                        const profitMargin = metrics?.revenue > 0 ? Math.max(0, Math.round(((metrics.revenue - (metrics.cost || 0)) / metrics.revenue) * 100)) : 0;
                        
                        const todayStr = new Date().toISOString().split('T')[0];
                        const td = (metrics?.dailyData || []).find((d: any) => d.date === todayStr);
                        const recentOrders = td ? (td.orderCount || 0) : 0;
                        const workerActivityVal = Math.min(100, Math.max(0, Math.round((recentOrders / 10) * 100)));

                        return [
                          { title: "System Status", status: "Online", color: "text-blue-500", progress: 100 },
                          { title: "Success Rate", status: `${successRateVal}%`, color: successRateVal >= 90 ? "text-emerald-500" : successRateVal >= 70 ? "text-yellow-500" : "text-red-500", progress: successRateVal },
                          { title: "Profit Margin", status: `${profitMargin}%`, color: profitMargin > 20 ? "text-emerald-500" : "text-red-500", progress: profitMargin },
                          { title: "Worker Activity", status: `${workerActivityVal}%`, color: workerActivityVal > 50 ? "text-indigo-500" : "text-yellow-500", progress: workerActivityVal },
                        ].map((item, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-slate-700">{item.title}</span>
                              <span className={item.color}>{item.status}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden relative">
                              <div 
                                style={{ width: `${item.progress}%` }}
                                className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out", item.color.replace('text', 'bg'))} 
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="mt-12 rounded-[2rem] bg-slate-900 p-6 text-white overflow-hidden relative">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Uptime</span>
                       <p className="mt-2 text-3xl font-extrabold">99.98%</p>
                       <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />
                    </div>
                  </div>
                </div>

                {/* Top Selling Products Section */}
                {(() => {
                  const topProducts = metrics?.topProducts || [];

                  return (
                    <div className="mt-8 rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-bold">Top Selling Products</h3>
                          <p className="text-sm font-bold text-slate-500 mt-1">Inventory items with highest movement</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                              <div className="h-3 w-3 rounded-full bg-indigo-500" /> Units Sold
                            </div>
                        </div>
                      </div>
                      
                      {topProducts.length === 0 ? (
                         <div className="h-72 flex items-center justify-center text-slate-400 font-bold">No sales data available.</div>
                      ) : (
                        <div className="h-80 w-full" style={{ minWidth: 10, minHeight: 10 }}>
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                width={120}
                                tick={{fill: "#64748b", fontSize: 13, fontWeight: 600}} 
                              />
                              <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px', backgroundColor: '#ffffff', color: '#000000' }}
                                itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                                formatter={(value: number) => [value, 'Units Sold']}
                              />
                              <Bar dataKey="quantity" radius={[0, 8, 8, 0]} activeBar={{ stroke: '#4f46e5', strokeWidth: 2 }}>
                                {
                                  topProducts.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                                  ))
                                }
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </motion.div>
              )
            )}

            {activeTab === "products" && (
              !isLoaded.inventory ? <SkeletonLoader /> : (
              <motion.div 
                key="products"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10 pb-20 relative"
              >
                {cart.length > 0 && currentUser && (currentUser.role === 'admin' || currentUser.role?.toLowerCase().includes('sr') || currentUser.jobTitle?.toLowerCase().includes('sr')) && (
                  <button 
                    onClick={() => {
                        setIsCartOpen(true);
                    }} 
                    className="fixed bottom-8 left-8 lg:left-[17.5rem] z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-2xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all outline-none"
                  >
                    <ShoppingCart className="h-7 w-7" />
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-bold ring-4 ring-white shadow text-white">
                      {cart.length}
                    </span>
                  </button>
                )}
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
                        value={productSearchTerm}
                        onChange={e => setProductSearchTerm(e.target.value)}
                        placeholder="Search inventory..." 
                        className="w-full sm:w-72 rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                      />
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                        className={cn(
                          "flex h-14 w-full sm:w-14 items-center justify-center rounded-2xl border transition-all active:scale-95",
                          isCategoryFilterOpen ? "bg-green-50 border-green-200 text-green-600 shadow-sm" : "bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50"
                        )}
                      >
                        <Filter className="h-5 w-5" />
                      </button>
                      
                      {isCategoryFilterOpen && (
                        <div className="absolute right-0 top-16 z-50 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                          <div className="mb-2 px-2 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Category</div>
                          <div className="space-y-1">
                            {["All", ...Array.from(new Set(inventory.map(p => p.category).filter(c => c && c !== "All")))].map(cat => (
                              <button
                                key={cat}
                                onClick={() => { setProductCategoryFilter(cat); setIsCategoryFilterOpen(false); }}
                                className={cn(
                                  "w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-all",
                                  productCategoryFilter === cat 
                                    ? "bg-green-600 text-white shadow-md shadow-green-200" 
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                 {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="flex h-14 w-full sm:w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95">
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredProducts = (productCategoryFilter === "All" ? inventory : inventory.filter(p => p.category === productCategoryFilter))
                    .filter(p => productSearchTerm ? p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.category.toLowerCase().includes(productSearchTerm.toLowerCase()) : true);

                  if (filteredProducts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-20 text-center rounded-[3rem] bg-white ring-1 ring-slate-100 border border-dashed border-slate-200">
                        <Package className="h-16 w-16 text-slate-300 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900">No products found</h3>
                        <p className="mt-2 text-slate-500 font-medium">Try adjusting your search or filter criteria.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredProducts.map((p, i) => (
                        <motion.div 
                          key={`product-card-${p._docId || p.id}-${i}`}
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
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 font-medium">Stock:</span>
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              {p.stock}
                              {p.kgPerUnit && <span className="ml-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 rounded-md">({p.kgPerUnit})</span>}
                              {((p.stock && p.stock.match(/[0-9]+/) ? Number(p.stock.match(/[0-9]+/)[0]) : 0) < 25) && (
                                <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                              )}
                            </div>
                          </div>
                          {currentUser && (currentUser.role === "admin" || (currentUser.role?.toLowerCase().includes("supplier") || currentUser.jobTitle?.toLowerCase().includes("supplier"))) && (
                            <button 
                              onClick={() => {
                                 setRestockProduct(p.id.toString());
                                 setActiveTab("restock");
                              }}
                              className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                            >
                              <PackagePlus className="h-4 w-4" /> Restock
                            </button>
                          )}
                        </div>
                        {((p.stock && p.stock.match(/[0-9]+/) ? Number(p.stock.match(/[0-9]+/)[0]) : 0) < 25) && (
                           <div className="mt-1">
                             <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Low Stock Warning
                             </span>
                           </div>
                        )}
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
                           <button 
                             onClick={() => {
                                if (!currentUser) {
                                  customAlert("Guest users are not allowed to make a sell. Please sign in or register to place an order.");
                                  setActiveTab("login");
                                  return;
                                }
                                const isAdmin = currentUser.role === "admin";
                                const isSR = currentUser.role?.toLowerCase().includes("sr") || currentUser.jobTitle?.toLowerCase().includes("sr");
                                const isDeliveryMan = currentUser.role?.toLowerCase().includes("delivery man") || currentUser.jobTitle?.toLowerCase().includes("delivery man");
                                if (isDeliveryMan || (!isAdmin && !isSR)) {
                                  customAlert("Only SR (Sales Representatives) or Admins can sell items. Delivery personnel are restricted.");
                                  return;
                                }
                                setOrderModal({ isOpen: true, step: 1, product: p, quantity: "", sellType: 'unit', shopDetails: { id: "", name: "", ownerName: "", phone: "", address: "", zone: "Gulshan", image: null } });
                              }}
                             className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                           >
                             Wholesale Order <ArrowRight className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
              )
            )}

            {activeTab === "accounting" && currentUser && currentUser.status !== "pending" && currentUser.role === "admin" && (
              !isLoaded.metrics || !isLoaded.orders ? <SkeletonLoader /> : (
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

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Financial Overview</h3>
                    </div>
                  </div>
                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><DollarSign className="h-4 w-4"/> Total Revenue (from Months)</label>
                       <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900">
                         ৳{(metrics.monthlyData?.reduce((acc: number, d: any) => acc + (d.earning || 0), 0) || 0).toLocaleString()}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><MapIcon className="h-4 w-4"/> Total Cost (from Months)</label>
                       <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900">
                         ৳{(metrics.monthlyData?.reduce((acc: number, d: any) => acc + (d.cost || 0), 0) || 0).toLocaleString()}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Users className="h-4 w-4"/> Member Salary</label>
                       <input 
                         type="text" 
                         value={metrics.salary ? `৳${Number(metrics.salary).toLocaleString()}` : ""} 
                         placeholder="৳0"
                         onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           handleMetricChange('salary', val);
                         }}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2 relative">
                       <div className="flex justify-between items-end">
                           <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500"/> Net Earnings</label>
                       </div>
                       <div className="w-full rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 px-6 py-4 text-xl font-black text-emerald-700">
                         ৳{(metrics.monthlyData?.reduce((acc: number, d: any) => acc + ((d.earning || 0) - (d.cost || 0)), 0) || 0).toLocaleString()}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ShoppingCart className="h-4 w-4"/> Order Count</label>
                       <input 
                         type="number" 
                         value={metrics.orderCount || ""} 
                         placeholder="0"
                         min="0"
                         onChange={(e) => handleMetricChange('orderCount', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500 transition-all focus:bg-white"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User className="h-4 w-4"/> Employee Count</label>
                       <input 
                         type="number" 
                         value={metrics.employeeCount || ""} 
                         placeholder="0"
                         min="0"
                         onChange={(e) => handleMetricChange('employeeCount', e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500 transition-all focus:bg-white"
                       />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => {
                        setDoc(doc(db, "singletons", "metrics"), metrics);
                        customAlert("Metrics saved successfully!");
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Save Overviews
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Daily Transactions</h3>
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3 max-w-4xl">
                     <div className="space-y-2 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                       <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">Select Date</label>
                       <input 
                         type="date"
                         value={dailyDate}
                         onChange={(e) => setDailyDate(e.target.value)}
                         className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                       />
                     </div>
                     <div className="space-y-2 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                       <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-500" /> Daily Cost</label>
                       <input 
                         type="text" 
                         placeholder="৳0"
                         value={dailyCost ? `৳${Number(dailyCost).toLocaleString()}` : ""}
                         onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           setDailyCost(val === "" ? "" : Number(val));
                         }}
                         className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                       />
                     </div>
                     <div className="space-y-2 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                       <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Daily Sells</label>
                       <input 
                         type="text" 
                         placeholder="৳0"
                         value={dailyEarning ? `৳${Number(dailyEarning).toLocaleString()}` : ""}
                         onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           setDailyEarning(val === "" ? "" : Number(val));
                         }}
                         className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                       />
                     </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => {
                        const dateObj = new Date(dailyDate);
                        const monthIndex = dateObj.getMonth();
                        if(metrics.monthlyData) {
                          const dCost = Number(dailyCost) || 0;
                          const dEarn = Number(dailyEarning) || 0;
                          
                          if (dCost > 0) {
                              const cId = Date.now().toString() + "-cost";
                              setDoc(doc(db, "orders", cId), {
                                 id: cId,
                                 type: "restock",
                                 source: "Manual Cost",
                                 totalPrice: dCost,
                                 timestamp: dailyDate + "T12:00:00.000Z",
                                 userName: currentUser?.name || "Admin",
                                 productName: "Manual Cost Entry",
                                 status: "completed"
                              });
                          }
                          
                          if (dEarn > 0) {
                              const eId = Date.now().toString() + "-earn";
                              setDoc(doc(db, "orders", eId), {
                                 id: eId,
                                 type: "wholesale",
                                 source: "Manual Sale",
                                 totalPrice: dEarn,
                                 timestamp: dailyDate + "T12:00:00.000Z",
                                 userName: currentUser?.name || "Admin",
                                 productName: "Manual Sale Entry",
                                 status: "completed"
                              });
                          }

                          const newMonthlyData = [...metrics.monthlyData];
                          newMonthlyData[monthIndex].cost = (newMonthlyData[monthIndex].cost || 0) + dCost;
                          newMonthlyData[monthIndex].earning = (newMonthlyData[monthIndex].earning || 0) + dEarn;
                          
                          const newDailyData = metrics.dailyData ? [...metrics.dailyData] : [];
                          const dailyIndex = newDailyData.findIndex((d: any) => d.date === dailyDate);
                          if (dailyIndex >= 0) {
                            newDailyData[dailyIndex].cost = (newDailyData[dailyIndex].cost || 0) + dCost;
                            newDailyData[dailyIndex].earning = (newDailyData[dailyIndex].earning || 0) + dEarn;
                          } else {
                            newDailyData.push({ date: dailyDate, cost: dCost, earning: dEarn });
                            newDailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));
                          }
                          
                          const newMetrics = { 
                            ...metrics, 
                            cost: (metrics.cost || 0) + dCost,
                            revenue: (metrics.revenue || 0) + dEarn,
                            monthlyData: newMonthlyData, 
                            dailyData: newDailyData 
                          };
                          setMetrics(newMetrics);
                          setDoc(doc(db, "singletons", "metrics"), newMetrics);
                          
                          customAlert("Manual Transaction Added and synched successfully!");
                          setSelectedMonthIndex(monthIndex);
                          setDailyCost("");
                          setDailyEarning("");
                        }
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 font-bold text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                    >
                      <Plus className="h-5 w-5" /> Add Transaction
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <LineChart className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Monthly Graph Data</h3>
                    </div>
                  </div>
                  {metrics.monthlyData && metrics.monthlyData.length > 0 && (
                    <div className="space-y-6">
                      <div className="max-w-md">
                        <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">Select Month</label>
                        <CustomSelect
                          value={selectedMonthIndex.toString()}
                          onChange={(v) => setSelectedMonthIndex(Number(v))}
                          options={metrics.monthlyData.map((data: any, index: number) => ({
                             label: data.name,
                             value: index.toString()
                          }))}
                        />
                      </div>
                      
                      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
                         <div className="space-y-2 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                           <label className="text-lg font-bold text-slate-900 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-500" /> Cost</label>
                           <input 
                             type="text" 
                             placeholder="৳0"
                             value={metrics.monthlyData[selectedMonthIndex]?.cost ? `৳${Number(metrics.monthlyData[selectedMonthIndex]?.cost).toLocaleString()}` : ""} 
                             onChange={(e) => {
                               const newMonthlyData = [...metrics.monthlyData];
                               const val = e.target.value.replace(/[^0-9]/g, '');
                               newMonthlyData[selectedMonthIndex].cost = Number(val) || 0;
                               setMetrics({ ...metrics, monthlyData: newMonthlyData });
                             }}
                             className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                           />
                         </div>
                         <div className="space-y-2 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                           <label className="text-lg font-bold text-slate-900 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500" /> Earning</label>
                           <input 
                             type="text" 
                             placeholder="৳0"
                             value={metrics.monthlyData[selectedMonthIndex]?.earning ? `৳${Number(metrics.monthlyData[selectedMonthIndex]?.earning).toLocaleString()}` : ""} 
                             onChange={(e) => {
                               const newMonthlyData = [...metrics.monthlyData];
                               const val = e.target.value.replace(/[^0-9]/g, '');
                               newMonthlyData[selectedMonthIndex].earning = Number(val) || 0;
                               setMetrics({ ...metrics, monthlyData: newMonthlyData });
                             }}
                             className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                           />
                         </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => {
                        setDoc(doc(db, "singletons", "metrics"), metrics);
                        customAlert("Monthly graph data saved successfully!");
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Save Graph Data
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Inventory & Product Pricing</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left responsive-table">
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
                                 <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 relative group cursor-pointer">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if(file) {
                                          resizeImage(file, (dataUrl) => {
                                            handleUpdateProduct(item.id, 'image', dataUrl);
                                          });
                                        }
                                      }}/>
                                      <Upload className="h-4 w-4 text-white" />
                                    </label>
                                  </div>
                                 <div className="flex flex-col flex-1 gap-1">
                                   <input 
                                     type="text" 
                                     value={item.name}
                                     onChange={(e) => handleUpdateProduct(item.id, 'name', e.target.value)}
                                     className="font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-green-500 outline-none w-full"
                                   />
                                   <input
                                     type="text"
                                     value={item.image}
                                     onChange={(e) => handleUpdateProduct(item.id, 'image', e.target.value)}
                                     placeholder="Image URL"
                                     className="text-xs text-slate-400 bg-transparent py-1 border-b border-transparent focus:border-green-500 outline-none w-full"
                                   />
                                 </div>
                               </div>
                             </td>
                             <td className="py-4 font-medium text-slate-500">{item.category}</td>
                             <td className="py-4">
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="text" 
                                   value={item.price ? `৳${Number(item.price.replace(/[^0-9]/g, '')).toLocaleString()}` : ""}
                                   onChange={(e) => {
                                     const val = e.target.value.replace(/[^0-9]/g, '');
                                     handleUpdateProduct(item.id, 'price', val ? `৳${Number(val).toLocaleString()}` : "");
                                   }}
                                   className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
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
                      onClick={() => {
                        inventory.forEach(item => {
                           setDoc(doc(db, "inventory", item.id.toString()), item);
                        });
                        customAlert("Inventory updated!");
                        setActiveTab("products");
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Save and Check
                    </button>
                  </div>
                </div>

              </motion.div>
              )
            )}


            {activeTab === "employees" && currentUser && currentUser.status !== "pending" && currentUser.role === "admin" && (
              !isLoaded.pw ? <SkeletonLoader /> : (
              <motion.div 
                key="employees"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Role & Access Management</h2>
                  <p className="mt-2 text-lg text-slate-500">Manage user roles, zones, job titles, and see what they can access.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users by name or number..." 
                      value={employeeSearch}
                      onChange={e => setEmployeeSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-6 font-medium block outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="w-full md:w-64">
                    <CustomSelect 
                       value={employeeZoneFilter}
                       onChange={v => setEmployeeZoneFilter(v)}
                       options={[
                          { label: "All Zones", value: "All" },
                          { label: "Gulshan", value: "Gulshan" },
                          { label: "Badda", value: "Badda" },
                          { label: "Tejgaon", value: "Tejgaon" }
                       ]}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                   {["All", "Delivery Man", "Supplier", "SR", "Warehouse Manager", "admin"].map(role => (
                      <button
                        key={role}
                        onClick={() => setEmployeeRoleFilter(role)}
                        className={cn(
                           "px-6 py-2.5 rounded-full font-bold text-sm transition-all",
                           employeeRoleFilter === role 
                             ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                             : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                         {role === "admin" ? "System Admin" : role}
                      </button>
                   ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {users.filter(u => u.status === "approved").filter(u => {
                     let searchMatch = true;
                     let zoneMatch = true;
                     let roleMatch = true;
                     if (employeeSearch) {
                        const term = employeeSearch.toLowerCase();
                        searchMatch = u.name.toLowerCase().includes(term) || u.number.includes(term);
                     }
                     if (employeeZoneFilter !== "All") {
                        zoneMatch = u.zone === employeeZoneFilter;
                     }
                     if (employeeRoleFilter !== "All") {
                        if (employeeRoleFilter === "admin") {
                          roleMatch = u.role === "admin";
                        } else {
                          roleMatch = (u.jobTitle || "").toLowerCase().includes(employeeRoleFilter.toLowerCase());
                        }
                     }
                     return searchMatch && zoneMatch && roleMatch;
                  }).map(u => (
                    <div key={u.id} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col hover:shadow-lg hover:ring-green-100 transition duration-300 relative">
                       {/* Dropdown for role editing */}
                       <div className="flex items-center gap-4 mb-6">
                         {u.photo ? (
                            <img src={u.photo} className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100" />
                         ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-50">
                               <User className="h-7 w-7 text-slate-400" />
                            </div>
                         )}
                         <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{u.name}</h3>
                            <p className="font-medium text-sm text-slate-500">{u.number}</p>
                         </div>
                       </div>
                       
                       <div className="space-y-4">
                         <div className="relative">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Job Title / Access Role</label>
                            <button
                              onClick={() => setEditingUserRole(editingUserRole === u.id ? null : u.id)}
                              className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 hover:bg-slate-100 transition text-left"
                            >
                               {u.role === "admin" ? "System Administrator" : (u.jobTitle || "Standard User")}
                               <ChevronDown className="h-4 w-4 text-slate-400" />
                            </button>
                            
                            {/* Custom Dropdown UI */}
                            <AnimatePresence>
                               {editingUserRole === u.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                  >
                                     <div className="max-h-80 overflow-y-auto">
                                        {[
                                          { title: "Standard User", role: "user", jt: "", pages: "Main Catalog only" },
                                          { title: "Delivery Man", role: "employee", jt: "Delivery Man", pages: "Delivery Portal, Order Status Tracking" },
                                          { title: "Supplier", role: "employee", jt: "Supplier", pages: "Inventory Restock, Item Costs" },
                                          { title: "Warehouse Manager", role: "employee", jt: "Warehouse Manager", pages: "Inventory Restock, Stock Status" },
                                          { title: "SR (Sales Rep)", role: "employee", jt: "SR", pages: "Shop Catalog, Sales Checkout, Add Shops" },
                                          { title: "System Administrator", role: "admin", jt: "Admin", pages: "Full Access" }
                                        ].map((opt, i) => (
                                           <button 
                                              key={i}
                                              className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition"
                                              onClick={() => {
                                                 if ((u.username === "haf1j" || u.username === "hasan") && opt.role !== "admin") {
                                                    customAlert("Cannot downgrade super admin.");
                                                    return;
                                                 }
                                                 setDoc(doc(db, "users", u.id.toString()), { ...u, role: opt.role, jobTitle: opt.jt });
                                                 setEditingUserRole(null);
                                              }}
                                           >
                                              <div className="font-bold text-slate-900">{opt.title}</div>
                                              <div className="text-[10px] uppercase font-bold text-green-600 mt-1 flex items-center gap-1">
                                                 <CheckCircle2 className="w-3 h-3" /> Pages: {opt.pages}
                                              </div>
                                           </button>
                                        ))}
                                     </div>
                                  </motion.div>
                               )}
                            </AnimatePresence>
                         </div>

                         <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Zone</label>
                                <button
                                  onClick={() => { setEditingZone(editingZone === u.id ? null : u.id); setEditingPages(null); setEditingUserRole(null); }}
                                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-700 outline-none hover:bg-slate-100 transition text-left"
                                >
                                  {u.zone || "Global (All)"}
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                </button>
                                <AnimatePresence>
                                   {editingZone === u.id && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] overflow-hidden"
                                      >
                                         <div className="max-h-60 overflow-y-auto w-full">
                                            {["All", "Gulshan", "Badda", "Tejgaon"].map(z => (
                                               <button key={z} className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition font-bold text-slate-700"
                                                 onClick={() => { setDoc(doc(db, "users", u.id.toString()), { ...u, zone: z }); setEditingZone(null); }}>
                                                 {z === "All" ? "Global (All)" : z}
                                               </button>
                                            ))}
                                         </div>
                                      </motion.div>
                                   )}
                                </AnimatePresence>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Salary</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                  <input 
                                    type="number"
                                    value={u.salary || ""}
                                    placeholder="0"
                                    onChange={e => {
                                       setDoc(doc(db, "users", u.id.toString()), { ...u, salary: Number(e.target.value) });
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                            </div>
                         </div>

                         {/* Accessible Pages Custom Override */}
                         <div className="relative mt-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Custom Page Access</label>
                            <button
                              onClick={() => { setEditingPages(editingPages === u.id ? null : u.id); setEditingZone(null); setEditingUserRole(null); }}
                              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-700 outline-none hover:bg-slate-100 transition text-left"
                            >
                              <span className="truncate pr-2">
                                {u.accessiblePages && u.accessiblePages.length > 0 
                                  ? `${u.accessiblePages.length} Pages Allowed` 
                                  : "Default Role Access"}
                              </span>
                              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                            </button>
                            <AnimatePresence>
                               {editingPages === u.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                                  >
                                     <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-500 uppercase">Select Pages</span>
                                       {u.accessiblePages && u.accessiblePages.length > 0 && (
                                          <button onClick={() => setDoc(doc(db, "users", u.id.toString()), { ...u, accessiblePages: [] })} className="text-xs text-rose-500 hover:underline font-bold">Reset to Default</button>
                                       )}
                                     </div>
                                     <div className="max-h-60 overflow-y-auto w-full p-2 space-y-1">
                                        {[
                                          { id: "dashboard", name: "Dashboard" },
                                          { id: "products", name: "Shop Catalog" },
                                          { id: "deliveries", name: "Delivery Portal" },
                                          { id: "restock", name: "Inventory Restock" },
                                          { id: "orders", name: "Sales & Delivery History" },
                                          { id: "shops", name: "Shops Database" },
                                          { id: "employees", name: "Employees & Roles" },
                                          { id: "accounting", name: "Accounting Portal" }
                                        ].map(page => {
                                           const isSelected = u.accessiblePages?.includes(page.id) || false;
                                           return (
                                             <label key={page.id} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition select-none">
                                               <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 border", isSelected ? "bg-green-500 border-green-500 text-white" : "border-slate-300 bg-white text-transparent")}>
                                                 <CheckCircle2 className="w-3.5 h-3.5" />
                                               </div>
                                               <span className={cn("font-bold text-sm", isSelected ? "text-slate-900" : "text-slate-600")}>{page.name}</span>
                                               <input 
                                                 type="checkbox" className="hidden"
                                                 checked={isSelected}
                                                 onChange={(e) => {
                                                   const current = u.accessiblePages || [];
                                                   const arr = e.target.checked ? [...current, page.id] : current.filter((x: string) => x !== page.id);
                                                   setDoc(doc(db, "users", u.id.toString()), { ...u, accessiblePages: arr });
                                                 }}
                                               />
                                             </label>
                                           );
                                        })}
                                     </div>
                                     <div className="p-3 border-t border-slate-100">
                                       <button onClick={() => setEditingPages(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-sm transition">Done</button>
                                     </div>
                                  </motion.div>
                               )}
                            </AnimatePresence>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
                {users.filter(u => u.status === "approved").length === 0 && (
                   <div className="text-center py-20 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl">No employees found.</div>
                )}
              </motion.div>
              )
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
                              if (user.status === "pending") {
                                setErrorMsg("Please ask the admin to approve your user request.");
                                return;
                              }
                              setCurrentUser(user);
                              setErrorMsg("");
                              setLoginUsername("");
                              setLoginPassword("");
                              if (user.role === "admin") {
                                setActiveTab("dashboard");
                              } else if (user.accessiblePages && user.accessiblePages.length > 0) {
                                setActiveTab(user.accessiblePages[0]);
                              } else if (hasAccess(user, "deliveries")) {
                                setActiveTab("deliveries");
                              } else if (hasAccess(user, "restock")) {
                                setActiveTab("restock");
                              } else if (hasAccess(user, "products")) {
                                setActiveTab("products");
                              } else {
                                setActiveTab("home");
                              }
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
                                } else {
                                  setErrorMsg("Username not found");
                                }
                              }}
                              className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Continue
                            </button>
                          </motion.div>
                        )}

                        {forgotPasswordStep === 2 && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 text-amber-800 font-medium">
                              <p>Please click confirm and ask the admin for your password then log in and change your password.</p>
                            </div>
                            <button 
                              onClick={() => {
                                const targetUser = users.find(u => u.username === forgotUsername);
                                if (targetUser) {
                                  const requestId = Date.now().toString();
                                  setDoc(doc(db, "password_requests", requestId), {
                                    id: requestId,
                                    userId: targetUser.id,
                                    username: targetUser.username,
                                    timestamp: new Date().toISOString()
                                  }).catch(console.error);
                                }
                                setForgotPasswordStep(0);
                                setForgotUsername("");
                                setErrorMsg("");
                                customAlert("Password request sent to admin.");
                              }}
                              className="mt-4 w-full flex items-center justify-center rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                              Confirm
                            </button>
                          </motion.div>
                        )}

                        <div className="text-center mt-6">
                          <button onClick={() => { setErrorMsg(""); setForgotPasswordStep(0); setForgotUsername(""); }} className="text-slate-400 font-bold hover:text-slate-600 text-sm">
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
                        const newUser = { id: Date.now(), name: signupName, number: signupNumber, username: signupUsername, password: signupPassword, role: "user", status: "pending" };
                        setDoc(doc(db, "users", newUser.id.toString()), newUser);
                        setSignupName("");
                        setSignupNumber("");
                        setSignupUsername("");
                        setSignupPassword("");
                        setSignupConfirm("");
                        setErrorMsg("");
                        customAlert("Sign up successful! Please contact admin to approve your account.");
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

            {activeTab === "profile" && currentUser && currentUser.status !== "pending" && (
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

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 max-w-2xl mx-auto">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Personal Details</h3>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <label 
                      className="relative rounded-full h-28 w-28 ring-4 ring-slate-100 flex items-center justify-center bg-slate-50 cursor-pointer overflow-visible transition-transform active:scale-95"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          resizeImage(file, (base64) => {
                            setDoc(doc(db, "users", currentUser.id.toString()), { ...currentUser, photo: base64 }, { merge: true }).catch(console.error);
                            setCurrentUser({ ...currentUser, photo: base64 });
                            setUsers(users.map((u: any) => u.id === currentUser.id ? { ...u, photo: base64 } : u));
                          });
                        }
                      }}
                    >
                      {currentUser.photo ? (
                        <>
                          <div className="w-full h-full rounded-full overflow-hidden">
                            <img src={currentUser.photo} className="w-full h-full object-cover" alt="Profile" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-xl ring-1 ring-slate-200 text-slate-700 hover:text-green-600 transition-colors">
                            <RefreshCw className="h-5 w-5" />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-slate-400 hover:text-green-500 transition-colors">
                            <Plus className="h-10 w-10 text-slate-400" />
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            resizeImage(file, (base64) => {
                              setDoc(doc(db, "users", currentUser.id.toString()), { ...currentUser, photo: base64 }, { merge: true });
                              setCurrentUser({ ...currentUser, photo: base64 });
                              setUsers(users.map(u => u.id === currentUser.id ? { ...u, photo: base64 } : u));
                            });
                          }
                        }}
                      />
                    </label>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                      <p className="text-slate-500 font-medium">@{currentUser.username} • {currentUser.role === "admin" ? "System Admin" : (currentUser.jobTitle || "Standard User")}</p>
                    </div>
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
                    <div className="pt-4 flex justify-end border-b border-slate-100 pb-6">
                      <button 
                        onClick={() => {
                          setDoc(doc(db, "users", currentUser.id.toString()), currentUser);
                          customAlert("Profile updated successfully!");
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-5 w-5" /> Save Changes
                      </button>
                    </div>

                    <div className="pt-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                          <div className="relative">
                            <input 
                              type={profileShowPassword ? "text" : "password"}
                              value={profileNewPassword}
                              onChange={e => setProfileNewPassword(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none pr-12 focus:ring-2 focus:ring-green-500"
                              placeholder="Min 3 characters"
                            />
                            <button 
                              type="button"
                              onClick={() => setProfileShowPassword(!profileShowPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {profileShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                          <input 
                            type={profileShowPassword ? "text" : "password"}
                            value={profileConfirmPassword}
                            onChange={e => setProfileConfirmPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Retype password"
                          />
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button 
                            onClick={() => {
                              if (profileNewPassword.length < 3) {
                                customAlert("Password must be at least 3 characters long.");
                                return;
                              }
                              if (profileNewPassword !== profileConfirmPassword) {
                                customAlert("Passwords do not match.");
                                return;
                              }
                              const updatedUser = { ...currentUser, password: profileNewPassword };
                              setDoc(doc(db, "users", currentUser.id.toString()), updatedUser);
                              setProfileNewPassword("");
                              setProfileConfirmPassword("");
                              setCurrentUser(updatedUser);
                              customAlert("Password changed successfully!");
                            }}
                            className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <Save className="h-4 w-4" /> Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "admin_center" && currentUser && currentUser.status !== "pending" && currentUser.role === "admin" && (
              !isLoaded.metrics || !isLoaded.orders || !isLoaded.inventory || !isLoaded.shops || !isLoaded.pw ? <SkeletonLoader /> : (
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

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <h3 className="text-2xl font-bold text-amber-600">Pending Signups</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left responsive-table">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-4 pt-2">Full Name</th>
                          <th className="pb-4 pt-2">Username</th>
                          <th className="pb-4 pt-2">Phone</th>
                          <th className="pb-4 pt-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.filter(u => u.status === "pending").map(u => (
                          <tr key={u.id} className="group">
                            <td className="py-4 font-bold text-slate-900">{u.name}</td>
                            <td className="py-4 font-medium text-slate-500">@{u.username}</td>
                            <td className="py-4 font-medium text-slate-500">
                               <a 
                                 href={`tel:${u.number.replace(/[^0-9+]/g, '')}`} 
                                 onClick={() => { navigator.clipboard.writeText(u.number); customAlert('Number copied to clipboard!'); }} 
                                 className="hover:text-green-600 hover:underline cursor-pointer flex items-center gap-1"
                               >
                                 <Phone className="h-3 w-3" /> {u.number}
                               </a>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    const updatedUser = { ...u, status: "approved", role: "user" };
                                    setDoc(doc(db, "users", u.id.toString()), updatedUser);
                                  }}
                                  className="px-3 py-2 text-sm font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded-xl transition-colors"
                                >
                                  Approve as User
                                </button>
                                <button 
                                  onClick={() => {
                                    const updatedUser = { ...u, status: "approved", role: "employee" };
                                    setDoc(doc(db, "users", u.id.toString()), updatedUser);
                                  }}
                                  className="px-3 py-2 text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                                >
                                  Approve as Employee
                                </button>
                                <button 
                                  onClick={() => {
                                    deleteDoc(doc(db, "users", u.id.toString()));
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                                  title="Reject & Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.status === "pending").length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                              No pending signups.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <h3 className="text-2xl font-bold text-amber-600">Password Requests</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left responsive-table">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-4 pt-2">User Details</th>
                          <th className="pb-4 pt-2">Password</th>
                          <th className="pb-4 pt-2">Timestamp</th>
                          <th className="pb-4 pt-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {passwordRequests.map(req => {
                          const reqUser = users.find(u => u.id === req.userId);
                          return (
                            <tr key={req.id} className="group">
                              <td className="py-4">
                                <p className="font-bold text-slate-900">@{req.username}</p>
                                {reqUser && (
                                  <p className="text-xs text-slate-500 font-medium">{reqUser.name} • {reqUser.number}</p>
                                )}
                              </td>
                              <td className="py-4">
                                {reqUser ? (
                                  <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{reqUser.password}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Not found</span>
                                )}
                              </td>
                              <td className="py-4 font-medium text-slate-500">{new Date(req.timestamp).toLocaleString()}</td>
                              <td className="py-4 text-right">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      deleteDoc(doc(db, "password_requests", req.id));
                                    }}
                                    className="px-3 py-2 text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                                  >
                                    Mark Resolved
                                  </button>
                                  <button 
                                    onClick={() => {
                                      deleteDoc(doc(db, "password_requests", req.id));
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                                    title="Dismiss Request"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {passwordRequests.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">
                              No pending password requests.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 sm:mb-8 flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">User Management</h3>
                      <p className="text-slate-500 mt-1">Manage registered users, employees, and administrators.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left responsive-table">
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
                        {users.filter(u => u.status === "approved").map(u => (
                          <tr key={u.id} className="group">
                            <td className="py-4 font-bold text-slate-900">
                              {u.name}
                              {currentUser && currentUser.id === u.id && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="py-4 font-medium text-slate-500">@{u.username}</td>
                            <td className="py-4 font-medium text-slate-500">
                               <a 
                                 href={`tel:${u.number.replace(/[^0-9+]/g, '')}`} 
                                 onClick={() => { navigator.clipboard.writeText(u.number); customAlert('Number copied to clipboard!'); }} 
                                 className="hover:text-green-600 hover:underline cursor-pointer flex items-center gap-1"
                               >
                                 <Phone className="h-3 w-3" /> {u.number}
                               </a>
                            </td>
                            <td className="py-4 font-medium">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                u.role === "admin" ? "bg-green-100 text-green-700" : (u.role === "employee" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600")
                              )}>
                                {u.role === "admin" ? "Administrator" : (u.role === "employee" ? "Employee" : "Standard User")}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => {
                                  if (u.username === "haf1j" || u.username === "hasan") return; // Keep main admins
                                  if (currentUser && currentUser.id === u.id) {
                                    customAlert("You cannot remove your own admin privileges.");
                                    return;
                                  }
                                  const updatedUser = { ...u, role: u.role === "admin" ? "user" : "admin" };
                                  setDoc(doc(db, "users", u.id.toString()), updatedUser);
                                }}
                                disabled={u.username === "haf1j" || u.username === "hasan" || (currentUser && currentUser.id === u.id)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors inline-flex disabled:opacity-50 disabled:cursor-not-allowed",
                                  u.role === "admin" ? "text-rose-600 hover:bg-rose-50" : "text-blue-600 hover:bg-blue-50"
                                )}
                              >
                                {u.role === "admin" ? (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" /> Demote from Admin
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Make Admin
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">Promote to Administrator</h4>
                        <p className="text-sm font-medium text-slate-500">Select an existing user or employee to grant them administrative access.</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <CustomSelect 
                           value=""
                           onChange={(val) => {
                             if (!val) return;
                             const u = users.find(u => u.username === val);
                             if(u) setDoc(doc(db, "users", u.id.toString()), { ...u, role: "admin", status: "approved" });
                           }}
                           options={[
                              { label: "Choose a user...", value: "" },
                              ...users.filter(u => (u.role === "employee" || u.role === "user") && u.status === "approved").map(u => ({
                                 label: `${u.name} (${u.role === "employee" ? "Employee" : "User"}) - @${u.username}`,
                                 value: u.username
                              }))
                           ]}
                           className="w-full flex-1"
                        />
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 mt-8">
                  <div className="mb-8 border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Google Workspace Sync</h3>
                    <p className="text-slate-500">Sync restocks from Google Sheets and sales from Google Forms.</p>
                  </div>
                  
                  {!workspaceUser ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                       <p className="mb-6 font-bold text-slate-500">Sign in with Google to enable Workspace integrations</p>
                       <button onClick={async () => {
                          try {
                              await googleSignIn();
                          } catch(e) {
                              customAlert("Sign in failed");
                          }
                       }} className="gsi-material-button hover:opacity-80 transition-opacity">
                        <div className="gsi-material-button-state"></div>
                        <div className="gsi-material-button-content-wrapper flex items-center bg-white px-4 py-2 border rounded shadow-sm">
                          <div className="gsi-material-button-icon mr-3">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{display: 'block', width: '24px'}}>
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                              <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents font-semibold text-slate-700">Sign in with Google</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-green-900">Signed in as {workspaceUser.displayName}</p>
                            <p className="text-sm text-green-700">{workspaceUser.email}</p>
                          </div>
                          <button onClick={googleSignOut} className="text-sm font-bold text-green-800 hover:underline">Sign Out</button>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Restock Sheet ID</label>
                           <input type="text" value={workspaceSheetId} onChange={e => setWorkspaceSheetId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Sales Form ID</label>
                           <input type="text" value={workspaceFormId} onChange={e => setWorkspaceFormId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                         <button onClick={handleWorkspaceSync} disabled={isSyncing} className="flex-1 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 min-w-max">
                            {isSyncing ? "Syncing..." : "Sync Form & Sheet Now"}
                         </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 mt-8">
                  <div className="mb-8 border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Platform Settings</h3>
                    <p className="text-slate-500">Update global platform configurations.</p>
                  </div>
                  
                  <div className="max-w-xl">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Logo</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="text" 
                          value={companyLogo || ""}
                          placeholder="https://example.com/logo.png"
                          onChange={e => {
                            const val = e.target.value || null;
                            setCompanyLogo(val);
                            setDoc(doc(db, "singletons", "platform"), { companyLogo: val });
                          }}
                          className="w-full flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button 
                          onClick={() => {
                            setCompanyLogo(null);
                            setDoc(doc(db, "singletons", "platform"), { companyLogo: null });
                          }}
                          className="px-6 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="text-slate-500 text-sm font-bold">OR</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              resizeImage(file, (dataUrl) => {
                                setCompanyLogo(dataUrl);
                                setDoc(doc(db, "singletons", "platform"), { companyLogo: dataUrl });
                              });
                            }
                          }}
                          className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-green-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
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
                        onClick={() => {
                          setDoc(doc(db, "singletons", "platform"), { companyLogo: companyLogo || null });
                          customAlert("Company logo and platform settings saved successfully!");
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-5 w-5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-8 border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">System Reset</h3>
                    <p className="text-slate-500">Completely reset the dashboard stats, inventory stock, products, and prices to start fresh.</p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row justify-start gap-4">
                    <button 
                      onClick={() => setIsResetModalOpen(true)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-8 py-3 font-bold text-white shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
                    >
                      <AlertCircle className="h-5 w-5" /> Reset Everything
                    </button>

                    <button 
                      onClick={() => {
                        customConfirm("Are you sure you want to remove the initial demo products? Products you or your employees added will be kept.", () => {
                           const demoProducts = inventory.filter(p => Number(p.id) <= 4);
                           demoProducts.forEach(p => {
                              deleteDoc(doc(db, "inventory", p.id.toString()));
                           });
                           customAlert(`Removed ${demoProducts.length} demo products successfully!`);
                        });
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-3 font-bold text-white shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                    >
                      <Trash2 className="h-5 w-5" /> Remove Demo Products
                    </button>
                    <button 
                      onClick={() => {
                          customConfirm("Are you sure you want to recalculate all metrics from scratch? This might take a few moments and spike database reads.", async () => {
                                let newRev = 0;
                                let newCost = 0;
                                let newOrderCount = 0;
                                let newCancelledCount = 0;
                                const newMonthlyData = Array.from({ length: 12 }, (_, j) => ({
                                    name: new Date(0, j).toLocaleString('default', { month: 'short' }),
                                    cost: 0,
                                    earning: 0,
                                    orderCount: 0,
                                    cancelledCount: 0
                                }));
                                const newDailyData: any[] = [];
                                const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
                                
                                const addProductStat = (productId: string | number, productName: string, qty: string | number, revenue: number) => {
                                    if (!productId || String(productId).startsWith('cart-')) return;
                                    const pidStr = String(productId);
                                    if (!productStats[pidStr]) {
                                        productStats[pidStr] = {
                                            name: productName || 'Unknown Product',
                                            quantity: 0,
                                            revenue: 0
                                        };
                                    }
                                    let quantityValue = 0;
                                    if (typeof qty === 'number') {
                                        quantityValue = qty;
                                    } else if (typeof qty === 'string') {
                                        const str = qty.toLowerCase();
                                        if (str.includes('units)')) {
                                            const match = str.match(/\(([0-9.]+)\s*units\)/);
                                            if (match) quantityValue = Number(match[1]);
                                        } else {
                                            quantityValue = parseFloat(str) || 0;
                                        }
                                    }
                                    productStats[pidStr].quantity += quantityValue;
                                    productStats[pidStr].revenue += revenue;
                                };
                                
                                const allOrdersSnapshot = await getDocs(collection(db, "orders"));
                                const allOrders = allOrdersSnapshot.docs.map(d => d.data());

                                allOrders.forEach(o => {
                                    if (!o.timestamp) return;
                                    
                                    try {
                                        const date = new Date(o.timestamp);
                                        if (isNaN(date.getTime())) return;

                                        const month = date.getMonth();
                                        const yyyymmdd = o.timestamp.split('T')[0];
                                        const price = Number(o.totalPrice) || 0;
                                        
                                        let dailyDate = newDailyData.find(d => d.date === yyyymmdd);
                                        if (!dailyDate) {
                                            dailyDate = { date: yyyymmdd, earning: 0, cost: 0, orderCount: 0, cancelledCount: 0 };
                                            newDailyData.push(dailyDate);
                                        }

                                        if (o.status === "cancelled") {
                                            if (o.type !== 'restock') {
                                              newCancelledCount++;
                                              newMonthlyData[month].cancelledCount = (newMonthlyData[month].cancelledCount || 0) + 1;
                                              dailyDate.cancelledCount = (dailyDate.cancelledCount || 0) + 1;
                                            }
                                            return;
                                        }

                                        if (o.type === 'restock' || o.source === "Manual Cost") {
                                            newCost += price;
                                            newMonthlyData[month].cost += price;
                                            dailyDate.cost += price;
                                        } else if (o.status === "completed" || !o.status) {
                                            newRev += price;
                                            newOrderCount++;
                                            newMonthlyData[month].earning += price;
                                            newMonthlyData[month].orderCount = (newMonthlyData[month].orderCount || 0) + 1;
                                            dailyDate.earning += price;
                                            dailyDate.orderCount = (dailyDate.orderCount || 0) + 1;

                                            if (o.cartItems && Array.isArray(o.cartItems)) {
                                                o.cartItems.forEach((item: any) => {
                                                    addProductStat(item.productId, item.productName, item.quantity, Number(item.totalPrice || 0));
                                                });
                                            } else {
                                                addProductStat(o.productId, o.productName, o.quantity, price);
                                            }
                                        }
                                    } catch (e) {
                                        console.error("Error processing order timestamp", o);
                                    }
                                });

                                newDailyData.sort((a, b) => a.date.localeCompare(b.date));
                                const topProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
                                
                                const nextMetrics = {
                                    ...metrics,
                                    revenue: newRev,
                                    cost: newCost,
                                    earning: newRev - newCost - (metrics.salary || 0),
                                    orderCount: newOrderCount,
                                    cancelledCount: newCancelledCount,
                                    monthlyData: newMonthlyData,
                                    dailyData: newDailyData,
                                    topProducts: topProducts,
                                    allProductStats: productStats
                                };
                                
                                setMetrics(nextMetrics);
                                setDoc(doc(db, "singletons", "metrics"), nextMetrics);
                                customAlert("All metrics have been recalculated successfully!");
                          });
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      <RefreshCw className="h-5 w-5" /> Recalculate Metrics
                    </button>
                    {backupData && (
                      <button 
                        onClick={() => setIsUndoModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 font-bold text-white shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                      >
                        <RefreshCw className="h-5 w-5" /> Undo / Rescue Backup
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
              )
            )}

            {activeTab === "shops" && currentUser && currentUser.status !== "pending" && (currentUser.role === "admin" || currentUser.role === "employee") && (
              !isLoaded.shops ? <SkeletonLoader /> : (
              <motion.div 
                key="shops"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12 pb-20"
              >
                <div className="flex flex-col gap-4 py-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Registered Shops</h2>
                    <p className="mt-2 text-lg text-slate-500">Manage wholesale client shops and filter by zone.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <CustomSelect 
                       value={zoneFilter} 
                       onChange={v => setZoneFilter(v)} 
                       options={[
                          { label: "All Zones", value: "All" },
                          { label: "Gulshan", value: "Gulshan" },
                          { label: "Badda", value: "Badda" },
                          { label: "Tejgaon", value: "Tejgaon" }
                       ]}
                       className="w-48"
                     />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {shops.filter(s => zoneFilter === "All" || s.zone === zoneFilter).map((shop, idx) => (
                    <div key={`shop-card-${shop._docId || shop.id}-${idx}`} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-lg relative group">
                      {shop.image && (
                        <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                           <img src={shop.image} className="h-full w-full object-cover" alt="Shop" />
                        </div>
                      )}
                      <div className="flex-1 w-full relative pr-10">
                        <h4 className="text-lg font-bold text-slate-900 truncate">{shop.name}</h4>
                        <span className="inline-block px-2 py-1 mb-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{shop.zone}</span>
                        <div className="space-y-1 text-sm text-slate-500 font-medium">
                           <p className="flex items-center gap-2"><User className="h-4 w-4" /> {shop.ownerName}</p>
                           <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {shop.phone}</p>
                           <p className="text-xs mt-2 line-clamp-2">{shop.address}</p>
                        </div>
                      </div>
                      {currentUser && currentUser.role === "admin" && (
                        <button 
                          onClick={() => {
                            setShopToDelete(shop);
                          }}
                          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Shop"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {shops.filter(s => zoneFilter === "All" || s.zone === zoneFilter).length === 0 && (
                    <div className="col-span-full py-12 text-center">
                       <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-slate-600">No Shops Found</h3>
                       <p className="text-slate-400 mt-2">No wholesale shops match the selected zone filter.</p>
                    </div>
                  )}
                </div>
              </motion.div>
              )
            )}

            {activeTab === "orders" && currentUser && currentUser.status !== "pending" && (currentUser.role === "admin" || currentUser.role === "employee") && (
              !isLoaded.orders ? <SkeletonLoader /> : (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12 pb-20"
              >
                <div className="flex flex-col gap-4 py-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">History</h2>
                    <p className="mt-2 text-lg text-slate-500">View past sales and restock activities.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-end mb-4">
                       <div className="flex items-center gap-2">
                         <input 
                           type="date"
                           value={orderStartDate}
                           onChange={e => setOrderStartDate(e.target.value)}
                           className="rounded-full border border-slate-200 bg-white py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                         />
                         <span className="text-slate-400 font-medium">to</span>
                         <input 
                           type="date"
                           value={orderEndDate}
                           onChange={e => setOrderEndDate(e.target.value)}
                           className="rounded-full border border-slate-200 bg-white py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                         />
                       </div>
                       <div className="relative">
                         <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                         <input 
                           type="text" 
                           value={orderSearchTerm}
                           onChange={e => setOrderSearchTerm(e.target.value)}
                           placeholder="Search history by ID, product, user..." 
                           className="w-full sm:w-64 rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                         />
                       </div>
                       <span className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 whitespace-nowrap">
                         <Package className="h-4 w-4" /> {orders.length} Records
                       </span>
                    </div>

                
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {orders.length > 0 ? orders.filter(order => {
                    const search = orderSearchTerm.toLowerCase();
                    const matchesSearch = 
                       order.id.toString().includes(search) || 
                       (order.productName && order.productName.toLowerCase().includes(search)) ||
                       (order.userName && order.userName.toLowerCase().includes(search)) ||
                       (order.shopInfo && order.shopInfo.name && order.shopInfo.name.toLowerCase().includes(search)) ||
                       (order.cartItems && order.cartItems.some((item: any) => item.productName && item.productName.toLowerCase().includes(search)));
                    
                    const orderDate = order.timestamp ? new Date(order.timestamp).toISOString().split('T')[0] : '';
                    const matchesStartDate = orderStartDate ? orderDate >= orderStartDate : true;
                    const matchesEndDate = orderEndDate ? orderDate <= orderEndDate : true;
                    
                    return matchesSearch && matchesStartDate && matchesEndDate;
                  }).map(order => {
                     let imgUrl = null;
                     if (order.type === 'wholesale' && order.shopInfo?.image) {
                        imgUrl = order.shopInfo.image;
                     } else if (order.type === 'sale' && order.cartItems && order.cartItems.length === 1) {
                        const prod = inventory.find(p => p.id === order.cartItems[0].productId);
                        if (prod && prod.image) imgUrl = prod.image;
                     } else if (order.productId) {
                        const prod = inventory.find(p => p.id === order.productId);
                        if (prod && prod.image) imgUrl = prod.image;
                     } 
                     
                     return (
                    <div key={order.id} className="rounded-[2rem] bg-white p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center hover:shadow-md hover:border-slate-300 transition group overflow-hidden relative">
                      {imgUrl ? (
                         <img src={imgUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-sm bg-slate-50 border border-slate-100 shrink-0 cursor-pointer" alt="Item" onClick={() => setPreviewImage(imgUrl)} />
                      ) : (
                         <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                            <Package className="w-8 h-8 text-slate-300" />
                         </div>
                      )}
                      
                      <div className="flex-1 flex flex-col sm:flex-row gap-4 justify-between w-full">
                         <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                               <span className="text-xs font-black px-2 py-1 rounded bg-slate-100 text-slate-500">#{order.id}</span>
                               <span className={cn("text-xs font-bold px-2 py-1 rounded tracking-wide", 
                                 order.type === "restock" ? "bg-amber-100 text-amber-700" : 
                                 order.type === "wholesale" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                               )}>
                                 {order.type === "restock" ? "RESTOCK" : order.type === "wholesale" ? "WHOLESALE" : "SALE"}
                               </span>
                               <span className="text-xs font-bold text-slate-400">
                                 Created: {new Date(order.timestamp).toLocaleString()}
                               </span>
                               {order.completionTime && (
                                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                   Completed: {new Date(order.completionTime).toLocaleString()}
                                 </span>
                               )}
                            </div>
                            
                            <h4 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                               {order.cartItems && order.cartItems.length > 1 ? (
                                  order.cartItems.length + " Products Order"
                               ) : order.productName}
                            </h4>
                            
                            <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                               {order.userName && (
                                  <span className="flex items-center gap-1 font-bold"><User className="w-4 h-4" /> {order.userName}</span>
                               )}
                               {order.type === "wholesale" && order.shopInfo?.name && (
                                  <span className="flex items-center gap-1 text-indigo-600 font-bold"><Briefcase className="w-4 h-4" /> {order.shopInfo.name}</span>
                               )}
                               {order.purchaserName && (
                                  <span className="flex items-center gap-1 text-slate-700 font-bold"><User className="w-4 h-4" /> {order.purchaserName}</span>
                               )}
                            </div>
                            
                            {order.cartItems && order.cartItems.length > 1 ? (
                                <div className="flex flex-col gap-1 mt-3 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-sm">
                                   {order.cartItems.map((item, idxx) => (
                                      <span key={idxx}>• {item.quantity}x {item.productName} (৳{item.totalPrice?.toLocaleString()})</span>
                                   ))}
                                </div>
                            ) : (
                                <div className="mt-3 flex gap-2 items-center flex-wrap">
                                  <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                                     Qty: <span className="text-slate-900">{order.quantity}</span>
                                  </span>
                                  {order.source && (
                                    <span className="text-xs uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1.5 rounded-lg">
                                      {order.source}
                                    </span>
                                  )}
                                </div>
                            )}
                            
                            {order.status === "cancelled" && orderSearchTerm && orderSearchTerm.includes(order.id.toString()) && (
                              <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded mt-2 block w-max">
                                This delivery has been cancelled by admin
                              </span>
                            )}
                         </div>
                         
                         <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 min-w-[140px] bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none border border-slate-100 sm:border-transparent">
                            <div className={cn("text-3xl font-black", order.type === "restock" ? "text-red-500" : "text-emerald-500")}>
                              {order.type === "restock" ? "-" : "+"}৳{Number(order.totalPrice).toLocaleString()}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                               {order.fileId ? (
                                 <a href={"https://drive.google.com/open?id=" + order.fileId} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View Document">
                                   <FileText className="w-4 h-4" /> Doc
                                 </a>
                               ) : null}
                               {currentUser && currentUser.role === "admin" && (
                                 <button onClick={() => {
                                    customConfirm("Are you sure you want to cancel this history log?", () => {
                                       deleteDoc(doc(db, "orders", order.id.toString()));
                                        if (metrics) {
                                           let updatedMetrics = { ...metrics };
                                           const orderDate = order.timestamp ? order.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
                                           const orderMonth = order.timestamp ? new Date(order.timestamp).getMonth() : new Date().getMonth();
                                           let newMonthlyData = updatedMetrics.monthlyData ? [...updatedMetrics.monthlyData] : [];
                                           let newDailyData = updatedMetrics.dailyData ? [...updatedMetrics.dailyData] : [];
                                           if (order.type === "sale" || order.type === "wholesale") {
                                              if (newMonthlyData[orderMonth]) {
                                                 newMonthlyData[orderMonth].earning = Math.max(0, (newMonthlyData[orderMonth].earning || 0) - Number(order.totalPrice));
                                              }
                                              const dailyIdx = newDailyData.findIndex((d) => d.date === orderDate);
                                              if (dailyIdx >= 0) {
                                                 newDailyData[dailyIdx].earning = Math.max(0, (newDailyData[dailyIdx].earning || 0) - Number(order.totalPrice));
                                              }
                                              updatedMetrics.orderCount = Math.max(0, (updatedMetrics.orderCount || 0) - 1);
                                           } else {
                                              if (newMonthlyData[orderMonth]) {
                                                 newMonthlyData[orderMonth].cost = Math.max(0, (newMonthlyData[orderMonth].cost || 0) - Number(order.totalPrice));
                                              }
                                              const dailyIdx = newDailyData.findIndex((d) => d.date === orderDate);
                                              if (dailyIdx >= 0) {
                                                 newDailyData[dailyIdx].cost = Math.max(0, (newDailyData[dailyIdx].cost || 0) - Number(order.totalPrice));
                                              }
                                           }
                                           if (order.type === "restock") {
                                              const dependentSales = orders.filter(o => o.productId === order.productId && (o.type === "sale" || o.type === "wholesale") && new Date(o.timestamp) > new Date(order.timestamp));
                                              dependentSales.forEach(sale => {
                                                 const saleDate = sale.timestamp ? sale.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
                                                 const saleMonth = sale.timestamp ? new Date(sale.timestamp).getMonth() : new Date().getMonth();
                                                 if (newMonthlyData[saleMonth]) {
                                                    newMonthlyData[saleMonth].earning = Math.max(0, (newMonthlyData[saleMonth].earning || 0) - Number(sale.totalPrice));
                                                 }
                                                 const saleDailyIdx = newDailyData.findIndex((d) => d.date === saleDate);
                                                 if (saleDailyIdx >= 0) {
                                                    newDailyData[saleDailyIdx].earning = Math.max(0, (newDailyData[saleDailyIdx].earning || 0) - Number(sale.totalPrice));
                                                 }
                                                 updatedMetrics.orderCount = Math.max(0, (updatedMetrics.orderCount || 0) - 1);
                                              });
                                           }
                                           updatedMetrics.monthlyData = newMonthlyData;
                                           updatedMetrics.dailyData = newDailyData;
                                           if (autoCalculateEarnings) {
                                              updatedMetrics.revenue = newMonthlyData.reduce((acc, d) => acc + (d.earning || 0), 0) || 0;
                                              updatedMetrics.cost = newMonthlyData.reduce((acc, d) => acc + (d.cost || 0), 0) || 0;
                                              updatedMetrics.earning = updatedMetrics.revenue - updatedMetrics.cost - (updatedMetrics.salary || 0);
                                           }
                                           setMetrics(updatedMetrics);
                                           setDoc(doc(db, "singletons", "metrics"), updatedMetrics);
                                        }
                                       const product = inventory.find(p => p.id === order.productId);
                                       if (product) {
                                          let newStockNum = 0;
                                          let salesCancelledQty = 0;
                                          if (order.type === "restock") {
                                             const dependentSales = orders.filter(o => o.productId === order.productId && (o.type === "sale" || o.type === "wholesale") && new Date(o.timestamp) > new Date(order.timestamp));
                                             dependentSales.forEach(sale => {
                                                deleteDoc(doc(db, "orders", sale.id.toString()));
                                                salesCancelledQty += Number(sale.quantity);
                                             });
                                          }
                                          const currentStockMatch = product.stock ? product.stock.match(/[0-9]+/) : null;
                                          if (currentStockMatch) {
                                            const currentStockNum = Number(currentStockMatch[0]);
                                            if (order.type === "sale" || order.type === "wholesale") {
                                               newStockNum = currentStockNum + Number(order.quantity);
                                            } else {
                                               newStockNum = Math.max(0, currentStockNum - Number(order.quantity) + salesCancelledQty);
                                            }
                                            const newStockStr = product.stock.replace(/[0-9]+/, newStockNum.toString());
                                            setDoc(doc(db, "inventory", product.id.toString()), { ...product, stock: newStockStr });
                                          }
                                       }
                                    });
                                 }} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="Cancel Log">
                                   <Trash2 className="w-5 h-5" />
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                  }) : (
                    <div className="col-span-full py-20 text-center bg-slate-50 border border-slate-200 border-dashed rounded-[3rem]">
                       <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                       <h3 className="text-2xl font-bold text-slate-500 mb-2">No History Found</h3>
                       <p className="text-slate-400 font-medium">Try adjusting your search or date filters.</p>
                    </div>
                  )}
                </div>

              </motion.div>
              )
            )}

            {activeTab === "deliveries" && currentUser && currentUser.status !== "pending" && (currentUser.role === "admin" || (currentUser.role?.toLowerCase().includes("delivery") || currentUser.jobTitle?.toLowerCase().includes("delivery"))) && (
              !isLoaded.orders || !isLoaded.shops ? <SkeletonLoader /> : (
              <motion.div 
                key="deliveries"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-6">
                   <div>
                     <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Delivery Portal</h2>
                     <p className="mt-1 text-lg text-slate-500">Manage and complete pending wholesale operations.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:flex-wrap justify-stretch sm:justify-start items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                     {currentUser?.role === "admin" && (
                       <div className="flex items-center gap-2">
                         <CustomSelect 
                           value={archiveDuration} 
                           onChange={v => setArchiveDuration(v)} 
                           options={[
                             { label: "Older than 3 Days", value: "3" },
                             { label: "Older than 7 Days", value: "7" },
                             { label: "Older than 30 Days", value: "30" },
                             { label: "All Finished", value: "0" }
                           ]}
                           className="w-full sm:w-56 shadow-sm"
                         />
                         <button
                           onClick={() => {
                             customConfirm("Archiving will remove selected 'Completed' and 'Cancelled' deliveries from this portal based on duration, but they will remain in History. Proceed?", () => {
                               const cutoffDate = new Date();
                               cutoffDate.setDate(cutoffDate.getDate() - parseInt(archiveDuration));
                               const toArchive = orders.filter(o => {
                                 if (o.type !== "wholesale" || o.deliveryHidden || (o.status !== "completed" && o.status !== "cancelled")) return false;
                                 if (archiveDuration === "0") return true; 
                                 const statusDateStr = o.completionTime || o.timestamp; 
                                 if (statusDateStr) {
                                   const statusDate = new Date(statusDateStr);
                                   return statusDate < cutoffDate;
                                 }
                                 return true;
                               });
                               toArchive.forEach(o => {
                                 setDoc(doc(db, "orders", o.id.toString()), { ...o, deliveryHidden: true }, { merge: true }).catch(console.error);
                               });
                               customAlert(`Archived ${toArchive.length} finished delivery log(s) from portal.`);
                             });
                           }}
                           className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-200"
                         >
                           <Trash2 className="h-4 w-4" />
                           Clear
                         </button>
                       </div>
                     )}
                     <CustomSelect 
                       value={zoneFilter} 
                       onChange={v => setZoneFilter(v)} 
                       options={[
                          { label: "All Zones", value: "All" },
                          { label: "Gulshan", value: "Gulshan" },
                          { label: "Badda", value: "Badda" },
                          { label: "Tejgaon", value: "Tejgaon" }
                       ]}
                       className="w-48 shadow-sm"
                     />
                   </div>
                </div>
                <div className="grid gap-6">
                   {orders.filter(o => o.type === "wholesale" && !o.deliveryHidden && (zoneFilter === "All" || o.shopInfo?.zone === zoneFilter)).map((order, idx) => (
                      <div key={`order-card-${order._docId || order.id}-${idx}`} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
                         <div className="flex items-center gap-6">
                            {order.shopInfo?.image ? (
                               <img 
                                  src={order.shopInfo.image} 
                                  className="w-20 h-20 rounded-2xl object-cover shadow-sm ring-1 ring-slate-100 cursor-pointer hover:opacity-80 transition" 
                                  alt="Shop" 
                                  onClick={() => setPreviewImage(order.shopInfo.image)}
                               />
                            ) : (
                               <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm">
                                  <Briefcase className="w-8 h-8 text-slate-300" />
                               </div>
                            )}
                            <div>
                               <h4 className="text-xl font-bold text-slate-800">{order.shopInfo?.name || "Unknown Shop"}</h4>
                               <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 font-medium">
                                 <span className="flex items-center gap-1"><User className="w-4 h-4" /> {order.shopInfo?.ownerName}</span>
                                 <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {order.shopInfo?.phone}</span>
                                 <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {order.shopInfo?.address} ({order.shopInfo?.zone})</span>
                               </div>
                               <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-700">
                                 <Package className="w-4 h-4 text-indigo-500" />
                                 {order.cartItems && order.cartItems.length > 0 ? (
                                    <div className="flex flex-col">
                                       <span className="text-indigo-600 block">{order.quantity} Packages</span>
                                       <span className="text-xs text-slate-500 font-medium">Items: {order.cartItems.map((item: any) => item.productName).join(", ")}</span>
                                    </div>
                                 ) : (
                                    <span>{order.productName} ({order.quantity})</span>
                                 )}
                                 <span className="mx-2 text-slate-300">|</span>
                                 <span className="text-emerald-600">৳{order.totalPrice?.toLocaleString()}</span>
                               </div>
                               {order.userName && (
                                  <div className="mt-2 text-xs font-bold text-slate-400">Created by: {order.userName}</div>
                               )}
                            </div>
                         </div>
                         <div className="flex flex-col gap-3 min-w-[200px]">
                            {order.status === "completed" && (
                               <span className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl text-center w-full shadow-sm ring-1 ring-emerald-100">Delivery Completed</span>
                            )}
                            {order.status === "cancelled" && (
                               <span className="text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-xl text-center w-full shadow-sm ring-1 ring-rose-100">Delivery Cancelled</span>
                            )}
                            {(order.status === "pending" || !order.status) && (
                               <>
                                 <button onClick={() => {
                                    setDoc(doc(db, "orders", order.id.toString()), { ...order, status: "completed", completionTime: new Date().toISOString() }, { merge: true });
                                    // Update metrics on completion
                                    const today = new Date().toISOString().split('T')[0];
                                    const monthIndex = new Date().getMonth();
                                    if (metrics) {
                                       const newMonthlyData = metrics.monthlyData ? [...metrics.monthlyData] : [];
                                       if (newMonthlyData[monthIndex]) {
                                           newMonthlyData[monthIndex].earning = (newMonthlyData[monthIndex].earning || 0) + (order.totalPrice || 0);
                                           newMonthlyData[monthIndex].orderCount = (newMonthlyData[monthIndex].orderCount || 0) + 1;
                                       }
                                       
                                       const newDailyData = metrics.dailyData ? [...metrics.dailyData] : [];
                                       const dailyIndex = newDailyData.findIndex((d: any) => d.date === today);
                                       if (dailyIndex >= 0) {
                                           newDailyData[dailyIndex].earning += (order.totalPrice || 0);
                                           newDailyData[dailyIndex].orderCount = (newDailyData[dailyIndex].orderCount || 0) + 1;
                                       } else {
                                           newDailyData.push({ date: today, cost: 0, earning: (order.totalPrice || 0), orderCount: 1, cancelledCount: 0 });
                                       }
                                       newDailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));

                                       const currentStats = metrics.allProductStats ? JSON.parse(JSON.stringify(metrics.allProductStats)) : {};
                                       const addStat = (id: string, name: string, qty: any, rev: number) => {
                                           if (!id || String(id).startsWith('cart-')) return;
                                           if (!currentStats[id]) {
                                               currentStats[id] = { name: name || 'Unknown', quantity: 0, revenue: 0 };
                                           }
                                           let qVal = 0;
                                           if (typeof qty === 'number') qVal = qty;
                                           else if (typeof qty === 'string') {
                                               const str = qty.toLowerCase();
                                               if (str.includes('units)')) {
                                                   const match = str.match(/\(([0-9.]+)\s*units\)/);
                                                   if (match) qVal = Number(match[1]);
                                               } else qVal = parseFloat(str) || 0;
                                           }
                                           currentStats[id].quantity += qVal;
                                           currentStats[id].revenue += rev;
                                       };

                                       if (order.cartItems && Array.isArray(order.cartItems)) {
                                           order.cartItems.forEach((item: any) => addStat(item.productId, item.productName, item.quantity, Number(item.totalPrice || 0)));
                                       } else {
                                           addStat(order.productId, order.productName, order.quantity, Number(order.totalPrice || 0));
                                       }
                                       const topProducts = Object.values(currentStats).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5);

                                       const newMetrics = { 
                                          ...metrics, 
                                          orderCount: (metrics.orderCount || 0) + 1, 
                                          revenue: (metrics.revenue || 0) + (order.totalPrice || 0),
                                          monthlyData: newMonthlyData, 
                                          dailyData: newDailyData,
                                          allProductStats: currentStats,
                                          topProducts: topProducts
                                       };
                                       setMetrics(newMetrics);
                                       setDoc(doc(db, "singletons", "metrics"), newMetrics);
                                    }
                                 }} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-xl shadow-green-100 hover:bg-green-700 transition active:scale-95">Complete Delivery</button>
                                 
                                 {currentUser && currentUser.role === "admin" && (
                                   <button onClick={() => {
                                      customConfirm("Are you sure you want to cancel this delivery?", () => {
                                         setDoc(doc(db, "orders", order.id.toString()), { ...order, status: "cancelled", completionTime: new Date().toISOString() }, { merge: true });
                                         
                                         const todayStr = new Date().toISOString().split('T')[0];
                                         const monthIndex = new Date().getMonth();
                                         if (metrics) {
                                             const newMonthlyData = metrics.monthlyData ? [...metrics.monthlyData] : [];
                                             if (newMonthlyData[monthIndex]) {
                                                 newMonthlyData[monthIndex].cancelledCount = (newMonthlyData[monthIndex].cancelledCount || 0) + 1;
                                             }
                                             const newDailyData = metrics.dailyData ? [...metrics.dailyData] : [];
                                             const dailyIndex = newDailyData.findIndex((d: any) => d.date === todayStr);
                                             if (dailyIndex >= 0) {
                                                 newDailyData[dailyIndex].cancelledCount = (newDailyData[dailyIndex].cancelledCount || 0) + 1;
                                             } else {
                                                 newDailyData.push({ date: todayStr, cost: 0, earning: 0, orderCount: 0, cancelledCount: 1 });
                                             }
                                             newDailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));
                                             
                                             const newMetrics = {
                                                 ...metrics,
                                                 cancelledCount: (metrics.cancelledCount || 0) + 1,
                                                 monthlyData: newMonthlyData,
                                                 dailyData: newDailyData
                                             };
                                             setMetrics(newMetrics);
                                             setDoc(doc(db, "singletons", "metrics"), newMetrics);
                                         }

                                         // Restore stock
                                         if (order.cartItems) {
                                           order.cartItems.forEach((item: any) => {
                                             const product = inventory.find(p => p.id === item.productId);
                                             if (product && item.sellUnits) {
                                                const currentStockMatch = product.stock.match(/[0-9]+(\.[0-9]+)?/);
                                                if (currentStockMatch) {
                                                  let newStockNum = Number(currentStockMatch[0]) + item.sellUnits;
                                                  newStockNum = Math.round(newStockNum * 100) / 100;
                                                  const newStockStr = product.stock.replace(/[0-9]+(\.[0-9]+)?/, newStockNum.toString());
                                                  setDoc(doc(db, "inventory", product.id.toString()), {
                                                     ...product,
                                                     stock: newStockStr,
                                                     stockStatus: newStockNum > 0 ? "In Stock" : "Out of Stock"
                                                  });
                                                }
                                             }
                                           });
                                         }
                                      });
                                   }} className="w-full bg-rose-50 text-rose-600 font-bold py-3 px-4 rounded-xl hover:bg-rose-100 transition active:scale-95">Cancel Delivery</button>
                                 )}
                               </>
                            )}
                         </div>
                      </div>
                   ))}
                   {orders.filter(o => o.type === "wholesale" && !o.deliveryHidden && (zoneFilter === "All" || o.shopInfo?.zone === zoneFilter)).length === 0 && (
                     <div className="text-slate-400 font-bold text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">No wholesale deliveries pending or completed for this zone.</div>
                   )}
                </div>
              </motion.div>
              )
            )}

            {activeTab === "restock" && currentUser && currentUser.status !== "pending" && (currentUser.role === "admin" || (currentUser.role?.toLowerCase().includes("supplier") || currentUser.jobTitle?.toLowerCase().includes("supplier") || currentUser.role?.toLowerCase().includes("warehouse") || currentUser.jobTitle?.toLowerCase().includes("warehouse"))) && (
              !isLoaded.inventory ? <SkeletonLoader /> : (
              <motion.div 
                key="restock"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12 pb-20"
              >
                <div className="flex flex-col gap-4 py-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Restock Inventory</h2>
                    <p className="mt-2 text-lg text-slate-500">Record imported stock and add costs to daily expenses.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     {currentUser && (currentUser.role === "admin" || currentUser.jobTitle?.toLowerCase().includes("warehouse")) && (
                       <button
                         onClick={() => {
                           customPrompt("Enter new maximum inventory limit:", config?.maxInventory?.toString() || "500", (newSize) => {
                             const parsed = Number(newSize);
                             if (!isNaN(parsed) && parsed > 0) {
                                setDoc(doc(db, "singletons", "config"), { ...config, maxInventory: parsed });
                             }
                           });
                         }}
                         className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
                       >
                         <PackagePlus className="h-4 w-4" /> Set Inventory Size
                       </button>
                     )}
                     <span className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                       <PackagePlus className="h-4 w-4" /> Import Management
                     </span>
                  </div>
                </div>

                <div className="rounded-[2rem] sm:rounded-[3rem] bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-100 max-w-3xl">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">Product</label>
                       <div className="relative">
                         <button
                           type="button"
                           onClick={() => setIsRestockDropdownOpen(!isRestockDropdownOpen)}
                           className="w-full relative flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-left outline-none focus:ring-2 focus:ring-green-500 transition-all hover:bg-slate-100"
                         >
                           {restockProduct ? (
                             <div className="flex items-center gap-4">
                               <img 
                                 src={inventory.find(p => p.id.toString() === restockProduct)?.image} 
                                 alt="" 
                                 className="h-10 w-10 min-w-10 rounded-xl object-cover shadow-sm bg-white" 
                               />
                               <div className="flex flex-col">
                                 <span className="text-lg font-bold text-slate-900 leading-tight">
                                   {inventory.find(p => p.id.toString() === restockProduct)?.name}
                                 </span>
                                 <span className="text-sm font-medium text-slate-500">
                                   Current Stock: <span className="font-bold text-slate-700">{inventory.find(p => p.id.toString() === restockProduct)?.stock}</span>
                                 </span>
                               </div>
                             </div>
                           ) : (
                             <span className="text-xl font-bold text-slate-400">Select a product...</span>
                           )}
                           <ChevronDown className={cn("h-6 w-6 text-slate-400 transition-transform", isRestockDropdownOpen && "rotate-180")} />
                         </button>
                         
                         <AnimatePresence>
                           {isRestockDropdownOpen && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-100"
                             >
                             {inventory.map((p, idx) => (
                                 <button
                                   key={`modal-prod-${p._docId || p.id}-${idx}`}
                                   onClick={() => {
                                     setRestockProduct(p.id.toString());
                                     setIsRestockDropdownOpen(false);
                                   }}
                                   className={cn(
                                     "w-full flex items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-slate-50",
                                     restockProduct === p.id.toString() ? "bg-slate-50 ring-1 ring-slate-200" : ""
                                   )}
                                 >
                                   <img 
                                     src={p.image} 
                                     alt="" 
                                     className="h-12 w-12 min-w-12 rounded-xl object-cover shadow-sm bg-white" 
                                   />
                                   <div className="flex flex-col">
                                     <span className="text-lg font-bold text-slate-900 leading-tight">{p.name}</span>
                                     <span className="text-sm font-medium text-slate-500">
                                       Stock: <span className="font-bold text-slate-700">{p.stock}</span>
                                       {p.kgPerUnit && ` • ${p.kgPerUnit}`}
                                     </span>
                                   </div>
                                 </button>
                               ))}
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">Date</label>
                       <input 
                         type="date" 
                         value={restockDate}
                         onChange={e => setRestockDate(e.target.value)}
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                       />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                       <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Quantity to Add</label>
                         <input 
                           type="number" 
                           placeholder="0"
                           value={restockQuantity}
                           onChange={e => setRestockQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Cost (৳)</label>
                         <input 
                           type="number" 
                           placeholder="0"
                           value={restockCost}
                           onChange={e => setRestockCost(e.target.value === "" ? "" : Number(e.target.value))}
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                         />
                       </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => {
                           if (!restockProduct || !restockQuantity || !restockDate) return;
                           const product = inventory.find(p => p.id.toString() === restockProduct);
                           if (!product) return;
                           
                           const addedQuantity = Number(restockQuantity) || 0;
                           const costAmount = Number(restockCost) || 0;
                           
                           // Update Stock
                           const currentStockMatch = product.stock.match(/[0-9]+/);
                           let newStockStr = product.stock;
                           if (currentStockMatch) {
                             const currentStockNum = Number(currentStockMatch[0]);
                             const newStockNum = currentStockNum + addedQuantity;
                             newStockStr = product.stock.replace(/[0-9]+/, newStockNum.toString());
                           } else {
                             newStockStr = `${addedQuantity} ${product.unit}`;
                           }
                           
                           setDoc(doc(db, "inventory", product.id.toString()), {
                              ...product,
                              stock: newStockStr
                           });

                           // Save to history collection for restocks
                           const historyId = Date.now();
                           const newHistory = {
                              id: historyId,
                              type: "restock",
                              userName: currentUser?.name || "Unknown",
                              productId: product.id,
                              productName: product.name,
                              quantity: addedQuantity,
                              unitPrice: addedQuantity > 0 ? costAmount / addedQuantity : 0,
                              totalPrice: costAmount,
                              timestamp: new Date().toISOString()
                           };
                           setDoc(doc(db, "orders", historyId.toString()), newHistory);

                           // Add cost to daily metrics if metrics exist
                           if (metrics) {
                             const monthIndex = new Date(restockDate).getMonth();
                             const newMonthlyData = metrics.monthlyData ? [...metrics.monthlyData] : [];
                             if (newMonthlyData[monthIndex]) {
                                newMonthlyData[monthIndex].cost = (newMonthlyData[monthIndex].cost || 0) + costAmount;
                             }
                             
                             const newDailyData = metrics.dailyData ? [...metrics.dailyData] : [];
                             const dailyIndex = newDailyData.findIndex((d: any) => d.date === restockDate);
                             if (dailyIndex >= 0) {
                                newDailyData[dailyIndex].cost = (newDailyData[dailyIndex].cost || 0) + costAmount;
                             } else {
                                newDailyData.push({ date: restockDate, cost: costAmount, earning: 0 });
                                newDailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));
                             }

                             const newMetrics = { 
                                ...metrics, 
                                cost: (metrics.cost || 0) + costAmount,
                                monthlyData: newMonthlyData, 
                                dailyData: newDailyData 
                             };
                             setMetrics(newMetrics);
                             setDoc(doc(db, "singletons", "metrics"), newMetrics);
                           }

                           customAlert("Inventory restocked successfully!");
                           setRestockProduct("");
                           setRestockQuantity("");
                           setRestockCost("");
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                      >
                         <PackagePlus className="h-5 w-5" /> Confirm Restock
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5" /> Add New Product
                  </button>
                  <button 
                    onClick={() => {
                      const demoProducts = [
                        { id: Date.now() + 1, name: "Premium BRRI Dhan 28", category: "Grains", price: "৳1,800", unit: "per sack", stock: "150 Sacks", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop", kgPerUnit: "50 Kg/Sack" },
                        { id: Date.now() + 2, name: "Export Quality Jute", category: "Cash Crops", price: "৳3,200", unit: "per quintal", stock: "85 Quintals", image: "https://images.unsplash.com/photo-1590400585675-01e40eb826fc?w=800&auto=format&fit=crop", kgPerUnit: "100 Kg/Quintal" },
                        { id: Date.now() + 3, name: "Deshi Red Lentils (Masur Dal)", category: "Pulses", price: "৳5,200", unit: "per sack", stock: "45 Sacks", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop", kgPerUnit: "25 Kg/Sack" },
                        { id: Date.now() + 4, name: "Organic Rajshahi Mangoes", category: "Fruits", price: "৳4,500", unit: "per crate", stock: "120 Crates", image: "https://images.unsplash.com/photo-1601493700631-2b1664b41829?w=800&auto=format&fit=crop", kgPerUnit: "20 Kg/Crate" }
                      ];
                      demoProducts.forEach(product => {
                         setDoc(doc(db, "inventory", product.id.toString()), product);
                      });
                      customAlert("Demo products loaded successfully!");
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <Package className="h-5 w-5" /> Load Demo Data
                  </button>
                  <button 
                    onClick={() => {
                      const demoNames = [
                        "Premium BRRI Dhan 28",
                        "Export Quality Jute",
                        "Deshi Red Lentils (Masur Dal)",
                        "Organic Rajshahi Mangoes"
                      ];
                      
                      let removedCount = 0;
                      if (inventory && inventory.length > 0) {
                         inventory.forEach(p => {
                            if (demoNames.includes(p.name)) {
                               deleteDoc(doc(db, "inventory", p.id.toString()));
                               removedCount++;
                            }
                         });
                      }
                      
                      if (removedCount > 0) {
                         customAlert(`${removedCount} demo products removed successfully! User added products were kept.`);
                      } else {
                         customAlert("No demo products found to remove.");
                      }
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200 px-6 py-3 font-bold text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                  >
                    <Trash2 className="h-5 w-5" /> Remove Demo Data
                  </button>
                </div>
              </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Cart Summary</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto overflow-x-hidden flex-1">
                 {cart.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-bold">Your cart is empty.</div>
                 ) : (
                    <div className="space-y-4">
                       {cart.map((item, idx) => {
                          let itemTotal = 0;
                          if (item.sellType === 'kg' && item.product.kgPerUnit) {
                              const kgMatch = item.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                              const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                              itemTotal = Math.round(item.quantity * (item.unitPrice / kgPerUnitValue));
                          } else {
                              itemTotal = item.quantity * item.unitPrice;
                          }
                          return (
                             <div key={`cart-item-${idx}`} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <img src={item.product?.image} className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" alt="" />
                                <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-slate-900 leading-tight">{item.product?.name}</h4>
                                      <button onClick={() => {
                                         // Restore stock in real time when removing from cart
                                         const currentStockMatch = item.product.stock.match(/[0-9]+(\.[0-9]+)?/);
                                         if (currentStockMatch) {
                                            const syncProduct = inventory.find(p => p.id === item.product.id) || item.product;
                                            const syncStockMatch = syncProduct.stock.match(/[0-9]+(\.[0-9]+)?/);
                                            if (syncStockMatch) {
                                               const syncStockNum = Number(syncStockMatch[0]);
                                               let newStockNum = syncStockNum + item.sellUnits;
                                               newStockNum = Math.round(newStockNum * 100) / 100;
                                               const newStockStr = syncProduct.stock.replace(/[0-9]+(\.[0-9]+)?/, newStockNum.toString());
                                               setDoc(doc(db, "inventory", syncProduct.id.toString()), {
                                                  ...syncProduct,
                                                  stock: newStockStr
                                               });
                                            }
                                         }
                                         setCart(c => c.filter((_, i) => i !== idx));
                                      }} className="text-rose-500 hover:text-rose-600 p-1">
                                        <X className="w-4 h-4" />
                                      </button>
                                   </div>
                                   <div className="flex justify-between items-end mt-2">
                                      <span className="text-sm font-bold text-slate-500">{item.quantity} {item.sellType === 'kg' ? 'Kg' : 'Units'} @ ৳{item.unitPrice}</span>
                                      <span className="font-bold text-green-600">৳{itemTotal.toLocaleString()}</span>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="block text-sm font-bold text-slate-500">Total Selection</span>
                      <span className="block text-lg font-bold text-slate-900">{cart.reduce((total, item) => total + item.quantity, 0)} Items</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-slate-500">Total Amount</span>
                      <span className="block text-2xl font-extrabold text-green-600">
                        ৳{cart.reduce((total, item) => {
                           let itemTotal = 0;
                           if (item.sellType === 'kg' && item.product.kgPerUnit) {
                               const kgMatch = item.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                               const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                               itemTotal = Math.round(item.quantity * (item.unitPrice / kgPerUnitValue));
                           } else {
                               itemTotal = item.quantity * item.unitPrice;
                           }
                           return total + itemTotal;
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                 </div>
                 <button 
                   disabled={cart.length === 0}
                   onClick={() => {
                     setOrderModal({ isOpen: true, step: 2, product: null, quantity: "", sellType: 'unit', shopDetails: { id: "", name: "", ownerName: "", phone: "", address: "", zone: "Gulshan", image: null } });
                     setIsCartOpen(false);
                   }}
                   className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white shadow-xl shadow-green-200 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Confirm Sale & Check Out
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {orderModal.isOpen && (orderModal.product || cart.length > 0) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Wholesale Order</h3>
              <button onClick={() => setOrderModal(m => ({...m, isOpen: false}))} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {orderModal.step === 1 ? (
                <>
                  {orderModal.product && (
                    <div className="flex items-center gap-4">
                      <img src={orderModal.product.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                      <div>
                        <h4 className="font-bold text-slate-900">{orderModal.product.name}</h4>
                        <p className="text-sm font-bold text-green-600">{orderModal.product.price} <span className="text-slate-400 font-medium">{orderModal.product.unit}</span></p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {orderModal.product?.kgPerUnit && (
                      <div className="flex bg-slate-100 rounded-xl p-1">
                        <button 
                          className={cn("flex-1 rounded-lg py-2 text-sm font-bold transition-all", orderModal.sellType === 'unit' ? 'bg-white text-slate-900 shadow font-extrabold' : 'text-slate-500 hover:text-slate-700')}
                          onClick={() => setOrderModal(m => ({...m, sellType: 'unit'}))}
                        >
                          By Unit
                        </button>
                        <button 
                          className={cn("flex-1 rounded-lg py-2 text-sm font-bold transition-all", orderModal.sellType === 'kg' ? 'bg-white text-slate-900 shadow font-extrabold' : 'text-slate-500 hover:text-slate-700')}
                          onClick={() => setOrderModal(m => ({...m, sellType: 'kg'}))}
                        >
                          By Weight (Kg)
                        </button>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase">Quantity To Sell {orderModal.sellType === 'kg' ? '(Kg)' : '(Units)'}</label>
                      <input 
                        type="number" 
                        min="1"
                        value={orderModal.quantity} 
                        onChange={e => setOrderModal(m => ({ ...m, quantity: e.target.value ? Number(e.target.value) : "" }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-6 flex justify-between items-center">
                    <span className="font-bold text-green-800">Total Earnings</span>
                    <span className="text-2xl font-black text-green-600">
                      ৳{(() => {
                        const pricePerUnit = Number(orderModal.product.price.replace(/[^0-9]/g, ''));
                        let total = 0;
                        if (orderModal.sellType === 'kg' && orderModal.product.kgPerUnit) {
                           const kgMatch = orderModal.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                           const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                           total = (Number(orderModal.quantity || 0) * (pricePerUnit / kgPerUnitValue));
                        } else {
                           total = Number(orderModal.quantity || 0) * pricePerUnit;
                        }
                        return Math.round(total).toLocaleString();
                      })()}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                         const sellQuantity = Number(orderModal.quantity || 0);
                         if (sellQuantity <= 0) {
                            customAlert("Please enter a valid quantity amount!");
                            return;
                         }
                         const pricePerUnit = Number(orderModal.product.price.replace(/[^0-9]/g, ''));
                         let sellUnits = 0;
                         if (orderModal.sellType === 'kg' && orderModal.product.kgPerUnit) {
                            const kgMatch = orderModal.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                            const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                            sellUnits = sellQuantity / kgPerUnitValue;
                         } else {
                            sellUnits = sellQuantity;
                         }
                         const currentStockMatch = orderModal.product.stock.match(/[0-9]+(\.[0-9]+)?/);
                         if (currentStockMatch) {
                           const currentStockNum = Number(currentStockMatch[0]);
                           if (sellUnits > currentStockNum) {
                              customAlert(`Cannot sell more than available stock (${currentStockNum}).`);
                              return;
                           }
                           
                           // Deduct stock in real-time when added to cart
                           let newStockNum = Math.max(0, currentStockNum - sellUnits);
                           newStockNum = Math.round(newStockNum * 100) / 100;
                           const newStockStr = orderModal.product.stock.replace(/[0-9]+(\.[0-9]+)?/, newStockNum.toString());
                           setDoc(doc(db, "inventory", orderModal.product.id.toString()), {
                              ...orderModal.product,
                              stock: newStockStr
                           });
                         }
                         setCart(prev => {
                           const existingIndex = prev.findIndex(item => item.product.id === orderModal.product.id && item.sellType === orderModal.sellType);
                           if (existingIndex >= 0) {
                             const newCart = [...prev];
                             newCart[existingIndex].quantity = Number(newCart[existingIndex].quantity) + sellQuantity;
                             newCart[existingIndex].sellUnits = Number(newCart[existingIndex].sellUnits) + sellUnits;
                             return newCart;
                           }
                           return [...prev, { product: orderModal.product, quantity: sellQuantity, sellType: orderModal.sellType, unitPrice: pricePerUnit, sellUnits }];
                         });
                         setOrderModal(m => ({ ...m, isOpen: false }));
                      }}
                      className="flex-1 rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => {
                         const sellQuantity = Number(orderModal.quantity || 0);
                         if (sellQuantity <= 0) {
                            customAlert("Please enter a valid quantity amount!");
                            return;
                         }
                         const pricePerUnit = Number(orderModal.product.price.replace(/[^0-9]/g, ''));
                         let sellUnits = 0;
                         if (orderModal.sellType === 'kg' && orderModal.product.kgPerUnit) {
                            const kgMatch = orderModal.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                            const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                            sellUnits = sellQuantity / kgPerUnitValue;
                         } else {
                            sellUnits = sellQuantity;
                         }
                         const currentStockMatch = orderModal.product.stock.match(/[0-9]+(\.[0-9]+)?/);
                         if (currentStockMatch) {
                           const currentStockNum = Number(currentStockMatch[0]);
                           if (sellUnits > currentStockNum) {
                              customAlert(`Cannot sell more than available stock (${currentStockNum}).`);
                              return;
                           }
                         }
                         setOrderModal(m => ({...m, step: 2}));
                      }}
                      className="flex-1 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
                    >
                      Direct Order
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="relative z-50">
                      <label className="text-xs font-bold text-slate-500 uppercase">Select from existing Shop</label>
                      <button
                        type="button"
                        onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                        className="w-full mt-1 relative flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-left outline-none focus:ring-2 focus:ring-green-500 transition-all hover:bg-slate-100"
                      >
                        {orderModal.shopDetails.id ? (
                          <div className="flex items-center gap-4">
                            {orderModal.shopDetails.image && (
                              <img src={orderModal.shopDetails.image} alt="" className="h-10 w-10 min-w-10 rounded-xl object-cover shadow-sm bg-white" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-slate-900 leading-tight">
                                {orderModal.shopDetails.name}
                              </span>
                              <span className="text-sm font-medium text-slate-500">
                                {orderModal.shopDetails.address} ({orderModal.shopDetails.zone})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-slate-400">Select a shop...</span>
                        )}
                        <ChevronDown className={cn("h-6 w-6 text-slate-400 transition-transform", isShopDropdownOpen && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {isShopDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-100"
                          >
                            <button
                               onClick={() => {
                                 setOrderModal(m => ({ ...m, shopDetails: { id: "", name: "", ownerName: "", phone: "", address: "", zone: "Gulshan", image: null } }));
                                 setIsShopDropdownOpen(false);
                               }}
                               className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-100 mb-2 font-bold text-slate-500 text-sm"
                            >
                               -- Clear Selection (New Shop) --
                            </button>
                            {shops.filter(s => !currentUser?.zone || currentUser.zone === "All" || s.zone === currentUser.zone || currentUser.role === "admin")
                              .filter(s => {
                                 const q = `${orderModal.shopDetails.name || ''} ${orderModal.shopDetails.ownerName || ''} ${orderModal.shopDetails.phone || ''}`.trim().toLowerCase();
                                 if (!q) return true;
                                 return `${s.name} ${s.ownerName} ${s.phone} ${s.address}`.toLowerCase().includes(q);
                              })
                              .map((s, idx) => (
                              <button
                                key={`shop-dropdown-${s._docId || s.id}-${idx}`}
                                onClick={() => {
                                  setOrderModal(m => ({ ...m, shopDetails: s }));
                                  setIsShopDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-slate-50",
                                  orderModal.shopDetails.id === s.id ? "bg-slate-50 ring-1 ring-slate-200" : ""
                                )}
                              >
                                {s.image && <img src={s.image} alt="" className="h-10 w-10 min-w-10 rounded-xl object-cover shadow-sm bg-white" />}
                                <div className="flex flex-col">
                                  <span className="text-base font-bold text-slate-900 leading-tight">{s.name}</span>
                                  <span className="text-sm font-medium text-slate-500">{s.address} ({s.zone})</span>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Shop Name" value={orderModal.shopDetails.name} onChange={e => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, name: e.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="text" placeholder="Owner Name" value={orderModal.shopDetails.ownerName} onChange={e => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, ownerName: e.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="tel" placeholder="Owner Number" value={orderModal.shopDetails.phone} onChange={e => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, phone: e.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500" />
                      <CustomSelect 
                          value={orderModal.shopDetails.zone} 
                          onChange={(v) => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, zone: v } }))} 
                          options={[
                             { label: "Gulshan", value: "Gulshan" },
                             { label: "Badda", value: "Badda" },
                             { label: "Tejgaon", value: "Tejgaon" }
                          ]}
                          className="bg-slate-50"
                      />
                    </div>
                    <input type="text" placeholder="Shop Address" value={orderModal.shopDetails.address} onChange={e => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, address: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500" />
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors flex-1 text-sm font-bold text-slate-700">
                        <Camera className="h-4 w-4" /> Take / Upload Shop Picture
                        <input type="file" accept="image/*" className="hidden" capture="environment" onChange={e => {
                          const file = e.target.files?.[0];
                          if(file) resizeImage(file, (dataUrl) => setOrderModal(m => ({ ...m, shopDetails: { ...m.shopDetails, image: dataUrl } })));
                        }} />
                      </label>
                      {orderModal.shopDetails.image && <img src={orderModal.shopDetails.image} className="h-12 w-12 rounded-lg object-cover" alt="Shop" />}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {(!(!orderModal.product && cart.length > 0)) && (
                      <button onClick={() => setOrderModal(m => ({...m, step: 1}))} className="rounded-2xl bg-slate-100 px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95">Back</button>
                    )}
                    <button 
                      onClick={() => {
                        const { name, ownerName, phone, address, zone } = orderModal.shopDetails;
                        if (!name || !ownerName || !phone || !address || !zone) {
                          customAlert("Please fill out all shop details!");
                          return;
                        }

                        let shopId = orderModal.shopDetails.id;
                        if (!shopId) {
                          const existingShop = shops.find(s => s.phone === phone);
                          if (existingShop) {
                            shopId = existingShop.id;
                            // Uses existing shop rather than recording again as duplicate
                          } else {
                            shopId = Date.now().toString();
                            setDoc(doc(db, "shops", shopId), { ...orderModal.shopDetails, id: shopId });
                          }
                        }

                        const isCartMode = !orderModal.product && cart.length > 0;
                        const processItem = (itemConfig: any) => {
                          const { product, quantity, sellType, unitPrice, sellUnits } = itemConfig;
                          let totalEarning = 0;
                          if (sellType === 'kg' && product.kgPerUnit) {
                             const kgMatch = product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/);
                             const kgPerUnitValue = kgMatch ? Number(kgMatch[0]) : 1;
                             totalEarning = Math.round(quantity * (unitPrice / kgPerUnitValue));
                          } else {
                             totalEarning = quantity * unitPrice;
                          }

                          // Deduct stock immediately to reserve it (only for direct orders, cart already deducted)
                          if (!isCartMode) {
                              const currentStockMatch = product.stock.match(/[0-9]+(\.[0-9]+)?/);
                              let newStockStr = product.stock;
                              if (currentStockMatch) {
                                const currentStockNum = Number(currentStockMatch[0]);
                                let newStockNum = Math.max(0, currentStockNum - sellUnits);
                                newStockNum = Math.round(newStockNum * 100) / 100;
                                newStockStr = product.stock.replace(/[0-9]+(\.[0-9]+)?/, newStockNum.toString());
                              }
                              setDoc(doc(db, "inventory", product.id.toString()), {
                                 ...product,
                                 stock: newStockStr
                              });
                          }

                          return {
                             productId: product.id,
                             productName: product.name,
                             quantity: sellUnits === quantity ? quantity : `${quantity} Kg (${Math.round(sellUnits * 100) / 100} units)`,
                             unitPrice: unitPrice,
                             totalPrice: totalEarning,
                          };
                        };

                        const itemsToProcess = isCartMode ? cart : [{
                           product: orderModal.product,
                           quantity: Number(orderModal.quantity || 0),
                           sellType: orderModal.sellType,
                           unitPrice: Number(orderModal.product?.price?.replace(/[^0-9]/g, '') || 0),
                           sellUnits: orderModal.sellType === 'kg' && orderModal.product?.kgPerUnit ? 
                              Number(orderModal.quantity || 0) / (Number(orderModal.product.kgPerUnit.match(/[0-9]+(\.[0-9]+)?/)?.[0] || 1)) 
                              : Number(orderModal.quantity || 0)
                        }];

                        const processedItems = itemsToProcess.map(processItem);
                        const grandTotal = processedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

                        // Save order as pending (metrics update on completion)
                        const orderId = Date.now();
                        const newOrder = {
                           id: orderId,
                           type: "wholesale",
                           status: "pending", // pending, completed, cancelled
                           userName: currentUser?.name || "Unknown",
                           productId: isCartMode ? `cart-${orderId}` : processedItems[0].productId,
                           productName: isCartMode ? `Cart Order (${cart.length} items)` : processedItems[0].productName,
                           quantity: isCartMode ? `${cart.length} Products` : processedItems[0].quantity,
                           unitPrice: isCartMode ? 0 : processedItems[0].unitPrice,
                           totalPrice: grandTotal,
                           cartItems: processedItems,
                           shopInfo: { id: shopId, name, ownerName, phone, address, zone, image: orderModal.shopDetails.image },
                           timestamp: new Date().toISOString()
                        };
                        setDoc(doc(db, "orders", orderId.toString()), newOrder);

                        if (isCartMode) {
                           setCart([]);
                        }

                        customAlert(`Sale recorded and pushed to Delivery Portal. Total amount: ৳${grandTotal.toLocaleString()}`);
                        setOrderModal({ isOpen: false, step: 1, product: null, quantity: "", sellType: 'unit', shopDetails: { id: "", name: "", ownerName: "", phone: "", address: "", zone: "Gulshan", image: null } });
                      }}
                      className="flex-1 rounded-2xl bg-green-600 py-4 font-bold text-white shadow-xl shadow-green-200 transition-all hover:bg-green-700 active:scale-95"
                    >
                      Complete Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {shopToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-8 ring-rose-50 border border-rose-100">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-2xl font-black tracking-tight text-slate-800">Delete Shop?</h3>
              <p className="text-slate-500 font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-700">{shopToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 pt-4">
              <button
                onClick={() => setShopToDelete(null)}
                className="rounded-2xl bg-white border border-slate-200 px-4 py-3.5 font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                   try {
                     await deleteDoc(doc(db, "shops", (shopToDelete._docId || shopToDelete.id).toString()));
                   } catch (err: any) {
                     customAlert(`Error deleting shop: ${err.message}`);
                   }
                   setShopToDelete(null);
                }}
                className="rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200 px-4 py-3.5 font-bold hover:bg-rose-600 transition-all active:scale-95"
              >
                Delete Shop
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <AlertCircle className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  This action will completely reset all dashboard stats, inventory stock, products, and prices, and clear all past data. User and employee data will remain intact. You will be able to undo this action for up to 60 minutes.
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  disabled={isResetting}
                  onClick={async () => {
                    if (isResetting) return;
                    setIsResetting(true);
                    try {
                        const allOrdersSnapshot = await getDocs(collection(db, "orders"));
                        const allOrdersData = allOrdersSnapshot.docs.map(d => d.data());
                        
                        // Clear old backup subcollections
                        const oldInv = await getDocs(collection(db, "singletons", "backup", "inventory"));
                        if (oldInv.docs.length > 0) {
                            await Promise.all(oldInv.docs.map(d => deleteDoc(d.ref)));
                        }
                        const oldOrd = await getDocs(collection(db, "singletons", "backup", "orders"));
                        if (oldOrd.docs.length > 0) {
                            await Promise.all(oldOrd.docs.map(d => deleteDoc(d.ref)));
                        }

                        // Create Backup First
                        // Use JSON.parse/stringify to remove undefined values which Firebase rejects
                        const backup = JSON.parse(JSON.stringify({
                           metrics: metrics || {},
                           timestamp: Date.now()
                        }));
                        await setDoc(doc(db, "singletons", "backup"), backup);
                        
                        // use subcollections for inventory and orders
                        if (inventory && inventory.length > 0) {
                           await Promise.all(inventory.map(p => setDoc(doc(db, "singletons", "backup", "inventory", p.id.toString()), JSON.parse(JSON.stringify(p)))));
                        }
                        if (allOrdersData.length > 0) {
                           await Promise.all(allOrdersData.map(o => setDoc(doc(db, "singletons", "backup", "orders", o.id.toString()), JSON.parse(JSON.stringify(o)))));
                        }

                        const resetMetrics = {
                          revenue: 0,
                          cost: 0,
                          salary: metrics?.salary || 0,
                          orderCount: 0,
                          employeeCount: metrics?.employeeCount || 0,
                          earning: 0,
                          monthlyData: Array.from({ length: 12 }, (_, j) => ({
                            name: new Date(0, j).toLocaleString('default', { month: 'short' }),
                            cost: 0,
                            earning: 0
                          })),
                          dailyData: []
                        };
                        setMetrics(resetMetrics);
                        await setDoc(doc(db, "singletons", "metrics"), resetMetrics);

                        // Delete all inventory
                        if (inventory && inventory.length > 0) {
                           await Promise.all(inventory.map(p => deleteDoc(doc(db, "inventory", p.id.toString()))));
                        }

                        // Delete all orders properly
                        if (allOrdersSnapshot.docs.length > 0) {
                           await Promise.all(allOrdersSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
                        }
                        
                        setIsResetting(false);
                        setIsResetModalOpen(false);
                        customAlert("System has been successfully reset. You can undo this action from the Admin Center within the next 60 minutes.");
                    } catch (error) {
                        console.error("Reset failed: ", error);
                        customAlert("An error occurred during reset.");
                        setIsResetting(false);
                        setIsResetModalOpen(false);
                    }
                  }}
                  className="w-full rounded-2xl bg-rose-600 py-3.5 font-bold text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResetting ? <><RefreshCw className="w-5 h-5 animate-spin" /> Resetting...</> : "Yes, Reset Everything"}
                </button>
                <button 
                  disabled={isResetting}
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden my-8 shrink-0"
          >
            <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
              </div>
              <button onClick={() => setIsAddProductModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid gap-6 sm:grid-cols-2 mb-8">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit Type</label>
                  <CustomSelect 
                    value={newProduct.stock.replace(/[0-9]+/, '').trim() || 'Sacks'}
                    onChange={v => setNewProduct({...newProduct, stock: `0 ${v}`})}
                    options={[
                       { label: "Sacks", value: "Sacks" },
                       { label: "Quintals", value: "Quintals" },
                       { label: "Baskets", value: "Baskets" },
                       { label: "Crates", value: "Crates" },
                       { label: "Bags", value: "Bags" },
                       { label: "Units", value: "Units" }
                    ]}
                    className="bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weight/Amount per Unit</label>
                  <input 
                    type="text" placeholder="e.g. 25 Kg, 5 Liters" 
                    value={newProduct.kgPerUnit} onChange={e => setNewProduct({...newProduct, kgPerUnit: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                  <input 
                    type="text" placeholder="e.g. Premium Rice" 
                    value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <input 
                    type="text" placeholder="e.g. Grains" 
                    value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per Unit</label>
                  <input 
                    type="text" placeholder="e.g. ৳1,450" 
                    value={newProduct.price ? `৳${Number(newProduct.price.replace(/[^0-9]/g, '')).toLocaleString()}` : ""} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewProduct({...newProduct, price: val ? `৳${Number(val).toLocaleString()}` : ""})
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image Source</label>
                  <input 
                    type="text" placeholder="Image URL (https://...)" 
                    value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-400">OR</span>
                    <input 
                      type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          resizeImage(file, (dataUrl) => {
                            setNewProduct({...newProduct, image: dataUrl});
                          });
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddProduct}
                  className="flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95"
                >
                  <Plus className="h-5 w-5" /> Save Product
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isUndoModalOpen && backupData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Undo System Reset?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  This will restore the latest backup of your dashboard and catalog inventory.
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  disabled={isRestoring}
                  onClick={async () => {
                    if (isRestoring) return;
                    setIsRestoring(true);
                    
                    try {
                        setMetrics(backupData.metrics);
                        await setDoc(doc(db, "singletons", "metrics"), backupData.metrics);
                        
                        const backupInventorySnapshot = await getDocs(collection(db, "singletons", "backup", "inventory"));
                        const backupOrdersSnapshot = await getDocs(collection(db, "singletons", "backup", "orders"));
                        
                        const inventoryToRestore = backupInventorySnapshot.docs.map(d => d.data());
                        const ordersToRestore = backupOrdersSnapshot.docs.map(d => d.data());
                        
                        if (inventoryToRestore.length > 0) {
                           await Promise.all(inventoryToRestore.map((p: any) => setDoc(doc(db, "inventory", p.id.toString()), p)));
                        }
                        if (ordersToRestore.length > 0) {
                           await Promise.all(ordersToRestore.map((o: any) => setDoc(doc(db, "orders", o.id.toString()), o)));
                        }
                        
                        await deleteDoc(doc(db, "singletons", "backup"));
                        if (backupInventorySnapshot.docs.length > 0) {
                           await Promise.all(backupInventorySnapshot.docs.map(d => deleteDoc(d.ref)));
                        }
                        if (backupOrdersSnapshot.docs.length > 0) {
                           await Promise.all(backupOrdersSnapshot.docs.map(d => deleteDoc(d.ref)));
                        }
                        
                        setIsRestoring(false);
                        setIsUndoModalOpen(false);
                        customAlert("System has been successfully restored.");
                    } catch (err) {
                        console.error("Failed to restore", err);
                        setIsRestoring(false);
                        customAlert("An error occurred during restore.");
                    }
                  }}
                  className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRestoring ? <><RefreshCw className="w-5 h-5 animate-spin" /> Restoring...</> : "Yes, Restore System"}
                </button>
                <button 
                  disabled={isRestoring}
                  onClick={() => setIsUndoModalOpen(false)}
                  className="w-full rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                >
                  No, Keep Empty
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button 
              className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 rounded-full"
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl" alt="Preview" />
          </div>
        </div>
      )}

      {/* Floating Action Button (Always Visible) */}
      <motion.a 
        href="https://wa.me/8801611160094"
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

      {/* Global Dialog Component */}
      <AnimatePresence>
        {dialogConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{dialogConfig.title}</h3>
              <p className="mb-6 text-sm font-medium text-slate-500 whitespace-pre-wrap leading-relaxed">{dialogConfig.message}</p>
              
              {dialogConfig.type === 'prompt' && (
                <input
                  type="text"
                  id="dialog-prompt-input"
                  placeholder="Enter value"
                  defaultValue={dialogConfig.defaultValue || ""}
                  className="mb-8 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              )}

              <div className="flex justify-end gap-3">
                {dialogConfig.type !== 'alert' && (
                  <button
                    onClick={() => {
                      dialogConfig.onCancel?.();
                      closeDialog();
                    }}
                    className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (dialogConfig.type === 'prompt') {
                      const val = (document.getElementById('dialog-prompt-input') as HTMLInputElement)?.value;
                      dialogConfig.onConfirm?.(val);
                    } else {
                      dialogConfig.onConfirm?.();
                    }
                    closeDialog();
                  }}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                >
                  {dialogConfig.type === 'alert' ? 'OK' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
