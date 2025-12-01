// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/*
 * ConfidentialLending
 *
 * This contract implements a micro‑lending engine where all sensitive inputs
 * and computations are performed on encrypted data using Zama's FHEVM. The
 * contract accepts encrypted income, repayment score, outstanding debt and
 * requested loan amount. It computes a confidential risk score and returns
 * an encrypted approval flag (1 = approved, 0 = rejected). Users can decrypt
 * their score and decision using the Relayer SDK.
 */

import {
    FHE,
    ebool,
    euint8,
    euint16,
    euint64,
    externalEuint8,
    externalEuint16,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ConfidentialLending
 * @notice Confidential micro‑lending engine using FHEVM.
 */
contract ConfidentialLending {
    address public admin;
    uint64 public minScoreForApproval;

    struct LoanApplication {
        euint64 score;
        euint8  approved;
        bool    exists;
    }

    mapping(address => LoanApplication) public applications;

    event LoanApplied(address indexed borrower);

    constructor(uint64 _threshold) {
        admin = msg.sender;
        minScoreForApproval = _threshold;
    }

    /**
     * @notice Apply for a confidential loan.
     */
    function applyForLoan(
        externalEuint64 extIncome,
        externalEuint16 extRepaymentScore,
        externalEuint64 extDebt,
        externalEuint64 extLoanAmount,
        bytes calldata attestation
    ) external {
        // Convert external encrypted values to internal handles.
        euint64 income = FHE.fromExternal(extIncome, attestation);
        euint16 repaymentScore = FHE.fromExternal(extRepaymentScore, attestation);
        euint64 debt = FHE.fromExternal(extDebt, attestation);
        euint64 loanAmount = FHE.fromExternal(extLoanAmount, attestation);

        // score = income*2 + repaymentScore*3 - debt - loanAmount.
        euint64 incomeTimes2 = FHE.mul(income, 2);
        euint64 repayment64 = FHE.asEuint64(repaymentScore);
        euint64 repaymentTimes3 = FHE.mul(repayment64, 3);
        euint64 sum = FHE.add(incomeTimes2, repaymentTimes3);
        euint64 subtotal = FHE.sub(sum, debt);
        euint64 score = FHE.sub(subtotal, loanAmount);

        // Compare against threshold and select 1 or 0.
        euint64 threshold = FHE.asEuint64(minScoreForApproval);
        ebool isApproved = FHE.ge(score, threshold);
        euint8 approvedFlag = FHE.select(
            isApproved,
            FHE.asEuint8(uint8(1)),
            FHE.asEuint8(uint8(0))
        );

        // Store and grant decryption rights.
        LoanApplication storage app = applications[msg.sender];
        app.score = score;
        app.approved = approvedFlag;
        app.exists = true;

        // Grant access for computation
        FHE.allow(score, msg.sender);
        FHE.allow(approvedFlag, msg.sender);
        
        // Grant decryption rights for user
        FHE.allowForDecryption(score, msg.sender);
        FHE.allowForDecryption(approvedFlag, msg.sender);

        emit LoanApplied(msg.sender);
    }

    function getMyApplication() external view returns (euint64, euint8) {
        LoanApplication storage app = applications[msg.sender];
        require(app.exists, "No application");
        return (app.score, app.approved);
    }

    function updateThreshold(uint64 newThreshold) external {
        require(msg.sender == admin, "Only admin");
        minScoreForApproval = newThreshold;
    }
}

