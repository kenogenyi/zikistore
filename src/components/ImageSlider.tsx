'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import type SwiperType from 'swiper'
import { useEffect, useState } from 'react'
import { Pagination } from 'swiper/modules'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageSliderProps {
  urls: string[]
}

const ImageSlider = ({ urls }: ImageSliderProps) => {
  const [swiper, setSwiper] = useState<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const [slideConfig, setSlideConfig] = useState({
    isBeginning: true,
    isEnd: activeIndex === urls.length - 1,
  })

  useEffect(() => {
    if (!swiper) return

    const onSlideChange = () => {
      const newIndex = swiper.activeIndex
      setActiveIndex(newIndex)
      setSlideConfig({
        isBeginning: newIndex === 0,
        isEnd: newIndex === urls.length - 1,
      })
    }

    swiper.on('slideChange', onSlideChange)

    return () => {
      swiper.off('slideChange', onSlideChange)
    }
  }, [swiper, urls])

  const activeStyles = 'active:scale-[0.97] grid opacity-100 hover:scale-105';
  const inactiveStyles = 'hidden text-gray-400';

  return (
    <div className='group relative bg-zinc-100 aspect-square overflow-hidden'>
      <div className='absolute z-10 inset-0 opacity-0 group-hover:opacity-100 transition'>
        {/* Next button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            swiper?.slideNext()
          }}
          className={cn(
            'absolute right-3 transition',
            activeStyles,
            {
              [inactiveStyles]: slideConfig.isEnd,
              'hover:bg-primary-300 text-primary-800 opacity-100': !slideConfig.isEnd,
            }
          )}
          aria-label='next image'
        >
          <ChevronRight className='h-4 w-4 text-zinc-700' />
        </button>

        {/* Prev button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            swiper?.slidePrev()
          }}
          className={cn(
            'absolute left-3 transition',
            activeStyles,
            {
              [inactiveStyles]: slideConfig.isBeginning,
              'hover:bg-primary-300 text-primary-800 opacity-100': !slideConfig.isBeginning,
            }
          )}
          aria-label='previous image'
        >
          <ChevronLeft className='h-4 w-4 text-zinc-700' />
        </button>
      </div>

      <Swiper
        pagination={{
          clickable: true,
          renderBullet: (_, className) => {
            return `<span class="rounded-full transition ${className}"></span>`
          },
        }}
        onSwiper={setSwiper}
        spaceBetween={50}
        modules={[Pagination]}
        slidesPerView={1}
        className='h-full w-full'
      >
        {urls.map((url, i) => (
          <SwiperSlide key={i} className='-z-10 relative h-full w-full'>
            <Image
              fill
              loading='eager'
              className='-z-10 h-full w-full object-cover object-center'
              src={url}
              alt={`Product image ${i + 1}`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ImageSlider
