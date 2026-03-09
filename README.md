# Buzzing Faucet (Wallet Connected)

## Local run
1. Install dependencies
`npm exec --yes yarn@1.22.22 install`

2. Start local chain
`node_modules\\.bin\\hardhat.cmd node`

3. Deploy local MockUSDC + Faucet
`node_modules\\.bin\\hardhat.cmd run scripts/deploy.js --network localhost`

4. Start frontend
`node_modules\\.bin\\http-server.cmd frontend -p 5173 -c-1`

5. Open
`http://127.0.0.1:5173`

## Base Sepolia deployment (use existing USDC)
Given USDC: `0xE43Ac8688D29A7212224bC2954c96c93f3b0b96E`

PowerShell:
```powershell
$env:BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
$env:DEPLOYER_MNEMONIC="<your mnemonic>"
$env:USDC_ADDRESS="0xE43Ac8688D29A7212224bC2954c96c93f3b0b96E"
npm run deploy:basesepolia
```

After deploy:
- Faucet address is written to `frontend/config.js`.
- Fund the faucet contract with USDC before users claim.
- In wallet, switch to Base Sepolia (Chain ID `84532`).

## Notes
- Claim rule: one-time per recipient address.
- Frontend reads faucet address from `frontend/config.js`.
- If address mismatch appears, redeploy and hard-refresh (`Ctrl+F5`).

