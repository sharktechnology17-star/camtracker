import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hfpdjigulkizcqqwhywf.supabase.co";
const SUPABASE_KEY = "sb_publishable_y30iP1QQhaYpgRb2g2WRhA_wpNLjHJP";
const HD = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

const db = {
  get: async (t, q = "") => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`, { headers: HD }); if (!r.ok) throw new Error(); return r.json(); },
  post: async (t, d) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}`, { method: "POST", headers: HD, body: JSON.stringify(d) }); if (!r.ok) throw new Error(); return r.json(); },
  patch: async (t, id, d) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`, { method: "PATCH", headers: HD, body: JSON.stringify(d) }); if (!r.ok) throw new Error(); return r.json(); },
  del: async (t, id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE", headers: HD }); if (!r.ok) throw new Error(); },
};

const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const pct = (cost, price) => price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
const getColor = (m) => parseFloat(m) >= 35 ? "#4ade80" : parseFloat(m) >= 20 ? "#fbbf24" : "#f87171";
const getLabel = (m) => parseFloat(m) >= 35 ? "Excelente" : parseFloat(m) >= 20 ? "Aceptable" : "Bajo";
const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY_P = { nombre: "", categoria: "Cámaras", costo: "", precio_venta: "", stock: "", nota: "" };
const EMPTY_V = { precio_venta: "", cantidad: "1", cliente_nombre: "", cliente_telefono: "", nota: "", fecha: todayStr() };

const css = {
  page: { minHeight: "100vh", background: "#070d1a", color: "#f1f5f9", fontFamily: "'DM Mono','Courier New',monospace", paddingBottom: 80 },
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" },
  hdr: { background: "#070d1a", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 10, padding: "16px 0 12px" },
  card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10 },
  inp: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, outline: "none", color: "#f1f5f9", padding: "10px 12px", fontSize: 14, width: "100%", fontFamily: "inherit", boxSizing: "border-box" },
};

function Tag({ text, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, fontSize: 11, padding: "2px 7px", fontWeight: 700 }}>
      {text}
    </span>
  );
}

function Btn({ children, onClick, bg = "#1e293b", fg = "#f1f5f9", style = {} }) {
  return (
    <button onClick={onClick} style={{ background: bg, color: fg, border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", ...style }}>
      {children}
    </button>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder || ""} style={css.inp} />
    </div>
  );
}

function PriceChart({ historial }) {
  if (!historial || historial.length < 2) return null;
  const vals = historial.map((h) => h.costo);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const actual = vals[vals.length - 1];
  const diff = actual - minV;
  const diffPct = minV > 0 ? ((diff / minV) * 100).toFixed(1) : 0;
  const W = 300, H = 100, P = 10, range = maxV - minV || 1;
  const pts = historial.map((h, i) => ({
    x: P + (i / (historial.length - 1)) * (W - P * 2),
    y: P + ((maxV - h.costo) / range) * (H - P * 2),
    v: h.costo,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Historial de costos</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[["Mínimo", fmt(minV), "#4ade80"], ["Promedio", fmt(avg), "#fbbf24"], ["Máximo", fmt(maxV), "#f87171"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px", borderTop: `2px solid ${c}` }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: diff > 0 ? "#3f2a0a" : "#0a2a1a", border: `1px solid ${diff > 0 ? "#fbbf24" : "#4ade80"}44`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: diff > 0 ? "#fbbf24" : "#4ade80" }}>
        {diff > 0 ? `⚠️ Comprando ${fmt(diff)} (${diffPct}%) más caro que tu mínimo` : "✓ Estás al precio más bajo de tu historial"}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={i === 0 || i === pts.length - 1 || p.v === minV || p.v === maxV ? 5 : 3}
            fill={p.v === minV ? "#4ade80" : p.v === maxV ? "#f87171" : "#38bdf8"}
            stroke="#070d1a" strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[0]?.fecha}</span>
        <span style={{ fontSize: 9, color: "#475569" }}>{historial[historial.length - 1]?.fecha}</span>
      </div>
    </div>
  );
}

function ViewVenta({ prod, formV, setFormV, saving, onSave, onCancel }) {
  const precio = parseInt(formV.precio_venta || 0);
  const cantidad = parseInt(formV.cantidad || 1);
  const precioMin = Math.ceil(prod.costo / 0.80);
  const ganancia = (precio - prod.costo) * cantidad;
  const descuento = (prod.precio_venta - precio) * cantidad;
  const margen = pct(prod.costo, precio);
  const bajo = precio > 0 && precio < precioMin;

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <Btn onClick={onCancel}>← Cancelar</Btn>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#4ade80", marginTop: 8 }}>💰 Registrar venta</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{prod.nombre}</div>
        </div>
      </div>
      <div style={{ ...css.wrap, maxWidth: 640, display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Precio lista</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{fmt(prod.precio_venta)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Mínimo (20% margen)</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{fmt(precioMin)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Precio vendido (COP)" type="number" value={formV.precio_venta} onChange={(e) => setFormV({ ...formV, precio_venta: e.target.value })} placeholder={String(prod.precio_venta)} />
          <Field label="Cantidad" type="number" value={formV.cantidad} onChange={(e) => setFormV({ ...formV, cantidad: e.target.value })} placeholder="1" />
        </div>
        {formV.precio_venta && (
          <div style={{ background: "#0a1628", border: `1px solid ${bajo ? "#f87171" : getColor(margen)}44`, borderRadius: 10, padding: 14 }}>
            {bajo && (
              <div style={{ background: "#3f0f0f", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#f87171" }}>
                🚨 Por debajo del precio mínimo recomendado ({fmt(precioMin)})
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: descuento > 0 ? 10 : 0 }}>
              <div>
                <div style={{ fontSize: 9, color: "#475569" }}>GANANCIA REAL</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: ganancia >= 0 ? "#4ade80" : "#f87171" }}>{fmt(ganancia)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#475569" }}>MARGEN REAL</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: getColor(margen) }}>{margen}%</div>
              </div>
            </div>
            {descuento > 0 && (
              <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10 }}>
                <div style={{ fontSize: 9, color: "#475569" }}>DESCUENTO APLICADO</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>-{fmt(descuento)} vs precio lista</div>
              </div>
            )}
          </div>
        )}
        <Field label="Nombre cliente (opcional)" value={formV.cliente_nombre} onChange={(e) => setFormV({ ...formV, cliente_nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
        <Field label="Teléfono cliente (opcional)" type="tel" value={formV.cliente_telefono} onChange={(e) => setFormV({ ...formV, cliente_telefono: e.target.value })} placeholder="Ej: 3001234567" />
        <Field label="Fecha" type="date" value={formV.fecha} onChange={(e) => setFormV({ ...formV, fecha: e.target.value })} />
        <Field label="Nota (opcional)" value={formV.nota} onChange={(e) => setFormV({ ...formV, nota: e.target.value })} placeholder="Observaciones..." />
        <Btn onClick={onSave} bg="#4ade80" fg="#052e16" style={{ padding: 14, fontSize: 15, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Registrar venta"}
        </Btn>
      </div>
    </div>
  );
}

function ViewDetalle({ prod, ventas, onVolver, onVenta, onEditar, onEliminar }) {
  const margin = pct(prod.costo, prod.precio_venta);
  const c = getColor(margin);
  const ganancia = (prod.precio_venta || 0) - (prod.costo || 0);
  const precioMin = Math.ceil(prod.costo / 0.80);
  const ventasProd = ventas.filter((v) => v.producto_id === prod.id);

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <Btn onClick={onVolver}>← Volver</Btn>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#38bdf8", marginTop: 8 }}>{prod.nombre}</div>
          <div style={{ marginTop: 4 }}><Tag text={prod.categoria} color="#38bdf8" /></div>
        </div>
      </div>
      <div style={{ ...css.wrap, maxWidth: 740, paddingTop: 16 }}>
        <div style={{ ...css.card, borderColor: c + "66" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["Costo actual", fmt(prod.costo), "#94a3b8"], ["Precio lista", fmt(prod.precio_venta), "#f1f5f9"], ["Ganancia unit.", fmt(ganancia), "#4ade80"], ["Stock", `${prod.stock} uds`, "#38bdf8"]].map(([l, v, col]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: col }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0a1628", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Precio mínimo de venta (20% margen)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>{fmt(precioMin)}</div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Margen</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: c }}>{margin}%</span>
            </div>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 3, marginTop: 8 }}>
              <div style={{ height: "100%", width: `${Math.min(parseFloat(margin), 100)}%`, background: c, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: c, marginTop: 4, textAlign: "right" }}>{getLabel(margin)}</div>
          </div>
        </div>

        <Btn onClick={onVenta} bg="#4ade80" fg="#052e16" style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 10 }}>
          💰 Registrar venta
        </Btn>

        <PriceChart historial={prod.historial_costos} />

        {ventasProd.length > 0 && (
          <div style={css.card}>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Últimas ventas ({ventasProd.length})</div>
            {ventasProd.slice(0, 5).map((v, i) => (
              <div key={i} style={{ borderBottom: i < Math.min(ventasProd.length, 5) - 1 ? "1px solid #1e293b" : "none", paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{fmt(v.precio_venta)} × {v.cantidad}</div>
                    {v.cliente_nombre && <div style={{ fontSize: 11, color: "#94a3b8" }}>👤 {v.cliente_nombre}{v.cliente_telefono && ` · ${v.cliente_telefono}`}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{fmt(v.ganancia_total)}</div>
                    <div style={{ fontSize: 10, color: getColor(pct(v.costo_unitario, v.precio_venta)) }}>{pct(v.costo_unitario, v.precio_venta)}%</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "#475569" }}>{v.fecha}</span>
                  {v.descuento > 0 && <span style={{ fontSize: 10, color: "#f87171" }}>-{fmt(v.descuento)} descuento</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {prod.nota && (
          <div style={{ ...css.card, borderColor: "#fbbf2444" }}>
            <div style={{ fontSize: 10, color: "#fbbf24", marginBottom: 4 }}>NOTA</div>
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>{prod.nota}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn onClick={onEditar} bg="#1e3a5f" fg="#38bdf8" style={{ flex: 1 }}>✏️ Editar</Btn>
          <Btn onClick={onEliminar} bg="#3f0f0f" fg="#f87171" style={{ flex: 1 }}>🗑 Eliminar</Btn>
        </div>
      </div>
    </div>
  );
}

function ViewFormProducto({ view, formP, setFormP, saving, onSave, onCancel }) {
  const gana = parseInt(formP.precio_venta || 0) - parseInt(formP.costo || 0);
  const margen = pct(formP.costo || 0, formP.precio_venta || 0);

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <Btn onClick={onCancel}>← Cancelar</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8", marginTop: 8 }}>{view === "add" ? "Nuevo producto" : "Editar producto"}</div>
        </div>
      </div>
      <div style={{ ...css.wrap, maxWidth: 640, display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
        <Field label="Nombre" value={formP.nombre} onChange={(e) => setFormP({ ...formP, nombre: e.target.value })} placeholder="Ej: Insta360 X4" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Categoría</label>
          <select value={formP.categoria} onChange={(e) => setFormP({ ...formP, categoria: e.target.value })} style={{ ...css.inp }}>
            {["Cámaras", "Accesorios", "Lentes", "Baterías", "Monturas", "Memoria", "Otro"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Costo (COP)" type="number" value={formP.costo} onChange={(e) => setFormP({ ...formP, costo: e.target.value })} placeholder="950000" />
          <Field label="Precio venta (COP)" type="number" value={formP.precio_venta} onChange={(e) => setFormP({ ...formP, precio_venta: e.target.value })} placeholder="1280000" />
        </div>
        {formP.costo && formP.precio_venta && (
          <div style={{ background: "#0f172a", border: `1px solid ${getColor(margen)}44`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#475569" }}>GANANCIA UNIT.</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{fmt(gana)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#475569" }}>MARGEN</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: getColor(margen) }}>{margen}%</div>
              </div>
            </div>
          </div>
        )}
        <Field label="Stock (unidades)" type="number" value={formP.stock} onChange={(e) => setFormP({ ...formP, stock: e.target.value })} placeholder="10" />
        <Field label="Nota (opcional)" value={formP.nota} onChange={(e) => setFormP({ ...formP, nota: e.target.value })} placeholder="Observaciones..." />
        <Btn onClick={onSave} bg="#0ea5e9" style={{ padding: 14, fontSize: 15, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : view === "add" ? "Agregar producto" : "Guardar cambios"}
        </Btn>
      </div>
    </div>
  );
}

function ViewDashboard({ products, ventas, loading, onVolver }) {
  const mesKey = new Date().toISOString().slice(0, 7);
  const mesActual = new Date().toLocaleString("es-CO", { month: "long", year: "numeric" });
  const ventasMes = ventas.filter((v) => v.fecha?.startsWith(mesKey));
  const ganMes = ventasMes.reduce((s, v) => s + (v.ganancia_total || 0), 0);
  const vendMes = ventasMes.reduce((s, v) => s + v.precio_venta * v.cantidad, 0);
  const descMes = ventasMes.reduce((s, v) => s + (v.descuento || 0), 0);
  const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
  const totalInv = products.reduce((s, p) => s + (p.costo || 0) * (p.stock || 0), 0);
  const totalInvAll = totalInv + ventas.reduce((s, v) => s + (v.costo_unitario || 0) * (v.cantidad || 0), 0);
  const ganReal = ventas.reduce((s, v) => s + (v.ganancia_total || 0), 0);
  const topProds = Object.entries(ventasMes.reduce((acc, v) => { acc[v.producto_nombre] = (acc[v.producto_nombre] || 0) + v.ganancia_total; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <Btn onClick={onVolver}>← Volver</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8", marginTop: 8 }}>📊 Dashboard</div>
          <div style={{ fontSize: 11, color: "#475569", textTransform: "capitalize" }}>{mesActual}</div>
        </div>
      </div>
      <div style={{ ...css.wrap, paddingTop: 16 }}>
        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>⏳ Cargando...</div> : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 10 }}>
              {[["Total vendido", fmt(vendMes), "#38bdf8"], ["Ganancia real", fmt(ganMes), "#4ade80"], ["Ventas", `${ventasMes.length}`, "#f1f5f9"], ["Descuentos dados", fmt(descMes), "#f87171"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            {topProds.length > 0 && (
              <div style={css.card}>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Top productos este mes</div>
                {topProds.map(([nombre, g], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < topProds.length - 1 ? "1px solid #1e293b" : "none" }}>
                    <span style={{ fontSize: 13, color: "#f1f5f9" }}>#{i + 1} {nombre}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{fmt(g)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={css.card}>
              <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Resumen general</div>
              {[["Unidades en stock", totalUnits, "#f1f5f9"], ["Capital invertido total", fmt(totalInvAll), "#94a3b8"], ["Ganancia real acumulada", fmt(ganReal), "#4ade80"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewVentas({ ventas, loading, onVolver }) {
  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <Btn onClick={onVolver}>← Volver</Btn>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80", marginTop: 8 }}>💰 Ventas</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{ventas.length} ventas registradas</div>
        </div>
      </div>
      <div style={{ ...css.wrap, paddingTop: 16 }}>
        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>⏳ Cargando...</div> : ventas.length === 0 ? (
          <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
            <div style={{ fontSize: 32 }}>💸</div>
            <div style={{ marginTop: 8 }}>Sin ventas aún. Registra desde cada producto.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {ventas.map((v, i) => (
              <div key={i} style={css.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{v.producto_nombre}</div>
                    {v.cliente_nombre && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>👤 {v.cliente_nombre}{v.cliente_telefono && ` · ${v.cliente_telefono}`}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>{fmt(v.ganancia_total)}</div>
                    <div style={{ fontSize: 10, color: getColor(pct(v.costo_unitario, v.precio_venta)) }}>{pct(v.costo_unitario, v.precio_venta)}% margen</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  {[["Precio", fmt(v.precio_venta), "#f1f5f9"], ["Cant.", `${v.cantidad}u`, "#38bdf8"], ["Descuento", fmt(v.descuento || 0), v.descuento > 0 ? "#f87171" : "#475569"]].map(([l, val, c]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>{v.fecha}{v.nota && ` · ${v.nota}`}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewProductosHistorial({ products, loading, search, setSearch, filterCat, setFilterCat, tab, setTab, onAdd, onSelect }) {
  const cats = ["Todos", ...Array.from(new Set(products.map((p) => p.categoria)))];
  const filtered = products
    .filter((p) => filterCat === "Todos" || p.categoria === filterCat)
    .filter((p) => p.nombre?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>📷 CamTracker</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Inventario · Ventas · Dashboard</div>
            </div>
            <Btn onClick={onAdd} bg="#0ea5e9" style={{ fontSize: 20, padding: "8px 14px" }}>+</Btn>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["inventario", "📦 Inventario"], ["productos", "📊 Productos"], ["ventas", "💰 Ventas"], ["dashboard", "📉 Dashboard"]].map(([t, l]) => (
              <Btn key={t} onClick={() => setTab(t)} bg={tab === t ? "#0ea5e9" : "#1e293b"} fg={tab === t ? "#fff" : "#94a3b8"}>{l}</Btn>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...css.wrap, paddingTop: 14 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div>Cargando desde Supabase...</div>
          </div>
        ) : (
          <div>
            <input type="search" placeholder="🔍 Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...css.inp, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
              {cats.map((c) => (
                <Btn key={c} onClick={() => setFilterCat(c)} bg={filterCat === c ? "#0ea5e9" : "#1e293b"} fg={filterCat === c ? "#fff" : "#94a3b8"} style={{ whiteSpace: "nowrap" }}>{c}</Btn>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
                <div style={{ fontSize: 32 }}>📦</div>
                <div style={{ marginTop: 8 }}>Sin productos. ¡Agrega el primero!</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
                {filtered.map((p) => {
                  const hist = p.historial_costos || [];
                  const actual = p.costo;
                  const minCosto = hist.length > 0 ? Math.min(...hist.map((h) => h.costo)) : actual;
                  const maxCosto = hist.length > 0 ? Math.max(...hist.map((h) => h.costo)) : actual;
                  const esMin = actual === minCosto;
                  const esMax = actual === maxCosto;

                  return (
                    <div key={p.id} onClick={() => onSelect(p)} style={{ ...css.card, cursor: "pointer" }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", marginBottom: 3 }}>{p.nombre}</div>
                        <Tag text={p.categoria} color="#38bdf8" />
                      </div>

                      <div style={{ background: "#0a1628", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>Costo actual</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: esMin ? "#4ade80" : esMax ? "#f87171" : "#f1f5f9" }}>
                          {fmt(actual)}
                          {esMin && " ✓ Mínimo"}
                          {esMax && " ⚠️ Máximo"}
                        </div>
                      </div>

                      {hist.length > 0 && (
                        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10 }}>
                          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>Historial de costos ({hist.length})</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {hist.slice().reverse().map((h, i) => {
                              const esMenorQueActual = h.costo < actual;
                              const esMayorQueActual = h.costo > actual;
                              return (
                                <div key={i} style={{ background: esMenorQueActual ? "#0a2a1a" : esMayorQueActual ? "#3f1a0a" : "#0f172a", border: `1px solid ${esMenorQueActual ? "#4ade8044" : esMayorQueActual ? "#f8717144" : "#1e293b"}`, borderRadius: 6, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: esMenorQueActual ? "#4ade80" : esMayorQueActual ? "#f87171" : "#f1f5f9" }}>
                                      {fmt(h.costo)}
                                    </div>
                                    <div style={{ fontSize: 9, color: "#94a3b8" }}>{h.fecha}</div>
                                  </div>
                                  <div style={{ fontSize: 10, color: esMenorQueActual ? "#4ade80" : esMayorQueActual ? "#f87171" : "#94a3b8", fontWeight: 600 }}>
                                    {esMenorQueActual && "✓ Más barato"}
                                    {esMayorQueActual && "⚠️ Más caro"}
                                    {!esMenorQueActual && !esMayorQueActual && "Actual"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {hist.length > 1 && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div>
                                <div style={{ fontSize: 9, color: "#475569" }}>MÍNIMO HISTÓRICO</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{fmt(minCosto)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9, color: "#475569" }}>MÁXIMO HISTÓRICO</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171" }}>{fmt(maxCosto)}</div>
                              </div>
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 9, color: "#475569" }}>DIFERENCIA</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>
                                  {fmt(maxCosto - minCosto)} ({(((maxCosto - minCosto) / minCosto) * 100).toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewInventario({ products, ventas, loading, search, setSearch, filterCat, setFilterCat, sortBy, setSortBy, tab, setTab, onAdd, onSelect }) {
  const totalInv = products.reduce((s, p) => s + (p.costo || 0) * (p.stock || 0), 0);
  const totalInvAll = totalInv + ventas.reduce((s, v) => s + (v.costo_unitario || 0) * (v.cantidad || 0), 0);
  const totalRec = ventas.reduce((s, v) => s + (v.precio_venta || 0) * (v.cantidad || 0), 0);
  const ganReal = ventas.reduce((s, v) => s + (v.ganancia_total || 0), 0);
  const cats = ["Todos", ...Array.from(new Set(products.map((p) => p.categoria)))];
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

  return (
    <div style={css.page}>
      <div style={css.hdr}>
        <div style={css.wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>📷 CamTracker</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Inventario · Ventas · Dashboard</div>
            </div>
            <Btn onClick={onAdd} bg="#0ea5e9" style={{ fontSize: 20, padding: "8px 14px" }}>+</Btn>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["inventario", "📦 Inventario"], ["productos", "📊 Productos"], ["ventas", "💰 Ventas"], ["dashboard", "📉 Dashboard"]].map(([t, l]) => (
              <Btn key={t} onClick={() => setTab(t)} bg={tab === t ? "#0ea5e9" : "#1e293b"} fg={tab === t ? "#fff" : "#94a3b8"}>{l}</Btn>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...css.wrap, paddingTop: 14 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div>Cargando desde Supabase...</div>
          </div>
        ) : (
          <div>
            <div style={{ ...css.card, background: "linear-gradient(135deg,#0c1f3a,#0f172a)", borderColor: "#1e3a5f" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 10, textTransform: "uppercase" }}>Resumen · {products.length} productos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                {[["Invertido total", fmt(totalInvAll), "#94a3b8"], ["Recuperado", fmt(totalRec), "#38bdf8"], ["Ganancia real", fmt(ganReal), "#4ade80"]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: c, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <input type="search" placeholder="🔍 Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...css.inp, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
              {cats.map((c) => (
                <Btn key={c} onClick={() => setFilterCat(c)} bg={filterCat === c ? "#0ea5e9" : "#1e293b"} fg={filterCat === c ? "#fff" : "#94a3b8"} style={{ whiteSpace: "nowrap" }}>{c}</Btn>
              ))}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...css.inp, marginBottom: 14 }}>
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
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {filtered.map((p) => {
                  const m = pct(p.costo, p.precio_venta);
                  const c = getColor(m);
                  const costos = p.historial_costos?.map((h) => h.costo) || [];
                  const minC = costos.length > 1 ? Math.min(...costos) : null;
                  const ventasP = ventas.filter((v) => v.producto_id === p.id).length;
                  return (
                    <div key={p.id} onClick={() => onSelect(p)} style={{ ...css.card, cursor: "pointer", borderLeft: `3px solid ${c}`, marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{p.nombre}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Tag text={p.categoria} color="#38bdf8" />
                            {ventasP > 0 && <Tag text={`${ventasP} ventas`} color="#4ade80" />}
                            {minC && p.costo > minC && <Tag text={`+${(((p.costo - minC) / minC) * 100).toFixed(0)}% vs mín`} color="#f87171" />}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{m}%</div>
                          <div style={{ fontSize: 10, color: c }}>{getLabel(m)}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                        {[["Costo", fmt(p.costo), "#94a3b8"], ["Venta", fmt(p.precio_venta), "#f1f5f9"], ["Ganancia", fmt((p.precio_venta || 0) - (p.costo || 0)), "#4ade80"], ["Stock", `${p.stock}u`, "#38bdf8"]].map(([l, v, col]) => (
                          <div key={l}>
                            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>{l}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("inventario");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [sortBy, setSortBy] = useState("margin_asc");
  const [toast, setToast] = useState(null);
  const [formP, setFormP] = useState(EMPTY_P);
  const [formV, setFormV] = useState(EMPTY_V);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const reload = async () => {
    try {
      setLoading(true);
      const [p, v] = await Promise.all([db.get("inventario_camaras", "order=id.asc"), db.get("ventas", "order=fecha.desc")]);
      setProducts(p || []);
      setVentas(v || []);
    } catch { showToast("Error cargando datos", "err"); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const saveProduct = async () => {
    if (!formP.nombre || !formP.costo || !formP.precio_venta || !formP.stock) { showToast("Completa todos los campos", "err"); return; }
    const costo = parseInt(formP.costo), precio_venta = parseInt(formP.precio_venta), stock = parseInt(formP.stock);
    setSaving(true);
    try {
      if (view === "add") {
        await db.post("inventario_camaras", { nombre: formP.nombre, categoria: formP.categoria, costo, precio_venta, stock, nota: formP.nota, historial_costos: [{ fecha: todayStr(), costo }] });
        showToast("Producto agregado ✓");
      } else {
        const hist = costo !== selected.costo ? [...(selected.historial_costos || []), { fecha: todayStr(), costo }] : selected.historial_costos;
        await db.patch("inventario_camaras", selected.id, { nombre: formP.nombre, categoria: formP.categoria, costo, precio_venta, stock, nota: formP.nota, historial_costos: hist });
        showToast("Guardado ✓");
      }
      await reload(); setFormP(EMPTY_P); setView("list");
    } catch { showToast("Error guardando", "err"); }
    finally { setSaving(false); }
  };

  const saveVenta = async () => {
    if (!formV.precio_venta || !formV.cantidad) { showToast("Completa precio y cantidad", "err"); return; }
    const p = selected, precio = parseInt(formV.precio_venta), cantidad = parseInt(formV.cantidad);
    setSaving(true);
    try {
      await db.post("ventas", { producto_id: p.id, producto_nombre: p.nombre, costo_unitario: p.costo, precio_venta: precio, precio_lista: p.precio_venta, cantidad, ganancia_total: (precio - p.costo) * cantidad, descuento: (p.precio_venta - precio) * cantidad, cliente_nombre: formV.cliente_nombre || null, cliente_telefono: formV.cliente_telefono || null, nota: formV.nota || null, fecha: formV.fecha });
      await db.patch("inventario_camaras", p.id, { stock: Math.max(0, (p.stock || 0) - cantidad) });
      showToast("Venta registrada ✓");
      await reload(); setFormV(EMPTY_V); setView("detail");
    } catch { showToast("Error registrando venta", "err"); }
    finally { setSaving(false); }
  };

  const delProduct = async (id) => {
    try { await db.del("inventario_camaras", id); await reload(); setView("list"); showToast("Eliminado"); }
    catch { showToast("Error eliminando", "err"); }
  };

  const prod = selected ? (products.find((x) => x.id === selected.id) || selected) : null;

  const toastEl = toast ? (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "err" ? "#7f1d1d" : "#064e3b", color: toast.type === "err" ? "#f87171" : "#4ade80", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap" }}>
      {toast.msg}
    </div>
  ) : null;

  if (view === "venta" && prod) {
    return (
      <div>
        {toastEl}
        <ViewVenta prod={prod} formV={formV} setFormV={setFormV} saving={saving} onSave={saveVenta} onCancel={() => { setFormV(EMPTY_V); setView("detail"); }} />
      </div>
    );
  }

  if (view === "detail" && prod) {
    return (
      <div>
        {toastEl}
        <ViewDetalle prod={prod} ventas={ventas} onVolver={() => setView("list")} onVenta={() => { setFormV({ ...EMPTY_V, precio_venta: String(prod.precio_venta) }); setView("venta"); }} onEditar={() => { setFormP({ nombre: prod.nombre, categoria: prod.categoria, costo: prod.costo, precio_venta: prod.precio_venta, stock: prod.stock, nota: prod.nota || "" }); setView("edit"); }} onEliminar={() => { if (window.confirm("¿Eliminar?")) delProduct(prod.id); }} />
      </div>
    );
  }

  if (view === "add" || view === "edit") {
    return (
      <div>
        {toastEl}
        <ViewFormProducto view={view} formP={formP} setFormP={setFormP} saving={saving} onSave={saveProduct} onCancel={() => setView("list")} />
      </div>
    );
  }

  if (tab === "productos") {
    return (
      <div>
        {toastEl}
        <ViewProductosHistorial products={products} loading={loading} search={search} setSearch={setSearch} filterCat={filterCat} setFilterCat={setFilterCat} tab={tab} setTab={setTab} onAdd={() => { setFormP(EMPTY_P); setView("add"); }} onSelect={(p) => { setSelected(p); setView("detail"); }} />
      </div>
    );
  }

  if (tab === "ventas") {
    return (
      <div>
        {toastEl}
        <ViewVentas ventas={ventas} loading={loading} onVolver={() => setTab("inventario")} />
      </div>
    );
  }

  if (tab === "dashboard") {
    return (
      <div>
        {toastEl}
        <ViewDashboard products={products} ventas={ventas} loading={loading} onVolver={() => setTab("inventario")} />
      </div>
    );
  }

  return (
    <div>
      {toastEl}
      <ViewInventario products={products} ventas={ventas} loading={loading} search={search} setSearch={setSearch} filterCat={filterCat} setFilterCat={setFilterCat} sortBy={sortBy} setSortBy={setSortBy} tab={tab} setTab={setTab} onAdd={() => { setFormP(EMPTY_P); setView("add"); }} onSelect={(p) => { setSelected(p); setView("detail"); }} />
    </div>
  );
}
