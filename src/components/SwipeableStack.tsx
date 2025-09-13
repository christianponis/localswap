'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, MapPin, X, Heart } from 'lucide-react'
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
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(swipeOffset) > 100) {
      // Swipe completed
      handleSwipe(swipeOffset > 0 ? 'right' : 'left')
    } else {
      // Snap back
      setSwipeOffset(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Like/Save action
      console.log('Liked item:', items[currentIndex]?.id)
    } else {
      // Pass/Skip action
      console.log('Skipped item:', items[currentIndex]?.id)
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1)
    setSwipeOffset(0)
  }

  const handleActionButton = (action: 'like' | 'pass') => {
    handleSwipe(action === 'like' ? 'right' : 'left')
  }

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const currentX = e.clientX
      const diffX = currentX - startX
      setSwipeOffset(diffX)
    }

    const handleGlobalMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)

      if (Math.abs(swipeOffset) > 100) {
        handleSwipe(swipeOffset > 0 ? 'right' : 'left')
      } else {
        setSwipeOffset(0)
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

  if (currentIndex >= items.length) {
    return (
      <div className="swipe-stack-empty">
        <div className="empty-stack-icon">🎉</div>
        <h3 className="empty-stack-title">Hai visto tutto!</h3>
        <p className="empty-stack-description">
          Non ci sono altri annunci nelle vicinanze al momento
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="refresh-stack-btn"
        >
          Ricomincia
        </button>
      </div>
    )
  }

  const visibleItems = items.slice(currentIndex, currentIndex + 3)

  return (
    <div className="swipe-stack-container" ref={stackRef}>
      <div className="swipe-stack">
        {visibleItems.map((item, index) => {
          const isTop = index === 0
          const typeInfo = getTypeInfo(item.type)
          const categoryInfo = getCategoryInfo(item.category)
          const kindInfo = getKindInfo(item.kind)

          const rotation = isTop && isDragging
            ? swipeOffset * 0.1
            : 0

          const scale = 1 - (index * 0.05)
          const yOffset = index * 8

          return (
            <div
              key={item.id}
              className={`swipe-card ${isTop ? 'top-card' : ''}`}
              style={{
                transform: `
                  translateX(${isTop ? swipeOffset : 0}px)
                  translateY(${yOffset}px)
                  rotate(${rotation}deg)
                  scale(${scale})
                `,
                zIndex: 3 - index,
                opacity: swipeOffset !== 0 && isTop
                  ? Math.max(0.3, 1 - Math.abs(swipeOffset) / 300)
                  : 1
              }}
              onTouchStart={isTop ? handleTouchStart : undefined}
              onTouchMove={isTop ? handleTouchMove : undefined}
              onTouchEnd={isTop ? handleTouchEnd : undefined}
              onMouseDown={isTop ? handleMouseDown : undefined}
            >
              {/* Swipe Indicators */}
              {isTop && swipeOffset !== 0 && (
                <>
                  <div
                    className={`swipe-indicator like ${swipeOffset > 50 ? 'active' : ''}`}
                    style={{ opacity: Math.max(0, swipeOffset / 100) }}
                  >
                    <Heart size={32} />
                    <span>INTERESSATO</span>
                  </div>
                  <div
                    className={`swipe-indicator pass ${swipeOffset < -50 ? 'active' : ''}`}
                    style={{ opacity: Math.max(0, -swipeOffset / 100) }}
                  >
                    <X size={32} />
                    <span>PASSA</span>
                  </div>
                </>
              )}

              <div className="card-header">
                <div className="kind-indicator">
                  <span className="kind-emoji">{kindInfo.emoji}</span>
                  <span className="kind-label">{kindInfo.label}</span>
                </div>
                <div className="distance-badge">
                  <MapPin size={12} />
                  {formatDistance(item.distance_meters)}
                </div>
              </div>

              <h3 className="card-title">{item.title}</h3>

              <div className={`type-badge type-${item.type}`}>
                <span>{typeInfo.emoji}</span>
                {typeInfo.label}
              </div>

              <p className="card-description">{item.description}</p>

              {item.price && (
                <div className="card-price">€{item.price}</div>
              )}

              <div className="card-footer">
                <div className="category-info">
                  <span>{categoryInfo.emoji}</span>
                  <span>{categoryInfo.label}</span>
                </div>
                <div className="card-time">{formatTimeAgo(item.created_at)}</div>
              </div>

              <div className="card-username">
                da <span className="username-text">@{item.username}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="swipe-actions-bottom">
        <button
          className="action-btn pass-btn"
          onClick={() => handleActionButton('pass')}
          disabled={isDragging}
        >
          <X size={24} />
        </button>

        {user && (
          <Link
            href={`/messages?item=${items[currentIndex]?.id}&user=${items[currentIndex]?.username}`}
            className="action-btn message-btn"
          >
            <MessageCircle size={24} />
          </Link>
        )}

        <button
          className="action-btn like-btn"
          onClick={() => handleActionButton('like')}
          disabled={isDragging}
        >
          <Heart size={24} />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="stack-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentIndex / items.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {currentIndex + 1} di {items.length}
        </span>
      </div>
    </div>
  )
}