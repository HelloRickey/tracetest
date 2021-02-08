const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
const base64 = require("base64-js");
//set local node
const HOST = "101.32.221.153";
const SUBMISSION_PORT = "8669";
const LEDGER_PORT = "8668";
const QUERY_PORT = "8667";
const TENDERMINT_PORT = "26657";
const PROTOCOL = "http";
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

// const lucyKeyPair = FindoraWasm.new_keypair();
// const lucyKeyPairStr = FindoraWasm.keypair_to_str(lucyKeyPair);


const lucyKeyPair_Recover = FindoraWasm.keypair_from_str(
  "f67e0981531d7c22f628d892a39a8a1fafeeb6728dd2b1137a4e735225d37ff3bbe4738ece0359ab8895d14708e79282971ef62b7aac258136f21a26c9320e33"
);
const lucyPrivateKey = FindoraWasm.get_priv_key_str(lucyKeyPair_Recover);

console.log(lucyPrivateKey);

const assetcode = "GITikpjdhgwZQA3z0QCXiN8mHfyTUn-vXpHpBS1Swu4=";

const aliceKeyPair_Recover = FindoraWasm.keypair_from_str(
  "787a6694bcd2d25ed59654dad84c53a5ee309f246609295a002edf22a6b2f19cfcf71fbbd9d69acf7690ea0f613b7e634b0752d4cf588e20a65e9d4563120bce"
);


const bobKeyPair_Recover = FindoraWasm.keypair_from_str("fae4f1c5a27310eee23986114919dd3492fa9918bee13850e8fc3f574f199e77aee43335690837bea11a2c16f2310a32135765d288d36873cee874de0a1f0900");

const alicePrivateKey = FindoraWasm.get_priv_key_str(bobKeyPair_Recover);
console.log(alicePrivateKey);

const alicePublickey = FindoraWasm.public_key_to_base64(
  aliceKeyPair_Recover.get_pk()
);
console.log("alice:" + alicePublickey);


// console.log(FindoraWasm.public_key_to_base64(aliceKeyPair_Recover.get_pk()));

// console.log(FindoraWasm.public_key_to_base64(bobKeyPair_Recover.get_pk()));


async function createAsset(keypair, tokenCode) {
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(keypair, memo, tokenCode, assetRules)
    .transaction();
  const result = await network.submitTransaction(definitionTransaction);
  console.log(result);
  console.log(tokenCode);
  return tokenCode;
}



async function issueAsset(keypair, tokenCode, issueAmount) {
  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const zeiParams = FindoraWasm.PublicParams.new();
  const seqID = BigInt(await network.getIssuanceNum(tokenCode));
  const amount = BigInt(issueAmount);
  const confidential = false;
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
  console.log(issueTxn);
  const handle = await network.submitTransaction(issueTxn);
  console.log(handle);
}

async function publicTransfer(fromKeypair, toPublicKey,toPublicKey2, tokenCode) {
  const publickey = FindoraWasm.public_key_to_base64(fromKeypair.get_pk());
  const utxos = await network.getOwnedSids(publickey);
  console.log(utxos);
  var transferOp = FindoraWasm.TransferOperationBuilder.new();
  const ownerMemo = undefined;
  for (var i = 0; i < utxos.length; i++) {
    const utxo = await network.getUtxo(utxos[i]);
    const assetName = FindoraWasm.asset_type_from_jsvalue(
      utxo.utxo.record.asset_type.NonConfidential
    );
    if (assetName == tokenCode) {
      const assetRecord = FindoraWasm.ClientAssetRecord.from_json(utxo.utxo);
      const txoRef = FindoraWasm.TxoRef.absolute(BigInt(utxos[i]));
      transferOp = transferOp.add_input_no_tracking(
        txoRef,
        assetRecord,
        ownerMemo,
        fromKeypair,
        BigInt(20)
      );
      console.log(transferOp);
    }
  
  }

  transferOp = transferOp
    .add_output_no_tracking(
      BigInt(10),
      FindoraWasm.public_key_from_base64(toPublicKey),
      tokenCode,
      true,
      true
    )
    .add_output_no_tracking(
      BigInt(10),
      FindoraWasm.public_key_from_base64(toPublicKey2),
      tokenCode,
      true,
      false
    )
    .balance()
    .create()
    .sign(fromKeypair)
    .transaction();

  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const transferTxn = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_transfer_operation(transferOp)
    .transaction();
  console.log(transferTxn);

    const handle = await network.submitTransaction(transferTxn);
    console.log(handle);
 
}


async function calBalance(fromKeypair) {
  const publickey = FindoraWasm.public_key_to_base64(fromKeypair.get_pk());
  console.log(publickey);
  const utxos = await network.getOwnedSids(publickey);
  console.log(utxos);
  const assets = [];

  for (var i = 0; i < utxos.length; i++) {
    const utxo = await network.getUtxo(utxos[i]);
    const assetName = FindoraWasm.asset_type_from_jsvalue(
      utxo.utxo.record.asset_type.NonConfidential
    );
    const assetIndex = assets.hasOwnProperty(assetName);

    if (assetIndex) {
      assets[assetName].asset_amount =
        parseInt(assets[assetName].asset_amount) +
        parseInt(utxo.utxo.record.amount.NonConfidential);
    } else {
      assets[assetName] = {
        asset_type: assetName,
        asset_amount: utxo.utxo.record.amount.NonConfidential,
      };
    }
  }
  console.log(assets);
}

// publicTransfer(
//   aliceKeyPair_Recover,
//   FindoraWasm.public_key_to_base64(bobKeyPair_Recover.get_pk()),
//   FindoraWasm.public_key_to_base64(lucyKeyPair_Recover.get_pk()),
//   assetcode
// );
createAsset(aliceKeyPair_Recover, assetcode);
// issueAsset(aliceKeyPair_Recover, assetcode, 100);
// calBalance(bobKeyPair_Recover);

