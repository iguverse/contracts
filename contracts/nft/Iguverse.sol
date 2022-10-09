// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../helpers/erc1155a/extensions/ERC721AQueryable.sol";
import "../helpers/erc1155a/extensions/ERC721ABurnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

/// @title Iguverse NFT Contract
/// @notice ERC721(ERC721A-Quaryable) Standart Tokens Contract
contract Iguverse is ERC721AQueryable, ERC721ABurnable, Ownable, EIP712 {
    using ECDSA for bytes32;

    struct ExecData {
        uint256[] tokensToBurn;
        uint256 tokensToMint;
        address mintReceiver;
        address ptFromAccount;
        address[] ptFromAccountReceivers;
        uint256[] fromAccountAmounts;
        address ptFromContract;
        address[] ptFromContractReceivers;
        uint256[] fromContractAmounts;
        address executor;
        uint256 nonce;
        uint256 deadline;
    }

    /// @dev Token Base Uri, can be changed by owner
    string private uriBase;

    /// @notice Returns true if nonce is used
    mapping(uint256 => bool) public isNonceUsed;

    /// @notice Signer address
    /// @dev Used by backend, can be changed by owner
    address public signerRole;

    error CallerIsNotOwner(uint256 tokenId);
    error PaymentTokenTransferError(address from, address to, uint256 amount);
    error BalanceBelowThenTransferredAmount();

    /// @notice Emitted when new tokens are minted
    /// @param nonce Unique transaction id
    /// @param executor Address of transaction executor
    /// @param mintReceiver Address which receives minted tokens
    /// @param startTokenId First minted token's id
    /// @param tokensToMint Number of created tokens
    event TokensMinted(
        uint256 indexed nonce,
        address indexed executor,
        address indexed mintReceiver,
        uint256 startTokenId,
        uint256 tokensToMint
    );

    /// @notice Emitted when tokens are burned
    /// @param nonce Unique transaction id
    /// @param executor Address of transaction executor
    /// @param tokensToBurn Array of tokens are burned
    event TokensBurned(
        uint256 indexed nonce,
        address indexed executor,
        uint256[] tokensToBurn
    );

    /// @notice Emitted when transferring tokens or native currency in transaction
    /// @param nonce Unique transaction id
    /// @param executor Address of transaction executor
    /// @param tokenAddress Address of ERC20 token transferred
    /// @param isFromContract True, if funds are transferred from the contract address
    /// @param receivers Receivers array
    /// @param amounts Amounts array
    /// @dev address(0) is used for native currency in tokenAddress.
    event FundsTransfer(
        uint256 indexed nonce,
        address indexed executor,
        address indexed tokenAddress,
        bool isFromContract,
        address[] receivers,
        uint256[] amounts
    );

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseUri_,
        address signer
    ) ERC721A(name_, symbol_) EIP712("Iguverse", "1") {
        uriBase = baseUri_;
        signerRole = signer;
    }

    /// @dev Returns Base Uri
    function _baseURI() internal view override returns (string memory) {
        return uriBase;
    }

    /// @notice Returns Base Uri
    function baseTokenURI() public view returns (string memory) {
        return uriBase;
    }

    /// @notice Rewrites Base Uri
    /// @param baseUri_ new base uri
    /// @dev Only Owner can execute this function
    function editBaseUri(string memory baseUri_) external onlyOwner {
        uriBase = baseUri_;
    }

    /// @notice Rewrites Signer Address
    /// @param newSigner new singer's address
    /// @dev Only Owner can execute this function
    function editSigner(address newSigner) external onlyOwner {
        signerRole = newSigner;
    }

    function checkSignature(
        uint256[] memory tokensToBurn,
        uint256 tokensToMint,
        address mintReceiver,
        address ptFromAccount,
        address[] memory ptFromAccountReceivers,
        uint256[] memory fromAccountAmounts,
        address ptFromContract,
        address[] memory ptFromContractReceivers,
        uint256[] memory fromContractAmounts,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) internal view {
        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "ExecData(uint256[] tokensToBurn,uint256 tokensToMint,address mintReceiver,address ptFromAccount,address[] ptFromAccountReceivers,uint256[] fromAccountAmounts,address ptFromContract,address[] ptFromContractReceivers,uint256[] fromContractAmounts,address executor,uint256 nonce,uint256 deadline)"
                    ),
                    keccak256(abi.encodePacked(tokensToBurn)),
                    tokensToMint,
                    mintReceiver,
                    ptFromAccount,
                    keccak256(abi.encodePacked(ptFromAccountReceivers)),
                    keccak256(abi.encodePacked(fromAccountAmounts)),
                    ptFromContract,
                    keccak256(abi.encodePacked(ptFromContractReceivers)),
                    keccak256(abi.encodePacked(fromContractAmounts)),
                    msg.sender,
                    nonce,
                    deadline
                )
            )
        );
        require(
            ECDSA.recover(typedHash, signature) == signerRole,
            "Iguverse: Signature Mismatch"
        );
    }

    /// @notice Executes a multipurpose transaction
    /// @param tokensToBurn Token ids array to be burned
    /// @param tokensToMint Number of tokens to mint
    /// @param mintReceiver Address - receiver of new minted tokens
    /// @param ptFromAccount Address of ERC20 token to transfer from executor address
    /// @param ptFromAccountReceivers `ptFromAccount` Receivers Addresses array
    /// @param fromAccountAmounts `ptFromAccount` Amounts array
    /// @param ptFromContract Address of ERC20 token to transfer from contract addresss
    /// @param ptFromContractReceivers `ptFromContract` Receivers Addresses array
    /// @param fromContractAmounts `ptFromContract` Amounts array
    /// @param nonce Uniqe id of transaction
    /// @param deadline Unix Timestamp after which the transaction cannot be executed
    /// @param signature A signature of transaction parameters with the private key of a valid signer
    /// @dev address(0) is used to set native currency as ptFromAccount or ptFromContract.
    function execTransaction(
        uint256[] memory tokensToBurn,
        uint256 tokensToMint,
        address mintReceiver,
        address ptFromAccount,
        address[] memory ptFromAccountReceivers,
        uint256[] memory fromAccountAmounts,
        address ptFromContract,
        address[] memory ptFromContractReceivers,
        uint256[] memory fromContractAmounts,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external payable {
        require(mintReceiver != address(0), "Iguverse: Receiver address zero");
        require(!isNonceUsed[nonce], "Iguverse: Nonce already used");
        require(block.timestamp <= deadline, "Iguverse: Transaction overdue");
        isNonceUsed[nonce] = true;

        checkSignature(
            tokensToBurn,
            tokensToMint,
            mintReceiver,
            ptFromAccount,
            ptFromAccountReceivers,
            fromAccountAmounts,
            ptFromContract,
            ptFromContractReceivers,
            fromContractAmounts,
            nonce,
            deadline,
            signature
        );

        if (tokensToBurn.length != 0) {
            for (uint256 i = 0; i < tokensToBurn.length; i++) {
                if (ownerOf(tokensToBurn[i]) != msg.sender)
                    revert CallerIsNotOwner(tokensToBurn[i]);
                _burn(tokensToBurn[i]);
            }
            emit TokensBurned(nonce, msg.sender, tokensToBurn);
        }
        if (tokensToMint != 0) {
            emit TokensMinted(
                nonce,
                msg.sender,
                mintReceiver,
                _nextTokenId(),
                tokensToMint
            );
            _mint(mintReceiver, tokensToMint);
        }
        if (
            (ptFromAccountReceivers.length != 0) &&
            (fromAccountAmounts.length != 0) &&
            (ptFromAccountReceivers.length == fromAccountAmounts.length)
        ) {
            if (ptFromAccount == address(0)) {
                uint256 sum;
                for (uint256 i = 0; i < ptFromAccountReceivers.length; i++) {
                    sum += fromAccountAmounts[i];
                }
                require(msg.value >= sum, "Iguverse: Not enough BNB");
                for (uint256 i = 0; i < ptFromAccountReceivers.length; i++) {
                    if (ptFromAccountReceivers[i] != address(this)) {
                        Address.sendValue(
                            payable(ptFromAccountReceivers[i]),
                            fromAccountAmounts[i]
                        );
                    }
                }
            } else {
                for (uint256 i = 0; i < ptFromAccountReceivers.length; i++) {
                    if (
                        IERC20(ptFromAccount).balanceOf(msg.sender) <
                        fromAccountAmounts[i]
                    ) {
                        revert BalanceBelowThenTransferredAmount();
                    }
                    if (
                        !IERC20(ptFromAccount).transferFrom(
                            msg.sender,
                            ptFromAccountReceivers[i],
                            fromAccountAmounts[i]
                        )
                    )
                        revert PaymentTokenTransferError(
                            msg.sender,
                            ptFromAccountReceivers[i],
                            fromAccountAmounts[i]
                        );
                }
            }
            emit FundsTransfer(
                nonce,
                msg.sender,
                ptFromAccount,
                false,
                ptFromAccountReceivers,
                fromAccountAmounts
            );
        }
        if (
            (ptFromContractReceivers.length != 0) &&
            (fromContractAmounts.length != 0) &&
            (ptFromContractReceivers.length == fromContractAmounts.length)
        ) {
            if (ptFromContract == address(0)) {
                uint256 sum;
                for (uint256 i = 0; i < ptFromContractReceivers.length; i++) {
                    sum += fromContractAmounts[i];
                }
                require(
                    address(this).balance >= sum,
                    "Iguverse: Contract: Not enough BNB"
                );
                for (uint256 i = 0; i < ptFromContractReceivers.length; i++) {
                    Address.sendValue(
                        payable(ptFromContractReceivers[i]),
                        fromContractAmounts[i]
                    );
                }
            } else {
                for (uint256 i = 0; i < ptFromContractReceivers.length; i++) {
                    if (
                        IERC20(ptFromContract).balanceOf(address(this)) <
                        fromContractAmounts[i]
                    ) {
                        revert BalanceBelowThenTransferredAmount();
                    }
                    if (
                        !IERC20(ptFromContract).transferFrom(
                            address(this),
                            ptFromContractReceivers[i],
                            fromContractAmounts[i]
                        )
                    )
                        revert PaymentTokenTransferError(
                            address(this),
                            ptFromContractReceivers[i],
                            fromContractAmounts[i]
                        );
                }
            }
            emit FundsTransfer(
                nonce,
                msg.sender,
                ptFromContract,
                true,
                ptFromContractReceivers,
                fromContractAmounts
            );
        }
    }

    receive() external payable {}

    /// @notice Mints `quantity` tokens to `to` address
    /// @dev Only Owner can execute this function
    function safeMint(address to, uint256 quantity) external onlyOwner {
        _safeMint(to, quantity);
    }

    /// @notice Withdraws `amount` amount of `tokenAddress` ERC20 token to owner's address
    /// @param tokenAddress Address of ERC20 token
    /// @param amount Amount of ERC20 token to withdraw
    /// @dev Only Owner can execute this function
    function withdrawTokens(address tokenAddress, uint256 amount)
        external
        onlyOwner
    {
        require(
            IERC20(tokenAddress).transfer(msg.sender, amount),
            "Iguverse: transfer error"
        );
    }

    /// @notice Withdraws `amount` amount of native currency to owner's address
    /// @param amount Amount of native currency to withdraw
    /// @dev Only Owner can execute this function
    function withdraw(uint256 amount) external onlyOwner {
        Address.sendValue(payable(msg.sender), amount);
    }
}
