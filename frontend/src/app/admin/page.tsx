"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { 
  Users, Coins, Activity, ShieldCheck, Search, 
  LayoutDashboard, History, Settings, LogOut, 
  Edit3, Trash2, Ban, CheckCircle2, X, Gift, ArrowUpRight, Menu, Trophy, Calendar, Globe, Plus, Filter, Save, Key, Ticket
} from "lucide-react";

export default function AdminPanel() {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'payouts'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Referral States
  const [referralSettings, setReferralSettings] = useState<any>(null);
  const [referralMilestones, setReferralMilestones] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState<any>(null);
  
  // Daily Rewards State
  const [dailyRewards, setDailyRewards] = useState<any[]>([]);

  // Lucky Draw States
  const [luckyDraws, setLuckyDraws] = useState<any[]>([]);
  const [luckyDrawStats, setLuckyDrawStats] = useState<any>(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [editingDraw, setEditingDraw] = useState<any>(null);
  const [drawForm, setDrawForm] = useState({
    title: '',
    slug: '',
    description: '',
    banner_image: '',
    type: 'daily_free',
    prize_type: 'cash',
    prize_amount: '',
    prize_value: 0,
    status: 'active',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    free_entries_allowed: true,
    ad_entries_enabled: true,
    max_ad_entries: 5,
    coin_entry_enabled: false,
    coin_cost_per_entry: 100,
    max_entries_per_user: 6,
    winners_count: 1
  });
  const [selectedDrawEntries, setSelectedDrawEntries] = useState<any[]>([]);
  const [isEntriesModalOpen, setIsEntriesModalOpen] = useState(false);
  const [viewingDrawId, setViewingDrawId] = useState<number | null>(null);

  // Visit Tasks State
  const [visitTasks, setVisitTasks] = useState<any[]>([]);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({ title: '', url: '', reward_amount: 20, timer_seconds: 10 });
  
  // Contest States
  const [contests, setContests] = useState<any[]>([]);
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<any>(null);
  const [contestForm, setContestForm] = useState({
    name: '',
    slug: '',
    type: 'earning',
    status: 'active',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    description: '',
    rules: '',
    min_qualification: 0,
    prize_pool_text: '₹0',
    is_auto_distribute: false
  });

  // Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState("");

  // Payout Editor State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ 
    name: '', 
    logo_url: '', 
    order_index: 0, 
    status: 'active',
    conversion_rate: '₹1 = 100 Coins',
    fee_text: '0% Fees',
    disclaimer: '',
    custom_inputs: [] as any[]
  });
  const [tiersForm, setTiersForm] = useState<any[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://rewardlyapi.satyainfotechnetworks.com";

  const fetchAllData = async (authSecret: string) => {
    try {
      const headers = { 'x-admin-secret': authSecret };
      const options = { headers, credentials: 'include' as RequestCredentials };
      const [statsRes, usersRes, payoutsRes, withdrawalsRes, transRes, refSettingsRes, refMilestonesRes, refStatsRes, contestsRes, appSettingsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, options),
        fetch(`${API_URL}/api/admin/users`, options),
        fetch(`${API_URL}/api/admin/payout-methods`, options),
        fetch(`${API_URL}/api/admin/withdrawals`, options),
        fetch(`${API_URL}/api/admin/transactions`, options),
        fetch(`${API_URL}/api/admin/referral/settings`, options),
        fetch(`${API_URL}/api/admin/referral/milestones`, options),
        fetch(`${API_URL}/api/admin/referral/stats`, options),
        fetch(`${API_URL}/api/admin/contests`, options),
        fetch(`${API_URL}/api/admin/settings`, options)
      ]);
 
      if (statsRes.ok && usersRes.ok && payoutsRes.ok && withdrawalsRes.ok && transRes.ok) {
        setStats(await statsRes.ok ? await statsRes.json() : null);
        const usersData = await usersRes.json();
        setUsers(usersData);
        setFilteredUsers(usersData);
        setPayoutMethods(await payoutsRes.json());
        setWithdrawals(await withdrawalsRes.json());
        setTransactions(await transRes.json());
        if (refSettingsRes.ok) setReferralSettings(await refSettingsRes.json());
        if (refMilestonesRes.ok) setReferralMilestones(await refMilestonesRes.json());
        if (refStatsRes.ok) setReferralStats(await refStatsRes.json());
        if (contestsRes.ok) setContests(await contestsRes.json());
        if (appSettingsRes.ok) setAppSettings(await appSettingsRes.json());
        
        // Fetch Daily Rewards
        const rewardsRes = await fetch(`${API_URL}/api/admin/rewards`, options);
        if (rewardsRes.ok) setDailyRewards(await rewardsRes.json());

        // Fetch Visit Tasks
        const visitRes = await fetch(`${API_URL}/api/admin/visit-tasks`, options);
        if (visitRes.ok) setVisitTasks(await visitRes.json());

        // Fetch Lucky Draws
        const drawsRes = await fetch(`${API_URL}/api/admin/lucky-draws`, options);
        if (drawsRes.ok) setLuckyDraws(await drawsRes.json());

        // Fetch Lucky Draw Stats
        const drawStatsRes = await fetch(`${API_URL}/api/admin/lucky-draws/stats`, options);
        if (drawStatsRes.ok) setLuckyDrawStats(await drawStatsRes.json());
        
        setIsAuthenticated(true);
        localStorage.setItem("admin_secret", authSecret);
      } else {
        showToast("Invalid Secret Key", "error");
      }
    } catch (error) {
      console.error("Admin Fetch Error:", error);
      showToast("Connection failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: any, data: any) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': secret 
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchAllData(secret);
        setEditingUser(null);
        showToast("User updated successfully");
      }
    } catch (error) {
      showToast("Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (userId: any) => {
    if (!confirm("Are you sure? This will delete all user data and transactions!")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        fetchAllData(secret);
        showToast("User deleted");
      }
    } catch (error) {
      showToast("Failed to delete user", "error");
    }
  };

  useEffect(() => {
    const savedSecret = localStorage.getItem("admin_secret");
    if (savedSecret) {
      setSecret(savedSecret);
      fetchAllData(savedSecret);
    } else {
      setLoading(false);
    }
  }, []);

  const handleUpdateWithdrawal = async (id: number, status: string) => {
    try {
      const authSecret = localStorage.getItem("admin_secret");
      const response = await fetch(`${API_URL}/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': authSecret || ''
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        showToast(`Withdrawal ${status} successfully!`);
        fetchAllData(authSecret || '');
      }
    } catch (error) {
      showToast("Failed to update withdrawal", "error");
    }
  };

  const handleSavePayout = async () => {
    try {
      const authSecret = localStorage.getItem("admin_secret");
      const method = editingPayout ? 'PUT' : 'POST';
      const url = editingPayout 
        ? `${API_URL}/api/admin/payout-methods/${editingPayout.id}`
        : `${API_URL}/api/admin/payout-methods`;

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': authSecret || ''
        },
        credentials: 'include',
        body: JSON.stringify({ ...payoutForm, tiers: tiersForm })
      });

      if (response.ok) {
        showToast("Payout method saved!");
        setIsPayoutModalOpen(false);
        setEditingPayout(null);
        fetchAllData(authSecret || '');
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to save", "error");
      }
    } catch (error) {
      showToast("Network error occurred", "error");
    }
  };
 
  const handleUpdateAppSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(appSettings)
      });
      if (res.ok) {
        showToast("Global settings updated");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to update settings", "error");
    }
  };

  const handleUpdateReferralSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/referral/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(referralSettings)
      });
      if (res.ok) {
        showToast("Referral settings updated");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to update settings", "error");
    }
  };

  const handleSaveMilestone = async (milestone: any) => {
    try {
      const method = milestone.id ? 'PUT' : 'POST';
      const url = milestone.id 
        ? `${API_URL}/api/admin/referral/milestones/${milestone.id}`
        : `${API_URL}/api/admin/referral/milestones`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(milestone)
      });
      if (res.ok) {
        showToast("Milestone saved");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to save milestone", "error");
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/referral/milestones/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Milestone deleted");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to delete milestone", "error");
    }
  };

  const handleSaveContest = async () => {
    try {
      const method = editingContest ? 'PUT' : 'POST';
      const url = editingContest 
        ? `${API_URL}/api/admin/contests/${editingContest.id}`
        : `${API_URL}/api/admin/contests`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(contestForm)
      });
      if (res.ok) {
        showToast("Contest saved");
        setIsContestModalOpen(false);
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to save contest", "error");
    }
  };

  const handleDeleteContest = async (id: number) => {
    if (!confirm("Delete this contest? All entries will be lost.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/contests/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Contest deleted");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to delete contest", "error");
    }
  };

  const handleSaveDraw = async () => {
    try {
      const method = editingDraw ? 'PUT' : 'POST';
      const url = editingDraw 
        ? `${API_URL}/api/admin/lucky-draws/${editingDraw.id}`
        : `${API_URL}/api/admin/lucky-draws`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(drawForm)
      });
      if (res.ok) {
        showToast("Lucky Draw event saved successfully!");
        setIsDrawModalOpen(false);
        fetchAllData(secret);
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to save Lucky Draw", "error");
      }
    } catch (error) {
      showToast("Failed to save draw", "error");
    }
  };

  const handleDeleteDraw = async (id: number) => {
    if (!confirm("Are you sure you want to delete this draw? This will erase all entries & winners!")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/lucky-draws/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Lucky Draw deleted");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to delete draw", "error");
    }
  };

  const handleRollWinners = async (id: number) => {
    if (!confirm("Roll random winners now? This will award the prizes automatically!")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/lucky-draws/${id}/roll`, {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        showToast("🎉 Winners rolled and rewarded successfully!");
        fetchAllData(secret);
      } else {
        showToast(data.error || "Failed to roll winners", "error");
      }
    } catch (error) {
      showToast("Failed to complete roll", "error");
    }
  };

  const handleViewEntries = async (id: number) => {
    try {
      setViewingDrawId(id);
      const res = await fetch(`${API_URL}/api/admin/lucky-draws/${id}/entries`, {
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDrawEntries(data);
        setIsEntriesModalOpen(true);
      }
    } catch (error) {
      showToast("Failed to load participants entries", "error");
    }
  };

  const handleMarkWinnerPaid = async (winnerId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'paid' : 'pending';
    try {
      const res = await fetch(`${API_URL}/api/admin/lucky-draws/winners/${winnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(`Winner status marked as ${nextStatus}!`);
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to update winner status", "error");
    }
  };

  const handleAddContestReward = async (contestId: number, reward: any) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/contests/${contestId}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        credentials: 'include',
        body: JSON.stringify(reward)
      });
      if (res.ok) {
        showToast("Reward added");
        fetchAllData(secret);
      }
    } catch (error) {
      showToast("Failed to add reward", "error");
    }
  };

  const handleSearchUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setFilteredUsers(users);
      return;
    }
    const filtered = users.filter(u => 
      u.telegram_id.toString().includes(query) || 
      (u.first_name && u.first_name.toLowerCase().includes(query.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  if (loading) {
    return (
      <div className={styles.lteLoadingScreen}>
        <div className={styles.lteSpinner}></div>
        <h4>Loading Rewardly AdminLTE Console...</h4>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.lteLoginContainer}>
        <div className={styles.lteLoginCard}>
          <div className={styles.lteLoginLogo}>
            <b>Rewardly</b>LTE
          </div>
          <div className={styles.lteLoginCardBody}>
            <p className={styles.lteLoginBoxMsg}>Sign in to start your administrator session</p>
            <div className={styles.lteInputGroup}>
              <input 
                type="password" 
                className={styles.lteFormControl} 
                placeholder="Admin Authorization Key"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAllData(secret)}
              />
              <span className={styles.lteInputGroupText}>
                <Key size={16} />
              </span>
            </div>
            <div className={styles.lteLoginActions}>
              <button className={styles.lteBtnPrimaryBlock} onClick={() => fetchAllData(secret)}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.lteWrapper} ${isSidebarOpen ? '' : styles.lteSidebarCollapse}`}>
      {/* Toast System */}
      {toast && (
        <div className={`${styles.lteAlert} ${toast.type === 'success' ? styles.lteAlertSuccess : styles.lteAlertDanger}`}>
          <h5>{toast.type === 'success' ? '✓ Success' : '⚠ Error'}</h5>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Navbar */}
      <nav className={styles.lteNavbar}>
        <ul className={styles.lteNavbarNav}>
          <li className={styles.lteNavItem}>
            <button className={styles.lteNavToggle} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
            </button>
          </li>
          <li className={`${styles.lteNavItem} ${styles.lteDNoneSm}`}>
            <span className={styles.lteNavLink}>Admin Control Console v3.1</span>
          </li>
        </ul>
        <ul className={`${styles.lteNavbarNav} ${styles.lteMlAuto}`}>
          <li className={styles.lteNavItem}>
            <button className={styles.lteBtnLogout} onClick={() => {
              localStorage.removeItem("admin_secret");
              setIsAuthenticated(false);
            }}>
              <LogOut size={16} style={{ marginRight: '6px' }} /> Log Out
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Sidebar */}
      <aside className={styles.lteMainSidebar}>
        <div className={styles.lteBrandLink}>
          <div className={styles.lteBrandIcon}>R</div>
          <span className={styles.lteBrandText}>Rewardly<b>LTE</b></span>
        </div>

        <div className={styles.lteSidebar}>
          {/* User Profile Info */}
          <div className={styles.lteUserPanel}>
            <div className={styles.lteUserImage}>
              <ShieldCheck size={32} color="#28a745" />
            </div>
            <div className={styles.lteUserInfo}>
              <span className={styles.lteUserTitle}>Super Administrator</span>
              <span className={styles.lteUserSub}><span className={styles.lteOnlineDot}></span> Online</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={styles.lteSidebarNav}>
            <ul className={styles.lteNavList}>
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Overview' },
                { id: 'users', icon: Users, label: 'User Database' },
                { id: 'payouts', icon: Gift, label: 'Payout Gateways' },
                { id: 'withdrawals', icon: ArrowUpRight, label: 'Withdrawal Tickets' },
                { id: 'referrals', icon: Users, label: 'Referral Engine' },
                { id: 'contests', icon: Trophy, label: 'Tournament Panel' },
                { id: 'lucky_draws', icon: Ticket, label: 'Lucky Draws & Jackpot' },
                { id: 'transactions', icon: History, label: 'Global Audit Logs' },
                { id: 'daily_rewards', icon: Calendar, label: 'Check-in Rewards' },
                { id: 'visit_tasks', icon: Globe, label: 'Visit Tasks Manager' },
                { id: 'settings', icon: Settings, label: 'Global Settings' },
              ].map((item) => (
                <li key={item.id} className={styles.lteNavListItem}>
                  <button 
                    className={`${styles.lteNavLinkButton} ${activeView === item.id ? styles.lteNavLinkActive : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <item.icon size={18} className={styles.lteNavIcon} />
                    <p>{item.label}</p>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className={styles.lteContentWrapper}>
        {/* Content Header */}
        <div className={styles.lteContentHeader}>
          <div className={styles.lteRow}>
            <div>
              <h1 className={styles.lteM0}>
                {activeView.toUpperCase().replace('_', ' ')}
              </h1>
            </div>
            <div className={styles.lteBreadcrumb}>
              <span className={styles.lteBreadcrumbItem}>Home</span>
              <span className={`${styles.lteBreadcrumbItem} ${styles.lteActive}`}>{activeView}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <section className={styles.lteContent}>
          {/* ──── VIEW: DASHBOARD ──── */}
          {activeView === 'dashboard' && stats && (
            <div>
              {/* Stats Cards */}
              <div className={styles.lteStatsGrid}>
                <div className={`${styles.lteSmallBox} ${styles.lteBgInfo}`}>
                  <div className={styles.lteInner}>
                    <h3>{stats.totalUsers?.toLocaleString() || 0}</h3>
                    <p>Total Registered Users</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Users size={70} />
                  </div>
                  <button className={styles.lteSmallBoxFooter} onClick={() => setActiveView('users')}>
                    More Info <ArrowUpRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>

                <div className={`${styles.lteSmallBox} ${styles.lteBgSuccess}`}>
                  <div className={styles.lteInner}>
                    <h3>{stats.totalBalance?.toLocaleString() || 0}</h3>
                    <p>Total User Coins Circulation</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Coins size={70} />
                  </div>
                  <button className={styles.lteSmallBoxFooter} onClick={() => setActiveView('transactions')}>
                    Audit Distribution <ArrowUpRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>

                <div className={`${styles.lteSmallBox} ${styles.lteBgWarning}`}>
                  <div className={styles.lteInner}>
                    <h3>{stats.totalTransactions?.toLocaleString() || 0}</h3>
                    <p>Total Events Logged</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Activity size={70} />
                  </div>
                  <button className={styles.lteSmallBoxFooter} onClick={() => setActiveView('transactions')}>
                    Audit Logs <ArrowUpRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              </div>

              {/* Main row */}
              <div className={styles.lteCard}>
                <div className={`${styles.lteCardHeader} ${styles.lteBorderPrimary}`}>
                  <h3 className={styles.lteCardTitle}>System Performance Matrix</h3>
                </div>
                <div className={styles.lteCardBody}>
                  <p>Welcome to Rewardly AdminLTE Dashboard Panel. Use the left navigation sidebar to control and monitor database tables, gate payouts, and configure global variables.</p>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: USERS ──── */}
          {activeView === 'users' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader}>
                <h3 className={styles.lteCardTitle}>System User Directory</h3>
                <div className={styles.lteCardTools}>
                  <div className={styles.lteSearchBox}>
                    <Search size={16} style={{ color: '#adb5bd', marginRight: '8px' }} />
                    <input 
                      type="text" 
                      placeholder="Search ID, Name or Username..." 
                      value={searchQuery}
                      onChange={handleSearchUsers}
                      className={styles.lteSearchInput}
                    />
                  </div>
                </div>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                  <thead>
                    <tr>
                      <th>Avatar / User</th>
                      <th>Account Info</th>
                      <th>Social Status</th>
                      <th>Wallet Balance</th>
                      <th>Account Access</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.telegram_id}>
                        <td>
                          <div className={styles.lteUserMeta}>
                            {user.photo_url ? (
                              <img src={user.photo_url} alt="Avatar" className={styles.lteAvatar} />
                            ) : (
                              <div className={styles.lteAvatarPlaceholder}>
                                {(user.first_name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className={styles.lteUserFullName}>{user.first_name} {user.last_name || ''}</div>
                              <div className={styles.lteUserTag}>@{user.username || 'no_username'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div><strong>ID:</strong> {user.telegram_id}</div>
                          <div style={{ color: '#6c757d', fontSize: '12px' }}><strong>Phone:</strong> {user.phone_number || 'N/A'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span className={`${styles.lteBadge} ${user.is_phone_verified ? styles.lteBadgeSuccess : styles.lteBadgeSecondary}`} title="Phone verified status">
                              Phone
                            </span>
                            <span className={`${styles.lteBadge} ${user.is_channel_joined ? styles.lteBadgeInfo : styles.lteBadgeSecondary}`} title="Channel status">
                              Channel
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.lteUserBalance}>{user.balance?.toLocaleString()} <span className={styles.lteCoinText}>Coins</span></div>
                          {user.pending_balance > 0 && (
                            <div className={styles.ltePendingBalance}>+ {user.pending_balance?.toLocaleString()} pending</div>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.lteBadge} ${user.is_banned ? styles.lteBadgeDanger : styles.lteBadgeSuccess}`}>
                            {user.is_banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.lteBtnGroup}>
                            <button 
                              className={`${styles.lteBtn} ${styles.lteBtnInfo}`} 
                              onClick={() => {
                                setEditingUser(user);
                                setNewBalance(user.balance.toString());
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className={`${styles.lteBtn} ${user.is_banned ? styles.lteBtnSuccess : styles.lteBtnWarning}`}
                              onClick={() => handleUpdateUser(user.telegram_id, { is_banned: !user.is_banned })}
                            >
                              <Ban size={14} />
                            </button>
                            <button 
                              className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                              onClick={() => handleDeleteUser(user.telegram_id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: PAYOUT METHODS ──── */}
          {activeView === 'payouts' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.lteCardTitle}>Payout Gateways</h3>
                <button 
                  className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                  onClick={() => {
                    setEditingPayout(null);
                    setPayoutForm({ 
                      name: '', 
                      logo_url: '', 
                      order_index: payoutMethods.length + 1, 
                      status: 'active',
                      conversion_rate: '₹1 = 100 Coins',
                      fee_text: '0% Fees',
                      disclaimer: '',
                      custom_inputs: []
                    });
                    setTiersForm([]);
                    setIsPayoutModalOpen(true);
                  }}
                >
                  <Plus size={16} style={{ marginRight: '6px' }} /> Add Payout Gateway
                </button>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={styles.lteTable}>
                  <thead>
                    <tr>
                      <th>Gateway</th>
                      <th>Redemption Tiers</th>
                      <th>Priority Index</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutMethods.map(method => (
                      <tr key={method.id}>
                        <td>
                          <div className={styles.ltePayoutMeta}>
                            <div className={styles.ltePayoutLogoContainer}>
                              {method.logo_url && <img src={method.logo_url} className={styles.ltePayoutLogo} />}
                            </div>
                            <div>
                              <div className={styles.ltePayoutTitle}>{method.name}</div>
                              <div className={styles.ltePayoutSub}>{method.conversion_rate}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {method.tiers?.map((t: any) => (
                              <span key={t.id} className={styles.lteTierTag}>
                                {t.amount_text} ({t.coins_required} c)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{method.order_index}</span>
                        </td>
                        <td>
                          <span className={`${styles.lteBadge} ${method.status === 'active' ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                            {method.status === 'active' ? 'Operational' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.lteBtnGroup}>
                            <button 
                              className={`${styles.lteBtn} ${styles.lteBtnInfo}`}
                              onClick={() => {
                                setEditingPayout(method);
                                setPayoutForm({ 
                                  name: method.name, 
                                  logo_url: method.logo_url || '', 
                                  order_index: method.order_index, 
                                  status: method.status,
                                  conversion_rate: method.conversion_rate || '₹1 = 100 Coins',
                                  fee_text: method.fee_text || '0% Fees',
                                  disclaimer: method.disclaimer || '',
                                  custom_inputs: method.custom_inputs || []
                                });
                                setTiersForm(method.tiers || []);
                                setIsPayoutModalOpen(true);
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: WITHDRAWALS ──── */}
          {activeView === 'withdrawals' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader}>
                <h3 className={styles.lteCardTitle}>Withdrawal Tickets</h3>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={styles.lteTable}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Method</th>
                      <th>Value</th>
                      <th>Recipient details</th>
                      <th>Ticket status</th>
                      <th>Approval actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(req => (
                      <tr key={req.id}>
                        <td>
                          <div className={styles.lteUserMeta}>
                            <div className={styles.lteAvatarPlaceholder}>
                              {(req.User?.first_name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div>{req.User?.first_name} {req.User?.last_name || ''}</div>
                              <div className={styles.lteUserTag}>@{req.User?.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{req.PayoutMethod?.name}</strong>
                        </td>
                        <td>
                          <div><strong>{req.amount_text}</strong></div>
                          <div style={{ color: '#6c757d', fontSize: '11px' }}>{req.coins_used} coins used</div>
                        </td>
                        <td>
                          <div className={styles.lteCodeField}>
                            {req.payout_details}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.lteBadge} ${
                            req.status === 'approved' ? styles.lteBadgeSuccess : 
                            req.status === 'pending' ? styles.lteBadgeWarning : styles.lteBadgeDanger
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === 'pending' && (
                            <div className={styles.lteBtnGroup}>
                              <button 
                                className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                                onClick={() => handleUpdateWithdrawal(req.id, 'approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                onClick={() => handleUpdateWithdrawal(req.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: REFERRALS ──── */}
          {activeView === 'referrals' && referralSettings && (
            <div>
              {/* Referral Stats Box */}
              <div className={styles.lteStatsGrid}>
                <div className={`${styles.lteSmallBox} ${styles.lteBgInfo}`}>
                  <div className={styles.lteInner}>
                    <h3>{referralStats?.totalInvites || 0}</h3>
                    <p>Total Invited Users</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Users size={70} />
                  </div>
                </div>

                <div className={`${styles.lteSmallBox} ${styles.lteBgSuccess}`}>
                  <div className={styles.lteInner}>
                    <h3>{referralStats?.rewardedInvites || 0}</h3>
                    <p>Qualified Conversions</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <CheckCircle2 size={70} />
                  </div>
                </div>

                <div className={`${styles.lteSmallBox} ${styles.lteBgWarning}`}>
                  <div className={styles.lteInner}>
                    <h3>{referralStats?.conversionRate || 0}%</h3>
                    <p>Conversion Success Rate</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Activity size={70} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* General Settings */}
                <div className={styles.lteCard}>
                  <div className={styles.lteCardHeader}>
                    <h3 className={styles.lteCardTitle}>Referral Engine Config</h3>
                  </div>
                  <div className={styles.lteCardBody}>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Welcome Bonus (For Invitee)</label>
                      <input 
                        type="number" 
                        className={styles.lteFormControl}
                        value={referralSettings.welcome_bonus} 
                        onChange={(e) => setReferralSettings({...referralSettings, welcome_bonus: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Referrer Reward (For Inviter)</label>
                      <input 
                        type="number" 
                        className={styles.lteFormControl}
                        value={referralSettings.referral_reward} 
                        onChange={(e) => setReferralSettings({...referralSettings, referral_reward: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Ecosystem Reward Trigger</label>
                      <select 
                        className={styles.lteFormControl}
                        value={referralSettings.reward_trigger}
                        onChange={(e) => setReferralSettings({...referralSettings, reward_trigger: e.target.value})}
                      >
                        <option value="signup">Immediate Signup</option>
                        <option value="earning">Minimum Earnings Met</option>
                        <option value="redeem_request">First Redeem Requested</option>
                        <option value="redeem_approved">First Redeem Approved</option>
                      </select>
                    </div>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Min Redeem For Reward Eligibility (₹)</label>
                      <input 
                        type="number" 
                        className={styles.lteFormControl}
                        value={referralSettings.min_redeem_amount} 
                        onChange={(e) => setReferralSettings({...referralSettings, min_redeem_amount: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className={styles.lteFraudBox}>
                      <h5>Anti-Fraud Protection</h5>
                      <div className={styles.lteFlexRowBetween}>
                        <span>Block Invitation from Same Device</span>
                        <input type="checkbox" checked={referralSettings.same_device_block} onChange={(e) => setReferralSettings({...referralSettings, same_device_block: e.target.checked})} />
                      </div>
                      <div className={styles.lteFlexRowBetween} style={{ marginTop: '10px' }}>
                        <span>VPN & Proxy Intercept Security</span>
                        <input type="checkbox" checked={referralSettings.vpn_detection} onChange={(e) => setReferralSettings({...referralSettings, vpn_detection: e.target.checked})} />
                      </div>
                    </div>

                    <button className={`${styles.lteBtn} ${styles.lteBtnPrimary} ${styles.lteBtnBlock}`} onClick={handleUpdateReferralSettings}>
                      Save Configuration
                    </button>
                  </div>
                </div>

                {/* Volume Milestones */}
                <div className={styles.lteCard}>
                  <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className={styles.lteCardTitle}>Volume Milestones</h3>
                    <button 
                      className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                      onClick={() => handleSaveMilestone({ required_referrals: 0, reward_coins: 0 })}
                    >
                      + Add
                    </button>
                  </div>
                  <div className={styles.lteCardBody}>
                    <table className={styles.lteTable}>
                      <thead>
                        <tr>
                          <th>Invites Required</th>
                          <th>Bonus Coins</th>
                          <th>Save / Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralMilestones.map(m => (
                          <tr key={m.id}>
                            <td>
                              <input 
                                type="number" 
                                className={styles.lteFormControl}
                                style={{ width: '90px', padding: '4px 8px' }} 
                                value={m.required_referrals} 
                                onChange={(e) => {
                                  const newM = [...referralMilestones];
                                  const item = newM.find(it => it.id === m.id);
                                  if (item) item.required_referrals = parseInt(e.target.value);
                                  setReferralMilestones(newM);
                                }}
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className={styles.lteFormControl}
                                style={{ width: '110px', padding: '4px 8px', color: '#28a745', fontWeight: 'bold' }} 
                                value={m.reward_coins} 
                                onChange={(e) => {
                                  const newM = [...referralMilestones];
                                  const item = newM.find(it => it.id === m.id);
                                  if (item) item.reward_coins = parseInt(e.target.value);
                                  setReferralMilestones(newM);
                                }}
                              />
                            </td>
                            <td>
                              <div className={styles.lteBtnGroup}>
                                <button className={`${styles.lteBtn} ${styles.lteBtnSuccess}`} onClick={() => handleSaveMilestone(m)}>
                                  ✓
                                </button>
                                <button className={`${styles.lteBtn} ${styles.lteBtnDanger}`} onClick={() => handleDeleteMilestone(m.id)}>
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: TOURNAMENTS (CONTESTS) ──── */}
          {activeView === 'contests' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.lteCardTitle}>Active Contests & Tournaments</h3>
                <button 
                  className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                  onClick={() => {
                    setEditingContest(null);
                    setContestForm({
                      name: '',
                      slug: '',
                      type: 'earning',
                      status: 'active',
                      start_time: new Date().toISOString().slice(0, 16),
                      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                      description: '',
                      rules: '',
                      min_qualification: 0,
                      prize_pool_text: '₹0',
                      is_auto_distribute: false
                    });
                    setIsContestModalOpen(true);
                  }}
                >
                  <Plus size={16} style={{ marginRight: '6px' }} /> Start New Contest
                </button>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={styles.lteTable}>
                  <thead>
                    <tr>
                      <th>Challenge info</th>
                      <th>Tournament Type</th>
                      <th>Time Frame</th>
                      <th>Prize Pool</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contests.map(contest => (
                      <tr key={contest.id}>
                        <td>
                          <div><strong>{contest.name}</strong></div>
                          <div style={{ color: '#6c757d', fontSize: '11px' }}>/{contest.slug}</div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#17a2b8' }}>
                            {contest.type}
                          </span>
                        </td>
                        <td>
                          Ends: {new Date(contest.end_time).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ color: '#28a745', fontWeight: 'bold' }}>{contest.prize_pool_text}</div>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>{contest.rewards?.length || 0} distribution tiers</div>
                        </td>
                        <td>
                          <span className={`${styles.lteBadge} ${contest.status === 'active' ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                            {contest.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.lteBtnGroup}>
                            <button 
                              className={`${styles.lteBtn} ${styles.lteBtnInfo}`} 
                              onClick={() => {
                                setEditingContest(contest);
                                setContestForm({
                                  ...contest,
                                  start_time: new Date(contest.start_time).toISOString().slice(0, 16),
                                  end_time: new Date(contest.end_time).toISOString().slice(0, 16)
                                });
                                setIsContestModalOpen(true);
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                              onClick={() => handleDeleteContest(contest.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: AUDIT LOGS ──── */}
          {activeView === 'transactions' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader}>
                <h3 className={styles.lteCardTitle}>System Audit Ledger</h3>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                  <thead>
                    <tr>
                      <th>Reference ID</th>
                      <th>Telegram ID</th>
                      <th>Transaction Type</th>
                      <th>Token Value</th>
                      <th>Time UTC</th>
                      <th>ledger memo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(txn => (
                      <tr key={txn.id}>
                        <td>
                          <code className={styles.lteCode}>{txn.reference_id || `ID-${txn.id}`}</code>
                        </td>
                        <td>{txn.telegram_id}</td>
                        <td>
                          <span className={`${styles.lteBadge} ${txn.type === 'withdrawal' ? styles.lteBadgeDanger : styles.lteBadgeSuccess}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td>
                          <strong style={txn.type === 'withdrawal' ? { color: '#dc3545' } : { color: '#28a745' }}>
                            {txn.type === 'withdrawal' ? '-' : '+'}{txn.amount}
                          </strong>
                        </td>
                        <td>
                          {txn.created_at ? new Date(txn.created_at).toLocaleString() : (txn.createdAt ? new Date(txn.createdAt).toLocaleString() : 'N/A')}
                        </td>
                        <td>
                          {txn.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: CHECK-IN REWARDS ──── */}
          {activeView === 'daily_rewards' && (
            <div className={styles.lteCard} style={{ maxWidth: '650px' }}>
              <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.lteCardTitle}>Daily Check-in Reward Progression</h3>
                <button 
                  className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                  style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}
                  onClick={async () => {
                    if (!confirm("Are you sure you want to reset all user daily check-in streaks to Day 0? This action is irreversible!")) return;
                    try {
                      const res = await fetch(`${API_URL}/api/admin/reset-streaks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                        credentials: 'include'
                      });
                      if (res.ok) {
                        showToast("All user daily check-in streaks have been reset successfully!");
                      } else {
                        showToast("Failed to reset streaks", "error");
                      }
                    } catch (err) {
                      showToast("Error resetting streaks", "error");
                    }
                  }}
                >
                  🔄 Reset User Streaks
                </button>
              </div>
              <div className={styles.lteCardBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {dailyRewards.map((reward, idx) => (
                    <div key={reward.day} className={styles.lteRewardRowItem}>
                      <div className={styles.lteDayText}>Day {reward.day} Streak</div>
                      <div className={styles.lteInputGroup} style={{ marginBottom: 0 }}>
                        <input 
                          type="number"
                          className={styles.lteFormControl}
                          value={reward.reward_amount}
                          onChange={(e) => {
                            const newRewards = [...dailyRewards];
                            newRewards[idx].reward_amount = parseInt(e.target.value);
                            setDailyRewards(newRewards);
                          }}
                        />
                        <span className={styles.lteInputGroupText}>Coins Reward</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} 
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_URL}/api/admin/rewards`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                          credentials: 'include',
                          body: JSON.stringify({ rewards: dailyRewards })
                        });
                        if (res.ok) {
                          showToast("Check-in rewards updated");
                        }
                      } catch (err) {
                        showToast("Failed to update rewards", "error");
                      }
                    }}
                  >
                    <Save size={16} style={{ marginRight: '6px' }} /> Update Streak Rewards
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: VISIT TASKS ──── */}
          {activeView === 'visit_tasks' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.lteCardTitle}>External Visit & Earn Campaign Links</h3>
                <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={() => setIsVisitModalOpen(true)}>
                  <Plus size={16} style={{ marginRight: '6px' }} /> Add Visit Task
                </button>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={styles.lteTable}>
                  <thead>
                    <tr>
                      <th>Campaign Title</th>
                      <th>Target Link Url</th>
                      <th>Payout Coins</th>
                      <th>Timer Requirement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitTasks.map(task => (
                      <tr key={task.id}>
                        <td><strong>{task.title}</strong></td>
                        <td>
                          <a href={task.url} target="_blank" rel="noreferrer" style={{ color: '#007bff', wordBreak: 'break-all' }}>{task.url}</a>
                        </td>
                        <td>
                          <span className={styles.lteCoinTag}>{task.reward_amount} Coins</span>
                        </td>
                        <td>
                          <span className={`${styles.lteBadge} ${styles.lteBadgeInfo}`}>{task.timer_seconds}s</span>
                        </td>
                        <td>
                          <button 
                            className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                            onClick={async () => {
                              if (confirm("Delete this task?")) {
                                try {
                                  const res = await fetch(`${API_URL}/api/admin/visit-tasks/${task.id}`, {
                                    method: 'DELETE',
                                    headers: { 'x-admin-secret': secret },
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    showToast("Task deleted");
                                    fetchAllData(secret);
                                  }
                                } catch (err) { showToast("Error deleting", "error"); }
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──── VIEW: LUCKY DRAWS & JACKPOTS ──── */}
          {activeView === 'lucky_draws' && (
            <div>
              {/* Lucky Draw Stats Widgets */}
              <div className={styles.lteStatsGrid} style={{ marginBottom: '24px' }}>
                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
                  <div className={styles.lteInner}>
                    <h3>{luckyDrawStats?.totalDraws || 0}</h3>
                    <p>Total Draw Campaigns</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Ticket size={70} opacity={0.15} />
                  </div>
                  <div className={styles.lteSmallBoxFooter}>Campaigns Directory</div>
                </div>

                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: 'white' }}>
                  <div className={styles.lteInner}>
                    <h3>{(luckyDrawStats?.totalEntries || 0).toLocaleString()}</h3>
                    <p>Total Tickets Issued ({luckyDrawStats?.adEntries || 0} Ads / {luckyDrawStats?.coinEntries || 0} Coins)</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Activity size={70} opacity={0.15} />
                  </div>
                  <div className={styles.lteSmallBoxFooter}>Ad vs Coin allocations</div>
                </div>

                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)', color: 'white' }}>
                  <div className={styles.lteInner}>
                    <h3>{(luckyDrawStats?.totalParticipants || 0).toLocaleString()}</h3>
                    <p>Unique Active Participants</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Users size={70} opacity={0.15} />
                  </div>
                  <div className={styles.lteSmallBoxFooter}>Net player reach</div>
                </div>

                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', color: 'white' }}>
                  <div className={styles.lteInner}>
                    <h3>${luckyDrawStats?.revenueEstimate || "0.00"}</h3>
                    <p>Estimated Ad Revenue (eCPM $2.00)</p>
                  </div>
                  <div className={styles.lteIcon}>
                    <Coins size={70} opacity={0.15} />
                  </div>
                  <div className={styles.lteSmallBoxFooter}>Est. Network Monetization</div>
                </div>
              </div>

              {/* Draw Directory Card */}
              <div className={styles.lteCard}>
                <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className={styles.lteCardTitle}>Ecosystem Sweepstakes Directory</h3>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                    onClick={() => {
                      setEditingDraw(null);
                      setDrawForm({
                        title: '',
                        slug: '',
                        description: '',
                        banner_image: '',
                        type: 'daily_free',
                        prize_type: 'cash',
                        prize_amount: '',
                        prize_value: 0,
                        status: 'active',
                        start_time: new Date().toISOString().slice(0, 16),
                        end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                        free_entries_allowed: true,
                        ad_entries_enabled: true,
                        max_ad_entries: 5,
                        coin_entry_enabled: false,
                        coin_cost_per_entry: 100,
                        max_entries_per_user: 6,
                        winners_count: 1
                      });
                      setIsDrawModalOpen(true);
                    }}
                  >
                    <Plus size={16} style={{ marginRight: '6px' }} /> Launch New Sweepstakes
                  </button>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Draw Campaign Info</th>
                        <th>Type & Cost</th>
                        <th>Grand Prize Reward</th>
                        <th>Tickets Issued</th>
                        <th>Schedule Status</th>
                        <th>Winner Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {luckyDraws.map(draw => {
                        const isExpired = new Date(draw.end_time).getTime() <= Date.now();
                        return (
                          <tr key={draw.id}>
                            <td>
                              <strong>{draw.title}</strong>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>slug: {draw.slug}</div>
                            </td>
                            <td>
                              <span className={styles.lteBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>{draw.type}</span>
                              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                                {draw.free_entries_allowed ? 'Free Ticket ✓' : 'No Free Ticket'} | {draw.coin_entry_enabled ? `${draw.coin_cost_per_entry}c` : 'No Coin Ticket'}
                              </div>
                            </td>
                            <td>
                              <div style={{ color: '#d97706', fontWeight: '800' }}>{draw.prize_amount}</div>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>value: {draw.prize_value} ({draw.prize_type})</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', fontWeight: '700' }}>{draw.totalEntries || 0} Tickets</span>
                              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                                ads: {draw.adEntries || 0} | coins: {draw.coinEntries || 0} ({draw.participantsCount || 0} players)
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px' }}>Starts: {new Date(draw.start_time).toLocaleString()}</div>
                              <div style={{ fontSize: '12px', color: isExpired ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                                Ends: {new Date(draw.end_time).toLocaleString()} {isExpired ? '(Expired)' : ''}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.lteBadge} ${draw.status === 'active' ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                                {draw.status.toUpperCase()}
                              </span>
                              {draw.winners && draw.winners.length > 0 && (
                                <div style={{ fontSize: '11px', color: '#28a745', fontWeight: 'bold', marginTop: '4px' }}>
                                  ✓ {draw.winners.length} Winner(s) Selected
                                </div>
                              )}
                            </td>
                            <td>
                              <div className={styles.lteBtnGroup}>
                                <button
                                  className={`${styles.lteBtn} ${styles.lteBtnInfo}`}
                                  title="View Registered Tickets"
                                  onClick={() => handleViewEntries(draw.id)}
                                >
                                  <Users size={14} />
                                </button>
                                
                                {!draw.winners?.length && (
                                  <button
                                    className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                                    title="Manual Draw Roll Winners"
                                    onClick={() => handleRollWinners(draw.id)}
                                    style={{ background: '#f59e0b', borderColor: '#d97706' }}
                                  >
                                    <Trophy size={14} />
                                  </button>
                                )}

                                <button
                                  className={`${styles.lteBtn} ${styles.lteBtnWarning}`}
                                  title="Edit Sweepstakes"
                                  onClick={() => {
                                    setEditingDraw(draw);
                                    setDrawForm({
                                      ...draw,
                                      start_time: new Date(draw.start_time).toISOString().slice(0, 16),
                                      end_time: new Date(draw.end_time).toISOString().slice(0, 16)
                                    });
                                    setIsDrawModalOpen(true);
                                  }}
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                  title="Delete Sweepstakes"
                                  onClick={() => handleDeleteDraw(draw.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resolved Winners ledger */}
              <div className={styles.lteCard} style={{ marginTop: '24px' }}>
                <div className={styles.lteCardHeader}>
                  <h3 className={styles.lteCardTitle} style={{ color: '#d97706' }}>Resolved Winners Prize Ledger</h3>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Draw ID / Title</th>
                        <th>Winner Player info</th>
                        <th>Rank / Prize Reward</th>
                        <th>Status</th>
                        <th>Action Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {luckyDraws.filter(d => d.winners && d.winners.length > 0).flatMap(d => d.winners.map((win: any) => (
                        <tr key={win.id}>
                          <td>
                            <strong>{d.title}</strong>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Draw event ID: {d.id}</div>
                          </td>
                          <td>
                            <div><strong>{win.User?.first_name || 'Verified Player'}</strong></div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>@{win.User?.username || 'no_username'} (tg_id: {win.user_id})</div>
                          </td>
                          <td>
                            <strong style={{ color: '#28a745' }}>{win.prize_won}</strong>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Rank #{win.rank} winner slot</div>
                          </td>
                          <td>
                            <span className={`${styles.lteBadge} ${win.status === 'paid' ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                              {win.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`${styles.lteBtn} ${win.status === 'paid' ? styles.lteBtnDanger : styles.lteBtnSuccess}`}
                              onClick={() => handleMarkWinnerPaid(win.id, win.status)}
                            >
                              {win.status === 'paid' ? 'Mark Pending ⚠' : 'Mark Delivered ✓'}
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: SETTINGS ──── */}
          {activeView === 'settings' && appSettings && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader}>
                <h3 className={styles.lteCardTitle}>Global Ecosystem Variables</h3>
              </div>
              <div className={styles.lteCardBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Game Completion Reward (Coins)</label>
                    <input 
                      type="number"
                      className={styles.lteFormControl}
                      value={appSettings.game_reward_coins || 0}
                      onChange={(e) => setAppSettings({...appSettings, game_reward_coins: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Daily Game Payout Cap</label>
                    <input 
                      type="number"
                      className={styles.lteFormControl}
                      value={appSettings.game_limit_per_day || 0}
                      onChange={(e) => setAppSettings({...appSettings, game_limit_per_day: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className={styles.lteDivider}></div>
                <h4>Ad Network Integration Credentials</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>AdsGram Game Placement Block ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. 4376"
                      value={appSettings.adsgram_block_id || ''}
                      onChange={(e) => setAppSettings({...appSettings, adsgram_block_id: e.target.value})}
                    />
                  </div>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>AdsGram Daily Streak Block ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. 30393"
                      value={appSettings.adsgram_checkin_block_id || '30393'}
                      onChange={(e) => setAppSettings({...appSettings, adsgram_checkin_block_id: e.target.value})}
                    />
                  </div>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>AdsGram Lucky Draw Block ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. 30394"
                      value={appSettings.adsgram_draw_block_id || '30394'}
                      onChange={(e) => setAppSettings({...appSettings, adsgram_draw_block_id: e.target.value})}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Monetag Integration Zone ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. 10977311"
                      value={appSettings.monetag_zone_id || ''}
                      onChange={(e) => setAppSettings({...appSettings, monetag_zone_id: e.target.value})}
                    />
                  </div>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>PubScale App Hash ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. 78594689"
                      value={appSettings.pubscale_app_id || ''}
                      onChange={(e) => setAppSettings({...appSettings, pubscale_app_id: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.lteFormGroup} style={{ marginTop: '15px' }}>
                  <label className={styles.lteFormLabel}>Opinion Universe Custom Offerwall Link</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="https://..."
                    value={appSettings.opinion_universe_url || ''}
                    onChange={(e) => setAppSettings({...appSettings, opinion_universe_url: e.target.value})}
                  />
                </div>

                <div className={styles.lteDivider}></div>
                <h4>Global Feature Toggles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  <div className={styles.lteToggleBox}>
                    <span>Enable AdsGram Monetization</span>
                    <input type="checkbox" checked={appSettings.adsgram_enabled ?? true} onChange={(e) => setAppSettings({...appSettings, adsgram_enabled: e.target.checked})} />
                  </div>
                  <div className={styles.lteToggleBox}>
                    <span>Enable Monetag SDK ads</span>
                    <input type="checkbox" checked={appSettings.monetag_enabled ?? true} onChange={(e) => setAppSettings({...appSettings, monetag_enabled: e.target.checked})} />
                  </div>
                  <div className={styles.lteToggleBox}>
                    <span>Enable PubScale Offerwalls</span>
                    <input type="checkbox" checked={appSettings.pubscale_enabled ?? true} onChange={(e) => setAppSettings({...appSettings, pubscale_enabled: e.target.checked})} />
                  </div>
                  <div className={styles.lteToggleBox}>
                    <span>PubScale Sandbox Mode (Staging)</span>
                    <input type="checkbox" checked={appSettings.pubscale_sandbox ?? false} onChange={(e) => setAppSettings({...appSettings, pubscale_sandbox: e.target.checked})} />
                  </div>
                  <div className={styles.lteToggleBox}>
                    <span>Enable Opinion Universe Offerwalls</span>
                    <input type="checkbox" checked={appSettings.opinion_universe_enabled ?? true} onChange={(e) => setAppSettings({...appSettings, opinion_universe_enabled: e.target.checked})} />
                  </div>
                  <div className={styles.lteToggleBox}>
                    <span>Onboarding Membership Overlay</span>
                    <input type="checkbox" checked={appSettings.onboarding_verification_enabled ?? true} onChange={(e) => setAppSettings({...appSettings, onboarding_verification_enabled: e.target.checked})} />
                  </div>
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid #dee2e6', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleUpdateAppSettings}>
                    <Save size={16} style={{ marginRight: '6px' }} /> Save System Configurations
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ──── MODAL: EDIT USER ──── */}
      {editingUser && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>Modify Profile Settings: {editingUser.first_name}</h4>
              <button className={styles.lteModalClose} onClick={() => setEditingUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>User Account Wallet Balance (Coins)</label>
                <input 
                  type="number" 
                  className={styles.lteFormControl}
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div 
                  className={`${styles.lteSelectableBox} ${editingUser.is_phone_verified ? styles.lteSelectableBoxActive : ''}`}
                  onClick={() => setEditingUser({...editingUser, is_phone_verified: !editingUser.is_phone_verified})}
                >
                  <ShieldCheck size={24} color={editingUser.is_phone_verified ? '#28a745' : '#6c757d'} />
                  <span>Phone Verified</span>
                </div>
                <div 
                  className={`${styles.lteSelectableBox} ${editingUser.is_channel_joined ? styles.lteSelectableBoxActive : ''}`}
                  onClick={() => setEditingUser({...editingUser, is_channel_joined: !editingUser.is_channel_joined})}
                >
                  <Users size={24} color={editingUser.is_channel_joined ? '#17a2b8' : '#6c757d'} />
                  <span>Social Synced</span>
                </div>
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setEditingUser(null)}>Dismiss</button>
              <button 
                className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                onClick={() => handleUpdateUser(editingUser.telegram_id, { 
                  balance: parseInt(newBalance),
                  is_phone_verified: editingUser.is_phone_verified,
                  is_channel_joined: editingUser.is_channel_joined
                })}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: EDIT PAYOUT GATEWAY ──── */}
      {isPayoutModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>{editingPayout ? 'Configure Gateway' : 'New Gateway'}</h4>
              <button className={styles.lteModalClose} onClick={() => setIsPayoutModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Gateway Title</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. UPI, Amazon Pay"
                    value={payoutForm.name}
                    onChange={(e) => setPayoutForm({...payoutForm, name: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Gateway Brand Image URI</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="https://..."
                    value={payoutForm.logo_url}
                    onChange={(e) => setPayoutForm({...payoutForm, logo_url: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Gateway Display Priority</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={payoutForm.order_index}
                    onChange={(e) => setPayoutForm({...payoutForm, order_index: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Operation Mode</label>
                  <select 
                    className={styles.lteFormControl}
                    value={payoutForm.status}
                    onChange={(e) => setPayoutForm({...payoutForm, status: e.target.value})}
                  >
                    <option value="active">Operational</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Coins Payout Conversion Ratio</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="₹1 = 100 Coins"
                    value={payoutForm.conversion_rate}
                    onChange={(e) => setPayoutForm({...payoutForm, conversion_rate: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Service / Gateway Surcharges</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="0% Fees"
                    value={payoutForm.fee_text}
                    onChange={(e) => setPayoutForm({...payoutForm, fee_text: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                <label className={styles.lteFormLabel}>Redemption Policy Disclaimer</label>
                <textarea 
                  className={styles.lteFormControl}
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="Gateway settlement timelines or limits..."
                  value={payoutForm.disclaimer}
                  onChange={(e) => setPayoutForm({...payoutForm, disclaimer: e.target.value})}
                />
              </div>

              {/* Dynamic Payout Fields Builder */}
              <div style={{ borderTop: '1px solid #dee2e6', marginTop: '15px', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5>Required User Fields</h5>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnSuccess}`} 
                    onClick={() => setPayoutForm({
                      ...payoutForm, 
                      custom_inputs: [...payoutForm.custom_inputs, { name: '', placeholder: '' }]
                    })}
                  >
                    + Add Field
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {payoutForm.custom_inputs.map((input, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                      <input 
                        className={styles.lteFormControl}
                        placeholder="Field Label (e.g. UPI ID)"
                        value={input.name}
                        onChange={(e) => {
                          const newInputs = [...payoutForm.custom_inputs];
                          newInputs[idx].name = e.target.value;
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      />
                      <input 
                        className={styles.lteFormControl}
                        placeholder="Placeholder helper"
                        value={input.placeholder}
                        onChange={(e) => {
                          const newInputs = [...payoutForm.custom_inputs];
                          newInputs[idx].placeholder = e.target.value;
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      />
                      <button 
                        className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                        onClick={() => {
                          const newInputs = payoutForm.custom_inputs.filter((_, i) => i !== idx);
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiers Builder */}
              <div style={{ borderTop: '1px solid #dee2e6', marginTop: '15px', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5>Redemption Tiers</h5>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnInfo}`} 
                    onClick={() => setTiersForm([...tiersForm, { amount_text: '', coins_required: 0 }])}
                  >
                    + Add Reward Tier
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {tiersForm.map((tier, idx) => (
                    <div key={idx} className={styles.lteTierBuilderCard}>
                      <div className={styles.lteFormGroup} style={{ marginBottom: '5px' }}>
                        <label style={{ fontSize: '11px' }}>Payout Value</label>
                        <input 
                          className={styles.lteFormControl}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="e.g. ₹50"
                          value={tier.amount_text}
                          onChange={(e) => {
                            const newTiers = [...tiersForm];
                            newTiers[idx].amount_text = e.target.value;
                            setTiersForm(newTiers);
                          }}
                        />
                      </div>
                      <div className={styles.lteFormGroup} style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11px' }}>Coin Cost</label>
                        <input 
                          type="number"
                          className={styles.lteFormControl}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="5000"
                          value={tier.coins_required}
                          onChange={(e) => {
                            const newTiers = [...tiersForm];
                            newTiers[idx].coins_required = parseInt(e.target.value);
                            setTiersForm(newTiers);
                          }}
                        />
                      </div>
                      <button 
                        className={styles.lteTierBuilderRemove}
                        onClick={() => {
                          const newTiers = tiersForm.filter((_, i) => i !== idx);
                          setTiersForm(newTiers);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setIsPayoutModalOpen(false)}>Discard</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleSavePayout}>Commit Gateway Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: EDIT TOURNAMENT (CONTEST) ──── */}
      {isContestModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>{editingContest ? 'Edit Contest Settings' : 'Launch New Contest'}</h4>
              <button className={styles.lteModalClose} onClick={() => setIsContestModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Tournament / Challenge Title</label>
                <input 
                  className={styles.lteFormControl}
                  placeholder="Weekly Top earner challenge"
                  value={contestForm.name}
                  onChange={(e) => setContestForm({...contestForm, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Slug Link Parameter</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="weekly-earning"
                    value={contestForm.slug}
                    onChange={(e) => setContestForm({...contestForm, slug: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Leaderboard Tracking Metric</label>
                  <select 
                    className={styles.lteFormControl}
                    value={contestForm.type}
                    onChange={(e) => setContestForm({...contestForm, type: e.target.value as any})}
                  >
                    <option value="earning">Earning Coins Volume</option>
                    <option value="referral">Referral Invitation Volume</option>
                    <option value="streak">Daily Streak Days Count</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Start Time (Local/UTC)</label>
                  <input 
                    type="datetime-local"
                    className={styles.lteFormControl}
                    value={contestForm.start_time}
                    onChange={(e) => setContestForm({...contestForm, start_time: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>End Time (Local/UTC)</label>
                  <input 
                    type="datetime-local"
                    className={styles.lteFormControl}
                    value={contestForm.end_time}
                    onChange={(e) => setContestForm({...contestForm, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Prize Pool Text Display</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="₹5000"
                    value={contestForm.prize_pool_text}
                    onChange={(e) => setContestForm({...contestForm, prize_pool_text: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Ecosystem Status Mode</label>
                  <select 
                    className={styles.lteFormControl}
                    value={contestForm.status}
                    onChange={(e) => setContestForm({...contestForm, status: e.target.value as any})}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              {editingContest && (
                <div style={{ borderTop: '1px solid #dee2e6', marginTop: '15px', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h5>Reward Tiers Distribution</h5>
                    <button 
                      className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                      onClick={() => {
                        const rank = prompt("Enter Rank boundary From:");
                        const value = prompt("Enter reward Token Coins:");
                        const text = prompt("Enter cash prize text display (e.g. ₹500):");
                        if (rank && value) {
                          handleAddContestReward(editingContest.id, {
                            rank_from: parseInt(rank),
                            rank_to: parseInt(rank),
                            reward_value: parseInt(value),
                            reward_text: text || `${value} Coins`
                          });
                        }
                      }}
                    >
                      + Add Payout boundary
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editingContest.rewards?.map((r: any) => (
                      <div key={r.id} style={{ background: '#e2f0d9', color: '#385723', padding: '6px 12px', borderRadius: '8px', border: '1px solid #c5e0b4', fontSize: '12px' }}>
                        Rank {r.rank_from}: <strong>{r.reward_text}</strong> ({r.reward_value} c)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setIsContestModalOpen(false)}>Cancel</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleSaveContest}>Save Contest Information</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: EDIT LUCKY DRAW EVENT ──── */}
      {isDrawModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '650px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>{editingDraw ? 'Edit Lucky Draw Event' : 'Launch New Sweepstakes Event'}</h4>
              <button className={styles.lteModalClose} onClick={() => setIsDrawModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Sweepstakes Campaign Title</label>
                <input 
                  className={styles.lteFormControl}
                  placeholder="e.g. 💰 Daily Free Draw"
                  value={drawForm.title}
                  onChange={(e) => setDrawForm({...drawForm, title: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>URL Slug Parameter</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. daily-free-draw"
                    value={drawForm.slug}
                    onChange={(e) => setDrawForm({...drawForm, slug: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Sweepstakes Event Type</label>
                  <select 
                    className={styles.lteFormControl}
                    value={drawForm.type}
                    onChange={(e) => setDrawForm({...drawForm, type: e.target.value as any})}
                  >
                    <option value="daily_free">Daily Free Draw</option>
                    <option value="weekly_mega">Weekly Mega Draw</option>
                    <option value="coin_jackpot">Coin Jackpot Pot</option>
                    <option value="referral_draw">Referral Draw Event</option>
                    <option value="watch_win">Watch & Win ad Campaign</option>
                    <option value="flash_draw">Flash Draw Event</option>
                    <option value="special_event">Mega Giveaway Event</option>
                  </select>
                </div>
              </div>

              <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                <label className={styles.lteFormLabel}>Banner Display Image URL</label>
                <input 
                  className={styles.lteFormControl}
                  placeholder="https://images.unsplash.com/..."
                  value={drawForm.banner_image}
                  onChange={(e) => setDrawForm({...drawForm, banner_image: e.target.value})}
                />
              </div>

              <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                <label className={styles.lteFormLabel}>Event Short Description</label>
                <textarea 
                  className={styles.lteFormControl}
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="Rules, requirements, or terms for this draw..."
                  value={drawForm.description}
                  onChange={(e) => setDrawForm({...drawForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Prize Type</label>
                  <select 
                    className={styles.lteFormControl}
                    value={drawForm.prize_type}
                    onChange={(e) => setDrawForm({...drawForm, prize_type: e.target.value})}
                  >
                    <option value="coins">Reward Coins</option>
                    <option value="cash">Real Cash (Paytm/UPI)</option>
                    <option value="gift_card">Gift Cards</option>
                    <option value="item">Physical Item</option>
                  </select>
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Prize Text (e.g. ₹500)</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="₹500 Paytm"
                    value={drawForm.prize_amount}
                    onChange={(e) => setDrawForm({...drawForm, prize_amount: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Prize Integer Value</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={drawForm.prize_value}
                    onChange={(e) => setDrawForm({...drawForm, prize_value: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Max Tickets / User</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={drawForm.max_entries_per_user}
                    onChange={(e) => setDrawForm({...drawForm, max_entries_per_user: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Winners Slot Count</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={drawForm.winners_count}
                    onChange={(e) => setDrawForm({...drawForm, winners_count: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Draw Status Mode</label>
                  <select 
                    className={styles.lteFormControl}
                    value={drawForm.status}
                    onChange={(e) => setDrawForm({...drawForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended/Expired</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Start Time (Local/UTC)</label>
                  <input 
                    type="datetime-local"
                    className={styles.lteFormControl}
                    value={drawForm.start_time}
                    onChange={(e) => setDrawForm({...drawForm, start_time: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>End Time (Local/UTC)</label>
                  <input 
                    type="datetime-local"
                    className={styles.lteFormControl}
                    value={drawForm.end_time}
                    onChange={(e) => setDrawForm({...drawForm, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.lteDivider} style={{ margin: '15px 0' }}></div>
              <h5>🎫 Entry Methods Configuration</h5>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteToggleBox}>
                  <span>Allow Daily Free Ticket Entry</span>
                  <input 
                    type="checkbox" 
                    checked={drawForm.free_entries_allowed} 
                    onChange={(e) => setDrawForm({...drawForm, free_entries_allowed: e.target.checked})} 
                  />
                </div>
                <div className={styles.lteToggleBox}>
                  <span>Enable AdsGram Ad Ticket Entries</span>
                  <input 
                    type="checkbox" 
                    checked={drawForm.ad_entries_enabled} 
                    onChange={(e) => setDrawForm({...drawForm, ad_entries_enabled: e.target.checked})} 
                  />
                </div>
              </div>

              {drawForm.ad_entries_enabled && (
                <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                  <label className={styles.lteFormLabel}>Maximum Ad Tickets Allowed Per Day</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={drawForm.max_ad_entries}
                    onChange={(e) => setDrawForm({...drawForm, max_ad_entries: parseInt(e.target.value)})}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteToggleBox}>
                  <span>Enable Coins Purchased Tickets</span>
                  <input 
                    type="checkbox" 
                    checked={drawForm.coin_entry_enabled} 
                    onChange={(e) => setDrawForm({...drawForm, coin_entry_enabled: e.target.checked})} 
                  />
                </div>
                {drawForm.coin_entry_enabled && (
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Coins Cost Per Ticket</label>
                    <input 
                      type="number"
                      className={styles.lteFormControl}
                      value={drawForm.coin_cost_per_entry}
                      onChange={(e) => setDrawForm({...drawForm, coin_cost_per_entry: parseInt(e.target.value)})}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setIsDrawModalOpen(false)}>Discard</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleSaveDraw}>Commit Sweepstakes Event</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: VIEW LUCKY DRAW PARTICIPANTS / ENTRIES ──── */}
      {isEntriesModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '600px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>Registered Entry Tickets List (Draw ID: {viewingDrawId})</h4>
              <button className={styles.lteModalClose} onClick={() => setIsEntriesModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <strong>Total Tickets In Play: {selectedDrawEntries.length}</strong>
                <span className={styles.lteBadge} style={{ background: '#fef3c7', color: '#b45309' }}>Weighted Sweepstakes active</span>
              </div>
              
              <table className={styles.lteTable}>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Participant Name</th>
                    <th>Ticket Source</th>
                    <th>Registered Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDrawEntries.length > 0 ? (
                    selectedDrawEntries.map((e: any, index: number) => (
                      <tr key={e.id}>
                        <td><code>T-{e.id}</code></td>
                        <td>
                          <strong>{e.User?.first_name || 'Verified Player'}</strong>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>@{e.User?.username || 'no_username'} (tg: {e.user_id})</div>
                        </td>
                        <td>
                          <span className={styles.lteBadge} style={
                            e.entry_source === 'ad' ? { background: '#dbeafe', color: '#1e40af' } :
                            e.entry_source === 'coins' ? { background: '#f3e8ff', color: '#6b21a8' } :
                            { background: '#d1fae5', color: '#065f46' }
                          }>
                            {e.entry_source.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(e.created_at || e.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No tickets registered for this draw event yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={() => setIsEntriesModalOpen(false)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: NEW VISIT TASK ──── */}
      {isVisitModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '450px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>Launch Visit Campaign Task</h4>
              <button className={styles.lteModalClose} onClick={() => setIsVisitModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Campaign Action Title</label>
                <input className={styles.lteFormControl} value={visitForm.title} onChange={e => setVisitForm({...visitForm, title: e.target.value})} placeholder="e.g. Visit Our YouTube Channel" />
              </div>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Campaign Target Action URL</label>
                <input className={styles.lteFormControl} value={visitForm.url} onChange={e => setVisitForm({...visitForm, url: e.target.value})} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Payout Reward (Coins)</label>
                  <input type="number" className={styles.lteFormControl} value={visitForm.reward_amount} onChange={e => setVisitForm({...visitForm, reward_amount: parseInt(e.target.value)})} />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Task Timer Limit (Seconds)</label>
                  <input type="number" className={styles.lteFormControl} value={visitForm.timer_seconds} onChange={e => setVisitForm({...visitForm, timer_seconds: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setIsVisitModalOpen(false)}>Cancel</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/admin/visit-tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                    credentials: 'include',
                    body: JSON.stringify(visitForm)
                  });
                  if (res.ok) {
                    showToast("Visit task created successfully");
                    setIsVisitModalOpen(false);
                    fetchAllData(secret);
                  }
                } catch (err) { showToast("Error creating task", "error"); }
              }}>Create Visit Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
