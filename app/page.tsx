'use client'
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

const albums = [
  {
    id: 1,
    title: "THE ALTAR",
    color: "#2d2d3a",
    description: "The Altar is Banks' second studio album, released in 2016. It features dark, introspective themes and emotional depth.",
    artist: "Banks",
    genre: "Alternative",
    year: 2016
  },
  {
    id: 2,
    title: "BANKS III",
    color: "#3a2d35",
    description: "Banks III is her third studio album, showcasing her evolution as an artist with powerful vocals and raw emotion.",
    artist: "Banks",
    genre: "Alternative",
    year: 2019
  },
  {
    id: 3,
    title: "SERPENTINA",
    color: "#2d3a35",
    description: "Serpentina is Banks' fourth studio album, released in 2022. It explores themes of transformation and rebirth.",
    artist: "Banks",
    genre: "Alternative",
    year: 2022
  },
  {
    id: 4,
    title: "GODDESS",
    color: "#35302d",
    description: "Goddess is Banks' debut studio album, released in 2014. It established her unique sound and artistic vision.",
    artist: "Banks",
    genre: "Alternative",
    year: 2014
  },
  {
    id: 5,
    title: "BRAIN",
    color: "#2d3540",
    description: "Brain represents the complexity of human emotion and thought, exploring the depths of consciousness.",
    artist: "Banks",
    genre: "Electronic",
    year: 2020
  },
  {
    id: 6,
    title: "DARK SIDE",
    color: "#3d2d3a",
    description: "Dark Side delves into the shadows of the human psyche, exploring themes of vulnerability and strength.",
    artist: "Banks",
    genre: "Alternative",
    year: 2018
  },
  {
    id: 7,
    title: "ECLIPSE",
    color: "#2d3a3a",
    description: "Eclipse captures moments of transformation and change, where light meets darkness.",
    artist: "Banks",
    genre: "Electronic",
    year: 2021
  },
  {
    id: 8,
    title: "MIDNIGHT",
    color: "#352d40",
    description: "Midnight represents the quiet hours of reflection and introspection, where secrets come to light.",
    artist: "Banks",
    genre: "Alternative",
    year: 2017
  },
  {
    id: 9,
    title: "AURORA",
    color: "#2d3535",
    description: "Aurora symbolizes the dawn of new beginnings and the beauty that emerges from darkness.",
    artist: "Banks",
    genre: "Electronic",
    year: 2023
  },
  {
    id: 10,
    title: "DUSK",
    color: "#40352d",
    description: "Dusk captures the transition between day and night, a time of reflection and peaceful contemplation.",
    artist: "Banks",
    genre: "Alternative",
    year: 2015
  },
];

const genres = ["All", "Alternative", "Electronic"];

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || album.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen bg-neutral-200 pt-20 pb-8">
      <div className="max-w-lvw mx-auto px-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black tracking-tighter text-neutral-900 mb-6">Marketplace</h1>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search songs, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white rounded-lg border border-neutral-300"
            >
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedGenre === genre
                        ? 'bg-neutral-800 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          <p className="mt-4 text-sm text-neutral-500">
            Showing {filteredAlbums.length} of {albums.length} albums
          </p>
        </motion.div>

        {/* Grid */}
        {filteredAlbums.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {filteredAlbums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg">
                  <motion.div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: album.color }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <span className="opacity-30 text-sm tracking-widest text-white font-medium">
                      {album.title}
                    </span>
                  </motion.div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-neutral-900 mb-1 truncate">
                    {album.title}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate">{album.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-400">{album.year}</span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-400">{album.genre}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-neutral-500 text-lg">No albums found</p>
            <p className="text-neutral-400 text-sm mt-2">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
