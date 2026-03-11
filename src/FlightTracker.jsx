import { useState, useEffect } from "react";

// ── Flight data (all times in UTC) ──────────────────────────────────────────
const FLIGHTS = [
  {
    id: 1,
    airline: "AIR INDIA",
    flightNo: "AI 2433",
    from: "DEL",
    fromCity: "New Delhi",
    to: "BOM",
    toCity: "Mumbai",
    dep: new Date("2026-03-11T16:00:00Z"), // 21:30 IST
    arr: new Date("2026-03-11T18:25:00Z"), // 23:55 IST
    terminal: "T3 → T2",
    seat: "28E",
    color: "#e8734a",
  },
  {
    id: 2,
    airline: "KENYA AIRWAYS",
    flightNo: "KQ 205",
    from: "BOM",
    fromCity: "Mumbai",
    to: "NBO",
    toCity: "Nairobi",
    dep: new Date("2026-03-12T01:15:00Z"), // 06:45 IST
    arr: new Date("2026-03-12T07:30:00Z"), // 10:30 EAT
    terminal: "T2",
    seat: "21G",
    color: "#4ab5e8",
  },
];

const HOME_ARR = FLIGHTS[1].arr;

// ── Pixel art helpers ────────────────────────────────────────────────────────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 97.3) % 55,
  delay: (i * 0.4) % 3,
  size: i % 3 === 0 ? 3 : 2,
}));

const CLOUDS = [
  { x: 12, y: 18, w: 48, h: 20 },
  { x: 55, y: 10, w: 36, h: 16 },
  { x: 72, y: 28, w: 44, h: 18 },
  { x: 28, y: 32, w: 30, h: 14 },
];

function PixelCloud({ x, y, w, h, opacity = 0.18 }) {
  return (
    <rect
      x={`${x}%`} y={`${y}%`} width={w} height={h}
      rx="0" fill="white" opacity={opacity}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function PixelPlane({ progress, color, flip }) {
  // Convert to real viewBox coords (800 x 180)
  const px = (4 + progress * 88) * 800 / 100; // pixels across
  const py = 75; // fixed vertical position in the sky
  const scale = flip ? -1 : 1;
  return (
    <g transform={`translate(${px}, ${py}) scale(${scale},1)`} style={{ transition: "all 2s linear" }}>
      <g style={{ animation: "bob 2.4s ease-in-out infinite" }}>
      {/* fuselage */}
      <rect x="-14" y="-4" width="28" height="8" fill={color} />
      {/* nose */}
      <rect x="14" y="-2" width="6" height="4" fill={color} />
      {/* tail */}
      <rect x="-20" y="-8" width="8" height="4" fill={color} />
      <rect x="-20" y="4" width="6" height="4" fill={color} />
      {/* wing */}
      <rect x="-6" y="-10" width="14" height="6" fill={color} />
      <rect x="-6" y="4" width="14" height="6" fill={color} />
      {/* window */}
      <rect x="2" y="-2" width="4" height="4" fill="#ffffffaa" />
      <rect x="-4" y="-2" width="4" height="4" fill="#ffffff66" />
      </g>
    </g>
  );
}

function PixelDino() {
  return (
    <g>
      {/* body */}
      <rect x="0" y="8" width="16" height="14" fill="#d4856a" />
      {/* head */}
      <rect x="10" y="0" width="12" height="10" fill="#d4856a" />
      {/* eye */}
      <rect x="18" y="2" width="3" height="3" fill="#1c1208" />
      {/* mouth */}
      <rect x="20" y="7" width="4" height="2" fill="#1c1208" />
      {/* legs */}
      <rect x="2" y="22" width="5" height="8" fill="#d4856a" />
      <rect x="10" y="22" width="5" height="8" fill="#d4856a" />
      {/* tail */}
      <rect x="-6" y="12" width="8" height="6" fill="#d4856a" />
      <rect x="-10" y="14" width="6" height="4" fill="#d4856a" />
    </g>
  );
}

// ── Countdown formatter ──────────────────────────────────────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return { h: "00", m: "00", s: "00", done: true };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    done: false,
  };
}

// ── Status logic ─────────────────────────────────────────────────────────────
function getStatus(now) {
  if (now < FLIGHTS[0].dep) return { phase: "PRE_FLIGHT", flight: null, label: "AWAITING DEPARTURE", sub: "DEL → BOM boarding soon" };
  if (now >= FLIGHTS[0].dep && now < FLIGHTS[0].arr) return { phase: "FLYING_1", flight: FLIGHTS[0], label: "IN THE AIR", sub: "DEL → BOM" };
  if (now >= FLIGHTS[0].arr && now < FLIGHTS[1].dep) return { phase: "LAYOVER", flight: null, label: "LAYOVER", sub: "Mumbai · Chhatrapati Shivaji Maharaj" };
  if (now >= FLIGHTS[1].dep && now < FLIGHTS[1].arr) return { phase: "FLYING_2", flight: FLIGHTS[1], label: "HOMEBOUND", sub: "BOM → NBO" };
  return { phase: "LANDED", flight: null, label: "WELCOME HOME", sub: "Nairobi · Jomo Kenyatta" };
}

function getFlightProgress(now, flight) {
  if (!flight) return 0;
  const total = flight.arr - flight.dep;
  const elapsed = now - flight.dep;
  return Math.min(1, Math.max(0, elapsed / total));
}

// ── Styles (pixel art theme) ─────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; image-rendering: pixelated; }

  body {
    background: #1c1208;
    font-family: 'Press Start 2P', monospace;
    color: #f5e6c8;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .tracker {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 16px 40px;
  }

  /* ── Header ── */
  .header {
    text-align: center;
    margin-bottom: 28px;
  }
  .header h1 {
    font-size: 11px;
    letter-spacing: 4px;
    color: #f5e6c8;
    text-shadow: 2px 2px 0 #6b3a1f;
    margin-bottom: 6px;
  }
  .header .sub {
    font-size: 7px;
    color: #7a5c3c;
    letter-spacing: 2px;
  }
  .pixel-divider {
    height: 2px;
    background: repeating-linear-gradient(90deg, #7a5c3c 0 6px, transparent 6px 10px);
    margin: 12px 0;
  }

  /* ── Sky strip ── */
  .sky-strip {
    background: #0d0a00;
    border: 2px solid #3d2b14;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .sky-svg { display: block; width: 100%; }

  /* star twinkle */
  @keyframes twinkle {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.2; }
  }

  /* plane bob */
  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  /* ground dino walk */
  @keyframes dinoWalk {
    0%   { transform: translate(0, 0); }
    25%  { transform: translate(2px, -2px); }
    50%  { transform: translate(0, 0); }
    75%  { transform: translate(-2px, -2px); }
  }

  /* ── Status banner ── */
  .status-banner {
    border: 2px solid currentColor;
    padding: 14px 18px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
  }
  .status-dot {
    width: 10px; height: 10px;
    flex-shrink: 0;
  }
  .status-label {
    font-size: 9px;
    letter-spacing: 3px;
  }
  .status-sub {
    font-size: 6px;
    opacity: 0.65;
    margin-top: 5px;
    letter-spacing: 1px;
  }
  .blink { animation: blink 1.1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Progress bar ── */
  .progress-wrap {
    margin-top: 10px;
    height: 10px;
    background: #1c1208;
    border: 2px solid currentColor;
  }
  .progress-fill {
    height: 100%;
    transition: width 1s linear;
    background: currentColor;
    position: relative;
  }

  /* ── Countdown ── */
  .countdown-wrap {
    text-align: center;
    margin-bottom: 22px;
    padding: 16px;
    background: #0d0900;
    border: 2px solid #3d2b14;
  }
  .countdown-label {
    font-size: 6px;
    letter-spacing: 3px;
    color: #7a5c3c;
    margin-bottom: 12px;
  }
  .countdown-digits {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }
  .digit-block {
    background: #1c1208;
    border: 2px solid #7a5c3c;
    padding: 10px 12px;
    min-width: 56px;
    text-align: center;
  }
  .digit-val {
    font-size: 20px;
    color: #4ab5e8;
    text-shadow: 0 0 8px #4ab5e866;
    display: block;
  }
  .digit-unit {
    font-size: 5px;
    color: #7a5c3c;
    display: block;
    margin-top: 5px;
    letter-spacing: 1px;
  }
  .colon {
    font-size: 22px;
    color: #7a5c3c;
    margin-bottom: 10px;
    animation: blink 1s step-end infinite;
  }

  /* ── Flight cards ── */
  .flights-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
  }
  @media (max-width: 560px) {
    .flights-row { grid-template-columns: 1fr; }
  }

  .flight-card {
    border: 2px solid;
    padding: 14px;
    position: relative;
    background: #0d0900;
  }
  .flight-card .airline {
    font-size: 5px;
    letter-spacing: 2px;
    opacity: 0.7;
    margin-bottom: 8px;
  }
  .flight-card .flight-no {
    font-size: 13px;
    margin-bottom: 10px;
  }
  .route-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .iata {
    font-size: 16px;
    line-height: 1;
  }
  .arrow-px {
    flex: 1;
    height: 2px;
    background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px);
  }
  .times-row {
    display: flex;
    justify-content: space-between;
    font-size: 7px;
    color: #f5e6c8;
    opacity: 0.75;
    margin-bottom: 6px;
  }
  .card-meta {
    font-size: 5px;
    color: #7a5c3c;
    letter-spacing: 1px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .active-glow {
    box-shadow: 0 0 0 1px currentColor, 0 0 14px currentColor33;
    animation: cardPulse 2s ease-in-out infinite;
  }
  @keyframes cardPulse {
    0%, 100% { box-shadow: 0 0 0 1px currentColor, 0 0 10px currentColor22; }
    50%       { box-shadow: 0 0 0 2px currentColor, 0 0 22px currentColor55; }
  }
  .done-overlay {
    position: absolute;
    inset: 0;
    background: #0d090099;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .done-text {
    font-size: 7px;
    color: #7a5c3c;
    letter-spacing: 2px;
    transform: rotate(-12deg);
  }

  /* ── Footer ── */
  .footer {
    text-align: center;
    font-size: 6px;
    color: #3d2b14;
    letter-spacing: 2px;
    margin-top: 10px;
  }
`;

// ── Main Component ────────────────────────────────────────────────────────────
export default function FlightTracker() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = getStatus(now);
  const msToHome = Math.max(0, HOME_ARR - now);
  const cd = formatCountdown(msToHome);

  const flying1 = status.phase === "FLYING_1";
  const flying2 = status.phase === "FLYING_2";
  const inAir = flying1 || flying2;
  const activeFlight = flying1 ? FLIGHTS[0] : flying2 ? FLIGHTS[1] : null;
  const progress = activeFlight ? getFlightProgress(now, activeFlight) : 0;

  // Star blink offset
  const phase = status.phase;

  // Sky bg color based on phase
  const skyGrad = flying2
    ? "url(#skyGrad2)"
    : flying1
    ? "url(#skyGrad1)"
    : status.phase === "LAYOVER"
    ? "url(#skyGradNight)"
    : status.phase === "LANDED"
    ? "url(#skyGradDay)"
    : "url(#skyGradNight)";

  // Status colors
  const statusColor =
    flying1 ? "#e8734a"
    : flying2 ? "#4ab5e8"
    : status.phase === "LAYOVER" ? "#c8a85c"
    : status.phase === "LANDED" ? "#6bcc7a"
    : "#7a5c3c";

  return (
    <>
      <style>{css}</style>
      <div className="tracker">
        {/* ── Header ── */}
        <div className="header">
          <h1>✈ FLIGHT TRACKER</h1>
          <div className="sub">OSIEMO / SIMEON KENGERE · MAR 11–12 2026</div>
          <div className="pixel-divider" />
        </div>

        {/* ── Sky strip ── */}
        <div className="sky-strip">
          <svg className="sky-svg" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyGradNight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#050310" />
                <stop offset="100%" stopColor="#1a0e00" />
              </linearGradient>
              <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#150a1a" />
                <stop offset="100%" stopColor="#2a1800" />
              </linearGradient>
              <linearGradient id="skyGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#061420" />
                <stop offset="100%" stopColor="#1a1208" />
              </linearGradient>
              <linearGradient id="skyGradDay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a1e2a" />
                <stop offset="100%" stopColor="#1c2010" />
              </linearGradient>
            </defs>

            {/* sky bg */}
            <rect width="800" height="180" fill={skyGrad} />

            {/* stars */}
            {STARS.map((s, i) => (
              <rect
                key={i}
                x={s.x * 8} y={s.y * 1.8}
                width={s.size} height={s.size}
                fill="#f5e6c8"
                opacity={inAir && flying2 ? 0.15 : 0.7}
                style={{
                  animation: `twinkle ${2 + s.delay}s ${s.delay}s ease-in-out infinite`,
                }}
              />
            ))}

            {/* moon (pixel crescent) – visible at night */}
            {!flying2 && status.phase !== "LANDED" && (
              <g transform="translate(700, 24)">
                <rect x="0"  y="0"  width="8"  height="8"  fill="#f5e6c8" />
                <rect x="8"  y="0"  width="8"  height="8"  fill="#f5e6c8" />
                <rect x="16" y="0"  width="8"  height="8"  fill="#f5e6c8" />
                <rect x="-8" y="8"  width="8"  height="8"  fill="#f5e6c8" />
                <rect x="24" y="8"  width="8"  height="8"  fill="#f5e6c8" />
                <rect x="-8" y="16" width="8"  height="8"  fill="#f5e6c8" />
                <rect x="24" y="16" width="8"  height="8"  fill="#f5e6c8" />
                <rect x="0"  y="24" width="8"  height="8"  fill="#f5e6c8" />
                <rect x="8"  y="24" width="8"  height="8"  fill="#f5e6c8" />
                <rect x="16" y="24" width="8"  height="8"  fill="#f5e6c8" />
                {/* inner cutout */}
                <rect x="0"  y="8"  width="24" height="16" fill="#050310" />
                <rect x="8"  y="0"  width="8"  height="8"  fill="#050310" />
                <rect x="8"  y="24" width="8"  height="8"  fill="#050310" />
              </g>
            )}

            {/* pixel clouds */}
            {CLOUDS.map((c, i) => (
              <PixelCloud key={i} {...c} opacity={flying2 ? 0.08 : 0.14} />
            ))}

            {/* ground line */}
            <rect x="0" y="155" width="800" height="2" fill="#3d2b14" />
            {/* ground dots */}
            {Array.from({ length: 80 }, (_, i) => (
              <rect key={i} x={i * 10} y="157" width="4" height="2" fill="#2a1800" />
            ))}

            {/* plane or dino */}
            {inAir ? (
              <PixelPlane
                progress={progress}
                color={activeFlight?.color}
                flip={false}
              />
            ) : (
              <g transform="translate(60, 122)">
                <g style={{ animation: "dinoWalk 0.5s steps(1) infinite" }}>
                  <PixelDino />
                </g>
              </g>
            )}

            {/* route dots on ground when not in air */}
            {!inAir && (
              <>
                <text x="40" y="152" fill="#7a5c3c" fontSize="7" fontFamily="'Press Start 2P', monospace">DEL</text>
                <text x="370" y="152" fill="#7a5c3c" fontSize="7" fontFamily="'Press Start 2P', monospace">BOM</text>
                <text x="720" y="152" fill="#7a5c3c" fontSize="7" fontFamily="'Press Start 2P', monospace">NBO</text>
              </>
            )}
            {inAir && (
              <>
                <text x={flying1 ? 8 : 8} y="148" fill="#3d2b14" fontSize="6" fontFamily="'Press Start 2P', monospace">
                  {activeFlight?.from}
                </text>
                <text x={flying1 ? 744 : 744} y="148" fill="#3d2b14" fontSize="6" fontFamily="'Press Start 2P', monospace">
                  {activeFlight?.to}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* ── Status banner ── */}
        <div className="status-banner" style={{ color: statusColor, borderColor: statusColor }}>
          <svg className="status-dot" viewBox="0 0 10 10">
            <rect x="0" y="0" width="10" height="10" fill={statusColor} className={inAir ? "blink" : ""} />
          </svg>
          <div>
            <div className="status-label">{status.label}</div>
            <div className="status-sub">{status.sub}</div>
            {inAir && activeFlight && (
              <div className="progress-wrap" style={{ marginTop: 10, color: statusColor }}>
                <div
                  className="progress-fill"
                  style={{ width: `${progress * 100}%`, color: statusColor }}
                />
              </div>
            )}
            {inAir && (
              <div style={{ fontSize: 5, color: statusColor, opacity: 0.7, marginTop: 5, letterSpacing: 1 }}>
                FLIGHT PROGRESS: {Math.round(progress * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* ── Countdown ── */}
        <div className="countdown-wrap">
          <div className="countdown-label">
            {cd.done ? "▶ YOU ARE HOME ◀" : "▶ TIME UNTIL NAIROBI ◀"}
          </div>
          {!cd.done ? (
            <div className="countdown-digits">
              <div className="digit-block">
                <span className="digit-val">{cd.h}</span>
                <span className="digit-unit">HRS</span>
              </div>
              <span className="colon">:</span>
              <div className="digit-block">
                <span className="digit-val">{cd.m}</span>
                <span className="digit-unit">MIN</span>
              </div>
              <span className="colon">:</span>
              <div className="digit-block">
                <span className="digit-val">{cd.s}</span>
                <span className="digit-unit">SEC</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#6bcc7a", textAlign: "center", textShadow: "0 0 12px #6bcc7a88" }}>
              KARIBU NYUMBANI
            </div>
          )}
        </div>

        {/* ── Flight cards ── */}
        <div className="flights-row">
          {FLIGHTS.map((f, i) => {
            const isActive =
              (i === 0 && flying1) || (i === 1 && flying2);
            const isDone =
              (i === 0 && now >= f.arr) || (i === 1 && now >= f.arr);
            const depLocal = f.dep.toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: i === 0 ? "Asia/Kolkata" : "Asia/Kolkata",
            });
            const arrLocal = f.arr.toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: i === 1 ? "Africa/Nairobi" : "Asia/Kolkata",
            });
            const depDate = f.dep.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: i === 0 ? "Asia/Kolkata" : "Asia/Kolkata" });
            const arrTZ = i === 1 ? "EAT" : "IST";

            return (
              <div
                key={f.id}
                className={`flight-card${isActive ? " active-glow" : ""}`}
                style={{ borderColor: f.color, color: f.color }}
              >
                <div className="airline">{f.airline}</div>
                <div className="flight-no">{f.flightNo}</div>
                <div className="route-row">
                  <span className="iata">{f.from}</span>
                  <div className="arrow-px" />
                  <span className="iata">{f.to}</span>
                </div>
                <div className="times-row">
                  <span>{depLocal} IST</span>
                  <span>{arrLocal} {arrTZ}</span>
                </div>
                <div className="card-meta">
                  <span>SEAT {f.seat}</span>
                  <span>{f.terminal}</span>
                  <span>{depDate}</span>
                </div>
                {isDone && !isActive && (
                  <div className="done-overlay">
                    <span className="done-text">COMPLETED ✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="pixel-divider" />
        <div className="footer">BOOKING REF: 7S5HMB · KQ205 + AI2433 · NAIROBI HOME ♥</div>
      </div>
    </>
  );
}
