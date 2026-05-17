"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, Coins, Info, Play, CheckCircle2, Clock, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/page.module.css';

interface PlayGamesScreenProps {
  user: any;
  onBack: () => void;
  onReward: () => void;
}

const GAMES = [
  { id: 'knife', name: 'Knife Dash', reward: 5, icon: '🗡️' },
  { id: 'space', name: 'Space Invader', reward: 5, icon: '🚀' },
  { id: 'climb', name: 'Hill Climb', reward: 5, icon: '🚗' },
  { id: 'fusion', name: 'Fusion Block', reward: 5, icon: '🧩' },
  { id: 'fruit', name: 'Fruit Ninja', reward: 5, icon: '🍉' },
  { id: 'tower', name: 'High Tower', reward: 5, icon: '🏰' },
];

export const PlayGamesScreen: React.FC<PlayGamesScreenProps> = ({ user, onBack, onReward }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<'none' | 'instruction' | 'validating' | 'success'>('none');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [activeCooldown, setActiveCooldown] = useState<number>(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeCooldown <= 0) return;
    const timer = setInterval(() => {
      setActiveCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCooldown]);

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
        if (data.cooldownRemaining > 0) {
          setActiveCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (game: any) => {
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached! Please come back tomorrow.");
      return;
    }
    setSelectedGame(game);
    setModalState('instruction');
  };

  const startAdFlow = async () => {
    // 0. Respect Admin Panel Settings
    if (stats && stats.adsgramEnabled === false && stats.monetagEnabled === false) {
      setModalState('none');
      alert("Ads are currently disabled by Admin. Please check back later!");
      return;
    }

    // 1. Show Ad
    const blockId = stats?.adsgramBlockId || (window as any).__ADSGRAM_GAME_BLOCK_ID__ || '4376';
    if ((window as any).Adsgram) {
      try {
        setModalState('validating');
        const controller = await (window as any).Adsgram.init({
          blockId,
          onReward: async () => {
            console.log('[AdsGram Game] onReward callback success');
          },
          onError: (err: any) => {
            console.error('[AdsGram Game] SDK error:', err);
            setModalState('none');
            alert("❌ Ad is not available right now or was closed early. No reward credited.");
          }
        });
        
        await controller.show();
        // Wait 1.5s to let S2S register before claiming
        setTimeout(() => {
          claimReward();
        }, 1500);
      } catch (err) {
        console.error('[AdsGram Game Error]', err);
        setModalState('none');
        alert("❌ Failed to play ad.");
      }
    } else {
      // Fallback for non-telegram browser testing in dev mode only
      const isDev = process.env.NODE_ENV !== 'production';
      const isTelegram = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData;
      if (isDev && !isTelegram) {
        triggerFallbackClaim();
      } else {
        setModalState('none');
        alert("❌ Ads are only available inside Telegram Mini App.");
      }
    }
  };

  const triggerFallbackClaim = () => {
    setModalState('validating');
    setTimeout(() => {
      claimReward();
    }, 2000);
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
        if (data.cooldownRemaining > 0) {
          setActiveCooldown(data.cooldownRemaining);
        }
        setModalState('success');
        onReward();
      }
    } catch (err) {
      console.error(err);
      setModalState('none');
    }
  };

  return (
    <div className={styles.subPageContainer} style={{ background: '#F0F4FF', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className={styles.subPageHeader} style={{ background: '#F0F4FF', border: 'none' }}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <h2 style={{ fontSize: '18px' }}>Watch & Earn</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <div style={{ padding: '0 16px' }}>
        {/* Top Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>YOUR BALANCE</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
               <div style={{ width: '20px', height: '20px', background: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>💰</div>
               <span style={{ fontWeight: 800 }}>{user?.balance || 0}</span>
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>PLAYS TODAY</div>
            <div style={{ fontWeight: 800, color: '#6366f1' }}>{stats?.todayPlays || 0}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>REMAINING</div>
            <div style={{ fontWeight: 800, color: '#10b981' }}>{stats?.remainingPlays || 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <Gamepad2 size={24} />
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Play Games To Earn</h3>
        </div>

        {/* Video Tasks Section */}
        <div style={{ marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#F0FDF4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: '0 0 2px 0' }}>Watch Ads</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Watch a short video to earn coins instantly</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>+{stats?.rewardPerGame || 5}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Coins</div>
              </div>
            </div>
            <button 
              onClick={() => {
                if (activeCooldown > 0) return;
                setSelectedGame({ name: 'Video Task' });
                setModalState('instruction');
              }}
              disabled={loading || activeCooldown > 0 || (stats && stats.remainingPlays <= 0)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: activeCooldown > 0 ? '#64748b' : '#4F46E5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 700,
                cursor: (loading || activeCooldown > 0 || (stats && stats.remainingPlays <= 0)) ? 'not-allowed' : 'pointer',
                opacity: (loading || (stats && stats.remainingPlays <= 0)) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {activeCooldown > 0 ? (
                <>
                  <Clock size={16} />
                  <span>Next Ad in {activeCooldown}s</span>
                </>
              ) : (
                <span>Start Watching</span>
              )}
            </button>
          </div>
        </div>

        {/* Games Grid - Commented out/Coming Soon as requested */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: 0.7 }}>
          {GAMES.map((game) => (
            <div 
              key={game.id} 
              className="card" 
              style={{ padding: '16px', textAlign: 'center', background: 'white', position: 'relative', cursor: 'not-allowed' }}
            >
              {/* Coming Soon Overlay */}
              <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#4F46E5', color: 'white', fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>SOON</div>
              
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{game.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>{game.name}</div>
              <div style={{ background: '#f1f5f9', borderRadius: '20px', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#64748b' }}>{game.reward} Coins</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalState !== 'none' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card" 
              style={{ background: 'white', width: '100%', maxWidth: '340px', padding: '24px', textAlign: 'center' }}
            >
              {modalState === 'instruction' && (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎬</div>
                  <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>
                    {selectedGame?.name === 'Video Task' ? 'Watch Ad to Earn Coins' : `Watch Ad to Play ${selectedGame?.name}`}
                  </h3>
                  <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px', border: '1px solid #FEF3C7' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                       <Info size={16} style={{ color: '#D97706', flexShrink: 0 }} />
                       <span style={{ fontSize: '12px', fontWeight: 600 }}>Instructions:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedGame?.name === 'Video Task' ? (
                        <>
                          <li>Watch the ad completely to claim your daily coins</li>
                          <li>Closing the ad early will cancel your reward.</li>
                        </>
                      ) : (
                        <>
                          <li>Watch the ad completely to unlock the game</li>
                          <li>⚠️ You must play the game for at least 30 seconds. Exiting early will cancel your reward.</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>⚡ Ad duration: ~15-30 seconds</div>
                  <button 
                    onClick={startAdFlow}
                    style={{ width: '100%', padding: '14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🎬 {selectedGame?.name === 'Video Task' ? 'Watch Ad & Claim' : 'Watch Ad & Play'}
                  </button>
                </>
              )}

              {modalState === 'validating' && (
                <>
                  <div style={{ width: '60px', height: '60px', border: '4px solid #f3f4f6', borderTop: '4px solid #4F46E5', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                  <h3 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Validating...</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Please wait while we verify your task.</p>
                </>
              )}

              {modalState === 'success' && (
                <>
                  <div style={{ fontSize: '50px', marginBottom: '16px' }}>🎉</div>
                  {selectedGame?.name === 'Video Task' ? (
                    <>
                      <h3 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Reward Earned!</h3>
                      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                        You watched the video completely and earned <b>+{stats?.rewardPerGame || 5} Coins</b>!
                      </p>
                      <button 
                        onClick={() => setModalState('none')}
                        style={{ width: '100%', padding: '14px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800 }}
                      >
                        Great!
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '16px' }}>Ad Watched 🎉</h3>
                      <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', border: '1px solid #FEF3C7' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                           <Info size={16} style={{ color: '#D97706' }} />
                           <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>Do not close the game window for 30 seconds.</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setModalState('none');
                          // Here you would normally launch the game URL
                          alert("Opening game: " + selectedGame?.name);
                        }}
                        style={{ width: '100%', padding: '14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        ▶️ Play Game Now
                      </button>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


