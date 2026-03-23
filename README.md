# SignalRegistry — Rootstock Testnet

A decentralized **event-first signaling primitive** built on Rootstock (RSK), enabling users to stake, emit signals, and observe time-based decay of influence.

---

## 📦 Project Overview

SignalRegistry allows users to:

- Stake RBTC to become a broadcaster
- Emit signals (SUPPORT / OPPOSE / NEUTRAL) on topics
- Have signal influence decay over time (24h window)
- Enter cooldown periods between actions
- Query signal weight and broadcaster state

---

## 🚀 Deployment

### Contract Address (RSK Testnet)

```

SignalRegistryModule#SignalRegistry
0x214e2316EAEeE24c1dc5d8433329fFC7544DA331

````

---

## 🔍 Contract Verification

Verify manually:

```bash
npx hardhat verify --network rskTestnet 0x214e2316EAEeE24c1dc5d8433329fFC7544DA331
````

### Verified Contract

[https://rootstock-testnet.blockscout.com/address/0x214e2316EAEeE24c1dc5d8433329fFC7544DA331#code](https://rootstock-testnet.blockscout.com/address/0x214e2316EAEeE24c1dc5d8433329fFC7544DA331#code)

---

## 🧪 Testing

Run tests:

```bash
REPORT_GAS=true npx hardhat test
```

### ✅ Test Coverage

* ✔ Prevents reentrancy on `deregister`
* ✔ Detects silence after threshold
* ✔ Handles cooldown boundaries precisely
* ✔ Tracks signal activity correctly
* ✔ Measures gas usage

---

## ⛽ Gas Report

| Function            | Avg Gas |
| ------------------- | ------- |
| `register()`        | 67,434  |
| `signal()`          | 167,941 |
| `deregister()`      | 35,192  |
| `checkpointDecay()` | 37,359  |

### Notes

* `signal()` is the most expensive due to:

  * state updates
  * decay tracking
  * event emission

---

## 🔐 Security Analysis

### Slither Results

Run:

```bash
slither contracts/SignalRegistry.sol
```

### ⚠️ Findings

#### 1. Dangerous Strict Equality

* Used in:

  * `currentState()`
  * `isSilent()`

```solidity
b.state == State.COOLING
b.state == State.UNREGISTERED
```

**Risk:** brittle logic if state transitions evolve.

---

#### 2. Reentrancy (Low Severity — Mitigated)

```solidity
(success, ) = msg.sender.call{value: STAKE_AMOUNT}();
```

* External call occurs **before event emission**

**Mitigation:**

* Covered with test:
  ✔ `prevents reentrancy on deregister`

---

#### 3. Timestamp Dependence

Used in:

* `signal()`
* `effectiveWeight()`
* `decayFraction()`
* `isSilent()`
* `currentState()`

```solidity
block.timestamp < lastSignalTime + COOLDOWN
```

**Risk:** miner manipulation (~±15 seconds)

**Assessment:** acceptable for time-decay logic

---

#### 4. Solidity Version Warning

```
^0.8.20
```

Known issues:

* VerbatimInvalidDeduplication
* MissingSideEffectsOnSelectorAccess

---

#### 5. Low-Level Call Usage

```solidity
msg.sender.call{value: STAKE_AMOUNT}()
```

**Recommendation:**

* Use checks-effects-interactions pattern (already mostly followed)

---

## 🧹 Linting (Solhint)

Run:

```bash
npx solhint "contracts/**/*.sol"
```

### Warnings

* Use **custom errors instead of `require`**
* Empty blocks in mock contract

---

## 📉 Decay Model

Signal weight decays linearly over 24 hours:

```
w(t) = stake × (1 − t / 24h)
```

| Time | Weight |
| ---- | ------ |
| 0h   | 100%   |
| 12h  | 50%    |
| 24h  | 0%     |

---

## 🔄 State Machine

```
UNREGISTERED → ACTIVE → COOLING → ACTIVE
```

* `register()` → ACTIVE
* `signal()` → COOLING
* cooldown expires → ACTIVE
* `deregister()` → UNREGISTERED

---

## 🧱 Project Structure

```
contracts/
  ├── SignalRegistry.sol
  ├── ReentrantMock.sol

test/
  ├── SignalRegistry.test.js

ignition/
  ├── modules/

frontend/
  ├── React UI (SignalRegistry.jsx)
```

---

## 🧠 Key Design Decisions

* **Event-first architecture** → off-chain indexing friendly
* **Manual ABI encoding** → no dependency on ethers/viem
* **Decay-based influence** → prevents signal spam dominance
* **Cooldown system** → rate-limits behavior

---

## ⚠️ Known Limitations

* Timestamp reliance (acceptable tradeoff)
* Manual encoding increases frontend complexity
* No batching (gas optimization opportunity)
* No off-chain indexing yet (TheGraph, etc.)

---

## 🔮 Future Improvements

* Integrate indexer (The Graph / custom indexer)
* Replace require with custom errors
* Add signature-based meta-transactions
* Optimize gas (struct packing, caching)
* Multi-chain deployment

---

## 📸 UI Preview

![Reentract](./reentract.png)

---

## 🧑‍💻 Author

Built for deep experimentation in:

* On-chain signaling primitives
* Time-decayed influence systems
* Event-driven smart contract design

---

## 📜 License

MIT

```
