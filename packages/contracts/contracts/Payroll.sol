// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Payroll (privacy-minimized hybrid)
/// @notice Confidential payroll core with minimal metadata on-chain.
/// Identity/roster/company metadata should live off-chain (e.g., Supabase).
contract Payroll is AccessControl, ReentrancyGuard, ZamaEthereumConfig {
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    uint256 public constant MAX_BATCH_SIZE = 200;

    error NotEmployee();
    error SalaryNotSet();
    error PayrollNotOperator();
    error PayrollNotWrapperOperator();
    error InvalidAddress();
    error UnauthorizedSelfView();
    error InvalidRunId();
    error EmployeeAlreadyActive();
    error BatchTooLarge(uint256 provided, uint256 maxAllowed);
    error AlreadyPaidForRun(address employee, bytes32 runId);
    error CompanyDeactivated();

    // Set to true by deactivate() to permanently lock all mutating operations.
    bool public deactivated;

    // ERC-7984 confidential token
    IERC7984 public immutable token;

    // Canonical employer wallet (funding source)
    address public immutable employer;

    // Opaque reference to off-chain company record (e.g., keccak256(company_id UUID))
    bytes32 public immutable companyRef;

    // Active employee flag (address still necessary for token transfer recipient)
    mapping(address => bool) private _isEmployee;

    // Encrypted salary and last payment handles
    mapping(address => euint64) private _salary;
    mapping(address => bool) private _hasSalary;
    mapping(address => euint64) private _lastPayment;

    // Opaque run tracking (metadata-minimized replacement for "period")
    mapping(address => bytes32) private _lastRunId;
    mapping(address => mapping(bytes32 => bool)) private _paidInRun;

    // Minimal non-personal-ish event (does not include employee address)
    event PayrollRunExecuted(bytes32 indexed runId, uint256 employeeCount);
    event PayrollDeactivated();

    constructor(
        IERC7984 token_,
        address employer_,
        bytes32 companyRef_
    ) {
        if (address(token_) == address(0) || employer_ == address(0)) revert InvalidAddress();

        token = token_;
        employer = employer_;
        companyRef = companyRef_;

        _grantRole(DEFAULT_ADMIN_ROLE, employer_);
        _grantRole(EMPLOYER_ROLE, employer_);
    }

    // ------------------------------------------------------------
    // Deactivation
    // ------------------------------------------------------------

    /// @notice Permanently deactivate this payroll contract. Only employer role.
    /// @dev Irreversible. Blocks all future addEmployee / removeEmployee / setSalary / payroll runs.
    function deactivate() external onlyRole(EMPLOYER_ROLE) {
        if (deactivated) revert CompanyDeactivated();
        deactivated = true;
        emit PayrollDeactivated();
    }

    modifier notDeactivated() {
        if (deactivated) revert CompanyDeactivated();
        _;
    }

    function payrollToken() external view returns (address) {
        return address(token);
    }

    function payrollHasOperatorApproval() external view returns (bool) {
        return token.isOperator(employer, address(this));
    }

    // ------------------------------------------------------------
    // Employee lifecycle (no public roster enumeration)
    // ------------------------------------------------------------

    /// @notice Add or reactivate an employee. Only employer role.
    function addEmployee(address employee_) external onlyRole(EMPLOYER_ROLE) notDeactivated nonReentrant {
        if (employee_ == address(0)) revert InvalidAddress();
        if (_isEmployee[employee_]) revert EmployeeAlreadyActive();

        _isEmployee[employee_] = true;
        // No event: avoid broadcasting HR metadata unnecessarily.
    }

    /// @notice Deactivate an employee. Only employer role.
    /// @dev Clears active payroll state to reduce stale data reuse risk.
    function removeEmployee(address employee_) external onlyRole(EMPLOYER_ROLE) notDeactivated nonReentrant {
        if (!_isEmployee[employee_]) revert NotEmployee();

        _isEmployee[employee_] = false;

        // Clear active payroll config / ephemeral state
        _salary[employee_] = euint64.wrap(0);
        _hasSalary[employee_] = false;
        _lastPayment[employee_] = euint64.wrap(0);
        _lastRunId[employee_] = bytes32(0);

        // No event: avoid broadcasting HR metadata unnecessarily.
    }

    /// @notice Employer-only check: whether address is currently active employee.
    function isEmployee(address employee_)
        external
        view
        onlyRole(EMPLOYER_ROLE)
        returns (bool)
    {
        return _isEmployee[employee_];
    }

    /// @notice Employee self-check for active status.
    function myEmploymentActive() external view returns (bool) {
        if (!_isEmployee[msg.sender]) revert UnauthorizedSelfView();
        return _isEmployee[msg.sender];
    }

    // ------------------------------------------------------------
    // Salaries (encrypted)
    // ------------------------------------------------------------

    /// @notice Set salary (encrypted). Only employer role.
    function setSalary(
        address employee_,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof
    ) external onlyRole(EMPLOYER_ROLE) notDeactivated {
        if (!_isEmployee[employee_]) revert NotEmployee();

        euint64 s = FHE.fromExternal(encryptedSalary, inputProof);
        _salary[employee_] = s;
        _hasSalary[employee_] = true;

        // ACL permissions
        FHE.allowThis(s);
        FHE.allow(s, employer);

        if (msg.sender != employer) {
            FHE.allow(s, msg.sender); // delegated operator role can decrypt/use too
        }

        FHE.allow(s, employee_);

        // No event: salary updates are sensitive HR metadata.
    }

    function salaryOfEmployee(address employee_)
        external
        view
        onlyRole(EMPLOYER_ROLE)
        returns (euint64)
    {
        return _salary[employee_];
    }

    function mySalary() external view returns (euint64) {
        if (!_isEmployee[msg.sender]) revert UnauthorizedSelfView();
        return _salary[msg.sender];
    }

    // ------------------------------------------------------------
    // Last payment (encrypted)
    // ------------------------------------------------------------

    function lastPaymentOfEmployee(address employee_)
        external
        view
        onlyRole(EMPLOYER_ROLE)
        returns (euint64)
    {
        return _lastPayment[employee_];
    }

    function myLastPayment() external view returns (euint64) {
        if (!_isEmployee[msg.sender]) revert UnauthorizedSelfView();
        return _lastPayment[msg.sender];
    }

    // ------------------------------------------------------------
    // Opaque run lock views (restricted)
    // ------------------------------------------------------------

    function paidInRun(address employee_, bytes32 runId)
        external
        view
        onlyRole(EMPLOYER_ROLE)
        returns (bool)
    {
        return _paidInRun[employee_][runId];
    }

    function lastRunIdOfEmployee(address employee_)
        external
        view
        onlyRole(EMPLOYER_ROLE)
        returns (bytes32)
    {
        return _lastRunId[employee_];
    }

    function myLastRunId() external view returns (bytes32) {
        if (!_isEmployee[msg.sender]) revert UnauthorizedSelfView();
        return _lastRunId[msg.sender];
    }

    // ------------------------------------------------------------
    // Payroll execution (opaque runId instead of semantic period id)
    // ------------------------------------------------------------

    /// @notice Run payroll for one employee with duplicate-payment protection for a given opaque runId.
    /// @dev Requires employer to set this Payroll contract as operator on the token.
    function runPayrollForRun(address employee_, bytes32 runId)
        external
        onlyRole(EMPLOYER_ROLE)
        notDeactivated
        nonReentrant
        returns (euint64 transferred)
    {
        transferred = _runPayrollForRun(employee_, runId);
        emit PayrollRunExecuted(runId, 1);
    }

    /// @notice Run payroll for a batch of employees for a given opaque runId.
    function runPayrollBatchForRun(address[] calldata employees_, bytes32 runId)
        external
        onlyRole(EMPLOYER_ROLE)
        notDeactivated
        nonReentrant
    {
        uint256 length = employees_.length;
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge(length, MAX_BATCH_SIZE);
        if (runId == bytes32(0)) revert InvalidRunId();

        for (uint256 i = 0; i < length; i++) {
            _runPayrollForRun(employees_[i], runId);
        }

        emit PayrollRunExecuted(runId, length);
    }

    function _runPayrollForRun(address employee_, bytes32 runId)
        internal
        returns (euint64 transferred)
    {
        if (runId == bytes32(0)) revert InvalidRunId();
        if (_paidInRun[employee_][runId]) revert AlreadyPaidForRun(employee_, runId);

        transferred = _runPayrollTransfer(employee_);

        _paidInRun[employee_][runId] = true;
        _lastRunId[employee_] = runId;
    }

    function _runPayrollTransfer(address employee_) internal returns (euint64 transferred) {
        if (!_isEmployee[employee_]) revert NotEmployee();
        if (!_hasSalary[employee_]) revert SalaryNotSet();

        euint64 s = _salary[employee_];
        if (!FHE.isInitialized(s)) revert SalaryNotSet();

        if (!token.isOperator(employer, address(this))) revert PayrollNotOperator();

        FHE.allowTransient(s, address(token));

        // Pays from canonical employer wallet, even if caller is delegated EMPLOYER_ROLE operator
        transferred = token.confidentialTransferFrom(employer, employee_, s);

        _lastPayment[employee_] = transferred;
        FHE.allowThis(transferred);
        FHE.allow(transferred, employer);

        if (msg.sender != employer) {
            FHE.allow(transferred, msg.sender);
        }

        FHE.allow(transferred, employee_);
    }

    // ------------------------------------------------------------
    // Unwrap: ERC-7984 → ERC-20 (e.g. cUSDC → USDC)
    // ------------------------------------------------------------

    /// @notice Employee calls this to unwrap confidential tokens back to plain USDC.
    /// @dev Requires the employee to have previously called `wrapper.setOperator(payrollContract, until)`
    ///      so this contract can act on their behalf.
    ///      Step 1 of 2: initiates the unwrap. The FHE gateway will call `finalizeUnwrap` on the
    ///      wrapper once decryption completes, transferring USDC to `to`.
    /// @param to            Destination wallet that will receive the plain ERC-20 tokens.
    /// @param encryptedAmount  FHE-encrypted amount to unwrap (produced by the FHE client SDK).
    /// @param inputProof       Proof accompanying the encrypted amount.
    function requestUnwrap(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external nonReentrant {
        if (!_isEmployee[msg.sender]) revert NotEmployee();
        if (to == address(0)) revert InvalidAddress();

        ERC7984ERC20Wrapper wrapper = ERC7984ERC20Wrapper(address(token));
        if (!wrapper.isOperator(msg.sender, address(this))) revert PayrollNotWrapperOperator();

        wrapper.unwrap(msg.sender, to, encryptedAmount, inputProof);
    }

    /// @notice Returns whether this Payroll contract is approved as wrapper operator for the caller.
    /// @dev If false, the employee must call `wrapper.setOperator(payrollAddress, until)` before
    ///      using `requestUnwrap`.
    function myWrapperOperatorApproved() external view returns (bool) {
        if (!_isEmployee[msg.sender]) revert UnauthorizedSelfView();
        return ERC7984ERC20Wrapper(address(token)).isOperator(msg.sender, address(this));
    }
}