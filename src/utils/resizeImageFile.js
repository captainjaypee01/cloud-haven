const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.8;

/**
 * Resize/compress proof images for upload. PNG screenshots are converted to JPEG
 * so they stay under server limits (bank proofs do not need transparency).
 */
export function resizeImageFile(file, {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    maxBytesWithoutReencode = 4 * 1024 * 1024,
} = {}) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            let { width, height } = img;
            const needsResize = width > maxDimension || height > maxDimension;

            if (needsResize) {
                const scale = Math.min(maxDimension / width, maxDimension / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }

            const isJpeg =
                /\.jpe?g$/i.test(file.name) ||
                file.type.includes('jpeg') ||
                file.type.includes('jpg');

            if (!needsResize && isJpeg && file.size <= maxBytesWithoutReencode) {
                URL.revokeObjectURL(url);
                resolve(file);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const baseName = file.name.replace(/\.[^.]+$/, '') || 'proof';
                    resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                quality,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };

        img.src = url;
    });
}
