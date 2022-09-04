// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TokenDistributor is Ownable {
    using ECDSA for bytes32;

    /// @notice Signer address
    /// @dev Used by backend, can be changed by owner
    address public singer;

    /// @notice Returns true if nonce is used
    mapping(uint256 => bool) public isNonceUsed;

    /// @notice Address of token
    IERC20 public token;

    constructor(address _singer, IERC20 _token) {
        singer = _singer;
        token = _token;
    }

    /// @notice Rewrites Signer Address
    /// @param _newSigner new singers's address
    /// @dev All signatures made by the old singer will no longer be valid. Only Owner can execute this function
    function setSigner(address _newSigner) external onlyOwner{
        singer = _newSigner;
    }

    /// @notice Transfers `amount` tokens to `receiver` address
    /// @dev Only Signer or Owner can execute this function
    function transferTo(address receiver, uint256 amount) external{
        require((msg.sender == owner()) || (msg.sender == singer), "TokenDisributor: Only singer role");
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

        bytes32 pureHash = keccak256(
            abi.encodePacked(
                receiver,
                amount,
                nonce
            )
        );

        require(
            pureHash.toEthSignedMessageHash().recover(signature) == singer,
            "TokenDisributor: Signature Mismatch"
        );

        token.transfer(receiver, amount);
    }
}
