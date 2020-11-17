// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./interfaces/IERC165.sol";
import "./Ownable.sol";

contract Wallet is IERC165, Ownable {

    function supportsInterface(bytes4 interfaceID) external view override returns (bool) {
        return interfaceID == 0x7f5828d0;
    }
}
