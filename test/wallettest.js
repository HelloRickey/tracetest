const {
  derivePath,
  getMasterKeyFromSeed,
  getPublicKey,
} = require("ed25519-hd-key");
var bip39 = require("bip39");

var ed25519 = require("ed25519");
async function getSeed(){
    var mnemonic = bip39.generateMnemonic();
    console.log(mnemonic);
    var seed = await bip39.mnemonicToSeed(mnemonic);
    var seed_str = await seed.toString("hex");
    console.log(seed_str);
    
    var keyPair = ed25519.MakeKeypair(seed);
    console.log(keyPair);
  
}


getSeed();
// 
// 