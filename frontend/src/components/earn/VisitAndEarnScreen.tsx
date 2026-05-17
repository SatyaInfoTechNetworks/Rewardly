"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Globe, ExternalLink, Timer, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '@/app/page.module.css';

interface VisitAndEarnScreenProps {
  user: any;
  onBack: () => void;
  onReward: () => void;
}

export const VisitAndEarnScreen: React.FC<VisitAndEarnScreenProps> = ({ user, onBack, onReward }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitingTask, setVisitingTask] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/rewards/visit/tasks`, {
        headers: { 'x-telegram-init-data': initData },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setCompletedIds(data.completedIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [showAdModal, setShowAdModal] = useState(false);
  const [modalTask, setModalTask] = useState<any>(null);
  const [adCompleted, setAdCompleted] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleVisit = (task: any) => {
    if (completedIds.includes(task.id)) return;
    setModalTask(task);
    setAdCompleted(false);
    setIsAdLoading(false);
    setShowAdModal(true);
  };

  const startAdPlayback = async () => {
    if (!modalTask) return;
    setIsAdLoading(true);

    const rawBlockId = (window as any).__ADSGRAM_VISIT_BLOCK_ID__ || '30395';
    const blockId = `int-${rawBlockId.toString().replace(/\D/g, '')}`;

    if ((window as any).Adsgram) {
      try {
        const controller = await (window as any).Adsgram.init({ blockId });
        controller.show().then(() => {
          // Ad played successfully
          setAdCompleted(true);
          setIsAdLoading(false);
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }).catch((err: any) => {
          console.error('[AdsGram Interstitial Show Error]', err);
          alert("⚠️ You must watch the complete ad to unlock the visit link.");
          setIsAdLoading(false);
        });
      } catch (err) {
        console.error('[AdsGram Interstitial Init Error]', err);
        alert("⚠️ Failed to load ad. Please try again.");
        setIsAdLoading(false);
      }
    } else {
      // Dev / Simulated Ad
      console.log('🎬 [Mock Interstitial Ad Playing]');
      setTimeout(() => {
        setAdCompleted(true);
        setIsAdLoading(false);
      }, 2000); // 2 second simulated ad
    }
  };

  const completeTaskAndRedirect = () => {
    if (!modalTask) return;

    const task = modalTask;
    setVisitingTask(task);
    setTimeLeft(task.timer_seconds);
    setTimerStarted(true);

    // Close Modal
    setShowAdModal(false);
    setModalTask(null);

    // Redirect to URL (Synchronous User Click Event -> Bypass sandbox block!)
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openLink(task.url);
    } else {
      window.open(task.url, '_blank');
    }
  };

  useEffect(() => {
    if (visitingTask && timerStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (visitingTask && timerStarted && timeLeft === 0) {
      claimReward(visitingTask.id);
    }
  }, [visitingTask, timerStarted, timeLeft]);

  const claimReward = async (taskId: number) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/rewards/visit/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ initData, taskId })
      });

      if (res.ok) {
        setCompletedIds([...completedIds, taskId]);
        onReward();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVisitingTask(null);
      setTimerStarted(false);
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
          <Globe size={24} style={{ color: '#3b82f6' }} />
          <h2>Visit & Earn</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <div className={styles.verticalScrollList} style={{ padding: '20px' }}>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          padding: '16px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          color: '#1d4ed8'
        }}>
          <Timer size={20} style={{ marginTop: '2px' }} />
          <p style={{ fontSize: '12px', fontWeight: 500 }}>
            Click "Visit" and stay on the page until the timer finishes to claim your coins.
          </p>
        </div>

        {tasks.filter(t => !completedIds.includes(t.id)).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>All Done!</h3>
            <p style={{ fontSize: '14px' }}>You have completed all available visit tasks. Check back later for more!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.filter(t => !completedIds.includes(t.id)).map((task) => {
              const isCurrent = visitingTask?.id === task.id;

              return (
                <motion.div 
                  key={task.id}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    border: isCurrent ? '2px solid #3b82f6' : '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#EFF6FF', 
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6'
                  }}>
                    <Globe size={24} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>{task.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>{task.reward_amount} Coins</div>
                       <span style={{ color: '#cbd5e1' }}>•</span>
                       <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Timer size={12} /> {task.timer_seconds}s
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleVisit(task)}
                    disabled={!!visitingTask}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      background: isCurrent ? '#3b82f6' : '#1e293b',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isCurrent ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        {timerStarted ? `${timeLeft}s` : 'Ad...'}
                      </span>
                    ) : (
                      'Visit'
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showAdModal && modalTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '360px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Close Button */}
            {!isAdLoading && (
              <button 
                onClick={() => {
                  setShowAdModal(false);
                  setModalTask(null);
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            )}

            {!adCompleted ? (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  marginBottom: '20px',
                }}>
                  <Zap size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Watch Ad to Visit</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                  To complete this task, you need to watch a short sponsored ad. Click below to start the ad!
                </p>
                <button
                  onClick={startAdPlayback}
                  disabled={isAdLoading}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    background: isAdLoading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {isAdLoading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Preparing Ad...
                    </>
                  ) : (
                    '🎬 Watch Ad & Visit'
                  )}
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  marginBottom: '20px',
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Ad Completed! 🎉</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                  Sponsored ad verified successfully! Click below to visit the link and earn your <b>{modalTask.reward_amount} coins</b>. Keep the website open for <b>{modalTask.timer_seconds}s</b>.
                </p>
                <button
                  onClick={completeTaskAndRedirect}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Go to Link
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};
