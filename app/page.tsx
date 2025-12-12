'use client'
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';

const albums = [
  { id: 1, title: "THE ALTAR", color: "#2d2d3a", artist: "Banks", genre: "Alternative", year: 2016, price: 9.99 },
  { id: 2, title: "BANKS III", color: "#3a2d35", artist: "Banks", genre: "Alternative", year: 2019, price: 12.99 },
  { id: 3, title: "SERPENTINA", color: "#2d3a35", artist: "Banks", genre: "Alternative", year: 2022, price: 14.99 },
  { id: 4, title: "GODDESS", color: "#35302d", artist: "Banks", genre: "Alternative", year: 2014, price: 8.99 },
  { id: 5, title: "BRAIN", color: "#2d3540", artist: "Banks", genre: "Electronic", year: 2020, price: 11.99 },
  { id: 6, title: "DARK SIDE", color: "#3d2d3a", artist: "Banks", genre: "Alternative", year: 2018, price: 10.99 },
  { id: 7, title: "ECLIPSE", color: "#2d3a3a", artist: "Banks", genre: "Electronic", year: 2021, price: 13.99 },
  { id: 8, title: "MIDNIGHT", color: "#352d40", artist: "Banks", genre: "Alternative", year: 2017, price: 9.99 },
  { id: 9, title: "AURORA", color: "#2d3535", artist: "Banks", genre: "Electronic", year: 2023, price: 15.99 },
  { id: 10, title: "DUSK", color: "#40352d", artist: "Banks", genre: "Alternative", year: 2015, price: 8.99 },
];

const genres = ["All", "Alternative", "Electronic"];

type Album = {
  id: number;
  title: string;
  color: string;
  artist: string;
  genre: string;
  year: number;
  price: number;
};

function CornerBrackets({ visible }: { visible: boolean }) {
  if (!visible) return null;
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
        className="absolute -top-6 -left-6 w-6 h-6 border-l-2 border-t-2 border-border"
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
        className="absolute -top-6 -right-6 w-6 h-6 border-r-2 border-t-2 border-border"
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
        className="absolute -bottom-6 -left-6 w-6 h-6 border-l-2 border-b-2 border-border"
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
        className="absolute -bottom-6 -right-6 w-6 h-6 border-r-2 border-b-2 border-border"
      />
    </>
  );
}

function AlbumCard({ album, index, isSelected, onSelect }: { album: Album; index: number; isSelected: boolean; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const showBrackets = isHovered || isSelected;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 25 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <CornerBrackets visible={showBrackets} />
      <motion.div
        layout
        className="relative cursor-pointer"
        animate={{
          scale: isHovered || isSelected ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Album Art */}
        <motion.div
          layout
          className="aspect-square rounded-lg overflow-hidden relative"
          style={{ backgroundColor: album.color }}
          animate={{
            borderRadius: isSelected ? 16 : 12,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-white text-xs tracking-widest font-medium text-center px-4"
              animate={{
                opacity: isHovered || isSelected ? 0.4 : 0.15,
                fontSize: isSelected ? '0.875rem' : '0.75rem'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {album.title}
            </motion.span>
          </div>

          {/* Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Add Button */}
          <motion.button
            className="absolute bottom-3 right-3 w-8 h-8 bg-card rounded-full flex items-center justify-center shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered || isSelected ? 1 : 0,
              scale: isHovered || isSelected ? 1 : 0.8
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => {
              e.stopPropagation();
              // Handle add to cart
            }}
          >
            <Plus className="w-4 h-4 text-card-foreground" />
          </motion.button>

          {/* Year Badge */}
          <motion.div
            className="absolute top-3 left-3 px-2 py-1 bg-card/90 backdrop-blur-sm rounded text-[10px] tracking-wider text-card-foreground"
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {album.year}
          </motion.div>

          {/* Price Badge */}
          <motion.div
            className="absolute top-3 right-3 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded text-[10px] font-bold tracking-wider text-primary-foreground"
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ${album.price}
          </motion.div>
        </motion.div>

        {/* Info */}
        <motion.div
          className="mt-4 space-y-1"
          animate={{ opacity: isSelected ? 1 : 0.8 }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground tracking-wide truncate">
              {album.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{album.artist}</p>
            <span className="w-1 h-1 rounded-full bg-border" />
            <p className="text-xs text-muted-foreground">{album.genre}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      const matchesSearch = !searchQuery ||
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || album.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen py-16 px-6 pt-0">
      <div className="max-w-lvw mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-end justify-between mb-8">
            <div className='pt-30 pb-10'>
              <motion.p
                className="text-xs tracking-widest text-muted-foreground mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                COLLECTION
              </motion.p>
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Marketplace
              </h1>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-border focus:border-ring focus:outline-none text-sm text-foreground placeholder-muted-foreground transition-colors"
              />
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-2">
              {genres.map((genre) => (
                <motion.button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-1.5 rounded-full text-xs tracking-wider transition-all ${selectedGenre === genre
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {genre.toUpperCase()}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Selected Album Title Badge */}
        <AnimatePresence mode="wait">
          {selectedAlbum && (
            <motion.div
              key={selectedAlbum.id}
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
                  delay: 0.1,
                }
              }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="flex justify-center mb-8"
            >
              <div className="px-5 py-2 bg-primary text-primary-foreground text-xs tracking-widest font-medium rounded-full">
                {selectedAlbum.title}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredAlbums.length > 0 ? (
              filteredAlbums.map((album, index) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  index={index}
                  isSelected={selectedAlbum?.id === album.id}
                  onSelect={() => setSelectedAlbum(selectedAlbum?.id === album.id ? null : album)}
                />
              ))
            ) : (
              <motion.div
                key="empty"
                className="col-span-full text-center py-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-muted-foreground text-sm tracking-wider">NO RESULTS FOUND</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer with Selected Album Info */}
        <AnimatePresence mode="wait">
          {selectedAlbum && (
            <motion.div
              key={selectedAlbum.id}
              layout
              layoutRoot
              className="mt-12 p-8 flex justify-between items-end border-t border-border"
              initial={{ opacity: 0, y: 20 }}
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
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.div
                layout
                className="text-xs text-muted-foreground leading-relaxed max-w-md"
              >
                <p className="mb-2">
                  <span className="font-semibold text-foreground">{selectedAlbum.title}</span> by {selectedAlbum.artist}
                </p>
                <p className="text-muted-foreground">
                  {selectedAlbum.genre} • {selectedAlbum.year} • ${selectedAlbum.price}/month
                </p>
              </motion.div>
              <motion.button
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-xs tracking-wider font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                SUBSCRIBE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}