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

    if (document.querySelector('script[src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js"]')) {
      initUnicorn();
      // Retry just in case it takes a moment to process the DOM
      setTimeout(initUnicorn, 200);
      setTimeout(initUnicorn, 500);
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js";
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
    <>
      {/* Fixed Laboratory Backgrounds (Estas são as texturas que ficam sobre a animação) */}
      <div className="fixed inset-0 vertical-streaks pointer-events-none z-0"></div>
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-40"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/5 via-black/95 to-black z-0 pointer-events-none"></div>

      <div 
          className="fixed top-0 w-full h-screen pointer-events-none z-[0] overflow-hidden" 
      >
          {/* INÍCIO DA ANIMAÇÃO DE FUNDO WEBGL */}
          <div ref={containerRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen js-parallax" data-parallax-speed="-0.14" data-us-project="q0JSwb0l42Yf6m79xfW9" style={{ width: '100%', height: '100%' }}></div>
          {/* FIM DA ANIMAÇÃO DE FUNDO WEBGL */}
      </div>
    </>
  );
};

