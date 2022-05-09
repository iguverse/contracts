// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovVesting is Ownable {
    IERC20 internal _token;

    constructor(IERC20 _tokenContractAddress) {
        _token = _tokenContractAddress;
    }

    struct Vesting {
        uint256 vestingAmount;
        uint256 vestingRemaining;
        uint256 activationAmount;
        uint256 timestampStart;
        uint256 timestampEnd;
    }

    mapping(address => mapping(uint256 => Vesting)) internal _vesting;
    mapping(address => uint256) internal _slotsOf;

    function slotsOf(address _address) external view returns (uint256) {
        return (_slotsOf[_address]);
    }

    function vestingInfo(address _address, uint256 _slot)
        external
        view
        returns (Vesting memory)
    {
        return (_vesting[_address][_slot]);
    }

    function addAddresses(
        address[] memory _addresses,
        uint256[] memory _amounts,
        uint256[] memory _timestampStart,
        uint256[] memory _timestampEnd,
        uint256[] memory _initialUnlock
    ) external onlyOwner {
        uint256 len = _addresses.length;
        require(
            len == _amounts.length &&
                len == _timestampStart.length &&
                len == _timestampEnd.length &&
                len == _initialUnlock.length,
            "Array lengths mismatch"
        );
        uint256 tokensSum;
        for (uint256 i = 0; i < len; i++) {
            uint256 vestingNum = _slotsOf[_addresses[i]];
            _slotsOf[_addresses[i]]++;
            tokensSum += _amounts[i];
            Vesting memory v = Vesting(
                _amounts[i],
                _amounts[i],
                _initialUnlock[i],
                _timestampStart[i],
                _timestampEnd[i]
            );
            _vesting[_addresses[i]][vestingNum] = v;
        }
        require(
            _token.balanceOf(msg.sender) >= tokensSum &&
                _token.allowance(msg.sender, address(this)) >= tokensSum,
            "Ins balance or allowance"
        );
        _token.transferFrom(msg.sender, address(this), tokensSum);
    }

    function _availableVesting(Vesting memory v)
        internal
        view
        returns (uint256)
    {
        if (v.vestingAmount == 0) return 0;
        if (block.timestamp <= v.timestampStart) return 0;
        if (block.timestamp >= v.timestampEnd) return v.vestingRemaining;
        uint256 sharePerSecond = v.vestingAmount /
            (v.timestampEnd - v.timestampStart);
        uint256 maximumPayout = sharePerSecond *
            (block.timestamp - v.timestampStart);
        uint256 withdrawnAmount = v.vestingAmount - v.vestingRemaining;
        if (maximumPayout >= withdrawnAmount) {
            return (maximumPayout - withdrawnAmount);
        } else return 0;
    }

    function available(address _address, uint256 _slot)
        external
        view
        returns (uint256)
    {
        Vesting memory v = _vesting[_address][_slot];
        if (v.vestingRemaining == v.vestingAmount) {
            return (_availableVesting(v) + v.activationAmount);
        } else return _availableVesting(v);
    }

    function withdraw(uint256 _slot) external {
        Vesting storage v = _vesting[msg.sender][_slot];
        require(v.vestingAmount != 0, "Vesting not found");
        require(
            block.timestamp > v.timestampStart,
            "Vesting hasnt started yet"
        );
        uint256 toWithdraw = _availableVesting(v);
        v.vestingRemaining -= toWithdraw;
        if (v.vestingRemaining == v.vestingAmount) {
            toWithdraw += v.activationAmount;
        }
        _token.transfer(msg.sender, toWithdraw);
    }
}
