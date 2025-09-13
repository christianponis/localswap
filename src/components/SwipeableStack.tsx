'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, MapPin } from 'lucide-react'
import { formatDistance, formatTimeAgo } from '@/lib/utils'
import { getAllCategories, getAllTypes, ITEM_KINDS } from '@/lib/constants'

interface SwipeableStackProps {
  items: Array<{
    id: string
    title: string
    description: string
    kind: string
    category: string
    type: string
    price?: number
    distance_meters: number
    created_at: string
    username: string
    avatar_url?: string
  }>
  user?: any
}

export const SwipeableStack: React.FC<SwipeableStackProps> = ({ items, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  const getTypeInfo = (type: string) => {
    return getAllTypes().find(t => t.value === type) || getAllTypes()[0]
  }

  const getCategoryInfo = (category: string) => {
    return getAllCategories().find(c => c.value === category) || getAllCategories()[0]
  }

  const getKindInfo = (kind: string) => {
    return ITEM_KINDS.find(k => k.value === kind) || ITEM_KINDS[0]
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentX = e.touches[0].clientX
    const diffX = currentX - startX
    setSwipeOffset(diffX)
    setDirection(diffX > 0 ? 'right' : 'left')
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(swipeOffset) > 100) {
      // Navigate to next/previous
      navigateCard(swipeOffset > 0 ? 'previous' : 'next')
    } else {
      // Snap back
      setSwipeOffset(0)
      setDirection(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const navigateCard = (nav: 'next' | 'previous') => {
    if (nav === 'next' && currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else if (nav === 'previous' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
    setSwipeOffset(0)
    setDirection(null)
  }

  // Remove unused function since we don't have action buttons anymore

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const currentX = e.clientX
      const diffX = currentX - startX
      setSwipeOffset(diffX)
      setDirection(diffX > 0 ? 'right' : 'left')
    }

    const handleGlobalMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)

      if (Math.abs(swipeOffset) > 100) {
        navigateCard(swipeOffset > 0 ? 'previous' : 'next')
      } else {
        setSwipeOffset(0)
        setDirection(null)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, startX, swipeOffset])

  if (items.length === 0) {
    return (
      <div className="swipe-stack-empty">
        <div className="empty-stack-icon">🔍</div>
        <h3 className="empty-stack-title">Nessun annuncio</h3>
        <p className="empty-stack-description">
          Non ci sono annunci nelle vicinanze al momento
        </p>
      </div>
    )
  }

  // Show current item only
  const currentItem = items[currentIndex]
  if (!currentItem) return null

  const typeInfo = getTypeInfo(currentItem.type)
  const categoryInfo = getCategoryInfo(currentItem.category)
  const kindInfo = getKindInfo(currentItem.kind)

  return (
    <div className="swipe-stack-container" ref={stackRef}>
      <div className="swipe-stack">
        <div
          className="swipe-card top-card"
          style={{
            transform: `translateX(${swipeOffset}px) rotate(${isDragging ? swipeOffset * 0.1 : 0}deg)`,
            opacity: swipeOffset !== 0 ? Math.max(0.7, 1 - Math.abs(swipeOffset) / 300) : 1
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Navigation Indicators */}
          {swipeOffset !== 0 && (
            <>
              {/* Show previous indicator only if not at first item */}
              {currentIndex > 0 && direction === 'right' && (
                <div
                  className={`swipe-indicator previous ${swipeOffset > 50 ? 'active' : ''}`}
                  style={{ opacity: Math.max(0, swipeOffset / 100) }}
                >
                  <span className="nav-arrow">←</span>
                  <span>PRECEDENTE</span>
                </div>
              )}
              {/* Show next indicator only if not at last item */}
              {currentIndex < items.length - 1 && direction === 'left' && (
                <div
                  className={`swipe-indicator next ${swipeOffset < -50 ? 'active' : ''}`}
                  style={{ opacity: Math.max(0, -swipeOffset / 100) }}
                >
                  <span className="nav-arrow">→</span>
                  <span>SUCCESSIVO</span>
                </div>
              )}
            </>
          )}

          <div className="card-header">
            <div className="kind-indicator">
              <span className="kind-emoji">{kindInfo.emoji}</span>
              <span className="kind-label">{kindInfo.label}</span>
            </div>
            <div className="distance-badge">
              <MapPin size={12} />
              {formatDistance(currentItem.distance_meters)}
            </div>
          </div>

          <h3 className="card-title">{currentItem.title}</h3>

          <div className={`type-badge type-${currentItem.type}`}>
            <span>{typeInfo.emoji}</span>
            {typeInfo.label}
          </div>

          <p className="card-description">{currentItem.description}</p>

          {currentItem.price && (
            <div className="card-price">€{currentItem.price}</div>
          )}

          <div className="card-footer">
            <div className="category-info">
              <span>{categoryInfo.emoji}</span>
              <span>{categoryInfo.label}</span>
            </div>
            <div className="card-time">{formatTimeAgo(currentItem.created_at)}</div>
          </div>

          <div className="card-username">
            da <span className="username-text">@{currentItem.username}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {user && (
        <div className="swipe-actions-bottom">
          <Link
            href={`/messages?item=${currentItem.id}&user=${currentItem.username}`}
            className="action-btn message-btn"
          >
            <MessageCircle size={24} />
          </Link>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="stack-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {currentIndex + 1} di {items.length}
        </span>
      </div>
    </div>
  )
}