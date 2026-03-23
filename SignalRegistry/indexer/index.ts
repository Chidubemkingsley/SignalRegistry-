import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RSK_URL);

const CONTRACT = "YOUR_DEPLOYED_ADDRESS";

const ABI = [
  "event SignalEmitted(uint256 indexed signalId,address indexed broadcaster,bytes32 indexed topic,uint8 sigType,uint256 stake,uint256 timestamp)"
];

const contract = new ethers.Contract(CONTRACT, ABI, provider);

contract.on("SignalEmitted", (id, user, topic, type, stake, ts) => {
  console.log({
    id: id.toString(),
    user,
    topic,
    type,
    stake: stake.toString(),
    timestamp: ts.toString()
  });
});