const faucetAbi = [
  "function claim(address recipient)",
  "function hasClaimed(address) view returns (bool)",
  "function faucetBalance() view returns (uint256)",
  "function usdc() view returns (address)",
];

const erc20Abi = ["function decimals() view returns (uint8)"];

const TARGET_CHAIN_ID_DEC = 84532;
const TARGET_CHAIN_ID_HEX = "0x14a34";
const TARGET_CHAIN_NAME = "Base Sepolia";

const baseSepoliaParams = {
  chainId: TARGET_CHAIN_ID_HEX,
  chainName: TARGET_CHAIN_NAME,
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

const connectBtn = document.getElementById("connectBtn");
const claimBtn = document.getElementById("claimBtn");
const faucetInput = document.getElementById("faucetAddress");
const recipientInput = document.getElementById("recipientAddress");
const statusEl = document.getElementById("status");
const accountEl = document.getElementById("account");
const claimedEl = document.getElementById("claimed");
const faucetBalanceEl = document.getElementById("faucetBalance");

let provider;
let signer;
let account;
let faucetAddress = "";
let currentChainOk = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

async function getCurrentChainIdHex() {
  return window.ethereum.request({ method: "eth_chainId" });
}

async function ensureBaseSepolia() {
  const chainId = (await getCurrentChainIdHex()).toLowerCase();
  if (chainId === TARGET_CHAIN_ID_HEX) {
    return true;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [baseSepoliaParams],
      });
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID_HEX }],
      });
    } else {
      throw switchError;
    }
  }

  const newChainId = (await getCurrentChainIdHex()).toLowerCase();
  return newChainId === TARGET_CHAIN_ID_HEX;
}

async function updateChainState(showPrompt = false) {
  if (!window.ethereum) {
    currentChainOk = false;
    claimBtn.disabled = true;
    return;
  }

  const chainIdHex = (await getCurrentChainIdHex()).toLowerCase();
  currentChainOk = chainIdHex === TARGET_CHAIN_ID_HEX;

  if (!currentChainOk) {
    claimBtn.disabled = true;
    if (showPrompt) {
      setStatus(`Please switch network to ${TARGET_CHAIN_NAME}.`);
    }
  }
}

async function getContracts() {
  if (!isAddress(faucetAddress)) {
    throw new Error("Invalid faucet contract address in frontend/config.js");
  }

  const faucet = new ethers.Contract(faucetAddress, faucetAbi, signer);
  const usdcAddress = await faucet.usdc();
  const usdc = new ethers.Contract(usdcAddress, erc20Abi, provider);
  return { faucet, usdc };
}

async function refreshState() {
  if (!account || !signer) return;

  await updateChainState(true);
  if (!currentChainOk) return;

  const { faucet, usdc } = await getContracts();
  const [balance, decimals] = await Promise.all([faucet.faucetBalance(), usdc.decimals()]);

  const recipient = recipientInput.value.trim();
  const validRecipient = isAddress(recipient);
  let claimed = false;

  if (validRecipient) {
    claimed = await faucet.hasClaimed(recipient);
  }

  claimedEl.textContent = validRecipient ? (claimed ? "Yes" : "No") : "-";
  faucetBalanceEl.textContent = `${ethers.formatUnits(balance, decimals)} USDC`;
  claimBtn.disabled = !validRecipient || claimed;
}

connectBtn.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      throw new Error("No wallet detected. Please install MetaMask.");
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    let switched;
    try {
      switched = await ensureBaseSepolia();
    } catch (switchErr) {
      if (switchErr?.code === 4001) {
        throw new Error(`Network switch rejected. Please switch to ${TARGET_CHAIN_NAME}.`);
      }
      throw switchErr;
    }

    if (!switched) {
      throw new Error(`Please switch network to ${TARGET_CHAIN_NAME}.`);
    }

    signer = await provider.getSigner();
    account = await signer.getAddress();
    accountEl.textContent = account;

    setStatus(`Wallet connected on ${TARGET_CHAIN_NAME}`);
    await refreshState();
  } catch (err) {
    setStatus(err?.message || "Connection failed");
  }
});

claimBtn.addEventListener("click", async () => {
  try {
    if (!account || !signer) {
      throw new Error("Please connect wallet first.");
    }

    const switched = await ensureBaseSepolia();
    if (!switched) {
      throw new Error(`Please switch network to ${TARGET_CHAIN_NAME}.`);
    }

    const recipient = recipientInput.value.trim();
    if (!isAddress(recipient)) {
      throw new Error("Please enter a valid recipient address.");
    }

    setStatus("Sending transaction...");
    claimBtn.disabled = true;

    const { faucet } = await getContracts();
    const tx = await faucet.claim(recipient);
    await tx.wait();

    setStatus("Claim successful. 10,000 USDC sent.");
    await refreshState();
  } catch (err) {
    setStatus(err?.shortMessage || err?.message || "Claim failed");
    claimBtn.disabled = false;
  }
});

recipientInput.addEventListener("input", async () => {
  if (!account || !signer) return;
  try {
    await refreshState();
  } catch (err) {
    setStatus(err?.message || "Refresh failed");
  }
});

(function init() {
  faucetAddress = (window.FAUCET_ADDRESS || "").trim();
  faucetInput.value = faucetAddress || "(run deploy to generate frontend/config.js)";

  if (window.ethereum) {
    window.ethereum.on("chainChanged", async () => {
      try {
        await updateChainState(true);
        if (account && signer) {
          await refreshState();
        }
      } catch (err) {
        setStatus(err?.message || "Network update failed");
      }
    });
  }
})();
