"use client";

import { useState, useEffect } from "react";
import styles from "./ContestScreen.module.css";
import { Trophy, Clock, ChevronLeft, Award, TrendingUp, Info, Users } from "lucide-react";

interface Contest {
  id: number;
  name: string;
  slug: string;
  type: 'earning' | 'referral' | 'streak';
  banner_url?: string;
  status: 'upcoming' | 'active' | 'ended';
  start_time: string;
  end_time: string;
  description?: string;
  rules?: string;
  prize_pool_text: string;
  rewards?: any[];
}

interface ContestScreenProps {
  user: any;
}

export function ContestScreen({ user }: ContestScreenProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/contests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setContests(data);
      }
    } catch (err) {
      setError("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const fetchContestDetail = async (slug: string) => {
    try {
      setLoading(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/contests/${slug}`, {
        headers: { 'x-telegram-init-data': initData },
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedContest(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h remaining`;
  };

  if (selectedContest) {
    const { contest, leaderboard, userEntry } = selectedContest;
    
    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => setSelectedContest(null)}>
          <ChevronLeft size={20} />
          Back to Contests
        </button>

        <div className={styles.heroCard}>
          <div className={styles.cardGlow} />
          <h2 className={styles.heroTitle}>{contest.name}</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className={styles.heroTimer}>
              <Clock size={14} />
              {formatTimeLeft(contest.end_time)}
            </div>
            <div className={styles.heroTimer} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              <Trophy size={14} />
              {contest.prize_pool_text}
            </div>
          </div>
        </div>

        <div className={styles.prizePoolBanner}>
          <Trophy size={20} />
          <span>{contest.prize_pool_text} Prize Pool</span>
        </div>

        {/* User Stats Card */}
        <div className={styles.userRankCard}>
          <div className={styles.urRank}>
            <div className={styles.urLabel}>Your Rank</div>
            <div className={styles.urValue}>{userEntry?.rank ? `#${userEntry.rank}` : 'Not Ranked'}</div>
          </div>
          <div className={styles.urDivider} />
          <div className={styles.urProgress}>
            <div className={styles.urLabel}>Your Score</div>
            <div className={styles.urValue}>{userEntry?.score || 0}</div>
          </div>
          <div className={styles.urDivider} />
          <div className={styles.urRank}>
            <div className={styles.urLabel}>Target</div>
            <div className={styles.urValue}>Top 10</div>
          </div>
        </div>

        {/* Prize Pool */}
        <section className={styles.prizeSection}>
          <div className={styles.lbHeader}>
            <h3 className={styles.lbTitle}>Prize Distribution</h3>
            <Award size={20} color="#eab308" />
          </div>
          <div className={styles.prizeGrid}>
            {contest.rewards?.map((reward: any) => (
              <div key={reward.id} className={styles.prizeCard}>
                <div className={styles.pRank}>Rank {reward.rank_from}{reward.rank_to !== reward.rank_from ? `-${reward.rank_to}` : ''}</div>
                <div className={styles.pValue}>
                  <Trophy size={16} color="#eab308" />
                  {reward.reward_text || `${reward.reward_value} Coins`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className={styles.leaderboardSection}>
          <div className={styles.lbHeader}>
            <h3 className={styles.lbTitle}>Leaderboard</h3>
            <TrendingUp size={20} color="#2563eb" />
          </div>
          <div className={styles.lbList}>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry: any, index: number) => (
                <div 
                  key={entry.id} 
                  className={`${styles.lbItem} ${entry.user_id === user?.id ? styles.lbItemActive : ''}`}
                >
                  <div className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}>
                    {index + 1}
                  </div>
                  <div className={styles.avatar}>
                    {entry.User?.first_name?.charAt(0) || '?'}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{entry.User?.first_name || 'Anonymous'}</div>
                    <div className={styles.userScore}>{entry.score} {contest.type === 'earning' ? 'Coins' : 'Invites'}</div>
                  </div>
                  <div className={styles.reward}>
                    {/* Simplified reward display for leaderboard */}
                    {index === 0 ? 'WINNER' : ''}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>
                  Be the first to join the competition 🚀
                </p>
                <button 
                  className={styles.viewLbBtn} 
                  style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}
                  onClick={() => setSelectedContest(null)}
                >
                  Start Earning
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Rules */}
        <div className={styles.rulesBox}>
          <Info size={20} color="#475569" style={{ flexShrink: 0 }} />
          <p className={styles.rulesText}>
            {contest.rules || "Complete tasks and earn coins to climb the leaderboard. Fraudulent activity will lead to disqualification."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Active Contests</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Compete with others and win big prizes!</p>
      </header>

      {loading && contests.length === 0 ? (
        <div className={styles.emptyBox}>
          <div className="loader" />
          <p>Loading contests...</p>
        </div>
      ) : contests.length > 0 ? (
        <div className={styles.contestGrid}>
          {contests.map((contest) => (
            <div 
              key={contest.id} 
              className={styles.contestCard}
              onClick={() => fetchContestDetail(contest.slug)}
            >
              <div className={styles.cardBanner}>
                <div className={styles.cardGlow} />
                <div className={styles.cardBadge}>{contest.type}</div>
                <h3 className={styles.cardTitle}>{contest.name}</h3>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardMeta}>
                  <div className={styles.prizePool}>{contest.prize_pool_text}</div>
                  <div className={styles.participants}>
                    <Users size={14} />
                    <span>30 Participants</span>
                  </div>
                </div>
                <button className={styles.viewLbBtn}>View Leaderboard</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyBox}>
          <Trophy size={48} opacity={0.2} />
          <h3>No Active Contests</h3>
          <p>New challenges are coming soon. Stay tuned!</p>
        </div>
      )}
    </div>
  );
}
