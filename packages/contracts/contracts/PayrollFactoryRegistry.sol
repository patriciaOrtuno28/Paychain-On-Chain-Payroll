// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {Payroll} from "./Payroll.sol";

/// @title PayrollFactoryRegistry (privacy-minimized hybrid)
/// @notice Deploys one Payroll contract per employer wallet.
/// No employee registry hooks. Company metadata should be stored off-chain (Supabase).
contract PayrollFactoryRegistry {
    error CompanyAlreadyRegistered();
    error InvalidToken();
    error UnauthorizedLookup();
    error NoCompanyRegistered();

    IERC7984 public immutable token;

    // employer -> payroll (kept private to avoid an auto-generated public getter)
    mapping(address => address) private _companyOfEmployer;

    // payroll -> registered?
    mapping(address => bool) public isRegisteredPayroll;

    // payroll -> opaque company reference (hash of off-chain company_id)
    mapping(address => bytes32) public companyRefOfPayroll;

    event PayrollDeployed(address indexed payroll, bytes32 indexed companyRef);
    event PayrollDeleted(address indexed payroll, bytes32 indexed companyRef);

    constructor(IERC7984 token_) {
        if (address(token_) == address(0)) revert InvalidToken();
        token = token_;
    }

    /// @notice Register a company and deploy a dedicated Payroll contract.
    /// @param companyRef Opaque hash linking to off-chain company record (e.g. keccak256(company_id))
    function registerCompany(bytes32 companyRef) external returns (address payroll) {
        if (_companyOfEmployer[msg.sender] != address(0)) revert CompanyAlreadyRegistered();

        payroll = address(new Payroll(token, msg.sender, companyRef));

        _companyOfEmployer[msg.sender] = payroll;
        isRegisteredPayroll[payroll] = true;
        companyRefOfPayroll[payroll] = companyRef;

        emit PayrollDeployed(payroll, companyRef);
    }

    /// @notice Delete (deregister) the caller's company from the registry.
    /// @dev Does NOT selfdestruct the Payroll contract — call Payroll.deactivate() first to lock it.
    ///      After this call, myCompany() returns address(0) and the employer can register a new company.
    function deleteCompany() external {
        address payroll = _companyOfEmployer[msg.sender];
        if (payroll == address(0)) revert NoCompanyRegistered();

        bytes32 companyRef = companyRefOfPayroll[payroll];

        delete _companyOfEmployer[msg.sender];
        isRegisteredPayroll[payroll] = false;
        companyRefOfPayroll[payroll] = bytes32(0);

        emit PayrollDeleted(payroll, companyRef);
    }

    /// @notice Restricted lookup: only the employer can ask for their own payroll through this function.
    /// @dev This does NOT make storage confidential (blockchain storage is public), but removes a convenience public getter.
    function companyOfEmployer(address employer_) external view returns (address) {
        if (msg.sender != employer_) revert UnauthorizedLookup();
        return _companyOfEmployer[employer_];
    }

    /// @notice Convenience self-view.
    function myCompany() external view returns (address) {
        return _companyOfEmployer[msg.sender];
    }
}