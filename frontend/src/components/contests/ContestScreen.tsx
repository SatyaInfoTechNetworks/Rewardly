"use client";

import { useState, useEffect } from "react";
import styles from "./ContestScreen.module.css";
import { Trophy, Clock, ChevronLeft, ChevronRight, Award, TrendingUp, Info, Users, Zap } from "lucide-react";
import { analytics } from "@/modules/analytics/tracker";

interface Contest {
  id: number;
  name: string;
  slug: string;
  tracking_type: 'earnings' | 'referrals' | 'game_score';
  game_id?: number;
  access_type: 'free' | 'paid' | 'invite_only';
  entry_fee: number;
  entry_fee_type: 'coins' | 'cash';
  banner_image?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  description?: string;
  rules?: string;
  prize_pool: number;
  prize_pool_type: 'fixed' | 'dynamic';
  maximum_participants?: number;
  participantsCount?: number;
}

interface ContestScreenProps {
  user: any;
  onPlay?: (contest: Contest) => void;
}

export function ContestScreen({ user, onPlay }: ContestScreenProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
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
        const data = await res.json();
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
        
        // Track View
        analytics.track(analytics.events.CONTEST.VIEWED, {
          contest_id: data.id,
          contest_name: data.name,
          tracking_type: data.tracking_type,
          access_type: data.access_type
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinContest = async (contestId: number) => {
    try {
      setJoining(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData 
        },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        alert("🎉 Successfully joined the contest!");
        
        // Track Join
        analytics.track(analytics.events.CONTEST.JOINED, {
          contest_id: contestId,
          entry_fee: selectedContest?.contest?.entry_fee
        });

        fetchContestDetail(selectedContest.contest.slug);
      } else {
        alert(`❌ ${data.error || 'Failed to join'}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ An error occurred while joining");
    } finally {
      setJoining(false);
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
    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);
    const isJoined = !!userEntry;
    const isFull = contest.maximum_participants && (contest.participantsCount || 0) >= contest.maximum_participants;
    
    return (
      <div className={styles.container}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => setSelectedContest(null)}>
            <ChevronLeft size={20} />
            Back
          </button>
          <div className={styles.timerBadge}>
            <Clock size={14} />
            {formatTimeLeft(contest.end_time)}
          </div>
        </div>

        <div className={styles.heroSection}>
          <div className={styles.heroGlow} />
          <h2 className={styles.heroTitle}>{contest.name}</h2>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <Trophy size={16} />
              <span>{contest.prize_pool} {contest.prize_pool_type === 'dynamic' ? '%' : 'Coins'} Pool</span>
            </div>
            <div className={styles.heroStat}>
              <Users size={16} />
              <span>{contest.participantsCount || 0} / {contest.maximum_participants || '∞'}</span>
            </div>
          </div>
        </div>

        {/* Join/Play Action Box */}
        {!isJoined ? (
          <div className={styles.joinActionBox}>
            <div className={styles.joinInfo}>
              <div className={styles.joinLabel}>ENTRY FEE</div>
              <div className={styles.joinValue}>{contest.entry_fee > 0 ? `${contest.entry_fee} ${contest.entry_fee_type === 'coins' ? 'Coins' : 'Cash'}` : 'FREE'}</div>
            </div>
            <button 
              className={styles.primaryJoinBtn} 
              disabled={joining || isFull}
              onClick={() => handleJoinContest(contest.id)}
            >
              {joining ? 'Joining...' : isFull ? 'Contest Full' : 'Join Competition'}
            </button>
          </div>
        ) : contest.tracking_type === 'game_score' && (
          <div className={styles.joinActionBox} style={{ border: '2px solid #22c55e', background: '#f0fdf4' }}>
             <button 
              className={styles.primaryJoinBtn} 
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}
              onClick={() => onPlay?.(contest)}
            >
              Play Now 🎮
            </button>
          </div>
        )}

        {/* User Status Highlight */}
        {isJoined && (
          <div className={styles.userStickyRank}>
            <div className={styles.userRankInfo}>
              <div className={styles.urLabel}>YOUR RANK</div>
              <div className={styles.urValue}>{userEntry?.rank ? `#${userEntry.rank}` : 'UNRANKED'}</div>
            </div>
            <div className={styles.urDivider} />
            <div className={styles.userRankInfo}>
              <div className={styles.urLabel}>YOUR SCORE</div>
              <div className={styles.urValue}>{userEntry?.score || 0}</div>
            </div>
            <div className={styles.urAction}>
              {contest.tracking_type === 'earnings' ? 'EARN MORE' : 'INVITE FRIENDS'}
            </div>
          </div>
        )}

        {/* Podium View */}
        <section className={styles.podiumSection}>
          <div className={styles.podiumContainer}>
            {/* Podium items... (kept from before) */}
            {top3[1] && (
              <div className={`${styles.podiumItem} ${styles.second}`}>
                <div className={styles.podiumAvatar}>
                  {top3[1].User?.photo_url ? <img src={top3[1].User.photo_url} alt="" /> : <span>{top3[1].User?.first_name?.charAt(0)}</span>}
                  <div className={styles.podiumRank}>2</div>
                </div>
                <div className={styles.podiumName}>{top3[1].User?.first_name}</div>
                <div className={styles.podiumScore}>{top3[1].score}</div>
              </div>
            )}
            
            {top3[0] && (
              <div className={`${styles.podiumItem} ${styles.first}`}>
                <div className={styles.podiumAvatar}>
                  <div className={styles.crown}>👑</div>
                  {top3[0].User?.photo_url ? <img src={top3[0].User.photo_url} alt="" /> : <span>{top3[0].User?.first_name?.charAt(0)}</span>}
                  <div className={styles.podiumRank}>1</div>
                </div>
                <div className={styles.podiumName}>{top3[0].User?.first_name}</div>
                <div className={styles.podiumScore}>{top3[0].score}</div>
              </div>
            )}

            {top3[2] && (
              <div className={`${styles.podiumItem} ${styles.third}`}>
                <div className={styles.podiumAvatar}>
                  {top3[2].User?.photo_url ? <img src={top3[2].User.photo_url} alt="" /> : <span>{top3[2].User?.first_name?.charAt(0)}</span>}
                  <div className={styles.podiumRank}>3</div>
                </div>
                <div className={styles.podiumName}>{top3[2].User?.first_name}</div>
                <div className={styles.podiumScore}>{top3[2].score}</div>
              </div>
            )}
          </div>
        </section>

        {/* Rest of the UI... */}
        <section className={styles.leaderboardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Full Rankings</h3>
            <TrendingUp size={18} />
          </div>
          <div className={styles.lbList}>
            {others.length > 0 ? (
              others.map((entry: any, index: number) => (
                <div 
                  key={entry.id} 
                  className={`${styles.lbItem} ${entry.user_id === user?.id ? styles.lbItemActive : ''}`}
                >
                  <div className={styles.lbRank}>{index + 4}</div>
                  <div className={styles.lbAvatar}>
                    {entry.User?.photo_url ? <img src={entry.User.photo_url} alt="" /> : <span>{entry.User?.first_name?.charAt(0)}</span>}
                  </div>
                  <div className={styles.lbInfo}>
                    <div className={styles.lbName}>{entry.User?.first_name || 'Anonymous'}</div>
                    <div className={styles.lbScore}>{entry.score} {contest.tracking_type === 'earnings' ? 'Coins' : 'Invites'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyList}>
                <p>{isJoined ? "No other players yet. Climb up!" : "Join to see the competition"}</p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.prizeSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Prize Pool</h3>
            <Award size={18} />
          </div>
          <div className={styles.prizeGrid}>
            {contest.rewards?.map((reward: any) => (
              <div key={reward.id} className={styles.prizeCard}>
                <div className={styles.pRank}>Rank {reward.rank_from}{reward.rank_to !== reward.rank_from ? `-${reward.rank_to}` : ''}</div>
                <div className={styles.pValue}>
                  <Zap size={14} fill="#eab308" color="#eab308" />
                  {reward.reward_text || `${reward.reward_value} Coins`}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.footerInfo}>
          <Info size={16} />
          <span>{contest.rules || "Fair play only. Anti-fraud system active."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.mainHeader}>
        <h1 className={styles.mainTitle}>Contests</h1>
        <p className={styles.mainSubtitle}>Compete and win massive rewards!</p>
      </header>

      {loading && contests.length === 0 ? (
        <div className={styles.loadingBox}>
          <div className={styles.loader} />
        </div>
      ) : contests.length > 0 ? (
        <div className={styles.contestList}>
          {contests.map((contest) => (
            <div 
              key={contest.id} 
              className={styles.contestCard}
              onClick={() => fetchContestDetail(contest.slug)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardType}>{contest.tracking_type}</div>
                <div className={styles.cardTimer}>{formatTimeLeft(contest.end_time)}</div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardName}>{contest.name}</h3>
                <div className={styles.cardPrize}>
                  <Trophy size={18} color="#eab308" />
                  <span>{contest.prize_pool} Coins</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardParticipants}>
                  <Users size={14} />
                  <span>{contest.participantsCount || 0} participants</span>
                </div>
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyBox}>
          <Trophy size={48} opacity={0.2} />
          <h3>No Active Contests</h3>
          <p>Stay tuned for new challenges!</p>
        </div>
      )}
    </div>
  );
}
