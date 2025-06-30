// src/lib/rustModule.js
let rustModule = null;
let isLoading = false;

async function loadRustModule() {
  if (rustModule) return rustModule;
  if (isLoading) {
    // Wait for the loading to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return rustModule;
  }

  isLoading = true;
  try {
    // Try different import paths
    try {
      rustModule = await import("./../../public/node.index");
    } catch (e) {
      console.warn("Failed to load from key-gen directory, trying public:", e);
      rustModule = await import("/index.node");
    }

    console.log("Rust module loaded successfully:", Object.keys(rustModule));
    return rustModule;
  } catch (error) {
    console.error("Failed to load Rust module:", error);
    throw error;
  } finally {
    isLoading = false;
  }
}

export async function generateKeyBatch(seedPhrase, startIndex, count) {
  const module = await loadRustModule();
  if (!module.generateKeyBatch) {
    throw new Error("generateKeyBatch function not found in Rust module");
  }
  return module.generateKeyBatch(seedPhrase, startIndex, count);
}

export async function generateSingleKey(seedPhrase, index) {
  const module = await loadRustModule();
  if (!module.generateSingleKey) {
    throw new Error("generateSingleKey function not found in Rust module");
  }
  return module.generateSingleKey(seedPhrase, index);
}

export async function validateSeedPhrase(seedPhrase) {
  const module = await loadRustModule();
  if (!module.validateSeedPhrase) {
    throw new Error("validateSeedPhrase function not found in Rust module");
  }
  return module.validateSeedPhrase(seedPhrase);
}

export async function findAddressIndex(seedPhrase, address, maxSearch) {
  const module = await loadRustModule();
  if (!module.findAddressIndex) {
    throw new Error("findAddressIndex function not found in Rust module");
  }
  return module.findAddressIndex(seedPhrase, address, maxSearch);
}

export async function generateRandomSeed() {
  const module = await loadRustModule();
  if (!module.generateRandomSeed) {
    throw new Error("generateRandomSeed function not found in Rust module");
  }
  return module.generateRandomSeed();
}
