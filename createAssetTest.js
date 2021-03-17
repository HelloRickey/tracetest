const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
//set local node
const HOST = "dev-staging.dev.findora.org";
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

async function createAsset(privatekey) {
  const keypair = FindoraWasm.create_keypair_from_secret(`"${privatekey}"`);
  const minimalFee = BigInt(FindoraWasm.fra_get_minimal_fee());
  const toPublickey = FindoraWasm.fra_get_dest_pubkey();
  const assetCode = FindoraWasm.fra_get_asset_code();
  const isBlindAmount = false;
  const isBlindType = false;

  let transferOp = FindoraWasm.TransferOperationBuilder.new();
  let sid = await getOneUtxoId(privatekey);

  const utxoData = await network.getUtxo(sid);

  const txoRef = FindoraWasm.TxoRef.absolute(BigInt(sid));
  const assetRecord = FindoraWasm.ClientAssetRecord.from_json(utxoData.utxo);
  const amount = utxoData.utxo.record.amount.NonConfidential;
  const ownerMemo = undefined;
  transferOp = transferOp.add_input_no_tracing(
    txoRef,
    assetRecord,
    ownerMemo,
    keypair,
    BigInt(amount)
  );

  transferOp = transferOp.add_output_no_tracing(
    BigInt(minimalFee),
    toPublickey,
    assetCode,
    isBlindAmount,
    isBlindType
  );

  let getChange = BigInt(amount) - minimalFee;

  transferOp = transferOp.add_output_no_tracing(
    BigInt(getChange),
    FindoraWasm.get_pk_from_keypair(keypair),
    assetCode,
    isBlindAmount,
    isBlindType
  );
  transferOp = transferOp.create().sign(keypair);

  const tokenCode = FindoraWasm.random_asset_type();
  const memo = "this is a test asset";
  const assetRules = FindoraWasm.AssetRules.new();
  let blockCount = BigInt((await network.getStateCommitment())[1]);
  let definitionTransaction = FindoraWasm.TransactionBuilder.new(blockCount);
  definitionTransaction = definitionTransaction.add_operation_create_asset(
    keypair,
    memo,
    tokenCode,
    assetRules
  );

  definitionTransaction = definitionTransaction.add_transfer_operation(
    transferOp.transaction()
  );
  const submitData = definitionTransaction.transaction();

  const result = await network.submitTransaction(submitData);
  console.log(result);
}

async function getOneUtxoId(privatekey) {
  const keypair = FindoraWasm.create_keypair_from_secret(`"${privatekey}"`);

  const publickey = FindoraWasm.public_key_to_base64(
    FindoraWasm.get_pk_from_keypair(keypair)
  );

  const utxos = await network.getOwnedSids(publickey);
  return utxos[0];
}

async function startSubmit(privateStrArray) {
  for (var i = 0; i < privateStrArray.length; i++) {
    await createAsset(privateStrArray[i]);
  }
}

var timer;

// timer = setInterval(function () {
//     let privateStrArray = [
//       "7ZLbEaHRajq9xXCCVT4ApX7yjEVFs5hyN27C9JvZ5Cs=",
//       "glzudSr1lCGmkLjETDeUDCP_hBNkCmXILnPHPCRuI5Y=",
//       "RsZ7qQc9Hr9lV4dcZIMZztiwlfVKdyOvZ5BXwUzDS-Y=",
//       "wpGxSYNAU3zRGw77iHzl49aEX_fylybBotAOEHduMNk=",
//       "5SPAYXK5dUAt7I6YmLXRDRBCis2mg-1KrmZuBsvAW4A=",
//       "Y6umoUmBJRPYJU5n_Y9bHuhoHm6aDMsxDI9FLJzOEXc=",
//       "Xtfv_LKPeIjrBqeuVkt9TfEe61G17SLDpbofevVhuhw=",
//     ];

//   startSubmit(privateStrArray);
// }, 2000);
function getPublicKey() {
  let privateStrArray = [
    "7ZLbEaHRajq9xXCCVT4ApX7yjEVFs5hyN27C9JvZ5Cs=",
    "glzudSr1lCGmkLjETDeUDCP_hBNkCmXILnPHPCRuI5Y=",
    "RsZ7qQc9Hr9lV4dcZIMZztiwlfVKdyOvZ5BXwUzDS-Y=",
    "wpGxSYNAU3zRGw77iHzl49aEX_fylybBotAOEHduMNk=",
    "5SPAYXK5dUAt7I6YmLXRDRBCis2mg-1KrmZuBsvAW4A=",
    "Y6umoUmBJRPYJU5n_Y9bHuhoHm6aDMsxDI9FLJzOEXc=",
    "Xtfv_LKPeIjrBqeuVkt9TfEe61G17SLDpbofevVhuhw=",
  ];
  for(var i=0;i<privateStrArray.length;i++){
 const keypair = FindoraWasm.create_keypair_from_secret(
   `"${privateStrArray[i]}"`
 );
      const publickey = FindoraWasm.public_key_to_base64(
        FindoraWasm.get_pk_from_keypair(keypair)
      );
      console.log(publickey);
  }
}
getPublicKey();