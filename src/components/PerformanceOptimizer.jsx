import React, { useEffect } from 'react'

const PerformanceOptimizer = () => {
    useEffect(() => {
        // Preload critical resources
        const preloadCriticalResources = () => {
            // Preload critical fonts
            const fontLink = document.createElement('link')
            fontLink.rel = 'preload'
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
            fontLink.as = 'style'
            document.head.appendChild(fontLink)

            // Preload critical images
            const imageLink = document.createElement('link')
            imageLink.rel = 'preload'
            imageLink.href = '/hero-image.jpg'
            imageLink.as = 'image'
            document.head.appendChild(imageLink)
        }

        // Optimize images with lazy loading
        const optimizeImages = () => {
            const images = document.querySelectorAll('img[data-src]')
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target
                        img.src = img.dataset.src
                        img.classList.remove('lazy')
                        observer.unobserve(img)
                    }
                })
            })

            images.forEach(img => imageObserver.observe(img))
        }

        // Defer non-critical JavaScript
        const deferNonCriticalJS = () => {
            // Move analytics and other non-critical scripts to load after page interaction
            const scripts = document.querySelectorAll('script[data-defer]')
            scripts.forEach(script => {
                script.defer = true
            })
        }

        // Optimize CLS (Cumulative Layout Shift)
        const optimizeCLS = () => {
            // Set fixed dimensions for images (excluding logos and icons)
            const images = document.querySelectorAll('img:not([alt*="logo"]):not([alt*="icon"]):not([class*="h-"]):not([class*="w-"])')
            images.forEach(img => {
                if (!img.style.width && !img.style.height && !img.classList.contains('logo')) {
                    img.style.width = '100%'
                    img.style.height = 'auto'
                }
            })

            // Set fixed dimensions for containers
            const containers = document.querySelectorAll('.dynamic-height')
            containers.forEach(container => {
                container.style.minHeight = '200px'
            })
        }

        // Initialize optimizations
        preloadCriticalResources()
        optimizeImages()
        deferNonCriticalJS()
        optimizeCLS()

        // Cleanup function
        return () => {
            // Cleanup any observers or timers if needed
        }
    }, [])

    return null // This component doesn't render anything
}

export default PerformanceOptimizer
