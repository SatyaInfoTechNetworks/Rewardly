import React from 'react';
import { Gamepad2, Wallet, Trophy, Share2, MoreHorizontal } from 'lucide-react';
import styles from '@/app/page.module.css';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'earn', label: 'Earn', icon: Gamepad2 },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'contest', label: 'Contest', icon: Trophy },
    { id: 'share', label: 'Share', icon: Share2 },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className={styles.bottomNavContainer}>
      <div className={styles.bottomNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button 
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={20} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
