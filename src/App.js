import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hfpdjigulkizcqqwhywf.supabase.co";
const SUPABASE_KEY = "sb_publishable_y30iP1QQhaYpgRb2g2WRhA_wpNLjHJP";
const TABLE = "inventario_camaras";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const api = {
  async getAll() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?order=id.asc`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, { method: "POST", headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, { method: "DELETE", headers });
    if (!r.ok) throw new Error(await r.text());
  },
};

const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const pct = (cost, price) => price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
const mc = (m) => { const v = parseFloat(m); return v >= 35 ? "#4ade80" : v >= 20 ? "#fbbf24" : "#f87171"; };
const ml = (m) => { const v = parseFloat(m); return v >= 35 ? "Excelente" : v >= 20 ? "Aceptable" : "Bajo"; };

// ─── Gráfica de historial de precios ─────────────────────────────────────────
const PriceChart = ({ historial }) => {
  if (!historial || historial.length < 2) return null;

  const costos = historial.map((h) => h.costo);
  const minVal = Math.min(...costos);
  const maxVal = Math.max(...costos);
  const promedio = Math.round(costos.reduce((a, b) => a + b, 0) / costos.length);
  const actual = costos[costos.length - 1];
  const diferencia = actual - minVal;
  const pctDif = minVal > 0 ? ((diferencia / minVal) * 100).toFixed(1) : 0;

  const W = 320, H = 120, PAD = 12;
  const range = maxVal - minVal || 1;

  const points = historial.map((h, i) => {
    const x = PAD + (i / (historial.length - 1)) * (W - PAD * 2);
    const y = PAD + ((maxVal - h.costo) / range) * (H - PAD * 2);
    return { x, y, ...h };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const minIdx = costos.indexOf(minVal);
  const maxIdx = costos.indexOf(maxVal);

  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>Historial de precios de costo</div>

      {/* Indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          ["Mínimo", fmt(minVal), historial[minIdx]?.fecha, "#4ade80"],
          ["Promedio", fmt(promedio), "", "#fbbf24"],
          ["Máximo", fmt(maxVal), historial[maxIdx]?.fecha, "#f87171"],
        ].map(([l, v, f, c]) => (
          <div key={l} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px", borderTop: `2px solid ${c}` }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div>
            {f && <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{f}</div>}
          </div>
        ))}
      </div>

      {/* Alerta si precio actual no es el mínimo */}
      {diferencia > 0 && (
        <div style={{ background: "#3f2a0a", border: "1px solid #fbbf2444", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#fbbf24" }}>
          ⚠️ Estás comprando {fmt(diferencia)} ({pctDif}%) más caro que tu mínimo histórico
        </div>
      )}
      {diferencia === 0 && historial.length > 1 && (
        <div style={{ background: "#0a2a1a", border: "1px solid #4ade8044", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#4ade80" }}>
          ✓ Estás comprando al precio más bajo de tu historial
        </div>
      )}

      {/* Gráfica SVG */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Área bajo la curva */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Línea de promedio */}
        {range > 0 && (
          <line
            x1={PAD} x2={W - PAD}
            y1={PAD + ((maxVal - promedio) / range) * (H - PAD * 2)}
            y2={PAD + ((maxVal - promedio) / range) * (H - PAD * 2)}
            stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5"
          />
        )}

        {/* Línea principal */}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos */}
        {points.map((p, i) => {
          const isMin = p.costo === minVal;
          const isMax = p.costo === maxVal;
          const isLast = i === points.length - 1;
          const color = isMin ? "#4ade80" : isMax ? "#f87171" : isLast ? "#38bdf8" : "#64748b";
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={isMin || isMax || isLast ? 5 : 3} fill={color} stroke="#070d1a" strokeWidth="1.5" />
              {(isMin || isMax || isLast) && (
                <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="8" fill={color} fontFamily="monospace">
                  {fmt(p.costo).replace("$", "").replace(".000", "k")}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Fechas eje X */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[0]?.fecha}</span>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[historial.length - 1]?.fecha}</span>
      </div>
    </div>
  );
};

const Tag = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, fontSize: 11, padding: "2px 7px", fontWeight: 700 }}>{label}</span>
);

const Inp = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder || ""}
      style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, outline: "none", color: "#f1f5f9", padding: "10px 12px", fontSize: 14, width: "100%", fontFamily: "inherit", boxSizing: "border-box" }} />
  </div>
);

const Btn = ({ children, onClick, bg = "#1e293b", color = "#f1f5f9", style = {} }) => (
  <button onClick={onClick} style={{ background: bg, color, border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", ...style }}>{children}</button>
);

const ROOT = { minHeight: "100vh", background: "#070d1a", color: "#f1f5f9", fontFamily: "'DM Mono','Courier New',monospace", maxWidth: 480, margin: "0 auto", paddingBottom: 80 };
const HDR = { padding: "18px 16px 12px", borderBottom: "1px solid #1e293b", background: "#070d1a", position: "sticky", top: 0, zIndex: 10 };
const CARD = { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10 };

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [sortBy, setSortBy] = useState("margin_asc");
  const [form, setForm] = useState({ nombre: "", categoria: "Cámaras", costo: "", precio_venta: "", stock: "", nota: "" });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const load = async () => {
    try { setLoading(true); setProducts(await api.getAll()); }
    catch { showToast("Error cargando datos", "err"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ nombre: "", categoria: "Cámaras", costo: "", precio_venta: "", stock: "", nota: "" });

  const saveProduct = async () => {
    if (!form.nombre || !form.costo || !form.precio_venta || !form.stock) { showToast("Completa todos los campos", "err"); return; }
    const costo = parseInt(form.costo), precio_venta = parseInt(form.precio_venta), stock = parseInt(form.stock);
    setSaving(true);
    try {
      if (view === "add") {
        await api.insert({ nombre: form.nombre, categoria: form.categoria, costo, precio_venta, stock, nota: form.nota, historial_costos: [{ fecha: new Date().toISOString().slice(0, 10), costo }] });
        showToast("Producto agregado ✓");
      } else {
        const historial = costo !== selected.costo
          ? [...(selected.historial_costos || []), { fecha: new Date().toISOString().slice(0, 10), costo }]
          : selected.historial_costos;
        await api.update(selected.id, { nombre: form.nombre, categoria: form.categoria, costo, precio_venta, stock, nota: form.nota, historial_costos: historial });
        showToast("Guardado ✓");
      }
      await load(); resetForm(); setView("list");
    } catch { showToast("Error guardando", "err"); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    try { await api.remove(id); await load(); setView("list"); showToast("Eliminado"); }
    catch { showToast("Error eliminando", "err"); }
  };

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.categoria)))];
  const filtered = products
    .filter((p) => filterCat === "Todos" || p.categoria === filterCat)
    .filter((p) => p.nombre?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mA = parseFloat(pct(a.costo, a.precio_venta)), mB = parseFloat(pct(b.costo, b.precio_venta));
      if (sortBy === "margin_asc") return mA - mB;
      if (sortBy === "margin_desc") return mB - mA;
      if (sortBy === "profit") return (b.precio_venta - b.costo) * b.stock - (a.precio_venta - a.costo) * a.stock;
      return a.nombre?.localeCompare(b.nombre);
    });

  const alerts = products.filter((p) => parseFloat(pct(p.costo, p.precio_venta)) < 20);
  const totalInvested = products.reduce((s, p) => s + (p.costo || 0) * (p.stock || 0), 0);
  const totalProfit = products.reduce((s, p) => s + ((p.precio_venta || 0) - (p.costo || 0)) * (p.stock || 0), 0);
  const totalRevenue = totalInvested + totalProfit;

  // ── Detail ────────────────────────────────────────────────────────────────────
  if (view === "detail" && selected) {
    const p = products.find((x) => x.id === selected.id) || selected;
    const margin = pct(p.costo, p.precio_venta);
    const color = mc(margin);
    const ganancia = (p.precio_venta || 0) - (p.costo || 0);
    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => setView("list")} style={{ marginBottom: 8, padding: "7px 14px" }}>← Volver</Btn>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#38bdf8" }}>{p.nombre}</div>
          <div style={{ marginTop: 5 }}><Tag label={p.categoria} color="#38bdf8" /></div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ ...CARD, borderColor: color + "66" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Costo actual", fmt(p.costo), "#94a3b8"], ["Precio venta", fmt(p.precio_venta), "#f1f5f9"], ["Ganancia unit.", fmt(ganancia), "#4ade80"], ["Stock", `${p.stock} uds`, "#38bdf8"]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 10, color: "#475569", marginBottom: 3, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 17, fontWeight: 800, color: c }}>{v}</div></div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Margen</span>
                <span style={{ fontSize: 22, fontWeight: 900, color }}>{margin}%</span>
              </div>
              <div style={{ height: 6, background: "#1e293b", borderRadius: 3, marginTop: 8 }}>
                <div style={{ height: "100%", width: `${Math.min(parseFloat(margin), 100)}%`, background: color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color, marginTop: 4, textAlign: "right" }}>{ml(margin)}</div>
            </div>
          </div>

          <div style={CARD}>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>Ganancia potencial total</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>{fmt(ganancia * (p.stock || 0))}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>si vendes las {p.stock} unidades</div>
          </div>

          {/* Gráfica de historial */}
          <PriceChart historial={p.historial_costos} />

          {p.nota && <div style={{ ...CARD, borderColor: "#fbbf2444" }}><div style={{ fontSize: 10, color: "#fbbf24", marginBottom: 4 }}>NOTA</div><div style={{ fontSize: 13, color: "#cbd5e1" }}>{p.nota}</div></div>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn bg="#1e3a5f" color="#38bdf8" onClick={() => { setForm({ nombre: p.nombre, categoria: p.categoria, costo: p.costo, precio_venta: p.precio_venta, stock: p.stock, nota: p.nota || "" }); setSelected(p); setView("edit"); }} style={{ flex: 1 }}>✏️ Editar</Btn>
            <Btn bg="#3f0f0f" color="#f87171" onClick={() => { if (window.confirm("¿Eliminar este producto?")) deleteProduct(p.id); }} style={{ flex: 1 }}>🗑 Eliminar</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  if (view === "add" || view === "edit") {
    const gP = parseInt(form.precio_venta || 0) - parseInt(form.costo || 0);
    const mP = pct(form.costo || 0, form.precio_venta || 0);
    const cP = mc(mP);
    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => setView("list")} style={{ marginBottom: 8, padding: "7px 14px" }}>← Cancelar</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>{view === "add" ? "Nuevo producto" : "Editar producto"}</div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Insta360 X4" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Categoría</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {["Cámaras", "Accesorios", "Lentes", "Baterías", "Monturas", "Memoria", "Otro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Costo (COP)" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} placeholder="950000" />
            <Inp label="Precio venta (COP)" type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} placeholder="1280000" />
          </div>
          {form.costo && form.precio_venta && (
            <div style={{ background: "#0f172a", border: `1px solid ${cP}44`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: "#475569" }}>GANANCIA UNIT.</div><div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{fmt(gP)}</div></div>
                <div><div style={{ fontSize: 10, color: "#475569" }}>MARGEN</div><div style={{ fontSize: 20, fontWeight: 900, color: cP }}>{mP}%</div></div>
              </div>
            </div>
          )}
          <Inp label="Stock (unidades)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" />
          <Inp label="Nota (opcional)" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Observaciones..." />
          <Btn onClick={saveProduct} bg="#0ea5e9" style={{ padding: 14, fontSize: 15, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : view === "add" ? "Agregar producto" : "Guardar cambios"}
          </Btn>
        </div>
      </div>
    );
  }

  // ── Lista ─────────────────────────────────────────────────────────────────────
  return (
    <div style={ROOT}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "err" ? "#7f1d1d" : "#064e3b", color: toast.type === "err" ? "#f87171" : "#4ade80", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 100, whiteSpace: "nowrap" }}>{toast.msg}</div>
      )}
      <div style={HDR}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>📷 CamTracker</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Inventario · Rentabilidad · Alertas</div>
          </div>
          <Btn onClick={() => { resetForm(); setView("add"); }} bg="#0ea5e9" style={{ fontSize: 20, padding: "8px 14px" }}>+</Btn>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div>Cargando desde Supabase...</div>
          </div>
        ) : (
          <>
            <div style={{ ...CARD, background: "linear-gradient(135deg,#0c1f3a,#0f172a)", borderColor: "#1e3a5f" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 10, textTransform: "uppercase" }}>Resumen · {products.length} productos</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["Invertido", fmt(totalInvested), "#94a3b8"], ["Potencial", fmt(totalRevenue), "#38bdf8"], ["Ganancia", fmt(totalProfit), "#4ade80"]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: c, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {alerts.length > 0 && (
              <div style={{ ...CARD, borderColor: "#f87171aa", background: "#3f0f0f22" }}>
                <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700, marginBottom: 6 }}>⚠️ Margen bajo (&lt;20%)</div>
                {alerts.map((p) => <div key={p.id} style={{ fontSize: 12, color: "#fca5a5", padding: "2px 0" }}>· {p.nombre} — {pct(p.costo, p.precio_venta)}%</div>)}
              </div>
            )}

            <input type="search" placeholder="🔍 Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
              {categories.map((c) => (
                <button key={c} onClick={() => setFilterCat(c)}
                  style={{ background: filterCat === c ? "#0ea5e9" : "#1e293b", color: filterCat === c ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>{c}</button>
              ))}
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#94a3b8", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 14 }}>
              <option value="margin_asc">↑ Margen más bajo primero</option>
              <option value="margin_desc">↓ Margen más alto primero</option>
              <option value="profit">💰 Mayor ganancia potencial</option>
              <option value="name">A-Z Nombre</option>
            </select>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
                <div style={{ fontSize: 32 }}>📦</div>
                <div style={{ marginTop: 8 }}>Sin productos. ¡Agrega el primero!</div>
              </div>
            ) : filtered.map((p) => {
              const margin = pct(p.costo, p.precio_venta);
              const color = mc(margin);
              const ganancia = (p.precio_venta || 0) - (p.costo || 0);
              const costos = p.historial_costos?.map((h) => h.costo) || [];
              const minCosto = costos.length > 1 ? Math.min(...costos) : null;
              const esMasCaro = minCosto && p.costo > minCosto;
              return (
                <div key={p.id} onClick={() => { setSelected(p); setView("detail"); }}
                  style={{ ...CARD, cursor: "pointer", borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{p.nombre}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Tag label={p.categoria} color="#38bdf8" />
                        {esMasCaro && <Tag label={`+${(((p.costo - minCosto) / minCosto) * 100).toFixed(0)}% vs mín`} color="#f87171" />}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color }}>{margin}%</div>
                      <div style={{ fontSize: 10, color }}>{ml(margin)}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                    {[["Costo", fmt(p.costo), "#94a3b8"], ["Venta", fmt(p.precio_venta), "#f1f5f9"], ["Ganancia", fmt(ganancia), "#4ade80"], ["Stock", `${p.stock}u`, "#38bdf8"]].map(([l, v, c]) => (
                      <div key={l}><div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
