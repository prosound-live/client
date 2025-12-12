'use client'
import { useRef, useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

function ReelItem({ index, scrollX, containerWidth, itemWidth }) {
  const [scale, setScale] = useState(0.8);
  const [opacity, setOpacity] = useState(0.6);
  
  const springScale = useSpring(scale, { stiffness: 200, damping: 25 });
  const springOpacity = useSpring(opacity, { stiffness: 200, damping: 25 });

  useEffect(() => {
    const gap = 16;
    const itemCenter = index * (itemWidth + gap) + itemWidth / 2;
    const viewCenter = scrollX + containerWidth / 2;
    const distance = Math.abs(itemCenter - viewCenter);
    const maxDistance = containerWidth / 2;
    
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const newScale = 1.3 - normalizedDistance * 0.5;
    const newOpacity = 1 - normalizedDistance * 0.4;
    
    setScale(Math.max(0.8, newScale));
    setOpacity(Math.max(0.6, newOpacity));
  }, [scrollX, containerWidth, index, itemWidth]);

  return (
    <motion.div
      style={{ scale: springScale, opacity: springOpacity }}
      className="flex-shrink-0 snap-center aspect-square w-40 bg-black text-white flex items-center justify-center text-2xl font-bold"
    >
      {index + 1}
    </motion.div>
  );
}

export default function Page() {
  const containerRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const itemWidth = 160;
  const gap = 16;
  const items = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerWidth(container.offsetWidth);

    const handleScroll = () => setScrollX(container.scrollLeft);
    const handleResize = () => setContainerWidth(container.offsetWidth);

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const padding = containerWidth / 2 - itemWidth / 2;

  return (
    <div className="h-screen flex flex-col">
      <p className="flex justify-center items-center p-4 py-2 gap-4">
        <button>Home</button> | <button>My Purchases</button> | <button>Profile</button>
      </p>
      <main className="flex-1 overflow-hidden flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full overflow-x-auto flex items-center snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div 
            className="flex gap-4"
            style={{ paddingLeft: padding, paddingRight: padding }}
          >
            {items.map((_, index) => (
              <ReelItem
                key={index}
                index={index}
                scrollX={scrollX}
                containerWidth={containerWidth}
                itemWidth={itemWidth}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}