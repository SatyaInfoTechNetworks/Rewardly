"use client";
import React from 'react';
import { ChevronLeft, ShieldCheck, FileText, Scale, Lock, Info, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className={styles.subPageContainer} style={{ background: '#F5F7FF', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className={styles.subPageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Scale size={24} className={styles.iconIndigo} style={{ color: '#6366f1' }} />
          <h2>Terms & Conditions</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '30px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
             <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Terms & Conditions</h1>
             <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>Welcome to <strong>Rewardly</strong>. By using our Telegram Mini App, you agree to follow the rules and guidelines listed below.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                Fair Use Policy
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>Only one account per user is allowed.</li>
                <li>Multiple accounts, device farming, VPN misuse, or automated activity is strictly not allowed.</li>
                <li>If suspicious activity is detected, your account may be blocked.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                Fake Referrals Not Allowed
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>Fake, duplicate, or self-referrals are strictly prohibited.</li>
                <li>Invalid / fraudulent referrals will not receive any reward.</li>
                <li>Users involved in referral fraud may face permanent account suspension.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                Suspicious Activity & KYC
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>If unusual behaviour is detected, we may temporarily freeze your account.</li>
                <li>We have the right to ask for KYC verification for identity confirmation.</li>
                <li>Withdrawals may be paused until verification is completed.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>4</span>
                Reward & Withdrawal Policy
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>Rewards are processed only if user activity is genuine.</li>
                <li>Fake engagement, cheating or manipulating offers will lead to cancellation of rewards.</li>
                <li>We reserve the right to withhold or cancel rewards for policy violations.</li>
              </ul>
            </section>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: '#92400e', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} /> Important Notice
              </p>
              <p style={{ fontSize: '0.85rem', color: '#b45309', lineHeight: 1.5 }}>
                Fake referrals, bot activity, or any suspicious behaviour will result in:
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#b45309', marginTop: '8px' }}>
                <li>No payment issued</li>
                <li>Account block / freeze</li>
                <li>KYC requirement (if needed)</li>
              </ul>
            </div>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>5</span>
                Privacy & Data Usage
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                We collect limited necessary data like user ID, username, device ID etc. for anti-fraud, reward tracking and app improvement.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>6</span>
                Updates to Terms
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                We may modify or update these terms anytime. Continued use of the app means you accept the changes.
              </p>
            </section>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '30px', marginTop: '10px' }}>
               <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>Need Support?</p>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Mail size={16} /> support@satyainfotechnetworks.com
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
