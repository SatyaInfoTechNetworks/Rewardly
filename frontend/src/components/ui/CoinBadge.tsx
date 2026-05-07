import React from 'react';
import { Coins } from 'lucide-react';
import styles from '@/app/page.module.css';

interface CoinBadgeProps {
  amount: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({ amount, size = 'md', className }) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  
  return (
    <div className={`${styles.coinBadgePremium} ${className || ''}`}>
      <Coins 
        size={iconSize} 
        className={styles.iconYellow} 
        fill="currentColor" 
      />
      <span className={styles.balanceText} style={{ fontSize: size === 'lg' ? '16px' : '13px' }}>
        {amount.toLocaleString()}
      </span>
    </div>
  );
};
