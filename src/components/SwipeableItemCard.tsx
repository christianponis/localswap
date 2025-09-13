'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, MapPin } from 'lucide-react'
import { formatDistance, formatTimeAgo } from '@/lib/utils'
import { getAllCategories, getAllTypes, ITEM_KINDS } from '@/lib/constants'

interface SwipeableItemCardProps {
  item: {
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
  }
  user?: any
  index: number
}

export const SwipeableItemCard: React.FC<SwipeableItemCardProps> = ({
  item,
  user,
  index
}) => {
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

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

    // Only allow left swipe (negative values)
    if (diffX < 0) {
      setTranslateX(Math.max(diffX, -100))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    // If swiped more than 50px, show actions
    if (translateX < -50) {
      setTranslateX(-100)
      setShowActions(true)
    } else {
      setTranslateX(0)
      setShowActions(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const resetSwipe = () => {
    setTranslateX(0)
    setShowActions(false)
  }

  // Handle global mouse events and close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        resetSwipe()
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const currentX = e.clientX
      const diffX = currentX - startX

      if (diffX < 0) {
        setTranslateX(Math.max(diffX, -100))
      }
    }

    const handleGlobalMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)

      if (translateX < -50) {
        setTranslateX(-100)
        setShowActions(true)
      } else {
        setTranslateX(0)
        setShowActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, startX, translateX])

  const typeInfo = getTypeInfo(item.type)
  const categoryInfo = getCategoryInfo(item.category)
  const kindInfo = getKindInfo(item.kind)

  return (
    <div
      ref={cardRef}
      className="swipeable-card-container"
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div
        className={`swipeable-item-card ${item.kind === 'service' ? 'item-card-service' : 'item-card-object'}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="item-header">
          <div className="item-title-section">
            <div className="kind-indicator">
              <span className="kind-emoji">{kindInfo.emoji}</span>
              <span className="kind-label">{kindInfo.label}</span>
            </div>
            <h3 className="item-title">
              {item.title}
            </h3>
          </div>
          <div className="distance-badge">
            <MapPin size={12} />
            {formatDistance(item.distance_meters)}
          </div>
        </div>

        <div className={`type-badge type-${item.type}`}>
          <span>{typeInfo.emoji}</span>
          {typeInfo.label}
        </div>

        <p className="item-description">
          {item.description}
        </p>

        {item.price && (
          <div className="item-price">
            €{item.price}
          </div>
        )}

        <div className="item-footer">
          <div className="category-info">
            <span>{categoryInfo.emoji}</span>
            <span>{categoryInfo.label}</span>
          </div>
          <div className="item-time">
            {formatTimeAgo(item.created_at)}
          </div>
        </div>

        {item.username && (
          <div className="item-username">
            da <span className="username-text">@{item.username}</span>
          </div>
        )}
      </div>

      {/* Swipe Actions */}
      <div className={`swipe-actions ${showActions ? 'visible' : ''}`}>
        {user && (
          <Link
            href={`/messages?item=${item.id}&user=${item.username}`}
            className="swipe-action-btn message-action"
            onClick={resetSwipe}
          >
            <MessageCircle size={20} />
            <span>Messaggio</span>
          </Link>
        )}
      </div>
    </div>
  )
}