import React from 'react';
import { Coins } from 'lucide-react';
import styles from '@/app/page.module.css';

interface TaskCardProps {
  title: string;
  desc: string;
  reward: string | number;
  time: string;
  tag: string;
  urgency: string;
  icon: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  title, 
  desc, 
  reward, 
  time, 
  tag, 
  urgency, 
  icon 
}) => {
  return (
    <div className={`${styles.highRewardCard} card`}>
      <div className={styles.taskCardTop}>
        <div className={styles.taskLogo}>{icon}</div>
        <div className={styles.taskHeaderMain}>
          <div className={styles.taskTitleRow}>
            <h3>{title}</h3>
            <span className={styles.offerTag}>{tag}</span>
          </div>
          <p>{desc}</p>
        </div>
        <div className={styles.taskRewardLarge}>
          <Coins size={16} className={styles.iconYellow} fill="currentColor" />
          <span>{reward}</span>
        </div>
      </div>
      
      <div className={styles.taskCardBottom}>
        <div className={styles.taskMetaCol}>
          <span className={styles.estimatedTime}>⏱ {time}</span>
          <span className={styles.taskUrgencyLabel}>{urgency}</span>
        </div>
        <button className={styles.startEarningBtnWide}>Start Earning</button>
      </div>
    </div>
  );
};
