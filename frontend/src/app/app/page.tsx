"use client";

import { useState, useEffect } from "react";
import styles from "@/app/page.module.css";
import { ReferralScreen } from "@/components/share/ReferralScreen";
import { ContestScreen } from "@/components/contests/ContestScreen";
import { PlayGamesScreen } from "@/components/earn/PlayGamesScreen";
import { PlayCircle, Gamepad2, ChevronRight, Flame, Zap, Inbox } from "lucide-react";

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
import { ReferralScreen } from "@/components/share/ReferralScreen";
import { ContestScreen } from "@/components/contests/ContestScreen";

// Hooks
import { useSurveys } from "@/hooks/useSurveys";

// Data Constants
const TASKS: any[] = []; // Demo data removed

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("earn");
  const [user, setUser] = useState<any>(null);
  
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

  // 3. Handle Onboarding Verification
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

  const showVerification = user && (!user.isPhoneVerified || !user.isChannelJoined);

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
      return <ContestScreen user={user} />;
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

    if (activeTab === "surveys_all") {
      return (
        <SurveysScreen 
          surveys={surveys} 
          loading={surveysLoading} 
          onBack={() => setActiveTab("earn")} 
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

            {/* Play & Earn Section */}
            <section className={styles.surveysSection} style={{ paddingTop: 0 }}>
              <SectionHeader title="Play & Earn" icon={PlayCircle} />
              <div 
                className="card" 
                style={{ 
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                }}
                onClick={() => setActiveTab("play_games")}
              >
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gamepad2 size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '1.125rem', marginBottom: '2px', fontWeight: 800 }}>Games & Fun</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', lineHeight: 1.3 }}>Play games and earn coins for every minute played</p>
                </div>
                <ChevronRight size={20} color="white" />
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
