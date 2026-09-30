import { useState, useMemo, useEffect } from "react";
import "./styles.css";
import Admin from "./Admin.jsx";
import Login from "./Login.jsx";
import { useOrders, newId, STAGES } from "./orders.js";
import { useShared } from "./store.js";
const CATS=["Fashion","Electronics","Home","Beauty","Sports","Books"];
const VENDORS=[{n:"Northside Goods",r:4.8,p:42},{n:"Loom & Thread",r:4.5,p:28},{n:"Volt Depot",r:4.7,p:63},{n:"Green Shelf",r:4.2,p:19}];
const P=[
["Linen Overshirt","Fashion",48,60,"🧥","#e9d8c4",0,4.6],["Trail Sneakers","Sports",72,null,"👟","#cfe3dc",0,4.4],
["Wireless Earbuds","Electronics",59,79,"🎧","#d9dcf0",2,4.5],["Smart Watch","Electronics",149,null,"⌚","#f0d9d9",2,4.7],
["Ceramic Vase","Home",26,null,"🏺","#f3e6c8",3,4.3],["Air Fryer","Home",110,130,"🍳","#dde8f0",2,4.6],
["Face Serum","Beauty",24,30,"🧴","#f6dfe8",1,4.8],["Matte Lipstick","Beauty",14,null,"💄","#f4d3d3",1,4.2],
["Yoga Mat","Sports",30,null,"🧘","#d3ecd9",3,4.5],["Paperback Novel","Books",12,null,"📚","#efe3cf",0,4.1],
["Leather Tote","Fashion",85,100,"👜","#e6d3c1",1,4.7],["Desk Lamp","Home",38,null,"💡","#f5efc6",3,4.4],
["Laptop Stand","Electronics",34,null,"💻","#dfe3ea",2,4.3],["Sketchbook Set","Books",19,null,"✏️","#e8e0f2",0,4.6]
].map((a,i)=>({id:i,name:a[0],cat:a[1],price:a[2],was:a[3],emoji:a[4],bg:a[5],vendor:VENDORS[a[6]].n,rating:a[7],stock:i===3?0:20}));
const CUR={USD:[1,"$"],EUR:[.92,"€"],BDT:[110,"৳"],INR:[83,"₹"]};
const disc=p=>p.was?Math.round((1-p.price/p.was)*100):0;

const BD={phone:"+880 1700-000000",short:"Kuril, Dhaka 1229",full:"Kuril, Dhaka 1229, Bangladesh",map:"https://www.openstreetmap.org/search?query=Kuril%2C%20Dhaka%201229"};
const RATE=CUR.BDT[0];
const BN={"Search products":"পণ্য খুঁজুন","Search":"খুঁজুন","Add to cart":"কার্টে যোগ করুন","Out of stock":"স্টক নেই","Flash deals":"ফ্ল্যাশ ডিল","All products":"সব পণ্য","Top sellers":"সেরা বিক্রেতা","Auction products":"নিলামের পণ্য","Proceed to checkout":"চেকআউটে যান","Shopping cart":"শপিং কার্ট","All":"সব","Fashion":"ফ্যাশন","Electronics":"ইলেকট্রনিক্স","Home":"গৃহসজ্জা","Beauty":"সৌন্দর্য","Sports":"খেলাধুলা","Books":"বই","Delivery":"ডেলিভারি","Payment":"পেমেন্ট","Coupon":"কুপন","Apply":"প্রয়োগ করুন"};
const useCD=s=>{const[t,setT]=useState(s);useEffect(()=>{const i=setInterval(()=>setT(x=>x>0?x-1:0),1000);return()=>clearInterval(i)},[]);return[Math.floor(t/86400),Math.floor(t/3600)%24,Math.floor(t/60)%60,t%60].map(n=>String(n).padStart(2,"0"))};
const Timer=({s})=>{const t=useCD(s);return <div className="timer">{["Days","Hrs","Min","Sec"].map((l,i)=><span key={l}>{t[i]}<small>{l}</small></span>)}</div>};
const AUC=[["Quilted Handbag","👜","#e6d3c1",55,33,172800],["Matte Red Lipstick","💄","#f4d3d3",8,26,18000],["Musical Bear Toy","🧸","#f3e6c8",20,19,86400],["Slim Laptop","💻","#dfe3ea",520,12,108000]].map((a,i)=>({id:i,name:a[0],emoji:a[1],bg:a[2],start:a[3],bids:a[4],secs:a[5]}));
const SLIDES=[["Everything you need, from independent sellers","Shop now","#0f6b63","all"],["Flash deals end soon","See deals","#6b3a8a","flash"],["Open your own store on KenaKata","Become a vendor","#a8501c","vendor"]];
const FAQ=[["How long does delivery take?","Most orders arrive in 2–5 business days."],["Can I return an item?","Yes, within 7 days of delivery if it is unused."],["How do I become a vendor?","Open Vendor zone in the menu and send the application."],["Which payments are accepted?","Cards and cash on delivery in this demo."]];

function App(){
  const[cat,setCat]=useState("All"),[q,setQ]=useState(""),[sort,setSort]=useState("new"),[cur,setCur]=useState("BDT"),[lang,setLang]=useState("English");
  const[carts,setCarts]=useState({}),[uid,setUid]=useState(null),[wish,setWish]=useState([]),[open,setOpen]=useState(null),[toast,setToast]=useState(""),[sel,setSel]=useState(null),[done,setDone]=useState(false);
  const[page,setPage]=useState("shop"),[um,setUm]=useState(false),[auth,setAuth]=useState(null),[user,setUser]=useState(null),[note,setNote]=useState(""),[email,setEmail]=useState("");
  const[slide,setSlide]=useState(0),[bids,setBids]=useState({}),[faq,setFaq]=useState(-1),[acc,setAcc]=useState(""),[vend,setVend]=useState(""),[deals,setDeals]=useState(false),[up,setUp]=useState(false),[accts,setAccts]=useState([]),[isAdmin,setIsAdmin]=useState(false),[applied,setApplied]=useState(null),[code,setCode]=useState(""),[zone,setZone]=useState("in"),[ship_,setShipInfo]=useState({name:"",phone:"",addr:"",area:"Kuril"}),[pay,setPay]=useState("cod"),[trx,setTrx]=useState(""),[cerr,setCerr]=useState("");
  useEffect(()=>{const i=setInterval(()=>setSlide(s=>(s+1)%SLIDES.length),4500),f=()=>setUp(window.scrollY>400);window.addEventListener("scroll",f);return()=>{clearInterval(i);window.removeEventListener("scroll",f)}},[]);
  useEffect(()=>{document.documentElement.dir=lang==="Arabic"?"rtl":"ltr";document.documentElement.lang=lang==="Bangla"?"bn":lang==="Arabic"?"ar":lang==="Hindi"?"hi":"en"},[lang]);
  const t=k=>lang==="Bangla"&&BN[k]||k;
  const[orders,updateOrders]=useOrders();
  const[ovr,updOvr]=useShared("mm:products",{edits:{},extra:[],nextId:100,vend:{}}),[coupons,updCoupons]=useShared("mm:coupons",[{code:"WELCOME10",pct:10,active:true}]),[cfg,updCfg]=useShared("mm:cfg2",{shipIn:60,shipOut:120,free:5000,tax:5}),[dms,updDms]=useShared("mm:dm",["Rafi Khan","Tom Ellis","Sara Lopez","Ivan Petrov"]);
  const vs=ovr.vend||{},allProds=useMemo(()=>[...P,...ovr.extra].map(p=>({...p,...(ovr.edits[p.id]||{})})),[ovr]);
  const prods=useMemo(()=>allProds.filter(p=>!p.hidden&&vs[p.vendor]!=="suspended"),[allProds,ovr]);
  const byId=id=>prods.find(p=>p.id===+id);
  const ck=uid||"guest",cart=carts[ck]||{},setCart=fn=>setCarts(c=>({...c,[ck]:typeof fn==="function"?fn(c[ck]||{}):fn}));
  const signIn=(email,name)=>{setCarts(c=>{const g=c.guest||{},m={...(c[email]||{})};for(const k in g)m[k]=(m[k]||0)+g[k];return{...c,guest:{},[email]:m}});setUid(email);setUser(name)};
  const mine=orders.filter(o=>o.user===uid).slice().reverse();
  const money=v=>{const[r,s]=CUR[cur];return s+(v*r).toLocaleString(cur==="BDT"?"en-BD":undefined,{minimumFractionDigits:2,maximumFractionDigits:2})};
  const say=m=>{setToast(m);setTimeout(()=>setToast(""),1800)};
  const go=p=>{setPage(p==="admin"&&!isAdmin?"adminLogin":p==="orders"&&!uid?"login":p);setOpen(null);setUm(false);window.scrollTo(0,0)};
  const jump=id=>{go("shop");setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),60)};
  const reset=()=>{setCat("All");setQ("");setVend("");setDeals(false)};
  const pick=c=>{reset();setCat(c);go("shop")};
  const add=p=>{if((cart[p.id]||0)>=p.stock)return say("Only "+p.stock+" in stock");setCart(c=>({...c,[p.id]:(c[p.id]||0)+1}));say(p.name+" added to cart")};
  const dec=id=>setCart(c=>{const x={...c};x[id]>1?x[id]--:delete x[id];return x});
  const tw=id=>setWish(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);
  const list=useMemo(()=>{let r=prods.filter(p=>(cat==="All"||p.cat===cat)&&(!vend||p.vendor===vend)&&(!deals||p.was)&&p.name.toLowerCase().includes(q.toLowerCase()));
    if(sort==="low")r=[...r].sort((a,b)=>a.price-b.price);if(sort==="high")r=[...r].sort((a,b)=>b.price-a.price);if(sort==="rate")r=[...r].sort((a,b)=>b.rating-a.rating);return r},[cat,q,sort,vend,deals,prods]);
  const items=Object.entries(cart).map(([id,n])=>({p:byId(id),n})).filter(x=>x.p),count=items.reduce((s,i)=>s+i.n,0);
  const gross=items.reduce((s,i)=>s+i.n*(i.p.was||i.p.price),0),net=items.reduce((s,i)=>s+i.n*i.p.price,0),disc=gross-net,cdisc=applied?net*applied.pct/100:0,ship=net===0||zone==="pickup"||net*RATE>=cfg.free?0:(zone==="in"?cfg.shipIn:cfg.shipOut)/RATE,tax=(net-cdisc)*cfg.tax/100,grand=net-cdisc+ship+tax;
  const applyCoupon=()=>{const c=coupons.find(x=>x.active&&x.code===code.trim().toUpperCase());if(!c)return say("Invalid or inactive coupon");setApplied(c);say("Coupon applied")};
  const checkout=()=>{if(!user){say("Please sign in to check out");return go("login")}
    const s=ship_;if(s.name.trim().length<2)return setCerr("Enter the receiver's name.");
    if(!/^(\+?88)?01[3-9]\d{8}$/.test(s.phone.replace(/[\s-]/g,"")))return setCerr("Enter a valid Bangladesh mobile number, e.g. 01712345678.");
    if(zone!=="pickup"&&s.addr.trim().length<8)return setCerr("Enter your full address (house, road, block).");
    if(pay!=="cod"&&trx.trim().length<8)return setCerr("Enter the transaction ID from your "+pay+" payment.");
    setCerr("");updateOrders(o=>[...o,{id:newId(),user:uid,name:user,items:items.map(({p,n})=>({id:p.id,name:p.name,n,price:p.price})),total:+grand.toFixed(2),status:"Pending",at:Date.now(),log:[["Pending",Date.now()]],zone,phone:s.phone.trim(),addr:zone==="pickup"?"Pickup at Kuril store":s.addr.trim()+", "+s.area.trim()+", "+(zone==="in"?"Dhaka":"Outside Dhaka"),pay,trx:trx.trim(),ship:+ship.toFixed(2)}]);setTrx("");updOvr(o=>{const e={...o.edits};items.forEach(({p,n})=>{e[p.id]={...e[p.id],stock:Math.max(0,p.stock-n)}});return{...o,edits:e}});setApplied(null);setCode("");setCart({});setDone(true)};
  const submit=e=>{e.preventDefault();const f=new FormData(e.target),n=f.get("name")||String(f.get("email")).split("@")[0];setAccts(a=>[...a,{email:String(f.get("email")).toLowerCase(),pw:String(f.get("password")),name:n}]);signIn(String(f.get("email")).toLowerCase(),n);setAuth(null);say("Welcome, "+n)};
  const bid=a=>{if(!user){say("Sign in to place a bid");return go("login")}setBids(b=>({...b,[a.id]:(b[a.id]||a.start)+5}));say("Bid placed on "+a.name)};
  const userLogin=(email,pw)=>{email=email.toLowerCase();const x=accts.find(v=>v.email===email&&v.pw===pw);if(x||(email==="user@user.com"&&pw==="12345678")){signIn(email,x?x.name:"user");go("shop");say("Welcome back");return null}return "Wrong email or password."};
  const adminLogin=(email,pw)=>{if(email.toLowerCase()==="admin@admin.com"&&pw==="12345678"){setIsAdmin(true);setPage("admin");window.scrollTo(0,0);return null}return "Wrong email or password."};
  const Card=({p})=>(<div className="card">
    <button className="thumb" style={{background:p.bg}} onClick={()=>setSel(p)} aria-label={"View "+p.name}>{p.image?<img className="product-image" src={p.image} alt={p.name} loading="lazy" />:<span className="product-emoji">{p.emoji}</span>}{p.featured&&<span className="featured-badge">Featured</span>}{p.was&&<span className="off">-{disc_(p)}%</span>}</button>
    <button className="heart" aria-label="Toggle wishlist" onClick={()=>tw(p.id)}>{wish.includes(p.id)?"♥":"♡"}</button>
    <div className="info"><h3>{p.name}</h3><span className="vend">{p.vendor} · ★ {p.rating}</span>
      <span className="price">{money(p.price)}{p.was&&<s>{money(p.was)}</s>}</span>
      <button className="add" disabled={!p.stock} onClick={()=>add(p)}>{p.stock?t("Add to cart"):t("Out of stock")}</button></div></div>);
  const Grid=({a})=><div className="grid">{a.map(p=><div key={p.id} style={{position:"relative"}}><Card p={p}/></div>)}</div>;
  const Acc=({id,label,children})=><><button className="mi" onClick={()=>setAcc(acc===id?"":id)}>{label} <span>{acc===id?"▴":"▾"}</span></button>{acc===id&&<div className="subm">{children}</div>}</>;
  const S=SLIDES[slide];
  if(page==="adminLogin")return <Login title="Sign in" sub="Welcome back to Admin Login" demo={["admin@admin.com","12345678"]} onSubmit={adminLogin} onBack={()=>go("shop")} backLabel="← Back to store"/>;
  if(page==="login")return <Login title="Sign in" sub="Welcome back to KenaKata" demo={["user@user.com","12345678"]} onSubmit={userLogin} onBack={()=>go("shop")} backLabel="← Back to store" alt={["New here? Create an account",()=>{go("shop");setAuth("up")}]}/>;
  if(page==="admin")return <Admin orders={orders} updateOrders={updateOrders} products={allProds} ovr={{...ovr,vend:vs}} updOvr={updOvr} coupons={coupons} updCoupons={updCoupons} cfg={cfg} updCfg={updCfg} dms={dms} updDms={updDms} vendors={VENDORS} onExit={()=>go("shop")} onLogout={()=>{setIsAdmin(false);go("shop")}} money={money}/>;
  return(<>
    <div className="top"><div className="wrap"><span>📞 {BD.phone} · 📍 {BD.short}</span>
      <span style={{display:"flex",gap:8}}><select aria-label="Currency" value={cur} onChange={e=>setCur(e.target.value)}>{Object.keys(CUR).map(c=><option key={c}>{c}</option>)}</select>
      <select aria-label="Language" value={lang} onChange={e=>{setLang(e.target.value);say(e.target.value==="Bangla"?"ভাষা: বাংলা":"Language set to "+e.target.value+(e.target.value==="English"?"":" (only Bangla labels are translated)"))}}>{["English","Arabic","Bangla","Hindi"].map(c=><option key={c}>{c}</option>)}</select></span></div></div>
    <header className="main"><div className="wrap"><div className="bar">
      <button className="ic" aria-label="Menu" onClick={()=>setOpen("menu")}>☰</button>
      <button className="logo" onClick={()=>{reset();go("shop")}}>KenaKata<i>.</i></button>
      <div className="search"><input aria-label="Search products" placeholder={t("Search products")} value={q} onChange={e=>{setQ(e.target.value);setPage("shop")}}/><button>{t("Search")}</button></div>
      <div style={{position:"relative"}}><button className="ic" aria-label="Account" onClick={()=>setUm(!um)}>{user?"👤 "+user:"👤"}</button>
        {um&&<div className="dd"><button onClick={()=>go("admin")}>Admin dashboard</button>{user?<><button onClick={()=>go("orders")}>My orders</button><button onClick={()=>{setUser(null);setUid(null);setUm(false);say("Signed out")}}>Sign out</button></>:<><button onClick={()=>{go("login");setUm(false)}}>Sign in</button><button onClick={()=>{setAuth("up");setUm(false)}}>Sign up</button></>}</div>}</div>
      <button className="ic" onClick={()=>setOpen("wish")}>♡{wish.length>0&&<b>{wish.length}</b>}</button>
      <button className="ic" aria-label="Cart" onClick={()=>{setDone(false);go("cart")}}>🛒 <span className="hm">{money(net)}</span>{count>0&&<b>{count}</b>}</button></div>
      <nav className="cats">{["All",...CATS].map(c=><button key={c} className={cat===c?"on":""} onClick={()=>pick(c)}>{t(c)}</button>)}</nav></div></header>
    <main className="wrap">
    {page==="shop"&&<>
      <div className="slider" style={{background:S[2]}}><h1>{S[0]}</h1><button className="cta" onClick={()=>S[3]==="all"?jump("all"):S[3]==="flash"?jump("flash"):say("Vendor sign-up is not part of this demo")}>{S[1]}</button>
        <div className="dots">{SLIDES.map((_,i)=><button key={i} aria-label={"Slide "+(i+1)} className={i===slide?"on":""} onClick={()=>setSlide(i)}/>)}</div></div>
      {cat==="All"&&!q&&!vend&&!deals&&<section id="flash" className="flash"><div className="sh"><div><h2>{t("Flash deals")}</h2><span style={{opacity:.8}}>Hurry up, the offer is limited.</span></div><Timer s={458*86400+13*3600+39*60}/></div>
        <Grid a={prods.filter(p=>p.was)}/></section>}
      {cat==="All"&&!q&&!vend&&!deals&&<section id="auc"><div className="sh"><h2>🔨 {t("Auction products")}</h2></div><div className="grid">{AUC.map(a=><div className="card" key={a.id}>
        <div className="thumb" style={{background:a.bg,cursor:"default"}}>{a.emoji}<span className="off" style={{background:"var(--acc2)"}}>Live</span></div>
        <div className="info"><h3>{a.name}</h3><Timer s={a.secs}/><span className="price">Current bid {money(bids[a.id]||a.start)}</span><span className="vend">{a.bids+(bids[a.id]?1:0)} bids</span>
        <button className="add" onClick={()=>bid(a)}>Place bid</button></div></div>)}</div></section>}
      <section id="all"><div className="sh"><h2>{deals?"Discounted products":cat==="All"?t("All products"):t(cat)} <small style={{color:"var(--mute)",fontWeight:400}}>({list.length})</small></h2>
        <div className="tools">{(vend||deals)&&<button className="ic" onClick={()=>{setVend("");setDeals(false)}}>Clear: {vend||"discounts"} ✕</button>}
        <select aria-label="Sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Latest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rate">Top rated</option></select></div></div>
        {list.length?<Grid a={list}/>:<p>No products match. Try a different word or clear the filters.</p>}</section>
      <section id="vendors"><div className="sh"><h2>{t("Top sellers")}</h2></div><div className="vendors">{VENDORS.map(v=><button className="card vbtn" key={v.n} onClick={()=>{reset();setVend(v.n);jump("all")}}><h3 style={{margin:0}}>{v.n}</h3><span className="vend">★ {v.r} · {v.p} products</span></button>)}</div></section></>}
    {page==="cart"&&<section className="cartpg"><h1 style={{textAlign:"center",fontFamily:"Georgia,serif"}}>{t("Shopping cart")}</h1>
      {done?<div className="box"><p>Order placed. Thank you, {user}! It is now in the processing queue.</p><button className="pay" onClick={()=>go("orders")}>Track my order</button><button className="link" onClick={()=>go("shop")}>Continue shopping</button></div>:<>
      <div className="box">{!items.length?<p style={{textAlign:"center"}}>🛍️<br/>Your cart is empty, and it looks like you haven’t added anything yet.</p>:items.map(({p,n})=><div className="row" key={p.id}><span className="e">{p.image?<img src={p.image} alt="" />:p.emoji}</span><div className="g"><b>{p.name}</b><div className="vend">{p.vendor} · {money(p.price)}</div></div>
        <div className="qty"><button aria-label="Decrease" onClick={()=>dec(p.id)}>−</button>{n}<button aria-label="Increase" onClick={()=>add(p)}>+</button></div><b>{money(p.price*n)}</b></div>)}</div>
      <div className="box"><b>{t("Delivery")}</b><div className="zones" role="radiogroup" aria-label="Delivery option">{[["in","Inside Dhaka","1–2 days · "+money(cfg.shipIn/RATE)],["out","Outside Dhaka","3–5 days · "+money(cfg.shipOut/RATE)],["pickup","Pickup: "+BD.short,"Free · ready in 24 hours"]].map(([k,l,e])=><label key={k} className={"opt"+(zone===k?" on":"")}><input type="radio" name="zone" checked={zone===k} onChange={()=>setZone(k)}/><span>{l}<small>{e}</small></span></label>)}</div>
        <div className="cf"><input aria-label="Receiver name" placeholder="Receiver name" autoComplete="name" value={ship_.name} onChange={e=>setShipInfo({...ship_,name:e.target.value})}/><input aria-label="Phone number" placeholder="Mobile (01XXXXXXXXX)" inputMode="tel" autoComplete="tel" value={ship_.phone} onChange={e=>setShipInfo({...ship_,phone:e.target.value})}/>
        {zone!=="pickup"&&<><input aria-label="Full address" placeholder="House, road, block" autoComplete="street-address" value={ship_.addr} onChange={e=>setShipInfo({...ship_,addr:e.target.value})}/><input aria-label="Area" placeholder="Area (e.g. Kuril)" value={ship_.area} onChange={e=>setShipInfo({...ship_,area:e.target.value})}/></>}</div></div>
      <div className="box"><b>{t("Payment")}</b><div className="zones">{[["cod","Cash on delivery"+(zone==="pickup"?" (pay at pickup)":"")],["bKash","bKash"],["Nagad","Nagad"]].map(([k,l])=><label key={k} className={"opt"+(pay===k?" on":"")}><input type="radio" name="pay" checked={pay===k} onChange={()=>setPay(k)}/><span>{l}</span></label>)}</div>
        {pay!=="cod"&&<><p className="vend">Demo only: send {money(grand)} to merchant number 01700-000000 on {pay}, then enter the transaction ID. No real payment is made.</p><input aria-label="Transaction ID" className="trx" placeholder="Transaction ID (TrxID)" value={trx} onChange={e=>setTrx(e.target.value)}/></>}</div>
      <div className="box"><b>{t("Coupon")}</b><div className="cpn"><input aria-label="Coupon code" placeholder="Enter code (try WELCOME10)" value={code} onChange={e=>setCode(e.target.value)}/><button className="ic" onClick={applyCoupon}>Apply</button></div>{applied&&<small>{applied.code}: {applied.pct}% off <button className="link" style={{display:"inline",margin:0}} onClick={()=>{setApplied(null);setCode("")}}>Remove</button></small>}</div>
      <label className="box"><b>Order note (optional)</b><textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Delivery instructions or a message for the seller"/></label>
      <div className="box sum">{[["Sub total",gross],["Shipping",ship],["Discount on product",-disc],...(cdisc?[["Coupon "+applied.code,-cdisc]]:[]),["Tax ("+cfg.tax+"%)",tax]].map(([l,v])=><div key={l}><span>{l}</span><span>{v<0?"- "+money(-v):money(v)}</span></div>)}<div className="tot"><span>Total</span><span>{money(grand)}</span></div>
        <div className="why"><b>Why shop with us</b><span>🚚 Fast delivery all across the country</span><span>💳 Safe payment</span><span>↩️ 7 days return policy</span><span>✅ 100% authentic products</span></div>
        {cerr&&<p role="alert" className="err">{cerr}</p>}<button className="pay" disabled={!items.length} onClick={checkout}>{t("Proceed to checkout")}</button><button className="link" onClick={()=>go("shop")}>‹ Continue shopping</button></div></>}
      <div className="info3"><button className="card" onClick={()=>go("about")}>🏢<br/>About us</button><button className="card" onClick={()=>go("contact")}>🎧<br/>Contact us</button><button className="card" onClick={()=>go("faq")}>❓<br/>FAQ</button></div></section>}
    {page==="about"&&<section className="box"><h1>About us</h1><p>KenaKata is a demo marketplace where many independent shops sell in one place. Each vendor manages its own products, while shoppers get one cart and one checkout.</p></section>}
    {page==="contact"&&<section className="box"><h1>Contact us</h1><p>📞 {BD.phone}<br/>✉️ hello@kenakata.example<br/>📍 {BD.full}<br/><a href={BD.map} target="_blank" rel="noreferrer">View on map ↗</a></p><button className="pay" onClick={()=>say("Support ticket created (demo)")}>Open a support ticket</button></section>}
    {page==="faq"&&<section className="box"><h1>FAQ</h1>{FAQ.map(([a,b],i)=><div key={a} className="faq"><button onClick={()=>setFaq(faq===i?-1:i)}>{a} <span>{faq===i?"−":"+"}</span></button>{faq===i&&<p>{b}</p>}</div>)}</section>}
    {page==="orders"&&<section className="cartpg"><h1 style={{textAlign:"center",fontFamily:"Georgia,serif"}}>My orders</h1>
      {!mine.length?<div className="box"><p style={{textAlign:"center"}}>No orders yet. Orders you place will appear here and move through the queue.</p></div>:mine.map(o=>{const si=STAGES.indexOf(o.status);return(
      <div className="box" key={o.id}><div className="adm-row"><b>{o.id}</b><span className={"st s"+(o.status==="Canceled"?"x":si)}>{o.status}</span></div>
        <div className="prog" role="img" aria-label={"Stage "+(si+1)+" of "+STAGES.length}>{STAGES.map((s,i)=><i key={s} title={s} className={o.status!=="Canceled"&&i<=si?"on":""}/>)}</div>
        <p className="vend" style={{margin:"8px 0"}}>{o.items.map(i=>i.n+"× "+i.name).join(", ")}</p>
        {o.addr&&<p className="vend" style={{margin:"0 0 8px"}}>📍 {o.addr} · 📞 {o.phone} · 💳 {o.pay==="cod"?"Cash on delivery":o.pay+" (TrxID "+o.trx+")"}</p>}
        <ol className="tl">{(o.log||[]).map(([s,at])=><li key={s+at}><b>{s}</b> <small>{new Date(at).toLocaleString()}</small></li>)}</ol>
        <div className="adm-row"><span>{new Date(o.at).toLocaleString()}</span><b>{money(o.total)}</b></div>
        {o.status==="Pending"&&<button className="ic" style={{marginTop:10}} onClick={()=>updateOrders(l=>l.map(x=>x.id===o.id&&x.status==="Pending"?{...x,status:"Canceled",log:[...(x.log||[]),["Canceled",Date.now()]]}:x))}>Cancel order</button>}</div>)})}</section>}
    </main>
    <footer className="foot"><div className="wrap">
      <div className="app"><b>Download our app</b><div><button className="badge" onClick={()=>say("App Store link goes here")}> App Store</button><button className="badge" onClick={()=>say("Google Play link goes here")}>▶ Google Play</button></div></div>
      <form className="news" onSubmit={e=>{e.preventDefault();say("Subscribed: "+email);setEmail("")}}><b>Newsletter</b><span>Get news on new arrivals and deals.</span><div><input required type="email" placeholder="Your email address" value={email} onChange={e=>setEmail(e.target.value)}/><button>Subscribe</button></div></form>
      <div className="fcols"><div><b>Quick links</b>{[["Flash deal","flash"],["Auctions","auc"],["All products","all"],["Top sellers","vendors"]].map(([l,id])=><button key={id} onClick={()=>jump(id)}>{l}</button>)}<button onClick={()=>go("orders")}>Track order</button></div>
        <div><b>Other</b><button onClick={()=>go("about")}>About us</button><button onClick={()=>go("faq")}>FAQ</button><button onClick={()=>go("admin")}>Admin dashboard</button><button onClick={()=>go("contact")}>Contact us</button><button onClick={()=>say("Policy pages are not part of this demo")}>Terms &amp; privacy</button><button onClick={()=>say("Policy pages are not part of this demo")}>Return policy</button></div></div>
      <div><b>Start a conversation</b><p>📞 {BD.phone}<br/>✉️ hello@kenakata.example<br/>📍 {BD.full}</p>
        <div className="soc">{["X","in","P","IG","f"].map(s=><button key={s} aria-label={s} onClick={()=>say("Social link goes here")}>{s}</button>)}</div></div>
      <p className="copy">© KenaKata — demo storefront.</p></div></footer>
    <div className="fab"><a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="wa">💬</a>
      <button aria-label="Auctions" onClick={()=>jump("auc")}>🔨</button>{up&&<button aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>▲</button>}</div>
    {open==="menu"&&<div className="veil" style={{justifyContent:"flex-start"}} onClick={()=>setOpen(null)}><div className="drawer menu" onClick={e=>e.stopPropagation()}>
      <button className="ic" style={{alignSelf:"flex-start"}} onClick={()=>setOpen(null)}>✕</button>
      <button className="mi" onClick={()=>{reset();go("shop")}}>Home</button>
      <Acc id="c" label="Categories">{CATS.map(c=><button key={c} onClick={()=>pick(c)}>{c}</button>)}</Acc>
      <Acc id="b" label="Brand">{VENDORS.map(v=><button key={v.n} onClick={()=>{reset();setVend(v.n);jump("all")}}>{v.n}</button>)}</Acc>
      <Acc id="o" label="Offers"><button onClick={()=>jump("flash")}>Flash deal</button><button onClick={()=>{reset();setDeals(true);jump("all")}}>Discounted products</button></Acc>
      <button className="mi" onClick={()=>pick("Books")}>Publication house</button>
      <button className="mi" onClick={()=>jump("vendors")}>All vendors</button>
      {!user&&<><button className="mi" onClick={()=>{setOpen(null);go("login")}}>Sign in</button><button className="mi" onClick={()=>{setOpen(null);setAuth("up")}}>Sign up</button></>}
      <Acc id="v" label="Vendor zone"><button onClick={()=>say("Vendor sign-up is not part of this demo")}>Become a vendor</button><button onClick={()=>say("Vendor login is not part of this demo")}>Vendor login</button></Acc>
      <button className="ic" style={{alignSelf:"flex-start",color:"var(--acc2)"}} onClick={()=>jump("auc")}>🔨 Auctions</button></div></div>}
    {open==="wish"&&<div className="veil" onClick={()=>setOpen(null)}><div className="drawer" onClick={e=>e.stopPropagation()}>
      <div className="sh"><h2>Wishlist</h2><button className="ic" onClick={()=>setOpen(null)}>Close</button></div>
      {!wish.length?<p>Tap the heart on any product to save it here.</p>:wish.filter(byId).map(id=><div className="row" key={id}><span className="e">{byId(id).image?<img src={byId(id).image} alt="" />:byId(id).emoji}</span><div className="g"><b>{byId(id).name}</b><div className="vend">{money(byId(id).price)}</div></div><button className="add" style={{padding:"6px 10px"}} onClick={()=>add(byId(id))}>Add</button></div>)}</div></div>}
    {auth&&<div className="veil" style={{justifyContent:"center"}} onClick={()=>setAuth(null)}><form className="modal authf" onClick={e=>e.stopPropagation()} onSubmit={submit}>
      <h2 style={{margin:0}}>{auth==="in"?"Sign in":"Create account"}</h2>{auth==="up"&&<input name="name" required placeholder="Full name"/>}
      <input name="email" type="email" required placeholder="Email"/><input name="password" type="password" required minLength="6" placeholder="Password (6+ characters)"/>
      <button className="pay">{auth==="in"?"Sign in":"Sign up"}</button><button type="button" className="link" onClick={()=>{setAuth(null);go("login")}}>Have an account? Sign in</button>
      <span className="vend">Demo only: nothing is sent or stored.</span></form></div>}
    {sel&&<div className="veil" style={{justifyContent:"center"}} onClick={()=>setSel(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="big" style={{background:sel.bg}}>{sel.image?<img className="modal-product-image" src={sel.image} alt={sel.name}/>:sel.emoji}</div>
      <div className="body"><h2 style={{margin:0,fontFamily:"Georgia,serif"}}>{sel.name}</h2><span className="vend">Sold by {sel.vendor} · {sel.cat} · ★ {sel.rating}</span>
        <div className="price" style={{fontSize:22}}>{money(sel.price)}{sel.was&&<s>{money(sel.was)}</s>}</div>
        <p style={{color:"var(--mute)",margin:0}}>{sel.description||"Quality product from a verified KenaKata seller."}</p><p style={{color:"var(--mute)",margin:0}}>{sel.stock?"In stock and ships in 2 business days.":"Currently out of stock."}</p>
        <button className="add" disabled={!sel.stock} onClick={()=>add(sel)}>Add to cart</button>
        <button className="ic" onClick={()=>tw(sel.id)}>{wish.includes(sel.id)?"Remove from wishlist":"Save to wishlist"}</button>
        <button className="ic" onClick={()=>setSel(null)}>Close</button></div></div></div>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </>);
}
const disc_=p=>Math.round((1-p.price/p.was)*100);
export default App;
