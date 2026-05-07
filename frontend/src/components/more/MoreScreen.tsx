import React from 'react';
import { Copy, Apple, FileText, Shield, Handshake, Mail, ChevronRight, Fingerprint } from 'lucide-react';
import styles from '@/app/page.module.css';

export const MoreScreen: React.FC = () => {
  return (
    <div className={styles.moreScreen}>
      {/* Profile Card */}
      <div className={`${styles.profileCard} card`}>
        <div className={styles.profileMain}>
          <div className={styles.largeAvatar}>D</div>
          <div className={styles.profileInfo}>
            <h2>Devraj</h2>
            <div className={styles.idBadge}>
              <span>ID: 1981634693</span>
              <Copy size={14} className={styles.copyIcon} />
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className={`${styles.menuCard} card`}>
        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.red}`}>
            <Fingerprint size={20} />
          </div>
          <span className={styles.menuLabel}>Google Advertising ID</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>
        
        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.indigo}`}>
            <Apple size={20} />
          </div>
          <span className={styles.menuLabel}>iOS IDFA ID</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.blue}`}>
            <FileText size={20} />
          </div>
          <span className={styles.menuLabel}>Terms & Conditions</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.teal}`}>
            <Shield size={20} />
          </div>
          <span className={styles.menuLabel}>Privacy Policy</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.violet}`}>
            <Handshake size={20} />
          </div>
          <span className={styles.menuLabel}>Advertise/Collaboration</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>

        <div className={styles.menuItem}>
          <div className={`${styles.menuIconContainer} ${styles.green}`}>
            <Mail size={20} />
          </div>
          <span className={styles.menuLabel}>Contact Us</span>
          <ChevronRight size={18} className={styles.chevron} />
        </div>
      </div>
    </div>
  );
};
