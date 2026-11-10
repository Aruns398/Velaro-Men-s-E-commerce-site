import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Link, NavLink, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Activity, CalendarDays, ChevronDown, CircleDollarSign, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Search, ShieldCheck, Users, X, Download, Plus, Trash2, Upload, Image, Check, RefreshCw, ExternalLink } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import * as XLSX from "xlsx";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const money = (n = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const dateText = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const nav = [
  ["Overview", "/admin/dashboard", LayoutDashboard], ["Orders", "/admin/orders", ClipboardList],
  ["Products", "/admin/products", Package], ["Customers", "/admin/customers", Users], 
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
      const socket = io(API.replace('/api', ''));
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
        <Route path="orders" element={<Records kind="orders" />} />
        <Route path="products" element={<ProductsPanel />} />
        <Route path="customers" element={<Records kind="customers" />} />
        <Route path="appointments" element={<Records kind="appointments" />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </Shell>
  );
}
