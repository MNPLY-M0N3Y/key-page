const addon = require("./index.node");

async function testKeyGeneration() {
  console.log("=== Testing Fixed Key Generation ===\n");

  // Generate random seed
  try {
    const randomSeed = addon.generateRandomSeed();
    console.log(`Random seed: ${randomSeed}\n`);
  } catch (error) {
    console.error("Random seed generation failed:", error);
  }

  // Test with known seed
  const testSeed =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Validate seed
  const isValid = addon.validateSeedPhrase(testSeed);
  console.log(`Seed valid: ${isValid}\n`);

  // Generate single key
  const singleKey = addon.generateSingleKey(testSeed, 0);
  console.log("Single key result:");
  console.log(`  Index: ${singleKey.index}`);
  console.log(`  Address: ${singleKey.address}`);
  console.log(
    `  Private Key (Base58): ${singleKey.privateKeyBase58.substring(0, 20)}...`
  );
  console.log(`  Derivation Path: ${singleKey.derivationPath}`);
  console.log(
    `  Generation Time: ${singleKey.generationTimeMs.toFixed(3)}ms\n`
  );

  // Generate batch
  console.log("Batch generation test:");
  const batch = addon.generateKeyBatch(testSeed, 0, 5);
  console.log(`Generated ${batch.length} keys in batch`);
  console.log(
    `Average generation time: ${batch[0].generationTimeMs.toFixed(
      3
    )}ms per key\n`
  );

  // Search test
  console.log("Address search test:");
  const startTime = Date.now();
  const foundIndex = addon.findAddressIndex(testSeed, singleKey.address, 10);
  const searchTime = Date.now() - startTime;
  console.log(`Found address at index: ${foundIndex} in ${searchTime}ms`);
}

testKeyGeneration().catch(console.error);
