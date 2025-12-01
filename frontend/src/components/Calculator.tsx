import { useState, useEffect } from 'react';

interface CalculatorProps {
  onCalculate?: (values: {
    income: number;
    repaymentScore: number;
    debt: number;
    loanAmount: number;
    riskScore: number;
    approved: boolean;
  }) => void;
}

export default function Calculator({ onCalculate }: CalculatorProps) {
  const [income, setIncome] = useState('');
  const [repaymentScore, setRepaymentScore] = useState('');
  const [debt, setDebt] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const MIN_SCORE_FOR_APPROVAL = 1000;

  // Auto-calculate when values change
  useEffect(() => {
    if (income && repaymentScore && debt && loanAmount) {
      const incomeNum = parseInt(income) || 0;
      const scoreNum = parseInt(repaymentScore) || 0;
      const debtNum = parseInt(debt) || 0;
      const loanNum = parseInt(loanAmount) || 0;

      // Risk Score Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
      const calculatedScore = (incomeNum * 2) + (scoreNum * 3) - debtNum - loanNum;
      const isApproved = calculatedScore >= MIN_SCORE_FOR_APPROVAL;

      setRiskScore(calculatedScore);
      setApproved(isApproved);

      if (onCalculate) {
        onCalculate({
          income: incomeNum,
          repaymentScore: scoreNum,
          debt: debtNum,
          loanAmount: loanNum,
          riskScore: calculatedScore,
          approved: isApproved,
        });
      }
    } else {
      setRiskScore(null);
      setApproved(null);
    }
  }, [income, repaymentScore, debt, loanAmount, onCalculate]);

  const resetForm = () => {
    setIncome('');
    setRepaymentScore('');
    setDebt('');
    setLoanAmount('');
    setRiskScore(null);
    setApproved(null);
  };

  return (
    <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-[var(--text-gold)] tracking-wide mb-2">Loan Eligibility Calculator</h2>
        <p className="text-[var(--text-muted)] text-sm">
          Calculate your risk score and eligibility before applying. All calculations are done locally in your browser.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-gold)] mb-2">
              Monthly Income ($)
              <span className="ml-2 text-xs text-[var(--text-muted)]">Your total monthly income</span>
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              min="0"
              className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
              placeholder="e.g., 5000"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Recommended: $3,000+ for better approval chances</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-gold)] mb-2">
              Repayment Score (0-100)
              <span className="ml-2 text-xs text-[var(--text-muted)]">Your credit/repayment history score</span>
            </label>
            <input
              type="number"
              value={repaymentScore}
              onChange={(e) => setRepaymentScore(e.target.value)}
              min="0"
              max="100"
              className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
              placeholder="e.g., 75"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Recommended: 70+ for better approval chances</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-gold)] mb-2">
              Outstanding Debt ($)
              <span className="ml-2 text-xs text-[var(--text-muted)]">Total current debt obligations</span>
            </label>
            <input
              type="number"
              value={debt}
              onChange={(e) => setDebt(e.target.value)}
              min="0"
              className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
              placeholder="e.g., 1000"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Lower debt improves your risk score</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-gold)] mb-2">
              Requested Loan Amount ($)
              <span className="ml-2 text-xs text-[var(--text-muted)]">Amount you want to borrow</span>
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              min="0"
              className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
              placeholder="e.g., 2000"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Smaller loans have better approval rates</p>
          </div>

          <button
            onClick={resetForm}
            className="w-full bg-[var(--border-gold)] text-black font-semibold rounded-lg px-5 py-3 shadow-[0_0_10px_var(--accent-gold-glow)] hover:brightness-110 transition-all duration-200"
          >
            Reset Calculator
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] p-6">
            <div className="text-sm font-semibold text-[var(--text-gold)] mb-2 uppercase tracking-wide">Risk Score</div>
            {riskScore !== null ? (
              <>
                <div className="text-6xl font-mono font-bold text-[var(--text-gold)] mb-2">{riskScore}</div>
                <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-3 py-2 rounded-lg border border-[var(--border-gold)]/30">
                  Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold text-[var(--text-muted)]">---</div>
            )}
          </div>

          <div className={`rounded-xl p-6 border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] ${
            approved === null 
              ? 'border-[var(--text-muted)]/30' 
              : approved 
                ? '' 
                : 'border-red-500/50'
          }`}>
            <div className="text-sm font-semibold text-[var(--text-gold)] mb-2 uppercase tracking-wide">Eligibility Status</div>
            {approved !== null ? (
              <>
                <div className={`text-4xl font-bold mb-2 ${approved ? 'text-[var(--text-gold)]' : 'text-red-400'}`}>
                  {approved ? '✓ Approved' : '✗ Rejected'}
                </div>
                <div className="text-sm text-[var(--text-light)] mt-2">
                  {approved ? (
                    <span className="text-[var(--text-gold)]">🎉 Your risk score meets the minimum threshold of {MIN_SCORE_FOR_APPROVAL}!</span>
                  ) : (
                    <span className="text-red-300">Your risk score ({riskScore}) is below the minimum threshold of {MIN_SCORE_FOR_APPROVAL}.</span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-[var(--text-muted)]">---</div>
            )}
          </div>

          {/* Qualification Criteria */}
          <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] p-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-left flex items-center justify-between text-[var(--text-gold)] font-semibold hover:brightness-110 transition-all bg-[var(--bg-card-hover)] px-4 py-3 rounded-lg border border-[var(--border-gold)]/30"
            >
              <span>📚 Qualification Criteria</span>
              <span className="text-[var(--text-gold)]">{showDetails ? '▼' : '▶'}</span>
            </button>
            {showDetails && (
              <div className="mt-4 space-y-3 text-sm text-[var(--text-light)]">
                <div>
                  <strong className="text-[var(--text-gold)]">Minimum Risk Score:</strong> {MIN_SCORE_FOR_APPROVAL}
                </div>
                <div>
                  <strong className="text-[var(--text-gold)]">Recommended Income:</strong> $3,000+ per month
                </div>
                <div>
                  <strong className="text-[var(--text-gold)]">Recommended Repayment Score:</strong> 70+ out of 100
                </div>
                <div>
                  <strong className="text-[var(--text-gold)]">Debt-to-Income Ratio:</strong> Keep below 40%
                </div>
                <div className="pt-2 border-t border-[var(--border-gold)]/20">
                  <strong className="text-[var(--text-gold)]">Tips to Improve Eligibility:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Increase your monthly income</li>
                    <li>Improve your repayment score</li>
                    <li>Reduce outstanding debt</li>
                    <li>Request a smaller loan amount</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

