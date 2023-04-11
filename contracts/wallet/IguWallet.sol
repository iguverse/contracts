// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract IguWallet is Ownable, EIP712 {
    event Deposited(address indexed walletAddress, uint256 amount);

    event Withdrawn(
        address indexed walletAddress,
        uint256 amount,
        uint256 fee,
        uint256 nonce
    );

    IERC20 public token;
    address public signer;
    address public treasury;

    mapping(uint256 => bool) public isNonceUsed; 

    constructor(
        IERC20 tokenContract,
        address signerAddress,
        address treasuryAddress
    ) EIP712("Iguverse", "1") {
        token = tokenContract;
        signer = signerAddress;
        treasury = treasuryAddress;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    } 

    function withdraw(
        address walletAddress,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(
            !isNonceUsed[nonce],
            "IguWallet: Nonce already used"
        );
        isNonceUsed[nonce] = true;
        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "WithdrawData(address walletAddress,uint256 amount,uint256 fee,uint256 nonce)"
                    ),
                    walletAddress,
                    amount,
                    fee,
                    nonce
                )
            )
        );
        require(
            ECDSA.recover(typedHash, signature) == signer,
            "IguWallet: Signature Mismatch"
        );
        token.transfer(walletAddress, amount);
        token.transfer(treasury, fee);
        emit Withdrawn(walletAddress, amount, fee, nonce);
    }

    function setSigner(address newSigner) external onlyOwner {
        signer = newSigner;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }
}
