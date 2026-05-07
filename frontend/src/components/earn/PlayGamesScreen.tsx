"use client";
import React, { useState, useEffect } from 'react';
import { Gamepad2, ChevronLeft, Wallet, PlayCircle, Trophy, Zap } from 'lucide-react';
import styles from '@/app/page.module.css';
import { CoinBadge } from '@/components/ui/CoinBadge';

interface PlayGamesScreenProps {
  user: any;
  onBack: () => void;
  onReward: () => void;
}

export const PlayGamesScreen: React.FC<PlayGamesScreenProps> = ({ user, onBack, onReward }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adLoading, setAdLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/games/stats`, {
        headers: { 'x-telegram-init-data': initData },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = () => {
    if (adLoading) return;
    
    // Check if limit reached
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached! Please come back tomorrow.");
      return;
    }

    setAdLoading(true);

    // Trigger Monetag Rewarded Interstitial
    if ((window as any).show_9827842) {
      (window as any).show_9827842().then(() => {
        // Ad completed successfully
        claimReward();
      }).catch((err: any) => {
        console.error("Ad error:", err);
        setAdLoading(false);
        alert("Ad failed to load. Please try again later.");
      });
    } else {
      setAdLoading(false);
      alert("Ad provider not ready. Please refresh the app.");
    }
  };

  const claimReward = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/games/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ initData })
      });

      if (res.ok) {
        const data = await res.json();
        setStats({
          ...stats,
          balance: data.newBalance,
          todayPlays: data.todayPlays,
          remainingPlays: data.remainingPlays
        });
        alert(`🎉 You earned ${data.reward} coins!`);
        onReward(); // Sync global balance
      } else {
        const err = await res.json();
        alert(err.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error while claiming reward");
    } finally {
      setAdLoading(false);
    }
  };

  return (
    <div className={styles.subPageContainer} style={{ background: '#F5F7FF', minHeight: '100vh' }}>
      <header className={styles.subPageHeader}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Gamepad2 size={24} className={styles.iconIndigo} style={{ color: '#6366f1' }} />
          <h2>Play & Earn</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <div className={styles.verticalScrollList} style={{ padding: '20px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Balance</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{stats?.balance || user?.balance || 0}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Today</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{stats?.todayPlays || 0}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Remaining</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{stats?.remainingPlays || 0}</div>
          </div>
        </div>

        {/* Play Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PlayCircle size={22} color="#6366f1" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Play Games to Earn</h3>
          </div>

          <div className="card" style={{ padding: '32px 20px', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Gamepad2 size={40} color="#6366f1" />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Test Your Luck!</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
              Watch a quick video ad to claim your 5 coins. You can play up to {stats?.limit || 20} times daily!
            </p>

            <button 
              className={styles.btnPrimary} 
              style={{ width: '100%', padding: '16px', fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
              onClick={handlePlayGame}
              disabled={adLoading || loading}
            >
              {adLoading ? 'Ad is Loading...' : 'Play & Earn 5 Coins'}
            </button>
          </div>
        </section>

        {/* Info Card */}
        <div style={{ background: '#EEF2FF', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '24px' }}>
          <Zap size={20} color="#6366f1" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: '#4338CA', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            Rewards are added instantly after ad completion. For the best experience, ensure you have a stable internet connection.
          </p>
        </div>
      </div>
    </div>
  );
};
