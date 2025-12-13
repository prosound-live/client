'use client'
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { FACTORY_ADDRESS, FACTORY_ABI, TEE_URI, MOCKERC20_ADDRESS } from '@/lib/constants';
import Image from 'next/image';
import { usePublicClient, useWriteContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';

// ERC20 ABI for approve, allowance, and balanceOf
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

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
  nfttokenId: string;
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
    count: number;
    items: Song[];
  };
  message: string;
  success: boolean;
}

type Album = {
  id: string;
  nftTokenId: string;
  title: string;
  color: string;
  artist: string;
  genre: string;
  price: number;
  image: string;
  description: string;
  encryptedCid: string;
};

const colorPalette = [
  "#2d2d3a", "#3a2d35", "#2d3a35", "#35302d", "#2d3540",
  "#3d2d3a", "#2d3a3a", "#352d40", "#2d3535", "#40352d"
];

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
  const [isRenting, setIsRenting] = useState(false);
  const showBrackets = isHovered || isSelected;
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const handleRentNow = async (album: Album) => {
    if (!address || !publicClient) {
      console.error("Wallet not connected");
      return;
    }

    setIsRenting(true);

    try {
      console.log("Rent Now clicked:", {
        nftTokenId: album.nftTokenId,
        encryptedCid: album.encryptedCid,
        price: album.price,
      });

      // Get the actual WIP token address from the Factory contract
      const wipAddress = await publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getWIPAddress",
      }) as `0x${string}`;

      console.log("WIP Token Address from Factory:", wipAddress);
      console.log("MOCKERC20_ADDRESS from constants:", MOCKERC20_ADDRESS);
      console.log("Addresses match:", wipAddress.toLowerCase() === MOCKERC20_ADDRESS.toLowerCase());
      console.log("Factory address being approved:", FACTORY_ADDRESS);

      // Also get RentalNFT address - contract might delegate transferFrom to it
      const rentalNftAddress = await publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getRentalNFTAddress",
      }) as `0x${string}`;
      console.log("RentalNFT address:", rentalNftAddress);

      // Check allowance for RentalNFT as well
      const rentalNftAllowance = await publicClient.readContract({
        address: wipAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, rentalNftAddress],
      });
      console.log("Allowance for RentalNFT:", rentalNftAllowance.toString());

      // Calculate rental cost (price * months)
      const months = 1;
      const rentalCost = parseEther(album.price.toString()) * BigInt(months);

      console.log("Rental cost:", rentalCost.toString(), "WIP (wei)");

      // Check user's WIP token balance
      const userBalance = await publicClient.readContract({
        address: wipAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("User WIP balance:", userBalance.toString(), "wei");

      if (userBalance < rentalCost) {
        console.error("Insufficient WIP balance. Need:", rentalCost.toString(), "Have:", userBalance.toString());
        alert(`Insufficient WIP balance. You need ${album.price} WIP tokens.`);
        return;
      }

      // Check current allowance using the actual WIP address
      const currentAllowance = await publicClient.readContract({
        address: wipAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, FACTORY_ADDRESS as `0x${string}`],
      });

      console.log("Current allowance:", currentAllowance.toString());

      // If allowance is insufficient, request approval with max uint256 for convenience
      if (currentAllowance < rentalCost) {
        console.log("Insufficient allowance, requesting approval...");

        // Approve max uint256 so user doesn't need to approve again
        const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        const approveHash = await writeContractAsync({
          address: wipAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [FACTORY_ADDRESS as `0x${string}`, maxApproval],
        });

        console.log("Approval tx submitted:", approveHash);

        // Wait for more confirmations to ensure approval is processed
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 2,
        });

        if (approveReceipt.status !== "success") {
          throw new Error("Approval transaction failed");
        }

        console.log("Approval successful");

        // Verify the new allowance
        const newAllowance = await publicClient.readContract({
          address: wipAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, FACTORY_ADDRESS as `0x${string}`],
        });
        console.log("New allowance after approval:", newAllowance.toString());
      }

      // Final verification right before rent call
      const finalAllowance = await publicClient.readContract({
        address: wipAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, FACTORY_ADDRESS as `0x${string}`],
      });
      console.log("Final allowance check before rent:", finalAllowance.toString());
      console.log("Rental cost:", rentalCost.toString());
      console.log("Allowance >= Cost:", finalAllowance >= rentalCost);

      if (finalAllowance < rentalCost) {
        throw new Error(`Allowance still insufficient after approval. Have: ${finalAllowance}, Need: ${rentalCost}`);
      }

      // Now rent the record - uses WIP token (ERC20), not native IP
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "rentRecord",
        args: [BigInt(album.nftTokenId), 0, 1, `https://ipfs.io/ipfs/${album.encryptedCid}`],
      });

      console.log("Rent tx submitted:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== "success") {
        throw new Error("Rent transaction failed");
      }

      console.log("Rent transaction successful:", receipt);
    } catch (error) {
      console.error("Rent failed:", error);
    } finally {
      setIsRenting(false);
    }
  }

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
          {album.image ? (
            <Image
              src={album.image}
              alt={album.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover"
            />
          ) : (
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
          )}

          {/* Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Add Button */}
          <motion.button
            className={`absolute bottom-3 right-3 cursor-pointer px-4 py-2 bg-card rounded-full flex items-center justify-center shadow-lg ${isRenting ? 'opacity-50 cursor-not-allowed' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered || isSelected ? 1 : 0,
              scale: isHovered || isSelected ? 1 : 0.8
            }}
            whileHover={{ scale: isRenting ? 1 : 1.1 }}
            whileTap={{ scale: isRenting ? 1 : 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            disabled={isRenting}
            onClick={(e) => {
              e.stopPropagation();
              if (!isRenting) handleRentNow(album);
            }}
          >
            {isRenting ? 'Renting...' : 'Rent Now'}
          </motion.button>

          {/* Genre Badge */}
          <motion.div
            className="absolute top-3 left-3 px-2 py-1 bg-card/90 backdrop-blur-sm rounded text-[10px] tracking-wider text-card-foreground"
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {album.genre.toUpperCase()}
          </motion.div>

          {/* Price Badge */}
          <motion.div
            className="absolute top-3 right-3 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded text-[10px] font-bold tracking-wider text-primary-foreground"
            animate={{ opacity: isHovered || isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {album.price} IP/mo
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
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>(['All']);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const response = await fetch(`${TEE_URI}/api/v1/NFT/getdata`, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        const data: ApiResponse = await response.json();

        if (data.success && data.payload.items) {
          const transformedAlbums: Album[] = data.payload.items.map((song, index) => ({
            id: song.tokenId,
            nftTokenId: song.nfttokenId,
            title: song.name,
            color: colorPalette[index % colorPalette.length],
            artist: song.properties.artist,
            genre: song.properties.genre,
            price: parseFloat(song.properties.pricePerMonth),
            image: song.image,
            description: song.description,
            encryptedCid: song.properties.encryptedCid,
          }));
          setAlbums(transformedAlbums);

          // Extract unique genres
          const uniqueGenres = ['All', ...new Set(transformedAlbums.map(a => a.genre))];
          setGenres(uniqueGenres);
        }
      } catch (error) {
        console.error('Failed to fetch albums:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      const matchesSearch = !searchQuery ||
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || album.genre.toLowerCase() === selectedGenre.toLowerCase();
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre, albums]);

  if (isLoading) {
    return <div className="min-h-screen" />;
  }

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
                {selectedAlbum.title.toUpperCase()}
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
                  {selectedAlbum.genre} • {selectedAlbum.price} IP/month
                </p>
                {selectedAlbum.description && (
                  <p className="mt-2 text-muted-foreground">{selectedAlbum.description}</p>
                )}
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
