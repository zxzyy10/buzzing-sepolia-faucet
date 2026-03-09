// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract USDCFaucet {
    address public owner;
    address public immutable usdc;

    uint256 public constant CLAIM_AMOUNT = 10_000 * 1e6; // 10,000 USDC (6 decimals)

    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed caller, address indexed recipient, uint256 amount);
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address usdcToken) {
        require(usdcToken != address(0), "Zero token");
        owner = msg.sender;
        usdc = usdcToken;
        emit OwnerTransferred(address(0), msg.sender);
    }

    function claim(address recipient) external {
        require(recipient != address(0), "Zero recipient");
        require(!hasClaimed[recipient], "Recipient already claimed");
        hasClaimed[recipient] = true;

        _safeTransfer(usdc, recipient, CLAIM_AMOUNT);
        emit Claimed(msg.sender, recipient, CLAIM_AMOUNT);
    }

    function faucetBalance() external view returns (uint256) {
        return IERC20(usdc).balanceOf(address(this));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero to");
        _safeTransfer(usdc, to, amount);
        emit Withdrawn(to, amount);
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}
