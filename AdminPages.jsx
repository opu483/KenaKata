import { useState } from "react";
import { STAGES, isDone, newId } from "./orders.js";

const CATS = ["Fashion", "Electronics", "Home", "Beauty", "Sports", "Books"];
const csvCell = c => { let s = String(c); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

export default function Pages({ view, products, orders, updateOrders, ovr, updOvr, coupons, updCoupons, cfg, updCfg, dms, updDms, vendors, money }) {
  const [msg, setMsg] = useState(""), [tab, setTab] = useState("customers"), [bill, setBill] = useState({}), [f, setF] = useState(""), [imagePreview, setImagePreview] = useState("");
  const say = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const edit = (id, patch) => updOvr(o => ({ ...o, edits: { ...o.edits, [id]: { ...o.edits[id], ...patch } } }));
  const Msg = () => msg ? <p role="status" className="adm-msg">{msg}</p> : null;

  if (view === "products") {
    const addP = e => { e.preventDefault(); const d = new FormData(e.target);
      const image = imagePreview || String(d.get("imageUrl") || "").trim();
      updOvr(o => ({ ...o, extra: [...o.extra, { id: o.nextId, name: String(d.get("name")).trim(), cat: d.get("cat"), price: +d.get("price"), was: +d.get("was") > +d.get("price") ? +d.get("was") : null, emoji: d.get("emoji") || "🎁", image, bg: "#e8e4f2", vendor: d.get("vendor"), rating: 4.5, stock: +d.get("stock"), featured: d.get("featured") === "on", description: String(d.get("description") || "").trim() }], nextId: o.nextId + 1 }));
      e.target.reset(); setImagePreview(""); say("Product added to KenaKata"); };
    const pickImage = e => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) return say("Please select an image file"); if (file.size > 3 * 1024 * 1024) return say("Image must be under 3 MB"); const reader = new FileReader(); reader.onload = () => setImagePreview(String(reader.result)); reader.readAsDataURL(file); };
    return (<><h1>Products</h1><Msg />
      <section className="adm-card"><div className="adm-h"><div><h2>Add product</h2><small style={{ color: "var(--mute)" }}>Create a complete product listing with image, pricing and stock.</small></div></div>
        <form className="adm-form product-form" onSubmit={addP}>
          <input name="name" required placeholder="Product name" />
          <select name="cat">{CATS.map(c => <option key={c}>{c}</option>)}</select>
          <input name="price" type="number" min="0.01" step="0.01" required placeholder="Selling price" />
          <input name="was" type="number" min="0" step="0.01" placeholder="Compare-at price" />
          <input name="stock" type="number" min="0" required placeholder="Stock quantity" />
          <select name="vendor">{vendors.map(v => <option key={v.n}>{v.n}</option>)}</select>
          <input name="imageUrl" type="url" placeholder="Image URL (optional)" />
          <label className="file-field">Product image<input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={pickImage} /></label>
          <input name="emoji" maxLength="2" placeholder="Fallback emoji" />
          <label className="check-field"><input name="featured" type="checkbox" /> Featured product</label>
          <textarea name="description" rows="3" placeholder="Short product description (optional)" />
          {imagePreview && <div className="image-preview"><img src={imagePreview} alt="Product preview" /><button type="button" className="ic" onClick={() => setImagePreview("")}>Remove image</button></div>}
          <button className="pay">Add product</button>
        </form></section>
      <section className="adm-card"><div className="adm-h"><h2>All products ({products.length})</h2><span className="adm-pill">Image-ready catalog</span></div>
        {products.map(p => (<div className="adm-row adm-pr" key={p.id}>
          <div className="admin-product-thumb">{p.image ? <img src={p.image} alt="" /> : <span>{p.emoji}</span>}</div>
          <div style={{ flex: 1, minWidth: 120 }}><b>{p.name}</b>{p.featured && <span className="st s3" style={{ marginLeft: 6 }}>Featured</span>}{p.hidden && <span className="st sx" style={{ marginLeft: 6 }}>Hidden</span>}<br /><small>{p.vendor} · {p.cat}</small>{p.stock <= 5 && <div className="low">{p.stock === 0 ? "Out of stock" : "Low stock: " + p.stock}</div>}</div>
          <label>Price<input type="number" min="0.01" step="0.01" defaultValue={p.price} key={p.id + "p" + p.price} onBlur={e => +e.target.value > 0 && edit(p.id, { price: +e.target.value })} /></label>
          <label>Stock<input type="number" min="0" defaultValue={p.stock} key={p.id + "s" + p.stock} onBlur={e => +e.target.value >= 0 && edit(p.id, { stock: +e.target.value })} /></label>
          <button className="ic" onClick={() => edit(p.id, { featured: !p.featured })}>{p.featured ? "Unfeature" : "Feature"}</button>
          <button className="ic" onClick={() => edit(p.id, { hidden: !p.hidden })}>{p.hidden ? "Show" : "Hide"}</button>
          {p.id >= 100 && <button className="ic" aria-label={"Delete " + p.name} onClick={() => updOvr(o => ({ ...o, extra: o.extra.filter(x => x.id !== p.id) }))}>🗑</button>}</div>))}</section></>);
  }

  if (view === "pos") {
    const list = products.filter(p => !p.hidden && p.stock > 0 && ovr.vend[p.vendor] !== "suspended" && p.name.toLowerCase().includes(f.toLowerCase()));
    const lines = Object.entries(bill).map(([id, n]) => ({ p: products.find(x => x.id === +id), n })).filter(l => l.p);
    const sub = lines.reduce((s, l) => s + l.p.price * l.n, 0), total = sub * (1 + cfg.tax / 100);
    const charge = () => {
      updateOrders(o => [...o, { id: newId(), user: "pos", name: "POS sale", items: lines.map(({ p, n }) => ({ id: p.id, name: p.name, n, price: p.price })), total: +total.toFixed(2), status: "Delivered", at: Date.now(), log: [["Delivered", Date.now()]] }]);
      updOvr(o => { const e = { ...o.edits }; lines.forEach(({ p, n }) => { e[p.id] = { ...e[p.id], stock: Math.max(0, p.stock - n) }; }); return { ...o, edits: e }; });
      setBill({}); say("Sale recorded"); };
    return (<><h1>POS</h1><Msg />
      <div className="adm-pos"><section className="adm-card"><input className="adm-search" style={{ width: "100%", marginBottom: 10 }} placeholder="Search products" value={f} onChange={e => setF(e.target.value)} />
        <div className="adm-grid">{list.map(p => <button key={p.id} className="adm-stat" style={{ textAlign: "left" }} onClick={() => setBill(b => (b[p.id] || 0) >= p.stock ? b : { ...b, [p.id]: (b[p.id] || 0) + 1 })}><span>{p.emoji}</span><b style={{ fontSize: 15 }}>{p.name}</b><small>{money(p.price)} · {p.stock} left</small></button>)}</div></section>
        <section className="adm-card"><h2 style={{ marginTop: 0 }}>Bill</h2>{!lines.length && <p style={{ color: "var(--mute)" }}>Tap a product to add it.</p>}
          {lines.map(({ p, n }) => <div className="adm-row" key={p.id} style={{ marginBottom: 6 }}><span style={{ flex: 1 }}>{p.name} × {n}</span><b>{money(p.price * n)}</b><button className="ic" aria-label={"Remove one " + p.name} onClick={() => setBill(b => { const x = { ...b }; x[p.id] > 1 ? x[p.id]-- : delete x[p.id]; return x; })}>−</button></div>)}
          <div className="adm-row"><span>Tax ({cfg.tax}%)</span><span>{money(sub * cfg.tax / 100)}</span></div>
          <div className="adm-row" style={{ fontWeight: 700 }}><span>Total</span><span>{money(total)}</span></div>
          <button className="pay" style={{ width: "100%", marginTop: 10 }} disabled={!lines.length} onClick={charge}>Charge</button></section></div></>);
  }

  if (view === "coupons") {
    const addC = e => { e.preventDefault(); const d = new FormData(e.target), code = String(d.get("code")).trim().toUpperCase();
      if (coupons.some(c => c.code === code)) return say("That code already exists");
      updCoupons(l => [...l, { code, pct: +d.get("pct"), active: true }]); e.target.reset(); say("Coupon created"); };
    return (<><h1>Coupons</h1><Msg />
      <section className="adm-card"><form className="adm-form" onSubmit={addC}><input name="code" required maxLength="20" pattern="[A-Za-z0-9]+" title="Letters and numbers only" placeholder="Code" /><input name="pct" type="number" min="1" max="90" required placeholder="Percent off" /><button className="pay">Create</button></form></section>
      <section className="adm-card">{coupons.map(c => <div className="adm-row" key={c.code} style={{ marginBottom: 8 }}><b style={{ flex: 1 }}>{c.code}</b><span>{c.pct}% off</span><span className={"st " + (c.active ? "s4" : "sx")}>{c.active ? "Active" : "Off"}</span>
        <button className="ic" onClick={() => updCoupons(l => l.map(x => x.code === c.code ? { ...x, active: !x.active } : x))}>{c.active ? "Turn off" : "Turn on"}</button>
        <button className="ic" aria-label={"Delete " + c.code} onClick={() => updCoupons(l => l.filter(x => x.code !== c.code))}>🗑</button></div>)}</section></>);
  }

  if (view === "people") {
    const cust = Object.values(orders.filter(o => o.user !== "pos").reduce((m, o) => { const c = m[o.user] || (m[o.user] = { name: o.name, email: o.user, n: 0, spent: 0 }); c.n++; if (o.status !== "Canceled") c.spent += o.total; return m; }, {}));
    return (<><h1>People</h1><Msg />
      <div className="adm-tabs" style={{ width: "fit-content", marginBottom: 12 }}>{[["customers", "Customers"], ["vendors", "Vendors"], ["delivery", "Delivery men"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <section className="adm-card">
        {tab === "customers" && (cust.length ? cust.map(c => <div className="adm-cust" key={c.email}><span className="adm-av">{(c.name || "?")[0]}</span><div><b>{c.name}</b><br /><small>{c.email}</small></div><span className="adm-pill">Orders: {c.n} · {money(c.spent)}</span></div>) : <p style={{ color: "var(--mute)" }}>Customers appear here after they place an order.</p>)}
        {tab === "vendors" && vendors.map(v => { const s = ovr.vend[v.n] || "approved"; return <div className="adm-row" key={v.n} style={{ marginBottom: 8 }}><div style={{ flex: 1 }}><b>{v.n}</b><br /><small>★ {v.r} · {v.p} products</small></div><span className={"st " + (s === "approved" ? "s4" : "sx")}>{s}</span>
          <button className="ic" onClick={() => updOvr(o => ({ ...o, vend: { ...o.vend, [v.n]: s === "approved" ? "suspended" : "approved" } }))}>{s === "approved" ? "Suspend" : "Approve"}</button></div>; })}
        {tab === "delivery" && <><form className="adm-form" onSubmit={e => { e.preventDefault(); const n = String(new FormData(e.target).get("n")).trim(); if (n) updDms(l => [...l, n]); e.target.reset(); }}><input name="n" required placeholder="Full name" /><button className="pay">Add delivery man</button></form>
          {dms.map(n => <div className="adm-row" key={n} style={{ marginTop: 8 }}><span className="adm-av">{n[0]}</span><b style={{ flex: 1 }}>{n}</b><button className="ic" aria-label={"Remove " + n} onClick={() => updDms(l => l.filter(x => x !== n))}>🗑</button></div>)}</>}</section>
      {tab === "vendors" && <p className="vend">Suspending a vendor hides its products from the store.</p>}</>);
  }

  if (view === "reports") {
    const ok = orders.filter(o => o.status !== "Canceled"), rev = ok.reduce((s, o) => s + o.total, 0);
    const top = Object.entries(ok.flatMap(o => o.items).reduce((m, i) => (m[i.name] = (m[i.name] || 0) + i.n, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const csv = () => { const rows = [["id", "customer", "status", "total_usd", "date"], ...orders.map(o => [o.id, o.name, o.status, o.total, new Date(o.at).toISOString()])];
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" })); a.download = "orders.csv"; a.click(); URL.revokeObjectURL(a.href); };
    return (<><h1>Reports</h1>
      <section className="adm-card"><div className="adm-h"><h2>Sales summary</h2><button className="ic" onClick={csv} disabled={!orders.length}>Export CSV</button></div>
        <div className="adm-grid"><div className="adm-stat"><b>{money(rev)}</b><small>Revenue (excl. canceled)</small></div><div className="adm-stat"><b>{orders.length}</b><small>Orders</small></div><div className="adm-stat"><b>{money(ok.length ? rev / ok.length : 0)}</b><small>Average order</small></div></div>
        <div className="adm-grid">{[...STAGES, "Canceled"].map(s => <div className="adm-row" key={s}><span>{s}</span><b>{orders.filter(o => o.status === s).length}</b></div>)}</div></section>
      <section className="adm-card"><div className="adm-h"><h2>Top products</h2></div>{top.length ? top.map(([n, q]) => <div className="adm-row" key={n} style={{ marginBottom: 6 }}><span>{n}</span><b>{q} sold</b></div>) : <p style={{ color: "var(--mute)" }}>No sales yet.</p>}</section></>);
  }

  if (view === "settings") {
    const n = (k, min, max) => <input type="number" min={min} max={max} step="0.01" defaultValue={cfg[k]} key={k + cfg[k]} onBlur={e => { const v = +e.target.value; if (v >= min && v <= max) { updCfg(c => ({ ...c, [k]: v })); say("Saved"); } else e.target.value = cfg[k]; }} />;
    return (<><h1>Business settings</h1><Msg />
      <section className="adm-card"><div className="adm-form" style={{ maxWidth: 420, gridTemplateColumns: "1fr" }}>
        <label>Delivery fee inside Dhaka (BDT){n("shipIn", 0, 2000)}</label><label>Delivery fee outside Dhaka (BDT){n("shipOut", 0, 2000)}</label><label>Free delivery from (BDT){n("free", 0, 1000000)}</label><label>VAT / tax rate (%){n("tax", 0, 50)}</label></div>
        <p className="vend">Delivery fees and the free-delivery limit apply to the store cart (pickup is always free). The tax rate also applies to the POS.</p></section></>);
  }
  return null;
}
