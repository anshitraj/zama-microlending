import { expect } from "chai";
import { ethers } from "hardhat";
import { createInstance, FhevmInstance, FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/node";

/*
 * Unit test using the Relayer SDK directly (no hardhat plugin needed).
 * It encrypts sample inputs, calls applyForLoan, and decrypts the stored score and approval flag.
 * 
 * Note: For local Hardhat testing, we need to provide a custom config.
 * In a real deployment, use SepoliaConfig for Sepolia testnet.
 */

// Local config for Hardhat network (chainId 31337)
const LocalHardhatConfig: FhevmInstanceConfig = {
  chainId: 31337,
  publicKey: "", // Will be generated automatically
  verifyingContractAddressDecryption: "0x0000000000000000000000000000000000000000", // Placeholder for local
  relayerUrl: "http://localhost:8010", // Local relayer URL
};

describe("ConfidentialLending", function () {
  let fhevmInstance: FhevmInstance;

  before(async function () {
    // Initialize FHEVM instance for testing
    // Note: This test requires a local relayer to be running
    // For now, we'll skip if relayer is not available
    try {
      fhevmInstance = await createInstance(LocalHardhatConfig);
    } catch (error) {
      console.warn("Could not initialize FHEVM instance. Local relayer may not be running.");
      this.skip();
    }
  });

  it("should accept an encrypted loan request and store correct score and approval", async function () {
    const [deployer, borrower] = await ethers.getSigners();

    const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
    const contract = await ConfidentialLending.deploy(1000);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    const borrowerAddress = await borrower.getAddress();

    // Plaintext test values
    const income = 500;
    const repaymentScore = 50;
    const debt = 100;
    const loanAmount = 200;

    // Use the Relayer SDK to encrypt inputs
    const enc = await fhevmInstance.createEncryptedInput(contractAddress, borrowerAddress);
    enc.add64(income);
    enc.add16(repaymentScore);
    enc.add64(debt);
    enc.add64(loanAmount);
    const { inputs, attestation } = await enc.encrypt();

    await contract.connect(borrower).applyForLoan(
      inputs[0], inputs[1], inputs[2], inputs[3], attestation
    );

    const result = await contract.connect(borrower).getMyApplication();

    // Decrypt using Relayer SDK
    const pairs = [
      { contractAddress, handle: result[0] },
      { contractAddress, handle: result[1] },
    ];

    const chainId = await borrower.provider.getNetwork().then(n => Number(n.chainId));
    const now = Math.floor(Date.now() / 1000);
    const typedData = await fhevmInstance.createEIP712(chainId, pairs, now, 1);

    const signature = await borrower.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );

    const decryptedMap: Record<string, string> = await fhevmInstance.userDecrypt(signature, pairs);

    const decryptedScore = Number(decryptedMap[result[0]]);
    const decryptedApproved = Number(decryptedMap[result[1]]);

    const expectedScore = income * 2 + repaymentScore * 3 - debt - loanAmount;
    const expectedApproved = expectedScore >= 1000 ? 1 : 0;

    expect(decryptedScore).to.equal(expectedScore);
    expect(decryptedApproved).to.equal(expectedApproved);
  });
});
