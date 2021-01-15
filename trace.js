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
const bobKeypairStr =
  "c62b60189baef6ab957cf3538e83336ef1994455e4345ba4fdf446cb65f38679015d662e3d4cfbe831b2c30a7925419b1bd5ea3e13cb5471337bdcd02ca0bce0";
const bobKeypair = FindoraWasm.keypair_from_str(bobKeypairStr);
const bobPublic = FindoraWasm.public_key_to_base64(bobKeypair.get_pk());
console.log(bobPublic);
const aliceKeypariStr =
  "c7a446e3de7c6fee0ab880218ad389ba10ea07fbf53c1f642ca2b824852af02e1dee3efa74a8e29ad940d03f328fcf0e56a97484b68b9020ffed99d47579f7a6";
const aliceKeypair = FindoraWasm.keypair_from_str(aliceKeypariStr);

async function createTrackAsset() {
  // const bobKeypair = FindoraWasm.new_keypair();
  // const keypairStr = FindoraWasm.keypair_to_str(bobKeypair);
  const tokenCode = FindoraWasm.random_asset_type();
  console.log(tokenCode);
  const memo = "traceable asset";
  const trackingKey = FindoraWasm.AssetTracerKeyPair.new();

  console.log(trackingKey);

  const tracingPolicy = FindoraWasm.TracingPolicy.new_with_tracking(
    trackingKey
  );
  const assetRules = FindoraWasm.AssetRules.new().add_tracing_policy(
    tracingPolicy
  );
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(bobKeypair, memo, tokenCode, assetRules)
    .transaction();
  await network.submitTransaction(definitionTransaction);
  console.log("Asset created.");
}

// createTrackAsset();

//issue Track Asset
async function issueTrackAsset() {
  const tokenCode = "2aBk_5oPkdRJZZ97lp8SkzLRYZW_6vkZZb1qMM3eM_Y=";
  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const publicParams = FindoraWasm.PublicParams.new();
  const seqID = BigInt(await network.getIssuanceNum(tokenCode));
  const amount = BigInt(1000);
  const confidential_amount_flag = true;
  const issueOp = FindoraWasm.TransactionBuilder.new(
    blockCount
  ).add_basic_issue_asset(
    bobKeypair,
    tokenCode,
    seqID,
    amount,
    confidential_amount_flag,
    publicParams
  );
  const issueTxn = issueOp.transaction();
  console.log(issueTxn);
  // let handle = await network.submitTransaction(issueTxn);
  // console.log(handle);
  // let status = await network.getTxnStatus(handle);
  // console.log(status);
}
issueTrackAsset();


async function TransferTrackAsset() {
  const amount = BigInt(100);
  const transferAmount = BigInt(75);
  const confidential_amount_flag = true;
  const tokenCode = "2aBk_5oPkdRJZZ97lp8SkzLRYZW_6vkZZb1qMM3eM_Y=";
  const assetJson = await network.getAsset(tokenCode);
  const tracingPolicies = FindoraWasm.AssetType.from_json(
    assetJson
  ).get_tracing_policies();
  const utxoSid = 2794; //get_owned_utxos
  const utxo = await network.getUtxo(utxoSid);
  const assetRecord = FindoraWasm.ClientAssetRecord.from_json(utxo.utxo);
  let ownerMemoJson = await network.getOwnerMemo(utxoSid);
  let ownerMemo = FindoraWasm.OwnerMemo.from_json(ownerMemoJson);
  let txoRef = FindoraWasm.TxoRef.absolute(BigInt(utxoSid));
  const transferOp1Builder = FindoraWasm.TransferOperationBuilder.new()
    .add_input_with_tracking(
      txoRef,
      assetRecord,
      ownerMemo,
      tracingPolicies,
      bobKeypair,
      amount
    )
    .add_output_with_tracking(
      transferAmount,
      aliceKeypair.get_pk(),
      tracingPolicies,
      tokenCode,
      confidential_amount_flag,
      false
    )
    .add_output_with_tracking(
      amount - transferAmount,
      aliceKeypair.get_pk(),
      tracingPolicies,
      tokenCode,
      confidential_amount_flag,
      false
    )
    .create()
    .sign(bobKeypair);
  const transferOp1Txn = transferOp1Builder.transaction();
  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const xfrTxn1Builder = FindoraWasm.TransactionBuilder.new(
    blockCount
  ).add_transfer_operation(transferOp1Txn);
  const xfrTxn1 = xfrTxn1Builder.transaction();
  console.log(xfrTxn1);
  // const handle = await network.submitTransaction(xfrTxn1);
  // console.log(handle);
  // const status = await network.getTxnStatus(handle);
  // console.log(status);
}
// TransferTrackAsset();
function test(){
  
  const trackingKey = FindoraWasm.AssetTracerKeyPair.new();

  console.log(trackingKey);
}
// test();


async function trackAssetInfo(){
    const trackingKey = FindoraWasm.AssetTracerKeyPair.new();
  
 

  console.log(trackingKey);
  // a. Fetch the asset traced by the tracer
  const base64PubKey = FindoraWasm.public_key_to_base64(bobKeypair.get_pk());

  const allTracedAssets = await network.getTracedAssets(base64PubKey);

  const asset = FindoraWasm.asset_type_from_jsvalue(allTracedAssets[1].val);

  // b. Fetch the related transfer txn related to the asset to trace
  const txnSids = await network.getRelatedXfrs(asset);
    
 console.log(txnSids);

  const txn = await network.getTxn(txnSids[1]);

//   // c. Fetch the transfer note
  const xfrBody = txn.finalized_txn.txn.body.operations[0].TransferAsset.body.transfer;
//   // d. specify possible asset code to search. In upcoming versions, this won't be necessary.
  const assetsToTrace = [asset];
//   // e. look for tokenCode in the transfer note.

  const tracedAssets = FindoraWasm.trace_assets(
    xfrBody,
    trackingKey,
    assetsToTrace
  );
 console.log(tracedAssets);
}
// trackAssetInfo();