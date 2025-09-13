'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, User, ArrowLeft } from 'lucide-react'
import { LocalSwapLogo } from './LocalSwapLogo'
import { NotificationButton } from './NotificationButton'

interface HeaderProps {
  user?: any
  onLogout?: () => void
  locationStatus?: string
  showLocation?: boolean
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  className?: string
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  locationStatus,
  showLocation = false,
  showBackButton = false,
  backButtonText = "Torna alla Home",
  backButtonHref = "/",
  className = ""
}) => {
  return (
    <header className={`compact-header ${className}`}>
      <div className="compact-header-content">
        {showBackButton ? (
          <Link href={backButtonHref} className="header-back-btn">
            <ArrowLeft size={20} />
          </Link>
        ) : (
          <Link href="/" className="header-logo-compact">
            <LocalSwapLogo size={32} />
            <span className="header-app-name">LocalSwap</span>
          </Link>
        )}

        {showLocation && locationStatus && (
          <div className="header-location-compact">
            <MapPin size={14} />
            <span className="location-status">{locationStatus}</span>
          </div>
        )}

        <div className="header-actions-compact">
          {user ? (
            <>
              <NotificationButton />
              <div className="user-avatar-compact">
                <span className="user-initial">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="header-login-btn">
              <User size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}