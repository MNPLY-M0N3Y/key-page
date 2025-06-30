// src/components/DerivationPathExplainer.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Info, Key, Cpu, Shield } from "lucide-react";
import { generateSingleKeyForSeed } from "../lib/wasmModule.js"; // Use your existing WASM functions
import KeyGenerator from "./KeyGenerator";
import CrackEstimator from "./CrackEstimator";

interface DerivationExample {
  wallet: string;
  path: string;
  description: string;
  compatibility: "high" | "medium" | "low";
  notes: string;
  exampleAddress?: string;
}

const derivationExamples: DerivationExample[] = [
  {
    wallet: "Phantom",
    path: "m/44'/501'/0'/0'",
    description: "Standard BIP-44 with account-level hardening",
    compatibility: "high",
    notes: "Most common Solana wallet implementation",
  },
  {
    wallet: "Solflare",
    path: "m/44'/501'/0'",
    description: "Shortened path without change/address components",
    compatibility: "high",
    notes: "Compatible with most hardware wallets",
  },
  {
    wallet: "Legacy Sollet",
    path: "m/501'/0'/0'/0'",
    description: "Early Solana wallet implementation",
    compatibility: "low",
    notes: "Deprecated but still used by some old wallets",
  },
  {
    wallet: "Ledger Live",
    path: "m/44'/501'/0'/0/0",
    description: "Hardware wallet standard with non-hardened components",
    compatibility: "medium",
    notes: "Ledger's specific implementation",
  },
  {
    wallet: "Custom Path",
    path: "m/44'/501'/1'/0'",
    description: "Alternative account index",
    compatibility: "medium",
    notes: "Same standard but different account number",
  },
];

export default function DerivationPathExplainer() {
  const [selectedPath, setSelectedPath] = useState<DerivationExample>(
    derivationExamples[0]
  );
  const [showTechnical, setShowTechnical] = useState(false);
  const [exampleKey, setExampleKey] = useState<any>(null);

  // Generate example key using your WASM function
  useEffect(() => {
    const generateExample = async () => {
      try {
        const testSeed =
          "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const key = await generateSingleKeyForSeed(testSeed, 0);
        setExampleKey(key);
      } catch (error) {
        console.error("Failed to generate example key:", error);
      }
    };
    generateExample();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a href="/" className="p-2 hover:bg-gray-800 rounded-md">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-3xl font-bold">
            Understanding Cryptocurrency Key Derivation
          </h1>
          <p className="text-gray-400 mt-2">
            Why different wallets generate different addresses from the same
            seed phrase
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-200">
          <strong>Important:</strong> The addresses shown in our browser may not
          match your wallet exactly due to different derivation path
          implementations. This is normal and expected behavior in the
          cryptocurrency ecosystem. See{" "}
          <a
            href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-100"
          >
            BIP-44 specification
          </a>{" "}
          for more details.
        </AlertDescription>
      </Alert>

      {/* Quick Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            Quick Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            Your 12-word seed phrase is like a master key that can generate
            millions of addresses (
            <a
              href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-100"
            >
              BIP-39
            </a>
            ). However, different wallets use different "derivation paths" -
            mathematical routes to generate these addresses (
            <a
              href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-100"
            >
              BIP-32
            </a>
            /
            <a
              href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-100"
            >
              BIP-44
            </a>
            ). This means the same seed phrase can produce different addresses
            depending on which wallet you use.
          </p>

          {exampleKey && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">
                Example with test seed phrase:
              </h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-400">Seed:</span> abandon abandon
                  abandon abandon abandon abandon abandon abandon abandon
                  abandon abandon about
                </p>
                <p>
                  <span className="text-gray-400">
                    Our implementation generates:
                  </span>{" "}
                  <code className="text-green-400">{exampleKey.address}</code>
                </p>
                <p>
                  <span className="text-gray-400">Path:</span>{" "}
                  <code>{exampleKey.derivationPath}</code>
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded">
              <Key className="h-5 w-5 text-green-400" />
              <span className="text-sm">Same seed phrase</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span className="text-sm">Different derivation paths</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded">
              <Shield className="h-5 w-5 text-purple-400" />
              <span className="text-sm">Different addresses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Derivation Path Selector */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Common Solana Derivation Paths</CardTitle>
          <p className="text-gray-400 text-sm">
            Select different wallet implementations to see how they derive
            addresses
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 mb-6">
            {derivationExamples.map((example, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPath.wallet === example.wallet
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onClick={() => setSelectedPath(example)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{example.wallet}</span>
                    <Badge
                      variant="outline"
                      className={`${
                        example.compatibility === "high"
                          ? "border-green-500 text-green-400"
                          : example.compatibility === "medium"
                          ? "border-yellow-500 text-yellow-400"
                          : "border-red-500 text-red-400"
                      }`}
                    >
                      {example.compatibility} compatibility
                    </Badge>
                  </div>
                  <code className="text-sm bg-gray-900 px-2 py-1 rounded">
                    {example.path}
                  </code>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {example.description}
                </p>
              </div>
            ))}
          </div>

          {/* Selected Path Details */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3">
              {selectedPath.wallet} Implementation
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Derivation Path:</span>
                <code className="block text-lg font-mono bg-gray-800 p-2 rounded mt-1">
                  {selectedPath.path}
                </code>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Description:</span>
                <p className="text-gray-200 mt-1">{selectedPath.description}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Notes:</span>
                <p className="text-gray-200 mt-1">{selectedPath.notes}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details Toggle */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Technical Deep Dive</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTechnical(!showTechnical)}
            >
              {showTechnical ? "Hide" : "Show"} Technical Details
            </Button>
          </div>
        </CardHeader>
        {showTechnical && (
          <CardContent className="space-y-6">
            {/* BIP39 Explanation */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                1. BIP-39: Seed Phrase Generation
              </h3>
              <p className="text-gray-300 mb-4">
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  BIP-39
                </a>{" "}
                defines how your 12-word seed phrase is created and converted
                into a master seed. The process involves converting words to
                entropy, adding a checksum, and generating a 512-bit seed
                through{" "}
                <a
                  href="https://en.wikipedia.org/wiki/PBKDF2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  PBKDF2 hashing
                </a>
                .
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Process:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>
                    12 words → 128 bits of entropy + 4 bits checksum = 132 bits
                    total
                  </li>
                  <li>
                    Words mapped to indices in standardized{" "}
                    <a
                      href="https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-100"
                    >
                      2048-word list
                    </a>
                  </li>
                  <li>PBKDF2-SHA512 converts entropy to 512-bit master seed</li>
                  <li>Master seed used for all subsequent key derivation</li>
                </ol>
              </div>
            </div>

            {/* BIP32/HD Wallets */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                2. BIP-32: Hierarchical Deterministic Wallets
              </h3>
              <p className="text-gray-300 mb-4">
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  BIP-32
                </a>{" "}
                enables generating unlimited keys from a single master seed in a
                tree-like structure. Each "branch" represents a different
                derivation path, creating distinct addresses while maintaining
                mathematical relationships.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>
                    Deterministic: Same seed always produces same addresses
                  </li>
                  <li>Hierarchical: Tree structure allows organization</li>
                  <li>Hardened vs Non-hardened derivation for security</li>
                  <li>Extended public/private keys for different use cases</li>
                </ul>
              </div>
            </div>

            {/* BIP44 Standard */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                3. BIP-44: Multi-Currency Organization
              </h3>
              <p className="text-gray-300 mb-4">
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  BIP-44
                </a>{" "}
                defines a standard structure for organizing keys across
                different cryptocurrencies. The path format is:
                m/purpose'/coin_type'/account'/change/address_index.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  Path Components for Solana (m/44'/501'/0'/0'):
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>
                    <strong>m</strong>: Master key (root of tree)
                  </li>
                  <li>
                    <strong>44'</strong>: Purpose (BIP-44 standard)
                  </li>
                  <li>
                    <strong>501'</strong>: Coin type (501 = Solana, from{" "}
                    <a
                      href="https://github.com/satoshilabs/slips/blob/master/slip-0044.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-100"
                    >
                      SLIP-0044
                    </a>
                    )
                  </li>
                  <li>
                    <strong>0'</strong>: Account index (first account)
                  </li>
                  <li>
                    <strong>0'</strong>: Change (0 = receiving addresses)
                  </li>
                </ul>
              </div>
            </div>

            {/* Ed25519 Complications */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                4. Ed25519 and Solana-Specific Challenges
              </h3>
              <p className="text-gray-300 mb-4">
                Solana uses{" "}
                <a
                  href="https://ed25519.cr.yp.to/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  Ed25519 signatures
                </a>
                , which aren't directly compatible with BIP-32 due to
                mathematical constraints. Different wallets implement
                workarounds like{" "}
                <a
                  href="https://github.com/satoshilabs/slips/blob/master/slip-0010.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  SLIP-0010
                </a>{" "}
                or{" "}
                <a
                  href="https://input-output-hk.github.io/adrestia/static/Ed25519_BIP.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  BIP32-Ed25519
                </a>
                , leading to incompatible derivation methods.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Common Implementations:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>
                    <strong>SLIP-0010</strong>: Used by some hardware wallets
                    (hardened-only)
                  </li>
                  <li>
                    <strong>BIP32-Ed25519</strong>: Modified BIP-32 for Ed25519
                    curves
                  </li>
                  <li>
                    <strong>Custom derivation</strong>: Wallet-specific
                    implementations
                  </li>
                  <li>
                    <strong>Path variations</strong>: Different depth and
                    hardening approaches
                  </li>
                </ul>
              </div>
            </div>

            {/* Security Implications */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                5. Security and Compatibility
              </h3>
              <p className="text-gray-300 mb-4">
                Different derivation paths don't compromise security - they're
                just different routes to generate keys. However, using the wrong
                path means you won't see your funds in a particular wallet
                interface.
              </p>
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-200">
                  <strong>Remember:</strong> Your funds are always safe on the
                  blockchain. If you can't see them in one wallet, try different
                  derivation paths or use a wallet that supports path selection
                  like{" "}
                  <a
                    href="https://solflare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-100"
                  >
                    Solflare
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        )}
      </Card>

      {/* About Our Implementation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>About Our Solana Key Browser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            Our key browser demonstrates the mathematical relationships between
            seed phrases and generated addresses. It creates a deterministic,
            alphabetically-ordered sequence of all possible 12-word BIP-39
            combinations, showing how each seed phrase maps to specific Solana
            addresses using our custom derivation implementation.
          </p>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>
                <strong>Deterministic ordering</strong>: Seeds arranged
                alphabetically by BIP-39 word index
              </li>
              <li>
                <strong>Instant navigation</strong>: Jump to any seed phrase
                position using mathematical conversion
              </li>
              <li>
                <strong>Educational purpose</strong>: Demonstrates cryptographic
                principles in action
              </li>
              <li>
                <strong>Client-side security</strong>: All computations happen
                in your browser via{" "}
                <a
                  href="https://webassembly.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-100"
                >
                  WebAssembly
                </a>
              </li>
            </ul>
          </div>

          <Alert className="border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200">
              <strong>Educational Tool:</strong> This browser is designed for
              learning about cryptocurrency key derivation. The addresses shown
              may not match your wallet due to different derivation path
              implementations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Back to Browser */}
      <div className="text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Key Browser
        </a>
        <KeyGenerator />
        <CrackEstimator />
      </div>
    </div>
  );
}
