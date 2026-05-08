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

  const handleVisit = (task: any) => {
    if (completedIds.includes(task.id)) return;

    setVisitingTask(task);
    setTimeLeft(task.timer_seconds);
    
    // Open URL
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openLink(task.url);
    } else {
      window.open(task.url, '_blank');
    }
  };

  useEffect(() => {
    if (visitingTask && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (visitingTask && timeLeft === 0) {
      claimReward(visitingTask.id);
    }
  }, [visitingTask, timeLeft]);

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
                        {timeLeft}s
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};
