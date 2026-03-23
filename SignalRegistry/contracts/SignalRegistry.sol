// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SignalRegistry {
    // =============================================================
    //                          ERRORS
    // =============================================================
    error AlreadyRegistered();
    error NotRegistered();
    error NotActive();
    error InCooldown();
    error CooldownNotElapsed();
    error InvalidStake();
    error NoActiveStake();

    // =============================================================
    //                          ENUMS
    // =============================================================
    enum State {
        UNREGISTERED,
        ACTIVE,
        COOLING
    }

    enum SignalType {
        SUPPORT,
        OPPOSE,
        NEUTRAL
    }

    // =============================================================
    //                      CONFIG CONSTANTS
    // =============================================================
    uint256 public constant STAKE_AMOUNT = 0.0001 ether;
    uint256 public constant HALF_LIFE = 1 days;
    uint256 public constant COOLDOWN_PERIOD = 5 minutes;
    uint256 public constant SILENCE_THRESHOLD = 7 days;

    // =============================================================
    //                          STORAGE
    // =============================================================
    struct Broadcaster {
        State state;
        uint256 lastSignalTime;
        uint256 lastActiveTime;
    }

    struct Signal {
        address broadcaster;
        bytes32 topic;
        SignalType sigType;
        uint256 timestamp;
        uint256 stake;
    }

    mapping(address => Broadcaster) public broadcasters;
    mapping(uint256 => Signal) public signals;

    uint256 public nextSignalId;

    // =============================================================
    //                          EVENTS
    // =============================================================
    event Registered(address indexed broadcaster, uint256 stake);
    event Deregistered(address indexed broadcaster, uint256 stake);

    event SignalEmitted(
        uint256 indexed signalId,
        address indexed broadcaster,
        bytes32 indexed topic,
        SignalType sigType,
        uint256 stake,
        uint256 timestamp
    );

    event DecayCheckpointed(
        uint256 indexed signalId,
        uint256 decayFraction,
        uint256 effectiveWeight,
        uint256 timestamp
    );

    // =============================================================
    //                      CORE FUNCTIONS
    // =============================================================

    function register() external payable {
        Broadcaster storage b = broadcasters[msg.sender];

        if (b.state != State.UNREGISTERED) revert AlreadyRegistered();
        if (msg.value != STAKE_AMOUNT) revert InvalidStake();

        b.state = State.ACTIVE;
        b.lastActiveTime = block.timestamp;

        emit Registered(msg.sender, msg.value);
    }

    function signal(bytes32 topic, SignalType sigType) external {
        Broadcaster storage b = broadcasters[msg.sender];

        if (b.state == State.UNREGISTERED) revert NotRegistered();

        if (b.state == State.COOLING) {
            if (block.timestamp < b.lastSignalTime + COOLDOWN_PERIOD) {
                revert InCooldown();
            }
        }

        // transition to COOLING
        b.state = State.COOLING;
        b.lastSignalTime = block.timestamp;
        b.lastActiveTime = block.timestamp;

        uint256 signalId = nextSignalId++;

        signals[signalId] = Signal({
            broadcaster: msg.sender,
            topic: topic,
            sigType: sigType,
            timestamp: block.timestamp,
            stake: STAKE_AMOUNT
        });

        emit SignalEmitted(
            signalId,
            msg.sender,
            topic,
            sigType,
            STAKE_AMOUNT,
            block.timestamp
        );
    }

    function checkpointDecay(uint256 signalId) external {
        

        uint256 fraction = decayFraction(signalId);
        uint256 weight = effectiveWeight(signalId);

        emit DecayCheckpointed(
            signalId,
            fraction,
            weight,
            block.timestamp
        );
    }

    function deregister() external {
        Broadcaster storage b = broadcasters[msg.sender];

        if (b.state == State.UNREGISTERED) revert NotRegistered();

        // reset state BEFORE transfer (CEI)
        b.state = State.UNREGISTERED;
        b.lastSignalTime = 0;
        b.lastActiveTime = 0;

        (bool success, ) = msg.sender.call{value: STAKE_AMOUNT}("");
        require(success, "Transfer failed");

        emit Deregistered(msg.sender, STAKE_AMOUNT);
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    function effectiveWeight(uint256 signalId) public view returns (uint256) {
        Signal memory s = signals[signalId];

        uint256 elapsed = block.timestamp - s.timestamp;

        if (elapsed >= HALF_LIFE) return 0;

        return (s.stake * (HALF_LIFE - elapsed)) / HALF_LIFE;
    }

    function decayFraction(uint256 signalId) public view returns (uint256) {
        Signal memory s = signals[signalId];

        uint256 elapsed = block.timestamp - s.timestamp;

        if (elapsed >= HALF_LIFE) return 1e18;

        return (elapsed * 1e18) / HALF_LIFE;
    }

    function isSilent(address user) external view returns (bool) {
        Broadcaster memory b = broadcasters[user];

        if (b.state == State.UNREGISTERED) return false;

        return block.timestamp > b.lastActiveTime + SILENCE_THRESHOLD;
    }

    function topicHash(string calldata topic) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(topic));
    }

    // =============================================================
    //                  STATE HELPER (OPTIONAL VIEW)
    // =============================================================

    function currentState(address user) external view returns (State) {
        Broadcaster memory b = broadcasters[user];

        if (b.state == State.COOLING) {
            if (block.timestamp >= b.lastSignalTime + COOLDOWN_PERIOD) {
                return State.ACTIVE;
            }
        }

        return b.state;
    }
}