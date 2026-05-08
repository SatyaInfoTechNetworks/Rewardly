"use client";
import React, { useState, useEffect } from 'react';
import { Gamepad2, ChevronLeft, Wallet, PlayCircle, Trophy, Zap, Video, ShieldCheck, Share2, MessageSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '@/app/page.module.css';

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

    // Check if AdsGram is enabled
    if (stats && stats.adsgramEnabled === false) {
      console.log("AdsGram disabled, trying Monetag...");
      handlePlayGame();
      return;
    }

    const adsgram = (window as any).AdsgramController;

    if (adsgram) {
      setAdLoading(true);
      adsgram.show().then((result: any) => {
        if (result.done) {
          claimReward();
        } else {
          setAdLoading(false);
          alert("Ad was closed early. No reward earned.");
        }
      }).catch((err: any) => {
        console.error("AdsGram Error, attempting Monetag fallback:", err);
        handlePlayGame();
      });
    } else {
      handlePlayGame();
    }
  };

  const handlePlayGame = () => {
    if (adLoading) return;
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached!");
      return;
    }

    // Check if Monetag is enabled
    if (stats && stats.monetagEnabled === false) {
      setAdLoading(false);
      alert("Ad providers are currently under maintenance. Please try again later.");
      return;
    }

    if ((window as any).show_10977311) {
      setAdLoading(true);
      (window as any).show_10977311().then(() => {
        claimReward();
      }).catch((err: any) => {
        setAdLoading(false);
        alert("Ad failed to load.");
      });
    } else {
      setAdLoading(false);
      alert("Ad provider not ready.");
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
        onReward();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdLoading(false);
    }
  };

  const handleSocialAction = (url: string) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
    // Logic for verifying social tasks would go here
  };

  return (
    <div className={styles.subPageContainer} style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <header className={styles.subPageHeader}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Zap size={24} className={styles.iconIndigo} style={{ color: '#6366f1' }} />
          <h2>Mini Tasks & Games</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <div className={styles.verticalScrollList} style={{ padding: '16px' }}>
        {/* Stats Summary */}
        <div className="card" style={{ padding: '20px', background: 'white', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Daily Tasks Left</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{stats?.remainingPlays || 0}</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Earnings Today</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{stats?.todayPlays * (stats?.rewardPerGame || 5) || 0}</div>
          </div>
        </div>

        {/* Video Tasks Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Video size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Video Tasks</h3>
          </div>
          
          <div className="card" style={{ padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#F0FDF4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: '0 0 2px 0' }}>Watch Premium Ads</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Watch a short video to earn coins instantly</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>+{stats?.rewardPerGame || 5}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Coins</div>
              </div>
            </div>
            <button 
              onClick={handleAdsGram}
              disabled={adLoading || (stats && stats.remainingPlays <= 0)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#6366f1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 700,
                opacity: (adLoading || (stats && stats.remainingPlays <= 0)) ? 0.6 : 1
              }}
            >
              {adLoading ? "Preparing Video..." : "Start Watching"}
            </button>
          </div>
        </div>

        {/* Social Tasks Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Social Tasks</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card" style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#EFF6FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={20} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Follow our Twitter</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Stay updated for bonuses</p>
              </div>
              <button 
                onClick={() => handleSocialAction("https://twitter.com/rewardly")}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Go
              </button>
            </div>

            <div className="card" style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#FEF2F2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Subscribe Channel</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Watch tutorial videos</p>
              </div>
              <button 
                onClick={() => handleSocialAction("https://youtube.com/@rewardly")}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Gaming Section Placeholder */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Gamepad2 size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Mini Games</h3>
          </div>
          <div style={{ padding: '32px', textAlign: 'center', background: '#F1F5F9', borderRadius: '20px', border: '2px dashed #CBD5E1' }}>
            <Gamepad2 size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Games are being verified for rewards.<br/>Coming very soon!</p>
          </div>
        </div>
      </div>

      {adLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000, color: 'white' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div style={{ fontWeight: 600 }}>Preparing Ad Task...</div>
        </div>
      )}
    </div>
  );
};

