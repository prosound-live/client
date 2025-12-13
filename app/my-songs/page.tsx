'use client'
import { useRef, useState, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import FamilyButtonDemo from '@/components/family-demo';
import { useAccount } from 'wagmi';
import { TEE_URI } from '@/lib/constants';
import Image from 'next/image';

interface SongAttribute {
  trait_type: string;
  value: string;
}

interface SongProperties {
  userAddress: string;
  encryptedCid: string;
  encryptedMusicCid: string;
  artist: string;
  genre: string;
  pricePerMonth: string;
}

interface Song {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  animation_url: string;
  attributes: SongAttribute[];
  properties: SongProperties;
  created_at: string;
}

interface ApiResponse {
  status: number;
  payload: {
    address: string;
    count: number;
    items: Song[];
  };
  message: string;
  success: boolean;
}

interface Album {
  id: string;
  title: string;
  color: string;
  description: string;
  image: string;
  artist: string;
  genre: string;
}

const colorPalette = [
  "#2d2d3a", "#3a2d35", "#2d3a35", "#35302d", "#2d3540",
  "#3d2d3a", "#2d3a3a", "#352d40", "#2d3535", "#40352d"
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
        className="absolute -top-8 -left-8 w-6 h-6 border-l-2 border-t-2 border-neutral-700"
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
        className="absolute -top-8 -right-8 w-6 h-6 border-r-2 border-t-2 border-neutral-700"
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
        className="absolute -bottom-8 -left-8 w-6 h-6 border-l-2 border-b-2 border-neutral-700"
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
        className="absolute -bottom-8 -right-8 w-6 h-6 border-r-2 border-b-2 border-neutral-700"
      />
    </>
  );
}

function SkeletonCard({ size, isCenter }: { size: number; isCenter: boolean }) {
  return (
    <motion.div
      className="relative shrink-0"
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: isCenter ? 1 : 0.4 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      {isCenter && <CornerBrackets />}
      <motion.div
        layout
        className="shrink-0 flex items-center justify-center relative overflow-hidden bg-neutral-800"
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
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();
  const baseSize = 160;
  const gap = 40;
  const itemTotal = baseSize + gap;
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSnapping = useRef(false);

  useEffect(() => {
    async function fetchSongs() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${TEE_URI}/api/v1/NFT/listBuyedSongsByAddress/${address}`,
          {
            method: 'POST',
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }

        );
        const data: ApiResponse = await response.json();

        if (data.success && data.payload.items) {
          const transformedAlbums: Album[] = data.payload.items.map((song, index) => ({
            id: song.tokenId,
            title: song.name.toUpperCase(),
            color: colorPalette[index % colorPalette.length],
            description: song.description,
            image: song.image,
            artist: song.properties.artist,
            genre: song.properties.genre,
          }));
          setAlbums(transformedAlbums);
        }
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSongs();
  }, [address]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || albums.length === 0) return;

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
  }, [itemTotal, albums.length]);

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

  const skeletonItems = [0, 1, 2, 3, 4];

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative pt-20">
        {/* Skeleton Title */}
        <div className="flex justify-center mt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-5 py-2 bg-neutral-800 rounded-full w-32 h-7 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* Skeleton Reel */}
        <main className="flex-1 overflow-hidden flex items-center">
          <div className="w-full flex items-center py-16">
            <div
              className="flex items-center"
              style={{
                paddingLeft: 'calc(50vw - 120px)',
                paddingRight: 'calc(50vw - 120px)',
                gap
              }}
            >
              {skeletonItems.map((_, index) => (
                <SkeletonCard
                  key={index}
                  size={index === 2 ? 240 : 160}
                  isCenter={index === 2}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Skeleton Footer */}
        <motion.div
          className="p-8 flex justify-between items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-2">
            <div className="h-3 w-48 bg-neutral-800 rounded relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="h-3 w-40 bg-neutral-800 rounded relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.1 }}
              />
            </div>
            <div className="h-3 w-36 bg-neutral-800 rounded relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
              />
            </div>
          </div>
          <FamilyButtonDemo />
        </motion.div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative pt-20">
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-neutral-500 text-sm tracking-wide mb-4">Connect your wallet to view your songs</p>
          </motion.div>
        </main>
        <motion.div className="p-8 flex justify-end">
          <FamilyButtonDemo />
        </motion.div>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative pt-20">
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-neutral-500 text-sm tracking-wide mb-2">No songs found</p>
            <p className="text-neutral-600 text-xs">Purchase songs to see them here</p>
          </motion.div>
        </main>
        <motion.div className="p-8 flex justify-end">
          <FamilyButtonDemo />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative pt-20">

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
          className="w-full overflow-x-auto flex items-center py-16"
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
                  className="relative shrink-0"
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
                    {album.image ? (
                      <Image
                        src={album.image}
                        alt={album.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
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
                    )}
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
        <motion.div
          key={centerIndex}
          className="text-xs text-neutral-500 leading-relaxed max-w-xs"
          layout
          layoutRoot
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.2,
            }
          }}
          exit={{ opacity: 0, y: 10 }}
        >
          <p className="text-neutral-400 font-medium mb-1">{albums[centerIndex]?.artist}</p>
          <p className="text-neutral-600 text-xs mb-2">{albums[centerIndex]?.genre}</p>
          <p>{albums[centerIndex]?.description}</p>
        </motion.div>
        <motion.div
          className="text-neutral-400 text-2xl relative"
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
          <FamilyButtonDemo />
        </motion.div>
      </motion.div>
    </div>
  );
}