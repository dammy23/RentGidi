import { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, Autoplay, Keyboard, Zoom } from 'swiper/modules'
import { Box, IconButton, Typography, Dialog, DialogContent } from '@mui/material'
import { ChevronLeft, ChevronRight, Expand, Home, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMobile'
import { SERVER_URL } from '@/config/constants'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'

interface PropertyImageCarouselProps {
  images: string[]
  propertyTitle: string
  className?: string
}

export function PropertyImageCarousel({ 
  images, 
  propertyTitle, 
  className = "" 
}: PropertyImageCarouselProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = useIsMobile()
  const swiperRef = useRef<any>(null)

  console.log('PropertyImageCarousel: Rendering with', images?.length || 0, 'images')
  console.log('PropertyImageCarousel: Property title:', propertyTitle)
  console.log('PropertyImageCarousel: Is mobile:', isMobile)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (fullscreenOpen && swiperRef.current) {
        if (event.key === 'ArrowLeft') {
          swiperRef.current.slidePrev()
        } else if (event.key === 'ArrowRight') {
          swiperRef.current.slideNext()
        } else if (event.key === 'Escape') {
          setFullscreenOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenOpen])

  // Prepare image URLs
  const imageUrls = images?.length > 0 
    ? images.map(img => `${SERVER_URL}${img}`)
    : []

  console.log('PropertyImageCarousel: Processed image URLs:', imageUrls)

  // Fallback for no images
  if (!images || images.length === 0) {
    console.log('PropertyImageCarousel: No images available, showing fallback')
    return (
      <Box 
        className={`relative rounded-xl overflow-hidden bg-gray-100 shadow-lg ${className}`}
        sx={{ height: { xs: 250, sm: 300, md: 400 } }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100'
          }}
        >
          <Home className="h-16 w-16 text-gray-400" />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            color: 'white',
            p: 2
          }}
        >
          <Typography variant="body2">No images available</Typography>
        </Box>
      </Box>
    )
  }

  const MainCarousel = ({ isFullscreen = false }) => (
    <Box
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        height: isFullscreen ? '100vh' : { xs: 250, sm: 300, md: 400 },
        width: '100%'
      }}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
          console.log('PropertyImageCarousel: Main swiper initialized')
        }}
        modules={[Navigation, Pagination, Thumbs, Autoplay, Keyboard, Zoom]}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        keyboard={{
          enabled: true,
        }}
        zoom={isFullscreen}
        loop={imageUrls.length > 1}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex)
          console.log('PropertyImageCarousel: Slide changed to index:', swiper.realIndex)
        }}
        className="h-full w-full rounded-xl overflow-hidden shadow-lg"
      >
        {imageUrls.map((imageUrl, index) => (
          <SwiperSlide key={index} className="relative">
            <Box
              component="img"
              src={imageUrl}
              alt={`${propertyTitle} - Image ${index + 1}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                transform: isHovered && !isMobile ? 'scale(1.02)' : 'scale(1)',
                cursor: isFullscreen ? 'zoom-in' : 'pointer'
              }}
              onClick={() => {
                if (!isFullscreen) {
                  console.log('PropertyImageCarousel: Opening fullscreen mode')
                  setFullscreenOpen(true)
                }
              }}
              onError={(e) => {
                console.error('PropertyImageCarousel: Image failed to load:', imageUrl)
                e.currentTarget.src = '/placeholder-property.jpg'
              }}
              loading="lazy"
            />
            
            {/* Gradient overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: 'white',
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {propertyTitle}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {index + 1} of {imageUrls.length}
              </Typography>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      {imageUrls.length > 1 && (
        <>
          <IconButton
            className="swiper-button-prev-custom"
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: 'text.primary',
              opacity: isHovered || isMobile ? 1 : 0,
              transition: 'opacity 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,1)',
              }
            }}
            aria-label="Previous image"
          >
            <ChevronLeft />
          </IconButton>
          
          <IconButton
            className="swiper-button-next-custom"
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: 'text.primary',
              opacity: isHovered || isMobile ? 1 : 0,
              transition: 'opacity 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,1)',
              }
            }}
            aria-label="Next image"
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Fullscreen Button */}
      {!isFullscreen && (
        <IconButton
          onClick={() => {
            console.log('PropertyImageCarousel: Fullscreen button clicked')
            setFullscreenOpen(true)
          }}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            opacity: isHovered || isMobile ? 1 : 0,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.8)',
            }
          }}
          aria-label="View fullscreen"
        >
          <Expand />
        </IconButton>
      )}
    </Box>
  )

  return (
    <>
      <Box className={className}>
        {/* Main Carousel */}
        <MainCarousel />

        {/* Thumbnail Navigation - Desktop only */}
        {!isMobile && imageUrls.length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[Thumbs]}
              spaceBetween={10}
              slidesPerView="auto"
              watchSlidesProgress
              className="thumbnail-swiper"
            >
              {imageUrls.map((imageUrl, index) => (
                <SwiperSlide key={index} style={{ width: 'auto' }}>
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={`${propertyTitle} thumbnail ${index + 1}`}
                    sx={{
                      width: 80,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: activeIndex === index ? '2px solid' : '2px solid transparent',
                      borderColor: activeIndex === index ? 'primary.main' : 'transparent',
                      opacity: activeIndex === index ? 1 : 0.7,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                    onClick={() => {
                      console.log('PropertyImageCarousel: Thumbnail clicked, index:', index)
                      swiperRef.current?.slideToLoop(index)
                    }}
                    loading="lazy"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        )}
      </Box>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => {
          console.log('PropertyImageCarousel: Closing fullscreen mode')
          setFullscreenOpen(false)
        }}
        maxWidth={false}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'black',
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setFullscreenOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 20,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.8)',
              }
            }}
            aria-label="Close fullscreen"
          >
            <X />
          </IconButton>
          <MainCarousel isFullscreen />
        </DialogContent>
      </Dialog>
    </>
  )
}