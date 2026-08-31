// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";
import {IchthionVIU} from "./IchthionVIU.sol";

contract IchthionVIUTest is Test {
    IchthionVIU internal viu;

    address internal alice;
    address internal bob;

    string internal constant VIU_ID = "VIU-202608-000025";
    string internal constant TOKEN_URI =
        "ipfs://ichthion-test/VIU-202608-000025";

    bytes32 internal metadataHash;

    function setUp() public {
        viu = new IchthionVIU(address(this));

        alice = makeAddr("alice");
        bob = makeAddr("bob");

        metadataHash = keccak256(
            bytes("ichthion-viu-test-metadata")
        );
    }

    function test_AdminReceivesRequiredRoles() public view {
        assertTrue(
            viu.hasRole(viu.DEFAULT_ADMIN_ROLE(), address(this))
        );

        assertTrue(
            viu.hasRole(viu.MINTER_ROLE(), address(this))
        );

        assertTrue(
            viu.hasRole(viu.TRANSFER_ROLE(), address(this))
        );
    }

    function test_TokenIdIsDeterministic() public view {
        uint256 expected =
            uint256(keccak256(bytes(VIU_ID)));

        uint256 actual =
            viu.computeTokenId(VIU_ID);

        assertEq(actual, expected);
    }

    function test_MintVIU() public {
        uint256 tokenId = viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );

        assertEq(viu.ownerOf(tokenId), alice);
        assertEq(viu.viuIdOf(tokenId), VIU_ID);
        assertEq(viu.metadataHashOf(tokenId), metadataHash);
        assertEq(viu.tokenURI(tokenId), TOKEN_URI);
    }

    function test_CannotMintSameVIUTwice() public {
        uint256 tokenId = viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IchthionVIU.VIUAlreadyMinted.selector,
                VIU_ID,
                tokenId
            )
        );

        viu.mintVIU(
            bob,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );
    }

    function test_HolderCannotFreelyTransferVIU() public {
        uint256 tokenId = viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IchthionVIU.UnauthorizedVIUTransfer.selector,
                alice
            )
        );

        vm.prank(alice);

        viu.transferFrom(
            alice,
            bob,
            tokenId
        );
    }

    function test_AuthorizedControlledTransferWorks() public {
        uint256 tokenId = viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );

        viu.controlledTransfer(
            alice,
            bob,
            tokenId
        );

        assertEq(
            viu.ownerOf(tokenId),
            bob
        );
    }

    function test_NonTransferRoleCannotUseControlledTransfer() public {
        uint256 tokenId = viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );

        vm.expectRevert();

        vm.prank(alice);

        viu.controlledTransfer(
            alice,
            bob,
            tokenId
        );
    }

    function test_NonMinterCannotMint() public {
        vm.expectRevert();

        vm.prank(alice);

        viu.mintVIU(
            alice,
            VIU_ID,
            metadataHash,
            TOKEN_URI
        );
    }
}