"use client";

import { useState, useEffect } from "react";
import styles from "@/app/page.module.css";
import { ReferralScreen } from "@/components/share/ReferralScreen";
import { ContestScreen } from "@/components/contests/ContestScreen";
import { PlayGamesScreen } from "@/components/earn/PlayGamesScreen";
import { DailyCheckInScreen } from "@/components/earn/DailyCheckInScreen";
import { VisitAndEarnScreen } from "@/components/earn/VisitAndEarnScreen";
import { GameModuleView } from "@/modules/games/GameModuleView";
import { analytics } from "@/modules/analytics/tracker";
import { PlayCircle, Gamepad2, ChevronRight, Flame, Zap, Inbox, CalendarCheck, Globe } from "lucide-react";

// Components
import { CoinBadge } from "@/components/ui/CoinBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurveyCard } from "@/components/earn/SurveyCard";
import { SurveysScreen } from "@/components/earn/SurveysScreen";
import { FeaturedOffer } from "@/components/earn/FeaturedOffer";
import { TaskCard } from "@/components/earn/TaskCard";
import { MoreScreen } from "@/components/more/MoreScreen";
import { WalletScreen } from "@/components/wallet/WalletScreen";
import { Navbar } from "@/components/layout/Navbar";
import { VerificationOverlay } from "@/components/ui/VerificationOverlay";

// Hooks
import { useSurveys } from "@/hooks/useSurveys";

// Data Constants
const TASKS: any[] = [
  {
    id: 'yt_sub',
    title: 'Subscribe & Earn',
    desc: 'Subscribe to our Official Channel for updates',
    reward: 50,
    time: '1 min',
    tag: 'EASY',
    urgency: 'Instant',
    icon: '📺'
  },
  {
    id: 'tg_join',
    title: 'Join Community',
    desc: 'Join our Telegram for daily promo codes',
    reward: 100,
    time: '1 min',
    tag: 'NEW',
    urgency: 'Daily Rewards',
    icon: '📢'
  }
]; 

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("earn");
  const [user, setUser] = useState<any>(null);
  const [selectedGameContest, setSelectedGameContest] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>({ 
    onboarding_verification_enabled: true,
    pubscale_enabled: true,
    opinion_universe_enabled: true,
    pubscale_app_id: '26048184',
    opinion_universe_url: 'https://opinionuniverse.com/offerwall?pubId=1863'
  });
  
  // Dynamic API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const { surveys, loading: surveysLoading, refetch: refreshSurveys } = useSurveys(user?.id ? user.id.toString() : undefined);

  const handleSyncUser = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      
      if (tg) {
        tg.ready();
        tg.expand();
        const initData = tg.initData;
        
        if (!initData) return;

        const response = await fetch(`${API_URL}/api/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ initData })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            
            // PostHog Identification
            analytics.identify(data.user.telegram_id.toString(), {
              name: data.user.first_name,
              username: data.user.username,
              balance: data.user.balance,
              is_verified: data.user.is_phone_verified
            });
            analytics.track(analytics.events.AUTH.LOGIN, { method: 'telegram' });

            if (data.settings) {
              setAppSettings(data.settings);
            }
          }
        }
      }
    } catch (error) {
      console.error("Auth Sync Error:", error);
    }
  };

  // 1. Sync User with Backend on Startup & Polling
  useEffect(() => {
    handleSyncUser();
    
    // Real-time polling every 30 seconds
    const interval = setInterval(handleSyncUser, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // 2. Refresh surveys whenever the Earn tab is clicked
  useEffect(() => {
    if (activeTab === "earn") {
      refreshSurveys();
    }
  }, [activeTab]);

  // 3. Track Screen Views
  useEffect(() => {
    analytics.screen(activeTab);
  }, [activeTab]);

  // 4. Handle Onboarding Verification
  const handleOnboardingVerify = async (phoneNumber?: string) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData;

      console.log("🛠️ Verifying onboarding...", { phoneNumber });

      const response = await fetch(`${API_URL}/api/user/verify-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ initData, phone_number: phoneNumber })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Verification result:", data);
        setUser((prev: any) => ({
          ...prev,
          isPhoneVerified: data.isPhoneVerified,
          isChannelJoined: data.isChannelJoined
        }));
        
        if (data.isPhoneVerified && data.isChannelJoined) {
          alert("🎉 Verification Complete! Access Granted.");
        }
      }
    } catch (error) {
      console.error("Verification Error:", error);
    }
  };

  const showVerification = user && 
    appSettings.onboarding_verification_enabled && 
    (!user.isPhoneVerified || !user.isChannelJoined);

  const renderContent = () => {
    if (activeTab === "more") {
      return <MoreScreen user={user} />;
    }

    if (activeTab === "wallet") {
      return <WalletScreen user={user} onUpdateUser={handleSyncUser} />;
    }

    if (activeTab === "share") {
      return <ReferralScreen user={user} />;
    }

    if (activeTab === "contest") {
      return <ContestScreen user={user} onPlay={(contest) => setSelectedGameContest(contest)} />;
    }

    if (activeTab === "play_games") {
      return (
        <PlayGamesScreen 
          user={user} 
          onBack={() => setActiveTab("earn")} 
          onReward={handleSyncUser} 
        />
      );
    }

    if (activeTab === "daily_checkin") {
      return (
        <DailyCheckInScreen 
          user={user} 
          onBack={() => setActiveTab("earn")} 
          onReward={handleSyncUser} 
        />
      );
    }

    if (activeTab === "visit_earn") {
      return (
        <VisitAndEarnScreen 
          user={user} 
          onBack={() => setActiveTab("earn")} 
          onReward={handleSyncUser} 
        />
      );
    }

    if (activeTab === "surveys_all") {
      return (
        <SurveysScreen 
          surveys={surveys} 
          loading={surveysLoading} 
          onBack={() => setActiveTab("earn")} 
        />
      );
    }

    if (selectedGameContest) {
      return (
        <GameModuleView 
          user={user} 
          contest={selectedGameContest} 
          gameSlug="flappy-bird" 
          onBack={() => setSelectedGameContest(null)} 
          onScoreSubmitted={handleSyncUser}
        />
      );
    }

    if (activeTab === "earn") {
      return (
        <main className={styles.earnScreen} style={{ position: 'relative' }}>
          {/* Verification Overlay - Locked State */}
          {showVerification && (
            <VerificationOverlay 
              isPhoneVerified={user.isPhoneVerified}
              isChannelJoined={user.isChannelJoined}
              onVerify={handleOnboardingVerify}
            />
          )}

          <div style={{ filter: showVerification ? 'blur(4px) grayscale(100%)' : 'none', pointerEvents: showVerification ? 'none' : 'auto' }}>
            
            {/* Quick Actions Row */}
            <section className={styles.quickActionsRow}>
              <div className={styles.quickActionItem} onClick={() => setActiveTab("daily_checkin")}>
                <div className={styles.quickActionIcon} style={{ color: '#f59e0b', background: '#fffbeb' }}>
                  <CalendarCheck size={26} />
                </div>
                <span className={styles.quickActionLabel}>Check-in</span>
              </div>
              <div className={styles.quickActionItem} onClick={() => setActiveTab("visit_earn")}>
                <div className={styles.quickActionIcon} style={{ color: '#3b82f6', background: '#eff6ff' }}>
                  <Globe size={26} />
                </div>
                <span className={styles.quickActionLabel}>Visit</span>
              </div>
              <div className={styles.quickActionItem} onClick={() => setActiveTab("play_games")}>
                <div className={styles.quickActionIcon} style={{ color: '#6366f1', background: '#eef2ff' }}>
                  <Gamepad2 size={26} />
                </div>
                <span className={styles.quickActionLabel}>Play Games</span>
              </div>
            </section>

            {/* Hot Surveys Section */}
            <section className={styles.surveysSection}>
              <SectionHeader 
                title="Hot Surveys" 
                icon={Flame} 
                actionText="View All" 
                onAction={() => setActiveTab("surveys_all")}
              />
              
              <div className={`${styles.horizontalScroll} no-scrollbar`}>
                {surveysLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <SurveyCard key={`skeleton-${i}`} title="" time="" rating="" reward="" isLoading={true} />
                  ))
                ) : surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <SurveyCard key={survey.id} {...survey} />
                  ))
                ) : (
                  <div className={styles.noSurveysBox}>
                    <Inbox size={32} opacity={0.3} />
                    <p>No surveys available at the moment</p>
                  </div>
                )}
              </div>
            </section>


            {/* Hot Reward Tasks Section */}
            <section className={styles.tasksSection}>
              <SectionHeader 
                title="Hot Reward Tasks" 
                icon={Zap} 
                badgeText="HOT" 
              />
              
              <div className={styles.taskVerticalList}>
                {appSettings.pubscale_enabled && (
                  <TaskCard 
                    title="PubScale Offerwall"
                    desc="Complete High-Value offers and earn 10K+ Coins"
                    reward="10K+"
                    time="10-30 min"
                    tag="HOT"
                    urgency="Very High Paying"
                    icon="/pubscale.jpg"
                    href={`https://wow.pubscale.com?app_id=${appSettings.pubscale_app_id || '26048184'}&user_id=${user?.telegram_id}`}
                  />
                )}

                {appSettings.opinion_universe_enabled && (
                  <TaskCard 
                    title="Opinion Universe"
                    desc="Complete Tasks and earn Coins"
                    reward="50K+"
                    time="5-20 min"
                    tag="POPULAR"
                    urgency="High Paying"
                    icon="/opinionuniverse.png"
                    href={appSettings.opinion_universe_url || `https://opinionuniverse.com/offerwall?pubId=1863&SID=${user?.telegram_id}`}
                  />
                )}
                
                {TASKS.map((task) => (
                  <TaskCard key={task.id} {...task} />
                ))}
              </div>
            </section>
          </div>
        </main>
      );
    }

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🚀</div>
        <h3>Coming Soon</h3>
        <p>This section is under development.</p>
      </div>
    );
  };

  return (
    <div className={styles.appContainer}>
      {/* Header - Only show on main tabs, not sub-screens */}
      {activeTab === "earn" && (
        <header className={styles.earnHeader}>
          <div className={styles.logoGroup}>
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Profile" className={styles.appIcon} style={{ objectFit: 'cover' }} />
            ) : (
              <div className={styles.appIcon}>{user?.first_name?.charAt(0) || 'R'}</div>
            )}
            <h1 className={styles.appName}>{user?.first_name || 'Rewardly'}</h1>
          </div>
          
          <div className={styles.headerActions}>
            <CoinBadge amount={user?.balance || '0'} size="lg" />
          </div>
        </header>
      )}

      <div className={
        activeTab === "earn" ? styles.contentWrapper : 
        (activeTab === "surveys_all" || activeTab === "play_games") ? styles.noWrapper : styles.contentWrapperNoHeader
      }>
        {renderContent()}
      </div>

      <Navbar activeTab={activeTab === "surveys_all" ? "earn" : activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
