"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Calendar, Gift, Zap, CheckCircle2, Lock, ArrowRight, Trophy, Play, AlertTriangle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/page.module.css';

interface DailyCheckInScreenProps {
  user: any;
  onBack: () => void;
  onReward: () => void;
}

type ClaimState = 'idle' | 'ad_loading' | 'ad_watching' | 'claiming' | 'done';

export const DailyCheckInScreen: React.FC<DailyCheckInScreenProps> = ({ user, onBack, onReward }) => {
  const [loading, setLoading] = useState(true);
  const [claimState, setClaimState] = useState<ClaimState>('idle');
  const [status, setStatus] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [adController, setAdController] = useState<any>(null);
  const [adReady, setAdReady] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  // ─── Fetch streak status ──────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';
      const res = await fetch(`${API_URL}/api/rewards/check-in/status`, {
        headers: { 'x-telegram-init-data': initData },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('[CheckIn Status Error]', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ─── Countdown timer until next claim ────────────────────────────────────
  useEffect(() => {
    if (!status?.nextClaimAt) return;
    const update = () => {
      const diff = new Date(status.nextClaimAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Available now!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [status?.nextClaimAt]);

  // ─── Init AdsGram SDK ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!status?.canClaim) return;

    const initAdsGram = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        const blockId = (window as any).__ADSGRAM_CHECKIN_BLOCK_ID__ || '4376';

        const controller = await (window as any).Adsgram?.init({
          blockId,
          // Pass user id so AdsGram can call back your server with it
          onReward: async () => {
            // AdsGram confirmed the ad; the S2S postback will credit the user.
            // Here we just poll for the updated status.
            console.log('[AdsGram CheckIn] onReward fired — waiting for S2S postback');
          },
          onError: (err: any) => {
            console.error('[AdsGram CheckIn] SDK Error:', err);
            setAdError('Ad not available right now. Try again in a moment.');
            setClaimState('idle');
          },
          onClose: () => {
            console.log('[AdsGram CheckIn] Ad closed');
          }
        });

        setAdController(controller);
        setAdReady(true);
      } catch (e) {
        console.error('[AdsGram CheckIn] Init Error:', e);
        // AdsGram not loaded → fallback to direct claim
        setAdReady(false);
      }
    };

    if ((window as any).Adsgram) {
      initAdsGram();
    } else {
      // AdsGram SDK not loaded (e.g. dev environment) — use direct claim
      setAdReady(false);
    }
  }, [status?.canClaim]);

  // ─── Handle Claim Button ──────────────────────────────────────────────────
  const handleClaim = async () => {
    if (claimState !== 'idle' || !status?.canClaim) return;
    setAdError(null);

    // If AdsGram is ready, show the ad and wait for S2S postback
    if (adReady && adController) {
      setClaimState('ad_watching');
      try {
        await adController.show();
        // Ad shown successfully; poll the backend to confirm the postback landed
        setClaimState('claiming');
        await pollForReward();
      } catch (err: any) {
        console.error('[AdsGram CheckIn] show() failed:', err);
        setAdError('Ad could not be shown. Please try again.');
        setClaimState('idle');
      }
    } else {
      // Fallback: direct claim (no ad required)
      setClaimState('claiming');
      await directClaim();
    }
  };

  // ─── Poll backend after AdsGram ad to confirm S2S postback arrived ────────
  const pollForReward = async () => {
    const maxAttempts = 8; // Poll up to 8 times
    const interval = 2000; // Every 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, interval));
      
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';
      const res = await fetch(`${API_URL}/api/rewards/check-in/status`, {
        headers: { 'x-telegram-init-data': initData },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        // If canClaim flipped to false, the postback has been processed
        if (!data.canClaim && data.streak > (status?.streak || 0)) {
          const rewardForDay = data.rewards?.find((r: any) => r.day === data.streak);
          setEarnedAmount(rewardForDay?.reward_amount || 0);
          setStatus(data);
          setShowSuccess(true);
          setClaimState('done');
          onReward();
          return;
        }
      }
    }

    // Postback didn't land in time → fall back to direct claim
    console.warn('[CheckIn] Postback timed out — falling back to direct claim');
    await directClaim();
  };

  // ─── Direct claim (fallback / development) ────────────────────────────────
  const directClaim = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/rewards/check-in/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ initData })
      });

      if (res.ok) {
        const data = await res.json();
        setEarnedAmount(data.reward);
        setShowSuccess(true);
        setStatus((prev: any) => ({
          ...prev,
          canClaim: false,
          streak: data.newStreak,
          nextDay: data.newStreak,
          lastCheckIn: new Date().toISOString()
        }));
        setClaimState('done');
        onReward();
      } else {
        const err = await res.json();
        setAdError(err.error || 'Failed to claim reward');
        setClaimState('idle');
      }
    } catch (err) {
      console.error('[Direct Claim Error]', err);
      setAdError('Connection error. Please try again.');
      setClaimState('idle');
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getClaimButtonContent = () => {
    switch (claimState) {
      case 'ad_watching':
        return (
          <>
            <div style={spinnerStyle} />
            <span>Showing Ad...</span>
          </>
        );
      case 'claiming':
        return (
          <>
            <div style={spinnerStyle} />
            <span>Confirming Reward...</span>
          </>
        );
      default:
        if (!status?.canClaim) {
          return (
            <>
              <Lock size={18} />
              <span>Come Back Tomorrow</span>
            </>
          );
        }
        if (adReady) {
          return (
            <>
              <Play size={18} fill="currentColor" />
              <span>Watch Ad to Claim Day {status?.nextDay || 1}</span>
            </>
          );
        }
        return (
          <>
            <Zap size={18} />
            <span>Claim Day {status?.nextDay || 1} Reward</span>
          </>
        );
    }
  };

  const isBusy = claimState === 'ad_watching' || claimState === 'claiming';

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.subPageContainer} style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.subPageContainer} style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <header className={styles.subPageHeader}>
        <button onClick={onBack} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Calendar size={24} style={{ color: '#f59e0b' }} />
          <h2>Daily Check-in</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <div className={styles.verticalScrollList} style={{ padding: '20px' }}>

        {/* Streak Reset Warning */}
        {status?.missedDay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.5, margin: 0 }}>
              <strong>Your streak was reset!</strong> You missed a day. Starting fresh from Day 1 — don't miss again!
            </p>
          </motion.div>
        )}

        {/* Streak Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '24px',
            padding: '24px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Trophy size={80} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', right: '-10px', bottom: '-10px' }} />
          <Flame size={20} color="rgba(255,255,255,0.8)" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.85, marginBottom: '4px' }}>Current Streak</div>
          <div style={{ fontSize: '40px', fontWeight: 900, lineHeight: 1 }}>{status?.streak || 0} <span style={{ fontSize: '20px', fontWeight: 600, opacity: 0.8 }}>Days</span></div>
          
          {!status?.canClaim && countdown && (
            <div style={{
              marginTop: '12px',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ⏰ Next claim in: {countdown}
            </div>
          )}
          {status?.canClaim && (
            <div style={{
              marginTop: '12px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 700
            }}>
              🎁 Day {status?.nextDay} reward is ready to claim!
            </div>
          )}
        </motion.div>

        {/* 7-Day Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {status?.rewards?.map((reward: any) => {
            const claimedUpTo = status.streak || 0;
            const isClaimed = reward.day <= claimedUpTo;
            const isNextDay = reward.day === (status?.nextDay || 1);
            const isToday = isNextDay && status?.canClaim;
            const isFuture = !isClaimed && !isToday;

            return (
              <motion.div
                key={reward.day}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reward.day * 0.04 }}
                style={{
                  background: isClaimed ? '#F0FDF4' : isToday ? 'white' : '#f1f5f9',
                  border: isToday
                    ? '2px solid #f59e0b'
                    : isClaimed
                    ? '1.5px solid #bbf7d0'
                    : '1.5px solid transparent',
                  borderRadius: '16px',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  boxShadow: isToday ? '0 4px 12px rgba(245,158,11,0.15)' : 'none',
                  opacity: isFuture && !isNextDay ? 0.6 : 1
                }}
              >
                {/* Day 7 special badge */}
                {reward.day === 7 && (
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-4px',
                    background: '#f59e0b',
                    color: 'white',
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: '6px'
                  }}>BONUS</div>
                )}
                <div style={{ fontSize: '9px', fontWeight: 700, color: isClaimed ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day {reward.day}</div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: isClaimed ? '#10b981' : isToday ? '#fef3c7' : '#e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isClaimed
                    ? <CheckCircle2 size={18} color="white" />
                    : isToday
                    ? <Gift size={18} color="#f59e0b" />
                    : <Gift size={18} color="#94a3b8" />
                  }
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>{reward.reward_amount}</div>
                <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>coins</div>
              </motion.div>
            );
          })}
        </div>

        {/* Error Message */}
        {adError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '13px',
              color: '#991b1b'
            }}
          >
            <AlertTriangle size={16} color="#ef4444" />
            {adError}
          </motion.div>
        )}

        {/* Claim Button */}
        <motion.button
          onClick={handleClaim}
          disabled={isBusy || !status?.canClaim}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            padding: '18px',
            background: status?.canClaim
              ? adReady
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : '#e2e8f0',
            color: status?.canClaim ? 'white' : '#94a3b8',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 800,
            border: 'none',
            boxShadow: status?.canClaim
              ? adReady
                ? '0 10px 25px rgba(245, 158, 11, 0.3)'
                : '0 10px 25px rgba(99, 102, 241, 0.25)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: status?.canClaim && !isBusy ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
        >
          {getClaimButtonContent()}
        </motion.button>

        {/* Info strip */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#64748b' }}>
          <Zap size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
            {adReady
              ? 'Watch a short ad to claim your daily reward. Don\'t miss a day — your streak resets after 48 hours!'
              : 'Check in every day to earn coins. Streak resets if you miss more than 48 hours. Day 7 has a bonus reward!'}
          </p>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '32px',
                padding: '40px 28px',
                width: '100%',
                maxWidth: '340px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #f59e0b, #6366f1, #10b981)' }} />

              {/* Emoji burst */}
              <div style={{ fontSize: '56px', marginBottom: '12px', lineHeight: 1 }}>🎉</div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fef3c7',
                color: '#b45309',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                <Flame size={14} />
                Day {status?.streak} Streak!
              </div>

              <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>You earned it!</h3>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '28px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', display: 'block', lineHeight: 1.2 }}>+{earnedAmount}</span>
                coins added to your balance
              </p>

              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                Continue <ArrowRight size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};

// ─── Shared Styles ─────────────────────────────────────────────────────────
const spinnerStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  border: '3px solid rgba(255,255,255,0.3)',
  borderTopColor: 'white',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  flexShrink: 0
};
