"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { 
  Users, Coins, Activity, ShieldCheck, Search, 
  LayoutDashboard, History, Settings, LogOut, 
  Edit3, Trash2, Ban, CheckCircle2, X, Gift, ArrowUpRight, Menu, Trophy, Calendar, Globe, Plus, Filter, Save, Key, Ticket, Zap,
  Megaphone, BarChart3, Clock, BrainCircuit, Play, FolderClosed, Image, AlertTriangle, Eye, RefreshCw
} from "lucide-react";

export default function AdminPanel() {
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'payouts'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersLimit, setUsersLimit] = useState(20);
  const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Broadcast states
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    media_type: "none",
    media_url: "",
    button_text: "",
    button_url: "",
    target_type: "all_users",
    schedule_time: "",
    status: "draft"
  });
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
  const [broadcastAnalytics, setBroadcastAnalytics] = useState<any>(null);
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaDragActive, setMediaDragActive] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    inactive_reminder: true,
    wallet_reminder: true,
    referral_push: true
  });
  
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

  // Custom Offer States
  const [customOffers, setCustomOffers] = useState<any[]>([]);
  const [customProofs, setCustomProofs] = useState<any[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [isOfferRejectionModalOpen, setIsOfferRejectionModalOpen] = useState(false);
  const [rejectingClickId, setRejectingClickId] = useState<string>('');
  const [offerRejectionReason, setOfferRejectionReason] = useState<string>('');
  const [offerForm, setOfferForm] = useState({
    title: '',
    external_id: '',
    description: '',
    category: 'Top Offers',
    icon_url: '',
    tracking_url: '',
    total_reward: 0,
    actual_price: 0,
    is_active: true,
    type: 'online',
    reward_type: 'Multi Reward',
    estimated_time: '5 mins',
    difficulty: 'Medium',
    is_hot: false,
    extra_label: '',
    input_type: 'text',
    input_instruction: '',
    tiers: [] as any[],
    daily_completion_cap: 0,
    country_targeting: 'IN'
  });

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

  // Lifafa States
  const [lifafas, setLifafas] = useState<any[]>([]);
  const [isLifafaModalOpen, setIsLifafaModalOpen] = useState(false);
  const [lifafaForm, setLifafaForm] = useState({
    code: '',
    reward_coins: 100,
    max_uses: -1,
    status: 'active',
    expires_at: ''
  });

  // Balance Adjustment States
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

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
        fetch(`${API_URL}/api/admin/users?page=1&limit=20`, options),
        fetch(`${API_URL}/api/admin/payout-methods`, options),
        fetch(`${API_URL}/api/admin/withdrawals`, options),
        fetch(`${API_URL}/api/admin/transactions`, options),
        fetch(`${API_URL}/api/admin/referral/settings`, options),
        fetch(`${API_URL}/api/admin/referral/milestones`, options),
        fetch(`${API_URL}/api/admin/referral/stats`, options),
        fetch(`${API_URL}/api/admin/contests`, options),
        fetch(`${API_URL}/api/admin/settings`, options),
        fetch(`${API_URL}/api/admin/lifafas`, options)
      ]);
 
      if (statsRes.ok && usersRes.ok && payoutsRes.ok && withdrawalsRes.ok && transRes.ok) {
        setStats(await statsRes.ok ? await statsRes.json() : null);
        const usersData = await usersRes.json();
        if (usersData && typeof usersData === 'object' && 'users' in usersData) {
          setUsers(usersData.users);
          setFilteredUsers(usersData.users);
          setTotalUsers(usersData.total);
          setTotalPages(usersData.totalPages);
          setCurrentPage(usersData.page);
        } else if (Array.isArray(usersData)) {
          setUsers(usersData);
          setFilteredUsers(usersData);
          setTotalUsers(usersData.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
        setPayoutMethods(await payoutsRes.json());
        setWithdrawals(await withdrawalsRes.json());
        setTransactions(await transRes.json());
        if (refSettingsRes.ok) setReferralSettings(await refSettingsRes.json());
        if (refMilestonesRes.ok) setReferralMilestones(await refMilestonesRes.json());
        if (refStatsRes.ok) setReferralStats(await refStatsRes.json());
        if (contestsRes.ok) setContests(await contestsRes.json());
        if (appSettingsRes.ok) {
          const settingsData = await appSettingsRes.json();
          setAppSettings(settingsData);
          setAutomationSettings({
            inactive_reminder: settingsData.inactive_reminder_enabled !== false,
            wallet_reminder: settingsData.wallet_reminder_enabled !== false,
            referral_push: settingsData.referral_push_enabled !== false
          });
        }
        
        // Fetch Lifafas
        const lifafasRes = await Promise.all([
          fetch(`${API_URL}/api/admin/lifafas`, options)
        ]);
        if (lifafasRes[0].ok) setLifafas(await lifafasRes[0].json());
        
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

        // Fetch Advanced Production Analytics
        try {
          const analyticsRes = await fetch(`${API_URL}/api/admin/analytics`, options);
          if (analyticsRes.ok) {
            setAnalyticsData(await analyticsRes.json());
          }
        } catch (err) {
          console.error("Failed to load analytics data", err);
        }
        
        // Fetch Custom Offers
        try {
          const offersRes = await fetch(`${API_URL}/api/admin/offers`, options);
          if (offersRes.ok) {
            setCustomOffers(await offersRes.json());
          }
        } catch (offerErr) {
          console.error("Failed to load custom offers", offerErr);
        }

        // Fetch Custom Proofs
        try {
          const proofsRes = await fetch(`${API_URL}/api/admin/proofs`, options);
          if (proofsRes.ok) {
            setCustomProofs(await proofsRes.json());
          }
        } catch (proofErr) {
          console.error("Failed to load custom proofs", proofErr);
        }

        setIsAuthenticated(true);
        localStorage.setItem("admin_secret", authSecret);
        fetchBroadcasts(authSecret);
        fetchMediaFiles(authSecret);
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

  const handleSaveOffer = async () => {
    if (!offerForm.title.trim()) {
      showToast("Offer title is required", "error");
      return;
    }
    try {
      const url = editingOffer 
        ? `${API_URL}/api/admin/offers/${editingOffer.id}`
        : `${API_URL}/api/admin/offers`;
      
      const method = editingOffer ? 'PUT' : 'POST';
      
      // Clean and trim steps right before sending
      const cleanedTiers = (offerForm.tiers || []).map(tier => ({
        ...tier,
        steps: Array.isArray(tier.steps)
          ? tier.steps.map(s => typeof s === 'string' ? s.trim() : '').filter(s => s.length > 0)
          : []
      }));

      const payload = {
        ...offerForm,
        tiers: cleanedTiers
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingOffer ? "Offer updated successfully!" : "Offer created successfully!");
        setIsOfferModalOpen(false);
        setEditingOffer(null);
        fetchAllData(secret);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to save offer", "error");
      }
    } catch (err) {
      showToast("Failed to save offer", "error");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this custom offer? This will delete all user progress logs for it.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/offers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Offer deleted successfully!");
        fetchAllData(secret);
      } else {
        showToast("Failed to delete offer", "error");
      }
    } catch (err) {
      showToast("Failed to delete offer", "error");
    }
  };

  const handleApproveProof = async (clickId: string) => {
    if (!confirm("Approve this proof and credit coins to the user?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/proofs/${clickId}/approve`, {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Proof approved and coins credited!");
        fetchAllData(secret);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to approve proof", "error");
      }
    } catch (err) {
      showToast("Failed to approve proof", "error");
    }
  };

  const handleRejectProofSubmit = async () => {
    if (!offerRejectionReason.trim()) {
      showToast("Rejection reason is required", "error");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/proofs/${rejectingClickId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        credentials: 'include',
        body: JSON.stringify({ reason: offerRejectionReason })
      });
      if (res.ok) {
        showToast("Proof rejected successfully!");
        setIsOfferRejectionModalOpen(false);
        setRejectingClickId('');
        setOfferRejectionReason('');
        fetchAllData(secret);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to reject proof", "error");
      }
    } catch (err) {
      showToast("Failed to reject proof", "error");
    }
  };

  const fetchUsers = async (page = 1, limit = 20, search = "") => {
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const headers = { 'x-admin-secret': authSecret || '' };
      const res = await fetch(`${API_URL}/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && 'users' in data) {
          setUsers(data.users);
          setFilteredUsers(data.users);
          setTotalUsers(data.total);
          setTotalPages(data.totalPages);
          setCurrentPage(data.page);
        } else if (Array.isArray(data)) {
          setUsers(data);
          setFilteredUsers(data);
          setTotalUsers(data.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchUsers(newPage, usersLimit, searchQuery);
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

  // Debounced search to query the backend database directly
  useEffect(() => {
    if (!isAuthenticated) return;
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, usersLimit, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, usersLimit, isAuthenticated]);

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

  const handleAdjustCoins = async (userId: any) => {
    const amountNum = parseInt(adjustAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid coin amount", "error");
      return;
    }

    try {
      setIsAdjusting(true);
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/adjust-coins`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': secret 
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountNum,
          type: adjustType,
          reason: adjustReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully adjusted ${adjustType === 'add' ? '+' : '-'}${amountNum} coins!`);
        setAdjustAmount("");
        setAdjustReason("");
        setNewBalance(data.newBalance.toString());
        fetchAllData(secret);
      } else {
        showToast(data.error || "Adjustment failed", "error");
      }
    } catch (err) {
      showToast("Failed to complete request", "error");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSaveLifafa = async () => {
    if (!lifafaForm.code.trim()) {
      showToast("Please enter a code name", "error");
      return;
    }
    try {
      const payload = {
        ...lifafaForm,
        code: lifafaForm.code.trim().toUpperCase(),
        expires_at: lifafaForm.expires_at ? new Date(lifafaForm.expires_at) : null
      };

      const res = await fetch(`${API_URL}/api/admin/lifafas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': secret 
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("🎉 Lifafa promo code created successfully!");
        setIsLifafaModalOpen(false);
        setLifafaForm({
          code: '',
          reward_coins: 100,
          max_uses: -1,
          status: 'active',
          expires_at: ''
        });
        fetchAllData(secret);
      } else {
        showToast("Failed to create Lifafa", "error");
      }
    } catch (err) {
      showToast("Error saving Lifafa code", "error");
    }
  };

  // --- TELEGRAM BROADCAST SYSTEM HANDLERS ---
  const fetchBroadcasts = async (authSecret: string) => {
    try {
      const headers = { 'x-admin-secret': authSecret };
      const res = await fetch(`${API_URL}/api/admin/broadcasts`, { headers, credentials: 'include' });
      if (res.ok) {
        setBroadcasts(await res.json());
      }
    } catch (error) {
      console.error("Fetch Broadcasts Error:", error);
    }
  };

  const fetchMediaFiles = async (authSecret: string) => {
    try {
      const headers = { 'x-admin-secret': authSecret };
      const res = await fetch(`${API_URL}/api/admin/broadcasts/media`, { headers, credentials: 'include' });
      if (res.ok) {
        setMediaFiles(await res.json());
      }
    } catch (error) {
      console.error("Fetch Media Files Error:", error);
    }
  };

  const handleSaveBroadcast = async (statusOverride?: string) => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast("Please enter title and message", "error");
      return;
    }
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const payload = {
        ...broadcastForm,
        status: statusOverride || broadcastForm.status
      };
      
      const method = selectedBroadcast && selectedBroadcast.id ? 'PUT' : 'POST';
      const url = selectedBroadcast && selectedBroadcast.id 
        ? `${API_URL}/api/admin/broadcasts/${selectedBroadcast.id}`
        : `${API_URL}/api/admin/broadcasts`;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': authSecret
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast("Campaign saved successfully!");
        setBroadcastForm({
          title: "",
          message: "",
          media_type: "none",
          media_url: "",
          button_text: "",
          button_url: "",
          target_type: "all_users",
          schedule_time: "",
          status: "draft"
        });
        setSelectedBroadcast(null);
        fetchBroadcasts(authSecret);
        if (activeView === 'broadcast_center') {
          setActiveView('scheduled_broadcasts');
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save campaign", "error");
      }
    } catch (error) {
      showToast("Network error saving campaign", "error");
    }
  };

  const handleDeleteBroadcast = async (id: number) => {
    if (!confirm("Are you sure you want to delete this broadcast and its delivery analytics logs?")) return;
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const res = await fetch(`${API_URL}/api/admin/broadcasts/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': authSecret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Campaign deleted successfully");
        fetchBroadcasts(authSecret);
      } else {
        showToast("Failed to delete campaign", "error");
      }
    } catch (error) {
      showToast("Network error deleting campaign", "error");
    }
  };

  const handleTriggerSendBroadcast = async (id: number) => {
    if (!confirm("Do you want to send this broadcast campaign immediately to target segment?")) return;
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const res = await fetch(`${API_URL}/api/admin/broadcasts/${id}/send`, {
        method: 'POST',
        headers: { 'x-admin-secret': authSecret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Broadcast campaign queued successfully!");
        fetchBroadcasts(authSecret);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to trigger send", "error");
      }
    } catch (error) {
      showToast("Network error triggering send", "error");
    }
  };

  const handleViewBroadcastDetails = async (id: number) => {
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const res = await fetch(`${API_URL}/api/admin/broadcasts/${id}`, {
        headers: { 'x-admin-secret': authSecret },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedBroadcast(data.broadcast);
        setBroadcastAnalytics(data.analytics);
        setBroadcastLogs(data.logs);
        setIsBroadcastModalOpen(true);
      } else {
        showToast("Failed to fetch campaign details", "error");
      }
    } catch (error) {
      showToast("Network error fetching details", "error");
    }
  };

  const handleUploadMediaFile = async (file: File) => {
    setMediaUploading(true);
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const formData = new FormData();
      formData.append("media", file);

      const res = await fetch(`${API_URL}/api/admin/broadcasts/upload`, {
        method: 'POST',
        headers: { 'x-admin-secret': authSecret },
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Media uploaded successfully!");
        setBroadcastForm(prev => ({
          ...prev,
          media_url: data.url,
          media_type: file.type.startsWith("image") ? (file.type.endsWith("gif") ? "gif" : "photo") : "video"
        }));
        fetchMediaFiles(authSecret);
      } else {
        const err = await res.json();
        showToast(err.error || "Upload failed", "error");
      }
    } catch (error) {
      showToast("Network error uploading media", "error");
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMediaFile = async (filename: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) return;
    try {
      const authSecret = localStorage.getItem("admin_secret") || secret;
      const res = await fetch(`${API_URL}/api/admin/broadcasts/media/${filename}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': authSecret },
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Media file deleted successfully");
        fetchMediaFiles(authSecret);
      } else {
        showToast("Failed to delete media", "error");
      }
    } catch (error) {
      showToast("Network error deleting media", "error");
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("broadcastMessageInput") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = broadcastForm.message;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newMsg = before + variable + after;
      setBroadcastForm(prev => ({ ...prev, message: newMsg }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 50);
    } else {
      setBroadcastForm(prev => ({ ...prev, message: prev.message + variable }));
    }
  };

  const handleSearchUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
                { id: 'analytics', icon: Activity, label: 'Advanced Analytics' },
                { id: 'broadcast_center', icon: Megaphone, label: '📢 Broadcast Center' },
                { id: 'broadcast_analytics', icon: BarChart3, label: '📊 Campaign Stats' },
                { id: 'scheduled_broadcasts', icon: Clock, label: '🕒 Scheduled Push' },
                { id: 'automation_rules', icon: BrainCircuit, label: '🧠 Smart Automations' },
                { id: 'media_manager', icon: FolderClosed, label: '🖼 Media Manager' },
                { id: 'users', icon: Users, label: 'User Database' },
                { id: 'lifafas', icon: Gift, label: 'Lifafa Promo Codes' },
                { id: 'payouts', icon: Gift, label: 'Payout Gateways' },
                { id: 'withdrawals', icon: ArrowUpRight, label: 'Withdrawal Tickets' },
                { id: 'referrals', icon: Users, label: 'Referral Engine' },
                { id: 'contests', icon: Trophy, label: 'Tournament Panel' },
                { id: 'lucky_draws', icon: Ticket, label: 'Lucky Draws & Jackpot' },
                { id: 'custom_offers', icon: Zap, label: 'Custom Offers' },
                { id: 'custom_proofs', icon: ShieldCheck, label: 'Custom Proofs' },
                { id: 'postback_guide', icon: Globe, label: 'S2S Postbacks' },
                { id: 'transactions', icon: History, label: 'Global Audit Logs' },
                { id: 'daily_rewards', icon: Calendar, label: 'Check-in Rewards' },
                { id: 'visit_tasks', icon: Globe, label: 'Visit Tasks Manager' },
                { id: 'settings', icon: Settings, label: 'Global Settings' },
              ].map((item) => (
                <li key={item.id} className={styles.lteNavListItem}>
                  <button 
                    className={`${styles.lteNavLinkButton} ${activeView === item.id ? styles.lteNavLinkActive : ''}`}
                    onClick={() => {
                      setActiveView(item.id);
                      if (item.id === 'broadcast_center') {
                        setSelectedBroadcast(null);
                        setBroadcastForm({
                          title: "",
                          message: "",
                          media_type: "none",
                          media_url: "",
                          button_text: "",
                          button_url: "",
                          target_type: "all_users",
                          schedule_time: "",
                          status: "draft"
                        });
                      }
                    }}
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

          {/* ──── VIEW: ADVANCED ANALYTICS ──── */}
          {activeView === 'analytics' && analyticsData && (
            <div className={styles.lteAnalyticsContainer} style={{ animation: 'fadeIn 0.6s ease-in-out' }}>
              
              {/* Top Premium Metrix Row */}
              <div className={styles.lteStatsGrid} style={{ marginBottom: '24px' }}>
                
                {/* WAU / MAU Stickiness Box */}
                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                  <div className={styles.lteInner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: 600 }}>Stickiness DAU/MAU</span>
                      <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>PREMIUM</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '32px', margin: 0, fontWeight: 800, color: '#38bdf8' }}>{analyticsData.user.stickiness}%</h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>({analyticsData.user.dauToday} / {analyticsData.user.mau} MAU)</span>
                    </div>
                    <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${analyticsData.user.stickiness}%`, background: '#38bdf8', height: '100%', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b' }}>Target {'>'}20% for stable growth engine</p>
                  </div>
                </div>

                {/* Viral Coefficient (K-factor) */}
                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)', color: 'white', border: '1px solid #1f2937', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                  <div className={styles.lteInner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600 }}>Viral Loop (K-Factor)</span>
                      <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>VIRALITY</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '32px', margin: 0, fontWeight: 800, color: '#a855f7' }}>{analyticsData.referral.viralCoefficient}</h3>
                      <span style={{ fontSize: '12px', color: '#4b5563' }}>({analyticsData.referral.conversionRate}% Conv Rate)</span>
                    </div>
                    <div style={{ width: '100%', background: '#374151', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, analyticsData.referral.viralCoefficient * 100)}%`, background: '#a855f7', height: '100%', borderRadius: '3px' }}></div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#4b5563' }}>Every 100 users bring {Math.round(analyticsData.referral.viralCoefficient * 100)} new organic users</p>
                  </div>
                </div>

                {/* Coin Economy Burn Ratio */}
                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #050505 0%, #151515 100%)', color: 'white', border: '1px solid #262626', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                  <div className={styles.lteInner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', fontWeight: 600 }}>Coin Burn Ratio</span>
                      <span style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>ECONOMY</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '32px', margin: 0, fontWeight: 800, color: '#eab308' }}>{analyticsData.coin.burnRatio}%</h3>
                      <span style={{ fontSize: '12px', color: '#525252' }}>({analyticsData.coin.spentToday.toLocaleString()} Spent)</span>
                    </div>
                    <div style={{ width: '100%', background: '#404040', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${analyticsData.coin.burnRatio}%`, background: '#eab308', height: '100%', borderRadius: '3px' }}></div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#525252' }}>Target range 40% - 60% for healthy coin economy</p>
                  </div>
                </div>

                {/* Monetization Quality (ARPDAS) */}
                <div className={`${styles.lteSmallBox}`} style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', color: 'white', border: '1px solid #065f46', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                  <div className={styles.lteInner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a7f3d0', fontWeight: 600 }}>ARPDAU (Ad Rev / User)</span>
                      <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>REVENUE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '32px', margin: 0, fontWeight: 800, color: '#34d399' }}>${analyticsData.monetization.arpdau.toFixed(4)}</h3>
                      <span style={{ fontSize: '12px', color: '#047857' }}>(${analyticsData.monetization.estimatedRevenue} Today)</span>
                    </div>
                    <div style={{ width: '100%', background: '#065f46', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (analyticsData.monetization.arpdau / 0.05) * 100)}%`, background: '#34d399', height: '100%', borderRadius: '3px' }}></div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#047857' }}>Calculated using standard S2S postback validations</p>
                  </div>
                </div>

              </div>

              {/* Advanced Interactive SVGs Chart Center */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                
                {/* Chart 1: DAU & Revenue Trend */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
                  <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Daily Engagement & Monetization</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>7-day active user engagement vs. network ad earnings</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontWeight: 600 }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> DAU</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Revenue ($)</span>
                    </div>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                      
                      {/* Responsive Premium SVG */}
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="dauGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                          </linearGradient>
                          <linearGradient id="revGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Horizontal Gridlines */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="40" x2="100" y2="40" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="60" x2="100" y2="60" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
                        
                        {/* Area glow under lines */}
                        {(() => {
                          const maxD = Math.max(...analyticsData.trends.map((t: any) => t.dau), 1);
                          const ptsD = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.dau / maxD) * 80}`).join(" ");
                          return <polygon points={`0,100 ${ptsD} 100,100`} fill="url(#dauGlow)" />;
                        })()}

                        {(() => {
                          const maxR = Math.max(...analyticsData.trends.map((t: any) => t.revenue), 1);
                          const ptsR = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.revenue / maxR) * 80}`).join(" ");
                          return <polygon points={`0,100 ${ptsR} 100,100`} fill="url(#revGlow)" />;
                        })()}

                        {/* Line charts */}
                        {(() => {
                          const maxD = Math.max(...analyticsData.trends.map((t: any) => t.dau), 1);
                          const ptsD = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.dau / maxD) * 80}`).join(" ");
                          return <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ptsD} />;
                        })()}

                        {(() => {
                          const maxR = Math.max(...analyticsData.trends.map((t: any) => t.revenue), 1);
                          const ptsR = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.revenue / maxR) * 80}`).join(" ");
                          return <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ptsR} />;
                        })()}

                        {/* Interactive Data dots */}
                        {analyticsData.trends.map((t: any, i: number) => {
                          const maxD = Math.max(...analyticsData.trends.map((t: any) => t.dau), 1);
                          const maxR = Math.max(...analyticsData.trends.map((t: any) => t.revenue), 1);
                          const cx = (i / 6) * 100;
                          const cyD = 100 - (t.dau / maxD) * 80;
                          const cyR = 100 - (t.revenue / maxR) * 80;
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cyD} r="2.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                              <circle cx={cx} cy={cyR} r="2.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Chart X-axis Labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      {analyticsData.trends.map((t: any, i: number) => (
                        <span key={i}>{t.date}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart 2: Coin Economy Burn Center */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
                  <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Coin Ecosystem Issuance vs Burn</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>Track token generation vs utility redemptions</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 600 }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }}></span> Coins Earned</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 600 }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Coins Burned</span>
                    </div>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                      
                      {/* Responsive Coin economy SVG */}
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="earnedGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#eab308" stopOpacity="0.0"/>
                          </linearGradient>
                          <linearGradient id="burnGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Horizontal Gridlines */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="40" x2="100" y2="40" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="60" x2="100" y2="60" stroke="#f1f5f9" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />
                        
                        {/* Area glow under lines */}
                        {(() => {
                          const maxC = Math.max(...analyticsData.trends.map((t: any) => Math.max(t.coinsGenerated, t.coinsSpent)), 1);
                          const ptsC = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.coinsGenerated / maxC) * 80}`).join(" ");
                          return <polygon points={`0,100 ${ptsC} 100,100`} fill="url(#earnedGlow)" />;
                        })()}

                        {(() => {
                          const maxC = Math.max(...analyticsData.trends.map((t: any) => Math.max(t.coinsGenerated, t.coinsSpent)), 1);
                          const ptsB = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.coinsSpent / maxC) * 80}`).join(" ");
                          return <polygon points={`0,100 ${ptsB} 100,100`} fill="url(#burnGlow)" />;
                        })()}

                        {/* Line charts */}
                        {(() => {
                          const maxC = Math.max(...analyticsData.trends.map((t: any) => Math.max(t.coinsGenerated, t.coinsSpent)), 1);
                          const ptsC = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.coinsGenerated / maxC) * 80}`).join(" ");
                          return <polyline fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ptsC} />;
                        })()}

                        {(() => {
                          const maxC = Math.max(...analyticsData.trends.map((t: any) => Math.max(t.coinsGenerated, t.coinsSpent)), 1);
                          const ptsB = analyticsData.trends.map((t: any, i: number) => `${(i / 6) * 100},${100 - (t.coinsSpent / maxC) * 80}`).join(" ");
                          return <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ptsB} />;
                        })()}

                        {/* Interactive Data dots */}
                        {analyticsData.trends.map((t: any, i: number) => {
                          const maxC = Math.max(...analyticsData.trends.map((t: any) => Math.max(t.coinsGenerated, t.coinsSpent)), 1);
                          const cx = (i / 6) * 100;
                          const cyC = 100 - (t.coinsGenerated / maxC) * 80;
                          const cyB = 100 - (t.coinsSpent / maxC) * 80;
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cyC} r="2.5" fill="#eab308" stroke="#ffffff" strokeWidth="1" />
                              <circle cx={cx} cy={cyB} r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Chart X-axis Labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      {analyticsData.trends.map((t: any, i: number) => (
                        <span key={i}>{t.date}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Sub-Panels: Coin circulation, session analytics & retention grids */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                
                {/* Sub-Panel 1: Coin Economy Summary */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>💎 Coin Economy Metrics</h4>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Coins in Circulation</span>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{analyticsData.coin.circulation.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Average Balance / User</span>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{analyticsData.coin.avgCoins.toLocaleString()} Coins</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Coins Generated (Today)</span>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>+{analyticsData.coin.generatedToday.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Coins Spent/Burned (Today)</span>
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>-{analyticsData.coin.spentToday.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Economy Inflation Rate</span>
                        <span style={{ fontWeight: 'bold', color: analyticsData.coin.burnRatio < 30 ? '#ef4444' : '#10b981' }}>
                          {analyticsData.coin.burnRatio < 30 ? 'HIGH (Inflating)' : 'HEALTHY (Stable)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Panel 2: Premium User Session Retention Heat-map */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>📅 Cohort Cohort Retention Rate</h4>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>D1 Retention</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', margin: '6px 0' }}>{analyticsData.retention.d1}%</div>
                        <div style={{ fontSize: '10px', color: '#86efac' }}>Target: {'>'}40%</div>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>D7 Retention</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8', margin: '6px 0' }}>{analyticsData.retention.d7}%</div>
                        <div style={{ fontSize: '10px', color: '#93c5fd' }}>Target: {'>'}20%</div>
                      </div>
                      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#5b21b6', fontWeight: 600 }}>D30 Retention</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#6d28d9', margin: '6px 0' }}>{analyticsData.retention.d30}%</div>
                        <div style={{ fontSize: '10px', color: '#c084fc' }}>Target: {'>'}8%</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '11.5px', color: '#64748b', textAlign: 'center' }}>
                      Retention is calculated on user check-ins & transaction events logs.
                    </div>
                  </div>
                </div>

                {/* Sub-Panel 3: User Engagement & Telegram Sources */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>📊 Session & Entry Channels</h4>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    
                    {/* Session indicators */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Session Depth</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{analyticsData.session.sessionDepth} events</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Avg Duration</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{analyticsData.session.avgSessionDuration}</div>
                      </div>
                    </div>

                    {/* Telegram Entry sources channel list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          <span>Telegram Channel / Group Invites</span>
                          <span>{analyticsData.telegramSources.channel}%</span>
                        </div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '3px' }}>
                          <div style={{ width: `${analyticsData.telegramSources.channel}%`, background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          <span>Direct Bot Starts</span>
                          <span>{analyticsData.telegramSources.direct}%</span>
                        </div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '3px' }}>
                          <div style={{ width: `${analyticsData.telegramSources.direct}%`, background: '#a855f7', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          <span>Group Chats Integrations</span>
                          <span>{analyticsData.telegramSources.group}%</span>
                        </div>
                        <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '3px' }}>
                          <div style={{ width: `${analyticsData.telegramSources.group}%`, background: '#10b981', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Ecosystem Engagement Leaderboards & Real-time Audit logs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Left Panel: Top Users Leaderboards */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>🏆 Ecosystem Performance Leaderboards</h4>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px' }}>
                    
                    {/* Top Earners */}
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.05em' }}>💰 Top Cash-Out / Earners Balance</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {analyticsData.topUsers.earners.map((u: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px' }}>
                          <span><strong>#{idx + 1}</strong> {u.first_name} <span style={{ color: '#94a3b8' }}>(@{u.username})</span></span>
                          <span style={{ fontWeight: 'bold', color: '#10b981' }}>{u.balance.toLocaleString()} Coins</span>
                        </div>
                      ))}
                    </div>

                    {/* Top Referrers */}
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#a855f7', letterSpacing: '0.05em' }}>📢 Top Referrers & Growth loops</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {analyticsData.topUsers.referrers.map((u: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px' }}>
                          <span><strong>#{idx + 1}</strong> {u.first_name} <span style={{ color: '#94a3b8' }}>(@{u.username})</span></span>
                          <span style={{ fontWeight: 'bold', color: '#a855f7' }}>{u.invite_count} Refers</span>
                        </div>
                      ))}
                    </div>

                    {/* Longest Daily Streaks */}
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#eab308', letterSpacing: '0.05em' }}>🔥 Daily Check-in Streak Champions</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analyticsData.topUsers.streaks.map((u: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px' }}>
                          <span><strong>#{idx + 1}</strong> {u.first_name} <span style={{ color: '#94a3b8' }}>(@{u.username})</span></span>
                          <span style={{ fontWeight: 'bold', color: '#eab308' }}>🔥 {u.streak} Days Streak</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Right Panel: Real-time Activity Logs Stream */}
                <div className={styles.lteCard} style={{ borderRadius: '16px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardHeader} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>⚡ Real-time Network Activity Feed</h4>
                  </div>
                  <div className={styles.lteCardBody} style={{ padding: '24px', maxHeight: '540px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analyticsData.realtimeFeed.map((txn: any) => (
                        <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f8fafc', paddingBottom: '10px' }}>
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                              User <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }}>{txn.telegram_id}</code>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{txn.description}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(txn.created_at || txn.createdAt).toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={styles.lteBadge} style={
                              txn.type === 'withdrawal' ? { background: '#fef2f2', color: '#ef4444' } :
                              txn.type === 'referral' ? { background: '#f5f3ff', color: '#8b5cf6' } :
                              { background: '#f0fdf4', color: '#22c55e' }
                            }>
                              {txn.type.toUpperCase()}
                            </span>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px', color: txn.amount < 0 ? '#ef4444' : '#22c55e' }}>
                              {txn.amount < 0 ? '' : '+'}{txn.amount} c
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                          <div><strong>ID:</strong> <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{user.telegram_id}</code></div>
                          <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}><strong>Phone:</strong> {user.phone_number || 'N/A'}</div>
                          {user.referred_by && (
                            <div style={{ color: '#d97706', fontSize: '11px', marginTop: '2px' }}>
                              <strong>Referred By:</strong> <code style={{ background: '#fffbeb', padding: '1px 3px', borderRadius: '3px', border: '1px solid #fde68a' }}>{user.referred_by}</code>
                            </div>
                          )}
                          {user.ip_address && (
                            <div style={{ color: '#2563eb', fontSize: '11px', marginTop: '2px' }}>
                              <strong>IP:</strong> <code style={{ background: '#eff6ff', padding: '1px 3px', borderRadius: '3px', border: '1px solid #bfdbfe' }}>{user.ip_address}</code>
                            </div>
                          )}
                          {user.google_aid && (
                            <div style={{ color: '#059669', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all', maxWidth: '200px' }}>
                              <strong>Google AID:</strong> <code style={{ background: '#ecfdf5', padding: '1px 3px', borderRadius: '3px', border: '1px solid #a7f3d0', fontSize: '10px' }}>{user.google_aid}</code>
                            </div>
                          )}
                          {user.ios_idfa && (
                            <div style={{ color: '#4f46e5', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all', maxWidth: '200px' }}>
                              <strong>iOS IDFA:</strong> <code style={{ background: '#e0e7ff', padding: '1px 3px', borderRadius: '3px', border: '1px solid #c7d2fe', fontSize: '10px' }}>{user.ios_idfa}</code>
                            </div>
                          )}
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

              {/* Premium Pagination Footer */}
              <div className={styles.lteCardFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '13px' }}>
                  <span>Show</span>
                  <select 
                    value={usersLimit} 
                    onChange={(e) => {
                      setUsersLimit(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                  >
                    {[10, 20, 50, 100].map(val => (
                      <option key={val} value={val}>{val} entries</option>
                    ))}
                  </select>
                  <span>of <strong>{totalUsers.toLocaleString()}</strong> users</span>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                        color: currentPage === 1 ? '#94a3b8' : '#0f172a',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Previous
                    </button>

                    {/* Pagination Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = currentPage;
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            minWidth: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: currentPage === pageNum ? '#3b82f6' : '#e2e8f0',
                            background: currentPage === pageNum ? '#3b82f6' : '#ffffff',
                            color: currentPage === pageNum ? '#ffffff' : '#0f172a',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                        color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──── VIEW: BROADCAST CENTER ──── */}
          {activeView === 'broadcast_center' && (
            <div className={`${styles.broadcastCenterGrid} ${styles.lteFadeIn}`}>
              {/* Left Side: Campaign Editor */}
              <div className={styles.lteCard}>
                <div className={`${styles.lteCardHeader} ${styles.lteBorderPrimary}`}>
                  <h3 className={styles.lteCardTitle}>
                    {selectedBroadcast ? `✏️ Edit Campaign: ${selectedBroadcast.title}` : "📢 Broadcast Campaign Composer"}
                  </h3>
                </div>
                <div className={styles.lteCardBody}>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Campaign Reference Name (Internal)</label>
                    <input 
                      type="text" 
                      className={styles.lteFormControl} 
                      placeholder="e.g. Daily Check-in Reminder or Eid Coins Booster" 
                      value={broadcastForm.title} 
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    />
                  </div>

                  <div className={styles.lteFormGroup} style={{ marginTop: '15px' }}>
                    <label className={styles.lteFormLabel}>
                      Telegram Message Body (HTML supported: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a&gt;)
                    </label>
                    <textarea 
                      id="broadcastMessageInput"
                      className={styles.lteFormControl} 
                      style={{ height: '140px', resize: 'vertical' }} 
                      placeholder="Hello {first_name}! Earn daily coins on Rewardly by complete tasks. Click button below to claim now!" 
                      value={broadcastForm.message} 
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    />
                    
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                      💡 Click variable tag below to dynamically inject it at your active cursor:
                    </div>
                    <div className={styles.variableBadgeGroup}>
                      {[
                        { tag: '{first_name}', label: 'First Name' },
                        { tag: '{username}', label: 'Telegram @Username' },
                        { tag: '{coins}', label: 'Coin Balance' },
                        { tag: '{referrals}', label: 'Referrals Count' },
                        { tag: '{wallet}', label: 'Cash Equiv (₹)' }
                      ].map((item) => (
                        <span 
                          key={item.tag} 
                          className={styles.variableBadge} 
                          onClick={() => insertVariable(item.tag)}
                          title={`Inject ${item.label}`}
                        >
                          {item.tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Target User Segment Group</label>
                      <select 
                        className={styles.lteFormControl}
                        value={broadcastForm.target_type}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, target_type: e.target.value })}
                      >
                        <option value="all_users">All Users</option>
                        <option value="active_users">Active Users (last 24h)</option>
                        <option value="inactive_users">Inactive Users (3+ days)</option>
                        <option value="vip_users">VIP Tier (balance &gt;= 5000)</option>
                        <option value="new_users">New Registrations (last 24h)</option>
                        <option value="referral_users">Active Referrers (invite_count &gt;= 1)</option>
                        <option value="wallet_users">High Balance Users (balance &gt;= 1000)</option>
                      </select>
                    </div>

                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Media Attachment Type</label>
                      <select 
                        className={styles.lteFormControl}
                        value={broadcastForm.media_type}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, media_type: e.target.value })}
                      >
                        <option value="none">No Attachment (Text Only)</option>
                        <option value="photo">Photo / Graphic Image</option>
                        <option value="video">MP4 Video Clip</option>
                        <option value="animation">GIF / Animation</option>
                      </select>
                    </div>
                  </div>

                  {broadcastForm.media_type !== 'none' && (
                    <div className={styles.lteFormGroup} style={{ marginTop: '15px' }}>
                      <label className={styles.lteFormLabel}>
                        Media URL (Hosted on Media Manager or absolute external URL)
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          className={styles.lteFormControl} 
                          placeholder="e.g. https://rewardlyapi.satyainfotechnetworks.com/uploads/broadcasts/image.jpg" 
                          value={broadcastForm.media_url} 
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, media_url: e.target.value })}
                        />
                        <button 
                          className={`${styles.lteBtn} ${styles.lteBtnSecondary}`}
                          onClick={() => setActiveView('media_manager')}
                          title="Open Media Asset Folder"
                        >
                          Select Asset
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.lteDivider} style={{ margin: '20px 0' }}></div>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '12px' }}>🔗 Inline Call-to-Action Interactive Button</h5>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '15px' }}>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Button Text Label</label>
                      <input 
                        type="text" 
                        className={styles.lteFormControl} 
                        placeholder="e.g. Open App & Claim 🎁" 
                        value={broadcastForm.button_text} 
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, button_text: e.target.value })}
                      />
                    </div>
                    <div className={styles.lteFormGroup}>
                      <label className={styles.lteFormLabel}>Button Action Destination URL</label>
                      <input 
                        type="text" 
                        className={styles.lteFormControl} 
                        placeholder="e.g. https://t.me/Rewardly_Bot/app" 
                        value={broadcastForm.button_url} 
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, button_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.lteDivider} style={{ margin: '20px 0' }}></div>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '12px' }}>📅 Delivery Scheduling Configuration</h5>

                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Scheduled Date & Time (Optional - leave empty for immediate queueing)</label>
                    <input 
                      type="datetime-local" 
                      className={styles.lteFormControl} 
                      value={broadcastForm.schedule_time} 
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, schedule_time: e.target.value })}
                    />
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                      ⏰ Campaigns are run relative to Indian Standard Time (IST, UTC+5:30) timezone schedules.
                    </div>
                  </div>
                </div>
                <div className={styles.lteCardFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnSecondary}`}
                    onClick={() => {
                      setSelectedBroadcast(null);
                      setBroadcastForm({
                        title: "",
                        message: "",
                        media_type: "none",
                        media_url: "",
                        button_text: "",
                        button_url: "",
                        target_type: "all_users",
                        schedule_time: "",
                        status: "draft"
                      });
                    }}
                  >
                    Clear Form
                  </button>

                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnInfo}`}
                    onClick={() => handleSaveBroadcast("draft")}
                  >
                    Save as Draft
                  </button>

                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                    onClick={() => {
                      if (broadcastForm.schedule_time) {
                        handleSaveBroadcast("scheduled");
                      } else {
                        handleSaveBroadcast("running");
                      }
                    }}
                  >
                    {broadcastForm.schedule_time ? "🗓 Schedule Campaign" : "🚀 Queue & Send Immediate"}
                  </button>
                </div>
              </div>

              {/* Right Side: Telegram Simulated Mock Frame */}
              <div className={styles.telegramPreviewContainer}>
                <div className={styles.telegramPreviewFrame}>
                  <div className={styles.telegramPreviewHeader}>
                    <div className={styles.telegramPreviewAvatar}>R</div>
                    <div className={styles.telegramPreviewInfo}>
                      <div className={styles.telegramPreviewBotName}>Rewardly Official Bot</div>
                      <div className={styles.telegramPreviewBotStatus}>bot</div>
                    </div>
                  </div>
                  <div className={styles.telegramChatBg}>
                    <div className={styles.telegramBubble}>
                      {broadcastForm.media_type !== 'none' && broadcastForm.media_url && (
                        <div className={styles.telegramBubbleMedia}>
                          {broadcastForm.media_type === 'video' ? (
                            <video src={broadcastForm.media_url} controls={false} autoPlay loop muted />
                          ) : (
                            <img src={broadcastForm.media_url} alt="Attached Media Preview" onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/fff?text=Invalid+Media+URL";
                            }} />
                          )}
                        </div>
                      )}
                      
                      <div className={styles.telegramBubbleContent}>
                        <div className={styles.telegramBubbleText}>
                          {(() => {
                            let previewText = broadcastForm.message || "Enter a message body in the editor to preview simulated Telegram message bubble.";
                            const replacements: Record<string, string> = {
                              '{first_name}': '<b>Satya Sai</b>',
                              '{username}': '<b>@satyasai2503</b>',
                              '{coins}': '<code>5,240</code>',
                              '{referrals}': '<code>12</code>',
                              '{wallet}': '<b>₹52.40</b>'
                            };
                            for (const [placeholder, val] of Object.entries(replacements)) {
                              previewText = previewText.replace(new RegExp(placeholder, 'g'), val);
                            }
                            return <div dangerouslySetInnerHTML={{ __html: previewText }} />;
                          })()}
                          <span className={styles.telegramBubbleTime}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {broadcastForm.button_text && (
                          <div className={styles.telegramInlineKeyboard}>
                            <button className={styles.telegramInlineBtn}>
                              {broadcastForm.button_text}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: CAMPAIGN STATS ──── */}
          {activeView === 'broadcast_analytics' && (
            <div className={`${styles.lteFadeIn}`}>
              {/* Premium Analytics Cards Row */}
              <div className={styles.lteStatsGrid} style={{ marginBottom: '24px' }}>
                <div className={styles.lteCard} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardBody} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div className={styles.progressRingContainer}>
                      <svg width="100" height="100">
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * Math.min(100, broadcasts.length * 10)) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.progressRingInfo}>
                        <span className={styles.progressRingTitle}>{broadcasts.length}</span>
                        <span className={styles.progressRingSubtitle} style={{ display: 'block', fontSize: '8px' }}>Total</span>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: '#475569' }}>Total Campaigns</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Broadcasting events successfully registered inside Rewardly history log database.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.lteCard} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardBody} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div className={styles.progressRingContainer}>
                      <svg width="100" height="100">
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * 88) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.progressRingInfo}>
                        <span className={styles.progressRingTitle} style={{ color: '#10b981' }}>88%</span>
                        <span className={styles.progressRingSubtitle} style={{ display: 'block', fontSize: '8px' }}>Rate</span>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: '#475569' }}>Avg Delivery Rate</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Percentage of active Telegram user channels receiving the broadcasts successfully.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.lteCard} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className={styles.lteCardBody} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div className={styles.progressRingContainer}>
                      <svg width="100" height="100">
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#eab308" strokeWidth="8" fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * 14.5) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.progressRingInfo}>
                        <span className={styles.progressRingTitle} style={{ color: '#eab308' }}>14.5%</span>
                        <span className={styles.progressRingSubtitle} style={{ display: 'block', fontSize: '8px' }}>CTR</span>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: '#475569' }}>Avg Engagement CTR</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Rate of custom CTA inline buttons being clicked, monitored by S2S redirect redirects.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Campaign Table Card */}
              <div className={styles.lteCard}>
                <div className={styles.lteCardHeader}>
                  <h3 className={styles.lteCardTitle}>📊 Broadcast Campaigns Master Audit History</h3>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Campaign Title</th>
                        <th>Target Group</th>
                        <th>Media Format</th>
                        <th>Scheduled / Sent Time</th>
                        <th>Status</th>
                        <th>Performance Logs</th>
                        <th>Action Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcasts.length > 0 ? (
                        broadcasts.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong>{b.title}</strong>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', wordBreak: 'break-all', maxWidth: '240px' }}>
                                {b.message.length > 80 ? b.message.substring(0, 80) + '...' : b.message}
                              </div>
                            </td>
                            <td>
                              <span className={styles.lteBadge} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                {b.target_type.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <span className={styles.lteBadge} style={{ background: '#f8fafc', color: '#475569' }}>
                                {b.media_type.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                                {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : new Date(b.created_at || b.createdAt).toLocaleString()}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.lteBadge} ${
                                b.status === 'completed' ? styles.lteBadgeSuccess :
                                b.status === 'running' ? styles.lteBadgeInfo :
                                b.status === 'scheduled' ? styles.lteBadgeWarning :
                                styles.lteBadgeSecondary
                              }`}>
                                {b.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {b.status === 'completed' || b.status === 'running' ? (
                                <div style={{ fontSize: '11.5px', lineHeight: 1.6 }}>
                                  <div>🟢 Success: <strong>{b.delivered_count || 0}</strong></div>
                                  <div>🔴 Failed: <strong>{b.failed_count || 0}</strong></div>
                                  <div>🚫 Blocks: <strong>{b.blocked_count || 0}</strong></div>
                                  <div>🖱 Clicks: <strong style={{ color: '#3b82f6' }}>{b.clicked_count || 0}</strong> ({b.delivered_count > 0 ? ((b.clicked_count / b.delivered_count) * 100).toFixed(1) : 0}%)</div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11.5px' }}>Metrics pending queue</span>
                              )}
                            </td>
                            <td>
                              <div className={styles.lteBtnGroup}>
                                <button 
                                  className={`${styles.lteBtn} ${styles.lteBtnInfo}`} 
                                  onClick={() => handleViewBroadcastDetails(b.id)}
                                  title="View Real-Time Delivery Report Logs"
                                >
                                  <Eye size={14} />
                                </button>
                                <button 
                                  className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                  onClick={() => handleDeleteBroadcast(b.id)}
                                  title="Erase Campaign History"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No broadcast campaigns registered in databases yet. Create one in the Broadcast Center!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: SCHEDULED BROADCASTS ──── */}
          {activeView === 'scheduled_broadcasts' && (
            <div className={`${styles.lteFadeIn}`}>
              <div className={styles.lteCard}>
                <div className={`${styles.lteCardHeader} ${styles.lteBorderPrimary}`}>
                  <h3 className={styles.lteCardTitle}>🕒 Upcoming Queued Telegram Broadcast Campaigns</h3>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Campaign Title / Message</th>
                        <th>Target Segment Group</th>
                        <th>Media Format</th>
                        <th>Scheduled Execution Time</th>
                        <th>Status</th>
                        <th>Countdown Status</th>
                        <th>Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcasts.filter(b => b.status === 'scheduled').length > 0 ? (
                        broadcasts.filter(b => b.status === 'scheduled').map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong>{b.title}</strong>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                                {b.message.length > 70 ? b.message.substring(0, 70) + '...' : b.message}
                              </div>
                            </td>
                            <td>
                              <span className={styles.lteBadge} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                {b.target_type.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <span className={styles.lteBadge} style={{ background: '#f8fafc', color: '#475569' }}>
                                {b.media_type.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                                🇮🇳 {new Date(b.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.lteBadge} ${styles.lteBadgeWarning}`}>
                                SCHEDULED
                              </span>
                            </td>
                            <td>
                              {(() => {
                                const diff = new Date(b.scheduled_at).getTime() - new Date().getTime();
                                if (diff <= 0) {
                                  return <span style={{ color: '#10b981', fontWeight: 'bold' }}>⚡ Processing soon</span>;
                                }
                                const mins = Math.floor(diff / 60000);
                                const hrs = Math.floor(mins / 60);
                                if (hrs > 0) {
                                  return <span style={{ color: '#eab308', fontWeight: 'bold' }}>⏳ In {hrs}h {mins % 60}m</span>;
                                }
                                return <span style={{ color: '#eab308', fontWeight: 'bold' }}>⏳ In {mins} minutes</span>;
                              })()}
                            </td>
                            <td>
                              <div className={styles.lteBtnGroup}>
                                <button 
                                  className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                                  onClick={() => handleTriggerSendBroadcast(b.id)}
                                  title="Dispatch Immediately Now"
                                >
                                  <Play size={14} style={{ marginRight: '4px' }} /> Send Now
                                </button>
                                <button 
                                  className={`${styles.lteBtn} ${styles.lteBtnWarning}`}
                                  onClick={() => {
                                    setSelectedBroadcast(b);
                                    setBroadcastForm({
                                      title: b.title,
                                      message: b.message,
                                      media_type: b.media_type,
                                      media_url: b.media_url || "",
                                      button_text: b.button_text || "",
                                      button_url: b.button_url || "",
                                      target_type: b.target_type,
                                      schedule_time: b.scheduled_at ? new Date(b.scheduled_at).toISOString().slice(0, 16) : "",
                                      status: b.status
                                    });
                                    setActiveView('broadcast_center');
                                  }}
                                  title="Reschedule / Edit Details"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                  onClick={() => handleDeleteBroadcast(b.id)}
                                  title="Cancel Schedule"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No scheduled broadcast push campaigns found. Schedule one in the Broadcast Center!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: AUTOMATION RULES ──── */}
          {activeView === 'automation_rules' && (
            <div className={`${styles.lteFadeIn} ${styles.automationRuleContainer}`}>
              {/* Daily Inactive User Push */}
              <div className={styles.automationCard}>
                <div className={styles.automationCardHeader}>
                  <div className={styles.automationTitleGroup}>
                    <div className={styles.automationIconCircle} style={{ background: '#fef3c7', color: '#d97706' }}>
                      <BrainCircuit size={22} />
                    </div>
                    <div>
                      <div className={styles.automationTitle}>🧠 Daily 9:00 AM IST Inactive Reminder Push</div>
                      <div className={styles.automationDesc}>Triggers automatically every morning targeting users inactive for 3+ consecutive days.</div>
                    </div>
                  </div>
                  <label className={styles.lteSwitch}>
                    <input 
                      type="checkbox" 
                      checked={automationSettings.inactive_reminder}
                      onChange={(e) => setAutomationSettings({ ...automationSettings, inactive_reminder: e.target.checked })}
                    />
                    <span className={styles.lteSlider}></span>
                  </label>
                </div>
                {automationSettings.inactive_reminder && (
                  <div className={styles.automationCardBody}>
                    <label className={styles.lteFormLabel}>Auto-generated Message Template</label>
                    <textarea 
                      className={styles.automationTextarea}
                      value="Hello {first_name}! It's been a while since we saw you on Rewardly. 🎁 We have credited 100 free promo coins to your balance! Open Rewardly now to claim them and cash out your cash rewards!"
                      disabled
                    />
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      ⚡ Rate limits, randomized human delays, and flood protection are applied automatically to prevent Telegram Bot API bans.
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Withdraw Booster Push */}
              <div className={styles.automationCard}>
                <div className={styles.automationCardHeader}>
                  <div className={styles.automationTitleGroup}>
                    <div className={styles.automationIconCircle} style={{ background: '#d1fae5', color: '#059669' }}>
                      <Coins size={22} />
                    </div>
                    <div>
                      <div className={styles.automationTitle}>💰 Daily 9:00 AM IST Withdrawal Reminder Push</div>
                      <div className={styles.automationDesc}>Triggers automatically every morning targeting users with balance &gt;= 1,000 coins (₹10.00) who haven't cashed out.</div>
                    </div>
                  </div>
                  <label className={styles.lteSwitch}>
                    <input 
                      type="checkbox" 
                      checked={automationSettings.wallet_reminder}
                      onChange={(e) => setAutomationSettings({ ...automationSettings, wallet_reminder: e.target.checked })}
                    />
                    <span className={styles.lteSlider}></span>
                  </label>
                </div>
                {automationSettings.wallet_reminder && (
                  <div className={styles.automationCardBody}>
                    <label className={styles.lteFormLabel}>Auto-generated Message Template</label>
                    <textarea 
                      className={styles.automationTextarea}
                      value="Hi {first_name}! You have a withdrawable cash balance of {wallet} ({coins} coins) ready in your Rewardly account. 🥳 Click below to withdraw directly to Paytm or UPI instantly!"
                      disabled
                    />
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      ⚡ Tracks button clicks with redirect analytics automatically.
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Referral Booster Push */}
              <div className={styles.automationCard}>
                <div className={styles.automationCardHeader}>
                  <div className={styles.automationTitleGroup}>
                    <div className={styles.automationIconCircle} style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <Users size={22} />
                    </div>
                    <div>
                      <div className={styles.automationTitle}>📢 Daily 9:00 AM IST Referral booster Push</div>
                      <div className={styles.automationDesc}>Triggers automatically every morning targeting users with 0 referrals, encouraging organic growth loops.</div>
                    </div>
                  </div>
                  <label className={styles.lteSwitch}>
                    <input 
                      type="checkbox" 
                      checked={automationSettings.referral_push}
                      onChange={(e) => setAutomationSettings({ ...automationSettings, referral_push: e.target.checked })}
                    />
                    <span className={styles.lteSlider}></span>
                  </label>
                </div>
                {automationSettings.referral_push && (
                  <div className={styles.automationCardBody}>
                    <label className={styles.lteFormLabel}>Auto-generated Message Template</label>
                    <textarea 
                      className={styles.automationTextarea}
                      value="Hi {first_name}! 🚀 Bring your friends to Rewardly and earn unlimited cash lifetime! Get ₹5.00 for every validated friend plus 10% of all their task completion earnings forever! Click below to copy your referral link."
                      disabled
                    />
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      ⚡ Auto-generates unique user referral link variables inside Telegram chat button automatically.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                  onClick={async () => {
                    try {
                      const authSecret = localStorage.getItem("admin_secret") || secret;
                      const res = await fetch(`${API_URL}/api/admin/settings`, {
                        method: 'PUT',
                        headers: { 
                          'Content-Type': 'application/json',
                          'x-admin-secret': authSecret || ''
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          inactive_reminder_enabled: automationSettings.inactive_reminder,
                          wallet_reminder_enabled: automationSettings.wallet_reminder,
                          referral_push_enabled: automationSettings.referral_push
                        })
                      });
                      if (res.ok) {
                        showToast("Smart automation rule parameters saved successfully!");
                        setAppSettings((prev: any) => prev ? {
                          ...prev,
                          inactive_reminder_enabled: automationSettings.inactive_reminder,
                          wallet_reminder_enabled: automationSettings.wallet_reminder,
                          referral_push_enabled: automationSettings.referral_push
                        } : prev);
                      } else {
                        showToast("Failed to save automation rules", "error");
                      }
                    } catch (error) {
                      console.error("Save Automation Rules Error:", error);
                      showToast("Failed to save automation rules", "error");
                    }
                  }}
                >
                  Save Automation Rules
                </button>
              </div>
            </div>
          )}

          {/* ──── VIEW: MEDIA MANAGER ──── */}
          {activeView === 'media_manager' && (
            <div className={`${styles.lteFadeIn}`}>
              <div className={styles.lteCard}>
                <div className={`${styles.lteCardHeader} ${styles.lteBorderPrimary}`}>
                  <h3 className={styles.lteCardTitle}>🖼 Media Assets Upload Folders</h3>
                </div>
                <div className={styles.lteCardBody}>
                  {/* Dropzone File Uploader */}
                  <div 
                    className={`${styles.mediaDropzone} ${mediaDragActive ? styles.mediaDropzoneActive : ''}`}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setMediaDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setMediaDragActive(false); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setMediaDragActive(true); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMediaDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        await handleUploadMediaFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById("mediaFileInput");
                      if (fileInput) fileInput.click();
                    }}
                  >
                    <input 
                      type="file" 
                      id="mediaFileInput"
                      style={{ display: 'none' }}
                      accept="image/*,video/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          await handleUploadMediaFile(e.target.files[0]);
                        }
                      }}
                    />
                    <Image size={40} style={{ color: '#94a3b8' }} />
                    <div className={styles.mediaDropzoneTitle}>Drag & Drop media file here, or click to browse files</div>
                    <div className={styles.mediaDropzoneSubtitle}>Supports JPG, PNG, GIF (Max 10MB) and MP4 Video (Max 50MB)</div>
                  </div>

                  {mediaUploading && (
                    <div className={styles.mediaUploadProgressContainer}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        <span>Uploading media assets to production storage server...</span>
                        <span>Please wait</span>
                      </div>
                      <div className={styles.mediaProgressBar}>
                        <div className={styles.mediaProgressFill} style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Media Files Grid */}
                  <div className={styles.mediaGrid}>
                    {mediaFiles.length > 0 ? (
                      mediaFiles.map((file) => (
                        <div key={file.name} className={styles.mediaCard}>
                          <div className={styles.mediaCardPreview}>
                            <span className={styles.mediaCardTypeBadge}>
                              {file.type.toUpperCase()}
                            </span>
                            {file.type === 'video' ? (
                              <video src={file.url} controls={false} muted />
                            ) : (
                              <img src={file.url} alt={file.name} onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/fff?text=No+Thumbnail";
                              }} />
                            )}
                          </div>
                          <div className={styles.mediaCardBody}>
                            <div className={styles.mediaCardName} title={file.name}>
                              {file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}
                            </div>
                            <div className={styles.mediaCardMeta}>
                              <span>📏 {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                              <span>📅 {new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.mediaCardActions}>
                              <button 
                                className={`${styles.mediaCardBtn} ${styles.mediaCardBtnCopy}`}
                                onClick={() => {
                                  navigator.clipboard.writeText(file.url);
                                  showToast("Absolute URL copied to clipboard!");
                                }}
                              >
                                Copy URL
                              </button>
                              <button 
                                className={`${styles.mediaCardBtn} ${styles.mediaCardBtnDelete}`}
                                onClick={() => handleDeleteMediaFile(file.name)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                        No uploaded media assets found. Drag and drop file to upload your first graphic campaign!
                      </div>
                    )}
                  </div>
                </div>
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

          {/* ──── VIEW: LIFAFA PROMO CODES ──── */}
          {activeView === 'lifafas' && (
            <div className={styles.lteCard}>
              <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.lteCardTitle}>🧧 Lifafa (Promo Code) Manager</h3>
                <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={() => setIsLifafaModalOpen(true)}>
                  <Plus size={16} style={{ marginRight: '6px' }} /> Create New Lifafa
                </button>
              </div>
              <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                  <thead>
                    <tr>
                      <th>Promo Code</th>
                      <th>Reward Amount</th>
                      <th>Max Claims</th>
                      <th>Current Claims</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifafas.map(l => (
                      <tr key={l.id}>
                        <td><code className={styles.lteCode}>{l.code}</code></td>
                        <td><strong style={{ color: '#28a745' }}>+{l.reward_coins} Coins</strong></td>
                        <td>{l.max_uses === -1 ? 'Unlimited' : l.max_uses}</td>
                        <td><span className={styles.lteCoinTag}>{l.current_uses} claims</span></td>
                        <td>{l.expires_at ? new Date(l.expires_at).toLocaleString() : 'Never Expires'}</td>
                        <td>
                          <span className={`${styles.lteBadge} ${l.status === 'active' ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                            {l.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                            onClick={async () => {
                              if (confirm(`Delete promo code "${l.code}"?`)) {
                                try {
                                  const res = await fetch(`${API_URL}/api/admin/lifafas/${l.id}`, {
                                    method: 'DELETE',
                                    headers: { 'x-admin-secret': secret },
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    showToast("Lifafa promo code deleted successfully!");
                                    fetchAllData(secret);
                                  }
                                } catch (err) {
                                  showToast("Failed to delete", "error");
                                }
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

          {/* ──── VIEW: CUSTOM OFFERS ──── */}
          {activeView === 'custom_offers' && (
            <div>
              <div className={styles.lteCard}>
                <div className={styles.lteCardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className={styles.lteCardTitle}>Custom Offers Management</h3>
                  <button 
                    className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                    onClick={() => {
                      setEditingOffer(null);
                      setOfferForm({
                        title: '',
                        external_id: '',
                        description: '',
                        category: 'Top Offers',
                        icon_url: '',
                        tracking_url: '',
                        total_reward: 0,
                        actual_price: 0,
                        is_active: true,
                        type: 'online',
                        reward_type: 'Multi Reward',
                        estimated_time: '5 mins',
                        difficulty: 'Medium',
                        is_hot: false,
                        extra_label: '',
                        input_type: 'text',
                        input_instruction: '',
                        tiers: [],
                        daily_completion_cap: 0,
                        country_targeting: 'IN'
                      });
                      setIsOfferModalOpen(true);
                    }}
                  >
                    <Plus size={16} style={{ marginRight: '6px' }} /> Create Custom Offer
                  </button>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Offer Details</th>
                        <th>Category & Region</th>
                        <th>Rewards</th>
                        <th>Type & Limit</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customOffers.map(offer => (
                        <tr key={offer.id}>
                          <td>
                            <strong>{offer.title}</strong>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>ID: {offer.id}</div>
                            {offer.is_hot && <span className={styles.lteBadge} style={{ background: '#fef3c7', color: '#d97706', fontSize: '9px', fontWeight: 'bold', marginLeft: '6px' }}>🔥 HOT</span>}
                          </td>
                          <td>
                            <span className={styles.lteBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>{offer.category}</span>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>Geo: {offer.country_targeting}</div>
                          </td>
                          <td>
                            <div style={{ color: '#28a745', fontWeight: '800' }}>🪙 {offer.total_reward}</div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Price: ${offer.actual_price}</div>
                          </td>
                          <td>
                            <span className={styles.lteBadge} style={{ background: '#f1f5f9', color: '#475569' }}>{offer.type}</span>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
                              Cap: {offer.daily_completion_cap > 0 ? offer.daily_completion_cap : 'unlimited'} (done: {offer.completions_count || 0})
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.lteBadge} ${offer.is_active ? styles.lteBadgeSuccess : styles.lteBadgeDanger}`}>
                              {offer.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td>
                            <div className={styles.lteBtnGroup}>
                              <button
                                className={`${styles.lteBtn} ${styles.lteBtnWarning}`}
                                onClick={() => {
                                  setEditingOffer(offer);
                                  setOfferForm({
                                    ...offer,
                                    tiers: offer.tiers || []
                                  });
                                  setIsOfferModalOpen(true);
                                }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                onClick={() => handleDeleteOffer(offer.id)}
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
            </div>
          )}

          {/* ──── VIEW: CUSTOM PROOFS ──── */}
          {activeView === 'custom_proofs' && (
            <div>
              <div className={styles.lteCard}>
                <div className={styles.lteCardHeader}>
                  <h3 className={styles.lteCardTitle}>Verification Proofs Manager</h3>
                </div>
                <div className={`${styles.lteCardBody} ${styles.lteTableResponsive}`}>
                  <table className={`${styles.lteTable} ${styles.lteTableStriped}`}>
                    <thead>
                      <tr>
                        <th>Player Info</th>
                        <th>Task / Custom Offer</th>
                        <th>Submitted Evidence</th>
                        <th>Time Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customProofs.length > 0 ? (
                        customProofs.map(proof => (
                          <tr key={proof.click_id}>
                            <td>
                              <strong>{proof.User?.first_name}</strong>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>@{proof.User?.username} (tg: {proof.user_id})</div>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>Wallet: {proof.User?.balance} c</div>
                            </td>
                            <td>
                              <strong>{proof.Offer?.title}</strong>
                              <div style={{ fontSize: '11px', color: '#28a745', fontWeight: 'bold' }}>Reward: 🪙 {proof.Offer?.total_reward} Coins</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Type: {proof.Offer?.input_type} ({proof.Offer?.input_instruction})</div>
                            </td>
                            <td>
                              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', wordBreak: 'break-all' }}>
                                {proof.user_input?.user_proof || JSON.stringify(proof.user_input)}
                                {proof.user_input?.screenshot_url && (
                                  <div style={{ marginTop: '4px' }}>
                                    <a href={proof.user_input.screenshot_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'underline' }}>View Screenshot 🔗</a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px' }}>{new Date(proof.last_updated).toLocaleString()}</div>
                            </td>
                            <td>
                              <div className={styles.lteBtnGroup}>
                                <button
                                  className={`${styles.lteBtn} ${styles.lteBtnSuccess}`}
                                  onClick={() => handleApproveProof(proof.click_id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className={`${styles.lteBtn} ${styles.lteBtnDanger}`}
                                  onClick={() => {
                                    setRejectingClickId(proof.click_id);
                                    setOfferRejectionReason('');
                                    setIsOfferRejectionModalOpen(true);
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No pending custom task proofs to verify
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──── VIEW: POSTBACK GUIDE ──── */}
          {activeView === 'postback_guide' && (
            <div>
              <div className={styles.lteCard}>
                <div className={styles.lteCardHeader}>
                  <h3 className={styles.lteCardTitle}>S2S Postback Integration Guide</h3>
                </div>
                <div className={styles.lteCardBody} style={{ color: '#334155', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                    Use the Server-to-Server (S2S) postback webhook endpoint below to dynamically verify and reward completed online tasks or tier-based achievements.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GLOBAL POSTBACK WEBHOOK URL</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <code style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 14px', borderRadius: '8px', flex: 1, fontSize: '12.5px', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        https://rewardlyapi.satyainfotechnetworks.com/api/postbacks/custom-offer?click_id={"{click_id}"}&tier={"{sequence_or_title}"}
                      </code>
                      <button 
                        className={`${styles.lteBtn} ${styles.lteBtnPrimary}`}
                        style={{ padding: '10px 16px', whiteSpace: 'nowrap', margin: 0 }}
                        onClick={() => {
                          navigator.clipboard.writeText("https://rewardlyapi.satyainfotechnetworks.com/api/postbacks/custom-offer?click_id={click_id}&tier={sequence_or_title}");
                          alert("URL copied to clipboard!");
                        }}
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Query Parameters</h4>
                  <div className={styles.lteTableResponsive} style={{ marginBottom: '24px' }}>
                    <table className={styles.lteTable} style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Type</th>
                          <th>Requirement</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>click_id</code> <span style={{ color: '#64748b', fontSize: '11px' }}>or <code>clickId</code>, <code>trans_id</code></span></td>
                          <td><span style={{ background: '#eef2ff', color: '#6366f1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>STRING</span></td>
                          <td><span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '11px' }}>REQUIRED</span></td>
                          <td>The unique click UUID generated when the user started the task (ex. <code>{"{click_id}"}</code> macro in redirect URLs).</td>
                        </tr>
                        <tr>
                          <td><code>tier</code></td>
                          <td><span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>INT / STRING</span></td>
                          <td><span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '11px' }}>OPTIONAL</span></td>
                          <td>
                            The specific milestone to reward. Can be:
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                              <li>Sequence Number: <code>1</code>, <code>2</code>, etc.</li>
                              <li>Backend Title: <code>install_app</code>, <code>level_10</code>, etc.</li>
                              <li>If omitted, the full reward is credited and the offer completes.</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Integration Examples</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '13px' }}>Example 1: Single Reward Offer</h5>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>Fires webhook to complete the entire offer and credit all coins instantly.</p>
                      <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', margin: 0 }}>
                        GET /api/postbacks/custom-offer?click_id=4a8e28c5-335a-4bfa-b7e7-09285210a890
                      </pre>
                    </div>

                    <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '13px' }}>Example 2: Multi-Milestone Offer</h5>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>Fires webhook to reward Step 1 (sequence 1) of a tiered game/app.</p>
                      <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', margin: 0 }}>
                        GET /api/postbacks/custom-offer?click_id=4a8e28c5-335a-4bfa-b7e7-09285210a890&tier=1
                      </pre>
                    </div>
                  </div>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Game Reward (Coins)</label>
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
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Watch & Earn Cooldown (sec)</label>
                    <input 
                      type="number"
                      className={styles.lteFormControl}
                      value={appSettings.watch_earn_cooldown || 60}
                      onChange={(e) => setAppSettings({...appSettings, watch_earn_cooldown: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>Jackpot Ad Cooldown (sec)</label>
                    <input 
                      type="number"
                      className={styles.lteFormControl}
                      value={appSettings.ad_entry_cooldown || 60}
                      onChange={(e) => setAppSettings({...appSettings, ad_entry_cooldown: parseInt(e.target.value)})}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
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
                  <div className={styles.lteFormGroup}>
                    <label className={styles.lteFormLabel}>AdsGram Visit Interstitial ID</label>
                    <input 
                      className={styles.lteFormControl}
                      placeholder="e.g. int 30395"
                      value={appSettings.adsgram_visit_block_id || 'int 30395'}
                      onChange={(e) => setAppSettings({...appSettings, adsgram_visit_block_id: e.target.value})}
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
              <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong>Telegram ID:</strong> <code style={{ background: 'white', padding: '1px 3px', borderRadius: '3px' }}>{editingUser.telegram_id}</code></div>
                  <div><strong>Phone:</strong> {editingUser.phone_number || 'N/A'}</div>
                  <div><strong>Referred By:</strong> <code style={{ background: 'white', padding: '1px 3px', borderRadius: '3px' }}>{editingUser.referred_by || 'Direct Join'}</code></div>
                  <div><strong>IP Address:</strong> <code style={{ background: 'white', padding: '1px 3px', borderRadius: '3px' }}>{editingUser.ip_address || 'N/A'}</code></div>
                </div>
                {editingUser.google_aid && (
                  <div style={{ marginTop: '8px', wordBreak: 'break-all' }}>
                    <strong>Google AID:</strong> <code style={{ background: 'white', padding: '1px 3px', borderRadius: '3px' }}>{editingUser.google_aid}</code>
                  </div>
                )}
                {editingUser.ios_idfa && (
                  <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                    <strong>iOS IDFA:</strong> <code style={{ background: 'white', padding: '1px 3px', borderRadius: '3px' }}>{editingUser.ios_idfa}</code>
                  </div>
                )}
              </div>

              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>User Account Wallet Balance (Coins)</label>
                <input 
                  type="number" 
                  className={styles.lteFormControl}
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                />
              </div>

              <div style={{ margin: '20px 0', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>⚡ Adjust User Coins Balance</h5>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button 
                    type="button"
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #28a745', background: adjustType === 'add' ? '#28a745' : 'white', color: adjustType === 'add' ? 'white' : '#28a745', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => setAdjustType('add')}
                  >
                    ➕ Add Coins
                  </button>
                  <button 
                    type="button"
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #dc3545', background: adjustType === 'remove' ? '#dc3545' : 'white', color: adjustType === 'remove' ? 'white' : '#dc3545', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => setAdjustType('remove')}
                  >
                    ➖ Remove Coins
                  </button>
                </div>
                <div className={styles.lteFormGroup} style={{ marginBottom: '10px' }}>
                  <label className={styles.lteFormLabel} style={{ fontSize: '11px' }}>Adjustment Coins Amount</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    placeholder="e.g. 500"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>
                <div className={styles.lteFormGroup} style={{ marginBottom: '12px' }}>
                  <label className={styles.lteFormLabel} style={{ fontSize: '11px' }}>Adjustment Message / Reason</label>
                  <input 
                    type="text"
                    className={styles.lteFormControl}
                    placeholder="e.g. Compensation for offerwall delay"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  className={`${styles.lteBtn} ${adjustType === 'add' ? styles.lteBtnSuccess : styles.lteBtnDanger}`}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}
                  onClick={() => handleAdjustCoins(editingUser.telegram_id)}
                  disabled={isAdjusting}
                >
                  {isAdjusting ? "Processing..." : `Confirm ${adjustType === 'add' ? 'Addition' : 'Removal'}`}
                </button>
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

      {/* ──── MODAL: EDIT/CREATE CUSTOM OFFER ──── */}
      {isOfferModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>{editingOffer ? 'Edit Custom Offer' : 'Create Custom Offer'}</h4>
              <button className={styles.lteModalClose} onClick={() => { setIsOfferModalOpen(false); setEditingOffer(null); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Offer Title</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. Register on StuEarn"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>External ID (optional)</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. stuearn_reg_01"
                    value={offerForm.external_id || ''}
                    onChange={(e) => setOfferForm({...offerForm, external_id: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                <label className={styles.lteFormLabel}>Description</label>
                <textarea 
                  className={styles.lteFormControl}
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Explain steps to complete the offer..."
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Category</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. Top Offers, Gaming"
                    value={offerForm.category || ''}
                    onChange={(e) => setOfferForm({...offerForm, category: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Difficulty</label>
                  <select 
                    className={styles.lteFormControl}
                    value={offerForm.difficulty}
                    onChange={(e) => setOfferForm({...offerForm, difficulty: e.target.value})}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Est. Time</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. 5 mins"
                    value={offerForm.estimated_time || ''}
                    onChange={(e) => setOfferForm({...offerForm, estimated_time: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Total Coins Reward</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={offerForm.total_reward}
                    onChange={(e) => setOfferForm({...offerForm, total_reward: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Internal Price / Cost</label>
                  <input 
                    type="number"
                    step="0.01"
                    className={styles.lteFormControl}
                    value={offerForm.actual_price}
                    onChange={(e) => setOfferForm({...offerForm, actual_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Daily Completion Cap</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={offerForm.daily_completion_cap}
                    onChange={(e) => setOfferForm({...offerForm, daily_completion_cap: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Icon URL</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="https://..."
                    value={offerForm.icon_url || ''}
                    onChange={(e) => setOfferForm({...offerForm, icon_url: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Tracking / Redirect URL</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="https://...{click_id}..."
                    value={offerForm.tracking_url || ''}
                    onChange={(e) => setOfferForm({...offerForm, tracking_url: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Task Type</label>
                  <select 
                    className={styles.lteFormControl}
                    value={offerForm.type}
                    onChange={(e) => setOfferForm({...offerForm, type: e.target.value})}
                  >
                    <option value="online">Online Task (Redirect)</option>
                    <option value="offline">Offline Task (Manual proof)</option>
                  </select>
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Proof Type Required</label>
                  <select 
                    className={styles.lteFormControl}
                    value={offerForm.input_type || 'text'}
                    onChange={(e) => setOfferForm({...offerForm, input_type: e.target.value})}
                    disabled={offerForm.type !== 'offline'}
                  >
                    <option value="text">Text ID / Transaction Hash</option>
                    <option value="screenshot">Screenshot Link / URL</option>
                  </select>
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Target Region / Country</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. IN or * for all"
                    value={offerForm.country_targeting}
                    onChange={(e) => setOfferForm({...offerForm, country_targeting: e.target.value})}
                  />
                </div>
              </div>

              {offerForm.type === 'offline' && (
                <div className={styles.lteFormGroup} style={{ marginTop: '10px' }}>
                  <label className={styles.lteFormLabel}>Instructions for Submitting Proof</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="Tell user what to input (e.g. Share your phone number used to register)"
                    value={offerForm.input_instruction || ''}
                    onChange={(e) => setOfferForm({...offerForm, input_instruction: e.target.value})}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Reward Structure</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. Multi Reward or Single"
                    value={offerForm.reward_type}
                    onChange={(e) => setOfferForm({...offerForm, reward_type: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Badge Label (optional)</label>
                  <input 
                    className={styles.lteFormControl}
                    placeholder="e.g. 🔥 Limited"
                    value={offerForm.extra_label || ''}
                    onChange={(e) => setOfferForm({...offerForm, extra_label: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={offerForm.is_active} 
                      onChange={(e) => setOfferForm({...offerForm, is_active: e.target.checked})} 
                    />
                    Active Offer
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={offerForm.is_hot} 
                      onChange={(e) => setOfferForm({...offerForm, is_hot: e.target.checked})} 
                    />
                    Hot / Featured
                  </label>
                </div>
              </div>

              {/* Milestones/Tiers Builder */}
              <div style={{ borderTop: '1px solid #dee2e6', marginTop: '20px', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Reward Milestones / Tiers</h5>
                  <button 
                    type="button"
                    className={`${styles.lteBtn} ${styles.lteBtnInfo}`} 
                    onClick={() => {
                      const nextSeq = offerForm.tiers.length + 1;
                      setOfferForm({
                        ...offerForm,
                        tiers: [
                          ...offerForm.tiers,
                          { 
                            title: `Step ${nextSeq}`, 
                            backend_title: `step_${nextSeq}`, 
                            reward: 10, 
                            steps: '', 
                            sequence: nextSeq 
                          }
                        ]
                      });
                    }}
                  >
                    + Add Milestone Step
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {offerForm.tiers.map((tier, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', position: 'relative' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          const newTiers = offerForm.tiers.filter((_, i) => i !== idx);
                          setOfferForm({ ...offerForm, tiers: newTiers });
                        }}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '10px' }}>
                        <div className={styles.lteFormGroup}>
                          <label style={{ fontSize: '11px' }}>Display Title</label>
                          <input 
                            className={styles.lteFormControl}
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                            value={tier.title || ''}
                            onChange={(e) => {
                              const newTiers = [...offerForm.tiers];
                              newTiers[idx].title = e.target.value;
                              setOfferForm({ ...offerForm, tiers: newTiers });
                            }}
                          />
                        </div>
                        <div className={styles.lteFormGroup}>
                          <label style={{ fontSize: '11px' }}>System Identifier</label>
                          <input 
                            className={styles.lteFormControl}
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                            value={tier.backend_title || tier.tier_title || ''}
                            onChange={(e) => {
                              const newTiers = [...offerForm.tiers];
                              newTiers[idx].backend_title = e.target.value;
                              newTiers[idx].tier_title = e.target.value;
                              setOfferForm({ ...offerForm, tiers: newTiers });
                            }}
                          />
                        </div>
                        <div className={styles.lteFormGroup}>
                          <label style={{ fontSize: '11px' }}>Coins Payout</label>
                          <input 
                            type="number"
                            className={styles.lteFormControl}
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                            value={tier.reward}
                            onChange={(e) => {
                              const newTiers = [...offerForm.tiers];
                              newTiers[idx].reward = parseFloat(e.target.value) || 0;
                              setOfferForm({ ...offerForm, tiers: newTiers });
                            }}
                          />
                        </div>
                        <div className={styles.lteFormGroup}>
                          <label style={{ fontSize: '11px' }}>Sequence</label>
                          <input 
                            type="number"
                            className={styles.lteFormControl}
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                            value={tier.sequence}
                            onChange={(e) => {
                              const newTiers = [...offerForm.tiers];
                              newTiers[idx].sequence = parseInt(e.target.value) || 1;
                              setOfferForm({ ...offerForm, tiers: newTiers });
                            }}
                          />
                        </div>
                      </div>
                      <div className={styles.lteFormGroup} style={{ marginTop: '8px', marginBottom: 0 }}>
                        <label style={{ fontSize: '11px' }}>Milestone Requirements / Instructions (one per line)</label>
                        <textarea 
                          className={styles.lteFormControl}
                          style={{ padding: '8px 10px', fontSize: '12px', minHeight: '60px', resize: 'vertical' }}
                          placeholder="e.g.&#10;Download App&#10;Complete verification"
                          value={Array.isArray(tier.steps) ? tier.steps.join('\n') : tier.steps || ''}
                          onChange={(e) => {
                            const newTiers = [...offerForm.tiers];
                            newTiers[idx].steps = e.target.value.split('\n');
                            setOfferForm({ ...offerForm, tiers: newTiers });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => { setIsOfferModalOpen(false); setEditingOffer(null); }}>Discard</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleSaveOffer}>Save Custom Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: REJECT CUSTOM PROOF ──── */}
      {isOfferRejectionModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '400px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle} style={{ color: '#ef4444' }}>Reject Submission Proof</h4>
              <button className={styles.lteModalClose} onClick={() => { setIsOfferRejectionModalOpen(false); setRejectingClickId(''); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Specify Reason for Rejection</label>
                <textarea 
                  className={styles.lteFormControl}
                  style={{ height: '100px', resize: 'none' }}
                  placeholder="e.g. Submitted transaction hash does not match, screenshot blurred..."
                  value={offerRejectionReason}
                  onChange={(e) => setOfferRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => { setIsOfferRejectionModalOpen(false); setRejectingClickId(''); }}>Cancel</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnDanger}`} onClick={handleRejectProofSubmit}>Reject Proof</button>
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

      {/* ──── MODAL: CREATE LIFAFA ──── */}
      {isLifafaModalOpen && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '450px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>🧧 Create Lifafa Promo Code</h4>
              <button className={styles.lteModalClose} onClick={() => setIsLifafaModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody}>
              <div className={styles.lteFormGroup}>
                <label className={styles.lteFormLabel}>Promo Code Name (Uppercase)</label>
                <input 
                  className={styles.lteFormControl}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="e.g. WELCOME500"
                  value={lifafaForm.code}
                  onChange={(e) => setLifafaForm({...lifafaForm, code: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Reward Amount (Coins)</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={lifafaForm.reward_coins}
                    onChange={(e) => setLifafaForm({...lifafaForm, reward_coins: parseInt(e.target.value)})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Max Uses Limit (-1 for unlimited)</label>
                  <input 
                    type="number"
                    className={styles.lteFormControl}
                    value={lifafaForm.max_uses}
                    onChange={(e) => setLifafaForm({...lifafaForm, max_uses: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Expiry Date & Time (Optional)</label>
                  <input 
                    type="datetime-local"
                    className={styles.lteFormControl}
                    value={lifafaForm.expires_at}
                    onChange={(e) => setLifafaForm({...lifafaForm, expires_at: e.target.value})}
                  />
                </div>
                <div className={styles.lteFormGroup}>
                  <label className={styles.lteFormLabel}>Promo Status</label>
                  <select 
                    className={styles.lteFormControl}
                    value={lifafaForm.status}
                    onChange={(e) => setLifafaForm({...lifafaForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnSecondary}`} onClick={() => setIsLifafaModalOpen(false)}>Discard</button>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={handleSaveLifafa}>🧧 Launch Promo Code</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MODAL: CAMPAIGN DELIVERY LOGS & ANALYTICS AUDIT ──── */}
      {isBroadcastModalOpen && selectedBroadcast && (
        <div className={styles.lteModalOverlay}>
          <div className={styles.lteModalBox} style={{ maxWidth: '750px' }}>
            <div className={styles.lteModalHeader}>
              <h4 className={styles.lteModalTitle}>Campaign Delivery Audit: {selectedBroadcast.title}</h4>
              <button className={styles.lteModalClose} onClick={() => { setIsBroadcastModalOpen(false); setSelectedBroadcast(null); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.lteModalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Campaign Meta info */}
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Internal Title:</strong> {selectedBroadcast.title}</div>
                  <div><strong>Target Segment:</strong> <span className={styles.lteBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>{selectedBroadcast.target_type.toUpperCase().replace('_', ' ')}</span></div>
                  <div><strong>Media Attachment:</strong> <span className={styles.lteBadge} style={{ background: '#f1f5f9', color: '#334155' }}>{selectedBroadcast.media_type.toUpperCase()}</span></div>
                  <div><strong>Inline CTA Button:</strong> {selectedBroadcast.button_text ? `${selectedBroadcast.button_text} ➔ ${selectedBroadcast.button_url}` : 'None'}</div>
                </div>
                <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <strong>Message Template:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', background: '#ffffff', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #f1f5f9', fontFamily: 'inherit', fontSize: '12px' }}>
                    {selectedBroadcast.message}
                  </pre>
                </div>
              </div>

              {/* Delivery Metrics Ring Stats */}
              <h5 style={{ fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>📈 Performance Overview</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Targets</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{broadcastAnalytics?.total || 0}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Queued Users</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Delivered</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#047857', margin: '4px 0' }}>{broadcastAnalytics?.success || 0}</div>
                  <div style={{ fontSize: '10px', color: '#059669' }}>
                    {broadcastAnalytics?.total > 0 ? ((broadcastAnalytics.success / broadcastAnalytics.total) * 100).toFixed(1) : 0}% success
                  </div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Failed</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', margin: '4px 0' }}>{broadcastAnalytics?.failed || 0}</div>
                  <div style={{ fontSize: '10px', color: '#dc2626' }}>
                    {broadcastAnalytics?.total > 0 ? ((broadcastAnalytics.failed / broadcastAnalytics.total) * 100).toFixed(1) : 0}% fail rate
                  </div>
                </div>
                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Bot Blocks</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#334155', margin: '4px 0' }}>{broadcastAnalytics?.blocked || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Banned/Blocked</div>
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>CTR / Clicks</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8', margin: '4px 0' }}>{broadcastAnalytics?.clicks || 0}</div>
                  <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>{broadcastAnalytics?.ctr || 0}% CTR</div>
                </div>
              </div>

              {/* Delivery Logs Stream */}
              <h5 style={{ fontWeight: 700, marginBottom: '12px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 Delivery Audit Logs Stream (Last 100 jobs)</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>Refreshed in real-time</span>
              </h5>
              
              <table className={styles.lteTable}>
                <thead>
                  <tr>
                    <th>Telegram ID</th>
                    <th>Delivery Status</th>
                    <th>Inline CTR click</th>
                    <th>Execution Time</th>
                    <th>Diagnostics / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcastLogs && broadcastLogs.length > 0 ? (
                    broadcastLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td>
                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#334155' }}>
                            {log.telegram_id}
                          </code>
                        </td>
                        <td>
                          <span className={`${styles.logTableBadge} ${
                            log.status === 'success' ? styles.logBadgeSuccess :
                            log.status === 'blocked' ? styles.logBadgeBlocked :
                            styles.logBadgeFailed
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {log.clicked ? (
                            <span className={styles.lteBadge} style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 'bold' }}>
                              🖱 CLICKED
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.updatedAt || log.updated_at).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ maxWidth: '180px', wordBreak: 'break-all', fontSize: '11.5px', color: log.status === 'failed' ? '#dc2626' : '#64748b' }}>
                          {log.error_message || <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                        No delivery logs recorded for this campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            </div>
            <div className={styles.lteModalFooter}>
              <button className={`${styles.lteBtn} ${styles.lteBtnPrimary}`} onClick={() => { setIsBroadcastModalOpen(false); setSelectedBroadcast(null); }}>Close Audit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
