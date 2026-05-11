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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<'earnings' | 'redeems'>('earnings');
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payoutRes, transRes] = await Promise.all([
          fetch(`${API_URL}/api/payouts`, { credentials: 'include' }),
          fetch(`${API_URL}/api/user/transactions`, { 
            headers: { 'x-telegram-init-data': (window as any).Telegram?.WebApp?.initData || '' }
          })
        ]);

        if (payoutRes.ok) setPayoutMethods(await payoutRes.json());
        if (transRes.ok) setTransactions(await transRes.json());
      } catch (error) {
        console.error("Failed to fetch wallet data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Filter transactions based on tab
  const filteredTransactions = transactions.filter(t => {
    if (historyTab === 'redeems') return t.type === 'payout' || t.type === 'withdrawal';
    return t.type !== 'payout' && t.type !== 'withdrawal';
  });

  if (showHistory) {
    return (
      <div className={styles.walletScreen}>
        <div className={styles.historyHeader}>
          <button onClick={() => setShowHistory(false)} className={styles.backBtn}>
             <ChevronRight style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h2>Transaction History</h2>
        </div>

        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabBtn} ${historyTab === 'earnings' ? styles.activeTab : ''}`}
            onClick={() => setHistoryTab('earnings')}
          >
            Earnings
          </button>
          <button 
            className={`${styles.tabBtn} ${historyTab === 'redeems' ? styles.activeTab : ''}`}
            onClick={() => setHistoryTab('redeems')}
          >
            Redeems
          </button>
        </div>

        <div className={styles.historyList}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <div key={t.id} className={`${styles.historyCard} card`}>
                <div className={styles.historyLeft}>
                  <div className={`${styles.historyIcon} ${t.amount > 0 ? styles.plus : styles.minus}`}>
                    {t.type === 'payout' ? <Star size={18} /> : <History size={18} />}
                  </div>
                  <div className={styles.historyInfo}>
                    <h4>{t.description || t.type}</h4>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.historyRight}>
                  <CoinBadge amount={t.amount} size="sm" showPlus={t.amount > 0} />
                  <span className={`${styles.statusBadge} ${styles[t.status]}`}>{t.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noDataBox}>No {historyTab} found</div>
          )}
        </div>
      </div>
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

        <button className={styles.historyBtn} onClick={() => setShowHistory(true)}>
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
