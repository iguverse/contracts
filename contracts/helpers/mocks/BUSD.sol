// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract tBUSD is ERC20, ERC20Burnable {
    constructor() ERC20("Testnet BUSD", "tBUSD") {
        _mint(msg.sender, 1000000 ether);
    }
}
