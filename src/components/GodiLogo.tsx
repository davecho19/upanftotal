import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  lightMode?: boolean;
}

/**
 * UpConta Logo Component
 * Renders the official UpConta logo (Orange "Up", Navy "Conta" with orange arrow accent on 'a')
 */
export function UpContaLogo({
  size = "md",
  className = "",
  lightMode = false,
}: LogoProps) {
  const heightMap = {
    sm: "h-7 sm:h-8",
    md: "h-9 sm:h-11",
    lg: "h-12 sm:h-14",
    xl: "h-16 sm:h-18",
    "2xl": "h-20 sm:h-22",
  };

  const textColor = lightMode ? "#FFFFFF" : "#0B2545";

  return (
    <div className={`inline-flex items-center justify-center select-none ${heightMap[size] || "h-11"} ${className}`}>
      <svg
        viewBox="0 0 520 130"
        className="h-full w-auto max-w-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* "Up" in vibrant orange */}
        <text
          x="10"
          y="92"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
          fontWeight="900"
          fontSize="102"
          letterSpacing="-2"
          fill="#FF5500"
        >
          Up
        </text>

        {/* "Conta" in deep navy or white (lightMode) */}
        <text
          x="152"
          y="92"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
          fontWeight="900"
          fontSize="102"
          letterSpacing="-3"
          fill={textColor}
        >
          Conta
        </text>

        {/* Upward Orange Arrow Accent on 'a' */}
        <g transform="translate(426, 12)">
          {/* Outer corner orange arrow */}
          <path
            d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10"
            fill="none"
            stroke="#FF5500"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Arrowhead tip */}
          <path
            d="M 50,22 L 68,4 L 86,22"
            fill="none"
            stroke="#FF5500"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * ANF / Firmas Electrónicas.ec Logo Component
 * Renders the official "Firmas Electrónicas.ec by: anf" logo
 */
export function AnfLogo({
  size = "md",
  className = "",
  lightMode = false,
}: LogoProps) {
  const heightMap = {
    sm: "h-7 sm:h-8",
    md: "h-9 sm:h-11",
    lg: "h-12 sm:h-14",
    xl: "h-16 sm:h-18",
    "2xl": "h-20 sm:h-22",
  };

  const navyColor = lightMode ? "#FFFFFF" : "#00407A";
  const goldColor = "#E5A900";

  return (
    <div className={`inline-flex items-center justify-center select-none ${heightMap[size] || "h-11"} ${className}`}>
      <svg
        viewBox="0 0 620 180"
        className="h-full w-auto max-w-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized Electronic Circuit Symbol (Left Icon) */}
        <g transform="translate(15, 10)">
          {/* Vertical circuit lines & nodes */}
          <path d="M 25 35 L 25 15" stroke={navyColor} strokeWidth="6" strokeLinecap="round" />
          <rect x="20" y="5" width="10" height="10" fill={navyColor} />

          <path d="M 50 35 L 50 10 L 60 10" stroke={navyColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="60" y="5" width="10" height="10" fill={navyColor} />

          <path d="M 75 45 L 75 30 L 85 30" stroke={navyColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="85" y="25" width="10" height="10" fill={navyColor} />

          {/* Main trunk lines converging into V shape */}
          <path d="M 25 35 L 25 65 L 85 65 L 85 45" stroke={navyColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 50 35 L 50 75 L 70 75" stroke={navyColor} strokeWidth="7" strokeLinecap="round" />

          {/* V stylus tip */}
          <path d="M 20 80 L 52 135 L 84 80 Z" fill={navyColor} />
          <path d="M 32 80 L 52 115 L 72 80 Z" fill="#002D57" />
        </g>

        {/* Text: "Firmas" in Gold */}
        <text
          x="125"
          y="72"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
          fontWeight="900"
          fontSize="68"
          fill={goldColor}
        >
          Firmas
        </text>

        {/* Text: "Electrónicas" in Navy */}
        <text
          x="125"
          y="132"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
          fontWeight="900"
          fontSize="62"
          letterSpacing="-1"
          fill={navyColor}
        >
          Electrónicas
        </text>

        {/* Text: ".ec" in Gold */}
        <text
          x="500"
          y="132"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
          fontWeight="900"
          fontSize="36"
          fill={goldColor}
        >
          .ec
        </text>

        {/* Bottom Badge: "by: anf" */}
        <g transform="translate(300, 140)">
          <rect x="0" y="0" width="180" height="34" rx="10" fill={navyColor} />
          <text
            x="15"
            y="23"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
            fontWeight="700"
            fontSize="18"
            fill="#FFFFFF"
          >
            by:
          </text>
          <text
            x="52"
            y="24"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
            fontWeight="900"
            fontSize="22"
            letterSpacing="-0.5"
            fill="#FFFFFF"
          >
            anfac
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Co-Brand Logo Component (UpConta + ANF) for Simulador Tab
 */
export function CoBrandLogo({
  size = "md",
  className = "",
  lightMode = false,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 sm:gap-4 ${className}`}>
      <UpContaLogo size={size} lightMode={lightMode} />
      <div className={`h-8 w-[2px] rounded-full ${lightMode ? "bg-white/30" : "bg-slate-300"}`} />
      <AnfLogo size={size} lightMode={lightMode} />
    </div>
  );
}

/**
 * Main Logo Switcher according to current active tab
 */
export function DynamicBrandLogo({
  activeTab,
  size = "lg",
  className = "",
  lightMode = false,
}: {
  activeTab: "plan" | "explorador" | "simulador" | "firmas" | "ventas" | "contador";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  lightMode?: boolean;
}) {
  if (activeTab === "firmas") {
    return <AnfLogo size={size} className={className} lightMode={lightMode} />;
  }
  if (activeTab === "simulador" || activeTab === "ventas" || activeTab === "contador") {
    return <CoBrandLogo size={size} className={className} lightMode={lightMode} />;
  }
  // "plan" and "explorador"
  return <UpContaLogo size={size} className={className} lightMode={lightMode} />;
}

// Backward compatibility alias for any existing imports
export function GodiLogo({
  size = "md",
  className = "",
  lightMode = false,
}: LogoProps) {
  return <UpContaLogo size={size} className={className} lightMode={lightMode} />;
}
