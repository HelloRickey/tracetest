const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
//set local node
const HOST = "localhost";
const SUBMISSION_PORT = "8669";
const LEDGER_PORT = "8668";
const QUERY_PORT = "8667";
const TENDERMINT_PORT="26657";
const PROTOCOL = "http";
const network = new Network.Network(
  PROTOCOL,
  HOST,
  QUERY_PORT,
  SUBMISSION_PORT,
  LEDGER_PORT,
  TENDERMINT_PORT
);
var count = 0;
var starttime;

const aliceKeyPair=FindoraWasm.new_keypair();

async function createAsset() {

  const tokenCode = FindoraWasm.random_asset_type();
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(aliceKeyPair, memo, tokenCode, assetRules)
    .transaction();
  const result = await network.submitTransaction(definitionTransaction);
  count++;
  console.log("Send:" + count);
}



async function startSubmit(submitCount) {
  for (var i = 0; i < submitCount; i++) {
    createAsset();
  }
}



async function getUnconfirmedCount(){
  const unconfirmed = await network.getUnconfirmed();
  var endtime = Date.parse(new Date());
  var runtime = (endtime-starttime)/1000;
  console.log("Unconfirmed Transactions Count:" + unconfirmed.result.total);
  console.log("Elapsed Time:" + runtime);
  if (unconfirmed.result.total == 0) {
    console.log("Result:" + submitCount / runtime + " txns/s");
    clearInterval(timer);
  }
}




var timer;
var isCountTime=true;
async function runtps(submitCount) {
  startSubmit(submitCount);
 
 
   timer = setInterval(function () {
  if (submitCount==count) {
    
    if (isCountTime) {
      starttime = Date.parse(new Date());
      isCountTime = false;
      
    }
    getUnconfirmedCount();
  }

    
   }, 1000);
}
//set total transaction count
const submitCount = 500;
runtps(submitCount);

