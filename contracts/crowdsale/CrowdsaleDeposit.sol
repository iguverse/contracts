// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrowdsaleDeposit is Ownable{
    mapping(address => uint256) public depositOf;
    uint256 public deposited;
    IERC20 public paymentToken;
    bool public disabled;

    event Deposit(address indexed sender, uint256 amount);

    constructor (IERC20 paymentTokenP, bool disabledP){
        paymentToken = paymentTokenP;
        disabled = disabledP;
    }

    function deposit(uint256 amount) external{
        paymentToken.transferFrom(msg.sender, address(this), amount);
        depositOf[msg.sender]+=amount;
        deposited+=amount;
    }

    function setStatus(bool status) external onlyOwner{
        disabled = status;
    }

    function withdraw() external onlyOwner{
        paymentToken.transfer(msg.sender, paymentToken.balanceOf(address(this)));
    }
}