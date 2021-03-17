const FindoraWasm = require("./lib/pkg/wasm");
const Network = require("./lib/network.js");
const HOST = "mainnet-dev.findora.org";
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

const creditScoreAttribute = { name: "credit_score", size: 3 };
const incomeAttribute = { name: "income", size: 9 };
const credentialTemplate = [creditScoreAttribute, incomeAttribute];
const bobIssuerKeys = FindoraWasm.wasm_credential_issuer_key_gen(
  credentialTemplate
);

const aliceUserKeys = FindoraWasm.wasm_credential_user_key_gen(
  bobIssuerKeys.get_pk()
);

const attributeValues = [
  { name: "credit_score", val: "760" },
  { name: "income", val: "000100000" },
];
const credentialSignature = FindoraWasm.wasm_credential_sign(
  bobIssuerKeys.get_sk(),
  aliceUserKeys.get_pk(),
  attributeValues
);

const aliceCredential = FindoraWasm.create_credential(
  bobIssuerKeys.get_pk(),
  credentialSignature,
  attributeValues
);
console.log(aliceCredential);


const attributesToReveal = ["credit_score"]; // Alice will only reveal her credit score
const revealProof = FindoraWasm.wasm_credential_reveal(
  aliceUserKeys.get_sk(),
  aliceCredential,
  attributesToReveal
);

const revealValue = [{ name: "credit_score", val: "760" }];
assert.doesNotThrow(() =>
  FindoraWasm.wasm_credential_verify(
    bobIssuerKeys.get_pk(),
    revealValue,
    revealProof.get_commitment(),
    revealProof.get_pok()
  )
);