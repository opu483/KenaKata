import { useState } from "react";

export default function Login({ title, sub, demo, onSubmit, onBack, backLabel, alt }) {
  const key = "rm:" + demo[0];
  const saved = (() => { try { return localStorage.getItem(key) || ""; } catch { return ""; } })();
  const [email, setEmail] = useState(saved), [pw, setPw] = useState(""), [show, setShow] = useState(false), [rm, setRm] = useState(!!saved), [err, setErr] = useState("");
  const submit = e => {
    e.preventDefault();
    const r = onSubmit(email.trim(), pw);
    if (r) return setErr(r);
    try { rm ? localStorage.setItem(key, email.trim()) : localStorage.removeItem(key); } catch {}
  };
  return (
    <div className="login">
      <button className="link" style={{ margin: 0, textAlign: "left" }} onClick={onBack}>{backLabel}</button>
      <h1>{title}</h1>
      <h2>{sub}</h2>
      <form onSubmit={submit}>
        <label>Your email
          <input type="email" required autoComplete="username" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
        </label>
        <label>Password
          <span className="pw">
            <input type={show ? "text" : "password"} required minLength="6" autoComplete="current-password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? "🙈" : "👁"}</button>
          </span>
        </label>
        <label className="rm"><input type="checkbox" checked={rm} onChange={e => setRm(e.target.checked)} /> Remember me</label>
        {err && <p role="alert" className="err">{err}</p>}
        <button className="pay">Sign in</button>
      </form>
      {alt && <button className="link" onClick={alt[1]}>{alt[0]}</button>}
      <div className="demo">
        <div><div>Email : <u>{demo[0]}</u></div><div>Password : {demo[1]}</div><small>Demo credentials only</small></div>
        <button aria-label="Fill demo credentials" title="Fill demo credentials" onClick={() => { setEmail(demo[0]); setPw(demo[1]); setErr(""); }}>⧉</button>
      </div>
    </div>
  );
}
