'use client'
import { useRef, useState, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import FamilyButton from '@/components/ui/family-button';

const albums = [
  { id: 1, title: "THE ALTAR", color: "#2d2d3a" },
  { id: 2, title: "BANKS III", color: "#3a2d35" },
  { id: 3, title: "SERPENTINA", color: "#2d3a35" },
  { id: 4, title: "GODDESS", color: "#35302d" },
  { id: 5, title: "BRAIN", color: "#2d3540" },
  { id: 6, title: "DARK SIDE", color: "#3d2d3a" },
  { id: 7, title: "ECLIPSE", color: "#2d3a3a" },
  { id: 8, title: "MIDNIGHT", color: "#352d40" },
  { id: 9, title: "AURORA", color: "#2d3535" },
  { id: 10, title: "DUSK", color: "#40352d" },
];

function CornerBrackets() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            delay: 0.1,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
        className="absolute -top-6 -left-6 w-5 h-5 border-l-2 border-t-2 border-neutral-700"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            delay: 0.15,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
        className="absolute -top-6 -right-6 w-5 h-5 border-r-2 border-t-2 border-neutral-700"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            delay: 0.2,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
        className="absolute -bottom-6 -left-6 w-5 h-5 border-l-2 border-b-2 border-neutral-700"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            delay: 0.25,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
        className="absolute -bottom-6 -right-6 w-5 h-5 border-r-2 border-b-2 border-neutral-700"
      />
    </>
  );
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(0);
  const baseSize = 160;
  const gap = 40;
  const itemTotal = baseSize + gap;
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSnapping = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isSnapping.current || !container) return;

      container.scrollLeft += e.deltaY * 0.8;

      const idx = Math.round(container.scrollLeft / itemTotal);
      setCenterIndex(Math.max(0, Math.min(albums.length - 1, idx)));

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        if (!container) return;
        const snapIdx = Math.round(container.scrollLeft / itemTotal);
        const clamped = Math.max(0, Math.min(albums.length - 1, snapIdx));
        const target = clamped * itemTotal;

        isSnapping.current = true;
        animate(container.scrollLeft, target, {
          type: "spring",
          stiffness: 400,
          damping: 25,
          onUpdate: v => {
            if (container) container.scrollLeft = v;
          },
          onComplete: () => {
            isSnapping.current = false;
            setCenterIndex(clamped);
          }
        });
      }, 80);
    };

    const handleScroll = () => {
      if (isSnapping.current || !container) return;
      const idx = Math.round(container.scrollLeft / itemTotal);
      setCenterIndex(Math.max(0, Math.min(albums.length - 1, idx)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [itemTotal]);

  const getSize = (index: number) => {
    const dist = Math.abs(index - centerIndex);
    if (dist === 0) return 240;
    return 160;
  };

  const getOpacity = (index: number) => {
    const dist = Math.abs(index - centerIndex);
    if (dist === 0) return 1;
    if (dist === 1) return 0.4;
    return 0.2;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-200 relative rounded-3xl">
      {/* Corner decorations */}
      <motion.div
        className="absolute top-6 left-6 text-neutral-400 text-2xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: {
            delay: 0.1,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
      >
        ✧ ProSound
      </motion.div>
      <motion.div
        className='absolute top-6 right-6'
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: {
            delay: 0.15,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
      >
        <FamilyButton>{null}</FamilyButton>
      </motion.div>

      {/* Header */}
      <div className='h-10'></div>
      {/* <nav className="flex justify-center items-center p-6 gap-6 text-sm tracking-wide text-neutral-500">
        <button className="hover:text-neutral-800 transition-colors cursor-pointer">Home</button>
        <span className="text-neutral-400">|</span>
        <button className="hover:text-neutral-800 transition-colors cursor-pointer">My Purchases</button>
      </nav> */}

      {/* Title */}
      <div className="flex justify-center mt-4">
        <motion.div
          key={centerIndex}
          layout
          layoutRoot
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.2,
            }
          }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          className="px-5 py-2 bg-neutral-800 text-white text-xs tracking-widest font-medium rounded-full"
        >
          {albums[centerIndex]?.title}
        </motion.div>
      </div>

      {/* Reel */}
      <main className="flex-1 overflow-hidden flex items-center">
        <div
          ref={containerRef}
          className="w-full overflow-x-auto flex items-center"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            className="flex items-center"
            style={{
              paddingLeft: 'calc(50vw - 120px)',
              paddingRight: 'calc(50vw - 120px)',
              gap
            }}
          >
            {albums.map((album, index) => {
              const size = getSize(index);
              const isCenter = index === centerIndex;
              return (
                <motion.div
                  key={album.id}
                  className="relative"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: getOpacity(index),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    when: "beforeChildren",
                  }}
                >
                  {isCenter && <CornerBrackets />}
                  <motion.div
                    layout
                    layoutRoot
                    className="shrink-0 flex items-center justify-center text-2xl font-medium text-white relative overflow-hidden"
                    style={{ backgroundColor: album.color }}
                    initial={{ borderRadius: 12 }}
                    animate={{
                      width: size,
                      height: size,
                      borderRadius: isCenter ? 16 : 12,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      when: "beforeChildren",
                    }}
                  >
                    <motion.span
                      className="opacity-30 text-sm tracking-widest"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: isCenter ? 0.3 : 0.1,
                        transition: {
                          delay: isCenter ? 0.3 : 0,
                          duration: 0.4,
                          ease: "easeOut",
                        }
                      }}
                    >
                      {album.title}
                    </motion.span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.div
        className="p-8 flex justify-between items-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            delay: 0.3,
            duration: 0.4,
            ease: "easeOut",
          }
        }}
      >
        <motion.p
          className="text-xs text-neutral-500 leading-relaxed max-w-xs"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              delay: 0.4,
              duration: 0.4,
              ease: "easeOut",
            }
          }}
        >
          Jillian Rose Banks, better known<br />
          by her stage name, Banks, is an<br />
          American singer and songwriter.
        </motion.p>
        <motion.div
          className="text-neutral-400 text-2xl"
          initial={{ opacity: 0, rotate: -180 }}
          animate={{
            opacity: 1,
            rotate: 0,
            transition: {
              delay: 0.5,
              duration: 0.4,
              ease: "easeOut",
            }
          }}
        >
          ✦
        </motion.div>
      </motion.div>
    </div>
  );
}