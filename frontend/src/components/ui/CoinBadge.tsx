import React from 'react';
import { Coins } from 'lucide-react';
import styles from '@/app/page.module.css';

interface CoinBadgeProps {
  amount: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPlus?: boolean;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({ amount, size = 'md', className, showPlus }) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  
  return (
    <div className={`${styles.coinBadgePremium} ${className || ''}`}>
      <Coins 
        size={iconSize} 
        className={styles.iconYellow} 
        fill="currentColor" 
      />
      <span className={styles.balanceText} style={{ fontSize: size === 'lg' ? '16px' : '13px' }}>
        {showPlus && Number(amount) > 0 ? '+' : ''}{amount.toLocaleString()}
      </span>
    </div>
  );
};
