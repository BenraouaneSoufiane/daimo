// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/P256SHA256.sol";
import "../src/AccountFactory.sol";
import "../src/Account.sol";

import "account-abstraction/core/EntryPoint.sol";

contract SigningKeysTest is Test {
    using UserOperationLib for UserOperation;

    P256SHA256 public verifier;
    EntryPoint public entryPoint;
    AccountFactory public factory;

    function setUp() public {
        verifier = new P256SHA256();
        entryPoint = new EntryPoint();
        factory = new AccountFactory(entryPoint, verifier);
    }

    event SigningKeyAdded(IAccount indexed account, bytes32[2] accountPubkey);
    event SigningKeyRemoved(IAccount indexed account, bytes32[2] accountPubkey);

    function testAddingAndRemovingKeys() public {
        // hardcoded from swift playground
        bytes32[2] memory key1 = [
            bytes32(
                hex"65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4"
            ),
            bytes32(
                hex"4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437"
            )
        ];

        bytes32[2] memory key2 = [
            bytes32(
                hex"1bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421da"
            ),
            bytes32(
                hex"a54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43"
            )
        ];

        Account acc = factory.createAccount(key1, 42);
        console.log("new account address:", address(acc));

        vm.expectRevert("only self");
        acc.addSigningKey(key2);

        vm.startPrank(address(acc));

        // add key2
        vm.expectEmit(true, true, true, false);
        emit SigningKeyAdded(acc, key2);
        acc.addSigningKey(key2);

        // remove key1
        vm.expectEmit(true, true, true, false);
        emit SigningKeyRemoved(acc, key1);
        acc.removeSigningKey(key1);

        // remove key2
        vm.expectRevert("cannot remove singular key");
        acc.removeSigningKey(key2);

        vm.stopPrank();
    }
}
