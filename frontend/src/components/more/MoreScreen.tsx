import React, { useState } from 'react';
import { Copy, Apple, FileText, Shield, Handshake, Mail, ChevronRight, Fingerprint, X } from 'lucide-react';
import styles from '@/app/page.module.css';

interface MoreScreenProps {
  user: any;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ user }) => {
  const [modalType, setModalType] = useState<'gaid' | 'idfa' | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData;

      const payload: any = { initData };
      if (modalType === 'gaid') payload.google_aid = inputValue;
      else payload.ios_idfa = inputValue;

      const response = await fetch(`${API_URL}/api/user/update-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setModalType(null);
        setInputValue("");
        alert("ID Updated successfully");
      }
    } catch (error) {
      alert("Failed to update ID");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.moreScreen}>
      {/* Profile Card */}
      <div className={`${styles.profileCard} card`}>
        <div className={styles.profileMain}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Profile" className={styles.largeAvatar} style={{ objectFit: 'cover', padding: 0 }} />
          ) : (
            <div className={styles.largeAvatar}>{(user?.firstName || 'U')[0]}</div>
          )}
          <div className={styles.profileInfo}>
            <h2>{user?.firstName || 'User'}</h2>
            <div className={styles.idBadge}>
              <span>ID: {user?.id || '00000000'}</span>
              <Copy size={14} className={styles.copyIcon} onClick={() => {
                navigator.clipboard.writeText(user?.id || '');
                alert("ID copied to clipboard!");
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className={`${styles.menuCard} card`}>
        <div className={styles.menuItem} onClick={() => setModalType('gaid')}>
          <div className={`${styles.menuIconContainer} ${styles.red}`}>
            <Fingerprint size={20} />
          </div>
          <span className={styles.menuLabel}>Google Advertising ID</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>
        
        <div className={styles.menuItem} onClick={() => setModalType('idfa')}>
          <div className={`${styles.menuIconContainer} ${styles.indigo}`}>
            <Apple size={20} />
          </div>
          <span className={styles.menuLabel}>iOS IDFA ID</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem} onClick={() => window.location.href = '/terms'}>
          <div className={`${styles.menuIconContainer} ${styles.blue}`}>
            <FileText size={20} />
          </div>
          <span className={styles.menuLabel}>Terms & Conditions</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem} onClick={() => window.location.href = '/privacy'}>
          <div className={`${styles.menuIconContainer} ${styles.teal}`}>
            <Shield size={20} />
          </div>
          <span className={styles.menuLabel}>Privacy Policy</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem} onClick={() => window.open('https://telegram.dog/Devraj069', '_blank')}>
          <div className={`${styles.menuIconContainer} ${styles.violet}`}>
            <Handshake size={20} />
          </div>
          <span className={styles.menuLabel}>Advertise/Collaboration</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem} onClick={() => window.open('https://telegram.dog/Devraj069', '_blank')}>
          <div className={`${styles.menuIconContainer} ${styles.green}`}>
            <Mail size={20} />
          </div>
          <span className={styles.menuLabel}>Contact Us</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>
      </div>

      {/* ID Update Modal */}
      {modalType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>{modalType === 'gaid' ? 'Google AID' : 'iOS IDFA'}</h3>
              <X size={20} onClick={() => setModalType(null)} style={{ cursor: 'pointer', color: '#64748b' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
              Please enter your {modalType === 'gaid' ? 'Google Advertising ID' : 'iOS IDFA'} for better offer tracking.
            </p>
            <input 
              type="text" 
              className={styles.modalInput}
              placeholder="Paste your ID here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={() => setModalType(null)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700 }}
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
