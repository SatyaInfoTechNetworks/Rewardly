"use client";

import { useState, useEffect } from "react";
import styles from "@/app/page.module.css";
import { Flame, Zap, Inbox } from "lucide-react";

// Components
import { CoinBadge } from "@/components/ui/CoinBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurveyCard } from "@/components/earn/SurveyCard";
import { SurveysScreen } from "@/components/earn/SurveysScreen";
import { FeaturedOffer } from "@/components/earn/FeaturedOffer";
import { TaskCard } from "@/components/earn/TaskCard";
import { MoreScreen } from "@/components/more/MoreScreen";
import { Navbar } from "@/components/layout/Navbar";
import { VerificationOverlay } from "@/components/ui/VerificationOverlay";

// Hooks
import { useSurveys } from "@/hooks/useSurveys";

// Data Constants
const TASKS = [
  { 
    id: 1, 
    title: "CryptoBase Account", 
    reward: "25,000", 
    desc: "Complete KYC & first deposit", 
    time: "15 mins",
    tag: "Finance",
    urgency: "🔥 Ends in 12h",
    icon: "💹"
  },
  { 
    id: 2, 
    title: "Space Jump Adventure", 
    reward: "15,000", 
    desc: "Reach 50,000 score", 
    time: "10 mins",
    tag: "Gaming",
    urgency: "⚡ Popular",
    icon: "🚀"
  },
];

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("earn");
  const [user, setUser] = useState<any>(null);
  
  // Dynamic API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const { surveys, loading: surveysLoading, refetch: refreshSurveys } = useSurveys(user?.id ? user.id.toString() : undefined);

  // 1. Sync User with Backend on Startup
  useEffect(() => {
    const syncUser = async () => {
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

    syncUser();
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

            {/* Featured Offer Section */}
            <FeaturedOffer 
              title="Epic Quest: Kingdom Rise"
              desc="Complete the tutorial & reach Level 20"
              reward="50,000"
              icon="🎮"
              urgency="⚡ Boosted Reward"
            />

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
            <div className={styles.appIcon}>R</div>
            <h1 className={styles.appName}>{user?.firstName || 'Rewardly'}</h1>
          </div>
          
          <div className={styles.headerActions}>
            <CoinBadge amount={user?.balance || '0'} size="lg" />
          </div>
        </header>
      )}

      <div className={
        activeTab === "earn" ? styles.contentWrapper : 
        activeTab === "surveys_all" ? styles.noWrapper : styles.contentWrapperNoHeader
      }>
        {renderContent()}
      </div>

      <Navbar activeTab={activeTab === "surveys_all" ? "earn" : activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
