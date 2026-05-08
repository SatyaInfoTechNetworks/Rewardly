"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { 
  Users, Coins, Activity, ShieldCheck, Search, 
  LayoutDashboard, History, Settings, LogOut, 
  Edit3, Trash2, Ban, CheckCircle2, X, Gift, ArrowUpRight, Menu, Trophy, Calendar
} from "lucide-react";

export default function AdminPanel() {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'payouts'>('users');
  const [users, setUsers] = useState<any[]>([]);
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
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
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

  if (loading) return <div className={styles.adminContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Rewardly Admin...</div>;

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

  if (!isAuthenticated) {
    return (
      <div className={styles.loginOverlay}>
        <div className={styles.loginBox}>
          <ShieldCheck size={64} color="#38bdf8" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.4))' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Admin Access</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '2.5rem' }}>Secure access to Rewardly Dashboard</p>
          <div className={styles.formGroup}>
            <input 
              type="password" 
              className={styles.formInput} 
              placeholder="Enter Secret Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAllData(secret)}
              style={{ textAlign: 'center', letterSpacing: '4px' }}
            />
          </div>
          <button className={styles.btnPrimary} style={{ width: '100%', marginTop: '1rem' }} onClick={() => fetchAllData(secret)}>
            Authorize Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          padding: '1rem 2rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          borderRadius: '1rem',
          zIndex: 3000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          fontWeight: 600,
          animation: 'modalAppear 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>R</div>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.03em' }}>Rewardly</span>
        </div>

        <nav className={styles.navMenu}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'payouts', icon: Gift, label: 'Payout Methods' },
            { id: 'referrals', icon: Users, label: 'Referral System' },
            { id: 'contests', icon: Trophy, label: 'Contest System' },
            { id: 'withdrawals', icon: ArrowUpRight, label: 'Withdrawals' },
            { id: 'transactions', icon: History, label: 'Audit Log' },
            { id: 'daily_rewards', icon: Calendar, label: 'Check-in Rewards' },
            { id: 'visit_tasks', icon: Globe, label: 'Visit Tasks' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <div 
              key={item.id}
              className={`${styles.navItem} ${activeView === item.id ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setIsSidebarOpen(false);
              }}
            >
              <item.icon size={22} /> {item.label}
            </div>
          ))}
        </nav>

        <div 
          className={styles.navItem} 
          style={{ marginTop: 'auto', color: '#f87171' }}
          onClick={() => {
            localStorage.removeItem("admin_secret");
            setIsAuthenticated(false);
          }}
        >
          <LogOut size={22} /> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {activeView === 'dashboard' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
              <p className={styles.sectionDesc}>Real-time performance and ecosystem growth</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Active Users</div>
                  <Users className={styles.statIcon} size={24} />
                </div>
                <div className={styles.statValue}>{stats?.totalUsers?.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Platform Circulation</div>
                  <Coins className={styles.statIcon} size={24} />
                </div>
                <div className={styles.statValue}>{stats?.totalBalance?.toLocaleString()} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>coins</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Processed Events</div>
                  <Activity className={styles.statIcon} size={24} />
                </div>
                <div className={styles.statValue}>{stats?.totalTransactions?.toLocaleString()}</div>
              </div>
            </div>
          </section>
        )}

        {activeView === 'users' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>User Management</h2>
              <p className={styles.sectionDesc}>Administer accounts, security status, and balances</p>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableActions}>
                <div className={styles.searchBox}>
                  <Search size={20} color="#38bdf8" />
                  <input className={styles.searchInput} placeholder="Search user ID or name..." />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Identity</th>
                      <th>Account Info</th>
                      <th>Social Sync</th>
                      <th>Assets</th>
                      <th>Access</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.telegram_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {user.photo_url ? (
                              <img src={user.photo_url} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                            ) : (
                              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #38bdf8, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                                {(user.first_name || 'U')[0]}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{user.first_name} {user.last_name}</div>
                              <div style={{ fontSize: '0.8125rem', color: '#38bdf8', fontWeight: 500 }}>@{user.username || 'no_username'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ color: '#fff', fontWeight: 500 }}>ID: {user.telegram_id}</div>
                            <div style={{ color: '#64748b' }}>Tel: {user.phone_number || 'No Phone'}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div title="Phone Verified" style={{ opacity: user.is_phone_verified ? 1 : 0.2 }}>
                              <ShieldCheck size={20} color="#4ade80" />
                            </div>
                            <div title="Channel Joined" style={{ opacity: user.is_channel_joined ? 1 : 0.2 }}>
                              <Users size={20} color="#38bdf8" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '1rem' }}>{user.balance?.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>Coins</span></div>
                            {user.pending_balance > 0 && <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>+ {user.pending_balance?.toLocaleString()} pending</div>}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${user.is_banned ? styles.badgeBanned : styles.badgeActive}`}>
                            {user.is_banned ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                            {user.is_banned ? 'Restricted' : 'Authorized'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className={styles.actionBtn} title="Edit User" onClick={() => {
                              setEditingUser(user);
                              setNewBalance(user.balance.toString());
                            }}>
                              <Edit3 size={18} />
                            </button>
                            <button 
                              className={`${styles.actionBtn} ${user.is_banned ? '' : styles.btnDanger}`}
                              title={user.is_banned ? "Unban" : "Ban User"}
                              onClick={() => handleUpdateUser(user.telegram_id, { is_banned: !user.is_banned })}
                            >
                              <Ban size={18} />
                            </button>
                            <button className={`${styles.actionBtn} ${styles.btnDanger}`} title="Delete User" onClick={() => handleDeleteUser(user.telegram_id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeView === 'payouts' && (
          <section>
            <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className={styles.sectionTitle}>Payout Methods</h2>
                <p className={styles.sectionDesc}>Configure withdrawal gateways and reward tiers</p>
              </div>
              <button 
                className={styles.addBtn} 
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
                + Create New Method
              </button>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Gateway</th>
                    <th>Redemption Tiers</th>
                    <th>System Order</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutMethods.map(method => (
                    <tr key={method.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                            {method.logo_url && <img src={method.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{method.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{method.conversion_rate}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {method.tiers?.map((t: any) => (
                            <span key={t.id} style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(56,189,248,0.1)' }}>
                              {t.amount_text} <span style={{ color: '#64748b', fontWeight: 400 }}>({t.coins_required})</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#94a3b8' }}>Priority: {method.order_index}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${method.status === 'active' ? styles.badgeActive : styles.badgeBanned}`}>
                          {method.status === 'active' ? 'Operational' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className={styles.actionBtn}
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
                            <Edit3 size={18} />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.btnDanger}`}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'withdrawals' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Withdrawal Requests</h2>
              <p className={styles.sectionDesc}>Process and manage user payout requests</p>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Method</th>
                    <th>Payment Value</th>
                    <th>Recipient Details</th>
                    <th>State</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {(req.User?.first_name || 'U')[0]}
                           </div>
                           <div>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{req.User?.first_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{req.User?.username}</div>
                           </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{req.PayoutMethod?.name}</div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{req.amount_text}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{req.coins_used} coins used</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem', fontFamily: 'monospace', color: '#38bdf8' }}>
                          {req.payout_details}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          req.status === 'approved' ? styles.badgeActive : 
                          req.status === 'pending' ? styles.badgeBanned.replace('Banned', 'Pending') : styles.badgeBanned
                        }`} style={req.status === 'pending' ? { background: 'rgba(251,191,36,0.1)', color: '#fbbf24' } : {}}>
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {req.status === 'pending' && (
                            <>
                              <button 
                                className={styles.actionBtn}
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                                onClick={() => handleUpdateWithdrawal(req.id, 'approved')}
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                className={styles.actionBtn}
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                onClick={() => handleUpdateWithdrawal(req.id, 'rejected')}
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'contests' && (
          <section>
            <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className={styles.sectionTitle}>Contest System</h2>
                <p className={styles.sectionDesc}>Create and manage platform-wide challenges</p>
              </div>
              <button 
                className={styles.addBtn} 
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
                + Start New Contest
              </button>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Challenge</th>
                    <th>Type</th>
                    <th>Timing</th>
                    <th>Prize Pool</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contests.map(contest => (
                    <tr key={contest.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{contest.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>/{contest.slug}</div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>{contest.type}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                          Ends: {new Date(contest.end_time).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>{contest.prize_pool_text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{contest.rewards?.length || 0} Reward Tiers</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${contest.status === 'active' ? styles.badgeActive : styles.badgeBanned}`}>
                          {contest.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className={styles.actionBtn} onClick={() => {
                            setEditingContest(contest);
                            setContestForm({
                              ...contest,
                              start_time: new Date(contest.start_time).toISOString().slice(0, 16),
                              end_time: new Date(contest.end_time).toISOString().slice(0, 16)
                            });
                            setIsContestModalOpen(true);
                          }}>
                            <Edit3 size={18} />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={() => handleDeleteContest(contest.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'transactions' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Audit History</h2>
              <p className={styles.sectionDesc}>Comprehensive log of all platform financial movements</p>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Interaction Type</th>
                    <th>Value Change</th>
                    <th>Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{tx.telegram_id}</td>
                      <td>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
                          {tx.type}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: tx.amount > 0 ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: '1rem' }}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>{tx.description}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'referrals' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Referral System</h2>
              <p className={styles.sectionDesc}>Configure invitation rewards, welcome bonuses, and milestones</p>
            </div>

            <div className={styles.statsGrid} style={{ marginBottom: '2rem' }}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                   <div className={styles.statLabel}>Total Invitations</div>
                   <Users size={20} className={styles.statIcon} />
                </div>
                <div className={styles.statValue}>{referralStats?.totalInvites || 0}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                   <div className={styles.statLabel}>Qualified Referrals</div>
                   <CheckCircle2 size={20} className={styles.statIcon} />
                </div>
                <div className={styles.statValue}>{referralStats?.rewardedInvites || 0}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                   <div className={styles.statLabel}>Conversion Rate</div>
                   <Activity size={20} className={styles.statIcon} />
                </div>
                <div className={styles.statValue}>{referralStats?.conversionRate || 0}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
              {/* Settings Column */}
              <div className={styles.tableCard} style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>General Settings</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Welcome Bonus (Invitee)</label>
                  <input 
                    type="number" className={styles.formInput} 
                    value={referralSettings?.welcome_bonus} 
                    onChange={(e) => setReferralSettings({...referralSettings, welcome_bonus: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Referrer Reward (Inviter)</label>
                  <input 
                    type="number" className={styles.formInput} 
                    value={referralSettings?.referral_reward} 
                    onChange={(e) => setReferralSettings({...referralSettings, referral_reward: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reward Trigger</label>
                  <select 
                    className={styles.formInput}
                    value={referralSettings?.reward_trigger}
                    onChange={(e) => setReferralSettings({...referralSettings, reward_trigger: e.target.value})}
                  >
                    <option value="signup">Immediate Signup</option>
                    <option value="earning">Minimum Earnings Met</option>
                    <option value="redeem_request">First Redeem Requested</option>
                    <option value="redeem_approved">First Redeem Approved (Best)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Min Redeem for Reward (₹)</label>
                  <input 
                    type="number" className={styles.formInput} 
                    value={referralSettings?.min_redeem_amount} 
                    onChange={(e) => setReferralSettings({...referralSettings, min_redeem_amount: parseInt(e.target.value)})}
                  />
                </div>
                
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(239,68,68,0.05)', borderRadius: '1rem', border: '1px solid rgba(239,68,68,0.1)' }}>
                   <h4 style={{ color: '#f87171', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>Fraud Protection</h4>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Block Same Device</span>
                      <input type="checkbox" checked={referralSettings?.same_device_block} onChange={(e) => setReferralSettings({...referralSettings, same_device_block: e.target.checked})} />
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem' }}>VPN/Proxy Detection</span>
                      <input type="checkbox" checked={referralSettings?.vpn_detection} onChange={(e) => setReferralSettings({...referralSettings, vpn_detection: e.target.checked})} />
                   </div>
                </div>

                <button className={styles.btnPrimary} style={{ width: '100%', marginTop: '2rem' }} onClick={handleUpdateReferralSettings}>
                   Save Configuration
                </button>
              </div>

              {/* Milestones Column */}
              <div className={styles.tableCard} style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, color: '#4ade80' }}>Volume Milestones</h3>
                    <button className={styles.addBtn} style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => handleSaveMilestone({ required_referrals: 0, reward_coins: 0 })}>+ Add Milestone</button>
                 </div>
                 
                 <table className={styles.adminTable}>
                    <thead>
                       <tr>
                          <th>Invites Req.</th>
                          <th>Bonus Coins</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                       {referralMilestones.map(m => (
                         <tr key={m.id}>
                            <td>
                               <input 
                                 type="number" className={styles.formInput} 
                                 style={{ padding: '4px 8px', width: '80px' }} 
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
                                 type="number" className={styles.formInput} 
                                 style={{ padding: '4px 8px', width: '100px', fontWeight: 700, color: '#4ade80' }} 
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
                               <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className={styles.actionBtn} title="Save" onClick={() => handleSaveMilestone(m)}><CheckCircle2 size={16} color="#10b981" /></button>
                                  <button className={styles.actionBtn} title="Delete" style={{ color: '#f87171' }} onClick={() => handleDeleteMilestone(m.id)}><Trash2 size={16} /></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Profile Settings: {editingUser.first_name}</h3>
              <X className={styles.actionBtn} onClick={() => setEditingUser(null)} />
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Wallet Balance (Coins)</label>
                <input 
                  type="number" 
                  className={styles.formInput}
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <div 
                  style={{ 
                    padding: '1.25rem', 
                    background: 'var(--bg-input)', 
                    borderRadius: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: editingUser.is_phone_verified ? '#4ade80' : 'var(--border-subtle)',
                    transition: 'var(--transition-fast)'
                  }}
                  onClick={() => setEditingUser({...editingUser, is_phone_verified: !editingUser.is_phone_verified})}
                >
                  <ShieldCheck size={28} color={editingUser.is_phone_verified ? "#4ade80" : "#475569"} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Phone Verified</span>
                </div>

                <div 
                  style={{ 
                    padding: '1.25rem', 
                    background: 'var(--bg-input)', 
                    borderRadius: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: editingUser.is_channel_joined ? '#38bdf8' : 'var(--border-subtle)',
                    transition: 'var(--transition-fast)'
                  }}
                  onClick={() => setEditingUser({...editingUser, is_channel_joined: !editingUser.is_channel_joined})}
                >
                  <Users size={28} color={editingUser.is_channel_joined ? "#38bdf8" : "#475569"} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Social Synced</span>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setEditingUser(null)}>Dismiss</button>
              <button 
                className={styles.btnPrimary}
                onClick={() => handleUpdateUser(editingUser.telegram_id, { 
                  balance: parseInt(newBalance),
                  is_phone_verified: editingUser.is_phone_verified,
                  is_channel_joined: editingUser.is_channel_joined
                })}
              >
                Update Identity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Editor Modal */}
      {isPayoutModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {editingPayout ? 'Configure Gateway' : 'New Gateway'}
              </h3>
              <X className={styles.actionBtn} onClick={() => setIsPayoutModalOpen(false)} />
            </div>

            <div className={styles.modalContent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gateway Name</label>
                  <input 
                    className={styles.formInput}
                    placeholder="e.g. UPI, Amazon Pay"
                    value={payoutForm.name}
                    onChange={(e) => setPayoutForm({...payoutForm, name: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Branding (Logo URI)</label>
                  <input 
                    className={styles.formInput}
                    placeholder="https://..."
                    value={payoutForm.logo_url}
                    onChange={(e) => setPayoutForm({...payoutForm, logo_url: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Display Priority</label>
                  <input 
                    type="number"
                    className={styles.formInput}
                    value={payoutForm.order_index}
                    onChange={(e) => setPayoutForm({...payoutForm, order_index: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Operational Status</label>
                  <select 
                    className={styles.formInput}
                    value={payoutForm.status}
                    onChange={(e) => setPayoutForm({...payoutForm, status: e.target.value})}
                  >
                    <option value="active">Operational</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Conversion Reference</label>
                  <input 
                    className={styles.formInput}
                    placeholder="₹1 = 100 Coins"
                    value={payoutForm.conversion_rate}
                    onChange={(e) => setPayoutForm({...payoutForm, conversion_rate: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Transaction Surcharge</label>
                  <input 
                    className={styles.formInput}
                    placeholder="0% Fees"
                    value={payoutForm.fee_text}
                    onChange={(e) => setPayoutForm({...payoutForm, fee_text: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                <label className={styles.formLabel}>Redemption Policy / Disclaimer</label>
                <textarea 
                  className={styles.formInput}
                  style={{ height: '100px', resize: 'none' }}
                  placeholder="Legal requirements or payout timelines..."
                  value={payoutForm.disclaimer}
                  onChange={(e) => setPayoutForm({...payoutForm, disclaimer: e.target.value})}
                />
              </div>

              {/* Dynamic Inputs Builder */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#38bdf8', fontSize: '1.1rem' }}>Required User Inputs</h4>
                  <button 
                    className={styles.addBtn} 
                    style={{ fontSize: '0.8125rem' }}
                    onClick={() => setPayoutForm({
                      ...payoutForm, 
                      custom_inputs: [...payoutForm.custom_inputs, { name: '', placeholder: '' }]
                    })}
                  >
                    + Add Field
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {payoutForm.custom_inputs.map((input, idx) => (
                    <div key={idx} className={styles.fieldCard}>
                      <input 
                        className={styles.formInput}
                        placeholder="Label (e.g. Account Number)"
                        value={input.name}
                        onChange={(e) => {
                          const newInputs = [...payoutForm.custom_inputs];
                          newInputs[idx].name = e.target.value;
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      />
                      <input 
                        className={styles.formInput}
                        placeholder="Placeholder Text"
                        value={input.placeholder}
                        onChange={(e) => {
                          const newInputs = [...payoutForm.custom_inputs];
                          newInputs[idx].placeholder = e.target.value;
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      />
                      <button 
                        className={styles.actionBtn}
                        style={{ color: '#f87171' }}
                        onClick={() => {
                          const newInputs = payoutForm.custom_inputs.filter((_, i) => i !== idx);
                          setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiers Builder */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#4ade80', fontSize: '1.1rem' }}>Redemption Tiers</h4>
                  <button 
                    className={styles.addBtn} 
                    style={{ fontSize: '0.8125rem', borderColor: '#4ade80', color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}
                    onClick={() => setTiersForm([...tiersForm, { amount_text: '', coins_required: 0 }])}
                  >
                    + Add Reward Tier
                  </button>
                </div>
                <div className={styles.tierGrid}>
                  {tiersForm.map((tier, idx) => (
                    <div key={idx} className={styles.tierCard}>
                      <button 
                        className={styles.actionBtn}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#f87171', padding: '4px' }}
                        onClick={() => {
                          const newTiers = tiersForm.filter((_, i) => i !== idx);
                          setTiersForm(newTiers);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
                        <label className={styles.formLabel} style={{ fontSize: '0.75rem' }}>Reward Value</label>
                        <input 
                          className={styles.formInput}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                          placeholder="e.g. ₹50"
                          value={tier.amount_text}
                          onChange={(e) => {
                            const newTiers = [...tiersForm];
                            newTiers[idx].amount_text = e.target.value;
                            setTiersForm(newTiers);
                          }}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                        <label className={styles.formLabel} style={{ fontSize: '0.75rem' }}>Coin Cost</label>
                        <input 
                          type="number"
                          className={styles.formInput}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                          placeholder="5000"
                          value={tier.coins_required}
                          onChange={(e) => {
                            const newTiers = [...tiersForm];
                            newTiers[idx].coins_required = parseInt(e.target.value);
                            setTiersForm(newTiers);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setIsPayoutModalOpen(false)}>Discard</button>
              <button className={styles.btnPrimary} onClick={handleSavePayout}>Commit Gateway Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Contest Editor Modal */}
      {isContestModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {editingContest ? 'Edit Contest' : 'New Contest'}
              </h3>
              <X className={styles.actionBtn} onClick={() => setIsContestModalOpen(false)} />
            </div>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contest Name</label>
                <input 
                  className={styles.formInput}
                  placeholder="Weekly Earning Challenge"
                  value={contestForm.name}
                  onChange={(e) => setContestForm({...contestForm, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug</label>
                  <input 
                    className={styles.formInput}
                    placeholder="weekly-earning"
                    value={contestForm.slug}
                    onChange={(e) => setContestForm({...contestForm, slug: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tracking Type</label>
                  <select 
                    className={styles.formInput}
                    value={contestForm.type}
                    onChange={(e) => setContestForm({...contestForm, type: e.target.value as any})}
                  >
                    <option value="earning">Earning (Coins)</option>
                    <option value="referral">Referral (Invites)</option>
                    <option value="streak">Streak (Daily Logins)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input 
                    type="datetime-local"
                    className={styles.formInput}
                    value={contestForm.start_time}
                    onChange={(e) => setContestForm({...contestForm, start_time: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
                  <input 
                    type="datetime-local"
                    className={styles.formInput}
                    value={contestForm.end_time}
                    onChange={(e) => setContestForm({...contestForm, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prize Pool Text</label>
                  <input 
                    className={styles.formInput}
                    placeholder="₹5000"
                    value={contestForm.prize_pool_text}
                    onChange={(e) => setContestForm({...contestForm, prize_pool_text: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select 
                    className={styles.formInput}
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
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontWeight: 600, color: '#10b981' }}>Reward Tiers</h4>
                      <button 
                        className={styles.addBtn}
                        onClick={() => {
                          const rank = prompt("Enter Rank From:");
                          const value = prompt("Enter Reward Coins:");
                          const text = prompt("Enter Display Text (e.g. ₹500):");
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
                        + Add Reward
                      </button>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {editingContest.rewards?.map((r: any) => (
                        <div key={r.id} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                           <span>Rank {r.rank_from}: <strong>{r.reward_text}</strong></span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setIsContestModalOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveContest}>Save Contest</button>
            </div>
          </div>
        </div>
      )}
      {activeView === 'settings' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Global Application Settings</h2>
              <p className={styles.sectionDesc}>Configure game rewards, ad networks, and platform-wide parameters</p>
            </div>
 
            <div className={styles.card} style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Game Reward Amount (Coins)</label>
                     <input 
                        type="number"
                        className={styles.formInput}
                        value={appSettings?.game_reward_coins || 0}
                        onChange={(e) => setAppSettings({...appSettings, game_reward_coins: parseInt(e.target.value)})}
                     />
                     <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Coins awarded to user for each completed ad/game.</p>
                  </div>
                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Daily Play Limit (Per User)</label>
                     <input 
                        type="number"
                        className={styles.formInput}
                        value={appSettings?.game_limit_per_day || 0}
                        onChange={(e) => setAppSettings({...appSettings, game_limit_per_day: parseInt(e.target.value)})}
                     />
                     <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Maximum number of reward-eligible ads a user can watch per day.</p>
                  </div>
               </div>
 
               <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', marginBottom: '2rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#38bdf8', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Ad Network Configuration</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}>AdsGram Block ID</label>
                        <input 
                           className={styles.formInput}
                           placeholder="e.g. 4376"
                           value={appSettings?.adsgram_block_id || ''}
                           onChange={(e) => setAppSettings({...appSettings, adsgram_block_id: e.target.value})}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Primary ad network block identifier.</p>
                     </div>
                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Monetag Zone ID</label>
                        <input 
                           className={styles.formInput}
                           placeholder="e.g. 10977311"
                           value={appSettings?.monetag_zone_id || ''}
                           onChange={(e) => setAppSettings({...appSettings, monetag_zone_id: e.target.value})}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Fallback ad network zone identifier.</p>
                     </div>
                  </div>
               </div>
 
               <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
                  <button className={styles.btnPrimary} onClick={handleUpdateAppSettings} style={{ padding: '1rem 3rem' }}>
                     Save Global Changes
                  </button>
               </div>
            </div>
          </section>
        )}

        {activeView === 'daily_rewards' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Daily Check-in Rewards</h2>
              <p className={styles.sectionDesc}>Configure rewards for the 7-day streak system</p>
            </div>

            <div className={styles.card} style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '1.5rem', maxWidth: '600px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {dailyRewards.map((reward, idx) => (
                    <div key={reward.day} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>Day {reward.day}</div>
                      <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                        <input 
                          type="number"
                          className={styles.formInput}
                          value={reward.reward_amount}
                          onChange={(e) => {
                            const newRewards = [...dailyRewards];
                            newRewards[idx].reward_amount = parseInt(e.target.value);
                            setDailyRewards(newRewards);
                          }}
                        />
                      </div>
                    </div>
                  ))}
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
                  <button 
                    className={styles.btnPrimary} 
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
                    style={{ padding: '1rem 3rem' }}
                  >
                    Update Reward Values
                  </button>
               </div>
            </div>
          </section>
        )}

        {activeView === 'visit_tasks' && (
          <section>
            <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className={styles.sectionTitle}>Visit & Earn Tasks</h2>
                <p className={styles.sectionDesc}>Create external link tasks for users to earn coins</p>
              </div>
              <button className={styles.addBtn} onClick={() => setIsVisitModalOpen(true)}>
                + Add Visit Task
              </button>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Target URL</th>
                    <th>Reward</th>
                    <th>Timer</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visitTasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{task.title}</td>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.url}</td>
                      <td style={{ color: '#4ade80', fontWeight: 700 }}>{task.reward_amount} Coins</td>
                      <td>{task.timer_seconds}s</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className={`${styles.actionBtn} ${styles.btnDanger}`}
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
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Visit Task Modal */}
        {isVisitModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox} style={{ maxWidth: '400px' }}>
              <div className={styles.modalHeader}>
                <h3>New Visit Task</h3>
                <X className={styles.actionBtn} onClick={() => setIsVisitModalOpen(false)} />
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Task Title</label>
                  <input className={styles.formInput} value={visitForm.title} onChange={e => setVisitForm({...visitForm, title: e.target.value})} placeholder="e.g. Visit Our Website" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL</label>
                  <input className={styles.formInput} value={visitForm.url} onChange={e => setVisitForm({...visitForm, url: e.target.value})} placeholder="https://..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reward (Coins)</label>
                    <input type="number" className={styles.formInput} value={visitForm.reward_amount} onChange={e => setVisitForm({...visitForm, reward_amount: parseInt(e.target.value)})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Timer (Seconds)</label>
                    <input type="number" className={styles.formInput} value={visitForm.timer_seconds} onChange={e => setVisitForm({...visitForm, timer_seconds: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => setIsVisitModalOpen(false)}>Cancel</button>
                <button className={styles.btnPrimary} onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/admin/visit-tasks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                      credentials: 'include',
                      body: JSON.stringify(visitForm)
                    });
                    if (res.ok) {
                      showToast("Task created");
                      setIsVisitModalOpen(false);
                      fetchAllData(secret);
                    }
                  } catch (err) { showToast("Error creating", "error"); }
                }}>Create Task</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
