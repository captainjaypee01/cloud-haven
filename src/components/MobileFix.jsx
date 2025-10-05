import React, { useEffect } from 'react'

const MobileFix = () => {
    useEffect(() => {
        // Prevent horizontal overflow on mobile
        const preventHorizontalOverflow = () => {
            // Add overflow-x-hidden to body
            document.body.style.overflowX = 'hidden'
            
            // Ensure all containers respect viewport width
            const containers = document.querySelectorAll('div, section, main, article')
            containers.forEach(container => {
                if (container.scrollWidth > window.innerWidth) {
                    container.style.maxWidth = '100vw'
                    container.style.overflowX = 'hidden'
                }
            })
        }

        // Run on mount and resize
        preventHorizontalOverflow()
        window.addEventListener('resize', preventHorizontalOverflow)
        
        // Cleanup
        return () => {
            document.body.style.overflowX = ''
            window.removeEventListener('resize', preventHorizontalOverflow)
        }
    }, [])

    return null
}

export default MobileFix
