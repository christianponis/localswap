'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, MessageCircle, Package, User } from 'lucide-react'

interface BottomNavigationProps {
  user?: any
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ user }) => {
  const pathname = usePathname()

  const navItems = [
    {
      id: 'home',
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/'
    },
    {
      id: 'add',
      href: user ? '/add-item' : '/auth/login?action=add-item',
      icon: Plus,
      label: 'Aggiungi',
      active: pathname === '/add-item',
      primary: true
    },
    {
      id: 'messages',
      href: user ? '/messages' : '/auth/login?action=messages',
      icon: MessageCircle,
      label: 'Messaggi',
      active: pathname === '/messages'
    },
    {
      id: 'my-items',
      href: user ? '/my-items' : '/auth/login?action=my-items',
      icon: Package,
      label: 'I miei',
      active: pathname === '/my-items'
    },
    {
      id: 'profile',
      href: user ? '/profile' : '/auth/login?action=profile',
      icon: User,
      label: user ? 'Profilo' : 'Accedi',
      active: pathname === '/profile' || pathname === '/auth/login'
    }
  ]

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`bottom-nav-item ${item.active ? 'active' : ''} ${item.primary ? 'primary' : ''}`}
            >
              <div className="bottom-nav-icon">
                <IconComponent size={item.primary ? 24 : 20} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}