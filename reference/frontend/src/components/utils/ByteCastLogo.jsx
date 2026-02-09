import React from 'react';

const ByteCastLogo = ({ width = "500px", height = "500px" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={width}
      height={height}
      style={{ fontFamily: "'Alfa Slab One', cursive", overflow: 'visible' }}
    >
      <defs>
        {/* 1. GOLD GRADIENT FOR TEXT FACE */}
        <linearGradient id="goldFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFED8A" />
          <stop offset="40%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        {/* 2. DARK BRONZE GRADIENT FOR 3D SIDES */}
        <linearGradient id="bronzeSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>

        {/* 3. SILVER GRADIENT FOR MIC */}
        <linearGradient id="silverMic" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BDC3C7" />
          <stop offset="50%" stopColor="#ECF0F1" />
          <stop offset="100%" stopColor="#7F8C8D" />
        </linearGradient>

        {/* 4. SHADOW FILTER FOR DEPTH */}
        <filter id="dropShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="4" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* --- GROUP 1: HEADPHONES (Back Layer) --- */}
      <g transform="translate(150, 40)">
        {/* Headband */}
        <path
          d="M 10,100 C 10,20 190,20 190,100"
          fill="none"
          stroke="#333"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Headband Inner Cushion */}
        <path
          d="M 10,100 C 10,35 190,35 190,100"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="5"
        />
        {/* Left Ear Cup */}
        <rect x="-10" y="90" width="40" height="70" rx="10" fill="#222" stroke="#D4AF37" strokeWidth="3" />
        {/* Right Ear Cup */}
        <rect x="170" y="90" width="40" height="70" rx="10" fill="#222" stroke="#D4AF37" strokeWidth="3" />
      </g>

      {/* --- GROUP 2: TEXT STACK --- */}
      <g transform="translate(100, 150)">
        
        {/* 'Byte' - 3D Extrusion (Back) */}
        <text x="50" y="55" fontSize="100" fill="url(#bronzeSide)" stroke="#3E2723" strokeWidth="2">Byte</text>
        {/* 'Byte' - Face (Front) */}
        <text x="45" y="50" fontSize="100" fill="url(#goldFace)" stroke="#B8860B" strokeWidth="1" filter="url(#dropShadow)">Byte</text>

        {/* 'CAST' - 3D Extrusion (Back) */}
        <text x="25" y="155" fontSize="120" fill="url(#bronzeSide)" stroke="#3E2723" strokeWidth="2">CAST</text>
        {/* 'CAST' - Face (Front) */}
        <text x="20" y="150" fontSize="120" fill="url(#goldFace)" stroke="#B8860B" strokeWidth="1" filter="url(#dropShadow)">CAST</text>

        {/* 'FM' - 3D Extrusion (Back) */}
        <text x="135" y="235" fontSize="60" fill="url(#bronzeSide)" stroke="#3E2723" strokeWidth="2">FM</text>
        {/* 'FM' - Face (Front) */}
        <text x="132" y="232" fontSize="60" fill="url(#goldFace)" stroke="#B8860B" strokeWidth="1" filter="url(#dropShadow)">FM</text>
      </g>

      {/* --- GROUP 3: MICROPHONE (Right Side) --- */}
      <g transform="translate(380, 160) rotate(10)">
        {/* Mic Stand/Cable Connection */}
        <path d="M 25,100 L 25,180 C 25,200 -50,220 -80,220" fill="none" stroke="#222" strokeWidth="6" />
        
        {/* Mic Body */}
        <rect x="0" y="0" width="50" height="100" rx="25" fill="url(#silverMic)" stroke="#555" strokeWidth="2" filter="url(#dropShadow)" />
        
        {/* Mic Grille Lines (Horizontal) */}
        <line x1="5" y1="20" x2="45" y2="20" stroke="#777" strokeWidth="2" />
        <line x1="5" y1="40" x2="45" y2="40" stroke="#777" strokeWidth="2" />
        <line x1="5" y1="60" x2="45" y2="60" stroke="#777" strokeWidth="2" />
        <line x1="5" y1="80" x2="45" y2="80" stroke="#777" strokeWidth="2" />
        
        {/* Mic Grille Lines (Vertical) */}
        <line x1="25" y1="10" x2="25" y2="90" stroke="#777" strokeWidth="2" />
      </g>

    </svg>
  );
};

export default ByteCastLogo;