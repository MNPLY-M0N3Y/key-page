// src/components/KeyGenerator.tsx
import { useState } from "react";
import {
  generateSingleKeyForSeed,
  generateRandomSeed,
  validateSeedPhrase,
} from "../lib/wasmModule.js";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import bs58 from "bs58";

const commonPaths = [
  { id: "phantom", label: "Phantom (m/44'/501'/0'/0')" },
  { id: "solflare", label: "Solflare (m/44'/501'/0')" },
  { id: "legacy", label: "Legacy Sollet (m/501'/0'/0'/0')" },
  { id: "ledger", label: "Ledger Live (m/44'/501'/0'/0/0)" },
  { id: "custom", label: "Custom…" },
];

export default function KeyGenerator() {
  const [mode, setMode] = useState<"seed" | "priv">("seed");
  const [input, setInput] = useState("");
  const [pathId, setPathId] = useState(commonPaths[0].id);
  const [customPath, setCustomPath] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      let data;
      if (mode === "seed") {
        if (!validateSeedPhrase(input)) {
          toast({ title: "Invalid seed phrase", variant: "destructive" });
          return;
        }
        const accountIndex = 0;
        data = await generateSingleKeyForSeed(input, accountIndex);
      } else {
        // private key mode: we only echo back address
        data = {
          address: bs58.encode(bs58.decode(input)),
          derivationPath: "n/a",
        };
      }
      setResult(data);
    } catch (e) {
      toast({
        title: "Generation failed",
        description: String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mt-8">
      <CardHeader>
        <CardTitle>Key Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "seed"}
              onChange={() => setMode("seed")}
            />
            Seed Phrase
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "priv"}
              onChange={() => setMode("priv")}
            />
            Base58 Private Key
          </label>
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "seed"
              ? "Enter 12 or 24-word seed phrase"
              : "Enter Base58 private key"
          }
          className="mb-4 bg-gray-900"
        />
        <Select value={pathId} onValueChange={setPathId}>
          <SelectTrigger className="mb-4 bg-gray-900">
            <SelectValue placeholder="Derivation path…" />
          </SelectTrigger>
          <SelectContent>
            {commonPaths.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pathId === "custom" && (
          <Input
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="Enter custom path"
            className="mb-4 bg-gray-900"
          />
        )}
        <Button onClick={handleGenerate} className="mb-4">
          Generate
        </Button>

        {result && (
          <div className="space-y-2">
            <div>
              <strong>Address:</strong> <code>{result.address}</code>
            </div>
            {result.privateKeyBase58 && (
              <div>
                <strong>Private Key:</strong>{" "}
                <code>{result.privateKeyBase58}</code>
              </div>
            )}
            <div>
              <strong>Path:</strong>{" "}
              <code>
                {pathId === "custom"
                  ? customPath
                  : commonPaths.find((p) => p.id === pathId)?.label}
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
