// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../helpers/erc1155a/extensions/ERC721AQueryable.sol";
import "../helpers/erc1155a/extensions/ERC721ABurnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Iguverse is ERC721AQueryable, ERC721ABurnable, Ownable {
    using ECDSA for bytes32;
    string private uriBase;
    mapping(uint256 => bool) public isNonceUsed;
    address public signerRole;

    error CallerIsNotOwner(uint256 tokenId);
    error PaymentTokenTransferError(address from, address to, uint256 amount);

    event TokensMinted(uint256 indexed nonce, address indexed executor, uint256 startTokenId, uint256 tokensToMint);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseUri_,
        address signer
    ) ERC721A(name_, symbol_) {
        uriBase = baseUri_;
        signerRole = signer;
    }

    function _baseURI() internal view override returns (string memory) {
        return uriBase;
    }

    function editBaseUri(string memory baseUri_) external onlyOwner {
        uriBase = baseUri_;
    }

    function editSigner(address newSigner) external onlyOwner {
        signerRole = newSigner;
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override(ERC721A)
        returns (bool)
    {
        if (operator == address(this)) {
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }

    function execTransaction(
        uint256[] memory tokensToBurn,
        uint256 tokensToMint,
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
        require(!isNonceUsed[nonce], "Iguverse: Nonce already used");
        require(block.timestamp <= deadline, "Iguverse: Transaction overdue");
        isNonceUsed[nonce] = true;

        bytes32 pureHash = keccak256(
            abi.encodePacked(
                tokensToBurn,
                tokensToMint,
                ptFromAccount,
                ptFromAccountReceivers,
                fromAccountAmounts,
                ptFromContract,
                ptFromContractReceivers,
                fromContractAmounts,
                msg.sender,
                nonce,
                deadline
            )
        );
        require(
            pureHash.toEthSignedMessageHash().recover(signature) == signerRole,
            "Iguverse: Signature Mismatch"
        );

        if (tokensToBurn.length != 0) {
            for (uint256 i = 0; i < tokensToBurn.length; i++) {
                if (ownerOf(tokensToBurn[i]) != msg.sender)
                    revert CallerIsNotOwner(tokensToBurn[i]);
                _burn(tokensToBurn[i]);
            }
        }
        if (tokensToMint != 0) {
            uint256 currentIndex =_nextTokenId();
            _mint(msg.sender, tokensToMint);
            emit TokensMinted(nonce, msg.sender, currentIndex, tokensToMint);
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
                        payable(ptFromAccountReceivers[i]).transfer(
                            fromAccountAmounts[i]
                        );
                    }
                }
            } else {
                for (uint256 i = 0; i < ptFromAccountReceivers.length; i++) {
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
        }
        if (
            (ptFromContractReceivers.length != 0) &&
            (fromContractAmounts.length != 0) &&
            (ptFromContractReceivers.length == fromContractAmounts.length)
        ) {
            if (ptFromContract == address(0)) {
                for (uint256 i = 0; i < ptFromContractReceivers.length; i++) {
                    payable(ptFromContractReceivers[i]).transfer(
                        fromContractAmounts[i]
                    );
                }
            } else {
                for (uint256 i = 0; i < ptFromContractReceivers.length; i++) {
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
        }
    }

    function safeMint(address to, uint256 quantity) external onlyOwner {
        _safeMint(to, quantity);
    }

    function withdrawTokens(address tokenAdddress, uint256 amount)
        external
        onlyOwner
    {
        require(
            IERC20(tokenAdddress).transfer(msg.sender, amount),
            "Iguverse: transfer error"
        );
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        require(payable(msg.sender).send(amount));
    }
}
