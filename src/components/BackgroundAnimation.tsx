import React, { useEffect, useRef } from 'react';

export const BackgroundAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initUnicorn = () => {
      if ((window as any).UnicornStudio && (window as any).UnicornStudio.init) {
        // According to documentation, init() initializes all elements matching data-us-project
        (window as any).UnicornStudio.init();
      }
    };

    if (document.querySelector('script[src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js"]')) {
      initUnicorn();
      // Retry just in case it takes a moment to process the DOM
      setTimeout(initUnicorn, 200);
      setTimeout(initUnicorn, 500);
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js";
      script.async = true;
      script.onload = () => {
        initUnicorn();
        setTimeout(initUnicorn, 200);
      };
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup if needed (UnicornStudio might not have a destroy method, so we just let it be or clear innerHTML)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, []);

  return (
    <div 
        className="fixed top-0 w-full h-screen pointer-events-none z-[0] overflow-hidden hue-rotate-180" 
        data-alpha-mask="80"
        style={{ 
            maskImage: 'linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)' 
        }}
    >
        <div ref={containerRef} className="absolute w-full h-full left-0 top-0" data-us-project="FA91ypkIWKOhjZEGAfQR"></div>
    </div>
  );
};
