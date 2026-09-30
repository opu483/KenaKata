import { useState, useEffect } from "react";
import Pages from "./AdminPages.jsx";
import { STAGES, isDone, step, runWorkers } from "./orders.js";

const RANGES = { overall: "Overall Statistics", today: "Today Statistics", week: "This Week Statistics", month: "This Month Statistics", year: "This Year Statistics" };
// [orders, stores, products, customers, pending, confirmed, packaging, out for delivery, delivered, canceled, returned, failed]
const STATS = {
  overall: [412, 10, 186, 264, 14, 9, 6, 11, 352, 12, 5, 3],
  today: [6, 0, 2, 3, 2, 1, 0, 1, 2, 0, 0, 0],
  week: [38, 1, 9, 21, 5, 4, 3, 4, 20, 1, 1, 0],
  month: [131, 2, 34, 77, 9, 6, 4, 8, 98, 4, 2, 0],
  year: [412, 10, 186, 264, 14, 9, 6, 11, 352, 12, 5, 3],
};
const STATUS = [["⏳", "Pending"], ["✅", "Confirmed"], ["📦", "Packaging"], ["🚚", "Out for delivery"], ["🎁", "Delivered"], ["❌", "Canceled"], ["↩️", "Returned"], ["⚠️", "Failed to deliver"]];
const CH = {
  year: { labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], inhouse: [420,380,510,640,590,720,880,1240,2100,1650,0,0], vendor: [120,160,140,210,260,300,340,410,520,480,0,0], comm: [12,16,14,21,26,30,34,41,52,48,0,0] },
  month: { labels: ["1","5","10","15","20","25","30"], inhouse: [90,140,210,180,260,320,290], vendor: [30,42,60,55,80,94,88], comm: [3,4,6,5,8,9,8] },
  week: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], inhouse: [60,85,72,110,140,190,120], vendor: [18,25,20,34,41,60,38], comm: [2,3,2,3,4,6,4] },
};
const COL = { inhouse: "#4c9df8", vendor: "#7cc36e", comm: "#c4c05a" };

function Chart({ range, keys, money }) {
  const d = CH[range], W = 640, H = 300, L = 60, R = 12, T = 12, B = 30;
  const max = Math.max(1, ...keys.flatMap(k => d[k])), raw = max / 4, pw = 10 ** Math.floor(Math.log10(raw)), step = Math.ceil(raw / pw) * pw;
  const x = i => L + (i * (W - L - R)) / (d.labels.length - 1), y = v => T + (H - T - B) * (1 - v / (step * 4));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" className="adm-chart">
      {[0, 1, 2, 3, 4].map(i => (<g key={i}><line x1={L} x2={W - R} y1={y(step * i)} y2={y(step * i)} stroke="var(--line)" strokeDasharray="4 4" /><text x={L - 8} y={y(step * i) + 4} textAnchor="end" fontSize="11" fill="var(--mute)">{money(step * i)}</text></g>))}
      {d.labels.map((l, i) => <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mute)">{l}</text>)}
      {keys.map(k => (<g key={k}><polyline fill="none" stroke={COL[k]} strokeWidth="3" strokeLinejoin="round" points={d[k].map((v, i) => `${x(i)},${y(v)}`).join(" ")} />{d[k].map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={COL[k]}><title>{`${d.labels[i]}: ${money(v)}`}</title></circle>)}</g>))}
    </svg>
  );
}
const Legend = ({ items }) => <div className="adm-leg">{items.map(([c, l]) => <span key={l}><i style={{ background: c }} />{l}</span>)}</div>;
const Tabs = ({ v, set }) => <div className="adm-tabs" role="tablist">{[["year", "This Year"], ["month", "This Month"], ["week", "This Week"]].map(([k, l]) => <button key={k} role="tab" aria-selected={v === k} className={v === k ? "on" : ""} onClick={() => set(k)}>{l}</button>)}</div>;

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p[1], 0), r = 60, C = 2 * Math.PI * r; let off = 0;
  return (
    <svg viewBox="0 0 160 160" width="190" role="img" aria-label="User overview" style={{ display: "block", margin: "0 auto" }}>
      {parts.map(([l, n, c]) => { const len = (n / total) * C, el = <circle key={l} cx="80" cy="80" r={r} fill="none" stroke={c} strokeWidth="26" strokeDasharray={`${len - 2} ${C - len + 2}`} strokeDashoffset={-off} transform="rotate(-90 80 80)" />; off += len; return el; })}
      <text x="80" y="82" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--ink)">{total}</text>
      <text x="80" y="100" textAnchor="middle" fontSize="11" fill="var(--mute)">Total users</text>
    </svg>
  );
}

const NAV = [["Dashboard", "dashboard"], ["Orders", "orders"], ["Products", "products"], ["POS", "pos"], ["Coupons", "coupons"], ["People", "people"], ["Reports", "reports"], ["Settings", "settings"]];
const CUST = [["Amelia Hart", "a****@**mail.com", 146], ["Noah Bell", "n****@**mail.com", 17], ["Priya Rao", "p****@**mail.com", 7], ["Leo Marsh", "l****@**mail.com", 3]];

export default function Admin({ orders, updateOrders, products, ovr, updOvr, coupons, updCoupons, cfg, updCfg, dms, updDms, vendors, onExit, onLogout, money }) {
  const [range, setRange] = useState("year"), [os, setOs] = useState("year"), [es, setEs] = useState("year"), [side, setSide] = useState(() => window.innerWidth > 760), [view, setView] = useState("dashboard");
  const [workers, setWorkers] = useState(2), [auto, setAuto] = useState(false);
  const advance = n => updateOrders(l => runWorkers(l, n));
  useEffect(() => { if (!auto) return; const t = setInterval(() => advance(workers), 3000); return () => clearInterval(t); }, [auto, workers]);
  const queue = [...orders.filter(o => !isDone(o)), ...orders.filter(isDone).reverse()].slice(0, 20);
  const queueCard = (
          <section className="adm-card"><div className="adm-h"><h2>🧾 Order queue</h2>
            <div className="adm-ctl"><label>Workers <select value={workers} onChange={e => setWorkers(+e.target.value)}>{[1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label>
              <label><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Auto-process</label>
              <button className="ic" onClick={() => advance(workers)}>Process next {workers}</button></div></div>
            <div className="adm-leg">{[...STAGES, "Canceled"].map(x => <span key={x}>{x}: <b>{orders.filter(o => o.status === x).length}</b></span>)}</div>
            {!orders.length ? <p style={{ color: "var(--mute)" }}>No orders yet. Place an order in the store (another tab works too) and it will join the queue here, oldest first.</p> :
              <div className="adm-q">{queue.map(o => (
                <div className="adm-row" key={o.id}><div style={{ flex: 1, minWidth: 0 }}><b>{o.id}</b><br /><small>{o.name} · {money(o.total)}{o.phone ? " · " + o.phone : ""}{o.zone ? " · " + ({ in: "Inside Dhaka", out: "Outside Dhaka", pickup: "Pickup" })[o.zone] : ""}{o.pay && o.pay !== "cod" ? " · " + o.pay + " " + o.trx : ""}</small></div>
                  <span className={"st s" + (o.status === "Canceled" ? "x" : STAGES.indexOf(o.status))}>{o.status}</span>
                  {!isDone(o) && <><button className="ic" aria-label={"Advance " + o.id} onClick={() => updateOrders(l => l.map(x => x.id === o.id ? step(x, x.status) : x))}>Next ›</button>
                    <button className="ic" aria-label={"Cancel " + o.id} onClick={() => updateOrders(l => l.map(x => x.id === o.id && !isDone(x) ? { ...x, status: "Canceled" } : x))}>✕</button></>}</div>))}</div>}
            <small style={{ color: "var(--mute)" }}>Workers = how many orders move forward at the same time on each tick (every 3 seconds when auto-processing).</small></section>
  );
  const s = STATS[range], cards = [["📝", "Total order", s[0]], ["🏪", "Total stores", s[1]], ["📦", "Total products", s[2]], ["👥", "Total customers", s[3]]];
  const wallet = [["Commission earned", 12927.52], ["Delivery charge earned", 1660], ["Total tax collected", 2666], ["Pending amount", 11292.5]];
  const auction = [["Entry fee", 1517], ["Tax", 0], ["Commission collected", 0], ["Self auction shipping fee", 0]];
  return (
    <div className="adm">
      <header className="adm-top">
        <b className="adm-logo">KenaKata<i>.</i> <small>Admin</small></b>
        <button className="ic" aria-label="Toggle sidebar" onClick={() => setSide(!side)}>☰</button>
        <input className="adm-search" aria-label="Search" placeholder="Search orders, products, users" />
        <button className="ic" onClick={onExit}>← Back to store</button>
        <button className="ic" onClick={onLogout}>Sign out</button>
        <button className="ic" aria-label="Orders">🛒<b>60</b></button>
        <button className="ic" aria-label="Messages">💬<b>1</b></button>
        <span className="adm-av" aria-label="Admin">A</span>
      </header>
      <div className="adm-body">
        {side && <aside className="adm-side">{NAV.map(([n, k]) => <button key={k} className={view === k ? "on" : ""} aria-current={view === k ? "page" : undefined} onClick={() => { setView(k); if (window.innerWidth <= 760) setSide(false); window.scrollTo(0, 0); }}>{n}</button>)}</aside>}
        <main className="adm-main">{view !== "dashboard" ? (view === "orders" ? <><h1>Orders</h1>{queueCard}</> : <Pages view={view} {...{ products, orders, updateOrders, ovr, updOvr, coupons, updCoupons, cfg, updCfg, dms, updDms, vendors, money }} />) : <>
          <h1>Welcome Admin</h1><p style={{ color: "var(--mute)" }}>Monitor your business analytics and statistics.</p>
          <section className="adm-card"><div className="adm-h"><h2>Business analytics</h2>
            <select aria-label="Statistics period" value={range} onChange={e => setRange(e.target.value)}>{Object.entries(RANGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="adm-grid">{cards.map(([e, l, n]) => <div className="adm-stat" key={l}><span>{e}</span><small>{l}</small><b>{n}</b></div>)}</div>
            <div className="adm-grid">{STATUS.map(([e, l], i) => <div className="adm-row" key={l}><span>{e} {l}</span><b>{s[4 + i]}</b></div>)}</div></section>
          {queueCard}
          <section className="adm-card"><div className="adm-h"><h2>👛 Admin wallet</h2></div>
            <div className="adm-stat big"><span>📈</span><b>{money(41992)}</b><small>In-house earning</small></div>
            <div className="adm-grid">{wallet.map(([l, v]) => <div className="adm-stat" key={l}><b>{money(v)}</b><small>{l}</small></div>)}</div></section>
          <section className="adm-card"><div className="adm-h"><h2>🔨 Auction wallet</h2></div>
            <div className="adm-stat big"><span>💰</span><b>{money(0)}</b><small>In-house total earning</small></div>
            <div className="adm-grid">{auction.map(([l, v]) => <div className="adm-stat" key={l}><b>{money(v)}</b><small>{l}</small></div>)}</div></section>
          <section className="adm-card"><div className="adm-h"><h2>Order statistics</h2><Tabs v={os} set={setOs} /></div>
            <Legend items={[[COL.inhouse, "In-house"], [COL.vendor, "Vendor"]]} /><Chart range={os} keys={["inhouse", "vendor"]} money={money} /></section>
          <section className="adm-card"><div className="adm-h"><h2>User overview</h2></div>
            <Donut parts={[["Customers", 7, "#7bbfff"], ["Vendors", 10, "#f8b132"], ["Delivery men", 4, "#1c1a91"]]} />
            <Legend items={[["#7bbfff", "Total customers (7)"], ["#f8b132", "Total vendors (10)"], ["#1c1a91", "Total delivery men (4)"]]} /></section>
          <section className="adm-card"><div className="adm-h"><h2>Earning statistics</h2><Tabs v={es} set={setEs} /></div>
            <Legend items={[[COL.inhouse, "In-house"], [COL.vendor, "Vendor"], [COL.comm, "Commission"]]} /><Chart range={es} keys={["inhouse", "vendor", "comm"]} money={money} /></section>
          <section className="adm-card"><div className="adm-h"><h2>Users</h2></div>
            <div className="adm-row"><b>Top customers</b><button className="link" style={{ margin: 0 }} onClick={() => setTip("Customer list is not part of this demo")}>View all</button></div>
            {CUST.map(([n, e, o]) => <div className="adm-cust" key={n}><span className="adm-av">{n[0]}</span><div><b>{n}</b><br /><small>{e}</small></div><span className="adm-pill">Orders: {o}</span></div>)}</section>
          </>}
        </main>
      </div>
    </div>
  );
}
