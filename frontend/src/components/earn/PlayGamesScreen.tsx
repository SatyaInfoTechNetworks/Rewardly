"use client";
import React, { useState, useEffect } from 'react';
import { Gamepad2, ChevronLeft, Wallet, PlayCircle, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const handleAdsGram = () => {
    if (adLoading) return;
    
    // Check if limit reached
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached! Please come back tomorrow.");
      return;
    }

    const adsgram = (window as any).AdsgramController;

    if (adsgram) {
      setAdLoading(true);
      adsgram.show().then((result: any) => {
        if (result.done) {
          // Ad completed successfully
          claimReward();
        } else {
          // Ad was closed early
          setAdLoading(false);
          alert("Ad was closed early. No reward earned.");
        }
      }).catch((err: any) => {
        console.error("AdsGram Error, attempting Monetag fallback:", err);
        // FALLBACK TO MONETAG
        if ((window as any).show_10977311) {
          (window as any).show_10977311('pop').then(() => {
            claimReward();
          }).catch((monetagErr: any) => {
            console.error("Monetag Fallback Error:", monetagErr);
            setAdLoading(false);
            alert("Ads could not be loaded. Please try again later.");
          });
        } else {
          setAdLoading(false);
          alert("Ad providers are currently unavailable. Please wait.");
        }
      });
    } else {
      // Fallback if AdsGram is not initialized at all
      console.log("AdsGram not initialized, trying Monetag...");
      handlePlayGame();
    }
  };

  const handlePlayGame = () => {
    if (adLoading) return;
    
    // Check if limit reached
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached! Please come back tomorrow.");
      return;
    }

    // Trigger Monetag Rewarded Interstitial / Popup
    if ((window as any).monetagReady || (window as any).show_10977311) {
      setAdLoading(true);
      (window as any).show_10977311('pop').then(() => {
        // Ad completed successfully
        claimReward();
      }).catch((err: any) => {
        console.error("Ad error:", err);
        setAdLoading(false);
        alert("Ad failed to load or was closed early.");
      });
    } else {
      alert("Ad provider not ready yet. Please wait a moment.");
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
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Left</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{stats?.remainingPlays || 0}</div>
          </div>
        </div>

        {/* Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="section"
          style={{ padding: '0 20px 100px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gamepad2 size={18} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Play Games to Earn</h3>
          </div>

            {/* AdsGram Card */}
            <div className="card" style={{ padding: '24px 20px', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Zap size={32} color="#10b981" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Premium Rewards</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Watch a premium video ad to earn rewards instantly.</p>
              
              <button
                onClick={handleAdsGram}
                disabled={adLoading || (stats && stats.remainingPlays <= 0)}
                className={styles.btnPrimary}
                style={{ 
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  opacity: (adLoading || (stats && stats.remainingPlays <= 0)) ? 0.6 : 1,
                  border: 'none'
                }}
              >
                {adLoading ? 'Loading Ad...' : `Play & Earn 5 Coins`}
              </button>
            </div>

            {/* Monetag Card */}
            <div className="card" style={{ padding: '24px 20px', textAlign: 'center', background: 'white', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Gamepad2 size={32} color="#6366f1" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Monetag Ads</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Watch a quick video and get rewarded instantly.</p>
              
              <button
                onClick={handlePlayGame}
                disabled={adLoading || (stats && stats.remainingPlays <= 0)}
                className={styles.btnPrimary}
                style={{ 
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  opacity: (adLoading || (stats && stats.remainingPlays <= 0)) ? 0.6 : 1,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {adLoading ? 'Loading Ad...' : `Play & Earn 5 Coins`}
              </button>
            </div>
        </motion.div>

        {/* Info Card */}
        <div style={{ background: '#EEF2FF', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '24px' }}>
          <Zap size={20} color="#6366f1" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: '#4338CA', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            Rewards are added instantly after ad completion. For the best experience, ensure you have a stable internet connection.
          </p>
        </div>
      </div>
      {adLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          color: 'white'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)', 
            borderTop: '4px solid white', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <div style={{ fontWeight: 600 }}>Preparing Ads...</div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          ` }} />
        </div>
      )}
    </div>
  );
};
