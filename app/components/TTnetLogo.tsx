import React from 'react'
import Image from 'next/image'

interface TTnetLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'white' | 'gradient'
  useImage?: boolean
  imageSrc?: string
  imageAlt?: string
}

export default function TTnetLogo({ 
  size = 'md', 
  className = '', 
  variant = 'default',
  useImage = false,
  imageSrc = '/images/ttnet-logo.png',
  imageAlt = 'T&Tnet Logo'
}: TTnetLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const imageSizes = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 50 },
    lg: { width: 200, height: 65 },
    xl: { width: 280, height: 90 }
  }

  const variantClasses = {
    default: 'text-gray-900',
    white: 'text-white',
    gradient: 'bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent'
  }

  if (useImage && imageSrc) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageSizes[size].width}
          height={imageSizes[size].height}
          className="object-contain"
          priority
        />
      </div>
    )
  }

  return (
    <div className={`font-black tracking-tight ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <span className="relative">
        <span className="text-blue-600">T&T</span>
        <span className="text-green-600 relative">
          net
          {/* WiFi waves emanating from the 'r' */}
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 border-2 border-blue-600 rounded-full opacity-60"></div>
            <div className="w-6 h-6 border-2 border-blue-600 rounded-full opacity-40 absolute -top-1 -left-1"></div>
            <div className="w-8 h-8 border-2 border-blue-600 rounded-full opacity-20 absolute -top-2 -left-2"></div>
          </div>
          {/* Green dot above 'e' */}
          <div className="absolute -top-1 left-2 w-1 h-1 bg-green-600 rounded-full"></div>
        </span>
      </span>
    </div>
  )
}
