import React from 'react'
import Image from 'next/image'

interface LocalSwapLogoProps {
  size?: number
  className?: string
}

export const LocalSwapLogo: React.FC<LocalSwapLogoProps> = ({ 
  size = 64, 
  className = "" 
}) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="relative">
        <Image
          src="/images/localswap-logo.png"
          alt="LocalSwap Logo"
          width={size}
          height={size}
          className="drop-shadow-lg"
        />
      </div>
    </div>
  )
}