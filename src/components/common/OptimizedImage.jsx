import React from 'react';
import { getOptimizedImageUrl, getSrcSet } from '@/utils/imageOptimization';

/**
 * OptimizedImage renders a Cloudinary image with sensible defaults:
 * - f_auto,q_auto,dpr_auto
 * - responsive srcset
 * Falls back to original src if not a Cloudinary URL.
 */
export const OptimizedImage = ({
    src,
    alt = '',
    className = '',
    sizes = '(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px',
    widthPreset = ['w_400', 'w_800', 'w_1200', 'w_1920'],
    fit = 'fill',
    gravity = 'auto',
    loading = 'lazy',
    decoding = 'async',
    width,
    height,
    aspectRatio,
    ...rest
}) => {
    const isCloudinary = typeof src === 'string' && src.includes('res.cloudinary.com');

    // Build style object for aspect-ratio and dimensions
    const style = {};
    if (aspectRatio) {
        style.aspectRatio = aspectRatio;
    }
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (!isCloudinary) {
        return (
            <img 
                src={src} 
                alt={alt} 
                className={className} 
                loading={loading} 
                decoding={decoding}
                width={typeof width === 'number' ? width : undefined}
                height={typeof height === 'number' ? height : undefined}
                style={Object.keys(style).length > 0 ? style : undefined}
                {...rest} 
            />
        );
    }

    const optimizedSrc = getOptimizedImageUrl(src, {
        crop: fit,
        gravity,
        quality: 'auto',
        format: 'auto',
        responsive: true,
    });

    const srcSet = getSrcSet(src, widthPreset.map(w => ({ width: w, descriptor: `${w.replace('w_', '')}w` })));

    return (
        <img
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={className}
            loading={loading}
            decoding={decoding}
            width={typeof width === 'number' ? width : undefined}
            height={typeof height === 'number' ? height : undefined}
            style={Object.keys(style).length > 0 ? style : undefined}
            {...rest}
        />
    );
};

export default OptimizedImage;


