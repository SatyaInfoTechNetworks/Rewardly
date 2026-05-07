import React from 'react';
import { ClipboardList, Clock, Star } from 'lucide-react';
import { CoinBadge } from '../ui/CoinBadge';
import styles from '@/app/page.module.css';

interface SurveyCardProps {
  title: string;
  time: string;
  rating: string;
  reward: string | number;
  href?: string;
  isLoading?: boolean;
}

export const SurveyCard: React.FC<SurveyCardProps> = ({ 
  title, 
  time, 
  rating, 
  reward, 
  href,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={`${styles.surveyCard} ${styles.skeletonCard} card`}>
        <div className={`${styles.surveyIconContainer} ${styles.skeleton}`}></div>
        <div className={styles.surveyInfo}>
          <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
          <div className={`${styles.skeletonText} ${styles.skeletonMeta}`}></div>
        </div>
        <div className={`${styles.rewardPillGold} ${styles.skeleton}`}></div>
      </div>
    );
  }

  const handleClick = () => {
    if (href && href !== "#") {
      window.open(href, '_blank');
    }
  };

  return (
    <div className={`${styles.surveyCard} card`} onClick={handleClick} style={{ cursor: href ? 'pointer' : 'default' }}>
      <div className={styles.surveyIconContainer}>
        <ClipboardList size={22} color="#5B5FFB" />
      </div>
      <div className={styles.surveyInfo}>
        <h3>{title}</h3>
        <div className={styles.surveyMeta}>
          <span><Clock size={12} /> {time}</span>
          <span><Star size={12} fill="#F59E0B" color="#F59E0B" /> {rating}</span>
        </div>
      </div>
      <div className={styles.rewardPillGold}>
        <CoinBadge amount={reward} size="sm" />
      </div>
    </div>
  );
};
