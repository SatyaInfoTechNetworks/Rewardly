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

  const handleGameClick = (game: any) => {
    if (stats && stats.remainingPlays <= 0) {
      alert("Daily limit reached! Please come back tomorrow.");
      return;
    }
    setSelectedGame(game);
    setModalState('instruction');
  };

  const startAdFlow = () => {
    // 1. Show Ad
    const adsgram = (window as any).AdsgramController;
    
    if (adsgram) {
      adsgram.show().then((result: any) => {
        if (result.done) {
          // 2. Show Validating
          setModalState('validating');
          setTimeout(() => {
            // 3. Show Success & Claim
            claimReward();
          }, 2000);
        } else {
          setModalState('none');
          alert("Ad was closed early. No reward earned.");
        }
      }).catch((err: any) => {
        console.error("Ad failed:", err);
        setModalState('none');
        alert("Failed to load ad.");
      });
    } else {
      // Fallback for non-telegram browser testing
      setModalState('validating');
      setTimeout(() => {
        claimReward();
      }, 2000);
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
          <h2 style={{ fontSize: '18px' }}>Play2Reward</h2>
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

        {/* Games Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {GAMES.map((game) => (
            <div 
              key={game.id} 
              className="card" 
              onClick={() => handleGameClick(game)}
              style={{ padding: '16px', textAlign: 'center', background: 'white', position: 'relative' }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{game.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>{game.name}</div>
              <div style={{ background: '#FFFBEB', borderRadius: '20px', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #FEF3C7' }}>
                <div style={{ width: '16px', height: '16px', background: '#F59E0B', borderRadius: '50%' }} />
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#B45309' }}>{game.reward} Coins</span>
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
                  <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>Watch Ad to Play {selectedGame?.name}</h3>
                  <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px', border: '1px solid #FEF3C7' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                       <Info size={16} style={{ color: '#D97706', flexShrink: 0 }} />
                       <span style={{ fontSize: '12px', fontWeight: 600 }}>Instructions:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>Watch the ad completely to unlock the game</li>
                      <li>⚠️ You must play the game for at least 30 seconds. Exiting early will cancel your reward.</li>
                    </ul>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>⚡ Ad duration: ~15-30 seconds</div>
                  <button 
                    onClick={startAdFlow}
                    style={{ width: '100%', padding: '14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🎬 Watch Ad & Play
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


