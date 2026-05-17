"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Gift, Copy, Send, CheckCircle2, 
  ChevronDown, ChevronUp, Zap, Trophy, 
  History, Info, TrendingUp, Sparkles
} from 'lucide-react';
import styles from './ReferralScreen.module.css';

interface ReferralScreenProps {
  user: any;
  onReward?: () => void;
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ user, onReward }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';
  const BOT_USERNAME = "rewardly_india_bot"; // Update this with actual bot username
  const referralLink = `https://t.me/${BOT_USERNAME}?startapp=${user?.id}`;

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData;

      const res = await fetch(`${API_URL}/api/referrals/me`, {
        headers: { 'x-telegram-init-data': initData }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Referral Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  };

  const handleShare = () => {
    const text = `🚀 Join Rewardly and earn real rewards! Use my link to get a bonus: ${referralLink}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleClaimMilestone = async (milestoneId: number) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData;

      const res = await fetch(`${API_URL}/api/referrals/claim-milestone`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData 
        },
        body: JSON.stringify({ milestoneId })
      });

      if (res.ok) {
        alert("🎉 Milestone reward claimed!");
        fetchReferralData();
        if (onReward) onReward();
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to claim reward");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading referral data...</p>
      </div>
    );
  }

  const { stats, settings, milestones, activity } = data || {};

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroCard}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroTitleGroup}>
            <h1 className={styles.heroTitle}>Invite Friends & Earn Rewards 🚀</h1>
            <p className={styles.heroSubtitle}>Share your link and unlock big milestone rewards as your friends grow.</p>
          </div>

          <div className={styles.linkBox}>
            <div className={styles.linkText}>{referralLink}</div>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copyStatus ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className={styles.heroActions}>
            <button className={styles.shareBtn} onClick={handleShare}>
              <Send size={18} />
              Share Link
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatLabel}>Total Earned</span>
              <span className={styles.heroStatValue}>🪙 {stats?.totalEarned?.toLocaleString() || 0}</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatLabel}>Referrals</span>
              <span className={styles.heroStatValue}>{stats?.successfulReferrals || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progress & Milestone Info */}
      <div className={styles.bonusBanner}>
        <div className={styles.bonusIcon}><Sparkles size={16} /></div>
        <p>Your friend gets <b>+{settings?.welcome_bonus || 50} coins</b> welcome bonus!</p>
      </div>

      {/* Milestone Rewards */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Trophy className={styles.sectionIcon} size={20} color="#fbbf24" />
            <h2 className={styles.sectionTitle}>Milestone Rewards</h2>
          </div>
          <p className={styles.sectionDesc}>Reach referral targets to unlock massive bonuses</p>
        </div>

        <div className={styles.milestoneGrid}>
          {milestones?.map((m: any) => {
            const progress = Math.min((stats?.successfulReferrals || 0) / m.required_referrals * 100, 100);
            const isLocked = (stats?.successfulReferrals || 0) < m.required_referrals;
            
            return (
              <div key={m.id} className={`${styles.milestoneCard} ${!isLocked ? styles.milestoneUnlocked : ''}`}>
                <div className={styles.milestoneHeader}>
                  <div className={styles.milestoneInfo}>
                    <div className={styles.milestoneTarget}>Refer {m.required_referrals} users</div>
                    <div className={styles.milestoneReward}>+{m.reward_coins.toLocaleString()} coins</div>
                  </div>
                  <div className={styles.milestoneBadge}>
                    {isLocked ? `🪙 ${m.reward_coins}` : 'READY'}
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>{stats?.successfulReferrals || 0} / {m.required_referrals}</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <button 
                  className={`${styles.claimBtn} ${isLocked ? styles.claimBtnLocked : ''}`}
                  disabled={isLocked}
                  onClick={() => handleClaimMilestone(m.id)}
                >
                  {isLocked ? 'Locked' : 'Claim Reward'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Info className={styles.sectionIcon} size={20} color="#38bdf8" />
            <h2 className={styles.sectionTitle}>How It Works</h2>
          </div>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepItem}>
            <div className={styles.stepCircle}>1</div>
            <h3>Invite Friends</h3>
            <p>Send your link to friends on Telegram, WhatsApp, or Social Media.</p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepCircle}>2</div>
            <h3>Friends Join</h3>
            <p>Your friends join Rewardly and get a +{settings?.welcome_bonus} coins bonus.</p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepCircle}>3</div>
            <h3>Earn {settings?.referral_reward} Coins</h3>
            <p>Get rewarded when your friend completes their first redeem!</p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      {activity?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <History className={styles.sectionIcon} size={20} color="#94a3b8" />
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
            </div>
          </div>

          <div className={styles.activityList}>
            {activity.map((act: any) => (
              <div key={act.id} className={styles.activityItem}>
                <div className={styles.activityUser}>
                  <div className={styles.userAvatar}>{(act.referred?.first_name || 'U')[0]}</div>
                  <div>
                    <div className={styles.userName}>{act.referred?.first_name}</div>
                    <div className={styles.userStatus}>
                      {act.status === 'rewarded' ? 'Successfully Referred' : 'Joined (Pending)'}
                    </div>
                  </div>
                </div>
                {act.status === 'rewarded' && (
                  <div className={styles.activityReward}>+{settings?.referral_reward}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rules Section */}
      <section className={styles.rulesSection}>
        <button className={styles.rulesToggle} onClick={() => setIsRulesOpen(!isRulesOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} />
            <span>Referral Program Rules</span>
          </div>
          {isRulesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {isRulesOpen && (
          <div className={styles.rulesContent}>
            <ul>
              <li>Rewards are only given for real, active users.</li>
              <li>Fake accounts or self-referrals will lead to permanent ban.</li>
              <li>{settings?.reward_trigger === 'redeem_approved' ? "Referrer reward is credited after the friend's first redemption is approved." : "Reward is credited after friend's signup."}</li>
              <li>Milestone rewards can be claimed once the target is reached.</li>
              <li>Duplicate devices or same-IP referrals are blocked by our anti-fraud system.</li>
            </ul>
          </div>
        )}
      </section>
      
      <div style={{ height: '80px' }}></div>
    </div>
  );
};
