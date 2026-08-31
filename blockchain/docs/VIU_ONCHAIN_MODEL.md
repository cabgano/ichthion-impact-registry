# Ichthion VIU On-Chain Model

## Version

11A.2 — Testnet blockchain model

## Purpose

Define the canonical blockchain representation of an Ichthion Verified Impact Unit (VIU).

The Impact Registry remains the canonical operational and business source of truth.

Blockchain provides an immutable on-chain representation and integrity layer for VIUs that have already:

1. been created as internal digital assets,
2. been allocated to a client,
3. completed issuance,
4. received an individual MINT preparation,
5. reached `ready_for_future_mint`.

---

## Asset Standard

Each eligible VIU is represented by one ERC-721 token.

Relationship:

1 VIU = 1 ERC-721 token

VIUs are individually identifiable assets and are not represented as a fungible blockchain balance.

---

## Canonical VIU Identity

The existing Impact Registry `future_token_id` / VIU permanent identifier remains the canonical human-readable identity.

Example:

VIU-202608-000025

Blockchain does not replace this identifier.

---

## Blockchain Token ID

ERC-721 requires a uint256 token ID.

The blockchain token ID is deterministically derived from the canonical VIU identity:

tokenId = uint256(keccak256(bytes(future_token_id)))

This provides:

- deterministic blockchain identity,
- no dependency on a sequential blockchain counter,
- direct linkage to the existing VIU identifier,
- strong duplicate-mint protection.

The resulting token ID is persisted back into the Impact Registry after a successful mint.

---

## Mint Authority

Minting is permissioned.

The smart contract uses a MINTER_ROLE controlled by Ichthion.

During 11A, the dedicated Ichthion test wallet acts as the authorized blockchain operator.

Production wallet, custody, signing, and authorization architecture are finalized in 11B.

---

## Recipient

A VIU may be:

1. minted to an Ichthion-controlled wallet and later transferred through an authorized process, or
2. minted directly to an approved client wallet.

During 11A, test wallets are used to validate both minting and controlled transfer behavior.

The client allocation stored in the Impact Registry remains the canonical business relationship.

Blockchain wallet ownership does not replace or redefine the Registry allocation.

---

## Controlled Transferability

VIU tokens are not freely transferable.

Transfers are allowed only through Ichthion-authorized blockchain operations.

The contract uses a TRANSFER_ROLE or equivalent authorization mechanism.

Allowed:

- mint to an approved wallet,
- authorized Ichthion transfer,
- controlled wallet migration when required.

Not allowed:

- unrestricted holder-to-holder transfers,
- transfers that bypass Ichthion authorization,
- blockchain movements that intentionally contradict the canonical Registry allocation.

This allows VIUs to be delivered to client wallets while preventing an uncontrolled secondary market from overriding Registry truth.

---

## Blockchain Ownership Semantics

The blockchain holder represents the current technical/on-chain holder of the token.

The Impact Registry remains authoritative for:

- client allocation,
- VIU lifecycle,
- business ownership/context,
- impact accounting,
- evidence,
- statements.

A blockchain wallet address alone must not be interpreted as sufficient proof of the canonical client allocation.

---

## Metadata

Every token is minted with a token URI.

The URI represents the client-safe blockchain metadata representation of the VIU.

The exact storage and delivery mechanism for token metadata is implemented later in 11A.

---

## Metadata Integrity

The existing Impact Registry `onchain_metadata_hash` is the canonical metadata integrity commitment.

The smart contract stores this value as bytes32.

The contract does not regenerate or reinterpret Impact Registry metadata.

The hash binds the token to the already prepared and sealed MINT metadata.

---

## On-Chain Data

The smart contract directly records or exposes:

- ERC-721 token ID
- VIU permanent ID / future_token_id
- onchain_metadata_hash
- token URI
- current token holder
- mint event
- authorized transfer events

---

## Data Not Replicated Directly On-Chain

The following remain in the Impact Registry or associated evidence storage:

- client names and private client information
- complete allocation data
- evidence files
- source packages
- statements
- full MINT JSON
- complete operational lifecycle data
- internal administrative information

Their integrity can be anchored through the prepared metadata hash without unnecessarily exposing complete records on-chain.

---

## Duplicate Mint Protection

A canonical VIU can only be minted once per canonical blockchain environment.

Protection exists at two levels:

1. deterministic token ID and smart-contract existence checks,
2. Impact Registry mint-status and reconciliation controls.

A retry after a failed transaction must not accidentally create a second representation of the same VIU.

---

## Transfer Integrity

An authorized transfer does not modify the canonical allocation automatically.

The Impact Registry remains the source of truth.

Future production workflows may require Registry authorization before executing an on-chain transfer.

During 11A, this relationship is explicitly tested using test wallets.

---

## Source of Truth

### Impact Registry

Responsible for:

- canonical VIU identity
- impact accounting
- client allocation
- asset lifecycle
- evidence
- statements
- methodologies
- MINT preparation
- canonical business truth

### Blockchain

Responsible for:

- immutable token existence
- metadata integrity commitment
- current blockchain holder
- mint transaction evidence
- authorized transfer evidence

Blockchain complements the Impact Registry; it does not replace it.

---

## Testnet Environment

11A uses:

- Network: Base Sepolia
- Chain ID: 84532
- Environment: test
- Mint authority: dedicated Ichthion 11A test wallet

No production funds or production wallets are used.

Production deployment is deferred to 11B.

---

## Mint Result

After a successful blockchain transaction, the Impact Registry records blockchain result fields including:

- chain_id
- contract_address
- token_id
- token_uri
- token_tx_hash
- wallet_address
- minted_at
- successful on-chain lifecycle state

A failed transaction must not mark the VIU as successfully minted.

---

## Lifecycle Boundary

Existing Level 2 lifecycle:

VIU
→ allocated
→ issued
→ MINT prepared
→ ready_for_future_mint
→ not_minted

11A extends this:

ready_for_future_mint
→ blockchain mint transaction
→ confirmed receipt
→ ERC-721 token exists on Base Sepolia
→ blockchain identity persisted in Impact Registry
→ minted

Optional controlled transfer:

minted
→ authorized transfer
→ new blockchain holder

The canonical Impact Registry allocation remains independently controlled.