import os


# ---------------- Risk Thresholds ----------------
HEALTHY_RISK_SCORE_THRESHOLD = 60
CONFIRMATION_RISK_THRESHOLD = 2
EXPOSED_SUM_THRESHOLD = 1
MIN_SAFE_REQUIRED_DVN_COUNT = 2
MIN_OPTIONAL_THRESHOLD = 1
MIN_CONFIRMATION_THRESHOLD = 4


# ---------------- Blockchain Constants ----------------
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
ULN_CONFIG_TYPE = 2


# ---------------- Time Constants ----------------
ONE_DAY = 86400
ONE_HOUR = 3600


# ---------------- ABIs ----------------
ENDPOINT_V2_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_oapp", "type": "address"},
            {"internalType": "uint32", "name": "_remoteEid", "type": "uint32"}
        ],
        "name": "getReceiveLibrary",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_oapp", "type": "address"},
            {"internalType": "address", "name": "_library", "type": "address"},
            {"internalType": "uint32", "name": "_remoteEid", "type": "uint32"},
            {"internalType": "uint32", "name": "_configType", "type": "uint32"}
        ],
        "name": "getConfig",
        "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}],
        "stateMutability": "view",
        "type": "function"
    }
]

GNOSIS_SAFE_ABI = [
    {
        "inputs": [],
        "name": "getThreshold",
        "outputs": [
            {
                "internalType": "uint256", 
                "name": "_threshold", 
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOwners",
        "outputs": [
            {
                "internalType": "address[]", 
                "name": "owners", 
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

TIMELOCK_ABI = [
    {
        "inputs": [],
        "name": "minDelay",
        "outputs": [
            {
                "internalType": "uint256", 
                "name": "", 
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

AGGREGATOR_V3_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"internalType": "uint80", "name": "roundId", "type": "uint80"},
            {"internalType": "int256", "name": "answer", "type": "int256"},
            {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
            {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
            {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

ORACLE_ABI = [
    {
        "inputs": [],
        "name": "priceFeed",
        "outputs": [{"type": "address"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "oracle",
        "outputs": [{"type": "address"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPriceFeed",
        "outputs": [{"type": "address"}],
        "type": "function"
    }
]

OWNABLE_ABI = [
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"type": "address"}],
        "type": "function"
    }
]


# ---------------- Chains ----------------
CHAIN_CONFIG = {
    "ethereum": {
        "rpc": os.getenv("ETH_RPC", "https://rpc.ankr.com/eth"),
        "eid": 30101,
        "metadata_key": "ethereum",
        "endpointV2": "0x1a44076050125825900e736c501f859c50fE728c"
    },
    "arbitrum": {
        "rpc": os.getenv("ARB_RPC", "https://arb1.arbitrum.io/rpc"),
        "eid": 30110,
        "metadata_key": "arbitrum",
        "endpointV2": "0x1a44076050125825900e736c501f859c50fE728c"
    },
    "bsc": {
        "rpc": os.getenv("BSC_RPC", "https://bsc-rpc.publicnode.com"),
        "eid": 30102,
        "metadata_key": "bsc",
        "endpointV2": "0x1a44076050125825900e736c501f859c50fE728c"
    },
    "base": {
        "rpc": os.getenv("BASE_RPC", "https://base-rpc.publicnode.com"),
        "eid": 30184,
        "metadata_key": "base",
        "endpointV2": "0x1a44076050125825900e736c501f859c50fE728c"
    },
}


# ---------------- EIDs ----------------
DEFAULT_REMOTE_EID = CHAIN_CONFIG['ethereum']['eid']
ARBITRUM_EID = CHAIN_CONFIG['arbitrum']['eid']