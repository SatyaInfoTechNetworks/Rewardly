"use client";

import React, { useState, useEffect } from 'react';
import { FlappyGame } from './flappy/FlappyGame';
import { ChevronLeft, Trophy, Clock } from 'lucide-react';
import { analytics } from '@/modules/analytics/tracker';
import styles from './GameModuleView.module.css';

interface GameModuleViewProps {
  user: any;
  contest?: any;
  gameSlug: string;
  onBack: () => void;
  onScoreSubmitted?: () => void;
}

export function GameModuleView({ user, contest, gameSlug, onBack, onScoreSubmitted }: GameModuleViewProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    startSession();
  }, [gameSlug, contest?.id]);

  const startSession = async () => {
    try {
      setLoading(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/game-system/${gameSlug}/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ contest_id: contest?.id }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data);
        
        // Track Game Start
        analytics.track(analytics.events.GAME.STARTED, {
          game_slug: gameSlug,
          contest_id: contest?.id,
          session_id: data.id
        });

        // We could fetch game config here if needed
        setGameConfig({
            gravity: 0.25,
            jumpForce: -5,
            pipeSpeed: 2,
            pipeGap: 120
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameOver = async (score: number) => {
    if (!session) return;

    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      await fetch(`${API_URL}/api/game-system/sessions/${session.id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ 
          score, 
          duration: 30, // Mock duration for now
          metadata: { device: 'web_tg' } 
        }),
        credentials: 'include'
      });

      // Track Score Submission
      analytics.track(analytics.events.GAME.SCORE_SUBMITTED, {
        game_slug: gameSlug,
        score,
        contest_id: contest?.id,
        session_id: session.id
      });

      if (onScoreSubmitted) onScoreSubmitted();
    } catch (err) {
      console.error("Score submission error:", err);
    }
  };

  const renderGame = () => {
    switch (gameSlug) {
      case 'flappy-bird':
        return <FlappyGame onGameOver={handleGameOver} config={gameConfig} />;
      default:
        return <div>Game not found</div>;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.titleInfo}>
          <h2>{contest ? contest.name : 'Practice Mode'}</h2>
          {contest && <p>Win {contest.prize_pool} Coins</p>}
        </div>
      </header>

      <div className={styles.gameWrapper}>
        {loading ? (
          <div className={styles.loader}>Preparing Game Engine...</div>
        ) : (
          renderGame()
        )}
      </div>

      {contest && (
        <div className={styles.contestStats}>
          <div className={styles.stat}>
            <Trophy size={16} />
            <span>Best: {contest.userEntry?.score || 0}</span>
          </div>
          <div className={styles.stat}>
            <Clock size={16} />
            <span>Ends in 2d</span>
          </div>
        </div>
      )}
    </div>
  );
}
