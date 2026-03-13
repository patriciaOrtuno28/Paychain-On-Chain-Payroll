// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {
    ERC7984ERC20Wrapper,
    ERC7984
} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/// @title PayrollConfidentialWrapper
/// @notice Confidential ERC-7984 wrapper backed 1:1 (with wrapper rate conversion) by an ERC-20 underlying token.
/// @dev Inherits OZ ERC7984ERC20Wrapper, which already implements:
///      - wrap(to, amount)
///      - unwrap(from, to, euint64 amount)
///      - unwrap(from, to, externalEuint64 encryptedAmount, bytes inputProof)
///      - finalizeUnwrap(...)
///      - underlying()
///      - rate()
///
/// Typical employer flow:
/// 1) Approve underlying ERC20 to this wrapper
/// 2) wrap(employer, amount)
/// 3) setOperator(payrollContract, until)
/// 4) Payroll contract runs confidential transfers from employer balance
contract PayrollConfidentialWrapper is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    /// @param underlying_  ERC20 token to wrap (e.g. USDC on Sepolia)
    /// @param name_        Confidential token name (e.g. "Confidential USDC Payroll")
    /// @param symbol_      Confidential token symbol (e.g. "cUSDCp")
    /// @param contractURI_ Contract metadata URI (ERC-7572 style)
    constructor(
        IERC20 underlying_,
        string memory name_,
        string memory symbol_,
        string memory contractURI_
    )
        ERC7984ERC20Wrapper(underlying_)
        ERC7984(name_, symbol_, contractURI_)
    {}
}