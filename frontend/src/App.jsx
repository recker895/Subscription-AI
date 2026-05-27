import { useState } from "react"
import axios from "axios"

import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  BarChart3,
  Settings,
  Sparkles,
  Bell,
  Search,
  AlertTriangle,
} from "lucide-react"

import { motion } from "framer-motion"

import {

  ResponsiveContainer,

  AreaChart,
  Area,

  PieChart,
  Pie,
  Cell,

  RadarChart,
  Radar,

  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,

  XAxis,
  YAxis,
  Tooltip,

  CartesianGrid,

} from "recharts"

function App() {

  const [file, setFile] = useState(null)

  const [loading, setLoading] = useState(false)

  const [result, setResult] = useState(null)

  // =====================================================
  // ANALYZE
  // =====================================================

  const handleAnalyze = async () => {

    if (!file) {

      alert("Please upload CSV")

      return
    }

    const formData = new FormData()

    formData.append("file", file)

    try {

      setLoading(true)

      const response = await axios.post(

        "http://127.0.0.1:8000/analyze",

        formData,

        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      )

      setResult(response.data)

    } catch (err) {

      console.error(err)

      alert("Analysis failed")
    }

    finally {

      setLoading(false)
    }
  }

  // =====================================================
  // TIMELINE DATA
  // =====================================================

  const timelineMap = {}

  if (
    result?.analysis?.active_subscriptions
  ) {

    result.analysis.active_subscriptions.forEach(
      (item) => {

        const freq =
          item.billing_frequency || "Unknown"

        const price =
          Number(item.monthly_price || 0)

        if (!timelineMap[freq]) {

          timelineMap[freq] = 0
        }

        timelineMap[freq] += price
      }
    )
  }

  const timelineData = Object.entries(
    timelineMap
  ).map(([month, spend]) => ({

    month,

    spend:
      Number(spend.toFixed(2))
  }))

  // =====================================================
  // CATEGORY DATA
  // =====================================================

  const categoryData =

    result?.analysis?.category_distribution

      ? Object.entries(

          result.analysis
            .category_distribution

        ).map(([key, value]) => ({

          name: key,

          value: Number(value)
        }))

      : []

  // =====================================================
  // REAL DYNAMIC RISK DATA
  // =====================================================

  const riskData = [

    {
      subject: "Duplicate",

      A: Math.min(

        (
          result?.analysis
            ?.subscriptions_detected || 0
        ) * 5,

        100
      )
    },

    {
      subject: "Fraud",

      A: Math.min(

        (
          result?.analysis
            ?.unique_merchants || 0
        ) * 4,

        100
      )
    },

    {
      subject: "Escalation",

      A: Math.min(

        (
          result?.analysis
            ?.estimated_savings || 0
        ) / 50,

        100
      )
    },

    {
      subject: "Unused",

      A: Math.min(

        (
          result?.analysis
            ?.total_transactions || 0
        ) / 2,

        100
      )
    },

    {
      subject: "Waste",

      A: Math.min(

        (
          result?.analysis
            ?.total_spending || 0
        ) / 500,

        100
      )
    }
  ]

  // =====================================================
  // COLORS
  // =====================================================

  const COLORS = [

    "#7c3aed",
    "#ec4899",
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
  ]

  return (

    <div

      style={{

        display: "flex",

        minHeight: "100vh",

        background:
          "#050816",

        color: "white",

        fontFamily:
          "Inter, sans-serif",
      }}
    >

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <div

        style={{

          width: "260px",

          background:
            "#0b1020",

          borderRight:
            "1px solid rgba(255,255,255,0.06)",

          padding: "30px 22px",

          display: "flex",

          flexDirection: "column",

          justifyContent: "space-between",
        }}
      >

        <div>

          {/* LOGO */}

          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: "14px",

              marginBottom: "45px",
            }}
          >

            <div
              style={{

                width: "52px",

                height: "52px",

                borderRadius: "18px",

                background:
                  "linear-gradient(135deg,#7c3aed,#ec4899)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",
              }}
            >

              <Sparkles />

            </div>

            <div>

              <div
                style={{

                  fontWeight: "800",

                  fontSize: "20px",
                }}
              >
                Optimizer AI
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Financial Intelligence
              </div>

            </div>

          </div>

          {/* NAV */}

          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            title="Dashboard"
            active
          />

          <SidebarItem
            icon={<BarChart3 size={18} />}
            title="Analytics"
          />

          <SidebarItem
            icon={<CreditCard size={18} />}
            title="Subscriptions"
          />

          <SidebarItem
            icon={<ShieldAlert size={18} />}
            title="Fraud Detection"
          />

          <SidebarItem
            icon={<Settings size={18} />}
            title="Settings"
          />

        </div>

        {/* AI STATUS */}

        <div
          style={{

            background:
              "rgba(255,255,255,0.04)",

            border:
              "1px solid rgba(255,255,255,0.05)",

            borderRadius: "18px",

            padding: "18px",
          }}
        >

          <div
            style={{
              fontWeight: "700",
            }}
          >
            Premium AI Mode
          </div>

          <div
            style={{
              color: "#94a3b8",
              marginTop: "6px",
              fontSize: "14px",
            }}
          >
            Dynamic analytics engine active
          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div

        style={{

          flex: 1,

          padding: "28px",

          overflow: "auto",
        }}
      >

        {/* ================================================= */}
        {/* TOP BAR */}
        {/* ================================================= */}

        <div

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: "28px",
          }}
        >

          <div>

            <h1
              style={{

                margin: 0,

                fontSize: "34px",

                fontWeight: "900",
              }}
            >
              Financial Dashboard
            </h1>

            <div
              style={{
                color: "#94a3b8",
                marginTop: "5px",
              }}
            >
              AI-powered subscription optimization system
            </div>

          </div>

          <div
            style={{

              display: "flex",

              gap: "14px",

              alignItems: "center",
            }}
          >

            <div
              style={{

                background:
                  "rgba(255,255,255,0.04)",

                border:
                  "1px solid rgba(255,255,255,0.06)",

                borderRadius: "14px",

                padding: "12px 16px",

                display: "flex",

                alignItems: "center",

                gap: "10px",

                color: "#94a3b8",
              }}
            >

              <Search size={16} />

              Search analytics...

            </div>

            <div
              style={{

                width: "46px",

                height: "46px",

                borderRadius: "14px",

                background:
                  "rgba(255,255,255,0.04)",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",
              }}
            >

              <Bell size={18} />

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div

          style={{

            display: "grid",

            gridTemplateColumns:
              "1.5fr 1fr",

            gap: "24px",

            marginBottom: "24px",
          }}
        >

          <GlassCard>

            <div
              style={{
                color: "#94a3b8",
                marginBottom: "18px",
              }}
            >
              Monthly Burn Rate
            </div>

            <h1
              style={{

                fontSize: "72px",

                margin: 0,

                fontWeight: "900",

                letterSpacing: "-3px",
              }}
            >
              $

              {
                result?.analysis?.total_spending
                  ?.toLocaleString()

                || "0"
              }
            </h1>

            <div
              style={{
                marginTop: "16px",
                color: "#22c55e",
              }}
            >
              AI optimization opportunities detected
            </div>

          </GlassCard>

          <GlassCard>

            <h2
              style={{
                marginTop: 0,
              }}
            >
              Activate AI Analysis
            </h2>

            <label
              style={{

                display: "inline-block",

                padding: "15px 20px",

                borderRadius: "16px",

                background:
                  "rgba(255,255,255,0.05)",

                cursor: "pointer",

                marginBottom: "18px",
              }}
            >

              Choose Financial Dataset

              <input

                type="file"

                accept=".csv"

                onChange={(e) =>
                  setFile(e.target.files[0])
                }

                style={{
                  display: "none",
                }}
              />

            </label>

            {
              file && (

                <div
                  style={{
                    marginBottom: "18px",
                    color: "#22c55e",
                  }}
                >
                  Dataset Loaded: {file.name}
                </div>
              )
            }

            <motion.button

              whileHover={{
                scale: 1.01,
              }}

              whileTap={{
                scale: 0.98,
              }}

              onClick={handleAnalyze}

              style={{

                width: "100%",

                padding: "18px",

                borderRadius: "18px",

                border: "none",

                background:
                  "linear-gradient(135deg,#7c3aed,#ec4899)",

                color: "white",

                fontWeight: "700",

                fontSize: "16px",

                cursor: "pointer",
              }}
            >

              {
                loading
                  ? "Analyzing..."
                  : "Analyze Financial System"
              }

            </motion.button>

          </GlassCard>

        </div>

        {/* ================================================= */}
        {/* METRICS */}
        {/* ================================================= */}

        <div

          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(4,1fr)",

            gap: "24px",

            marginBottom: "24px",
          }}
        >

          <MetricCard
            title="Transactions"
            value={
              result?.analysis?.total_transactions
              || 0
            }
          />

          <MetricCard
            title="Subscriptions"
            value={
              result?.analysis?.subscriptions_detected
              || 0
            }
          />

          <MetricCard
            title="Merchants"
            value={
              result?.analysis?.unique_merchants
              || 0
            }
          />

          <MetricCard
            title="Savings"
            value={`$${result?.analysis?.estimated_savings || 0}`}
            green
          />

        </div>

        {/* ================================================= */}
        {/* CHARTS */}
        {/* ================================================= */}

        <div

          style={{

            display: "grid",

            gridTemplateColumns:
              "1.5fr 1fr",

            gap: "24px",

            marginBottom: "24px",
          }}
        >

          {/* AREA */}

          <GlassCard>

            <SectionTitle
              title="Recurring Spend Timeline"
            />

            <ResponsiveContainer
              width="100%"
              height={360}
            >

              <AreaChart
                data={timelineData}
              >

                <defs>

                  <linearGradient
                    id="colorSpend"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#ec4899"
                      stopOpacity={0.7}
                    />

                    <stop
                      offset="95%"
                      stopColor="#7c3aed"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#ec4899"
                  fillOpacity={1}
                  fill="url(#colorSpend)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </GlassCard>

          {/* PIE */}

          <GlassCard>

            <SectionTitle
              title="Category Distribution"
            />

            <ResponsiveContainer
              width="100%"
              height={360}
            >

              <PieChart>

                <Pie

                  data={categoryData}

                  dataKey="value"

                  nameKey="name"

                  outerRadius={120}

                  label
                >

                  {
                    categoryData.map(
                      (entry, index) => (

                        <Cell

                          key={index}

                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />
                      )
                    )
                  }

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </GlassCard>

        </div>

        {/* ================================================= */}
        {/* BOTTOM */}
        {/* ================================================= */}

        <div

          style={{

            display: "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap: "24px",
          }}
        >

          {/* RADAR */}

          <GlassCard>

            <SectionTitle
              title="Subscription Risk Radar"
            />

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <RadarChart
                data={riskData}
              >

                <PolarGrid />

                <PolarAngleAxis
                  dataKey="subject"
                />

                <PolarRadiusAxis />

                <Radar
                  dataKey="A"
                  stroke="#ec4899"
                  fill="#7c3aed"
                  fillOpacity={0.6}
                />

              </RadarChart>

            </ResponsiveContainer>

          </GlassCard>

          {/* FRAUD */}

          <GlassCard>

            <SectionTitle
              title="Fraud & AI Anomalies"
            />

            <FraudCard

              title="Duplicate Subscription Risk"

              level={`${
                Math.min(

                  (
                    result?.analysis
                      ?.subscriptions_detected || 0
                  ) * 5,

                  100
                )
              }%`}
            />

            <FraudCard

              title="Price Escalation Pattern"

              level={`${
                Math.min(

                  Math.round(

                    (
                      result?.analysis
                        ?.estimated_savings || 0
                    ) / 50
                  ),

                  100
                )
              }%`}
            />

            <FraudCard

              title="Hidden Vendor Charges"

              level={`${
                Math.min(

                  (
                    result?.analysis
                      ?.unique_merchants || 0
                  ) * 4,

                  100
                )
              }%`}
            />

          </GlassCard>

        </div>

      </div>

    </div>
  )
}

// =====================================================
// SIDEBAR ITEM
// =====================================================

function SidebarItem({
  icon,
  title,
  active,
}) {

  return (

    <div

      style={{

        display: "flex",

        alignItems: "center",

        gap: "14px",

        padding: "15px 18px",

        borderRadius: "16px",

        marginBottom: "10px",

        cursor: "pointer",

        background:

          active
            ? "linear-gradient(135deg,#7c3aed,#ec4899)"
            : "transparent",

        color:
          active
            ? "white"
            : "#94a3b8",
      }}
    >

      {icon}

      {title}

    </div>
  )
}

// =====================================================
// GLASS CARD
// =====================================================

function GlassCard({ children }) {

  return (

    <motion.div

      whileHover={{
        y: -2,
      }}

      style={{

        background:
          "#0b1020",

        border:
          "1px solid rgba(255,255,255,0.05)",

        borderRadius: "26px",

        padding: "28px",

        boxShadow:
          "0 10px 40px rgba(0,0,0,0.35)",
      }}
    >

      {children}

    </motion.div>
  )
}

// =====================================================
// METRIC CARD
// =====================================================

function MetricCard({
  title,
  value,
  green,
}) {

  return (

    <GlassCard>

      <div
        style={{
          color: "#94a3b8",
          marginBottom: "14px",
        }}
      >
        {title}
      </div>

      <h1
        style={{

          margin: 0,

          fontSize: "52px",

          fontWeight: "900",

          letterSpacing: "-2px",

          color:
            green
              ? "#22c55e"
              : "white",
        }}
      >
        {value}
      </h1>

    </GlassCard>
  )
}

// =====================================================
// SECTION TITLE
// =====================================================

function SectionTitle({ title }) {

  return (

    <h2
      style={{

        marginTop: 0,

        marginBottom: "24px",

        fontSize: "20px",
      }}
    >
      {title}
    </h2>
  )
}

// =====================================================
// FRAUD CARD
// =====================================================

function FraudCard({
  title,
  level,
}) {

  return (

    <div

      style={{

        background:
          "rgba(255,255,255,0.03)",

        border:
          "1px solid rgba(255,255,255,0.05)",

        borderRadius: "18px",

        padding: "20px",

        marginBottom: "18px",
      }}
    >

      <div
        style={{

          display: "flex",

          justifyContent: "space-between",

          marginBottom: "14px",
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "10px",
          }}
        >

          <AlertTriangle
            size={18}
            color="#ec4899"
          />

          {title}

        </div>

        <div
          style={{
            color: "#22c55e",
            fontWeight: "700",
          }}
        >
          {level}
        </div>

      </div>

      <div
        style={{

          width: "100%",

          height: "10px",

          background:
            "rgba(255,255,255,0.08)",

          borderRadius: "999px",

          overflow: "hidden",
        }}
      >

        <div
          style={{

            width: level,

            height: "100%",

            background:
              "linear-gradient(to right,#7c3aed,#ec4899)",
          }}
        />

      </div>

    </div>
  )
}

export default App