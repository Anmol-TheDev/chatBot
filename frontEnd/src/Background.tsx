import { useRef, useEffect } from 'react';
import { createParticleCanvas } from 'package-particlefx';

function Background() {
  const containerRef = useRef(null);
  const particleCanvasRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      particleCanvasRef.current = createParticleCanvas(containerRef.current, {
        imageSrc: "/background2.png",
        width: '100%',
        height: '100vh',
        particleGap:15,
        noise:0,
        mouseForce:100,
      });
    }

    return () => {
      particleCanvasRef.current?.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className='fixed top-0 left-0 w-full h-dvh'
    />
  );
}

export default Background;