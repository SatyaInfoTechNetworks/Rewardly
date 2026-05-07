"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { Users, Coins, Activity, ShieldCheck, Search } from "lucide-react";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://rewardlyapi.satyainfotechnetworks.com";

  const fetchAdminData = async (authSecret: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-secret': authSecret } }),
        fetch(`${API_URL}/api/admin/users`, { headers: { 'x-admin-secret': authSecret } })
      ]);

      if (statsRes.ok && usersRes.ok) {
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
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

  useEffect(() => {
    const savedSecret = localStorage.getItem("admin_secret");
    if (savedSecret) {
      setSecret(savedSecret);
      fetchAdminData(savedSecret);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className={styles.adminContainer}>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className={styles.loginOverlay}>
        <div className={styles.loginBox}>
          <ShieldCheck size={48} color="#38bdf8" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.adminTitle}>Admin Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Enter your security key to continue</p>
          <input 
            type="password" 
            className={styles.adminInput} 
            placeholder="Security Key"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdminData(secret)}
          />
          <button className={styles.adminBtn} onClick={() => fetchAdminData(secret)}>
            Authorize Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Admin Dashboard</h1>
          <p style={{ color: '#94a3b8' }}>Management console for Rewardly</p>
        </div>
        <button 
          className={styles.adminBtn} 
          style={{ width: 'auto', padding: '0.5rem 1rem' }}
          onClick={() => {
            localStorage.removeItem("admin_secret");
            setIsAuthenticated(false);
          }}
        >
          Logout
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}><Users size={24} style={{ marginRight: '8px' }} /> {stats?.totalUsers || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Coins in System</div>
          <div className={styles.statValue}><Coins size={24} style={{ marginRight: '8px' }} /> {stats?.totalBalance?.toLocaleString() || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Transactions</div>
          <div className={styles.statValue}><Activity size={24} style={{ marginRight: '8px' }} /> {stats?.totalTransactions || 0}</div>
        </div>
      </div>

      <div className={styles.adminTableWrapper}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600 }}>Active Users</h3>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15,23,42,0.5)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Search Users..." style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '0.5rem', outline: 'none' }} />
          </div>
        </div>
        
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Telegram ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Balance</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.telegram_id} className={styles.userRow}>
                <td style={{ color: '#38bdf8', fontWeight: 500 }}>{user.telegram_id}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>@{user.username || 'N/A'}</td>
                <td style={{ fontWeight: 700 }}>{user.balance.toLocaleString()}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
