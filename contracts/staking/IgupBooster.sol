// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract IgupBooster is Ownable, EIP712 {
    event Staked(
        address indexed staker,
        uint256 amount,
        uint256 duration,
        uint256 endDate,
        uint256 indexed slot
    );

    event Unstaked(address indexed staker, uint256 indexed slot);

    struct Stake {
        address staker;
        uint256 amount;
        uint256 endDate;
        bool unstaked;
    }

    IERC20 public token;
    address public signer;

    Stake[] public stakes;
    mapping(address => uint256[]) internal _stakesOf;
    mapping(bytes => bool) internal _isSignatureUsed;

    function stakesOf(address staker) external view returns (Stake[] memory) {
        uint256 len = _stakesOf[staker].length;
        Stake[] memory stakesArray = new Stake[](len);
        for(uint256 i=0;i<len;i++){
            stakesArray[i] = stakes[_stakesOf[staker][i]];
        }
        return stakesArray;
    }

    constructor(IERC20 tokenContract, address signerAddress)
        EIP712("Iguverse", "1")
    {
        token = tokenContract;
        signer = signerAddress;
        stakes.push(Stake(address(0), 0, 0, false));
    }

    function _createNewStake(
        uint256 amount,
        uint256 durationDays
    ) internal{
        uint256 len = stakes.length;
        uint256 endDate = block.timestamp + durationDays * 1 days;
        stakes.push(Stake(msg.sender, amount, endDate, false));
        _stakesOf[msg.sender].push(len);
        emit Staked(msg.sender, amount, durationDays, endDate, len);
    }

    function stake(
        uint256 amount,
        uint256 durationDays,
        uint256 deadline,
        bytes memory signature
    ) external {
        require(!_isSignatureUsed[signature], "IgupBooster: Signature already used");
        _isSignatureUsed[signature] = true;
        require(block.timestamp <= deadline, "IgupBooster: Transaction overdue");
        require(durationDays > 0, "IgupBooster: Minimum 1 day duration");

        bytes32 typedHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "StakeData(address staker,uint256 amount,uint256 durationDays,uint256 deadline)"
                    ),
                    msg.sender,
                    amount,
                    durationDays,
                    deadline
                )
            )
        );
        require(
            ECDSA.recover(typedHash, signature) == signer,
            "IgupBooster: Signature Mismatch"
        );

        _createNewStake(amount, durationDays);

        require(
            token.balanceOf(msg.sender) >= amount,
            "IgupBooster: Not enought balance"
        );
        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "IgupBooster: Allowance not enough"
        );
        token.transferFrom(msg.sender, address(this), amount);
    }

    function unstake(uint256 slot) external {
        Stake memory s = stakes[slot];
        require(s.staker == msg.sender, "IgupBooster: Address is not owner of stake");
        require(
            block.timestamp >= s.endDate,
            "IgupBooster: Stake period is not ended"
        );
        stakes[slot].unstaked = true;
        token.transfer(msg.sender, s.amount);
        emit Unstaked(msg.sender, slot);
    }

    /// @notice Rewrites Signer Address
    /// @param newSigner new signer's address
    /// @dev All signatures made by the old signer will no longer be valid. Only Owner can execute this function
    function setSigner(address newSigner) external onlyOwner {
        signer = newSigner;
    }
}
