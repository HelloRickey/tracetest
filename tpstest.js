const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
const HOST = "testnet-new.findora.org";
const SUBMISSION_PORT = "8669";
const LEDGER_PORT = "8668";
const QUERY_PORT = "8667";
const PROTOCOL = "https";
const network = new Network.Network(
  PROTOCOL,
  HOST,
  QUERY_PORT,
  SUBMISSION_PORT,
  LEDGER_PORT
);

async function createAsset() {
  const aliceKeyPairStr =
    "eb5399f890043df675daeb1567f9c5f2acc6193d07da87251ab3bce8980fd4e38f2d4cc590f6d036dd83eea2eeb0b84127e896071805c3bc40fe162b447c18de";
  const aliceKeyPair = FindoraWasm.keypair_from_str(aliceKeyPairStr);
 const tokenCode = FindoraWasm.random_asset_type();
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(aliceKeyPair, memo, tokenCode, assetRules)
    .transaction();
  const result = await network.submitTransaction(definitionTransaction);
  console.log("Block Height:" + blockCount);
  console.log("Create Asset Result：" + result);
}
setInterval(function () {
  createAsset();
}, 1000);
