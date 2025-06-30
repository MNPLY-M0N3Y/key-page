// src/components/InfiniteKeyBrowser.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Star, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  generateKeyBatch,
  validateSeedPhrase,
  mnemonicToIndex,
  prefixToIndex,
} from "../lib/wasmModule.js";

// Simple debounce function (no lodash dependency)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface KeyData {
  index: number;
  address: string;
  privateKeyHex: string;
  privateKeyBase58: string;
  derivationPath: string;
  seedHex: string;
  generationTimeMs: number;
  seedPhrase: string;
}

interface PerformanceMetrics {
  currentPosition: string;
  generationRate: number;
  renderedCount: number;
  scrollVelocity: number;
}

const ITEM_HEIGHT = 80;
const BUFFER_SIZE = 20;

export default function InfiniteKeyBrowser() {
  const [virtualPosition, setVirtualPosition] = useState<bigint>(BigInt(0));
  const [visibleKeys, setVisibleKeys] = useState<KeyData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"seed" | "priv">("seed");
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    currentPosition: "0",
    generationRate: 0,
    renderedCount: 0,
    scrollVelocity: 0,
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(Date.now());
  const generationTimeRef = useRef<number[]>([]);
  const { toast } = useToast();

  const copyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: `${label} copied successfully`,
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const generateKeysAtPosition = useCallback(
    async (position: bigint, count: number): Promise<KeyData[]> => {
      const startTime = performance.now();
      try {
        setError(null);
        const batch = await generateKeyBatch("", Number(position), count);
        const endTime = performance.now();
        const generationTime = endTime - startTime;
        generationTimeRef.current.push(count / (generationTime / 1000));
        if (generationTimeRef.current.length > 50) {
          generationTimeRef.current.shift();
        }
        return batch;
      } catch (error) {
        console.error("Key generation failed:", error);
        setError(`Key generation failed: ${error}`);
        return [];
      }
    },
    []
  );

  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return { start: BigInt(0), count: 0 };
    const containerHeight = containerRef.current.clientHeight;
    const itemsInView = Math.ceil(containerHeight / ITEM_HEIGHT);
    const totalItems = itemsInView + BUFFER_SIZE * 2;
    const startPosition = virtualPosition - BigInt(BUFFER_SIZE);
    const normalizedStart = startPosition < 0 ? BigInt(0) : startPosition;
    return { start: normalizedStart, count: totalItems };
  }, [virtualPosition]);

  const handleScroll = useCallback(
    (deltaY: number) => {
      const itemsToScroll = Math.ceil(Math.abs(deltaY) / ITEM_HEIGHT);
      const direction = deltaY > 0 ? 1 : -1;
      const newPosition = virtualPosition + BigInt(itemsToScroll * direction);
      if (newPosition >= 0) {
        setVirtualPosition(newPosition);
        const now = Date.now();
        const timeDelta = now - lastScrollTime.current;
        const velocity = itemsToScroll / (timeDelta / 1000);
        lastScrollTime.current = now;
        setMetrics((prev) => ({ ...prev, scrollVelocity: velocity }));
      }
    },
    [virtualPosition]
  );

  // Debounced prefix search - jumps as you type
  const handlePrefixChange = useCallback(
    debounce(async (prefix: string) => {
      if (mode !== "seed" || !prefix.trim()) return;
      try {
        // For partial phrases, use prefixToIndex
        const words = prefix.trim().split(/\s+/);
        if (words.length <= 12) {
          const idxStr = await prefixToIndex(prefix);
          setVirtualPosition(BigInt(idxStr));
        }
      } catch (err) {
        console.error("prefixToIndex failed:", err);
      }
    }, 150),
    [mode]
  );

  // Complete seed phrase search (on Enter)
  const handleCompleteSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      if (mode === "seed") {
        if (!(await validateSeedPhrase(q))) {
          toast({
            title: "Invalid seed phrase",
            variant: "destructive",
            description: "Please enter a valid 12 or 24-word seed phrase",
          });
          return;
        }

        const seedIndex = await mnemonicToIndex(q);
        const indexBigInt = BigInt(seedIndex);
        setVirtualPosition(indexBigInt);

        toast({
          title: "Jumped to seed position",
          description: `Jumped to position #${indexBigInt.toString()}`,
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mode, searchQuery, toast]);

  // Load keys when position changes
  useEffect(() => {
    let cancelled = false;
    async function updateVisibleKeys() {
      setIsLoading(true);
      try {
        const { start, count } = calculateVisibleRange();
        const keys = await generateKeysAtPosition(start, count);
        if (cancelled) return;
        setVisibleKeys(keys);
        const avgRate =
          generationTimeRef.current.length > 0
            ? generationTimeRef.current.reduce((a, b) => a + b, 0) /
              generationTimeRef.current.length
            : 0;
        setMetrics((m) => ({
          ...m,
          currentPosition: virtualPosition.toString(),
          generationRate: Math.round(avgRate),
          renderedCount: keys.length,
        }));
      } catch (err) {
        if (!cancelled) setError(`Key generation failed: ${err}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    updateVisibleKeys();
    return () => {
      cancelled = true;
    };
  }, [virtualPosition, calculateVisibleRange, generateKeysAtPosition]);

  // Wheel scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleScroll]);

  const toggleFavorite = useCallback((address: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(address)) {
        newFavorites.delete(address);
      } else {
        newFavorites.add(address);
      }
      return newFavorites;
    });
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedKeys((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-4">
        {/* Add navigation link */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Solana Key Browser</h1>
          <a
            href="/explainer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
          >
            📚 How It Works
          </a>
        </div>{" "}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type seed prefix for instant jump..."
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                handlePrefixChange(v); // Auto-jump as you type
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCompleteSearch()}
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>
        {/* Mode Selection */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="seed"
              checked={mode === "seed"}
              onChange={(e) => setMode(e.target.value as "seed" | "priv")}
              className="text-blue-600"
            />
            <span className="text-sm">Incremental seed search</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="priv"
              checked={mode === "priv"}
              onChange={(e) => setMode(e.target.value as "seed" | "priv")}
              className="text-blue-600"
            />
            <span className="text-sm">Private key search</span>
          </label>
        </div>
        {/* Performance Metrics */}
        <div className="flex gap-6 text-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Position:</span>
            <Badge variant="outline" className="border-gray-700">
              {metrics.currentPosition}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Rate:</span>
            <Badge variant="outline" className="border-gray-700">
              {metrics.generationRate}/s
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Shown:</span>
            <Badge variant="outline" className="border-gray-700">
              {metrics.renderedCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 m-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && visibleKeys.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading keys...</div>
        </div>
      )}

      {/* Virtual Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <div className="w-full space-y-2 p-4">
          {visibleKeys.map((keyData) => {
            const isExpanded = expandedKeys.has(keyData.index);
            const isFavorite = favorites.has(keyData.address);

            return (
              <Card
                key={`${keyData.index}-${keyData.address}`}
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                style={{ minHeight: `${ITEM_HEIGHT}px` }}
                onClick={() => toggleExpanded(keyData.index)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono truncate text-gray-300">
                          {keyData.address}
                        </div>
                        {isExpanded && (
                          <div className="text-xs font-mono truncate text-red-400 mt-1">
                            {keyData.privateKeyBase58}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(keyData.address);
                        }}
                        className={
                          isFavorite ? "text-yellow-400" : "text-gray-500"
                        }
                      >
                        <Star className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(keyData.address, "Address");
                        }}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {isExpanded ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded view with detailed info */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Address:
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(keyData.address, "Address");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <code className="block text-sm bg-gray-900 p-2 rounded break-all">
                          {keyData.address}
                        </code>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Private Key (Base58):
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                keyData.privateKeyBase58,
                                "Private Key"
                              );
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <code className="block text-sm bg-gray-900 p-2 rounded break-all text-red-400">
                          {keyData.privateKeyBase58}
                        </code>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Seed Phrase:
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                keyData.seedPhrase,
                                "Seed Phrase"
                              );
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <code className="block text-sm bg-gray-900 p-2 rounded break-all text-green-400">
                          {keyData.seedPhrase}
                        </code>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Path: {keyData.derivationPath}</span>
                        <span>
                          Generated in {keyData.generationTimeMs.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Virtual Position Indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur rounded-lg p-2 text-sm font-mono">
        Position: {virtualPosition.toString()}
      </div>
    </div>
  );
}
