// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IguVesting is Ownable {
    struct Vesting {
        uint256 vestingAmount;
        uint256 claimedAmount;
        uint256 activationAmount;
        uint256 timestampStart;
        uint256 timestampEnd;
    }

    IERC20 public _token;

    mapping(address => mapping(uint256 => Vesting)) internal _vesting;

    mapping(address => uint256) internal _slotsOf;

    constructor(IERC20 _tokenContractAddress) {
        _token = _tokenContractAddress;
    }

    function slotsOf(address _address) external view returns (uint256) {
        return _slotsOf[_address];
    }

    function vestingInfo(address _address, uint256 _slot)
        external
        view
        returns (Vesting memory)
    {
        return _vesting[_address][_slot];
    }

    function _vestedAmount(Vesting memory vesting)
        internal
        view
        returns (uint256)
    {
        if (vesting.vestingAmount == 0) {
            return 0;
        }
        if (block.timestamp < vesting.timestampStart) {
            return 0;
        }

        if (block.timestamp >= vesting.timestampEnd) {
            // in case of exceeding end time
            return vesting.vestingAmount;
        }

        uint256 vestingAmount = vesting.vestingAmount -
            vesting.activationAmount;
        uint256 vestingPeriod = vesting.timestampEnd - vesting.timestampStart;

        uint256 timeSinceVestingStart = uint256(block.timestamp) -
            vesting.timestampStart;

        uint256 vestedAmount = (vestingAmount * timeSinceVestingStart) /
            vestingPeriod;
        return vestedAmount + vesting.activationAmount;
    }

    function available(address _address, uint256 _slot)
        public
        view
        returns (uint256)
    {
        Vesting memory vesting = _vesting[_address][_slot];
        return _vestedAmount(vesting) - vesting.claimedAmount;
    }

    function addVestingEntries(
        address[] memory _addresses,
        uint256[] memory _amounts,
        uint256[] memory _timestampStart,
        uint256[] memory _timestampEnd,
        uint256[] memory _initialUnlock
    ) external onlyOwner {
        uint256 len = _addresses.length;
        if (
            len != _amounts.length ||
            len != _timestampStart.length ||
            len != _timestampEnd.length ||
            len != _initialUnlock.length
        ) {
            revert ("IguVesting: Array Lengths Mismatch");
        }

        uint256 tokensSum;
        for (uint256 i = 0; i < len; i++) {
            address account = _addresses[i];

            // increase required amount to transfer
            tokensSum += _amounts[i];

            Vesting memory vesting = Vesting(
                _amounts[i],
                0,
                _initialUnlock[i],
                _timestampStart[i],
                _timestampEnd[i]
            );

            uint256 vestingNum = _slotsOf[account];
            _vesting[account][vestingNum] = vesting;
            _slotsOf[account]++;
        }

        if (
            _token.balanceOf(msg.sender) < tokensSum ||
            _token.allowance(msg.sender, address(this)) < tokensSum
        ) {
            revert ("IguVesting: Insufficient Balance Or Allowance");
        }

        _token.transferFrom(msg.sender, address(this), tokensSum);
    }

    function withdraw(uint256 _slot) external {
        Vesting storage vesting = _vesting[msg.sender][_slot];

        if (vesting.vestingAmount == 0) {
            revert ("IguVesting: Vesting Not Found");
        }
        if (block.timestamp < vesting.timestampStart) {
            revert ("IguVesting: Vesting Not Started Yet");
        }

        uint256 toWithdraw = available(msg.sender, _slot);

        vesting.claimedAmount += toWithdraw;

        // withdraw all available funds
        _token.transfer(msg.sender, toWithdraw);
    }
}