🌉 Fhenix Auto Bridge Bot

A fully automated bot for bridging ETH to the Fhenix testnet. Features include customizable daily transaction quotas, dynamic gas fee management, and 24/7 operation with timezone awareness.

GitHub: lameairdrop/Fhenix-auto-bridgeBot

🚀 Key Features

🔁 Auto ETH Bridging
Automatically sends ETH to the Fhenix testnet bridge.

⛽ Gas Optimization
Smart gas fee calculation with configurable priority fees.

📊 Daily Quota System
Set your own minimum and maximum transactions per day.

🕒 Randomized Timing
Introduces realistic delays between transactions.

📈 Live Tracking
Real-time progress bar and transaction counter in the console.

🕹️ 24/7 Runtime
Continuous operation with automatic daily resets.

🌐 Timezone Support
Set your local timezone offset for accurate daily resets.

📦 Requirements

Node.js v18 or higher

ETH on the source chain (for gas fees)

Fhenix testnet environment

🛠️ Installation & Setup
1. Clone the Repository
git clone https://github.com/lameairdrop/Fhenix-auto-bridgeBot.git
cd Fhenix-auto-bridge-BOT

2. Install Dependencies
npm install

3. Configure the Bot

Edit config.json with your desired settings.

Set your private key via environment variable:

PRIVATE_KEY=0xYourPrivateKeyHere

4. Run the Bot
node main.js

⚙️ Configuration (config.json)
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

🧩 Explanation of Fields
Field	Description
RPC_URL	Your RPC endpoint (e.g., Infura, Alchemy, etc.)
CHAIN_ID	Chain ID for the target network
MIN_TX_PER_DAY	Minimum number of daily transactions
MAX_TX_PER_DAY	Maximum number of daily transactions
MIN_AMOUNT_ETH	Minimum ETH per transaction
MAX_AMOUNT_ETH	Maximum ETH per transaction
MIN_DELAY_SEC	Minimum delay (in seconds) between transactions
MAX_DELAY_SEC	Maximum delay (in seconds) between transactions
PRIORITY_FEE_GWEI	Priority fee in Gwei
TIMEZONE_OFFSET_MIN	Your timezone offset (in minutes)
PROXY_ADDRESS	Fhenix bridge proxy contract address
🎯 How It Works
🕛 Daily Initialization

Chooses a random number of transactions for the day.

🔄 Transaction Execution

Dynamically calculates gas fees.

Sends ETH to the bridge contract.

Waits for confirmations before continuing.

📡 Progress Monitoring

Displays transaction hashes, gas fees, and progress.

🧼 Automatic Reset

Resets transaction counters at local midnight.

♻️ Continuous Operation

Loops the process daily without user input.

⚠️ Notes & Warnings

🧪 Testnet Only: Designed specifically for the Fhenix testnet.

⛽ Gas Fees: Ensure you have enough ETH for transaction costs.

🔐 Private Key: Never hard-code your key or expose it publicly.

🧱 Proxy Address: Make sure the address is correct and active.

❗ Use Responsibly: Understand what the bot is doing before running it.

📁 File Structure
Fhenix-auto-bridge-BOT/
├── main.js          # Main bot script
├── config.json      # User configuration
├── package.json     # Dependencies
└── README.md        # This documentation

📊 Real-Time Monitoring

While running, the bot logs:

✅ Transaction hashes

⛽ Estimated & used gas fees

📅 Progress count

⚠️ Errors & retry attempts

⏳ Countdown to next reset

🔒 Security

🔑 Private key is loaded from environment variable only.

🧾 No sensitive data is written to disk.

🔒 Recommend using a burner wallet or testnet wallet for testing.

🆘 Support

For help, questions, or issues, please open an issue on GitHub
.

⏰ Daily Operation Cycle

Randomly selects number of transactions for the day.

Executes ETH transfers with randomized delays.

Resets counters at local midnight.

Repeats the process 24/7.
