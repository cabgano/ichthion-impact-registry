// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IchthionVIU
 * @notice Blockchain representation of an Ichthion Verified Impact Unit (VIU).
 *
 * The Impact Registry remains the canonical business source of truth.
 * This contract provides the immutable on-chain representation of a VIU.
 */
contract IchthionVIU is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    mapping(uint256 => string) private _viuIds;
    mapping(uint256 => bytes32) private _metadataHashes;

    error InvalidAdmin();
    error EmptyVIUId();
    error EmptyTokenURI();
    error EmptyMetadataHash();
    error VIUAlreadyMinted(string viuId, uint256 tokenId);
    error UnauthorizedVIUTransfer(address operator);
    error IncorrectCurrentOwner(address expectedOwner, address actualOwner);

    event VIUMinted(
        uint256 indexed tokenId,
        string viuId,
        bytes32 indexed metadataHash,
        address indexed recipient,
        string tokenURI
    );

    event VIUControlledTransfer(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        address operator
    );

    constructor(address admin)
        ERC721("Ichthion Verified Impact Unit", "VIU")
    {
        if (admin == address(0)) {
            revert InvalidAdmin();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(TRANSFER_ROLE, admin);
    }

    /**
     * @notice Deterministically derives the ERC-721 token ID
     * from the canonical VIU permanent identifier.
     */
    function computeTokenId(
        string memory viuId
    ) public pure returns (uint256) {
        if (bytes(viuId).length == 0) {
            revert EmptyVIUId();
        }

        return uint256(keccak256(bytes(viuId)));
    }

    /**
     * @notice Mints the blockchain representation of an eligible VIU.
     *
     * @param recipient Wallet receiving the token.
     * @param viuId Canonical Impact Registry VIU identifier.
     * @param metadataHash Existing onchain_metadata_hash from the Registry.
     * @param uri URI of the blockchain-safe VIU metadata.
     */
    function mintVIU(
        address recipient,
        string calldata viuId,
        bytes32 metadataHash,
        string calldata uri
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (bytes(viuId).length == 0) {
            revert EmptyVIUId();
        }

        if (metadataHash == bytes32(0)) {
            revert EmptyMetadataHash();
        }

        if (bytes(uri).length == 0) {
            revert EmptyTokenURI();
        }

        tokenId = computeTokenId(viuId);

        if (_ownerOf(tokenId) != address(0)) {
            revert VIUAlreadyMinted(viuId, tokenId);
        }

        _viuIds[tokenId] = viuId;
        _metadataHashes[tokenId] = metadataHash;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit VIUMinted(
            tokenId,
            viuId,
            metadataHash,
            recipient,
            uri
        );
    }

    /**
     * @notice Performs an Ichthion-authorized VIU transfer.
     *
     * Holders cannot freely transfer VIUs through the normal ERC-721
     * transfer functions unless the caller has TRANSFER_ROLE.
     */
    function controlledTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external onlyRole(TRANSFER_ROLE) {
        address currentOwner = ownerOf(tokenId);

        if (currentOwner != from) {
            revert IncorrectCurrentOwner(from, currentOwner);
        }

        _safeTransfer(from, to, tokenId, "");

        emit VIUControlledTransfer(
            tokenId,
            from,
            to,
            _msgSender()
        );
    }

    /**
     * @notice Returns the canonical VIU identifier represented by a token.
     */
    function viuIdOf(
        uint256 tokenId
    ) external view returns (string memory) {
        ownerOf(tokenId);
        return _viuIds[tokenId];
    }

    /**
     * @notice Returns the metadata integrity commitment stored for a VIU.
     */
    function metadataHashOf(
        uint256 tokenId
    ) external view returns (bytes32) {
        ownerOf(tokenId);
        return _metadataHashes[tokenId];
    }

    /**
     * @dev Restricts ordinary holder-to-holder transfers.
     *
     * Minting remains allowed because `from == address(0)`.
     * A normal transfer requires TRANSFER_ROLE.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (
            from != address(0) &&
            to != address(0) &&
            !hasRole(TRANSFER_ROLE, _msgSender())
        ) {
            revert UnauthorizedVIUTransfer(_msgSender());
        }

        return super._update(to, tokenId, auth);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}