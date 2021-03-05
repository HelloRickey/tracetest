const Ledger = require("./lib/pkg/wasm");
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
async function store() {
    const aliceKp = Ledger.new_keypair();
    const blind = Ledger.KVBlind.gen_random();
    const data = [42, 32];
    const key = Ledger.Key.gen_random();
    const b64Key = key.to_base64();
    const state = await network.getStateCommitment();
    const blockCount = BigInt(state[1]);
    const kvTxn = Ledger.TransactionBuilder.new(blockCount)
      .add_operation_kv_update_with_hash(
        aliceKp,
        key,
        BigInt(blockCount),
        Ledger.KVHash.new_with_blind(data, blind)
      )
      .transaction();
    const handle = await network.submitTransaction(kvTxn);
    const authResult = await network.getCustomDataHash(b64Key);
    const stateCommitment = JSON.stringify((await network.getStateCommitment())[0]);
    const customData = [b64Key, data, blind.to_json()];
    const storeResult=await network.storeCustomData(customData);
    console.log(storeResult);
}

setInterval(async function(){
store(); 
},5000);
// setInterval(async function(){
//     const data2 = await network.getCustomData(
//     "ZcalHbT91zAzCPDybjq-hEbD3hop5pqFBlifJzKhDOs="
//     );
//     console.log(data2);
// },1500);
