import React from 'react'

interface LocalSwapLogoProps {
  size?: number
  className?: string
}

export const LocalSwapLogo: React.FC<LocalSwapLogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Sfondo circolare con gradiente */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0fdf4" />
          </linearGradient>
        </defs>
        
        {/* Cerchio di sfondo */}
        <circle 
          cx="20" 
          cy="20" 
          r="18" 
          fill="url(#bgGradient)" 
          stroke="rgba(255,255,255,0.3)" 
          strokeWidth="1"
        />
        
        {/* Casa stilizzata al centro */}
        <g transform="translate(8, 8)">
          {/* Tetto */}
          <path 
            d="M12 4L20 10L20 8L22 8L22 12L20 12L20 22L4 22L4 10L12 4Z" 
            fill="url(#iconGradient)"
            transform="scale(0.6) translate(2, 2)"
          />
          
          {/* Porta */}
          <rect 
            x="10" 
            y="16" 
            width="4" 
            height="6" 
            fill="rgba(255,255,255,0.9)"
            rx="0.5"
            transform="scale(0.6) translate(2, 2)"
          />
          
          {/* Finestre */}
          <rect 
            x="6" 
            y="13" 
            width="3" 
            height="3" 
            fill="rgba(255,255,255,0.9)"
            rx="0.3"
            transform="scale(0.6) translate(2, 2)"
          />
          <rect 
            x="15" 
            y="13" 
            width="3" 
            height="3" 
            fill="rgba(255,255,255,0.9)"
            rx="0.3"
            transform="scale(0.6) translate(2, 2)"
          />
        </g>
        
        {/* Frecce di scambio */}
        <g transform="translate(20, 20)">
          {/* Freccia sinistra */}
          <path 
            d="M-10 -2 L-6 -6 L-6 -3 L-2 -3 L-2 -1 L-6 -1 L-6 2 Z" 
            fill="rgba(255,255,255,0.9)"
          />
          
          {/* Freccia destra */}
          <path 
            d="M10 2 L6 6 L6 3 L2 3 L2 1 L6 1 L6 -2 Z" 
            fill="rgba(255,255,255,0.9)"
          />
        </g>
        
        {/* Punti decorativi */}
        <circle cx="8" cy="12" r="1.5" fill="rgba(255,255,255,0.6)" />
        <circle cx="32" cy="28" r="1.5" fill="rgba(255,255,255,0.6)" />
        <circle cx="12" cy="32" r="1" fill="rgba(255,255,255,0.4)" />
        <circle cx="28" cy="8" r="1" fill="rgba(255,255,255,0.4)" />
      </svg>
      
      <div className="logo-text">
        <span className="logo-main">LocalSwap</span>
        <span className="logo-tagline">Scambi nel vicinato</span>
      </div>
    </div>
  )
}