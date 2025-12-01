interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  account: string | null;
}

export default function Navigation({ currentPage, onPageChange, account }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'apply', label: 'Apply for Loan', icon: '💼' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
    { id: 'status', label: 'My Status', icon: '📋' },
  ];

  return (
    <nav className="bg-[var(--bg-card)] backdrop-blur-md border-b border-[var(--border-gold)]/30 sticky top-0 z-50 shadow-[0_2px_10px_var(--accent-gold-glow)]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--border-gold)] rounded-lg flex items-center justify-center shadow-[0_0_10px_var(--accent-gold-glow)]">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <div className="text-[var(--text-gold)] font-bold text-lg">Confidential Lending</div>
              <div className="text-[var(--text-muted)] text-xs">Encrypted Micro-Lending Engine</div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-[var(--border-gold)] text-black shadow-[0_0_10px_var(--accent-gold-glow)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-gold)] hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-gold)]/30'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Wallet Status */}
          <div className="flex items-center gap-3">
            {account ? (
              <div className="px-4 py-2 bg-[var(--bg-card-hover)] border border-[var(--border-gold)]/30 rounded-lg shadow-[0_0_5px_var(--accent-gold-glow)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--border-gold)] rounded-full animate-pulse"></div>
                  <span className="text-[var(--text-gold)] font-mono text-sm">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2 bg-[var(--bg-card-hover)] border border-[var(--border-gold)]/30 rounded-lg">
                <span className="text-[var(--text-muted)] text-sm">Not Connected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

