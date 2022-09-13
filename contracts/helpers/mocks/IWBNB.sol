// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IWBNB {
    function deposit() external payable;

    function withdraw(uint256 wad) external;

    function totalSupply() external view returns (uint256);

    function approve(address guy, uint256 wad) external returns (bool);

    function transfer(address dst, uint256 wad) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) external returns (bool);

    function balanceOf(address adr) external view returns (uint256);

    function allowance(address from, address operator)
        external
        view
        returns (uint256);
}
