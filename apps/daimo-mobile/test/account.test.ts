import { Account, parseAccount, serializeAccount } from "../src/model/account";

const correctSerV1 = `{"storageVersion":1,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test"}`;

const correctSerV2 = `{"storageVersion":2,"name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const lowercaseAddrV2 = `{"storageVersion":2,"name":"test","address":"0xef4396d9ff8107086d215a1c9f8866c54795d7c7","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"enclaveKeyName":"test","pushToken":null}`;

const accountFromV2: Account = {
  enclaveKeyName: "test",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",
  createdAt: 1690000000,
  homeCoin: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",
  homeChainID: 84531,

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 0,
  lastFinalizedBlock: 0,

  namedAccounts: [],
  recentTransfers: [],

  pushToken: null,
};

const correctSerV3 = `{"storageVersion":3,"enclaveKeyName":"test","name":"test","address":"0x0000000000000000000000000000000000000123","lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"pushToken":null}`;

const accountFromV3: Account = {
  enclaveKeyName: "test",
  name: "test",
  address: "0x0000000000000000000000000000000000000123",
  createdAt: 1690000000,
  homeCoin: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf",
  homeChainID: 84531,

  lastBalance: BigInt(123),
  lastBlockTimestamp: 789,
  lastBlock: 101,
  lastFinalizedBlock: 99,

  namedAccounts: [],
  recentTransfers: [],

  pushToken: null,
};

const correctSerV4 = `{"storageVersion":4,"enclaveKeyName":"test","name":"test","address":"0x0000000000000000000000000000000000000123","createdAt":1700000000,"homeCoin":"0x1B85deDe8178E18CdE599B4C9d913534553C3dBf","homeChainID":84531,"lastBalance":"123","lastBlock":101,"lastBlockTimestamp":789,"lastFinalizedBlock":99,"recentTransfers":[],"namedAccounts":[],"pushToken":null}`;

const account: Account = {
  ...accountFromV3,
  createdAt: 1700000000,
};

describe("Account", () => {
  it("serializes", async () => {
    const ser = serializeAccount(account);
    expect(ser).toEqual(correctSerV4);
  });

  it("deserializes", () => {
    const a = parseAccount(correctSerV4);
    expect(a).toEqual(account);
  });

  it("fixes address checksum", () => {
    const a = parseAccount(lowercaseAddrV2);
    expect(a?.address).toEqual("0xEf4396d9FF8107086d215a1c9f8866C54795D7c7");
  });

  it("drops V1", () => {
    // Drop V1 accounts, testnet users re-onboard.
    const a = parseAccount(correctSerV1);
    expect(a).toBeNull();
  });

  it("migrates V2", () => {
    const a = parseAccount(correctSerV2);
    expect(a).toEqual(accountFromV2);
  });

  it("migrates V3", () => {
    const a = parseAccount(correctSerV3);
    expect(a).toEqual(accountFromV3);
  });
});
