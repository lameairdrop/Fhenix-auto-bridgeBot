Fhenix Auto Bridge Bot 🌉

A fully automated bot for bridging ETH to the Fhenix testnet. Features include customizable daily transaction targets, dynamic gas fee management, and 24/7 operation.

GitHub: lameairdrop/Fhenix-auto-bridgeBot

🚀 Key Features

Auto ETH Bridging: Automatically sends ETH to the Fhenix testnet bridge.

Gas Optimization: Smart gas fee calculation with priority support.

Daily Quota System: Set your own min/max transactions per day.

Randomized Timing: Adds realistic time gaps between transactions.

Live Tracking: Real-time progress bar and transaction counter.

24/7 Runtime: Continuous operation with daily resets.

Timezone Support: Set your own timezone offset for accurate resets.

📦 Requirements

Node.js (version 18 or higher)

ETH on the source chain for gas fees

A working Fhenix testnet setup

🛠️ Installation & Setup

Clone the Repository

git clone https://github.com/lameairdrop/Fhenix-auto-bridgeBot.git
cd Fhenix-auto-bridge-BOT


Install Dependencies

npm install


Configure the Bot

Edit config.json with your desired settings.

Set your private key as an environment variable:

PRIVATE_KEY=0xYourPrivateKeyHere


Run the Bot

node main.js

⚙️ Configuration (config.json)

Here’s an example of the configuration structure:

{
  "RPC_URL": "your_rpc_endpoint",
  "CHAIN_ID": 123,
  "MIN_TX_PER_DAY": 5,
  "MAX_TX_PER_DAY": 10,
  "MIN_AMOUNT_ETH": 0.001,
  "MAX_AMOUNT_ETH": 0.005,
  "MIN_DELAY_SEC": 300,
  "MAX_DELAY_SEC": 900,
  "PRIORITY_FEE_GWEI": 2,
  "TIMEZONE_OFFSET_MIN": 0,
  "PROXY_ADDRESS": "0xYourProxyContractAddress"
}

🧩 Explanation of Config Fields

RPC_URL: RPC endpoint for the Ethereum network

CHAIN_ID: Target network chain ID

MIN_TX_PER_DAY / MAX_TX_PER_DAY: Number of transactions per day

MIN_AMOUNT_ETH / MAX_AMOUNT_ETH: ETH amount range per transaction

MIN_DELAY_SEC / MAX_DELAY_SEC: Time between transactions (in seconds)

PRIORITY_FEE_GWEI: Priority fee (in Gwei)

TIMEZONE_OFFSET_MIN: Timezone offset in minutes

PROXY_ADDRESS: Fhenix bridge proxy contract address

🎯 How It Works

Daily Initialization

Randomly selects a number of transactions for the day.

Transaction Execution

Dynamically calculates gas fees.

Sends ETH to the bridge contract.

Waits for confirmation before proceeding.

Progress Monitoring

Displays live progress and transaction data.

Automatic Reset

Resets counters at midnight based on your local timezone.

Continuous Operation

Repeats the cycle daily without manual intervention.

⚠️ Notes & Warnings

🧪 Testnet Only: Designed specifically for the Fhenix testnet.

⛽ Gas Fees: Ensure you have enough ETH to cover transaction costs.

🔐 Private Key: Keep your key secure and never hard-code it.

🧱 Proxy Address: Double-check the proxy contract address.

❗ Use Responsibly: Understand the actions your bot will perform.

📁 File Structure
Fhenix-auto-bridge-BOT/
├── main.js          # Main bot script
├── config.json      # Configuration file
├── package.json     # Dependency manifest
└── README.md        # Project documentation

📊 Real-Time Monitoring

The bot logs key details to the console:

Transaction hashes

Estimated and used gas fees

Daily progress count

Error logs and retry attempts

Countdown to the next reset

🔒 Security

Private key is stored via environment variable, not in config.

No sensitive data is written to disk.

🆘 Support

For help, issues, or suggestions, please open an issue on the GitHub repository
.

⏰ Daily Operation Cycle

Choose a random number of transactions for the day.

Execute ETH transfers with random delays between them.

Reset counters at local midnight.

Repeat continuously, 24/7.
