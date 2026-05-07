import React from 'react';
import { Sparkles, Coins } from 'lucide-react';
import styles from '@/app/page.module.css';

interface FeaturedOfferProps {
  title: string;
  desc: string;
  reward: string | number;
  icon: string;
  urgency: string;
}

export const FeaturedOffer: React.FC<FeaturedOfferProps> = ({ 
  title, 
  desc, 
  reward, 
  icon, 
  urgency 
}) => {
  return (
    <section className={styles.featuredSection}>
      <div className={`${styles.featuredCard} card`}>
        <div className={styles.featuredBadge}>
          <Sparkles size={12} /> FEATURED OFFER
        </div>
        <div className={styles.featuredContent}>
          <div className={styles.featuredLogo}>{icon}</div>
          <div className={styles.featuredText}>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
          <div className={styles.featuredReward}>
            <Coins size={20} className={styles.iconYellow} fill="currentColor" />
            <span>{reward}</span>
          </div>
        </div>
        <div className={styles.featuredFooter}>
          <span className={styles.urgencyTag}>{urgency}</span>
          <button className={styles.featuredBtn}>Claim Offer</button>
        </div>
      </div>
    </section>
  );
};
