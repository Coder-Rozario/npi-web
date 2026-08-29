import { useEffect, useRef, useState } from 'react';

/**
 * Hook for lazy loading images with Intersection Observer
 * Improves initial page load by deferring image loading
 * 
 * @param {string} src - The image source URL
 * @param {string} placeholder - Optional placeholder/blur image
 * @returns {object} - { ref, isLoaded, currentSrc }
 */
export const useLazyImage = (src, placeholder = '') => {
  const ref = useRef(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(!placeholder);

  useEffect(() => {
    if (!src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Preload the image
            const tempImg = new Image();
            tempImg.onload = () => {
              if (img && ref.current === img) {
                setCurrentSrc(src);
                setIsLoaded(true);
              }
            };
            tempImg.onerror = () => {
              // Fallback to original src on error
              setCurrentSrc(src);
              setIsLoaded(true);
            };
            tempImg.src = src;
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.01
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [src]);

  return { ref, isLoaded, currentSrc };
};

/**
 * Lazy Image Component - Ready to use
 * Usage: <LazyImage src={imageUrl} alt="description" className="w-full" />
 */
export const LazyImage = ({ 
  src, 
  placeholder = '',
  alt = '', 
  className = '',
  onLoad,
  ...props 
}) => {
  const { ref, isLoaded, currentSrc } = useLazyImage(src, placeholder);

  return (
    <img
      ref={ref}
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
      onLoad={() => onLoad?.()}
      {...props}
    />
  );
};
