// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockMasterMindNFT is ERC721 {
    uint256 public nextId;

    constructor() ERC721("Master Mind NFT", "MMNFT") {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = ++nextId;
        _mint(to, tokenId);
        return tokenId;
    }
}
