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
// const bobKeypairStr =
//   "3b1b601c95ceaae1168ce8d7c821f4934942d05adab062fc21c01d3e16877664faa6ca6efe8c94db6d8bca0c64ab9cf4839003071ce56cfa7513d1c1a5f2ec20";
// const bobKeypair = FindoraWasm.keypair_from_str(bobKeypairStr);
// const bobPublic = FindoraWasm.public_key_to_base64(bobKeypair.get_pk());
// console.log(bobPublic);
// const aliceKeypariStr =
//   "e7f1e9a2f7f27cdc1dfe33c6fee5892de8fd43eef5a857c49a743a27309db26a865f34e0dc7bb7040647fac28e7814f8f947223a31c0db50156a60eb2441ce66";
const aliceKeyPair = FindoraWasm.keypair_from_str("09549a5e3760866da4cbd534b37c6b2455b4d3e2197074de595bc608d3a665adc02ebff8cb14565fd9c65162941f0753d5092238055d181aaeb77389db563337");
const alicePublic = FindoraWasm.public_key_to_base64(aliceKeyPair.get_pk());
console.log(alicePublic);

//   const aliceKeyPair = FindoraWasm.new_keypair();
//   const keypairStr = FindoraWasm.keypair_to_str(aliceKeyPair);
//   console.log(keypairStr);
//   const bobPublic = FindoraWasm.public_key_to_base64(bobKeypair.get_pk());
//   console.log(bobPublic);


const tokenCode = "wC6_-MsUVl_ZxlFilB8HU9UJIjgFXRgarrdzidtWMzc=";

async function createAsset() {

  const tokenCode = FindoraWasm.random_asset_type();
  console.log(tokenCode);
  const memo = "this is a test asset"; // Text that can be attached to an asset definition.
  const assetRules = FindoraWasm.AssetRules.new(); // Rules that restrict issuances and transfers involving this asset. To be covered in greater depth in another example. For now, use the default rules.
  const blockCount = BigInt((await network.getStateCommitment())[1]); // Necessary to prevent replays. If starting out, do not worry about this for now. If Alice were submitting this transaction to a live ledger, she would need to set this to the Ledger block count.
  const definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_operation_create_asset(aliceKeyPair, memo, tokenCode, assetRules)
    .transaction();
  const handle = await network.submitTransaction(definitionTransaction);
  console.log(handle);
}

async function issuerAsset(){

    const blockCount = BigInt((await network.getStateCommitment())[1]);
    const zeiParams = FindoraWasm.PublicParams.new(); // Cryptography public parameters necessary for creating asset records
    const seqID = BigInt(await network.getIssuanceNum(tokenCode)); // To prevent operation replays, each ```IssueAsset``` operation must include a unique and increasing issuance number.
    const amount = BigInt(1500); // Amount of the asset to issue.
    const confidential = false; // Whether the amount field of the asset record should be encrypted. Advanced features like confidentiality will be covered in a later example.

    // The ```IssueAsset``` operation below will, if accepted by the ledger, create a new asset record owned by Alice
    // with 5 units of the asset she has just created. It is important to note that asset issuers can only issue assets
    // to themselves (the next example covers asset transfers).
    console.log("Creating issuance transaction...");
    const issueTxn = FindoraWasm.TransactionBuilder.new(blockCount)
      .add_basic_issue_asset(
        aliceKeyPair,
        tokenCode,
        seqID,
        amount,
        confidential,
        zeiParams
      )
      .transaction();

    // Alice will now attempt to submit her transaction.
    console.log("Submitting transaction...");
    const handle = await network.submitTransaction(issueTxn);
    console.log(
      `Transaction submitted successfully! The transaction handle is ${handle}`
    );
}





async function transfer() {
  const status = await network.getTxnStatus(
    "d3e28dbf066e4d4eea15140d83a44f8d79d55102e2f529053f3234f9099f53d0"
  );
  const confSid = await status.Committed[1][0];
  const confUtxo = await network.getUtxo(confSid);

  const ownerMemoJson = await network.getOwnerMemo(confSid);

  console.log(ownerMemoJson);

  const ownerMemo = FindoraWasm.OwnerMemo.from_json(ownerMemoJson);
  const assetRecord = FindoraWasm.ClientAssetRecord.from_json(confUtxo.utxo);
  const decryptedRecord = FindoraWasm.open_client_asset_record(
    assetRecord,
    ownerMemo.clone(),
    aliceKeyPair
  );

  const transferAmount = BigInt(2);
  const txoRef1 = FindoraWasm.TxoRef.absolute(BigInt(10));
    const txoRef2 = FindoraWasm.TxoRef.absolute(BigInt(10));
    
  const blindedAmount = true;
  const blindedType = true;
  const transferOp = FindoraWasm.TransferOperationBuilder.new()
    .add_input_no_tracking(
      txoRef1,
      assetRecord,
      ownerMemo,
      aliceKeyPair,
      transferAmount
    )
    .add_input_no_tracking(
      txoRef2,
      assetRecord,
      ownerMemo,
      aliceKeyPair,
      transferAmount
    )
    .add_input_no_tracking(
      txoRef3,
      assetRecord,
      ownerMemo,
      aliceKeyPair,
      transferAmount
    )
    .add_output_no_tracking(
      transferAmount,
      bobKeyPair.get_pk(),
      tokenCode,
      blindedAmount,
      blindedType
    )
    .add_output_no_tracking(
      transferAmount,
      aliceKeyPair.get_pk(),
      tokenCode,
      blindedAmount,
      blindedType
    )
    .create()
    .sign(aliceKeyPair)
    .transaction();
  console.log(transferOp);
  const blockCount = BigInt((await network.getStateCommitment())[1]);
  const transferTxn = FindoraWasm.TransactionBuilder.new(blockCount)
    .add_transfer_operation(transferOp)
    .transaction();
  console.log(transferTxn);
  const handle = await network.submitTransaction(transferTxn);
  console.log(handle);
}







async function transfer_blind(){
  const status = await network.getTxnStatus(
    "d3e28dbf066e4d4eea15140d83a44f8d79d55102e2f529053f3234f9099f53d0"
  );
  const confSid = await status.Committed[1][0];
  const confUtxo = await network.getUtxo(confSid);

  const ownerMemoJson = await network.getOwnerMemo(confSid);

  console.log(ownerMemoJson);


  const ownerMemo = FindoraWasm.OwnerMemo.from_json(ownerMemoJson);
  const assetRecord = FindoraWasm.ClientAssetRecord.from_json(confUtxo.utxo);
  const decryptedRecord = FindoraWasm.open_client_asset_record(
    assetRecord,
    ownerMemo.clone(),
    aliceKeyPair
  );

  const transferAmount = BigInt(2);
  const txoRef = FindoraWasm.TxoRef.absolute(BigInt(confSid));
  const blindedAmount = true;
  const blindedType = true;
  const transferOp = FindoraWasm.TransferOperationBuilder.new()
    .add_input_no_tracking(
      txoRef,
      assetRecord,
      ownerMemo,
      aliceKeyPair,
      transferAmount
    )
    .add_output_no_tracking(
      transferAmount,
      bobKeyPair.get_pk(),
      tokenCode,
      blindedAmount,
      blindedType
    )
    .add_output_no_tracking(
      transferAmount,
      aliceKeyPair.get_pk(),
      tokenCode,
      blindedAmount,
      blindedType
    )
    .create()
    .sign(aliceKeyPair)
    .transaction();
console.log(transferOp);
const blockCount = BigInt((await network.getStateCommitment())[1]);
const transferTxn = FindoraWasm.TransactionBuilder.new(blockCount)
  .add_transfer_operation(transferOp)
  .transaction();
 console.log(transferTxn); 
const handle=await network.submitTransaction(transferTxn);
console.log(handle);

}

// transfer();




// createAsset();
// issuerAsset();