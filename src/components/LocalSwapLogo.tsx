import React from 'react'
import Image from 'next/image'

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
        <Image
          src="/images/localswap-logo.png"
          alt="LocalSwap Logo"
          width={size}
          height={size}
          className="drop-shadow-lg"
        />
      </div>
      
      <div className="logo-text">
        <span className="logo-main font-bold text-white text-shadow">LocalSwap</span>
        <span className="logo-tagline text-white/90 font-medium">Scambi nel vicinato</span>
      </div>
    </div>
  )
}