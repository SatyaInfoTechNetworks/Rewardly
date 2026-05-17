"use client";

import { useState, useEffect } from "react";
import styles from "./ContestScreen.module.css";
import { 
  Trophy, Clock, ChevronLeft, ChevronRight, Award, 
  TrendingUp, Info, Users, Zap, Ticket, Calendar, Play, Gift, AlertCircle 
} from "lucide-react";
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

interface Draw {
  id: number;
  title: string;
  slug: string;
  description?: string;
  banner_image?: string;
  type: 'daily_free' | 'weekly_mega' | 'coin_jackpot' | 'referral_draw' | 'watch_win' | 'flash_draw' | 'special_event';
  prize_type: 'coins' | 'cash' | 'gift_card' | 'item';
  prize_amount: string;
  prize_value: number;
  status: 'upcoming' | 'active' | 'ended';
  start_time: string;
  end_time: string;
  free_entries_allowed: boolean;
  ad_entries_enabled: boolean;
  max_ad_entries: number;
  coin_entry_enabled: boolean;
  coin_cost_per_entry: number;
  max_entries_per_user: number;
  referral_entries_enabled: boolean;
  winners_count: number;
  entriesCount?: number;
  participantsCount?: number;
}

interface Winner {
  id: number;
  lucky_draw_id: number;
  user_id: number;
  prize_won: string;
  rank: number;
  status: string;
  created_at: string;
  User?: {
    first_name: string;
    username: string;
    photo_url?: string;
  };
  LuckyDraw?: {
    title: string;
    prize_amount: string;
    type: string;
  };
}

interface ContestScreenProps {
  user: any;
  onPlay?: (contest: Contest) => void;
}

export function ContestScreen({ user, onPlay }: ContestScreenProps) {
  // Tabs: 'contests' | 'draws'
  const [activeTab, setActiveTab] = useState<'contests' | 'draws'>('contests');
  
  // Contest States
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  
  // Lucky Draw States
  const [draws, setDraws] = useState<Draw[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [drawDetail, setDrawDetail] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(user?.balance || 0);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [enteringDraw, setEnteringDraw] = useState(false);
  const [simulatingAd, setSimulatingAd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time tick for active countdowns
  const [timeTick, setTimeTick] = useState<number>(Date.now());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  // Tick the countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchContests();
    fetchLuckyDraws();
    fetchRecentWinners();
  }, []);

  useEffect(() => {
    if (user) {
      setUserCoins(user.balance);
    }
  }, [user]);

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

  const fetchLuckyDraws = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lucky-draws`);
      if (res.ok) {
        const data = await res.json();
        setDraws(data);
      }
    } catch (err) {
      console.error("Failed to load lucky draws", err);
    }
  };

  const fetchRecentWinners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lucky-draws/winners`);
      if (res.ok) {
        const data = await res.json();
        setRecentWinners(data);
      }
    } catch (err) {
      console.error("Failed to load winners history", err);
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

  const fetchDrawDetail = async (slug: string) => {
    try {
      setLoading(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/lucky-draws/${slug}`, {
        headers: { 'x-telegram-init-data': initData }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDrawDetail(data);
        setSelectedDraw(data.draw);
      }
    } catch (err) {
      console.error("Fetch draw detail error:", err);
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

  const handleEnterLuckyDraw = async (drawId: number, source: 'free' | 'ad' | 'coins') => {
    try {
      setEnteringDraw(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      const res = await fetch(`${API_URL}/api/lucky-draws/${drawId}/enter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({ entry_source: source })
      });

      const data = await res.json();
      if (res.ok) {
        // Successful entry
        alert(`🎟️ Ticket Registered! ${data.message || ''}`);
        
        // Update local coins balance if they purchased with coins
        if (source === 'coins' && selectedDraw) {
          setUserCoins(prev => Math.max(0, prev - selectedDraw.coin_cost_per_entry));
          if (user) {
            user.balance = Math.max(0, user.balance - selectedDraw.coin_cost_per_entry);
          }
        }

        // Refresh detail card
        if (selectedDraw) {
          fetchDrawDetail(selectedDraw.slug);
        }
        fetchLuckyDraws();
      } else {
        alert(`❌ Error: ${data.error || 'Failed to submit entry'}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ A network error occurred while submitting ticket.");
    } finally {
      setEnteringDraw(false);
    }
  };

  const handleWatchAdForEntry = async (drawId: number) => {
    const tg = (window as any).Telegram?.WebApp;
    // Attempt real AdsGram call if available
    const blockId = (window as any).__ADSGRAM_GAME_BLOCK_ID__ || '30393';

    if ((window as any).Adsgram) {
      try {
        setEnteringDraw(true);
        const controller = await (window as any).Adsgram.init({
          blockId,
          onReward: async () => {
            // Watch succeeded, call backend to claim ad ticket
            await handleEnterLuckyDraw(drawId, 'ad');
          },
          onError: (err: any) => {
            console.error('[AdsGram LuckyDraw] SDK error:', err);
            alert('❌ Ad is not available right now. Falling back to trial mode.');
            triggerMockAd(drawId);
          }
        });
        await controller.show();
      } catch (err) {
        console.error('[AdsGram Init Error]', err);
        triggerMockAd(drawId);
      } finally {
        setEnteringDraw(false);
      }
    } else {
      // Dev mode simulated ad watching to make local testing premium & functional
      triggerMockAd(drawId);
    }
  };

  const triggerMockAd = (drawId: number) => {
    setSimulatingAd(true);
    setTimeout(() => {
      setSimulatingAd(false);
      handleEnterLuckyDraw(drawId, 'ad');
    }, 2500); // Simulate watching a 2.5s ad in dev mode
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const diff = end - timeTick;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}D : ${hours.toString().padStart(2, '0')}H : ${minutes.toString().padStart(2, '0')}M`;
    }
    return `${hours.toString().padStart(2, '0')}H : ${minutes.toString().padStart(2, '0')}M : ${seconds.toString().padStart(2, '0')}S`;
  };

  const getDrawTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_free': return 'Daily Free Draw';
      case 'weekly_mega': return 'Weekly Mega Draw';
      case 'coin_jackpot': return 'Coin Jackpot';
      case 'referral_draw': return 'Referral Draw';
      case 'watch_win': return 'Watch & Win Draw';
      case 'flash_draw': return 'Flash Event';
      case 'special_event': return 'Mega Giveaway';
      default: return 'Lucky Draw';
    }
  };

  // --- RENDER 1: Selected Contest Detail ---
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

        <section className={styles.podiumSection}>
          <div className={styles.podiumContainer}>
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

  // --- RENDER 2: Selected Lucky Draw Detail ---
  if (selectedDraw && drawDetail) {
    const { draw, totalEntries, participantsCount, winners, userStats } = drawDetail;
    const isExpired = new Date(draw.end_time).getTime() <= timeTick;

    // Check entry source locks
    const freeTicketClaimed = userStats.free >= 1;
    const maxAdsReached = userStats.ad >= draw.max_ad_entries;
    const globalCapReached = userStats.total >= draw.max_entries_per_user;

    return (
      <div className={styles.container}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => { setSelectedDraw(null); setDrawDetail(null); }}>
            <ChevronLeft size={20} />
            All Events
          </button>
          <div className={styles.timerBadge} style={{ background: isExpired ? '#f1f5f9' : '#fee2e2', color: isExpired ? '#64748b' : '#ef4444' }}>
            <Clock size={14} />
            {isExpired ? "Draw Ended" : formatTimeLeft(draw.end_time)}
          </div>
        </div>

        <div className={styles.drawDetailHero}>
          <img 
            src={draw.banner_image || 'https://images.unsplash.com/photo-1595853035070-59a39fe84de3?auto=format&fit=crop&q=80&w=600'} 
            className={styles.drawDetailBanner} 
            alt={draw.title} 
          />
          <div className={styles.drawDetailOverlay}>
            <div className={styles.drawBadge}>{getDrawTypeLabel(draw.type)}</div>
            <h2 className={styles.drawDetailTitle}>{draw.title}</h2>
            <div className={styles.drawDetailPrizeBadge}>🎁 Grand Prize: {draw.prize_amount}</div>
          </div>
        </div>

        {/* Live Countdown & Stats */}
        <div className={styles.countdownSection}>
          <div className={styles.countdownLabel}>{isExpired ? "STATUS:" : "ENDING IN:"}</div>
          <div className={styles.countdownValue}>{isExpired ? "RESOLVED" : formatTimeLeft(draw.end_time)}</div>
        </div>

        {/* User Tickets counter (Social Proof and Progress) */}
        <div className={styles.userTicketsStatus}>
          <div className={styles.utsTitle}>🎫 Your Allocation Status</div>
          <div className={styles.utsGrid}>
            <div className={styles.utsItem}>
              <div className={styles.utsVal}>{userStats.free}</div>
              <div className={styles.utsLbl}>Free Tickets</div>
            </div>
            <div className={styles.utsItem}>
              <div className={styles.utsVal}>{userStats.ad} / {draw.max_ad_entries}</div>
              <div className={styles.utsLbl}>Ad Tickets</div>
            </div>
            <div className={styles.utsItem}>
              <div className={styles.utsVal}>{userStats.total} / {draw.max_entries_per_user}</div>
              <div className={styles.utsLbl}>Total (Cap)</div>
            </div>
          </div>
        </div>

        {/* Active Entry Actions */}
        {!isExpired && draw.status === 'active' && (
          <section className={styles.luckyDrawActions}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: '10px' }}>🎟️ Get Tickets</h3>

            {simulatingAd && (
              <div className={styles.loadingBox} style={{ height: '80px', background: '#eff6ff', borderRadius: '16px', marginBottom: '10px' }}>
                <div className={styles.loader} style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>Simulating Rewarded Ad Video...</span>
              </div>
            )}

            {/* 1. Claim Daily Free Entry */}
            {draw.free_entries_allowed && (
              <button
                className={`${styles.freeEntryBtn} ${(freeTicketClaimed || globalCapReached || enteringDraw || simulatingAd) ? styles.luckyActionBtnDisabled : ''}`}
                disabled={freeTicketClaimed || globalCapReached || enteringDraw || simulatingAd}
                onClick={() => handleEnterLuckyDraw(draw.id, 'free')}
              >
                {freeTicketClaimed ? '✓ Daily Free Ticket Claimed' : '🎟️ Claim Daily Free Ticket'}
              </button>
            )}

            {/* 2. Watch Ad Entry */}
            {draw.ad_entries_enabled && (
              <button
                className={`${styles.adEntryBtn} ${(maxAdsReached || globalCapReached || enteringDraw || simulatingAd) ? styles.luckyActionBtnDisabled : ''}`}
                disabled={maxAdsReached || globalCapReached || enteringDraw || simulatingAd}
                onClick={() => handleWatchAdForEntry(draw.id)}
              >
                <Play size={16} fill="white" />
                {maxAdsReached ? 'Ad Limit Reached Today' : `Watch Ad (+1 Ticket) [${userStats.ad}/${draw.max_ad_entries}]`}
              </button>
            )}

            {/* 3. Buy Coin Entry */}
            {draw.coin_entry_enabled && (
              <button
                className={`${styles.coinEntryBtn} ${(globalCapReached || enteringDraw || simulatingAd || userCoins < draw.coin_cost_per_entry) ? styles.luckyActionBtnDisabled : ''}`}
                disabled={globalCapReached || enteringDraw || simulatingAd || userCoins < draw.coin_cost_per_entry}
                onClick={() => {
                  if (confirm(`Buy 1 draw ticket using ${draw.coin_cost_per_entry} coins?`)) {
                    handleEnterLuckyDraw(draw.id, 'coins');
                  }
                }}
              >
                <Gift size={16} />
                Buy Ticket ({draw.coin_cost_per_entry} Coins)
              </button>
            )}
          </section>
        )}

        {/* Display draw rule warning */}
        <div className={styles.footerInfo} style={{ marginBottom: '25px' }}>
          <AlertCircle size={16} />
          <span>Cap limit is max {draw.max_entries_per_user} entries per user. Real random weighted drawing selected automatically.</span>
        </div>

        {/* Winners Section if Resolved */}
        {winners && winners.length > 0 && (
          <section className={styles.winnersSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle} style={{ color: '#d97706' }}>🏆 DRAW WINNERS</h3>
              <Trophy size={18} color="#d97706" />
            </div>
            <div className={styles.winnersList}>
              {winners.map((w: Winner) => (
                <div key={w.id} className={styles.winnerRow}>
                  <div className={styles.winnerAvatar}>
                    {w.User?.photo_url ? (
                      <img src={w.User.photo_url} alt="" />
                    ) : (
                      <span>👑</span>
                    )}
                  </div>
                  <div className={styles.winnerMeta}>
                    <div className={styles.winnerName}>{w.User?.first_name || 'Verified Player'}</div>
                    <div className={styles.winnerDrawName}>Rank #{w.rank} Winner</div>
                  </div>
                  <div className={styles.winnerPrizeBadge}>{w.prize_won}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Description & Rules Info card */}
        <section className={styles.leaderboardSection}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: '12px' }}>Event Description</h3>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
            {draw.description || "Enter daily tickets to maximize your giveaway odds. System weights participants based on entry ticket count."}
          </p>
          <div className={styles.footerInfo} style={{ padding: 0 }}>
            <Info size={16} />
            <span>Draw resolved and published within 5 minutes after ending. Payment validated within 24-48 hours.</span>
          </div>
        </section>
      </div>
    );
  }

  // --- RENDER 3: Tab Selector and Main Dashboard View ---
  return (
    <div className={styles.container}>
      <header className={styles.mainHeader}>
        <h1 className={styles.mainTitle}>Contests & Jackpots</h1>
        <p className={styles.mainSubtitle}>Compete in skill pools or claim daily tickets to win mega giveaways!</p>
      </header>

      {/* Main Tab Switcher */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'contests' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('contests')}
        >
          🏆 Skill Contests
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'draws' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('draws')}
        >
          🎟️ Mega Lucky Draw
        </button>
      </div>

      {/* ─── TAB A: Skill Contests ─── */}
      {activeTab === 'contests' && (
        <>
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
                    <span className={styles.cardType}>{contest.tracking_type}</span>
                    <span className={styles.cardTimer}>{formatTimeLeft(contest.end_time)}</span>
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
              <p>Compete pools starting soon. Check back shortly!</p>
            </div>
          )}
        </>
      )}

      {/* ─── TAB B: Mega Lucky Draw & Jackpots ─── */}
      {activeTab === 'draws' && (
        <>
          {/* Recent Global Winners Marquee Board */}
          {recentWinners.length > 0 && (
            <div className={styles.winnersSection} style={{ padding: '14px 16px', borderRadius: '18px', background: '#fffbeb', border: '1px solid #fef3c7', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#b45309' }}>🎉 Live Drop Winner Announcements</span>
              </div>
              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentWinners.slice(0, 3).map((w: Winner) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#78350f', background: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '700' }}>@{w.User?.username || w.User?.first_name || 'Player'}</span>
                    <span style={{ fontWeight: '500' }}>won {w.prize_won} in {w.LuckyDraw?.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active draws listing */}
          <div className={styles.drawGrid}>
            {draws.length > 0 ? (
              draws.map((draw) => {
                const isExpired = new Date(draw.end_time).getTime() <= timeTick;
                
                return (
                  <div 
                    key={draw.id} 
                    className={styles.drawCard}
                    onClick={() => fetchDrawDetail(draw.slug)}
                  >
                    <div className={styles.drawBannerWrapper}>
                      <img 
                        src={draw.banner_image || 'https://images.unsplash.com/photo-1595853035070-59a39fe84de3?auto=format&fit=crop&q=80&w=600'} 
                        className={styles.drawBannerImage} 
                        alt={draw.title} 
                      />
                      <div className={styles.drawBadge}>{getDrawTypeLabel(draw.type)}</div>
                      <div className={styles.drawPrizeOverlay}>🎁 Prize: {draw.prize_amount}</div>
                    </div>
                    <div className={styles.drawCardInfo}>
                      <h3 className={styles.drawCardTitle}>{draw.title}</h3>
                      <p className={styles.drawCardDesc}>{draw.description || 'Watch ads, spend coins or get referrals to maximize ticket entries!'}</p>
                      
                      <div className={styles.drawMetaRow}>
                        <div className={styles.drawCountdownBox} style={{ background: isExpired ? '#f1f5f9' : '#fee2e2', color: isExpired ? '#64748b' : '#ef4444' }}>
                          <Clock size={12} />
                          <span>{isExpired ? 'Ended' : formatTimeLeft(draw.end_time)}</span>
                        </div>
                        <div className={styles.drawParticipantsBox}>
                          <Users size={12} />
                          <span>{draw.participantsCount || 0} Players</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyBox}>
                <Ticket size={48} opacity={0.2} />
                <h3>No Giveaway Events Active</h3>
                <p>New jackpots dropping soon. Keep checking!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
