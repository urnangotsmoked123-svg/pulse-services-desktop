import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  ReceiptText,
  Monitor,
  Settings,
  History,
  ShieldCheck,
  SlidersHorizontal,
  Broom,
  Search,
  FileText
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// ---- Color System (matched to screenshot) ----
const palette = {
  bg: "#0f1115",
  bgSidebar: "#0c0e12",
  card: "#181b22",
  stroke: "#20232b",
  text: "#e6e8ef",
  muted: "#a2a7b4",
  accent: "#5b62ff",
  accentSoft: "rgba(91,98,255,0.35)",
  ok: "#34d399",
  grayLine: "#8a909f"
};

const cls = (...a) => a.filter(Boolean).join(" ");

// Countdown to absolute date: 09/10/2025 (dd/mm/yyyy) Europe/London end-of-day
function useCountdownToExpiry() {
  const target = useMemo(() => {
    // UK format dd/mm/yyyy -> 9 Oct 2025 23:59:59 local
    const [dd, mm, yyyy] = "09/10/2025".split("/").map((n) => parseInt(n, 10));
    const d = new Date(yyyy, mm - 1, dd, 23, 59, 59);
    return d.getTime();
  }, []);
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((target - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(left / 3600).toString().padStart(2, "0");
  const m = Math.floor((left % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(left % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function useStreamingSeries() {
  const [pts, setPts] = useState([]);
  const tRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      tRef.current += 1;
      const t = tRef.current;
      const base = 35 + 25 * Math.sin(t / 3) + 8 * Math.sin(t / 1.7);
      const noise = (Math.random() - 0.5) * 12;
      const value = Math.max(10, Math.min(92, base + noise));
      setPts((prev) => {
        const x = prev.length ? prev[prev.length - 1].x + 1 : 0;
        const next = [...prev, { x, y: Math.round(value) }];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    }, 800);
    return () => clearInterval(id);
  }, []);
  return pts;
}

function TooltipBubble({ active, payload, coordinate }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${coordinate.x + 10}px, ${coordinate.y - 34}px)`,
        background: "#1f2430",
        color: "white",
        border: `1px solid #2b3140`,
        padding: "4px 8px",
        borderRadius: 8,
        fontSize: 12,
        pointerEvents: "none",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
      }}
    >
      {v}%
    </div>
  );
}

const SidebarItem = ({ label, icon: Icon, active }) => (
  <div
    className={cls(
      "flex items-center gap-3 rounded-xl px-3 h-10 text-sm transition",
      active ? "bg-[#181b22] border border-[#20232b]" : "hover:bg-[#181b22]/70"
    )}
    style={{ color: palette.text }}
  >
    <div
      className="flex items-center justify-center rounded-md"
      style={{ width: 26, height: 26, background: "#20232b" }}
    >
      <Icon size={16} color="#9aa0ab" />
    </div>
    <span>{label}</span>
  </div>
);

const Card = ({ title, value, subtitle }) => (
  <div
    className="rounded-2xl border w-full"
    style={{
      background: palette.card,
      borderColor: palette.stroke,
      boxShadow: "0 10px 30px rgba(0,0,0,.34)"
    }}
  >
    <div className="flex flex-col gap-1 p-4">
      <div style={{ color: palette.muted, fontSize: 14 }}>{title}</div>
      <div className="font-semibold" style={{ fontSize: 22, color: palette.text }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ color: palette.muted, fontSize: 13 }}>{subtitle}</div>
      )}
    </div>
  </div>
);

const UpdateLog = ({ items }) => (
  <div
    className="rounded-2xl border flex flex-col"
    style={{
      background: palette.card,
      borderColor: palette.stroke,
      boxShadow: "0 10px 30px rgba(0,0,0,.34)",
      minWidth: 360
    }}
  >
    <div className="p-4 pb-2 flex items-center gap-2">
      <FileText size={18} />
      <div className="font-semibold">Update Log</div>
    </div>
    <div className="px-2 pb-2 overflow-auto" style={{ maxHeight: 290 }}>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-2">
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 22, height: 22, background: palette.ok }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#0b1f14" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: palette.text }}>
              {it.title}
            </div>
            <div style={{ color: palette.muted, fontSize: 12 }}>{it.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UsageChart = () => {
  const pts = useStreamingSeries();
  const past = pts.slice(0, Math.max(0, pts.length - 15));
  const future = pts.slice(Math.max(0, pts.length - 15));
  const data = useMemo(() => pts.map((p) => ({ seconds: p.x, value: p.y })), [pts]);

  return (
    <div
      className="rounded-2xl border"
      style={{ background: palette.card, borderColor: palette.stroke, boxShadow: "0 10px 30px rgba(0,0,0,.34)" }}
    >
      <div className="p-4 pb-2 font-semibold" style={{ color: palette.text }}>
        Total Hours Using Pulse
      </div>
      <div className="px-2 pb-2 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.accent} stopOpacity={0.55} />
                <stop offset="100%" stopColor={palette.accent} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis hide dataKey="seconds" axisLine={{ stroke: palette.stroke }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke={palette.stroke}
              tick={{ fill: palette.muted, fontSize: 12 }}
            />
            <Tooltip content={<TooltipBubble />} cursor={{ stroke: palette.stroke }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={palette.accent}
              fill="url(#fillBlue)"
              strokeWidth={2}
              isAnimationActive={false}
              data={past.map((p) => ({ seconds: p.x, value: p.y }))}
            />
            <Line
              type="monotone"
              dataKey="value"
              data={future.map((p) => ({ seconds: p.x, value: p.y }))}
              stroke={palette.grayLine}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 pb-4 text-[11px]" style={{ color: palette.muted }}>
        60 seconds &nbsp;&nbsp;&nbsp;&nbsp; 45 seconds &nbsp;&nbsp;&nbsp;&nbsp; 30 seconds
        &nbsp;&nbsp;&nbsp;&nbsp; 15 seconds &nbsp;&nbsp;&nbsp;&nbsp; 0 seconds
      </div>
    </div>
  );
};

export default function PulseServices() {
  const timeLeft = useCountdownToExpiry(); // countdown to 09/10/2025
  const [query, setQuery] = useState("");
  const sidebarGroups = [
    {
      label: "General",
      items: [
        { label: "Home", icon: Home },
        { label: "Serials Checker", icon: ReceiptText },
        { label: "PC Specs", icon: Monitor }
      ]
    },
    {
      label: "Main",
      items: [
        { label: "General", icon: Settings },
        { label: "Restore Point", icon: History },
        { label: "Virus Protection", icon: ShieldCheck }
      ]
    },
    {
      label: "Tweaking",
      items: [
        { label: "General Tweaks", icon: SlidersHorizontal },
        { label: "Debloat", icon: Broom }
      ]
    }
  ];

  const filtered = (items) =>
    items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  const [log, setLog] = useState([
    { title: "Security Checks", subtitle: "Virus Free And Security Safe" }
  ]);

  const addLog = (title, subtitle) => setLog((l) => [{ title, subtitle }, ...l]);

  return (
    <div
      className="w-screen h-screen"
      style={{ background: palette.bg, color: palette.text, fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className="flex flex-col gap-2 p-3 border-r"
          style={{ width: 224, background: palette.bgSidebar, borderColor: palette.stroke }}
        >
          <div className="font-extrabold leading-5 tracking-wider text-sm">
            PULSE
            <br />
            SERVICES
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl border px-3 h-10"
            style={{ background: palette.card, borderColor: palette.stroke }}
          >
            <Search size={16} color={palette.muted} />
            <input
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Search Anything"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ color: palette.text }}
            />
          </div>

          {sidebarGroups.map((g, gi) => (
            <div key={gi} className="mt-2">
              <div className="text-[12px] mb-1" style={{ color: palette.muted }}>
                {g.label}
              </div>
              <div className="flex flex-col gap-1">
                {filtered(g.items).map((it, i) => (
                  <button key={i} onClick={() => addLog(`Opened ${it.label}`, "Action executed") }>
                    <div>
                      <div className={cls(
                        "flex items-center gap-3 rounded-xl px-3 h-10 text-sm transition",
                        gi === 0 && i === 0 ? "bg-[#181b22] border border-[#20232b]" : "hover:bg-[#181b22]/70"
                      )}
                      style={{ color: palette.text }}>
                        <div
                          className="flex items-center justify-center rounded-md"
                          style={{ width: 26, height: 26, background: "#20232b" }}
                        >
                          <it.icon size={16} color="#9aa0ab" />
                        </div>
                        <span>{it.label}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-auto" />
          {/* Footer profile */}
          <div
            className="rounded-xl border p-2 flex items-center gap-3"
            style={{ background: palette.card, borderColor: palette.stroke }}
          >
            <div
              className="rounded-full flex items-center justify-center text-xs font-bold"
              style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2a2f3a,#1c212b)", color: "#e5e7eb" }}
            >
              L
            </div>
            <div className="leading-4">
              <div className="text-[13px] font-semibold">Lenny</div>
              <div className="text-[12px]" style={{ color: palette.muted }}>
                Premium User
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-6 pl-6">
          <div className="mb-4">
            <div className="text-[16px] font-semibold">Welcome Back, Lenny</div>
            <div className="text-sm" style={{ color: palette.muted }}>
              Thank you for choosing Pulse Services!
            </div>
          </div>

          {/* Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card title="Membership" value="Premium" />
            <Card title="Time Left:" value={timeLeft} />
            <Card title="Expiry Date" value="09/10/2025" />
          </div>

          {/* Lower split */}
          <div className="mt-4 grid grid-cols-[1fr_360px] gap-4 items-start">
            <UsageChart />
            <UpdateLog items={log} />
          </div>
        </div>
      </div>
    </div>
  );
}
