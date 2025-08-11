import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// A single-file, production-ready 404 page with animated SVG + motion effects.
// Works standalone. If you use React Router, you can swap the <a> with <Link to="/"/>.

export default function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.12 },
    },
  };

  const charVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 18 },
    },
  };

  const float = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const slowSpin = {
    animate: {
      rotate: [0, 360],
      transition: { duration: 40, repeat: Infinity, ease: "linear" },
    },
  };

  const text = "404".split("");

  return (
    <div style={styles.wrapper}>
      {/* Local styles for keyframes & responsive tweaks */}
      <style>{css}</style>

      {/* Subtle noise layer */}
      <div style={styles.noise} aria-hidden />

      {/* Background decorative stars */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
      </svg>
      <div style={styles.stars} aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="star" style={randomStar(i)} />
        ))}
      </div>

      {/* Content card */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={styles.card}
        role="main"
        aria-labelledby="nf-title"
      >
        {/* Animated big 404 */}
        <div style={styles.big404} aria-hidden>
          {text.map((c, i) => (
            <motion.span
              key={i}
              variants={charVariants}
              className="big404-char"
            >
              {c}
            </motion.span>
          ))}
        </div>

        {/* SVG illustration: planet + ring + satellite */}
        <div style={styles.illustration} aria-hidden>
          <motion.svg
            width="260"
            height="200"
            viewBox="0 0 260 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...float}
          >
            {/* Planet */}
            <defs>
              <linearGradient id="planetGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff8a00" />
                <stop offset="100%" stopColor="#ff4d00" />
              </linearGradient>
            </defs>
            <g>
              <circle cx="130" cy="105" r="52" fill="url(#planetGrad)" />
              {/* craters */}
              <circle cx="112" cy="95" r="8" fill="rgba(255,255,255,.25)" />
              <circle cx="146" cy="116" r="6" fill="rgba(255,255,255,.18)" />
              <circle cx="135" cy="86" r="4" fill="rgba(255,255,255,.18)" />
            </g>

            {/* Planet ring */}
            <g filter="url(#filter0)" opacity="0.9">
              <ellipse
                cx="130"
                cy="105"
                rx="92"
                ry="22"
                stroke="white"
                strokeWidth="3"
              />
            </g>

            {/* Tiny satellite */}
            <motion.g {...slowSpin} style={{ transformOrigin: "130px 105px" }}>
              <circle cx="210" cy="105" r="6" fill="#ffffff" />
              <rect
                x="204"
                y="98"
                width="12"
                height="3"
                rx="1.5"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="204"
                y="109"
                width="12"
                height="3"
                rx="1.5"
                fill="#ffffff"
                opacity="0.8"
              />
            </motion.g>

            {/* Filters */}
            <defs>
              <filter
                id="filter0"
                x="30"
                y="75"
                width="200"
                height="60"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
            </defs>
          </motion.svg>
        </div>

        {/* Texts */}
        <motion.h1 id="nf-title" variants={charVariants} style={styles.title}>
          Oops! Sahifa topilmadi
        </motion.h1>
        <motion.p variants={charVariants} style={styles.subtitle}>
          Siz qidirayotgan manzil mavjud emas yoki ko‘chirib yuborilgan.
        </motion.p>

        {/* Actions */}
        <motion.div variants={charVariants} style={styles.actions}>
          <Link to="/" style={{ ...styles.button, ...styles.primaryBtn }}>
            🏠 Bosh sahifa
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{ ...styles.button, ...styles.ghostBtn }}
          >
            ◀️ Orqaga
          </button>
        </motion.div>
      </motion.main>

      {/* Footer note */}
      <footer style={styles.footer}>
        <span>Code: 404 · Not Found</span>
      </footer>
    </div>
  );
}

// Random star positions/styles
function randomStar(seed) {
  const rand = (x) => {
    const s = Math.sin(x * 9999) * 10000;
    return s - Math.floor(s);
  };
  const top = rand(seed + 1) * 100;
  const left = rand(seed + 2) * 100;
  const size = 2 + Math.round(rand(seed + 3) * 2);
  const delay = rand(seed + 4) * 3;
  return {
    top: `${top}%`,
    left: `${left}%`,
    width: size,
    height: size,
    animationDelay: `${delay}s`,
  };
}

const styles = {
  wrapper: {
    position: "relative",
    minHeight: "90vh",
    overflow: "hidden",
    color: "#0f172a",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #111827 100%)",
  },
  noise: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.04), transparent 35%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.03), transparent 35%)",
    mixBlendMode: "overlay",
  },
  stars: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    margin: "0 auto",
    maxWidth: 760,
    padding: "96px 24px 72px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  big404: {
    display: "flex",
    gap: 12,
    fontSize: "clamp(72px, 16vw, 200px)",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #ff8a00, #ff4d00)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter: "drop-shadow(0 8px 30px rgba(255,100,0,.25))",
  },
  illustration: {
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    margin: "8px 0 6px",
    fontSize: "clamp(20px, 3.2vw, 32px)",
    fontWeight: 700,
    color: "#e5e7eb",
  },
  subtitle: {
    margin: 0,
    maxWidth: 660,
    color: "#cbd5e1",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  button: {
    border: 0,
    outline: 0,
    cursor: "pointer",
    padding: "12px 18px",
    borderRadius: 999,
    fontWeight: 700,
    textDecoration: "none",
    transition: "transform .2s ease, box-shadow .2s ease",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #ff8a00, #ff4d00)",
    color: "white",
    boxShadow: "0 8px 24px rgba(255,100,0,.35)",
  },
  ghostBtn: {
    background: "rgba(255,255,255,.08)",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,.12)",
    backdropFilter: "blur(4px)",
  },
  footer: {
    position: "absolute",
    insetInline: 0,
    bottom: 16,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    opacity: 0.8,
  },
};

const css = `
  .big404-char { display:inline-block; }
  .star {
    position:absolute;
    display:block;
    border-radius:50%;
    background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,.6) 60%, rgba(255,255,255,0) 70%);
    animation: twinkle 3.2s infinite ease-in-out;
    box-shadow: 0 0 10px rgba(255,255,255,.5);
  }
  .star::after { content:""; position:absolute; inset:-6px; background: radial-gradient(circle, rgba(255,255,255,.25), transparent 60%); border-radius:50%; filter: blur(4px); }

  @keyframes twinkle {
    0%, 100% { opacity:.5; transform: translateY(0) scale(1); }
    50% { opacity:1; transform: translateY(-2px) scale(1.05); }
  }

  @media (max-width: 520px) {
    button, a { width: 100%; text-align: center; }
  }
`;
