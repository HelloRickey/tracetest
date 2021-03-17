const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
const HOST = "testnet-new.findora.org";
const SUBMISSION_PORT = "8669";
const LEDGER_PORT = "8668";
const QUERY_PORT = "8667";
const TENDERMINT_PORT = "26657";
const PROTOCOL = "https";
const network = new Network.Network(
  PROTOCOL,
  HOST,
  QUERY_PORT,
  SUBMISSION_PORT,
  LEDGER_PORT,
  TENDERMINT_PORT
);
async function createAsset() {
  const keypair = FindoraWasm.new_keypair();
  const publickey = FindoraWasm.public_key_to_base64(keypair.get_pk());
  console.log(publickey);
  const tokenCode = FindoraWasm.random_asset_type();
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(keypair, memo, tokenCode, assetRules)
    .transaction();
  const result = await network.submitTransaction(definitionTransaction);
  console.log(result);
  console.log(tokenCode);
}
createAsset();