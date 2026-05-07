import React, { useEffect, useState } from 'react';
import { Wallet, Clock, History, Star, ChevronRight } from 'lucide-react';
import styles from '@/app/page.module.css';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { RedeemScreen } from './RedeemScreen';

interface WalletScreenProps {
  user: any;
  onUpdateUser: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ user, onUpdateUser }) => {
  const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payouts`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPayoutMethods(data);
        }
      } catch (error) {
        console.error("Failed to fetch payouts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  if (selectedMethod) {
    return (
      <RedeemScreen 
        method={selectedMethod} 
        user={user} 
        onBack={() => setSelectedMethod(null)}
        onSuccess={() => {
          setSelectedMethod(null);
          onUpdateUser();
        }}
      />
    );
  }

  return (
    <div className={styles.walletScreen}>
      {/* Balance Stats Section */}
      <div className={styles.statsSection}>
        <div className={`${styles.balanceCard} card`}>
          <div className={styles.cardLeft}>
            <div className={`${styles.statIconBox} ${styles.blue}`}>
              <Wallet size={24} />
            </div>
            <div className={styles.statLabel}>
              <span>Main Balance</span>
              <h3>Current Earnings</h3>
            </div>
          </div>
          <div className={styles.cardRight}>
            <CoinBadge amount={user?.balance || 0} size="lg" />
          </div>
        </div>

        <div className={`${styles.balanceCard} card`}>
          <div className={styles.cardLeft}>
            <div className={`${styles.statIconBox} ${styles.amber}`}>
              <Clock size={24} />
            </div>
            <div className={styles.statLabel}>
              <span>Pending Balance</span>
              <h3>Under Review</h3>
            </div>
          </div>
          <div className={styles.cardRight}>
            <CoinBadge amount={user?.pendingBalance || 0} size="lg" className={styles.amberBadge} />
          </div>
        </div>

        <button className={styles.historyBtn}>
          <History size={18} />
          <span>Transaction History</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Redeem Rewards Section */}
      <div className={styles.redeemSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Star className={styles.sectionIcon} size={20} />
            <h2>Redeem Rewards</h2>
          </div>
        </div>

        <div className={styles.payoutGrid}>
          {loading ? (
             <div className={styles.loadingBox}>Loading methods...</div>
          ) : payoutMethods.length > 0 ? (
            payoutMethods.map((method) => (
              <div 
                key={method.id} 
                className={`${styles.payoutCard} card`} 
                onClick={() => setSelectedMethod(method)}
              >
                <div className={styles.payoutIcon}>
                  {method.logo_url ? (
                    <img src={method.logo_url} alt={method.name} />
                  ) : (
                    <Star size={32} />
                  )}
                </div>
                <div className={styles.payoutName}>{method.name}</div>
                <div className={styles.payoutBadge}>Fast Payout</div>
              </div>
            ))
          ) : (
            <div className={styles.noDataBox}>No payout methods available</div>
          )}
        </div>
      </div>
    </div>
  );
};
