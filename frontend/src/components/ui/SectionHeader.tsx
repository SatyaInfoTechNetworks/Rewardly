import React from 'react';
import styles from '@/app/page.module.css';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  badgeText?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  icon: Icon, 
  actionText, 
  onAction,
  badgeText 
}) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleGroup}>
        {Icon && <Icon size={20} className={styles.sectionIcon} />}
        <h2>{title}</h2>
        {badgeText && <span className={styles.hotBadgeGradient}>{badgeText}</span>}
      </div>
      {actionText && (
        <button className={styles.viewAllPill} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
