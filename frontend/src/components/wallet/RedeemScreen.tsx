import React, { useState } from 'react';
import { ChevronLeft, Info, AlertCircle, CheckCircle2, ShieldCheck, Clock, Check } from 'lucide-react';
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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [inputValues, setInputValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const handleWithdraw = async () => {
    if (!selectedTier) {
      setError('Please select a withdrawal amount');
      return;
    }

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

  const fixedFee = 400; // Example fixed fee
  const estValue = (user.balance / 100).toFixed(2);

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
        {/* Rich Balance Info */}
        <div className={styles.balanceInfoCardPro}>
          <div className={styles.balanceHeader}>
            <span>Available Balance</span>
            <CoinBadge amount={user.balance} size="lg" />
          </div>
          <div className={styles.balanceValueEst}>
            ≈ ₹{estValue}
          </div>
        </div>

        {/* Custom Selector Trigger */}
        <div className={styles.sectionLabelPro}>CHOOSE AMOUNT</div>
        <button 
          className={styles.selectorTrigger} 
          onClick={() => setIsSelectorOpen(true)}
        >
          {selectedTier ? (
            <div className={styles.selectedContent}>
              <span className={styles.selectedAmount}>{selectedTier.amount_text}</span>
              <span className={styles.selectedCoins}>{selectedTier.coins_required.toLocaleString()} Coins</span>
            </div>
          ) : (
            <span className={styles.selectorPlaceholder}>Select withdrawal amount</span>
          )}
          <ChevronLeft size={20} style={{ transform: 'rotate(-90deg)', color: '#94a3b8' }} />
        </button>

        {/* Custom Inputs */}
        <div className={styles.sectionLabelPro}>PAYOUT DETAILS</div>
        <div className={styles.inputsContainerPro}>
          {method.custom_inputs?.map((field: any, idx: number) => (
            <div key={idx} className={styles.inputGroupPro}>
              <div className={styles.inputLabelRow}>
                <label>{field.name}</label>
                {inputValues[field.name] && <Check size={14} color="#10b981" />}
              </div>
              <input 
                type="text"
                placeholder={field.placeholder}
                value={inputValues[field.name] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [field.name]: e.target.value })}
                className={inputValues[field.name] ? styles.activeInput : ''}
              />
            </div>
          ))}
        </div>

        {/* Transaction Breakdown */}
        {selectedTier && (
          <div className={styles.breakdownCard}>
            <div className={styles.breakdownItem}>
              <span>You Spend</span>
              <span className={styles.spendText}>{selectedTier.coins_required.toLocaleString()} Coins</span>
            </div>
            <div className={styles.breakdownItem}>
              <span>Fixed Fee</span>
              <span className={styles.feeText}>{fixedFee} Coins</span>
            </div>
            <div className={styles.dividerDashed}></div>
            <div className={styles.breakdownItem}>
              <span className={styles.receiveLabel}>You Will Receive</span>
              <span className={styles.receiveValue}>{selectedTier.amount_text}</span>
            </div>
          </div>
        )}

        {/* Trust & Time Indicators */}
        <div className={styles.trustRow}>
          <div className={styles.trustItem}>
            <Clock size={14} />
            <span>Processed within 24h</span>
          </div>
          <div className={styles.trustItem}>
            <ShieldCheck size={14} />
            <span>Secure payout processing</span>
          </div>
        </div>

        {error && <div className={styles.errorMessagePro}>{error}</div>}

        <button 
          className={styles.withdrawBtnPro} 
          disabled={loading || !selectedTier}
          onClick={handleWithdraw}
        >
          {loading ? 'Processing...' : 'Submit Request'}
        </button>

        <p className={styles.manualReviewNote}>
          <Info size={12} />
          Reviewed manually to prevent fraud
        </p>
      </div>

      {/* Custom Bottom Sheet Selector */}
      {isSelectorOpen && (
        <div className={styles.bottomSheetOverlay} onClick={() => setIsSelectorOpen(false)}>
          <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div className={styles.sheetHandle}></div>
              <h3>Select Amount</h3>
            </div>
            <div className={styles.tierList}>
              {method.tiers?.map((tier: any) => (
                <div 
                  key={tier.id} 
                  className={`${styles.tierItem} ${selectedTier?.id === tier.id ? styles.selectedTier : ''}`}
                  onClick={() => {
                    setSelectedTier(tier);
                    setIsSelectorOpen(false);
                    setError('');
                  }}
                >
                  <div className={styles.tierInfo}>
                    <span className={styles.tierAmount}>{tier.amount_text}</span>
                    <span className={styles.tierCoins}>{tier.coins_required.toLocaleString()} Coins</span>
                  </div>
                  {selectedTier?.id === tier.id && <CheckCircle2 size={20} color="#4F46E5" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
