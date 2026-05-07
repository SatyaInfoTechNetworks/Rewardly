"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { 
  Users, Coins, Activity, ShieldCheck, Search, 
  LayoutDashboard, History, Settings, LogOut, 
  Edit3, Trash2, Ban, CheckCircle2, X, Gift, ArrowUpRight, Menu
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
  const [loading, setLoading] = useState(true);
  
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://rewardlyapi.satyainfotechnetworks.com";

  const fetchAllData = async (authSecret: string) => {
    try {
      const headers = { 'x-admin-secret': authSecret };
      const options = { headers, credentials: 'include' as RequestCredentials };
      const [statsRes, usersRes, payoutsRes, withdrawalsRes, transRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, options),
        fetch(`${API_URL}/api/admin/users`, options),
        fetch(`${API_URL}/api/admin/payout-methods`, options),
        fetch(`${API_URL}/api/admin/withdrawals`, options),
        fetch(`${API_URL}/api/admin/transactions`, options)
      ]);

      if (statsRes.ok && usersRes.ok && payoutsRes.ok && withdrawalsRes.ok && transRes.ok) {
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
        setPayoutMethods(await payoutsRes.json());
        setWithdrawals(await withdrawalsRes.json());
        setTransactions(await transRes.json());
        setIsAuthenticated(true);
        localStorage.setItem("admin_secret", authSecret);
      } else {
        alert("Invalid Secret Key");
      }
    } catch (error) {
      console.error("Admin Fetch Error:", error);
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
      }
    } catch (error) {
      alert("Failed to update user");
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
      if (res.ok) fetchAllData(secret);
    } catch (error) {
      alert("Failed to delete user");
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

  if (loading) return <div className={styles.adminContainer}>Loading...</div>;

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
        alert(`Withdrawal ${status} successfully!`);
        fetchAllData(authSecret || '');
      }
    } catch (error) {
      alert("Failed to update withdrawal");
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
        alert("Payout method saved successfully!");
        setIsPayoutModalOpen(false);
        setEditingPayout(null);
        fetchAllData(authSecret || '');
      }
    } catch (error) {
      alert("Failed to save payout method");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.loginOverlay}>
        <div className={styles.loginBox}>
          <ShieldCheck size={48} color="#38bdf8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Access</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>Enter security key to manage Rewardly</p>
          <input 
            type="password" 
            className={styles.formInput} 
            placeholder="Secret Key"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAllData(secret)}
            style={{ marginBottom: '1rem' }}
          />
          <button className={styles.btnPrimary} style={{ width: '100%' }} onClick={() => fetchAllData(secret)}>
            Authorize
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>R</div>
          <span style={{ fontWeight: 700 }}>Rewardly</span>
        </div>
        <button className={styles.actionBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>R</div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rewardly</span>
        </div>

        <nav className={styles.navMenu}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'payouts', icon: Gift, label: 'Payouts' },
            { id: 'withdrawals', icon: ArrowUpRight, label: 'Withdrawals' },
            { id: 'transactions', icon: History, label: 'Transactions' },
          ].map((item) => (
            <div 
              key={item.id}
              className={`${styles.navItem} ${activeView === item.id ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setIsSidebarOpen(false);
              }}
            >
              <item.icon size={20} /> {item.label}
            </div>
          ))}
          <div className={styles.navItem}><Settings size={20} /> Settings</div>
        </nav>

        <div 
          className={styles.navItem} 
          style={{ marginTop: 'auto', color: '#ef4444' }}
          onClick={() => {
            localStorage.removeItem("admin_secret");
            setIsAuthenticated(false);
          }}
        >
          <LogOut size={20} /> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {activeView === 'dashboard' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.sectionDesc}>Platform-wide performance and statistics</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Total Users</div>
                  <Users className={styles.statIcon} size={20} />
                </div>
                <div className={styles.statValue}>{stats?.totalUsers?.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Total Coins</div>
                  <Coins className={styles.statIcon} size={20} />
                </div>
                <div className={styles.statValue}>{stats?.totalBalance?.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statLabel}>Total Transactions</div>
                  <Activity className={styles.statIcon} size={20} />
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
              <p className={styles.sectionDesc}>Manage accounts, balances, and permissions</p>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableActions}>
                <div className={styles.searchBox}>
                  <Search size={18} color="#94a3b8" />
                  <input className={styles.searchInput} placeholder="Search by name or ID..." />
                </div>
              </div>

              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Telegram ID</th>
                    <th>Phone</th>
                    <th>Invited By</th>
                    <th>Google AID / IDFA</th>
                    <th>Verification</th>
                    <th>Balance</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.telegram_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {user.photo_url ? (
                            <img src={user.photo_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#38bdf8', color: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                              {(user.first_name || 'U')[0]}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{user.username || 'no_username'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{user.telegram_id}</td>
                      <td style={{ fontSize: '0.8rem' }}>{user.phone_number || 'N/A'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.referred_by || 'Organic'}</td>
                      <td>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          <div>G: {user.google_aid || 'N/A'}</div>
                          <div>I: {user.ios_idfa || 'N/A'}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <CheckCircle2 size={16} color={user.is_phone_verified ? "#4ade80" : "#475569"} />
                          <Users size={16} color={user.is_channel_joined ? "#4ade80" : "#475569"} />
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#4ade80' }}>{user.balance?.toLocaleString() || 0}</td>
                      <td style={{ fontWeight: 700, color: '#fbbf24' }}>{user.pending_balance?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`${styles.badge} ${user.is_banned ? styles.badgeBanned : styles.badgeActive}`}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td>{user.created_at || user.createdAt ? new Date(user.created_at || user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className={styles.actionBtn} onClick={() => {
                            setEditingUser(user);
                            setNewBalance(user.balance.toString());
                          }}>
                            <Edit3 size={16} />
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${user.is_banned ? '' : styles.btnDanger}`}
                            onClick={() => handleUpdateUser(user.telegram_id, { is_banned: !user.is_banned })}
                          >
                            <Ban size={16} />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={() => handleDeleteUser(user.telegram_id)}>
                            <Trash2 size={16} />
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
              <h2 className={styles.sectionTitle}>Transaction History</h2>
              <p className={styles.sectionDesc}>Recent earning and withdrawal activities</p>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace' }}>{tx.telegram_id}</td>
                      <td style={{ textTransform: 'capitalize' }}>{tx.type}</td>
                      <td style={{ color: tx.amount > 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td>{tx.description}</td>
                      <td>{new Date(tx.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeActive}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'payouts' && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Payout Methods</h2>
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
                + Add Method
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Tiers</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutMethods.map(method => (
                    <tr key={method.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {method.logo_url && <img src={method.logo_url} width="24" height="24" style={{ objectFit: 'contain' }} />}
                          <strong>{method.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {method.tiers?.map((t: any) => (
                            <span key={t.id} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                              {t.amount_text}: {t.coins_required}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={method.status === 'active' ? styles.statusActive : styles.statusPending}>
                          {method.status}
                        </span>
                      </td>
                      <td>{method.order_index}</td>
                      <td>
                        <button 
                          className={styles.editBtn}
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
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'withdrawals' && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Withdrawal Requests</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div>
                          <strong>{req.User?.first_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>@{req.User?.username}</div>
                        </div>
                      </td>
                      <td>{req.PayoutMethod?.name}</td>
                      <td>
                        <strong>{req.amount_text}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{req.coins_used} coins</div>
                      </td>
                      <td><code style={{ fontSize: '12px' }}>{req.payout_details}</code></td>
                      <td>
                        <span className={
                          req.status === 'approved' ? styles.statusActive : 
                          req.status === 'pending' ? styles.statusPending : styles.statusBlocked
                        }>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className={styles.addBtn} 
                              style={{ padding: '6px 12px', background: '#10b981' }}
                              onClick={() => handleUpdateWithdrawal(req.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button 
                              className={styles.editBtn} 
                              style={{ padding: '6px 12px', background: '#ef4444', color: 'white' }}
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
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit User: {editingUser.first_name}</h3>
              <X className={styles.actionBtn} onClick={() => setEditingUser(null)} />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Coin Balance</label>
              <input 
                type="number" 
                className={styles.formInput}
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div 
                style={{ 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  border: editingUser.is_phone_verified ? '1px solid #4ade80' : '1px solid transparent'
                }}
                onClick={() => setEditingUser({...editingUser, is_phone_verified: !editingUser.is_phone_verified})}
              >
                <CheckCircle2 size={18} color={editingUser.is_phone_verified ? "#4ade80" : "#475569"} />
                <span style={{ fontSize: '0.8rem' }}>Phone Verified</span>
              </div>

              <div 
                style={{ 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  border: editingUser.is_channel_joined ? '1px solid #4ade80' : '1px solid transparent'
                }}
                onClick={() => setEditingUser({...editingUser, is_channel_joined: !editingUser.is_channel_joined})}
              >
                <Users size={18} color={editingUser.is_channel_joined ? "#4ade80" : "#475569"} />
                <span style={{ fontSize: '0.8rem' }}>Joined Channel</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setEditingUser(null)}>Cancel</button>
              <button 
                className={styles.btnPrimary}
                onClick={() => handleUpdateUser(editingUser.telegram_id, { 
                  balance: parseInt(newBalance),
                  is_phone_verified: editingUser.is_phone_verified,
                  is_channel_joined: editingUser.is_channel_joined
                })}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payout Editor Modal */}
      {isPayoutModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingPayout ? 'Edit Payout Method' : 'Add Payout Method'}
              </h3>
              <X className={styles.actionBtn} onClick={() => setIsPayoutModalOpen(false)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Method Name</label>
                <input 
                  className={styles.formInput}
                  placeholder="e.g. UPI, Amazon Pay"
                  value={payoutForm.name}
                  onChange={(e) => setPayoutForm({...payoutForm, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Logo URL</label>
                <input 
                  className={styles.formInput}
                  placeholder="https://icon-url.com/img.png"
                  value={payoutForm.logo_url}
                  onChange={(e) => setPayoutForm({...payoutForm, logo_url: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Order Index</label>
                <input 
                  type="number"
                  className={styles.formInput}
                  value={payoutForm.order_index}
                  onChange={(e) => setPayoutForm({...payoutForm, order_index: parseInt(e.target.value)})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select 
                  className={styles.formInput}
                  value={payoutForm.status}
                  onChange={(e) => setPayoutForm({...payoutForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Conversion Rate</label>
                <input 
                  className={styles.formInput}
                  placeholder="₹1 = 100 Coins"
                  value={payoutForm.conversion_rate}
                  onChange={(e) => setPayoutForm({...payoutForm, conversion_rate: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Transaction Fee</label>
                <input 
                  className={styles.formInput}
                  placeholder="0% Fees"
                  value={payoutForm.fee_text}
                  onChange={(e) => setPayoutForm({...payoutForm, fee_text: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.formLabel}>Disclaimer / Terms</label>
              <textarea 
                className={styles.formInput}
                style={{ height: '80px', resize: 'vertical' }}
                placeholder="Important terms for this method..."
                value={payoutForm.disclaimer}
                onChange={(e) => setPayoutForm({...payoutForm, disclaimer: e.target.value})}
              />
            </div>
                        {/* Dynamic Inputs Builder */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 600, color: '#38bdf8' }}>User Input Fields</h4>
                <button 
                  className={styles.addBtn} 
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={() => setPayoutForm({
                    ...payoutForm, 
                    custom_inputs: [...payoutForm.custom_inputs, { name: '', placeholder: '' }]
                  })}
                >
                  + Add Input
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {payoutForm.custom_inputs.map((input, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      className={styles.formInput}
                      placeholder="Label (e.g. UPI ID)"
                      value={input.name}
                      onChange={(e) => {
                        const newInputs = [...payoutForm.custom_inputs];
                        newInputs[idx].name = e.target.value;
                        setPayoutForm({ ...payoutForm, custom_inputs: newInputs });
                      }}
                    />
                    <input 
                      className={styles.formInput}
                      placeholder="Placeholder"
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
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiers Builder */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 600, color: '#38bdf8' }}>Manage Tiers</h4>
                <button 
                  className={styles.addBtn} 
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={() => setTiersForm([...tiersForm, { amount_text: '', coins_required: 0 }])}
                >
                  + Add Tier
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tiersForm.map((tier, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      className={styles.formInput}
                      placeholder="Amount (e.g. ₹50)"
                      value={tier.amount_text}
                      onChange={(e) => {
                        const newTiers = [...tiersForm];
                        newTiers[idx].amount_text = e.target.value;
                        setTiersForm(newTiers);
                      }}
                    />
                    <input 
                      type="number"
                      className={styles.formInput}
                      placeholder="Coins"
                      value={tier.coins_required}
                      onChange={(e) => {
                        const newTiers = [...tiersForm];
                        newTiers[idx].coins_required = parseInt(e.target.value);
                        setTiersForm(newTiers);
                      }}
                    />
                    <button 
                      className={styles.actionBtn}
                      style={{ color: '#f87171' }}
                      onClick={() => {
                        const newTiers = tiersForm.filter((_, i) => i !== idx);
                        setTiersForm(newTiers);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalActions} style={{ position: 'sticky', bottom: 0, background: '#1e293b', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button className={styles.btnSecondary} onClick={() => setIsPayoutModalOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSavePayout}>Save Method</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
