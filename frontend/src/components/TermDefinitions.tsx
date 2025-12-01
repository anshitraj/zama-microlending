interface TermDefinitionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermDefinitions({ isOpen, onClose }: TermDefinitionsProps) {
  const terms = [
    {
      term: 'Monthly Income',
      definition: 'Your total monthly income from all sources including salary, freelance work, investments, and other regular income streams.',
      recommended: '$3,000+ per month for better approval chances',
    },
    {
      term: 'Repayment Score',
      definition: 'A score from 0-100 that reflects your creditworthiness and history of repaying debts. Based on your past loan repayments, credit history, and financial behavior.',
      recommended: '70+ out of 100 for better approval chances',
    },
    {
      term: 'Outstanding Debt',
      definition: 'The total amount of money you currently owe across all loans, credit cards, and other debt obligations.',
      recommended: 'Keep debt-to-income ratio below 40%',
    },
    {
      term: 'Requested Loan Amount',
      definition: 'The amount of money you want to borrow. Smaller loan amounts generally have better approval rates.',
      recommended: 'Request only what you need',
    },
    {
      term: 'Risk Score',
      definition: 'A calculated score that determines your loan eligibility. Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount',
      recommended: 'Minimum score of 1,000 required for approval',
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_25px_var(--accent-gold-glow)] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-gold)]/30 p-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[var(--text-gold)] tracking-wide">📖 Term Definitions</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card-hover)] text-[var(--text-gold)] hover:bg-[var(--border-gold)] hover:text-black transition-all duration-200 flex items-center justify-center font-bold text-lg"
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {terms.map((item, index) => (
              <div key={index} className="rounded-lg border border-[var(--border-gold)]/30 bg-[var(--bg-card-hover)] p-4 shadow-[0_0_5px_var(--accent-gold-glow)]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-[var(--text-gold)] font-semibold">{item.term}</h4>
                </div>
                <p className="text-[var(--text-light)] text-sm mb-2">{item.definition}</p>
                <div className="text-xs text-[var(--text-gold)] bg-[var(--bg-card)] px-2 py-1 rounded inline-block border border-[var(--border-gold)]/30">
                  💡 {item.recommended}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

