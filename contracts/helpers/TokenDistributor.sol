// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract TokenDistributor is Ownable, EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    struct CollectData {
        address receiver;
        uint256 amount;
        uint256 nonce;
    }

    /**
     * @dev Throws if argument is address(0)
     */
    modifier notZeroAddress(address adr) {
        require(adr != address(0), "IgupToken: Cannot be zero");
        _;
    }

    /// @notice Signer address
    /// @dev Used by backend, can be changed by owner
    address public signer;

    /// @notice Returns true if nonce is used
    mapping(uint256 => bool) public isNonceUsed;

    /// @notice Address of token
    IERC20 public token;

    constructor(address _signer, IERC20 _token)
        EIP712("Iguverse", "1")
        notZeroAddress(_signer)
    {
        signer = _signer;
        token = _token;
    }

    event Collected(address indexed receiver, uint256 amount, uint256 nonce);

    /// @notice Rewrites Signer Address
    /// @param _newSigner new signers's address
    /// @dev All signatures made by the old signer will no longer be valid. Only Owner can execute this function
    function setSigner(address _newSigner) external onlyOwner {
        signer = _newSigner;
    }

    /// @notice Transfers `amount` tokens to `receiver` address
    /// @dev Only Signer or Owner can execute this function
    function transferTo(address receiver, uint256 amount) external {
        require(
            (msg.sender == owner()) || (msg.sender == signer),
            "TokenDisributor: Only singer role or owner"
        );
        token.transfer(receiver, amount);
    }

    /// @notice Transfers `amount` of tokens to `receiver` address
    /// @param receiver Receiver of tokens
    /// @param amount Amount to mint 
    /// @param nonce Unique transaction id
    /// @param signature Signature signed by singer
    /// @dev `Signature` must be signed by valid singer
    function collect(address receiver, uint256 amount, uint256 nonce, bytes memory signature) external {
        require(!isNonceUsed[nonce], "TokenDisributor: Nonce already used");
        isNonceUsed[nonce] = true;

        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("CollectData(address receiver,uint256 amount,uint256 nonce)"),
                    receiver,
                    amount,
                    nonce
                )
            )
        );

        require(
            ECDSA.recover(typedHash, signature) == signer,
            "TokenDisributor: Signature Mismatch"
        );

        emit Collected(receiver, amount, nonce);

        token.transfer(receiver, amount);
    }
}
