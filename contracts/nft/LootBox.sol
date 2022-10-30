// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "../helpers/erc1155a/extensions/ERC721AQueryable.sol";
import "../helpers/erc1155a/extensions/ERC721ABurnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LootBox is
    VRFConsumerBaseV2,
    ERC721AQueryable,
    ERC721ABurnable,
    Ownable,
    EIP712
{
    /// Chainlink VRF variables
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    address vrfCoordinator;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    /// Chainlink results
    bool public isOpeningEnabled = true;
    uint256 private constant WAITING_FOR_NUMBER = 100001;
    mapping(uint256 => uint256) private requestIdToTokenId;
    mapping(uint256 => uint256) public tokenIdResult;
    mapping(uint256 => uint256) private minNumForToken;
    mapping(uint256 => uint256) private maxNumForToken;
    mapping(uint256 => address) public tokenBurner;
    

    /// Events
    event NumberRequested(uint256 indexed requestId, uint256 indexed tokenId);
    event NumberLanded(
        uint256 indexed requestId,
        address indexed tokenOwner,
        uint256 indexed result,
        uint256 tokenId
    );

    /// @dev Token Base Uri, can be changed by owner
    string private uriBase;

    /// @notice Returns true if nonce is used
    mapping(uint256 => bool) public isNonceUsed;

    /// @notice Signer address
    /// @dev Used by backend, can be changed by owner
    address public signerRole;

    /// @notice Emitted when new tokens are minted
    /// @param nonce Unique transaction id
    /// @param executor Address of transaction executor
    /// @param mintReceiver Address which receives minted tokens
    /// @param tokenId Token's id
    event TokensMinted(
        uint256 indexed nonce,
        address indexed executor,
        address indexed mintReceiver,
        uint256 tokenId,
        uint256 tokensToMint
    );

    /// @notice Emitted when transferring tokens or native currency in transaction
    /// @param nonce Unique transaction id
    /// @param executor Address of transaction executor
    /// @param tokenAddress Address of ERC20 token transferred
    /// @param receivers Receivers array
    /// @param amounts Amounts array
    /// @dev address(0) is used for native currency in tokenAddress.
    event FundsTransfer(
        uint256 indexed nonce,
        address indexed executor,
        address indexed tokenAddress,
        address[] receivers,
        uint256[] amounts
    );

    error PaymentTokenTransferError(address from, address to, uint256 amount);
    error BalanceBelowThenTransferredAmount();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseUri_,
        address signer,
        address coordinator,
        bytes32 keyHashBytes,
        uint64 subscriptionId
    )
        VRFConsumerBaseV2(coordinator)
        ERC721A(name_, symbol_)
        EIP712("Iguverse", "1")
    {
        signerRole = signer;
        uriBase = baseUri_;
        vrfCoordinator = coordinator;
        keyHash = keyHashBytes;
        COORDINATOR = VRFCoordinatorV2Interface(coordinator);
        s_subscriptionId = subscriptionId;
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

    function setOpeingStatus(bool newStatus) external onlyOwner{
        isOpeningEnabled = newStatus;
    }

    function requestRandomForToken(
        uint256 tokenId,
        uint256 minNum,
        uint256 maxNum,
        address ptFromAccount,
        address[] memory ptFromAccountReceivers,
        uint256[] memory fromAccountAmounts,
        uint256 deadline,
        bytes memory signature
    ) external {
        require(minNum > 0, "LootBox: minNum must be greater than 0");
        require(minNum < maxNum, "LootBox: sort error");
        require(
            WAITING_FOR_NUMBER < minNum || WAITING_FOR_NUMBER > maxNum,
            "LootBox: cant use reserved value"
        );
        require(
            ownerOf(tokenId) == msg.sender,
            "LootBox: requester must be owner"
        );
        require(
            tokenIdResult[tokenId] == 0,
            "LootBox: Random Already requested"
        );
        require(block.timestamp <= deadline, "LootBox: Transaction overdue");

        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "RequestRandom(uint256 tokenId,uint256 minNum,uint256 maxNum,address ptFromAccount,address[] ptFromAccountReceivers,uint256[] fromAccountAmounts,uint256 deadline)"
                    ),
                    tokenId,
                    minNum,
                    maxNum,
                    ptFromAccount,
                    keccak256(abi.encodePacked(ptFromAccountReceivers)),
                    keccak256(abi.encodePacked(fromAccountAmounts)),
                    deadline
                )
            )
        );
        require(
            ECDSA.recover(typedHash, signature) == signerRole,
            "LootBox: Signature Mismatch"
        );
        paymentReceive(ptFromAccount, ptFromAccountReceivers, fromAccountAmounts, 0);

        minNumForToken[tokenId] = minNum;
        maxNumForToken[tokenId] = maxNum;

        burn(tokenId);


        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestIdToTokenId[requestId] = tokenId;
        tokenBurner[tokenId] = msg.sender;
        tokenIdResult[tokenId] = WAITING_FOR_NUMBER;
        emit NumberRequested(requestId, tokenId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 tokenId = requestIdToTokenId[requestId];
        uint256 dValue = (randomWords[0] % maxNumForToken[tokenId]-minNumForToken[tokenId]) +
            minNumForToken[tokenId];
        tokenIdResult[tokenId] = dValue;
        emit NumberLanded(requestId, tokenBurner[tokenId], dValue, tokenId);
    }

    function paymentReceive(
        address ptFromAccount,
        address[] memory ptFromAccountReceivers,
        uint256[] memory fromAccountAmounts,
        uint256 nonce
    ) internal {
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
                require(msg.value >= sum, "LootBox: Not enough BNB");
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
            if(nonce != 0){
                emit FundsTransfer(
                    nonce,
                    msg.sender,
                    ptFromAccount,
                    ptFromAccountReceivers,
                    fromAccountAmounts
                );
            }
        }
    }

    /// @notice Executes a multipurpose transaction
    /// @param mintReceiver Address - receiver of new minted tokens
    /// @param ptFromAccount Address of ERC20 token to transfer from executor address
    /// @param ptFromAccountReceivers `ptFromAccount` Receivers Addresses array
    /// @param fromAccountAmounts `ptFromAccount` Amounts array
    /// @param nonce Uniqe id of transaction
    /// @param deadline Unix Timestamp after which the transaction cannot be executed
    /// @param signature A signature of transaction parameters with the private key of a valid signer
    /// @dev address(0) is used to set native currency as ptFromAccount
    function getToken(
        address mintReceiver,
        uint256 tokensToMint,
        address ptFromAccount,
        address[] memory ptFromAccountReceivers,
        uint256[] memory fromAccountAmounts,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external payable {
        require(mintReceiver != address(0), "LootBox: Receiver address zero");
        require(!isNonceUsed[nonce], "LootBox: Nonce already used");
        require(block.timestamp <= deadline, "LootBox: Transaction overdue");
        isNonceUsed[nonce] = true;

        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "RequestToken(address mintReceiver,uint256 tokensToMint,address ptFromAccount,address[] ptFromAccountReceivers,uint256[] fromAccountAmounts,address executor,uint256 nonce,uint256 deadline)"
                    ),
                    mintReceiver,
                    tokensToMint,
                    ptFromAccount,
                    keccak256(abi.encodePacked(ptFromAccountReceivers)),
                    keccak256(abi.encodePacked(fromAccountAmounts)),
                    msg.sender,
                    nonce,
                    deadline
                )
            )
        );
        require(
            ECDSA.recover(typedHash, signature) == signerRole,
            "LootBox: Signature Mismatch"
        );

        paymentReceive(ptFromAccount, ptFromAccountReceivers, fromAccountAmounts, nonce);

        emit TokensMinted(nonce, msg.sender, mintReceiver, _nextTokenId(), tokensToMint);
        _mint(mintReceiver, tokensToMint);
    }

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
            "LootBox: transfer error"
        );
    }

    /// @notice Withdraws `amount` amount of native currency to owner's address
    /// @param amount Amount of native currency to withdraw
    /// @dev Only Owner can execute this function
    function withdraw(uint256 amount) external onlyOwner {
        Address.sendValue(payable(msg.sender), amount);
    }
}
