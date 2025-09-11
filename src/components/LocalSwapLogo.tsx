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
    <div className={`inline-flex items-center gap-4 ${className}`}>
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg animate-float"
        >
          <defs>
            <linearGradient id="modernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="50%" stopColor="#4ecdc4" />
              <stop offset="100%" stopColor="#45b7d1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Sfondo moderno con glassmorphism */}
          <circle 
            cx="24" 
            cy="24" 
            r="20" 
            fill="url(#modernGradient)" 
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          
          {/* Icona moderna di scambio */}
          <g transform="translate(24, 24)">
            {/* Cerchio interno per movimento */}
            <circle cx="0" cy="0" r="12" fill="none" stroke="url(#accentGradient)" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="8s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Simbolo di scambio moderno */}
            <g stroke="url(#accentGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round">
              {/* Freccia curva sinistra */}
              <path d="M-8,-4 Q-4,-8 0,-4 Q4,-8 8,-4" />
              <path d="M-6,-6 L-8,-4 L-6,-2" />
              
              {/* Freccia curva destra */}
              <path d="M8,4 Q4,8 0,4 Q-4,8 -8,4" />
              <path d="M6,6 L8,4 L6,2" />
              
              {/* Punto centrale */}
              <circle cx="0" cy="0" r="2" fill="url(#accentGradient)" />
            </g>
          </g>
          
          {/* Particelle decorative animate */}
          <g opacity="0.8">
            <circle cx="8" cy="8" r="1.5" fill="#ffffff">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="12" r="1" fill="#ffffff">
              <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="12" cy="40" r="1.5" fill="#ffffff">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="36" cy="36" r="1" fill="#ffffff">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm animate-pulse"></div>
      </div>
      
      <div className="logo-text">
        <span className="logo-main font-bold text-white text-shadow">LocalSwap</span>
        <span className="logo-tagline text-white/90 font-medium">Scambi nel vicinato</span>
      </div>
    </div>
  )
}