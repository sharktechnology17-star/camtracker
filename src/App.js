import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hfpdjigulkizcqqwhywf.supabase.co";
const SUPABASE_KEY = "sb_publishable_y30iP1QQhaYpgRb2g2WRhA_wpNLjHJP";

const h = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const db = {
  async get(table, qs = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: h });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: h, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(table, id, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: h, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: h });
    if (!r.ok) throw new Error(await r.text());
  },
};

const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const pct = (cost, price) => price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
const mc = (m) => { const v = parseFloat(m); return v >= 35 ? "#4ade80" : v >= 20 ? "#fbbf24" : "#f87171"; };
const ml = (m) => { const v = parseFloat(m); return v >= 35 ? "Excelente" : v >= 20 ? "Aceptable" : "Bajo"; };
const today = () => new Date().toISOString().slice(0, 10);

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

// ─── Gráfica historial costos ─────────────────────────────────────────────────
const PriceChart = ({ historial }) => {
  if (!historial || historial.length < 2) return null;
  const costos = historial.map((h) => h.costo);
  const minVal = Math.min(...costos), maxVal = Math.max(...costos);
  const promedio = Math.round(costos.reduce((a, b) => a + b, 0) / costos.length);
  const actual = costos[costos.length - 1];
  const diferencia = actual - minVal;
  const pctDif = minVal > 0 ? ((diferencia / minVal) * 100).toFixed(1) : 0;
  const W = 320, H = 110, PAD = 12, range = maxVal - minVal || 1;
  const points = historial.map((h, i) => ({
    x: PAD + (i / (historial.length - 1)) * (W - PAD * 2),
    y: PAD + ((maxVal - h.costo) / range) * (H - PAD * 2), ...h,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;
  const minIdx = costos.indexOf(minVal), maxIdx = costos.indexOf(maxVal);
  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>Historial de costos</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["Mínimo", fmt(minVal), historial[minIdx]?.fecha, "#4ade80"], ["Promedio", fmt(promedio), "", "#fbbf24"], ["Máximo", fmt(maxVal), historial[maxIdx]?.fecha, "#f87171"]].map(([l, v, f, c]) => (
          <div key={l} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px", borderTop: `2px solid ${c}` }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
            {f && <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{f}</div>}
          </div>
        ))}
      </div>
      {diferencia > 0 && <div style={{ background: "#3f2a0a", border: "1px solid #fbbf2444", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#fbbf24" }}>⚠️ Comprando {fmt(diferencia)} ({pctDif}%) más caro que tu mínimo</div>}
      {diferencia === 0 && historial.length > 1 && <div style={{ background: "#0a2a1a", border: "1px solid #4ade8044", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#4ade80" }}>✓ Estás al precio más bajo de tu historial</div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0" /></linearGradient></defs>
        <path d={areaD} fill="url(#ag)" />
        {range > 0 && <line x1={PAD} x2={W - PAD} y1={PAD + ((maxVal - promedio) / range) * (H - PAD * 2)} y2={PAD + ((maxVal - promedio) / range) * (H - PAD * 2)} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const isMin = p.costo === minVal, isMax = p.costo === maxVal, isLast = i === points.length - 1;
          const c = isMin ? "#4ade80" : isMax ? "#f87171" : isLast ? "#38bdf8" : "#64748b";
          return <g key={i}><circle cx={p.x} cy={p.y} r={isMin || isMax || isLast ? 5 : 3} fill={c} stroke="#070d1a" strokeWidth="1.5" />{(isMin || isMax || isLast) && <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="8" fill={c} fontFamily="monospace">{fmt(p.costo).replace("$\u00a0", "").replace(".000", "k")}</text>}</g>;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[0]?.fecha}</span>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[historial.length - 1]?.fecha}</span>
      </div>
    </div>
  );
};

// ─── App principal ────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list"); // list | add | edit | detail | venta | ventas_list | dashboard
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [sortBy, setSortBy] = useState("margin_asc");
  const [tab, setTab] = useState("inventario"); // inventario | ventas | dashboard
  const [toast, setToast] = useState(null);

  const [formP, setFormP] = useState({ nombre: "", categoria: "Cámaras", costo: "", precio_venta: "", stock: "", nota: "" });
  const [formV, setFormV] = useState({ precio_venta: "", cantidad: "1", cliente_nombre: "", cliente_telefono: "", nota: "", fecha: today() });

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [p, v] = await Promise.all([
        db.get("inventario_camaras", "order=id.asc"),
        db.get("ventas", "order=fecha.desc"),
      ]);
      setProducts(p || []); setVentas(v || []);
    } catch { showToast("Error cargando datos", "err"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const resetFormP = () => setFormP({ nombre: "", categoria: "Cámaras", costo: "", precio_venta: "", stock: "", nota: "" });
  const resetFormV = () => setFormV({ precio_venta: "", cantidad: "1", cliente_nombre: "", cliente_telefono: "", nota: "", fecha: today() });

  // Guardar producto
  const saveProduct = async () => {
    if (!formP.nombre || !formP.costo || !formP.precio_venta || !formP.stock) { showToast("Completa todos los campos", "err"); return; }
    const costo = parseInt(formP.costo), precio_venta = parseInt(formP.precio_venta), stock = parseInt(formP.stock);
    setSaving(true);
    try {
      if (view === "add") {
        await db.post("inventario_camaras", { nombre: formP.nombre, categoria: formP.categoria, costo, precio_venta, stock, nota: formP.nota, historial_costos: [{ fecha: today(), costo }] });
        showToast("Producto agregado ✓");
      } else {
        const historial = costo !== selected.costo ? [...(selected.historial_costos || []), { fecha: today(), costo }] : selected.historial_costos;
        await db.patch("inventario_camaras", selected.id, { nombre: formP.nombre, categoria: formP.categoria, costo, precio_venta, stock, nota: formP.nota, historial_costos: historial });
        showToast("Guardado ✓");
      }
      await loadAll(); resetFormP(); setView("list");
    } catch { showToast("Error guardando", "err"); }
    finally { setSaving(false); }
  };

  // Registrar venta
  const saveVenta = async () => {
    if (!formV.precio_venta || !formV.cantidad) { showToast("Completa precio y cantidad", "err"); return; }
    const p = selected;
    const precio = parseInt(formV.precio_venta);
    const cantidad = parseInt(formV.cantidad);
    const ganancia_total = (precio - p.costo) * cantidad;
    const descuento = (p.precio_venta - precio) * cantidad;
    setSaving(true);
    try {
      await db.post("ventas", {
        producto_id: p.id, producto_nombre: p.nombre,
        costo_unitario: p.costo, precio_venta: precio,
        precio_lista: p.precio_venta, cantidad,
        ganancia_total, descuento,
        cliente_nombre: formV.cliente_nombre || null,
        cliente_telefono: formV.cliente_telefono || null,
        nota: formV.nota || null, fecha: formV.fecha,
      });
      // Descontar stock
      await db.patch("inventario_camaras", p.id, { stock: Math.max(0, (p.stock || 0) - cantidad) });
      showToast("Venta registrada ✓");
      await loadAll(); resetFormV(); setView("detail");
    } catch { showToast("Error registrando venta", "err"); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    try { await db.del("inventario_camaras", id); await loadAll(); setView("list"); showToast("Eliminado"); }
    catch { showToast("Error eliminando", "err"); }
  };

  // Stats ventas
  const ventasDelMes = ventas.filter((v) => v.fecha?.startsWith(new Date().toISOString().slice(0, 7)));
  const gananciaRealMes = ventasDelMes.reduce((s, v) => s + (v.ganancia_total || 0), 0);
  const totalVendidoMes = ventasDelMes.reduce((s, v) => s + v.precio_venta * v.cantidad, 0);
  const descuentosMes = ventasDelMes.reduce((s, v) => s + (v.descuento || 0), 0);

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

  const totalInvested = products.reduce((s, p) => s + (p.costo || 0) * (p.stock || 0), 0);
  const totalProfit = products.reduce((s, p) => s + ((p.precio_venta || 0) - (p.costo || 0)) * (p.stock || 0), 0);

  // ── VISTA: Registrar venta ────────────────────────────────────────────────────
  if (view === "venta" && selected) {
    const p = selected;
    const precioIngresado = parseInt(formV.precio_venta || 0);
    const cantidad = parseInt(formV.cantidad || 1);
    const ganancia = (precioIngresado - p.costo) * cantidad;
    const descuento = (p.precio_venta - precioIngresado) * cantidad;
    const margenReal = pct(p.costo, precioIngresado);
    const colorM = mc(margenReal);
    const precioMinimo = Math.ceil(p.costo / (1 - 0.15)); // mínimo 15% margen
    const bajoPrecioMin = precioIngresado > 0 && precioIngresado < precioMinimo;

    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => { resetFormV(); setView("detail"); }} style={{ marginBottom: 8, padding: "7px 14px" }}>← Cancelar</Btn>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#4ade80" }}>💰 Registrar venta</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{p.nombre}</div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Info precio mínimo */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Precio lista</div><div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{fmt(p.precio_venta)}</div></div>
              <div><div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Mínimo (15% margen)</div><div style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{fmt(precioMinimo)}</div></div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Precio vendido (COP)" type="number" value={formV.precio_venta} onChange={(e) => setFormV({ ...formV, precio_venta: e.target.value })} placeholder={p.precio_venta} />
            <Inp label="Cantidad" type="number" value={formV.cantidad} onChange={(e) => setFormV({ ...formV, cantidad: e.target.value })} placeholder="1" />
          </div>

          {/* Preview en tiempo real */}
          {formV.precio_venta && (
            <div style={{ background: "#0a1628", border: `1px solid ${bajoPrecioMin ? "#f87171" : colorM}44`, borderRadius: 10, padding: 14 }}>
              {bajoPrecioMin && (
                <div style={{ background: "#3f0f0f", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#f87171" }}>
                  🚨 Por debajo del precio mínimo recomendado ({fmt(precioMinimo)})
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: descuento > 0 ? 10 : 0 }}>
                <div><div style={{ fontSize: 9, color: "#475569" }}>GANANCIA REAL</div><div style={{ fontSize: 18, fontWeight: 900, color: ganancia >= 0 ? "#4ade80" : "#f87171" }}>{fmt(ganancia)}</div></div>
                <div><div style={{ fontSize: 9, color: "#475569" }}>MARGEN REAL</div><div style={{ fontSize: 18, fontWeight: 900, color: colorM }}>{margenReal}%</div></div>
              </div>
              {descuento > 0 && (
                <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10 }}>
                  <div style={{ fontSize: 9, color: "#475569" }}>DESCUENTO APLICADO</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>-{fmt(descuento)} vs precio lista</div>
                </div>
              )}
            </div>
          )}

          <Inp label="Nombre cliente (opcional)" value={formV.cliente_nombre} onChange={(e) => setFormV({ ...formV, cliente_nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
          <Inp label="Teléfono cliente (opcional)" type="tel" value={formV.cliente_telefono} onChange={(e) => setFormV({ ...formV, cliente_telefono: e.target.value })} placeholder="Ej: 3001234567" />
          <Inp label="Fecha" type="date" value={formV.fecha} onChange={(e) => setFormV({ ...formV, fecha: e.target.value })} />
          <Inp label="Nota (opcional)" value={formV.nota} onChange={(e) => setFormV({ ...formV, nota: e.target.value })} placeholder="Observaciones..." />

          <Btn onClick={saveVenta} bg="#4ade80" color="#052e16" style={{ padding: 14, fontSize: 15, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : "Registrar venta"}
          </Btn>
        </div>
      </div>
    );
  }

  // ── VISTA: Detalle producto ───────────────────────────────────────────────────
  if (view === "detail" && selected) {
    const p = products.find((x) => x.id === selected.id) || selected;
    const margin = pct(p.costo, p.precio_venta);
    const color = mc(margin);
    const ganancia = (p.precio_venta || 0) - (p.costo || 0);
    const ventasProducto = ventas.filter((v) => v.producto_id === p.id);
    const precioMinimo = Math.ceil(p.costo / (1 - 0.15));

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
              {[["Costo actual", fmt(p.costo), "#94a3b8"], ["Precio lista", fmt(p.precio_venta), "#f1f5f9"], ["Ganancia unit.", fmt(ganancia), "#4ade80"], ["Stock", `${p.stock} uds`, "#38bdf8"]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 10, color: "#475569", marginBottom: 3, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 17, fontWeight: 800, color: c }}>{v}</div></div>
              ))}
            </div>
            <div style={{ background: "#0a1628", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Precio mínimo de venta (15% margen)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>{fmt(precioMinimo)}</div>
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

          <Btn onClick={() => { setSelected(p); resetFormV(); setFormV(f => ({ ...f, precio_venta: p.precio_venta.toString() })); setView("venta"); }} bg="#4ade80" color="#052e16" style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 10 }}>
            💰 Registrar venta
          </Btn>

          <PriceChart historial={p.historial_costos} />

          {/* Historial ventas del producto */}
          {ventasProducto.length > 0 && (
            <div style={{ ...CARD }}>
              <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Ventas de este producto ({ventasProducto.length})</div>
              {ventasProducto.slice(0, 5).map((v, i) => {
                const margenV = pct(v.costo_unitario, v.precio_venta);
                const colorV = mc(margenV);
                return (
                  <div key={i} style={{ borderBottom: i < ventasProducto.slice(0, 5).length - 1 ? "1px solid #1e293b" : "none", paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{fmt(v.precio_venta)} × {v.cantidad}</div>
                        {v.cliente_nombre && <div style={{ fontSize: 11, color: "#94a3b8" }}>👤 {v.cliente_nombre} {v.cliente_telefono && `· ${v.cliente_telefono}`}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{fmt(v.ganancia_total)}</div>
                        <div style={{ fontSize: 10, color: colorV }}>{margenV}%</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#475569" }}>{v.fecha}</span>
                      {v.descuento > 0 && <span style={{ fontSize: 10, color: "#f87171" }}>-{fmt(v.descuento)} descuento</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {p.nota && <div style={{ ...CARD, borderColor: "#fbbf2444" }}><div style={{ fontSize: 10, color: "#fbbf24", marginBottom: 4 }}>NOTA</div><div style={{ fontSize: 13, color: "#cbd5e1" }}>{p.nota}</div></div>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn bg="#1e3a5f" color="#38bdf8" onClick={() => { setFormP({ nombre: p.nombre, categoria: p.categoria, costo: p.costo, precio_venta: p.precio_venta, stock: p.stock, nota: p.nota || "" }); setSelected(p); setView("edit"); }} style={{ flex: 1 }}>✏️ Editar</Btn>
            <Btn bg="#3f0f0f" color="#f87171" onClick={() => { if (window.confirm("¿Eliminar?")) deleteProduct(p.id); }} style={{ flex: 1 }}>🗑 Eliminar</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA: Formulario producto ────────────────────────────────────────────────
  if (view === "add" || view === "edit") {
    const gP = parseInt(formP.precio_venta || 0) - parseInt(formP.costo || 0);
    const mP = pct(formP.costo || 0, formP.precio_venta || 0);
    const cP = mc(mP);
    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => setView("list")} style={{ marginBottom: 8, padding: "7px 14px" }}>← Cancelar</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>{view === "add" ? "Nuevo producto" : "Editar producto"}</div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nombre" value={formP.nombre} onChange={(e) => setFormP({ ...formP, nombre: e.target.value })} placeholder="Ej: Insta360 X4" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Categoría</label>
            <select value={formP.categoria} onChange={(e) => setFormP({ ...formP, categoria: e.target.value })}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {["Cámaras", "Accesorios", "Lentes", "Baterías", "Monturas", "Memoria", "Otro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Costo (COP)" type="number" value={formP.costo} onChange={(e) => setFormP({ ...formP, costo: e.target.value })} placeholder="950000" />
            <Inp label="Precio venta (COP)" type="number" value={formP.precio_venta} onChange={(e) => setFormP({ ...formP, precio_venta: e.target.value })} placeholder="1280000" />
          </div>
          {formP.costo && formP.precio_venta && (
            <div style={{ background: "#0f172a", border: `1px solid ${cP}44`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: "#475569" }}>GANANCIA UNIT.</div><div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{fmt(gP)}</div></div>
                <div><div style={{ fontSize: 10, color: "#475569" }}>MARGEN</div><div style={{ fontSize: 20, fontWeight: 900, color: cP }}>{mP}%</div></div>
              </div>
            </div>
          )}
          <Inp label="Stock (unidades)" type="number" value={formP.stock} onChange={(e) => setFormP({ ...formP, stock: e.target.value })} placeholder="10" />
          <Inp label="Nota (opcional)" value={formP.nota} onChange={(e) => setFormP({ ...formP, nota: e.target.value })} placeholder="Observaciones..." />
          <Btn onClick={saveProduct} bg="#0ea5e9" style={{ padding: 14, fontSize: 15, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : view === "add" ? "Agregar producto" : "Guardar cambios"}
          </Btn>
        </div>
      </div>
    );
  }

  // ── VISTA: Dashboard ──────────────────────────────────────────────────────────
  if (tab === "dashboard") {
    const mesActual = new Date().toLocaleString("es-CO", { month: "long", year: "numeric" });
    const topProductos = Object.entries(
      ventasDelMes.reduce((acc, v) => { acc[v.producto_nombre] = (acc[v.producto_nombre] || 0) + v.ganancia_total; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => setTab("inventario")} style={{ marginBottom: 8, padding: "7px 14px" }}>← Volver</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>📊 Dashboard</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2, textTransform: "capitalize" }}>{mesActual}</div>
        </div>
        <div style={{ padding: 16 }}>
          {loading ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>⏳ Cargando...</div> : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["Total vendido", fmt(totalVendidoMes), "#38bdf8"], ["Ganancia real", fmt(gananciaRealMes), "#4ade80"], ["Ventas realizadas", `${ventasDelMes.length}`, "#f1f5f9"], ["Descuentos dados", fmt(descuentosMes), "#f87171"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
                  </div>
                ))}
              </div>

              {topProductos.length > 0 && (
                <div style={CARD}>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Top productos este mes</div>
                  {topProductos.map(([nombre, ganancia], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < topProductos.length - 1 ? "1px solid #1e293b" : "none" }}>
                      <span style={{ fontSize: 13, color: "#f1f5f9" }}>#{i + 1} {nombre}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{fmt(ganancia)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={CARD}>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Inventario actual</div>
                {[["Productos en stock", products.length, "#f1f5f9"], ["Capital invertido", fmt(totalInvested), "#94a3b8"], ["Ganancia potencial", fmt(totalProfit), "#4ade80"]].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── VISTA: Lista ventas ───────────────────────────────────────────────────────
  if (tab === "ventas") {
    return (
      <div style={ROOT}>
        <div style={HDR}>
          <Btn onClick={() => setTab("inventario")} style={{ marginBottom: 8, padding: "7px 14px" }}>← Volver</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>💰 Ventas</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{ventas.length} ventas registradas</div>
        </div>
        <div style={{ padding: 16 }}>
          {loading ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>⏳ Cargando...</div> : ventas.length === 0 ? (
            <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
              <div style={{ fontSize: 32 }}>💸</div>
              <div style={{ marginTop: 8 }}>Sin ventas aún. Registra desde cada producto.</div>
            </div>
          ) : ventas.map((v, i) => {
            const margenV = pct(v.costo_unitario, v.precio_venta);
            const colorV = mc(margenV);
            return (
              <div key={i} style={CARD}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{v.producto_nombre}</div>
                    {v.cliente_nombre && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>👤 {v.cliente_nombre} {v.cliente_telefono && `· ${v.cliente_telefono}`}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>{fmt(v.ganancia_total)}</div>
                    <div style={{ fontSize: 10, color: colorV }}>{margenV}% margen</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  {[["Precio", fmt(v.precio_venta), "#f1f5f9"], ["Cantidad", `${v.cantidad}u`, "#38bdf8"], ["Descuento", fmt(v.descuento || 0), v.descuento > 0 ? "#f87171" : "#475569"]].map(([l, val, c]) => (
                    <div key={l}><div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 12, fontWeight: 700, color: c }}>{val}</div></div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>{v.fecha}{v.nota && ` · ${v.nota}`}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── VISTA: Lista inventario (principal) ───────────────────────────────────────
  return (
    <div style={ROOT}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "err" ? "#7f1d1d" : "#064e3b", color: toast.type === "err" ? "#f87171" : "#4ade80", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 100, whiteSpace: "nowrap" }}>{toast.msg}</div>
      )}
      <div style={HDR}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>📷 CamTracker</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Inventario · Ventas · Dashboard</div>
          </div>
          {tab === "inventario" && <Btn onClick={() => { resetFormP(); setView("add"); }} bg="#0ea5e9" style={{ fontSize: 20, padding: "8px 14px" }}>+</Btn>}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {[["inventario", "📦 Inventario"], ["ventas", "💰 Ventas"], ["dashboard", "📊 Dashboard"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? "#0ea5e9" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
          ))}
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
                {[["Invertido", fmt(totalInvested), "#94a3b8"], ["Potencial", fmt(totalInvested + totalProfit), "#38bdf8"], ["Ganancia", fmt(totalProfit), "#4ade80"]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: c, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

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
              const ventasP = ventas.filter((v) => v.producto_id === p.id).length;
              return (
                <div key={p.id} onClick={() => { setSelected(p); setView("detail"); }}
                  style={{ ...CARD, cursor: "pointer", borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{p.nombre}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Tag label={p.categoria} color="#38bdf8" />
                        {ventasP > 0 && <Tag label={`${ventasP} ventas`} color="#4ade80" />}
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
