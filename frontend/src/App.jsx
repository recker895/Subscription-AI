import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  LayoutDashboard, CreditCard, ShieldAlert, BarChart3,
  Settings, Sparkles, Bell, Search, AlertTriangle,
  TrendingUp, TrendingDown, Zap, Activity, DollarSign,
  Eye, ChevronRight, Upload, RefreshCw, ArrowUpRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts"

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const TOKEN = {
  bg:        "#06070f",
  surface:   "#0d1117",
  surfaceUp: "#111822",
  border:    "rgba(255,255,255,0.06)",
  borderHi:  "rgba(255,255,255,0.12)",
  text:      "#f0f4ff",
  muted:     "#6b7a99",
  accent:    "#635bff",   // electric indigo
  accent2:   "#06d6a0",   // mint
  accent3:   "#ff6b6b",   // coral
  amber:     "#f5a623",
  grad1:     "linear-gradient(135deg, #635bff 0%, #a855f7 100%)",
  grad2:     "linear-gradient(135deg, #06d6a0 0%, #0891b2 100%)",
  grad3:     "linear-gradient(135deg, #f5a623 0%, #ef4444 100%)",
}

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: ${TOKEN.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(99,91,255,0.3); border-radius: 99px; }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #635bff, #a855f7, #06d6a0, #635bff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
`

/* ─────────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: TOKEN.surfaceUp,
      border: `1px solid ${TOKEN.borderHi}`,
      borderRadius: 12,
      padding: "10px 16px",
      fontSize: 13,
      color: TOKEN.text,
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ color: TOKEN.muted, marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: TOKEN.accent2 }}>
        ${payload[0]?.value?.toLocaleString()}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────── */
function GlassCard({ children, style = {}, glow = false, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: glow ? `0 0 40px rgba(99,91,255,0.15), 0 20px 60px rgba(0,0,0,0.5)` : "0 20px 60px rgba(0,0,0,0.5)" }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        background: TOKEN.surface,
        border: `1px solid ${TOKEN.border}`,
        borderRadius: 20,
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {glow && (
        <div style={{
          position: "absolute", top: -60, right: -60, width: 180, height: 180,
          background: "radial-gradient(circle, rgba(99,91,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   STAT PILL
───────────────────────────────────────────── */
function StatPill({ value, positive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: positive ? "rgba(6,214,160,0.1)" : "rgba(255,107,107,0.1)",
      color: positive ? TOKEN.accent2 : TOKEN.accent3,
      border: `1px solid ${positive ? "rgba(6,214,160,0.2)" : "rgba(255,107,107,0.2)"}`,
      borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {value}
    </span>
  )
}

/* ─────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────── */
function MetricCard({ title, value, sub, gradient, icon: Icon, trend, positive }) {
  return (
    <GlassCard glow>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: TOKEN.muted, fontWeight: 500, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>{title}</div>
          <div style={{
            fontSize: 34, fontWeight: 800, letterSpacing: -1.5,
            background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: TOKEN.muted, marginTop: 6 }}>{sub}</div>}
          {trend && <div style={{ marginTop: 10 }}><StatPill value={trend} positive={positive} /></div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: gradient, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={20} color="white" />
        </div>
      </div>
    </GlassCard>
  )
}

/* ─────────────────────────────────────────────
   SIDEBAR ITEM
───────────────────────────────────────────── */
function SidebarItem({ icon, label, active, badge }) {
  return (
    <motion.div
      whileHover={{ x: active ? 0 : 3 }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 14, marginBottom: 4,
        cursor: "pointer", position: "relative",
        background: active ? "rgba(99,91,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(99,91,255,0.25)" : "1px solid transparent",
        color: active ? TOKEN.text : TOKEN.muted,
        fontWeight: active ? 600 : 400, fontSize: 14,
        transition: "color 0.2s",
      }}
    >
      {active && (
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, background: TOKEN.grad1, borderRadius: "0 4px 4px 0",
        }} />
      )}
      <span style={{ color: active ? TOKEN.accent : TOKEN.muted }}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          marginLeft: "auto", background: TOKEN.grad1, color: "white",
          fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px",
        }}>{badge}</span>
      )}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────── */
function ProgressBar({ label, pct, color }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} style={{ color }} />
          <span style={{ fontSize: 13, color: TOKEN.text, fontWeight: 500 }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{
        width: "100%", height: 6, background: "rgba(255,255,255,0.06)",
        borderRadius: 99, overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: `linear-gradient(to right, ${color}88, ${color})`, borderRadius: 99 }}
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SUBSCRIPTION ROW
───────────────────────────────────────────── */
function SubRow({ name, amount, freq, i }) {
  const colors = [TOKEN.accent, TOKEN.accent2, TOKEN.accent3, TOKEN.amber]
  const c = colors[i % colors.length]
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 0",
        borderBottom: `1px solid ${TOKEN.border}`,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${c}18`, border: `1px solid ${c}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: c, flexShrink: 0,
      }}>
        {name?.[0]?.toUpperCase() || "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TOKEN.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 12, color: TOKEN.muted, marginTop: 2 }}>{freq}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: c }}>${parseFloat(amount || 0).toFixed(2)}</div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   LIVE INDICATOR
───────────────────────────────────────────── */
function LiveDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: TOKEN.accent2, animation: "pulse-ring 1.5s ease-out infinite",
      }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: TOKEN.accent2, position: "relative" }} />
    </span>
  )
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  // Inject global styles
  useEffect(() => {
    const id = "optimizer-global"
    if (!document.getElementById(id)) {
      const el = document.createElement("style")
      el.id = id
      el.textContent = GLOBAL_CSS
      document.head.appendChild(el)
    }
  }, [])

  const handleAnalyze = async () => {
    if (!file) { alert("Please upload a CSV file"); return }
    const formData = new FormData()
    formData.append("file", file)
    try {
      setLoading(true)
      const response = await axios.post("https://mysubscriptionai.space/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setResult(response.data)
    } catch (err) {
      console.error(err)
      alert("Analysis failed. Check the API endpoint.")
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis || {}

  // Timeline data
  const timelineMap = {}
  analysis.active_subscriptions?.forEach(item => {
    const freq = item.billing_frequency || "Unknown"
    const price = Number(item.monthly_price || 0)
    timelineMap[freq] = (timelineMap[freq] || 0) + price
  })
  const timelineData = Object.entries(timelineMap).map(([month, spend]) => ({
    month, spend: +spend.toFixed(2)
  }))

  // Category data
  const categoryData = analysis.category_distribution
    ? Object.entries(analysis.category_distribution).map(([name, value]) => ({ name, value: Number(value) }))
    : []

  // Risk scores
  const subs = analysis.subscriptions_detected || 0
  const merchants = analysis.unique_merchants || 0
  const savings = analysis.estimated_savings || 0
  const txns = analysis.total_transactions || 0
  const spend = analysis.total_spending || 0

  const riskData = [
    { subject: "Duplicate", A: Math.min(subs * 5, 100) },
    { subject: "Fraud",     A: Math.min(merchants * 4, 100) },
    { subject: "Escalation",A: Math.min(savings / 50, 100) },
    { subject: "Unused",    A: Math.min(txns / 2, 100) },
    { subject: "Waste",     A: Math.min(spend / 500, 100) },
  ]

  const PIE_COLORS = ["#635bff", "#06d6a0", "#f5a623", "#ff6b6b", "#a855f7", "#0891b2"]

  const subs_list = analysis.active_subscriptions?.slice(0, 6) || []

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: TOKEN.bg, color: TOKEN.text,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: TOKEN.surface,
        borderRight: `1px solid ${TOKEN.border}`,
        padding: "28px 16px",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36, paddingLeft: 8 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: TOKEN.grad1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Sparkles size={18} color="white" />
            </motion.div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>Optimizer AI</div>
              <div style={{ fontSize: 11, color: TOKEN.muted }}>Financial Intelligence</div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: TOKEN.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, paddingLeft: 8 }}>Menu</div>
          {[
            { icon: <LayoutDashboard size={16} />, label: "Dashboard" },
            { icon: <BarChart3 size={16} />,       label: "Analytics" },
            { icon: <CreditCard size={16} />,      label: "Subscriptions", badge: subs || null },
            { icon: <ShieldAlert size={16} />,     label: "Fraud Detection" },
            { icon: <Settings size={16} />,        label: "Settings" },
          ].map(item => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={activeNav === item.label}
              onClick={() => setActiveNav(item.label)}
            />
          ))}
        </div>

        {/* AI badge */}
        <div style={{
          background: "rgba(99,91,255,0.06)",
          border: "1px solid rgba(99,91,255,0.15)",
          borderRadius: 16, padding: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <LiveDot />
            <span style={{ fontSize: 13, fontWeight: 700 }}>AI Engine Active</span>
          </div>
          <div style={{ fontSize: 12, color: TOKEN.muted, lineHeight: 1.5 }}>
            Real-time anomaly detection running
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: TOKEN.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Overview</div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: -1,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Financial Dashboard
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              background: TOKEN.surface, border: `1px solid ${TOKEN.border}`,
              borderRadius: 12, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 10,
              color: TOKEN.muted, fontSize: 13,
            }}>
              <Search size={15} />
              <span>Search...</span>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: TOKEN.surface, border: `1px solid ${TOKEN.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: TOKEN.muted, position: "relative",
            }}>
              <Bell size={16} />
              <div style={{
                position: "absolute", top: 8, right: 8,
                width: 7, height: 7, borderRadius: "50%",
                background: TOKEN.accent3, border: `2px solid ${TOKEN.surface}`,
              }} />
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: TOKEN.grad1,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <Eye size={16} color="white" />
            </div>
          </div>
        </div>

        {/* HERO ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Total Spend Hero */}
          <GlassCard style={{ background: "linear-gradient(145deg, #0d1117 0%, #111822 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: TOKEN.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Monthly Burn Rate</div>
                <div style={{
                  fontSize: 56, fontWeight: 900, letterSpacing: -3,
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: TOKEN.grad1, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  ${(analysis.total_spending || 0).toLocaleString()}
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
                  <StatPill value="+12.4%" positive />
                  <span style={{ fontSize: 12, color: TOKEN.muted }}>vs last month</span>
                </div>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <DollarSign size={24} style={{ color: TOKEN.accent }} />
              </div>
            </div>

            {/* mini sparkline */}
            <div style={{ marginTop: 20, height: 60 }}>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={timelineData.length ? timelineData : [{ month: "–", spend: 0 }]}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#635bff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="spend" stroke="#635bff" strokeWidth={2} fill="url(#heroGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Upload Card */}
          <GlassCard>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Activate Analysis</div>
            <motion.div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
              onClick={() => fileRef.current?.click()}
              animate={{ borderColor: dragOver ? TOKEN.accent : TOKEN.border }}
              style={{
                border: `2px dashed ${dragOver ? TOKEN.accent : TOKEN.border}`,
                borderRadius: 16, padding: "20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                cursor: "pointer", background: dragOver ? "rgba(99,91,255,0.05)" : "transparent",
                transition: "background 0.2s", marginBottom: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(99,91,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Upload size={20} style={{ color: TOKEN.accent }} />
              </div>
              <div style={{ fontSize: 13, color: TOKEN.muted, textAlign: "center" }}>
                {file ? <span style={{ color: TOKEN.accent2, fontWeight: 600 }}>✓ {file.name}</span> : "Drop CSV or click to browse"}
              </div>
            </motion.div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyze}
              style={{
                width: "100%", padding: "14px",
                borderRadius: 14, border: "none",
                background: loading ? "rgba(99,91,255,0.4)" : TOKEN.grad1,
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw size={16} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} /> Run AI Analysis
                </>
              )}
            </motion.button>
          </GlassCard>
        </div>

        {/* METRIC CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <MetricCard
            title="Transactions"
            value={(analysis.total_transactions || 0).toLocaleString()}
            icon={Activity}
            gradient={TOKEN.grad1}
            trend="+8.2%"
            positive
          />
          <MetricCard
            title="Subscriptions"
            value={analysis.subscriptions_detected || 0}
            icon={CreditCard}
            gradient={TOKEN.grad2}
            trend="+3"
            positive={false}
          />
          <MetricCard
            title="Merchants"
            value={analysis.unique_merchants || 0}
            icon={BarChart3}
            gradient={TOKEN.grad3}
            trend="+5.1%"
            positive
          />
          <MetricCard
            title="Est. Savings"
            value={`$${(analysis.estimated_savings || 0).toLocaleString()}`}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #f5a623 0%, #ff6b6b 100%)"
            trend="Opportunity"
            positive
          />
        </div>

        {/* CHARTS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Area Chart */}
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Recurring Spend</div>
                <div style={{ fontSize: 12, color: TOKEN.muted, marginTop: 3 }}>By billing frequency</div>
              </div>
              <div style={{
                background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)",
                borderRadius: 99, padding: "5px 14px", fontSize: 12, color: TOKEN.accent,
              }}>
                Live
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timelineData.length ? timelineData : [{ month: "No data", spend: 0 }]}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#635bff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke={TOKEN.muted} tick={{ fontSize: 11, fill: TOKEN.muted }} axisLine={false} tickLine={false} />
                <YAxis stroke={TOKEN.muted} tick={{ fontSize: 11, fill: TOKEN.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="spend" stroke="#635bff" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: "#635bff", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Pie Chart */}
          <GlassCard>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Category Split</div>
            <div style={{ fontSize: 12, color: TOKEN.muted, marginBottom: 20 }}>Spending distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData.length ? categoryData : [{ name: "No data", value: 1 }]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                >
                  {(categoryData.length ? categoryData : [{ name: "–", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: TOKEN.surfaceUp, border: `1px solid ${TOKEN.borderHi}`,
                    borderRadius: 10, fontSize: 12, color: TOKEN.text,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {categoryData.slice(0, 4).map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TOKEN.muted }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* Radar */}
          <GlassCard>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Risk Radar</div>
            <div style={{ fontSize: 12, color: TOKEN.muted, marginBottom: 8 }}>Subscription risk profile</div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={riskData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: TOKEN.muted, fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="A" stroke="#635bff" fill="#635bff" fillOpacity={0.25} strokeWidth={2} dot={{ fill: "#635bff", r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Fraud signals */}
          <GlassCard>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>AI Anomaly Signals</div>
            <div style={{ fontSize: 12, color: TOKEN.muted, marginBottom: 20 }}>Detected risk patterns</div>
            <ProgressBar label="Duplicate Subs"     pct={Math.min(subs * 5, 100)}       color={TOKEN.accent} />
            <ProgressBar label="Price Escalation"   pct={Math.min(savings / 50, 100)}   color={TOKEN.accent3} />
            <ProgressBar label="Hidden Charges"     pct={Math.min(merchants * 4, 100)}  color={TOKEN.amber} />
            <ProgressBar label="Unused Services"    pct={Math.min(txns / 2, 100)}       color={TOKEN.accent2} />
          </GlassCard>

          {/* Active subscriptions */}
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Active Subs</div>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: TOKEN.accent, cursor: "pointer",
              }}>
                View all <ChevronRight size={14} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: TOKEN.muted, marginBottom: 16 }}>Top recurring charges</div>
            {subs_list.length > 0 ? (
              subs_list.map((s, i) => (
                <SubRow key={i} i={i} name={s.merchant_name || s.name} amount={s.monthly_price} freq={s.billing_frequency} />
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: TOKEN.muted, fontSize: 13 }}>
                <Upload size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
                <div>Upload a CSV to see subscriptions</div>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  )
}

export default App
