// src/lib/wasmModule.js (rename from rustModule.js)
let wasmModule = null;
let isLoading = false;

async function loadWasmModule() {
  if (wasmModule) return wasmModule;
  if (isLoading) {
    // Wait for the loading to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return wasmModule;
  }

  isLoading = true;
  try {
    // Import the WASM module from your pkg directory
    const module = await import("../../public/solana_key_wasm.js");

    // Initialize the WASM module
    await module.default();

    wasmModule = module;
    console.log("WASM module loaded successfully:", Object.keys(wasmModule));
    return wasmModule;
  } catch (error) {
    console.error("Failed to load WASM module:", error);
    throw error;
  } finally {
    isLoading = false;
  }
}

export async function generateKeyBatch(seedPhrase, startIndex, count) {
  const module = await loadWasmModule();
  if (!module.generateKeyBatch) {
    throw new Error("generateKeyBatch function not found in WASM module");
  }

  // Call the WASM function and convert result
  const result = module.generateKeyBatch(seedPhrase, startIndex, count);

  // Convert JS Array to regular array if needed
  const keys = [];
  for (let i = 0; i < result.length; i++) {
    keys.push(result[i]);
  }
  return keys;
}

// src/lib/wasmModule.js - Add new functions

export async function findPrivateKey(seedPhrase, privateKey, maxSearch) {
  const module = await loadWasmModule();
  if (!module.findPrivateKey) {
    throw new Error("findPrivateKey function not found in WASM module");
  }
  return module.findPrivateKey(seedPhrase, privateKey, maxSearch);
}

export async function generateDeterministicSeed(index) {
  const module = await loadWasmModule();
  if (!module.generateDeterministicSeed) {
    throw new Error(
      "generateDeterministicSeed function not found in WASM module"
    );
  }
  return module.generateDeterministicSeed(index);
}

export async function generateSingleKey(seedPhrase, index) {
  const module = await loadWasmModule();
  if (!module.generateSingleKey) {
    throw new Error("generateSingleKey function not found in WASM module");
  }
  return module.generateSingleKey(seedPhrase, index);
}

export async function validateSeedPhrase(seedPhrase) {
  const module = await loadWasmModule();
  if (!module.validateSeedPhrase) {
    throw new Error("validateSeedPhrase function not found in WASM module");
  }
  return module.validateSeedPhrase(seedPhrase);
}

export async function findAddressIndex(seedPhrase, address, maxSearch) {
  const module = await loadWasmModule();
  if (!module.findAddressIndex) {
    throw new Error("findAddressIndex function not found in WASM module");
  }
  return module.findAddressIndex(seedPhrase, address, maxSearch);
}

export async function mnemonicToIndex(mnemonic) {
  const module = await loadWasmModule();
  if (!module.mnemonicToIndex) {
    // ← Correct camelCase name
    throw new Error("mnemonicToIndex not found in WASM module");
  }
  return module.mnemonicToIndex(mnemonic); // ← Correct camelCase name
}

export async function generateRandomSeed() {
  const module = await loadWasmModule();
  if (!module.generateRandomSeed) {
    throw new Error("generateRandomSeed function not found in WASM module");
  }
  return module.generateRandomSeed();
}
// Add the new function to your existing wasmModule.js
export async function generateSingleKeyForSeed(seedPhrase, accountIndex) {
  const module = await loadWasmModule();
  if (!module.generateSingleKeyForSeed) {
    throw new Error(
      "generateSingleKeyForSeed function not found in WASM module"
    );
  }
  return module.generateSingleKeyForSeed(seedPhrase, accountIndex);
}

export async function prefixToIndex(prefix) {
  const module = await loadWasmModule();
  if (!module.prefixToIndex) {
    throw new Error("prefixToIndex not found in WASM module");
  }
  return module.prefixToIndex(prefix);
}
