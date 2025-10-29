/**
 * Cloudinary Image Optimization Utilities
 * 
 * This utility provides optimized image URLs with proper transformations
 * to reduce bandwidth usage and improve performance.
 */

/**
 * Generate optimized Cloudinary URL with transformations
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @param {string} options.width - Target width (e.g., '800', 'w_auto')
 * @param {string} options.height - Target height (e.g., '600', 'h_auto')
 * @param {string} options.quality - Quality setting (e.g., 'auto', '80')
 * @param {string} options.format - Format (e.g., 'auto', 'webp', 'avif')
 * @param {string} options.crop - Crop mode (e.g., 'fill', 'fit', 'scale')
 * @param {string} options.gravity - Gravity for cropping (e.g., 'auto', 'center')
 * @param {boolean} options.responsive - Whether to use responsive sizing
 * @returns {string} Optimized Cloudinary URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return imageUrl; // Return original if not a Cloudinary URL
    }

    const {
        width = 'w_auto',
        height = 'h_auto',
        quality = 'auto',
        format = 'auto',
        crop = 'fill',
        gravity = 'auto',
        responsive = true
    } = options;

    // Parse the Cloudinary URL to insert transformations
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length !== 2) {
        return imageUrl; // Return original if URL format is unexpected
    }

    const baseUrl = urlParts[0] + '/upload/';
    const publicId = urlParts[1];

    // Build transformation string
    const transformations = [];

    // Add responsive sizing if enabled
    if (responsive) {
        transformations.push('w_auto', 'h_auto');
    } else {
        if (width !== 'w_auto') transformations.push(width);
        if (height !== 'h_auto') transformations.push(height);
    }

    // Add crop and gravity
    if (crop) transformations.push(`c_${crop}`);
    if (gravity) transformations.push(`g_${gravity}`);

    // Add quality and format optimization
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);

    // Add DPR (Device Pixel Ratio) optimization for responsive images
    if (responsive) {
        transformations.push('dpr_auto');
    }

    const transformationString = transformations.join(',');

    return `${baseUrl}${transformationString}/${publicId}`;
};

/**
 * Generate responsive image URLs for different screen sizes
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} breakpoints - Breakpoint configurations
 * @returns {Object} Object with breakpoint keys and optimized URLs
 */
export const getResponsiveImageUrls = (imageUrl, breakpoints = {}) => {
    const defaultBreakpoints = {
        mobile: { width: 'w_400', height: 'h_auto' },
        tablet: { width: 'w_800', height: 'h_auto' },
        desktop: { width: 'w_1200', height: 'h_auto' },
        large: { width: 'w_1920', height: 'h_auto' }
    };

    const configs = { ...defaultBreakpoints, ...breakpoints };
    const responsiveUrls = {};

    Object.entries(configs).forEach(([breakpoint, config]) => {
        responsiveUrls[breakpoint] = getOptimizedImageUrl(imageUrl, {
            ...config,
            responsive: false
        });
    });

    return responsiveUrls;
};

/**
 * Generate optimized image URL for gallery thumbnails
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default: 80)
 * @returns {string} Optimized thumbnail URL
 */
export const getThumbnailUrl = (imageUrl, size = 80) => {
    return getOptimizedImageUrl(imageUrl, {
        width: `w_${size}`,
        height: `h_${size}`,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        format: 'auto',
        responsive: false
    });
};

/**
 * Generate optimized image URL for hero/banner images
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {string} aspectRatio - Aspect ratio (e.g., '16:9', '4:3')
 * @returns {string} Optimized hero image URL
 */
export const getHeroImageUrl = (imageUrl, aspectRatio = '16:9') => {
    return getOptimizedImageUrl(imageUrl, {
        width: 'w_auto',
        height: 'h_auto',
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        format: 'auto',
        responsive: true
    });
};

/**
 * Generate optimized image URL for room gallery images
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {string} size - Size preset ('small', 'medium', 'large')
 * @returns {string} Optimized room image URL
 */
export const getRoomImageUrl = (imageUrl, size = 'medium') => {
    const sizeConfigs = {
        small: { width: 'w_600', height: 'h_auto' },
        medium: { width: 'w_800', height: 'h_auto' },
        large: { width: 'w_1200', height: 'h_auto' }
    };

    const config = sizeConfigs[size] || sizeConfigs.medium;

    return getOptimizedImageUrl(imageUrl, {
        ...config,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        format: 'auto',
        responsive: true
    });
};

/**
 * Generate srcset for responsive images
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Array} sizes - Array of size objects with width and descriptor
 * @returns {string} srcset string
 */
export const getSrcSet = (imageUrl, sizes = [
    { width: 'w_400', descriptor: '400w' },
    { width: 'w_800', descriptor: '800w' },
    { width: 'w_1200', descriptor: '1200w' },
    { width: 'w_1920', descriptor: '1920w' }
]) => {
    return sizes
        .map(({ width, descriptor }) => {
            const optimizedUrl = getOptimizedImageUrl(imageUrl, {
                width,
                height: 'h_auto',
                crop: 'fill',
                gravity: 'auto',
                quality: 'auto',
                format: 'auto',
                responsive: false
            });
            return `${optimizedUrl} ${descriptor}`;
        })
        .join(', ');
};

/**
 * Get optimized image with modern format fallback
 * 
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {Object} Object with optimized URL and srcset
 */
export const getOptimizedImage = (imageUrl, options = {}) => {
    const optimizedUrl = getOptimizedImageUrl(imageUrl, options);
    const srcSet = getSrcSet(imageUrl, options.sizes);

    return {
        src: optimizedUrl,
        srcSet,
        sizes: options.sizes || '(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px'
    };
};
