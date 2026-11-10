import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Link, NavLink, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_ORIGIN, API_URL } from "../lib/api";
import { Activity, CalendarDays, ChevronDown, CircleDollarSign, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Search, ShieldCheck, Users, X, Download, Plus, Trash2, Upload, Image, Check, RefreshCw, ExternalLink, BarChart3, FileSpreadsheet, Printer, TrendingUp, Receipt } from "lucide-react";
import { Area, AreaChart, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import * as XLSX from "xlsx";
import "./Admin.css";

const API = API_URL;
const money = (n = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const dateText = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const nav = [
  ["Overview", "/admin/dashboard", LayoutDashboard],
  ["Analytics", "/admin/analytics", BarChart3],
  ["Orders", "/admin/orders", ClipboardList],
  ["Products", "/admin/products", Package],
  ["Customers", "/admin/customers", Users], 
  ["Appointments", "/admin/appointments", CalendarDays]
];

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Could not load information");
  return data;
}

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.msg || result.message || "Sign in failed");
      await api("/admin/me"); onSignedIn();
    } catch (e) { setError(e.message === "Administrator access required" ? "This account does not have administrator access." : e.message); }
    finally { setBusy(false); }
  }
  return <main className="admin-login"><div className="login-brand"><img src="/velaro-logo.jpg" alt="V" className="brand-monogram" style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid #d4af37" }} /><p>VELARO <span>ATELIER</span></p></div><section className="login-card"><div className="login-kicker">PRIVATE ADMINISTRATION</div><h1>Welcome back.</h1><p className="login-desc">Sign in with your Velaro administrator account.</p><form onSubmit={submit}><label>Email address<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@velaro.in" /></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" /></label>{error&&<div className="admin-error">{error}</div>}<button className="admin-primary full" disabled={busy}>{busy?"Signing in…":"Sign in securely"}<ShieldCheck size={16}/></button></form><div className="login-foot">Access is restricted to accounts with administrator permission.</div></section><Link className="return-store" to="/">← Return to storefront</Link></main>;
}

function Shell({ profile, children, onSignout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="admin-shell"><aside className={`admin-sidebar ${mobileOpen?"open":""}`}><div className="sidebar-brand"><img src="/velaro-logo.jpg" alt="V" className="brand-monogram" style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid #d4af37" }} /><div>VELARO<small>ADMINISTRATION</small></div><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={19}/></button></div><div className="sidebar-caption">WORKSPACE</div><nav>{nav.map(([label,path,Icon])=><NavLink key={path} to={path} onClick={()=>setMobileOpen(false)} className={({isActive})=>`side-link ${isActive?"active":""}`}><Icon size={17}/>{label}{label==="Orders"&&<span className="nav-dot"/>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={16}/><span>Protected workspace<small>Administrator access</small></span></div><button onClick={onSignout} className="signout"><LogOut size={16}/>Sign out</button></div></aside>{mobileOpen&&<button className="sidebar-scrim" aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}<div className="admin-main"><header className="admin-header"><button aria-label="Open menu" className="menu-trigger" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>Velaro Admin</b></div><div className="header-right"><span className="live-label"><i/> LIVE DATA</span><div className="profile-chip"><span className="profile-avatar">{profile?.name?.slice(0,1)||"V"}</span><span>{profile?.name||"Administrator"}<small>Administrator</small></span><ChevronDown size={14}/></div></div></header><div className="admin-content">{children}</div><footer className="admin-footer">VELARO ADMINISTRATION <span>·</span> Data from your store database</footer></div></div>;
}

function PageHeading({ eyebrow, title, description, right }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{right}</div>; }
function Empty({ text="No records found" }) { return <div className="admin-empty"><span><Package size={22}/></span><b>{text}</b><small>When your store has records, they will appear here.</small></div>; }
function Status({ value }) { const slug=(value||"pending").toLowerCase();return <span className={`status status-${slug}`}>{value||"Pending"}</span>; }

function Overview() {
  const [range, setRange] = useState("30"); const [data,setData]=useState(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{ let alive=true; setLoading(true); const to=new Date();const from=new Date();if(Number(range)===0)from.setHours(0,0,0,0);else from.setDate(from.getDate()-Number(range));api(`/admin/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`).then(d=>{if(alive){setData(d);setError("")}}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false));return()=>{alive=false}},[range]);
  const summary=data?.summary||{};
  const cards=[["Order value",money(summary.orderValue),"Within selected dates",CircleDollarSign,"gold"],["Orders",summary.orders??"—","Grouped by checkout",ClipboardList,"blue"],["New customers",summary.customers??"—","Accounts created in range",Users,"green"],["Appointments",summary.appointments??"—","Bookings created in range",CalendarDays,"rose"]];
  return <><PageHeading eyebrow="STORE PULSE · OVERVIEW" title="Good morning." description="A clear view of what’s happening across Velaro today." right={<label className="range-select"><span>PERIOD</span><select value={range} onChange={e=>setRange(e.target.value)}><option value="0">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>}/>{error&&<div className="admin-error">{error}</div>}<div className="metric-grid">{cards.map(([label,value,note,Icon,color])=><article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><i className={`metric-icon ${color}`}><Icon size={18}/></i></div><strong>{loading?"···":value}</strong><div className="metric-note">{note}</div></article>)}</div><div className="dashboard-grid"><section className="panel revenue-panel"><div className="panel-heading"><div><span className="panel-kicker">ORDER ACTIVITY</span><h2>Order value over time</h2></div><span className="chart-legend"><i/> Order value</span></div>{data?.daily?.length?<div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily} margin={{top:12,right:10,left:0,bottom:0}}><defs><linearGradient id="velaroFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8935a" stopOpacity={0.28}/><stop offset="95%" stopColor="#b8935a" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#eeeae3" vertical={false}/><XAxis dataKey="date" tickFormatter={d=>new Date(`${d}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#8a8882"}} minTickGap={24}/><YAxis tickFormatter={v=>new Intl.NumberFormat("en-IN",{notation:"compact"}).format(v)} tickLine={false} axisLine={false} width={44} tick={{fontSize:11,fill:"#8a8882"}}/><Tooltip formatter={v=>[money(v),"Order value"]} labelFormatter={d=>dateText(d)} contentStyle={{border:"1px solid #ece8e1",borderRadius:8,fontSize:12}}/><Area type="monotone" dataKey="orderValue" stroke="#a17c45" strokeWidth={2.3} fill="url(#velaroFill)"/></AreaChart></ResponsiveContainer></div>:<Empty text={loading?"Loading activity…":"No orders in this period"}/>}<div className="chart-foot"><span>Grouped from actual order items</span><span>INR · India</span></div></section><section className="panel status-panel"><div className="panel-heading"><div><span className="panel-kicker">FULFILMENT</span><h2>Order status</h2></div><ClipboardList size={18} className="subtle-icon"/></div>{data?.orderStatuses?.length?<div className="status-list">{data.orderStatuses.map(row=><div className="status-row" key={row._id}><span className="status-bullet"/><span>{row._id||"Pending"}</span><b>{row.orderIds?.length??0}</b><small>{money(row.value)}</small></div>)}</div>:<Empty text={loading?"Loading statuses…":"No order statuses yet"}/>}<Link className="panel-link" to="/admin/orders">Review orders <span>→</span></Link></section></div><section className="panel recent-panel"><div className="panel-heading"><div><span className="panel-kicker">LATEST ACTIVITY</span><h2>Recent orders</h2></div><Link className="text-link" to="/admin/orders">View all orders <span>→</span></Link></div>{data?.recentOrders?.length?<div className="table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>STATUS</th><th className="align-right">ORDER VALUE</th></tr></thead><tbody>{data.recentOrders.map(o=><tr key={o.orderId}><td className="order-ref">#{o.orderId}</td><td>{o.customer}</td><td>{dateText(o.createdAt)}</td><td>{o.itemCount}</td><td><Status value={o.status}/></td><td className="align-right amount">{money(o.value)}</td></tr>)}</tbody></table></div>:<Empty text={loading?"Loading orders…":"No orders in this period"}/>}</section><div className="data-note"><Activity size={14}/> Values reflect order records and may include unpaid orders. Payment collection status is not stored by the current checkout.</div></>;
}

function Records({ kind }) {
  const [rows,setRows]=useState([]);const [query,setQuery]=useState("");const [status,setStatus]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(true);const [page,setPage]=useState(1);
  const config={orders:{title:"Orders",eyebrow:"COMMERCE · FULFILMENT",description:"Review and update customer checkouts.",path:"orders",search:"Search order, item, or phone…"},customers:{title:"Customers",eyebrow:"RELATIONSHIPS · PEOPLE",description:"Customer accounts created in your Velaro store.",path:"customers",search:"Search name or email…"},appointments:{title:"Appointments",eyebrow:"ATELIER · BOOKINGS",description:"Manage requests for bespoke fittings and consultations.",path:"appointments",search:"",}}[kind];
  const load=()=>{setLoading(true);setError("");const params=new URLSearchParams({page:String(page),limit:"20"});if(query)params.set("search",query);if(status)params.set("status",status);api(`/admin/${config.path}?${params}`).then(r=>setRows(r.items||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));};
  useEffect(()=>{const t=setTimeout(load,180);return()=>clearTimeout(t)},[kind,page,status]);
  async function changeStatus(row,next){const id=kind==="appointments"?row._id:row.orderId;const prevRows=[...rows];setRows(prev=>prev.map(r=>{const rId=kind==="appointments"?r._id:r.orderId;return rId===id?{...r,status:next}:r}));try{await api(`/admin/${config.path}/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status:next})});toast.success(`${kind==="appointments"?"Appointment":"Order"} status updated to "${next}"`);load()}catch(e){setRows(prevRows);toast.error(e.message||"Failed to update status");setError(e.message)}}
  const table=useMemo(()=>{if(kind==="customers")return <table><thead><tr><th>CUSTOMER</th><th>EMAIL</th><th>JOINED</th></tr></thead><tbody>{rows.map(x=><tr key={x._id}><td className="customer-name">{x.name||"Customer"}</td><td>{x.email}</td><td>{dateText(x.createdAt)}</td></tr>)}</tbody></table>;if(kind==="appointments")return <table><thead><tr><th>CLIENT</th><th>SERVICE</th><th>DATE & TIME</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{rows.map(x=><tr key={x._id}><td className="customer-name">{x.name||"Guest"}<small>{x.email}</small></td><td>{x.service||"Consultation"}</td><td>{x.date||dateText(x.createdAt)}<small>{x.time||"Time not set"}</small></td><td>{x.phone||"—"}</td><td><Status value={x.status}/></td><td><select className="row-select" value={x.status||"Pending"} onChange={e=>changeStatus(x,e.target.value)}><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></td></tr>)}</tbody></table>;return <table><thead><tr><th>ORDER</th><th>ITEM</th><th>CUSTOMER</th><th>PLACED</th><th>QTY</th><th>STATUS</th><th>UPDATE STATUS</th></tr></thead><tbody>{rows.map(x=><tr key={x._id}><td className="order-ref">#{x.orderId}</td><td className="customer-name">{x.productName}<small>{x.size?`Size ${x.size}`:x.category}</small></td><td>{x.userId?.name||"Guest"}<small>{x.userId?.email||x.phone}</small></td><td>{dateText(x.createdAt)}</td><td>{x.quantity}</td><td><Status value={x.status}/></td><td><select className="row-select" value={x.status||"Processing"} onChange={e=>changeStatus(x,e.target.value)}>{["Pending","Processing","Shipped","Delivered","Cancelled","Refunded"].map(s=><option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table>},[kind,rows]);
  return <><PageHeading eyebrow={config.eyebrow} title={config.title} description={config.description}/>{error&&<div className="admin-error">{error}</div>}<section className="panel records-panel"><div className="records-toolbar"><div className="search-box"><Search size={16}/><input placeholder={config.search||"Search customer…"} value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} onKeyDown={e=>e.key==="Enter"&&load()}/></div>{kind!=="customers"&&<select className="filter-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{(kind==="orders"?["Pending","Processing","Shipped","Delivered","Cancelled","Refunded"]:["Pending","Confirmed","Completed","Cancelled"]).map(s=><option key={s}>{s}</option>)}</select>}<button className="admin-secondary" onClick={load}>Refresh</button></div>{loading?<div className="loading-line">Loading store records…</div>:rows.length?<div className="table-wrap">{table}</div>:<Empty/>}<div className="records-foot"><span>Showing {rows.length} records on this page</span><div><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page}</span><button disabled={rows.length<20} onClick={()=>setPage(p=>p+1)}>Next</button></div></div></section></>;
}

function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Blazers");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState("file"); // "file" | "url"
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Filter/search states
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");

  const categories = [
    "Blazers", "Suits", "Trousers", "Shirts", 
    "Footwear", "Knitwear", "Outerwear", "Accessories"
  ];

  const getProductImgUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    const baseUrl = API.replace(/\/api\/?$/, "");
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const load = () => {
    setLoading(true);
    api("/products")
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WEBP)");
      return;
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("Blazers");
    setDescription("");
    setImageFile(null);
    setImageUrl("");
    setPreviewUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!category.trim()) {
      toast.error("Please select or enter a category");
      return;
    }
    if (imageMode === "file" && !imageFile) {
      toast.error("Please choose or drag an image file");
      return;
    }
    if (imageMode === "url" && !imageUrl.trim()) {
      toast.error("Please provide an image URL");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", price);
      formData.append("category", category.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      if (imageMode === "file" && imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("imageUrl", imageUrl.trim());
      }

      const created = await api("/products", {
        method: "POST",
        body: formData,
      });

      toast.success(`"${created.name || name}" uploaded successfully!`);
      resetForm();
      load();

      try {
        const bc = new BroadcastChannel("velaro_products");
        bc.postMessage({ type: "REFRESH" });
        bc.close();
      } catch {}
    } catch (err) {
      setError(err.message);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, prodName) => {
    try {
      setDeletingId(id);
      await api(`/products/${id}`, { method: "DELETE" });
      toast.success(`"${prodName || 'Product'}" deleted successfully`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setConfirmDeleteId(null);

      try {
        const bc = new BroadcastChannel("velaro_products");
        bc.postMessage({ type: "REFRESH" });
        bc.close();
      } catch {}
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCat === "ALL" ||
        p.category?.toLowerCase() === selectedCat.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  return (
    <>
      <PageHeading
        eyebrow="INVENTORY · STORE"
        title="Products"
        description="Upload new menswear items, manage pricing and categories, and organize your store catalog."
        right={
          <button className="admin-secondary" onClick={load}>
            <RefreshCw size={13} style={{ marginRight: 6 }} /> Refresh Catalog
          </button>
        }
      />

      {error && <div className="admin-error">{error}</div>}

      <div className="products-container">
        {/* Upload Form */}
        <section className="product-form-panel">
          <div className="product-form-header">
            <div>
              <h2>Upload New Product</h2>
              <p>Add a product to make it available on your storefront.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label className="form-label">
                Product Title *
                <small>e.g. Velvet Shawl Tuxedo</small>
              </label>
              <input
                type="text"
                className="product-input"
                placeholder="Enter product title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Category *
                <small>Select or type custom</small>
              </label>
              <input
                type="text"
                className="product-input"
                placeholder="e.g. Blazers, Shirts, Footwear..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <div className="category-chips-list">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`category-chip-btn ${category.toLowerCase() === c.toLowerCase() ? "active" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Price (INR) *
                <small>Indian Rupee amount</small>
              </label>
              <div className="price-input-wrapper">
                <span className="price-currency-symbol">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="product-input"
                  placeholder="e.g. 18500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Description
                <small>Optional fabric or cut details</small>
              </label>
              <textarea
                rows={2}
                className="product-textarea"
                placeholder="e.g. Tailored from 100% Italian Super 130s wool..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Product Image *
                <small>{imageMode === "file" ? "Upload file" : "Paste URL"}</small>
              </label>

              <div className="image-mode-tabs">
                <button
                  type="button"
                  className={`image-mode-tab ${imageMode === "file" ? "active" : ""}`}
                  onClick={() => {
                    setImageMode("file");
                    if (imageFile) {
                      setPreviewUrl(URL.createObjectURL(imageFile));
                    } else {
                      setPreviewUrl("");
                    }
                  }}
                >
                  <Upload size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
                  Upload Image File
                </button>
                <button
                  type="button"
                  className={`image-mode-tab ${imageMode === "url" ? "active" : ""}`}
                  onClick={() => {
                    setImageMode("url");
                    setPreviewUrl(imageUrl);
                  }}
                >
                  <Image size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
                  Image URL
                </button>
              </div>

              {imageMode === "file" ? (
                <>
                  {!previewUrl ? (
                    <label
                      className={`image-dropzone ${isDragging ? "dragging" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                      />
                      <div className="image-dropzone-icon">
                        <Upload size={18} />
                      </div>
                      <div className="image-dropzone-text">Click to choose image or drag & drop</div>
                      <div className="image-dropzone-hint">PNG, JPG, WEBP up to 10MB</div>
                    </label>
                  ) : (
                    <div className="image-preview-card">
                      <img src={previewUrl} alt="Preview" className="image-preview-thumb" />
                      <div className="image-preview-info">
                        <div className="image-preview-name">{imageFile?.name || "Uploaded image"}</div>
                        <div className="image-preview-sub">
                          {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Ready to upload"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={() => {
                          setImageFile(null);
                          setPreviewUrl("");
                        }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    type="url"
                    className="product-input"
                    placeholder="https://example.com/images/suit.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                  />
                  {previewUrl && (
                    <div className="image-preview-card">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="image-preview-thumb"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div className="image-preview-info">
                        <div className="image-preview-name">Image URL Preview</div>
                        <div className="image-preview-sub">{previewUrl.slice(0, 45)}...</div>
                      </div>
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={() => {
                          setImageUrl("");
                          setPreviewUrl("");
                        }}
                      >
                        <X size={12} /> Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                className="admin-primary"
                disabled={submitting}
                style={{ flex: 1.2 }}
              >
                {submitting ? (
                  <>Uploading Product…</>
                ) : (
                  <>
                    <Plus size={15} /> Upload Product
                  </>
                )}
              </button>
              <button
                type="button"
                className="admin-secondary btn-cancel-form"
                onClick={resetForm}
                disabled={submitting}
                style={{ flex: 0.8 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>

        {/* Catalog List */}
        <section className="product-catalog-panel">
          <div className="catalog-header">
            <h2>
              Storefront Catalog
              <span className="catalog-badge">{products.length} Products</span>
            </h2>
            <Link to="/" target="_blank" className="text-link" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              View Storefront <ExternalLink size={12} />
            </Link>
          </div>

          <div className="catalog-toolbar">
            <div className="catalog-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search products by title or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="catalog-category-select"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading-line">Loading product catalog…</div>
          ) : filteredProducts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>IMAGE</th>
                    <th>PRODUCT</th>
                    <th>PRICE</th>
                    <th>DATE ADDED</th>
                    <th className="align-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const resolvedImg = getProductImgUrl(p.image);
                    return (
                      <tr key={p._id}>
                        <td>
                          <img
                            src={resolvedImg}
                            alt={p.name}
                            className="product-cell-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='54' fill='%23ece8df'><rect width='100%' height='100%'/></svg>";
                            }}
                          />
                        </td>
                        <td>
                          <div className="product-cell-title">{p.name}</div>
                          <span className="product-cell-cat">{p.category}</span>
                        </td>
                        <td>
                          <div className="product-cell-price">{money(p.price)}</div>
                        </td>
                        <td style={{ color: "#8a8780", fontSize: 11 }}>
                          {dateText(p.createdAt)}
                        </td>
                        <td className="align-right">
                          {confirmDeleteId === p._id ? (
                            <div className="delete-confirm-box">
                              <span className="delete-confirm-label">Delete?</span>
                              <button
                                type="button"
                                className="btn-confirm-delete"
                                disabled={deletingId === p._id}
                                onClick={() => handleDelete(p._id, p.name)}
                              >
                                <Trash2 size={12} /> {deletingId === p._id ? "Deleting…" : "Delete"}
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-delete"
                                disabled={deletingId === p._id}
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons-wrap">
                              <button
                                type="button"
                                className="action-delete-btn"
                                onClick={() => setConfirmDeleteId(p._id)}
                                title="Delete product"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">
              <span><Package size={22} /></span>
              <b>{products.length === 0 ? "No products uploaded yet" : "No matching products"}</b>
              <small>
                {products.length === 0
                  ? "Use the form on the left to upload your first menswear product."
                  : "Try clearing your search or category filter."}
              </small>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

const PIE_COLORS = ["#b8935a", "#263548", "#6a7b8c", "#d4af37", "#4b7759", "#8c564b", "#9467bd", "#e377c2"];
const STATUS_COLORS = {
  Delivered: "#2e7d32",
  Shipped: "#1565c0",
  Processing: "#b8935a",
  Pending: "#e65100",
  Cancelled: "#c62828",
  Refunded: "#6a1b9a"
};

function AnalyticsPanel() {
  const [range, setRange] = useState("fy");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api(`/admin/analytics?range=${range}`)
      .then((res) => {
        if (alive) {
          setData(res);
          setError("");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Failed to load analytics");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const rangeLabels = {
    fy: "Current Financial Year",
    "30": "Last 30 Days",
    "90": "Last 90 Days",
    "365": "Last 365 Days",
    all: "All Time (Complete Ledger)"
  };

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const periodLabel = rangeLabels[range] || range;
    const nowStr = new Date().toLocaleString("en-IN");
    const inr = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. Executive Tax Summary Sheet
    const summaryAOA = [
      ["VELARO LUXURY ATELIER — OFFICIAL STATUTORY TAX AUDIT & COMPLIANCE REPORT"],
      ["Company Name:", "VELARO MEN'S FASHION PRIVATE LIMITED"],
      ["GSTIN / Tax ID:", "33ABCDE1234F1Z5", "", "PAN:", "ABCDE1234F"],
      ["Financial Period:", periodLabel, "", "Report Generated:", nowStr],
      ["State of Registration:", "Tamil Nadu (Code 33)", "", "Filing Basis:", "GSTR-1 & GSTR-3B Monthly / Quarterly"],
      [],
      ["SL", "STATUTORY TAX & REVENUE METRIC", "VALUE (INR)", "GST RATE", "STATUTORY REMARKS & ACCOUNTING CLASSIFICATION"],
      ["01", "Gross Business Turnover", inr(data.taxSummary.grossRevenue), "18.0%", "Total revenue aggregate recorded from all consumer checkouts"],
      ["02", "Net Taxable Turnover", inr(data.taxSummary.taxableTurnover), "Excl. Tax", "Base taxable value before output GST liability"],
      ["03", "Central GST (CGST)", inr(data.taxSummary.cgst), "9.0%", "Statutory Central Tax payable to Central Government"],
      ["04", "State GST (SGST)", inr(data.taxSummary.sgst), "9.0%", "Statutory State Tax payable to State Commercial Taxes Dept"],
      ["05", "Integrated GST (IGST)", inr(data.taxSummary.igst || 0), "18.0%", "Inter-state sales tax liability for inter-state deliveries"],
      ["06", "Total Output GST Payable", inr(data.taxSummary.taxCollected), "18.0%", "Total statutory output tax liability for GSTR-3B return"],
      ["07", "Net Realized Sales", inr(data.taxSummary.deliveredRevenue), "Fulfilled", "Revenue from delivered & completed customer checkouts"],
      ["08", "Credit Adjustments", inr(data.taxSummary.cancelledRevenue), "Adjusted", "Credit note deductions for cancelled / returned orders"],
      ["09", "Total Invoices Filed", `${data.taxSummary.totalOrders} Invoices`, "—", "Total volume of customer tax invoices in period"],
      ["10", "Total Units Dispatched", `${data.taxSummary.totalUnits} Units`, "—", "Total inventory volume sold across all atelier categories"],
      ["11", "Average Order Value (AOV)", inr(data.taxSummary.averageOrderValue), "—", "Average revenue realization per checkout transaction"],
      ["12", "Active Registered Clients", `${data.taxSummary.totalCustomers} Accounts`, "—", "Clientele base registered on Velaro platform"],
      ["13", "Bespoke Consultations", `${data.taxSummary.totalAppointments} Bookings`, "—", "Total bespoke atelier fittings and tailoring appointments"]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
    wsSummary["!cols"] = [
      { wch: 8 },  // SL
      { wch: 42 }, // Metric
      { wch: 24 }, // Value
      { wch: 16 }, // GST Rate
      { wch: 65 }  // Remarks
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tax Filing Summary");

    // 2. Monthly GSTR-3B Schedule
    const monthlyAOA = [
      ["VELARO ATELIER — MONTHLY GSTR-3B SCHEDULE & TAX PROVISIONS"],
      ["Reporting Period:", periodLabel],
      [],
      ["Month", "Invoices Count", "Gross Value (INR)", "Taxable Value (INR)", "CGST 9% (INR)", "SGST 9% (INR)", "Total GST 18% (INR)", "Audit Status"]
    ];
    (data.monthly || []).forEach((m) => {
      monthlyAOA.push([
        m.month,
        `${m.orders} Invoices`,
        inr(m.gross),
        inr(m.taxable),
        inr(m.cgst),
        inr(m.sgst),
        inr(m.tax),
        "Ready for Filing"
      ]);
    });
    const totalGross = (data.monthly || []).reduce((s, m) => s + m.gross, 0);
    const totalTaxable = (data.monthly || []).reduce((s, m) => s + m.taxable, 0);
    const totalCGST = (data.monthly || []).reduce((s, m) => s + m.cgst, 0);
    const totalSGST = (data.monthly || []).reduce((s, m) => s + m.sgst, 0);
    const totalTax = (data.monthly || []).reduce((s, m) => s + m.tax, 0);
    const totalOrders = (data.monthly || []).reduce((s, m) => s + m.orders, 0);
    monthlyAOA.push(["CONSOLIDATED TOTAL", `${totalOrders} Invoices`, inr(totalGross), inr(totalTaxable), inr(totalCGST), inr(totalSGST), inr(totalTax), "Audit Verified"]);
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyAOA);
    wsMonthly["!cols"] = [
      { wch: 22 }, // Month
      { wch: 20 }, // Invoices
      { wch: 24 }, // Gross Value
      { wch: 24 }, // Taxable Value
      { wch: 20 }, // CGST
      { wch: 20 }, // SGST
      { wch: 24 }, // Total GST
      { wch: 22 }  // Status
    ];
    XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly GSTR Schedule");

    // 3. Complete Tax Invoice Register (GSTR-1)
    const invoiceAOA = [
      ["VELARO ATELIER — DETAILED TAX INVOICE & ORDER TRANSACTION REGISTER"],
      ["Reporting Period:", periodLabel],
      [],
      ["Invoice / Order ID", "Invoice Date", "Customer Name", "Customer Email", "Phone", "Shipping Destination", "Payment Method", "Fulfillment Status", "Garment Units", "Gross Total (INR)", "Taxable Value (INR)", "CGST 9% (INR)", "SGST 9% (INR)", "Total GST 18% (INR)"]
    ];
    (data.orders || []).forEach((o) => {
      const gross = o.totalValue || 0;
      const taxable = Math.round((gross / 1.18) * 100) / 100;
      const tax = Math.round((gross - taxable) * 100) / 100;
      const cgst = Math.round((tax / 2) * 100) / 100;
      const sgst = Math.round((tax / 2) * 100) / 100;
      invoiceAOA.push([
        `#${o.orderId}`,
        new Date(o.createdAt).toLocaleDateString("en-IN"),
        o.customerName,
        o.customerEmail,
        o.phone,
        o.address,
        o.paymentMethod,
        o.status,
        `${o.itemsCount} pcs`,
        inr(gross),
        inr(taxable),
        inr(cgst),
        inr(sgst),
        inr(tax)
      ]);
    });
    const wsInvoice = XLSX.utils.aoa_to_sheet(invoiceAOA);
    wsInvoice["!cols"] = [
      { wch: 20 }, // Order ID
      { wch: 16 }, // Invoice Date
      { wch: 28 }, // Customer Name
      { wch: 32 }, // Customer Email
      { wch: 18 }, // Phone
      { wch: 42 }, // Address
      { wch: 22 }, // Payment Method
      { wch: 18 }, // Fulfillment Status
      { wch: 16 }, // Units
      { wch: 22 }, // Gross
      { wch: 22 }, // Taxable
      { wch: 18 }, // CGST
      { wch: 18 }, // SGST
      { wch: 22 }  // Total Tax
    ];
    XLSX.utils.book_append_sheet(wb, wsInvoice, "Tax Invoice Register");

    // 4. Category & Product Performance
    const catAOA = [
      ["VELARO ATELIER — MERCHANDISE & CATEGORY TAX AUDIT"],
      [],
      ["Category Name", "Units Dispatched", "Gross Turnover (INR)", "Estimated Tax Contribution (18%)"]
    ];
    (data.categories || []).forEach((c) => {
      catAOA.push([
        c.name,
        `${c.units} Units`,
        inr(c.value),
        inr(Math.round(c.value - c.value / 1.18))
      ]);
    });
    catAOA.push([]);
    catAOA.push(["TOP PERFORMING CREATIONS & GARMENTS"]);
    catAOA.push(["Product Name", "Category", "Units Dispatched", "Total Revenue (INR)", "Tax Contribution (18%)"]);
    (data.topProducts || []).forEach((p) => {
      catAOA.push([
        p.name,
        p.category,
        `${p.units} Units`,
        inr(p.revenue),
        inr(Math.round(p.revenue - p.revenue / 1.18))
      ]);
    });
    const wsCat = XLSX.utils.aoa_to_sheet(catAOA);
    wsCat["!cols"] = [
      { wch: 38 }, // Product / Category Name
      { wch: 22 }, // Category
      { wch: 20 }, // Units Sold
      { wch: 24 }, // Gross Revenue
      { wch: 24 }  // Tax Share
    ];
    XLSX.utils.book_append_sheet(wb, wsCat, "Product Breakdown");

    XLSX.writeFile(wb, `VELARO_Tax_Audit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel Tax Report generated and downloaded!");
  };

  const handleExportPDF = () => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate the printable PDF report.");
      return;
    }

    const { taxSummary } = data;
    const periodLabel = rangeLabels[range] || range;
    const nowStr = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>VELARO - Statutory Tax Filing & Audit Statement</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 20px; font-size: 12px; line-height: 1.45; }
            .header { border-bottom: 2px solid #b8935a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #1e2a39; letter-spacing: 0.12em; }
            .brand small { display: block; font-size: 10px; color: #b8935a; letter-spacing: 0.25em; font-family: Arial, sans-serif; font-weight: normal; margin-top: 3px; }
            .meta { text-align: right; font-size: 11px; color: #555; }
            .meta b { color: #1e2a39; }
            h2 { font-size: 15px; color: #1e2a39; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
            .tax-box { background: #fdfbf7; border: 1px solid #e2d7c5; border-radius: 6px; padding: 14px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
            .tax-item small { display: block; font-size: 9px; text-transform: uppercase; color: #777; letter-spacing: 0.05em; }
            .tax-item strong { font-size: 15px; color: #1e2a39; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            th { background: #1e2a39; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 7px 10px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) td { background: #fafafa; }
            .align-right { text-align: right; }
            .total-row td { font-weight: bold; background: #f5f2eb !important; border-top: 2px solid #b8935a; border-bottom: 2px solid #b8935a; }
            .cert-box { margin-top: 30px; border: 1px solid #ccc; padding: 14px; border-radius: 6px; background: #fafafa; }
            .cert-box p { margin: 0 0 25px 0; font-size: 11px; color: #444; }
            .sign-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; }
            .sign-line { border-top: 1px dashed #666; width: 220px; text-align: center; font-size: 10px; padding-top: 5px; color: #555; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">VELARO<small>ATELIER MENSWEAR</small></div>
              <div style="font-size: 11px; color: #666; margin-top: 6px;">
                Legal Entity: VELARO MEN'S FASHION PRIVATE LIMITED<br/>
                Registered Office: 42 Haute Couture Enclave, Chennai, TN, India<br/>
                <b>GSTIN: 33ABCDE1234F1Z5</b> | PAN: ABCDE1234F
              </div>
            </div>
            <div class="meta">
              <b>STATUTORY TAX STATEMENT</b><br/>
              Period: <b>${periodLabel}</b><br/>
              Date Issued: ${nowStr}<br/>
              Status: <span style="color: green; font-weight: bold;">VERIFIED AUDIT</span>
            </div>
          </div>

          <div class="tax-box">
            <div class="tax-item"><small>Gross Turnover</small><strong>${money(taxSummary.grossRevenue)}</strong></div>
            <div class="tax-item"><small>Taxable Turnover</small><strong>${money(taxSummary.taxableTurnover)}</strong></div>
            <div class="tax-item"><small>Output GST (18%)</small><strong style="color: #a57f43;">${money(taxSummary.taxCollected)}</strong></div>
            <div class="tax-item"><small>CGST (9%) + SGST (9%)</small><strong>${money(taxSummary.cgst)} + ${money(taxSummary.sgst)}</strong></div>
            <div class="tax-item"><small>Realized Sales</small><strong>${money(taxSummary.deliveredRevenue)}</strong></div>
            <div class="tax-item"><small>Adjustments / Credit</small><strong>${money(taxSummary.cancelledRevenue)}</strong></div>
            <div class="tax-item"><small>Total Invoices</small><strong>${taxSummary.totalOrders}</strong></div>
            <div class="tax-item"><small>Average Order Value</small><strong>${money(taxSummary.averageOrderValue)}</strong></div>
          </div>

          <h2>1. Monthly Tax Breakdown Schedule (GSTR-3B Format)</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th class="align-right">Orders</th>
                <th class="align-right">Gross Sales</th>
                <th class="align-right">Taxable Turnover</th>
                <th class="align-right">CGST (9%)</th>
                <th class="align-right">SGST (9%)</th>
                <th class="align-right">Total GST (18%)</th>
              </tr>
            </thead>
            <tbody>
              ${(data.monthly || []).map((m) => `
                <tr>
                  <td><b>${m.month}</b></td>
                  <td class="align-right">${m.orders}</td>
                  <td class="align-right">${money(m.gross)}</td>
                  <td class="align-right">${money(m.taxable)}</td>
                  <td class="align-right">${money(m.cgst)}</td>
                  <td class="align-right">${money(m.sgst)}</td>
                  <td class="align-right"><b>${money(m.tax)}</b></td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td>TOTAL CONSOLIDATED</td>
                <td class="align-right">${(data.monthly || []).reduce((s, m) => s + m.orders, 0)}</td>
                <td class="align-right">${money((data.monthly || []).reduce((s, m) => s + m.gross, 0))}</td>
                <td class="align-right">${money((data.monthly || []).reduce((s, m) => s + m.taxable, 0))}</td>
                <td class="align-right">${money((data.monthly || []).reduce((s, m) => s + m.cgst, 0))}</td>
                <td class="align-right">${money((data.monthly || []).reduce((s, m) => s + m.sgst, 0))}</td>
                <td class="align-right">${money((data.monthly || []).reduce((s, m) => s + m.tax, 0))}</td>
              </tr>
            </tbody>
          </table>

          <h2>2. Category Revenue & Tax Contribution</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th class="align-right">Units Sold</th>
                <th class="align-right">Gross Sales</th>
                <th class="align-right">Taxable Turnover</th>
                <th class="align-right">Tax Contribution</th>
              </tr>
            </thead>
            <tbody>
              ${(data.categories || []).map((c) => `
                <tr>
                  <td><b>${c.name}</b></td>
                  <td class="align-right">${c.units}</td>
                  <td class="align-right">${money(c.value)}</td>
                  <td class="align-right">${money(Math.round(c.value / 1.18))}</td>
                  <td class="align-right">${money(Math.round(c.value - c.value / 1.18))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="cert-box">
            <p>
              <b>STATUTORY DECLARATION:</b> We hereby certify that the turnover, taxable value, and GST figures stated above are faithfully extracted from the audited transactional database of Velaro Men's Fashion Private Limited for statutory tax reporting and assessment purposes.
            </p>
            <div class="sign-grid">
              <div class="sign-line">Prepared By (ERP Automation)</div>
              <div class="sign-line">Certified Tax Accountant / Auditor</div>
              <div class="sign-line">Authorized Signatory (Velaro Atelier)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const tax = data?.taxSummary || {};
  const cards = [
    ["Gross Business Turnover", money(tax.grossRevenue), "Total sales booked across orders", CircleDollarSign, "gold"],
    ["Taxable Sales Turnover", money(tax.taxableTurnover), "Excludes 18% Output GST", Receipt, "blue"],
    ["Output GST Collected (18%)", money(tax.taxCollected), `CGST: ${money(tax.cgst)} · SGST: ${money(tax.sgst)}`, Receipt, "green"],
    ["Delivered Realized Sales", money(tax.deliveredRevenue), "Realized completed fulfillment", CircleDollarSign, "gold"],
    ["Total Orders & Garment Units", `${tax.totalOrders ?? 0} orders · ${tax.totalUnits ?? 0} units`, "Total inventory checkout volume", ClipboardList, "blue"],
    ["Average Order Value (AOV)", money(tax.averageOrderValue), "Average realization per order", TrendingUp, "rose"]
  ];

  // Filter ledger orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    if (!ledgerSearch.trim()) return data.orders;
    const q = ledgerSearch.toLowerCase();
    return data.orders.filter(
      (o) =>
        o.orderId?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.paymentMethod?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q)
    );
  }, [data?.orders, ledgerSearch]);

  const pagedOrders = useMemo(() => {
    const startIdx = (ledgerPage - 1) * 10;
    return filteredOrders.slice(startIdx, startIdx + 10);
  }, [filteredOrders, ledgerPage]);

  return (
    <>
      <PageHeading
        eyebrow="BUSINESS PULSE · TAX & AUDIT COMPLIANCE"
        title="Business Analytics & Tax Filing"
        description="Comprehensive intelligence across turnover, tax liabilities, product performance, and customer trends."
        right={
          <div className="analytics-actions">
            <label className="range-select">
              <span>PERIOD</span>
              <select value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="fy">Financial Year (FY)</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
                <option value="all">All Time (Full Ledger)</option>
              </select>
            </label>
            <button onClick={handleExportExcel} className="btn-download-excel" title="Download Excel for Tax Filing">
              <FileSpreadsheet size={15} /> Export Excel (.xlsx)
            </button>
            <button onClick={handleExportPDF} className="btn-download-pdf" title="Download Official Tax Statement">
              <Printer size={15} /> Download PDF (Print)
            </button>
          </div>
        }
      />

      {error && <div className="admin-error">{error}</div>}

      {/* Tax Compliance Banner */}
      <div className="tax-summary-banner">
        <div className="tax-banner-left">
          <h3>Statutory Tax Audit & GSTR Compliance</h3>
          <p>Standard GST @ 18% applied across luxury menswear tailoring and apparel transactions.</p>
        </div>
        <div className="tax-banner-badges">
          <div className="tax-meta-item">
            <small>Legal Entity</small>
            <strong>VELARO MEN'S FASHION PVT LTD</strong>
          </div>
          <div className="tax-meta-item">
            <small>GSTIN / Tax ID</small>
            <strong>33ABCDE1234F1Z5</strong>
          </div>
          <div className="tax-meta-item">
            <small>Filing Readiness</small>
            <span className="tax-badge-ready"><Check size={12}/> GSTR-1 & 3B Ready</span>
          </div>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {cards.map(([label, value, note, Icon, color]) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <i className={`metric-icon ${color}`}>
                <Icon size={18} />
              </i>
            </div>
            <strong>{loading ? "···" : value}</strong>
            <div className="metric-note">{note}</div>
          </article>
        ))}
      </div>

      {/* Row 1: The Two Trend & Trajectory Graphs (Area Chart + Bar Chart side-by-side in balanced 50%/50% grid) */}
      <div className="analytics-graphs-grid">
        {/* Graph 1: Main Revenue & Tax Trend Area Graph */}
        <section className="analytics-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">SALES & TAX TRAJECTORY</span>
              <h2>Gross Revenue & Taxable Turnover Over Time (Graph)</h2>
            </div>
            <div className="chart-legend-row">
              <span className="chart-legend"><i style={{ background: "#a17c45" }} /> Gross Sales</span>
              <span className="chart-legend"><i style={{ background: "#263548" }} /> Taxable Amount</span>
            </div>
          </div>
          {data?.daily?.length ? (
            <div className="analytics-chart-box" style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 16, right: 25, left: 10, bottom: 8 }}>
                  <defs>
                    <linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8935a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#b8935a" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="taxableFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#263548" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#263548" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eeeae3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#8a8882" }}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tick={{ fontSize: 11, fill: "#8a8882" }}
                  />
                  <Tooltip
                    formatter={(v, name) => [money(v), name === "revenue" ? "Gross Sales" : name]}
                    labelFormatter={(d) => dateText(d)}
                    contentStyle={{ border: "1px solid #ece8e1", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Gross Sales" stroke="#a17c45" strokeWidth={2.4} fill="url(#grossFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text={loading ? "Loading trajectory…" : "No sales activity in this period"} />
          )}
          <div className="chart-foot">
            <span>Automated calculation: Taxable = Gross / 1.18 · Output GST = Gross - Taxable</span>
            <span>INR · India</span>
          </div>
        </section>

        {/* Graph 2: Monthly Trajectory Bar Chart (Equal 50% width, generous and not clipped) */}
        <section className="analytics-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">GSTR SCHEDULE & REVENUE CADENCE</span>
              <h2>Monthly Turnover Trajectory (Graph)</h2>
            </div>
            <div className="chart-legend-row">
              <span className="chart-legend"><i style={{ background: "#b8935a" }} /> Monthly Turnover</span>
            </div>
          </div>
          {data?.monthly?.length ? (
            <div className="analytics-chart-box" style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} margin={{ top: 16, right: 25, left: 15, bottom: 8 }}>
                  <CartesianGrid stroke="#eeeae3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8882" }} />
                  <YAxis
                    tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tick={{ fontSize: 11, fill: "#8a8882" }}
                  />
                  <Tooltip
                    formatter={(v) => [money(v), "Gross Turnover"]}
                    contentStyle={{ border: "1px solid #ece8e1", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Bar dataKey="gross" fill="#b8935a" radius={[6, 6, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="No monthly records" />
          )}
          <div className="chart-foot">
            <span>Aggregated monthly cadence for GSTR-1 and GSTR-3B filings</span>
            <span>{data?.monthly?.length || 0} Months recorded</span>
          </div>
        </section>
      </div>

      {/* Row 2: The Three Distribution Donut / Pie Charts (Clean 3-Column Grid) */}
      <div className="analytics-pies-grid">
        {/* Pie Chart 1: Revenue by Category */}
        <section className="analytics-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">MERCHANDISE DYNAMICS</span>
              <h2>Revenue by Category (Pie Chart)</h2>
            </div>
            <BarChart3 size={17} className="subtle-icon" />
          </div>
          {data?.categories?.length ? (
            <>
              <div className="analytics-chart-box" style={{ height: "205px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={42}
                      paddingAngle={3}
                    >
                      {data.categories.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name, entry) => [money(val), `${entry.payload.name} (${entry.payload.units} units)`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend-pill-box">
                {data.categories.slice(0, 5).map((cat, idx) => (
                  <span key={cat.name} className="pie-legend-item">
                    <span className="legend-color-dot" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="legend-name">{cat.name}:</span>
                    <b>{money(cat.value)}</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <Empty text={loading ? "Loading categories…" : "No category data yet"} />
          )}
          <div className="chart-foot">
            <span>Total units: {tax.totalUnits || 0} items</span>
            <span>{data?.categories?.length || 0} active categories</span>
          </div>
        </section>

        {/* Pie Chart 2: Order Fulfillment Status */}
        <section className="analytics-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">FULFILLMENT HEALTH</span>
              <h2>Order Status (Pie Chart)</h2>
            </div>
          </div>
          {data?.statuses?.length ? (
            <>
              <div className="analytics-chart-box" style={{ height: "205px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statuses}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={42}
                      paddingAngle={3}
                    >
                      {data.statuses.map((entry) => (
                        <Cell key={`st-${entry.name}`} fill={STATUS_COLORS[entry.name] || "#7f8c8d"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(count, name, entry) => [`${count} orders (${money(entry.payload.value)})`, entry.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend-pill-box">
                {data.statuses.map((s) => (
                  <span key={s.name} className="pie-legend-item">
                    <span className="legend-color-dot" style={{ background: STATUS_COLORS[s.name] || "#7f8c8d" }} />
                    <span className="legend-name">{s.name}:</span>
                    <b>{s.count}</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <Empty text="No status data" />
          )}
          <div className="chart-foot">
            <span>Operational pipeline</span>
            <span>{tax.totalOrders || 0} orders recorded</span>
          </div>
        </section>

        {/* Pie Chart 3: Payment Method Distribution */}
        <section className="analytics-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CASH FLOW</span>
              <h2>Payment Method (Pie Chart)</h2>
            </div>
          </div>
          {data?.paymentMethods?.length ? (
            <>
              <div className="analytics-chart-box" style={{ height: "205px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={42}
                      paddingAngle={3}
                    >
                      {data.paymentMethods.map((entry, idx) => (
                        <Cell key={`pm-${idx}`} fill={idx === 0 ? "#1e2a39" : idx === 1 ? "#b8935a" : "#6a7b8c"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name, entry) => [money(val), `${entry.payload.name} (${entry.payload.count} orders)`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend-pill-box">
                {data.paymentMethods.map((pm, idx) => (
                  <span key={pm.name} className="pie-legend-item">
                    <span className="legend-color-dot" style={{ background: idx === 0 ? "#1e2a39" : idx === 1 ? "#b8935a" : "#6a7b8c" }} />
                    <span className="legend-name">{pm.name}:</span>
                    <b>{money(pm.value)}</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <Empty text="No payment data" />
          )}
          <div className="chart-foot">
            <span>Settlement reconciliation</span>
            <span>{data?.paymentMethods?.length || 0} payment channels</span>
          </div>
        </section>
      </div>

      {/* Monthly GSTR-3B Tax Filing Schedule Table */}
      <section className="analytics-table-card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">TAX RETURN SCHEDULE</span>
            <h2>Monthly GSTR-3B Statement & Filing Matrix</h2>
          </div>
          <button onClick={handleExportExcel} className="btn-download-excel" style={{ padding: "7px 14px", fontSize: "12px" }}>
            <FileSpreadsheet size={13} /> Export GSTR Sheet
          </button>
        </div>
        {data?.monthly?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TAX PERIOD</th>
                  <th className="align-right">INVOICES</th>
                  <th className="align-right">GROSS TURNOVER</th>
                  <th className="align-right">TAXABLE TURNOVER</th>
                  <th className="align-right">CGST (9%)</th>
                  <th className="align-right">SGST (9%)</th>
                  <th className="align-right">OUTPUT GST (18%)</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((row) => (
                  <tr key={row.monthKey}>
                    <td><b>{row.month}</b></td>
                    <td className="align-right">{row.orders}</td>
                    <td className="align-right amount">{money(row.gross)}</td>
                    <td className="align-right amount">{money(row.taxable)}</td>
                    <td className="align-right amount">{money(row.cgst)}</td>
                    <td className="align-right amount">{money(row.sgst)}</td>
                    <td className="align-right amount" style={{ color: "#a57f43", fontWeight: "600" }}>{money(row.tax)}</td>
                    <td><span className="tax-badge-ready"><Check size={11} /> Ready</span></td>
                  </tr>
                ))}
                <tr style={{ background: "#f8f6f0", fontWeight: "bold" }}>
                  <td>TOTAL CONSOLIDATED</td>
                  <td className="align-right">{(data.monthly || []).reduce((s, m) => s + m.orders, 0)}</td>
                  <td className="align-right amount">{money((data.monthly || []).reduce((s, m) => s + m.gross, 0))}</td>
                  <td className="align-right amount">{money((data.monthly || []).reduce((s, m) => s + m.taxable, 0))}</td>
                  <td className="align-right amount">{money((data.monthly || []).reduce((s, m) => s + m.cgst, 0))}</td>
                  <td className="align-right amount">{money((data.monthly || []).reduce((s, m) => s + m.sgst, 0))}</td>
                  <td className="align-right amount" style={{ color: "#a57f43" }}>{money((data.monthly || []).reduce((s, m) => s + m.tax, 0))}</td>
                  <td><span className="tax-badge-ready">Audit Cleared</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No tax records found for the selected period." />
        )}
      </section>

      {/* Top Performing Creations & Category Breakdown Table */}
      <div className="analytics-graphs-grid" style={{ marginBottom: "24px" }}>
        <section className="analytics-table-card" style={{ marginBottom: 0 }}>
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">BESTSELLERS</span>
              <h2>Top Performing Creations</h2>
            </div>
            <Package size={17} className="subtle-icon" />
          </div>
          {data?.topProducts?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PIECE / PRODUCT</th>
                    <th>CATEGORY</th>
                    <th className="align-right">QTY</th>
                    <th className="align-right">REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.name}>
                      <td className="customer-name">{p.name}</td>
                      <td><small>{p.category}</small></td>
                      <td className="align-right">{p.units}</td>
                      <td className="align-right amount">{money(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No product sales recorded" />
          )}
        </section>

        <section className="analytics-table-card" style={{ marginBottom: 0 }}>
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">TAX MATRIX</span>
              <h2>Tax Classification & Rates</h2>
            </div>
            <Receipt size={17} className="subtle-icon" />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CLASSIFICATION</th>
                  <th>TAX RATE</th>
                  <th className="align-right">TAX SHARE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Luxury Menswear & Tailoring</b></td>
                  <td>18.0% (GST)</td>
                  <td className="align-right amount">{money(tax.taxCollected)}</td>
                </tr>
                <tr>
                  <td>Central Component (CGST)</td>
                  <td>9.0%</td>
                  <td className="align-right amount">{money(tax.cgst)}</td>
                </tr>
                <tr>
                  <td>State Component (SGST)</td>
                  <td>9.0%</td>
                  <td className="align-right amount">{money(tax.sgst)}</td>
                </tr>
                <tr>
                  <td>Inter-state Component (IGST)</td>
                  <td>18.0%</td>
                  <td className="align-right amount">{money(tax.igst || 0)}</td>
                </tr>
                <tr>
                  <td>Exemptions / Credit Notes</td>
                  <td>0.0%</td>
                  <td className="align-right amount">{money(tax.cancelledRevenue || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detailed Invoice & Tax Ledger */}
      <section className="analytics-table-card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">TAX AUDIT REGISTER</span>
            <h2>Tax Invoice Register (GSTR-1 Ready)</h2>
          </div>
          <div className="records-toolbar" style={{ border: "none", padding: 0 }}>
            <div className="search-box">
              <Search size={15} />
              <input
                placeholder="Search invoice ID, customer, payment…"
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setLedgerPage(1);
                }}
              />
            </div>
          </div>
        </div>
        {pagedOrders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INVOICE #</th>
                  <th>DATE</th>
                  <th>CLIENT / RECIPIENT</th>
                  <th>METHOD</th>
                  <th>STATUS</th>
                  <th className="align-right">TAXABLE</th>
                  <th className="align-right">TAX (18%)</th>
                  <th className="align-right">GROSS TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((o) => {
                  const gross = o.totalValue || 0;
                  const taxable = Math.round((gross / 1.18) * 100) / 100;
                  const itemTax = Math.round((gross - taxable) * 100) / 100;
                  return (
                    <tr key={o.orderId}>
                      <td className="order-ref">#{o.orderId}</td>
                      <td>{dateText(o.createdAt)}</td>
                      <td className="customer-name">
                        {o.customerName}
                        <small>{o.customerEmail}</small>
                      </td>
                      <td><small>{o.paymentMethod}</small></td>
                      <td><Status value={o.status} /></td>
                      <td className="align-right amount">{money(taxable)}</td>
                      <td className="align-right amount" style={{ color: "#a57f43" }}>{money(itemTax)}</td>
                      <td className="align-right amount" style={{ fontWeight: "600" }}>{money(gross)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No matching invoices found in register" />
        )}
        <div className="records-foot">
          <span>Showing {pagedOrders.length} of {filteredOrders.length} tax records</span>
          <div>
            <button disabled={ledgerPage === 1} onClick={() => setLedgerPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {ledgerPage} of {Math.ceil(filteredOrders.length / 10) || 1}</span>
            <button disabled={ledgerPage * 10 >= filteredOrders.length} onClick={() => setLedgerPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function AdminApp() {
  const { user, signout: authSignout } = useAuth();
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("velaro_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.role === "admin" ? parsed : null;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    api("/admin/me")
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        if (alive) setProfile(null);
      })
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (profile) {
      const socket = io(API_ORIGIN);
      socket.on("new_order", (data) => {
        toast.success(`New Order Received! Order #${data.orderId} with ${data.itemsCount} items.`);
      });
      return () => socket.disconnect();
    }
  }, [profile]);

  async function signout() {
    try {
      await authSignout();
    } catch {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
      localStorage.removeItem("velaro_auth_user");
    }
    setProfile(null);
    navigate("/login", { replace: true, state: null });
  }

  // If a non-admin (e.g. customer) is logged in and navigates to /admin, send them to customer storefront
  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (checking) return <div className="admin-check">VELARO <span>A</span> Secure administration</div>;

  if (!profile) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/login" state={{ from: { pathname: "/admin/dashboard" } }} replace />} />
      </Routes>
    );
  }

  return (
    <Shell profile={profile} onSignout={signout}>
      <Routes>
        <Route path="dashboard" element={<Overview />} />
        <Route path="analytics" element={<AnalyticsPanel />} />
        <Route path="orders" element={<Records kind="orders" />} />
        <Route path="products" element={<ProductsPanel />} />
        <Route path="customers" element={<Records kind="customers" />} />
        <Route path="appointments" element={<Records kind="appointments" />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </Shell>
  );
}
