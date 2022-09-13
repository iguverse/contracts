// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract tBUSD is ERC20, ERC20Burnable {
    constructor() ERC20("Testnet BUSD", "tBUSD") {
        _mint(0x4A6c62FeF99642171341dD8419Ed98173cae6412, 5000000 ether);
        _mint(msg.sender, 5000000 ether);
    }

    function returnOne() external pure returns(uint256){
        return 1;
    }
}
