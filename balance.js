const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
//set local node
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


// const aliceKeyPair = FindoraWasm.new_keypair();
// const aliceKeyPairStr = FindoraWasm.keypair_to_str(aliceKeyPair);
// console.log(aliceKeyPairStr);

// const bobKeyPair = FindoraWasm.new_keypair();
// const bobKeyPairStr = FindoraWasm.keypair_to_str(bobKeyPair);
// console.log(bobKeyPairStr);

// const tokenCode = FindoraWasm.random_asset_type();
// console.log(tokenCode);

const assetcode="BU3M4KE0C3bRtsZJv-7wBB8KgnNDDglAQlnoLta6QEE=";


const aliceKeyPair_Recover = FindoraWasm.keypair_from_str(
  "787a6694bcd2d25ed59654dad84c53a5ee309f246609295a002edf22a6b2f19cfcf71fbbd9d69acf7690ea0f613b7e634b0752d4cf588e20a65e9d4563120bce"
);

const bobKeyPair_Recover = FindoraWasm.keypair_from_str(
  "fae4f1c5a27310eee23986114919dd3492fa9918bee13850e8fc3f574f199e77aee43335690837bea11a2c16f2310a32135765d288d36873cee874de0a1f0900"
);

console.log(FindoraWasm.public_key_to_base64(aliceKeyPair_Recover.get_pk()));

console.log(FindoraWasm.public_key_to_base64(bobKeyPair_Recover.get_pk()));

// createAsset(aliceKeyPair_Recover, assetcode);

async function createAsset(keypair, tokenCode) {
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(keypair, memo, tokenCode, assetRules)
    .transaction();
  const result = await network.submitTransaction(definitionTransaction);
  console.log(result);
  return tokenCode;
}


// issueAsset(aliceKeyPair_Recover, assetcode, 10000);

async function issueAsset(keypair,tokenCode,issueAmount) {
  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const zeiParams = FindoraWasm.PublicParams.new();
  const seqID = BigInt(await network.getIssuanceNum(tokenCode));
  const amount = BigInt(issueAmount);
  const confidential = true;
  const issueTxn = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_basic_issue_asset(
      keypair,
      tokenCode,
      seqID,
      amount,
      confidential,
      zeiParams
    )
    .transaction();
  const handle = await network.submitTransaction(issueTxn);
  console.log(handle);
}




async function publicTransfer(fromKeypair,toPublicKey,tokenCode){
    const publickey=FindoraWasm.public_key_to_base64(fromKeypair.get_pk())
    console.log(publickey);
    const utxos = await network.getOwnedSids(publickey);
    console.log(utxos);
    for(var i=0;i<utxos.length;i++){
        const utxo = await network.getUtxo(utxos[i]);
        console.log(utxo);
        // const assetRecord = FindoraWasm.ClientAssetRecord.from_json(utxo.utxo);
        // console.log(assetRecord);
    }

    // const transferOp = FindoraWasm.TransferOperationBuilder.new()
    //   .add_input_no_tracking(
    //     txoRef,
    //     assetRecord,
    //     ownerMemo,
    //     aliceKeyPair,
    //     BigInt(transferAmount - 2)
    //   )
    //   .add_output_no_tracking(
    //     BigInt(transferAmount - 2),
    //     bobKeyPair.get_pk(),
    //     tokenCode
    //   )
    //   .balance()
    //   .create()
    //   .sign(aliceKeyPair)
    //   .transaction();
}
// publicTransfer(
//   aliceKeyPair_Recover,
//   "ruQzNWkIN76hGiwW8jEKMhNXZdKI02hzzuh03gofCQA=",
//   assetcode
// );

async function calBalance(fromKeypair){
    const publickey=FindoraWasm.public_key_to_base64(fromKeypair.get_pk())
    console.log(publickey);
    const utxos = await network.getOwnedSids(publickey);
    console.log(utxos);
    const assets=[]
    for(var i=0;i<utxos.length;i++){
        const utxo = await network.getUtxo(utxos[i]);
        const assetIndex=assets.indexOf(utxo.utxo.record.asset_type.NonConfidential);
        if (assetIndex == -1) {
          assets.push({
            asset_type: utxo.utxo.record.asset_type.NonConfidential,
            aseet_amount: utxo.utxo.record.amount.NonConfidential,
          });
        } else {
            assets[assetIndex].aseet_amount =
              assets[assetIndex].aseet_amount +
              utxo.utxo.record.amount.NonConfidential;
        }
    }
    console.log(assets);
}
calBalance(aliceKeyPair_Recover);

