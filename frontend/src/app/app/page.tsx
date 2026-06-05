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
import { PlayCircle, Gamepad2, ChevronRight, Flame, Zap, Inbox, CalendarCheck, Globe, X, ExternalLink, CheckCircle, Coins } from "lucide-react";

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
const TASKS: any[] = []; 

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("earn");
  const [walletSubTab, setWalletSubTab] = useState<'main' | 'history'>('main');
  const [user, setUser] = useState<any>(null);
  const [selectedGameContest, setSelectedGameContest] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>({ 
    onboarding_verification_enabled: true,
    pubscale_enabled: true,
    opinion_universe_enabled: true,
    pubscale_app_id: '78594689',
    opinion_universe_url: 'https://opinionuniverse.com/offerwall?pubId=1863&SID={SID}&appId=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d',
    growdeck_enabled: true,
    growdeck_app_id: '299',
    growdeck_secret_key: '024264098bf86c23825d',
    growdeck_postback_secret: 'eb8d0721c2dfb60fcb3e6855e3a118',
    timewall_enabled: true,
    timewall_app_id: 'f60262456562e85e',
    timewall_postback_secret: 'e32f83ff0e9a6a6f05abb3e1035d5001'
  });
  
  // Custom Offer States
  const [customOffers, setCustomOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState<boolean>(true);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showOfferDetail, setShowOfferDetail] = useState<boolean>(false);
  const [proofInput, setProofInput] = useState<string>('');
  const [submittingProof, setSubmittingProof] = useState<boolean>(false);

  // Dynamic API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const { surveys, loading: surveysLoading, refetch: refreshSurveys } = useSurveys(user?.id ? user.id.toString() : undefined);

  const fetchCustomOffers = async () => {
    try {
      setLoadingOffers(true);
      const userId = user?.id ? user.id.toString() : '';
      const res = await fetch(`${API_URL}/api/offers?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomOffers(data.offers);
        }
      }
    } catch (err) {
      console.error("Error fetching custom offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSelectOffer = async (offerId: string) => {
    try {
      const userId = user?.id ? user.id.toString() : '';
      const res = await fetch(`${API_URL}/api/offers/${offerId}?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedOffer(data.offer);
          setShowOfferDetail(true);
          setProofInput('');
        }
      }
    } catch (err) {
      console.error("Error fetching offer detail:", err);
    }
  };

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
            if (data.user && data.user.id) {
              analytics.identify(data.user.id.toString(), {
                name: data.user.firstName,
                username: data.user.username,
                balance: data.user.balance,
                is_verified: data.user.isPhoneVerified
              });
            }
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

  // 2. Refresh surveys and custom offers whenever the Earn tab is clicked
  useEffect(() => {
    if (activeTab === "earn") {
      refreshSurveys();
      if (user?.id) {
        fetchCustomOffers();
      }
    }
  }, [activeTab, user?.id]);

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
      return (
        <WalletScreen 
          user={user} 
          onUpdateUser={handleSyncUser} 
          subTab={walletSubTab}
          onSubTabChange={setWalletSubTab}
        />
      );
    }

    if (activeTab === "share") {
      return <ReferralScreen user={user} onReward={handleSyncUser} />;
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

            {/* Offerwalls Section */}
            {user && (appSettings.pubscale_enabled || appSettings.opinion_universe_enabled || appSettings.growdeck_enabled || appSettings.timewall_enabled) && (
              <section className={styles.surveysSection} style={{ paddingTop: 0, paddingBottom: '8px' }}>
                <SectionHeader 
                  title="Offerwalls" 
                  icon={Globe} 
                  badgeText="HIGH PAYING"
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  {appSettings.pubscale_enabled && (
                    <div 
                      className={`${styles.highRewardCard} card`} 
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 'auto', margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        const href = `https://wow.pubscale.com?app_id=${appSettings.pubscale_app_id || '78594689'}&user_id=${user.id}${user.google_aid ? `&ga_id=${user.google_aid}` : ''}${user.ios_idfa ? `&idfa=${user.ios_idfa}` : ''}${appSettings.pubscale_sandbox ? '&sandbox=true' : ''}`;
                        window.open(href, '_blank');
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
                          <img src="https://i.ibb.co/pB5NZtyz/download.png" alt="PubScale" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>PubScale</h4>
                      </div>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0, height: '30px', overflow: 'hidden' }}>High-value offers & games. Earn 50K+ coins.</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ background: '#eef2ff', color: '#6366f1', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>HOT</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>🪙 50K+</span>
                      </div>
                    </div>
                  )}

                  {appSettings.opinion_universe_enabled && (
                    <div 
                      className={`${styles.highRewardCard} card`} 
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 'auto', margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        let url = appSettings.opinion_universe_url || 'https://opinionuniverse.com/offerwall?pubId=1863&SID={SID}&appId=ID_eb1f5bea3e8caadcfcf6ccb5d35a1d1d';
                        url = url.replace('app_id=', 'appId=');
                        if (url.includes('{SID}')) {
                          url = url.replace(/{SID}/g, user.id.toString());
                        } else if (url.includes('[userId]')) {
                          url = url.replace(/\[userId\]/g, user.id.toString());
                        } else if (url.includes('{userId}')) {
                          url = url.replace(/{userId}/g, user.id.toString());
                        } else if (url.includes('{user_id}')) {
                          url = url.replace(/{user_id}/g, user.id.toString());
                        }
                        if (!url.includes('SID=')) {
                          url = url.includes('?') ? `${url}&SID=${user.id}` : `${url}?SID=${user.id}`;
                        } else {
                          url = url.replace(/SID=[^&]*/, `SID=${user.id}`);
                        }
                        window.open(url, '_blank');
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                          <span style={{ fontSize: '16px' }}>📊</span>
                        </div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Opinion Univ.</h4>
                      </div>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0, height: '30px', overflow: 'hidden' }}>Express opinions and earn 10K+ coins.</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>POPULAR</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>🪙 10K+</span>
                      </div>
                    </div>
                  )}

                  {appSettings.growdeck_enabled && (
                    <div 
                      className={`${styles.highRewardCard} card`} 
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 'auto', margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        const href = `https://websdk.growdeck.io/?app-id=${appSettings.growdeck_app_id || '299'}&secret-key=${appSettings.growdeck_secret_key || '024264098bf86c23825d'}&external-id=${user.id}&device-id=${user.id}`;
                        window.open(href, '_blank');
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
                          <img src="https://i.ibb.co/8nDPxw1q/download.png" alt="Growdeck" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Growdeck</h4>
                      </div>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0, height: '30px', overflow: 'hidden' }}>Play fun games & earn rewards. Earn 100K+ coins.</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>NEW</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>🪙 100K+</span>
                      </div>
                    </div>
                  )}

                  {appSettings.timewall_enabled && (
                    <div 
                      className={`${styles.highRewardCard} card`} 
                      style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 'auto', margin: 0, cursor: 'pointer' }}
                      onClick={() => {
                        const href = `https://timewall.io/users/login?oid=${appSettings.timewall_app_id || 'f60262456562e85e'}&uid=${user.id}`;
                        window.open(href, '_blank');
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#1d4ed8' }}>
                          <span style={{ fontSize: '16px' }}>⏱</span>
                        </div>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>TimeWall</h4>
                      </div>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0, height: '30px', overflow: 'hidden' }}>Complete tasks, clicks & surveys. Earn 80K+ coins.</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>POPULAR</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>🪙 80K+</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Hot Reward Tasks Section */}
            {user && (
              <section className={styles.tasksSection}>
                <SectionHeader 
                  title="Hot Reward Tasks" 
                  icon={Zap} 
                  badgeText="HOT" 
                />
                
                <div className={styles.taskVerticalList}>
                  {loadingOffers ? (
                    Array(2).fill(0).map((_, i) => (
                      <div key={`offer-skeleton-${i}`} className={`${styles.highRewardCard} card ${styles.skeletonCard}`} style={{ height: '120px', padding: '16px' }}>
                        <div className={styles.taskCardTop}>
                          <div className={`${styles.taskLogo} ${styles.skeleton}`} style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                          <div className={styles.taskHeaderMain} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className={`${styles.skeletonText} ${styles.skeletonTitle} ${styles.skeleton}`} />
                            <div className={`${styles.skeletonText} ${styles.skeletonMeta} ${styles.skeleton}`} style={{ width: '50%' }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : customOffers.length > 0 ? (
                    customOffers.map((offer) => (
                      <div 
                        key={offer.id} 
                        className={`${styles.highRewardCard} card`} 
                        onClick={() => handleSelectOffer(offer.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.taskCardTop}>
                          <div className={styles.taskLogo} style={{ width: '44px', height: '44px', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
                            {offer.icon_url ? (
                              <img src={offer.icon_url} alt={offer.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              '🔥'
                            )}
                          </div>
                          <div className={styles.taskHeaderMain}>
                            <div className={styles.taskTitleRow}>
                              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{offer.title}</h3>
                              {offer.extra_label && <span className={styles.offerTag} style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7' }}>{offer.extra_label}</span>}
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {offer.description}
                            </p>
                          </div>
                          <div className={styles.taskRewardLarge}>
                            <Coins size={14} className={styles.iconYellow} fill="currentColor" />
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>{offer.total_reward}</span>
                          </div>
                        </div>
                        <div className={styles.taskCardBottom}>
                          <div className={styles.taskMetaCol}>
                            <span className={styles.estimatedTime} style={{ fontSize: '10px' }}>⏱ {offer.estimated_time || '5 mins'} | {offer.difficulty || 'Medium'}</span>
                            <span className={styles.taskUrgencyLabel} style={{ fontSize: '10px' }}>{offer.type === 'offline' ? 'Manual Verification' : 'Instant Verification'}</span>
                          </div>
                          <button className={styles.startEarningBtnWide} style={{ fontSize: '11px', padding: '6px 12px' }}>View Details</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noSurveysBox} style={{ height: '120px' }}>
                      <Zap size={32} opacity={0.3} />
                      <p style={{ fontSize: '12px', margin: 0 }}>No hot custom tasks available today</p>
                    </div>
                  )}

                  {TASKS.map((task) => (
                    <TaskCard key={task.id} {...task} />
                  ))}
                </div>
              </section>
            )}
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

      <Navbar activeTab={activeTab === "surveys_all" ? "earn" : activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "wallet") setWalletSubTab('main');
      }} />

      {/* Custom Offer Detail Modal */}
      {showOfferDetail && selectedOffer && (
        <div className={styles.modalOverlay} style={{ padding: '16px' }}>
          <div className={styles.modalBox} style={{ maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', width: '100%', borderRadius: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedOffer.icon_url ? (
                    <img src={selectedOffer.icon_url} alt={selectedOffer.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    '🔥'
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedOffer.title}</h3>
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{selectedOffer.category || 'Offers'}</span>
                </div>
              </div>
              <button 
                onClick={() => { setShowOfferDetail(false); setSelectedOffer(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>{selectedOffer.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>REWARD</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>🪙 {selectedOffer.total_reward} Coins</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>DIFFICULTY</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>{selectedOffer.difficulty || 'Medium'}</span>
              </div>
            </div>

            {/* Milestones / Tiers List */}
            {selectedOffer.tiers && selectedOffer.tiers.length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Milestones / Steps</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOffer.tiers.map((tier: any, tIdx: number) => {
                    const isTierCompleted = tier.is_completed || tier.isCompleted;
                    return (
                      <div 
                        key={tier.id || tIdx} 
                        style={{
                          padding: '12px 14px',
                          background: isTierCompleted ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                          border: '1px solid',
                          borderColor: isTierCompleted ? '#bbf7d0' : '#e2e8f0',
                          borderRadius: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: isTierCompleted ? '0 4px 10px rgba(22, 163, 74, 0.04)' : '0 4px 10px rgba(0,0,0,0.01)'
                        }}
                      >
                        {/* Milestone Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isTierCompleted ? '#16a34a' : '#6366f1',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {tier.sequence || (tIdx + 1)}
                            </span>
                            <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: 0, wordBreak: 'break-word' }}>
                              {tier.app_tier_title || tier.title}
                            </h5>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {isTierCompleted ? (
                              <span style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                border: '1px solid #bbf7d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <CheckCircle size={9} fill="currentColor" color="#dcfce7" /> Completed
                              </span>
                            ) : (
                              <span style={{
                                background: '#fef3c7',
                                color: '#d97706',
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                border: '1px solid #fde68a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                whiteSpace: 'nowrap'
                              }}>
                                🪙 +{tier.reward} Coins
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Milestone Steps / Instructions List */}
                        {tier.steps && tier.steps.length > 0 && (
                          <div style={{
                            background: isTierCompleted ? 'rgba(255,255,255,0.4)' : '#f8fafc',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isTierCompleted ? 'rgba(22, 163, 74, 0.08)' : '#f1f5f9'
                          }}>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {tier.steps.map((step: string, sIdx: number) => (
                                <li 
                                  key={sIdx} 
                                  style={{
                                    fontSize: '10.5px',
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '4px',
                                    lineHeight: 1.3
                                  }}
                                >
                                  <span style={{ color: isTierCompleted ? '#16a34a' : '#94a3b8', marginTop: '1px', flexShrink: 0 }}>•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Call to Action Section */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!selectedOffer.click_id ? (
                <button
                  onClick={async () => {
                    try {
                      const tg = (window as any).Telegram?.WebApp;
                      const gaid = user?.google_aid || '';
                      const device_model = tg?.platform || '';
                      const res = await fetch(`${API_URL}/api/offers/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          user_id: user.id.toString(),
                          offer_id: selectedOffer.id,
                          gaid,
                          device_model
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                          // Open redirect link
                          window.open(data.url, '_blank');
                          // Reload detail
                          handleSelectOffer(selectedOffer.id);
                          // Reload offer list
                          fetchCustomOffers();
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={styles.startEarningBtnWide}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: 800 }}
                >
                  🚀 Start Offer
                </button>
              ) : (
                <>
                  <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Session: STARTED</span>
                    <button 
                      onClick={() => {
                        const url = selectedOffer.tracking_url
                          .replace(/{click_id}/g, selectedOffer.click_id)
                          .replace(/{clickId}/g, selectedOffer.click_id)
                          .replace(/{user_id}/g, user.id.toString())
                          .replace(/{uid}/g, user.id.toString());
                        window.open(url, '_blank');
                      }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Resume <ExternalLink size={12} />
                    </button>
                  </div>

                  {selectedOffer.type === 'offline' && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Submit Verification Proof</h4>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 8px 0' }}>
                        👉 <b>Instructions:</b> {selectedOffer.input_instruction || 'Enter transaction details or screenshot path below.'}
                      </p>

                      {selectedOffer.adminStatus === 'PENDING' && (
                        <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', color: '#b45309', fontSize: '11px', textAlign: 'center', fontWeight: 700 }}>
                          ⏳ Proof submitted. Under admin verification.
                        </div>
                      )}

                      {selectedOffer.adminStatus === 'APPROVED' && (
                        <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bcf0da', borderRadius: '10px', color: '#16a34a', fontSize: '11px', textAlign: 'center', fontWeight: 700 }}>
                          ✅ Approved & Paid
                        </div>
                      )}

                      {(selectedOffer.adminStatus !== 'PENDING' && selectedOffer.adminStatus !== 'APPROVED') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedOffer.adminStatus === 'REJECTED' && (
                            <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '10px', marginBottom: '4px' }}>
                              ⚠️ <b>Rejected:</b> {selectedOffer.rejectionReason} (You can re-submit proof)
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder={selectedOffer.inputType === 'screenshot' ? 'Enter Screenshot Link / Image URL' : 'Enter Transaction ID / Answer'}
                            className={styles.modalInput}
                            style={{ padding: '10px', fontSize: '12px' }}
                            value={proofInput}
                            onChange={(e) => setProofInput(e.target.value)}
                          />

                          <button
                            onClick={async () => {
                              if (!proofInput.trim()) {
                                alert("Please enter the required proof text.");
                                return;
                              }
                              try {
                                setSubmittingProof(true);
                                const res = await fetch(`${API_URL}/api/offers/submit-proof`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    click_id: selectedOffer.click_id,
                                    input_data: { user_proof: proofInput }
                                  })
                                });
                                if (res.ok) {
                                  alert("Proof submitted successfully!");
                                  handleSelectOffer(selectedOffer.id);
                                }
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setSubmittingProof(false);
                              }
                            }}
                            disabled={submittingProof}
                            className={styles.startEarningBtnWide}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#10b981', fontSize: '12px', fontWeight: 700 }}
                          >
                            {submittingProof ? 'Submitting...' : 'Submit Verification Evidence'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
