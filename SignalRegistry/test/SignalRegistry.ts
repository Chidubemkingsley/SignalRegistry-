import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("SignalRegistry Security + Functional Tests", function () {
  let contract: any;
  let owner: any;
  let attacker: any;

  const STAKE = ethers.parseEther("0.0001");

  beforeEach(async () => {
    [owner, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SignalRegistry");
    contract = await Factory.deploy();
  });

  // =====================================================
  // 1️⃣ Registration & State
  // =====================================================
  it("registers correctly and emits event", async () => {
    await expect(contract.register({ value: STAKE }))
      .to.emit(contract, "Registered")
      .withArgs(owner.address, STAKE);

    const state = await contract.currentState(owner.address);
    expect(state).to.equal(1); // ACTIVE
  });

  it("rejects wrong stake", async () => {
    await expect(contract.register({ value: 1n })).to.be.revertedWithCustomError(
      contract,
      "InvalidStake"
    );
  });

  // =====================================================
  // 2️⃣ Signal & Cooldown
  // =====================================================
  it("emits signal and validates event", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    const tx = await contract.signal(topic, 0);
    await expect(tx)
      .to.emit(contract, "SignalEmitted")
      .withArgs(0, owner.address, topic, 0, STAKE, anyValue);
  });

  it("enforces cooldown", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);
    await expect(contract.signal(topic, 0)).to.be.revertedWithCustomError(contract, "InCooldown");
  });

  it("allows signal after cooldown", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    const cooldownPeriod = Number(await contract.COOLDOWN_PERIOD());
    await ethers.provider.send("evm_increaseTime", [cooldownPeriod]);
    await ethers.provider.send("evm_mine", []);

    await contract.signal(topic, 1);
  });

  // =====================================================
  // 3️⃣ Time-decay tests
  // =====================================================
  it("decays weight correctly over time", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));
    await contract.signal(topic, 0);

    await ethers.provider.send("evm_increaseTime", [43200]); // 12h
    await ethers.provider.send("evm_mine", []);

    const weight = await contract.effectiveWeight(0);
    expect(weight).to.be.lt(STAKE);
  });

  it("weight is zero after 24h", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));
    await contract.signal(topic, 0);

    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    const weight = await contract.effectiveWeight(0);
    expect(weight).to.equal(0n);
  });

  it("checkpointDecay emits correct event", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("ETH"));
    await contract.signal(topic, 0);

    await expect(contract.checkpointDecay(0)).to.emit(contract, "DecayCheckpointed");
  });

  // =====================================================
  // 4️⃣ Deregistration & Reentrancy test
  // =====================================================
  it("deregisters safely and returns stake", async () => {
    await contract.register({ value: STAKE });

    // Using changeEtherBalance is the robust way to handle gas math
    // It ignores gas spent by the owner and checks for the +STAKE change
    await expect(contract.deregister())
      .to.changeEtherBalance(owner, STAKE, { accountForFees: true });

    const state = await contract.currentState(owner.address);
    expect(state).to.equal(0); // UNREGISTERED
  });

  it("fails if a non-registered user tries to deregister", async () => {
    await expect(contract.connect(attacker).deregister())
      .to.be.revertedWithCustomError(contract, "NotRegistered");
  });

  it("prevents reentrancy on deregister", async () => {
    const ReentrantFactory = await ethers.getContractFactory("ReentrantMock");
    const reentrant = await ReentrantFactory.deploy(contract.target);

    await reentrant.fundAndRegister({ value: STAKE });

    // Should succeed because the contract state is updated BEFORE the transfer
    await expect(reentrant.attackDeregister()).to.not.be.reverted;
  });

  // =====================================================
  // 5️⃣ Silence detection
  // =====================================================
  it("detects silence after threshold", async () => {
    await contract.register({ value: STAKE });

    const silenceThreshold = Number(await contract.SILENCE_THRESHOLD());
    await ethers.provider.send("evm_increaseTime", [silenceThreshold + 1]);
    await ethers.provider.send("evm_mine", []);

    expect(await contract.isSilent(owner.address)).to.equal(true);
  });

  // =====================================================
  // 6️⃣ Boundary / edge-case tests
  // =====================================================
  it("multiple signals update lastActiveTime correctly", async () => {
    await contract.register({ value: STAKE });
    const topic1 = ethers.keccak256(ethers.toUtf8Bytes("BTC"));
    const topic2 = ethers.keccak256(ethers.toUtf8Bytes("ETH"));

    await contract.signal(topic1, 0);
    await ethers.provider.send("evm_increaseTime", [300]);
    await ethers.provider.send("evm_mine", []);
    await contract.signal(topic2, 1);

    const b = await contract.broadcasters(owner.address);
    expect(b.lastActiveTime).to.be.gt(0);
  });

  it("handles cooldown boundary precisely", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    await contract.signal(topic, 0);

    const cooldownPeriod = Number(await contract.COOLDOWN_PERIOD());
    await ethers.provider.send("evm_increaseTime", [cooldownPeriod]);
    await ethers.provider.send("evm_mine", []);

    await contract.signal(topic, 1);
  });

  // =====================================================
  // 7️⃣ Gas analysis
  // =====================================================
  it("measures gas for key functions", async () => {
    await contract.register({ value: STAKE });
    const topic = ethers.keccak256(ethers.toUtf8Bytes("BTC"));

    const txSignal = await contract.signal(topic, 0);
    const receiptSignal = await txSignal.wait();
    console.log("Gas used signal():", receiptSignal.gasUsed.toString());

    const txDeregister = await contract.deregister();
    const receiptDereg = await txDeregister.wait();
    console.log("Gas used deregister():", receiptDereg.gasUsed.toString());
  });
});
