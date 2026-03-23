import { expect } from "chai";
import { ethers } from "hardhat";

describe("SignalRegistry", function () {
  let contract: any;
  let owner: any;

  const STAKE = ethers.parseEther("0.0001");

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SignalRegistry");
    contract = await Factory.deploy();
  });

  it("registers correctly", async () => {
    await contract.register({ value: STAKE });

    const state = await contract.currentState(owner.address);
    expect(state).to.equal(1); // ACTIVE
  });

  it("rejects wrong stake", async () => {
    await expect(contract.register({ value: 1 }))
      .to.be.revertedWithCustomError(contract, "InvalidStake");
  });

  it("emits signal", async () => {
    await contract.register({ value: STAKE });

    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    const signal = await contract.signals(0);
    expect(signal.topic).to.equal(topic);
  });

  it("enforces cooldown", async () => {
    await contract.register({ value: STAKE });

    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    await expect(contract.signal(topic, 0))
      .to.be.revertedWithCustomError(contract, "InCooldown");
  });

  it("allows signal after cooldown", async () => {
    await contract.register({ value: STAKE });

    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    await ethers.provider.send("evm_increaseTime", [300]);
    await ethers.provider.send("evm_mine", []);

    await contract.signal(topic, 1);
  });

  it("decays weight over time", async () => {
    await contract.register({ value: STAKE });

    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    await ethers.provider.send("evm_increaseTime", [43200]); // 12h
    await ethers.provider.send("evm_mine", []);

    const weight = await contract.effectiveWeight(0);

    expect(weight).to.be.lt(STAKE);
  });

  it("weight becomes zero after 24h", async () => {
    await contract.register({ value: STAKE });

    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    const weight = await contract.effectiveWeight(0);
    expect(weight).to.equal(0);
  });

  it("deregisters and returns stake", async () => {
    await contract.register({ value: STAKE });

    const before = await ethers.provider.getBalance(owner.address);

    const tx = await contract.deregister();
    const receipt = await tx.wait();

    const gas = receipt!.gasUsed * receipt!.gasPrice!;

    const after = await ethers.provider.getBalance(owner.address);

    expect(after + gas).to.be.closeTo(before + STAKE, STAKE / 100n);
  });

  it("detects silence", async () => {
    await contract.register({ value: STAKE });

    await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
    await ethers.provider.send("evm_mine", []);

    expect(await contract.isSilent(owner.address)).to.equal(true);
  });
});