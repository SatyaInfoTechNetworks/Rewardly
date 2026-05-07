import React, { useState } from 'react';
import { ChevronLeft, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from '@/app/page.module.css';
import { CoinBadge } from '@/components/ui/CoinBadge';

interface RedeemScreenProps {
  method: any;
  user: any;
  onBack: () => void;
  onSuccess: () => void;
}

export const RedeemScreen: React.FC<RedeemScreenProps> = ({ method, user, onBack, onSuccess }) => {
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [inputValues, setInputValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const handleWithdraw = async () => {
    if (!selectedTier) {
      setError('Please select a withdrawal amount');
      return;
    }

    // Validate custom inputs
    for (const field of method.custom_inputs || []) {
      if (!inputValues[field.name]) {
        setError(`Please enter your ${field.name}`);
        return;
      }
    }

    if (user.balance < selectedTier.coins_required) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/payouts/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          method_id: method.id,
          tier_id: selectedTier.id,
          payout_details: JSON.stringify(inputValues)
        })
      });

      if (response.ok) {
        alert("Withdrawal request submitted successfully! It will be reviewed by admin.");
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.redeemScreen}>
      <div className={styles.redeemHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.headerTitle}>
          <img src={method.logo_url} alt={method.name} className={styles.methodLogoSmall} />
          <h2>Redeem {method.name}</h2>
        </div>
      </div>

      <div className={styles.redeemContent}>
        {/* Balance Info */}
        <div className={styles.balanceInfoCard}>
          <div className={styles.balanceLeft}>
            <span>Your Current Balance</span>
            <h3>Available for Payout</h3>
          </div>
          <CoinBadge amount={user.balance} size="lg" />
        </div>

        {/* Method Rules */}
        <div className={styles.rulesGrid}>
          <div className={styles.ruleItem}>
            <Info size={16} />
            <div>
              <span>Conversion</span>
              <p>{method.conversion_rate || '₹1 = 100 Coins'}</p>
            </div>
          </div>
          <div className={styles.ruleItem}>
            <CheckCircle2 size={16} />
            <div>
              <span>Fee</span>
              <p>{method.fee_text || 'No Service Fee'}</p>
            </div>
          </div>
        </div>

        {/* Select Tier Dropdown */}
        <div className={styles.sectionLabel}>Choose Amount</div>
        <div className={styles.inputGroup}>
          <select 
            className={styles.modalInput}
            style={{ width: '100%', cursor: 'pointer' }}
            onChange={(e) => {
              const tierId = parseInt(e.target.value);
              const tier = method.tiers.find((t: any) => t.id === tierId);
              setSelectedTier(tier);
            }}
            value={selectedTier?.id || ''}
          >
            <option value="">Select an amount</option>
            {method.tiers?.map((tier: any) => (
              <option key={tier.id} value={tier.id}>
                {tier.amount_text} ({tier.coins_required.toLocaleString()} Coins)
              </option>
            ))}
          </select>
        </div>

        {/* Custom Inputs */}
        <div className={styles.sectionLabel}>Payout Details</div>
        <div className={styles.inputsContainer}>
          {method.custom_inputs?.map((field: any, idx: number) => (
            <div key={idx} className={styles.inputGroup}>
              <label>{field.name}</label>
              <input 
                type="text"
                placeholder={field.placeholder}
                value={inputValues[field.name] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [field.name]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        {method.disclaimer && (
          <div className={styles.disclaimerBox}>
            <AlertCircle size={16} />
            <p>{method.disclaimer}</p>
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button 
          className={styles.withdrawBtn} 
          disabled={loading || !selectedTier}
          onClick={handleWithdraw}
        >
          {loading ? 'Processing...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
};
