import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

interface CarouselItem {
  id: number
  type: 'image' | 'video'
  src: string
  alt?: string
  title?: string
  description?: string
}

interface ImageCarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  showIndicators?: boolean
  className?: string
}

export default function ImageCarousel({
  items,
  autoPlay = true,
  interval = 5000,
  showControls = true,
  showIndicators = true,
  className = ''
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  useEffect(() => {
    if (!autoPlay || !isPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, isPlaying, interval, items.length])

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (!items.length) return null

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${className}`}>
      {/* Carousel Container */}
      <div className="relative h-96 md:h-[500px] lg:h-[600px]">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
          >
            {item.type === 'image' ? (
              <div className="relative w-full h-full">
                <img
                  src={item.src}
                  alt={item.alt || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {(item.title || item.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    {item.title && (
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                    )}
                    {item.description && (
                      <p className="text-sm md:text-base opacity-90">{item.description}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  autoPlay={index === currentIndex && isPlaying}
                  muted
                  loop
                  playsInline
                />
                {(item.title || item.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    {item.title && (
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                    )}
                    {item.description && (
                      <p className="text-sm md:text-base opacity-90">{item.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Play/Pause Button for Videos */}
        {items[currentIndex]?.type === 'video' && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 z-10"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        )}

        {/* Navigation Controls */}
        {showControls && items.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 z-10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 z-10 backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((currentIndex + 1) / items.length) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  )
}
