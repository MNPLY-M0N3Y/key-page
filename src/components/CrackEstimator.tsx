// src/components/CrackEstimator.tsx
import { useState, useEffect } from "react";
import { prefixToIndex, generateKeyBatch } from "../lib/wasmModule.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function CrackEstimator() {
  const [publicKey, setPublicKey] = useState("");
  const [partialSeed, setPartialSeed] = useState("");
  const [pathPrefix, setPathPrefix] = useState("");
  const [rate, setRate] = useState(0);
  const [estimate, setEstimate] = useState<string | null>(null);
  const { toast } = useToast();

  // sample benchmark on mount
  useEffect(() => {
    (async () => {
      const batchSize = 1000;
      const t0 = performance.now();
      await generateKeyBatch("", 0, batchSize);
      const t1 = performance.now();
      setRate(batchSize / ((t1 - t0) / 1000));
    })();
  }, []);

  const computeEstimate = async () => {
    if (!publicKey && !partialSeed) {
      toast({
        title: "Enter public key or partial seed",
        variant: "destructive",
      });
      return;
    }
    // crude search space estimate:
    // If partialSeed has k known words, unknown = 12-k => 2048^(unknown)
    const knownWords = partialSeed.trim().split(/\s+/).filter(Boolean).length;
    const unknown = 12 - knownWords;
    const combos = BigInt(2048) ** BigInt(unknown);
    const seconds = combos / BigInt(Math.floor(rate || 1));
    const hours = Number(seconds) / 3600;
    setEstimate(hours > 8760 ? ">1 year" : hours.toFixed(2) + " hours");
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mt-8">
      <CardHeader>
        <CardTitle>Cracking Time Estimator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="Enter public key (optional)"
            className="bg-gray-900"
          />
          <Input
            value={partialSeed}
            onChange={(e) => setPartialSeed(e.target.value)}
            placeholder="Enter partial seed phrase (12 words max)"
            className="bg-gray-900"
          />
          <Input
            value={pathPrefix}
            onChange={(e) => setPathPrefix(e.target.value)}
            placeholder="Enter derivation path (optional)"
            className="bg-gray-900"
          />
          <div>Benchmark rate: ~{rate.toFixed(0)} keys/sec</div>
          <Button onClick={computeEstimate}>Estimate Crack Time</Button>
          {estimate && (
            <div>
              <strong>Estimated time:</strong> {estimate}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
