// Copyright © 2020 Findora. All rights reserved.
//
// This file contains a module for composing requests to Findora’s RESTful API. /

/** @module Findora-Network */

const axios = require('axios');

class Network {
  /**
   * Creates an new Network object.
   * @param {string} protocol - Network protocol (e.g. http).
   * @param {string} host - Hostname (e.g. `localhost`, `staging.findora.org` or `testnet.findora.org`).
   * @param {int} queryPort - Query server port.
   * @param {int} submitPort - Submission server port.
   * @param {int} ledgerPort - Ledger server port.
   * @constructor
   */
  constructor(protocol, host, queryPort, submitPort, ledgerPort) {
    this.config = {
      protocol, host, queryPort, submitPort, ledgerPort,
    };
  }

  getSubmitRoute() {
    return `${this.config.protocol}://${this.config.host}:${this.config.submitPort}`;
  }

  getQueryRoute() {
    return `${this.config.protocol}://${this.config.host}:${this.config.queryPort}`;
  }

  getLedgerRoute() {
    return `${this.config.protocol}://${this.config.host}:${this.config.ledgerPort}`;
  }

  /**
   * Given a transaction handle, returns a promise that will eventually provide the status of a
   * transaction that has been submitted to the submission server.
   * @param {handle} - Transaction handle string.
   */
  async getTxnStatus(handle) {
    const status = await axios.get(`${this.getSubmitRoute()}/txn_status/${handle}`);
    return status.data;
  }

  /**
   * Submit a transaction to the ledger and return a promise for the
   * ledger's eventual response. The transaction will be enqueued for
   * validation. If it is valid, it will eventually be committed to the
   * ledger.

   * To determine whether or not the transaction has been committed to the ledger,
   * query the ledger by transaction handle.

   * Contained in the response of `submit_transaction` is a `TransactionHandle` that can be used to
   * query the status of the transaction.
   * @param {txn} - JSON-encoded transaction string.
   */
  async submitTransaction(txn) {
    const handle = await axios.post(`${this.getSubmitRoute()}/submit_transaction`, JSON.parse(txn));
    return handle.data;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded transaction object.
   * Otherwise, returns 'not found'. The request fails if the transaction index does not correspond
   * to a transaction.
   *
   * @param {int} txnSid - Transaction SID, which can be fetched by getRelatedSids.
   * @throws Will throw an error if the transaction cannot be fetched from the server.
   */
  async getTxn(txnSid) {
    const txn = await axios.get(`${this.getLedgerRoute()}/txn_sid/${txnSid}`);
    return txn.data;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded object representing the asset definition, including
   * properties and other information.
   *
   * See getAssetProperties about how to get the asset properties.
   *
   * @param {int} code - Asset token code.
   * @throws Will throw an error if the asset information cannot be fetched from the server.
   */
  async getAsset(code) {
    const asset = await axios.get(`${this.getLedgerRoute()}/asset_token/${code}`);
    return asset.data;
  }

  /**
   * If successful, returns a promise that will eventually provide the asset issuance number for a provided asset.
   *
   * @param {String} code - Asset token code.
   * @throws Will throw an error if the asset issuance number cannot be fetched from the server.
   */
  async getIssuanceNum(code) {
    const asset = await axios.get(`${this.getLedgerRoute()}/asset_issuance_num/${code}`);
    return asset.data;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded object representing the asset properties, including:
   * code, issuer, memo, and asset_rules.
   *
   * Asset properties are part of the asset definition. Use getAsset to get the asset definition.
   *
   * @param {int} code - Asset token code.
   * @throws Will throw an error if the asset information cannot be fetched from the server.
   */
  async getAssetProperties(code) {
    const asset = await axios.get(`${this.getLedgerRoute()}/asset_token/${code}`);
    return asset.data.properties;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded object representing the state commitment of the ledger.
   *
   * @throws Will throw an error if the state commitment cannot be fetched from the server.
   */
  async getStateCommitment() {
    const stateCommitment = await axios.get(`${this.getLedgerRoute()}/global_state`);
    return stateCommitment.data;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded utxo object, which can be used to construct a ClientAssetRecord.
   *
   * @param {int} utxoSid - UTXO SID, which can be fetched by getOwnedSids.
   * @throws Will throw an error if the utxo at the given index
   * cannot be fetched from the ledger server.
   */
  async getUtxo(utxoSid) {
    const res = await axios.get(`${this.getLedgerRoute()}/utxo_sid/${utxoSid}`);
    return res.data;
  }

  /**
   * If successful, returns a promise that will eventually provide a
   * JSON-encoded AIR result object.
   *
   * @param {String} key - Stringified credential user key.
   */
  async getAIRResult(addr) {
    const res = await axios.get(`${this.getLedgerRoute()}/air_address/${addr}`);
    return res.data;
  }

  /**
   * If successful, returns a list of transaction SIDs related to the given address.
   *
   * Note: this is different from getOwnedSids which returns a list of UTXO SIDs.
   *
   * @param {string} address - Base64 encoded address string.
   * @throws Will throw an error if the utxo list cannot be fetched from the server.
   */
  async getRelatedSids(address) {
    const sids = await axios.get(`${this.getQueryRoute()}/get_related_txns/${address}`);
    return sids.data;
  }

  /**
   * If successful, returns a list of transfer transaction SIDs related to the given asset token code.
   * 
   * Note: a transfer transaction is ralted to an asset token code if the asset is transferred nonconfidentially in the transaction.
   *
   * @param {string} code - Asset token code.
   * @throws Will throw an error if the asset information cannot be fetched from the server.
   */
  async getRelatedXfrs(code) {
    const sids = await axios.get(`${this.getQueryRoute()}/get_related_xfrs/${code}`);
   
    return sids.data;
  }

  /**
   * If successful, returns a list of UTXO SIDs owned by the given address.
   *
   * Note: this is different from getRelatedSids which returns a list of transaction SIDs.
   *
   * @param {string} address - Base64 encoded address string.
   * @throws Will throw an error if the utxo list cannot be fetched from the server.
   */
  async getOwnedSids(address) {
    const sids = await axios.get(`${this.getQueryRoute()}/get_owned_utxos/${address}`);
    return sids.data;
  }

  /**
   * If successful, returns a list of UTXO SIDs owned by the given address.
   *
   * @param {int} utxoSid - UTXO SID, which can be fetched by getOwnedSids.
   * @throws Will throw an error if the owner memo cannot be fetched from the server.
   */
  async getOwnerMemo(utxoSid) {
    const memo = await axios.get(`${this.getQueryRoute()}/get_owner_memo/${utxoSid}`);
    return memo.data;
  }

  /**
   * If successful, returns a list of asset codes created by the given address.
   *
   * @param {string} address - Base64 encoded address string.
   * @throws Will throw an error if the created assets cannot be fetched from the server.
   */
  async getCreatedAssets(address) {
    const sids = await axios.get(`${this.getQueryRoute()}/get_created_assets/${address}`);
    return sids.data;
  }

  /**
   * If successful, returns a list of asset codes traced by the given address.
   *
   * @param {string} address - Base64 encoded address string.
   * @throws Will throw an error if the created assets cannot be fetched from the server.
   */
  async getTracedAssets(address) {
    const sids = await axios.get(`${this.getQueryRoute()}/get_traced_assets/${address}`);
    return sids.data;
  }

  /**
   * If successful, returns the custom data stored by the query server at a certain key.
   *
   * @param {string} key - Base64 encoded custom data key.
   * @see {@link module:Findora-Wasm~Key|Key} for instructions on generating a custom data key.
   * @see {@link module:Findora-Wasm~TransactionBuilder#add_operation_kv_update_with_hash|
   * add_operation_kv_update_with_hash} for instructions on
   * adding a hash to the ledger's custom data store.
   * @see {@link module:Findora-Network~Network#storeCustomData|storeCustomData} for instructions on how to store custom data
   * on the query server.
   */
  async getCustomData(key) {
    const result = await axios.get(`${this.getQueryRoute()}/get_custom_data/${key}`);
    return result.data;
  }

  /**
   * If successful, stores data on the query server that matches the hash stored in the ledger's
   * custom data store.
   *
   * @param {Array} customData - Array containing a base64-encoded key, byte array representing the data,
   * and a JSON blind.
   * @see {@link module:Findora-Wasm~Key|Key} for instructions on generating a custom data key.
   * @see {@link module:Findora-Wasm~KVBlind|KVBlind} for instructions on generating a blind.
   * @see {@link module:Findora-Wasm~TransactionBuilder#add_operation_kv_update_with_hash|
   * add_operation_kv_update_with_hash} for instructions on
   * adding a hash to the ledger's custom data store.
   * @see {@link module:Findora-Network~Network#getCustomData|getCustomData}
   * for instructions on how to fetch custom data
   * from the query server.
   * @throws Will throw an error if the data provided does not hash to the hash stored by the ledger at the provided key.
   */
  async storeCustomData(customData) {
    const result = await axios.post(`${this.getQueryRoute()}/store_custom_data`, customData);
    return result.data;
  }

  /**
   * If successful, returns a list of records issued by the given address.
   *
   * @param {string} address - Base64 encoded address string.
   * @throws Will throw an error if the issued record list cannot be fetched from the server.
   */
  async getIssuedRecords(address) {
    const records = await axios.get(`${this.getQueryRoute()}/get_issued_records/${address}`);
    return records.data;
  }

  /**
   * If successful, returns the hash stored by the ledger's custom data store at the provided key.
   *
   * @param {string} key - Base64 encoded custom data key.
   * @see {@link module:Findora-Wasm~Key|Key} for instructions on generating a custom data key.
   * @see {@link module:Findora-Wasm~TransactionBuilder#add_operation_kv_update_with_hash|
   * add_operation_kv_update_with_hash} for instructions on
   * adding a hash to the ledger's custom data store.
   */
  async getCustomDataHash(key) {
    const result = await axios.get(`${this.getLedgerRoute()}/kv_lookup/${key}`);
    return result.data;
  }
}

module.exports = {
  Network,
};
