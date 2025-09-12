'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, User, LogOut, ArrowLeft } from 'lucide-react'
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
    <div className={`header ${className}`}>
      <div className="header-content">
        <div className="header-main">
          <div className="header-branding">
            <LocalSwapLogo size={80} />
            <div className="header-text">
              <h1 className="header-title-main">LocalSwap</h1>
              <p className="header-subtitle">Il tuo mercato di quartiere</p>
            </div>
          </div>
          
          <div className="header-actions">
            {user ? (
              <>
                {showBackButton ? (
                  <div className="user-info">
                    <div className="user-avatar">
                      <span className="user-initial">
                        {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="user-details">
                      <span className="user-name">
                        {user.displayName || user.email?.split('@')[0] || 'Utente'}
                      </span>
                      <span className="user-status">Online</span>
                    </div>
                  </div>
                ) : (
                  <div className="auth-section">
                    <NotificationButton />
                    <span className="username">
                      Ciao {user.displayName || user.email?.split('@')[0]}!
                    </span>
                    <button
                      onClick={onLogout}
                      className="logout-btn"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                )}
                
                {showBackButton && (
                  <Link href={backButtonHref} className="back-btn-enhanced">
                    <ArrowLeft size={20} />
                    <span>{backButtonText}</span>
                  </Link>
                )}
              </>
            ) : (
              <Link href="/auth/login" className="login-btn">
                <User size={16} />
                Accedi
              </Link>
            )}
          </div>
        </div>
        
        {showLocation && locationStatus && (
          <div className="header-location">
            <div className="location-indicator">
              <MapPin size={18} />
              <span className="location-text">{locationStatus}</span>
              <div className="location-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}