"use client";

import React, { useState } from 'react';
import { ShieldCheck, Phone, Users, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import styles from './VerificationOverlay.module.css';

interface VerificationOverlayProps {
  isPhoneVerified: boolean;
  isChannelJoined: boolean;
  onVerify: (phoneNumber?: string) => Promise<void>;
}

export const VerificationOverlay: React.FC<VerificationOverlayProps> = ({ 
  isPhoneVerified, 
  isChannelJoined, 
  onVerify 
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePhoneRequest = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.requestContact((res: any) => {
        if (res && res.contact) {
          onVerify(res.contact.phone_number);
        }
      });
    } else {
      alert("Telegram SDK not found. Please open in Telegram.");
    }
  };

  const handleJoinChannel = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink("https://t.me/rewardly_india");
    } else {
      window.open("https://t.me/rewardly_india", "_blank");
    }
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    await onVerify();
    setIsVerifying(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.bottomSheet}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <ShieldCheck size={24} color="#38bdf8" />
          </div>
          <div className={styles.headerText}>
            <h3>Account Verification</h3>
            <p>Complete 2 steps to unlock earnings</p>
          </div>
        </div>

        <div className={styles.stepsList}>
          {/* Step 1: Phone */}
          <div className={`${styles.stepItem} ${isPhoneVerified ? styles.completed : ''}`}>
            <div className={styles.stepIcon}>
              <Phone size={20} />
            </div>
            <div className={styles.stepContent}>
              <h4>Step 1: Verify Phone Number</h4>
              <p>Secure your account with Telegram</p>
            </div>
            {isPhoneVerified ? (
              <CheckCircle2 size={24} color="#4ade80" />
            ) : (
              <button className={styles.stepBtn} onClick={handlePhoneRequest}>
                Verify
              </button>
            )}
          </div>

          {/* Step 2: Channel */}
          <div className={`${styles.stepItem} ${isChannelJoined ? styles.completed : ''}`}>
            <div className={styles.stepIcon}>
              <Users size={20} />
            </div>
            <div className={styles.stepContent}>
              <h4>Step 2: Join Official Channel</h4>
              <p>Get latest updates & rewards</p>
            </div>
            {isChannelJoined ? (
              <CheckCircle2 size={24} color="#4ade80" />
            ) : (
              <button className={styles.stepBtn} onClick={handleJoinChannel}>
                Join
              </button>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.verifyDoneBtn} 
            onClick={handleManualCheck}
            disabled={isVerifying}
          >
            {isVerifying ? "Checking..." : "I've Done Both"}
            <ArrowRight size={18} />
          </button>
          
          <div className={styles.disclaimer}>
            <AlertCircle size={14} />
            <span>Access will be granted instantly after verification.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
