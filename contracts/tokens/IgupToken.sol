// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract IgupToken is ERC20, ERC20Burnable, Ownable {
    using ECDSA for bytes32;

    /// @notice Minter address
    /// @dev Used by backend, can be changed by owner
    address public minter;

    /// @notice Returns true if nonce is used
    mapping(uint256 => bool) public isNonceUsed;

    constructor(address _minter) ERC20("IGUP Token", "IGUP") {
        minter = _minter;
    }

    /// @notice Rewrites Minter Address
    /// @param _newMinter new minters's address
    /// @dev All signatures made by the old minter will no longer be valid. Only Owner can execute this function
    function setMinter(address _newMinter) external onlyOwner{
        minter = _newMinter;
    }

    /// @notice Mints `amount` tokens to `receiver` address
    /// @dev Only Minter or Owner can execute this function
    function mintTo(address receiver, uint256 amount) external{
        require((msg.sender == owner()) || (msg.sender == minter), "IgupToken: Only minter role");
        _mint(receiver, amount);
    }

    /// @notice Mints `amount` of tokens to `receiver` address
    /// @param receiver Receiver of tokens
    /// @param amount Amount to mint 
    /// @param nonce Unique transaction id
    /// @param signature Signature signed by minter
    /// @dev `Signature` must be signed by valid minter
    function collect(address receiver, uint256 amount, uint256 nonce, bytes memory signature) external {
        require(!isNonceUsed[nonce], "IgupToken: Nonce already used");
        isNonceUsed[nonce] = true;

        bytes32 pureHash = keccak256(
            abi.encodePacked(
                receiver,
                amount,
                nonce
            )
        );

        require(
            pureHash.toEthSignedMessageHash().recover(signature) == minter,
            "IgupToken: Signature Mismatch"
        );

        _mint(receiver, amount);
    }
}
