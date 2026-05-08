"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Gift, Zap, CheckCircle2, Lock, ArrowRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/page.module.css';

interface DailyCheckInScreenProps {
  user: any;
  onBack: () => void;
  onReward: () => void;
}

export const DailyCheckInScreen: React.FC<DailyCheckInScreenProps> = ({ user, onBack, onReward }) => {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (claiming || !status?.canClaim) return;

    setClaiming(true);
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
        setStatus({
          ...status,
          canClaim: false,
          streak: data.newStreak,
          lastCheckIn: new Date().toISOString()
        });
        onReward(); // Sync global balance
      } else {
        const err = await res.json();
        alert(err.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.subPageContainer} style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

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
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Trophy size={80} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: '-10px', bottom: '-10px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '4px' }}>Current Streak</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{status?.streak || 0} Days</div>
          <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px', maxWidth: '180px' }}>
            Check in every day to earn more coins and maintain your streak!
          </p>
        </motion.div>

        {/* 7 Day Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          marginBottom: '32px'
        }}>
          {status?.rewards.map((reward: any) => {
            const isClaimed = reward.day <= (status.streak);
            const isCurrent = reward.day === (status.canClaim ? status.streak + 1 : status.streak);
            const isToday = reward.day === (status.streak + 1) && status.canClaim;

            return (
              <motion.div 
                key={reward.day}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: isClaimed ? '#F0FDF4' : (isToday ? 'white' : '#f1f5f9'),
                  border: isToday ? '2px solid #f59e0b' : (isClaimed ? '1px solid #dcfce7' : '1px solid transparent'),
                  borderRadius: '16px',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: isClaimed ? '#10b981' : '#64748b', textTransform: 'uppercase' }}>Day {reward.day}</div>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: isClaimed ? '#10b981' : (isToday ? '#fef3c7' : '#e2e8f0'), 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isClaimed ? <CheckCircle2 size={18} color="white" /> : <Gift size={18} color={isToday ? '#f59e0b' : '#94a3b8'} />}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>{reward.reward_amount}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Claim Button */}
        <button 
          onClick={handleClaim}
          disabled={claiming || !status?.canClaim}
          style={{ 
            width: '100%', 
            padding: '18px', 
            background: status?.canClaim ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#e2e8f0', 
            color: status?.canClaim ? 'white' : '#94a3b8',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 800,
            border: 'none',
            boxShadow: status?.canClaim ? '0 10px 20px rgba(99, 102, 241, 0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.3s ease'
          }}
        >
          {claiming ? (
            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            status?.canClaim ? (
              <>
                <Zap size={20} />
                <span>Claim Day {status.streak + 1} Reward</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span>Come back tomorrow</span>
              </>
            )
          )}
        </button>

        {/* Info Text */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#64748b' }}>
          <Zap size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', lineHeight: 1.5 }}>
            Don't miss a day! If you miss a day, your streak will reset to Day 1. High rewards are waiting on Day 7.
          </p>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{ 
                background: 'white', 
                borderRadius: '32px', 
                padding: '40px 24px', 
                width: '100%', 
                maxWidth: '340px', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Confetti Animation Placeholder */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #6366f1, #f59e0b, #10b981)' }} />
              
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: '#F0FDF4', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px'
              }}>
                <Gift size={40} color="#10b981" />
              </div>
              
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Awesome!</h3>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
                You have successfully claimed your daily reward of <span style={{ color: '#f59e0b', fontWeight: 800 }}>{earnedAmount} coins</span>.
              </p>
              
              <button 
                onClick={() => setShowSuccess(false)}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: '#1e293b', 
                  color: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
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
