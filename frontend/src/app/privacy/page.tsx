"use client";
import React from 'react';
import { ChevronLeft, ShieldCheck, Lock, Mail, Info, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className={styles.subPageContainer} style={{ background: '#F5F7FF', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className={styles.subPageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Lock size={24} className={styles.iconIndigo} style={{ color: '#6366f1' }} />
          <h2>Privacy Policy</h2>
        </div>
        <div style={{ width: '40px' }} />
      </header>

      <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '30px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
             <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Privacy Policy</h1>
             <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>This Privacy Policy explains how <strong>Rewardly</strong> collects, uses, and protects your information when you use our Telegram Mini App.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                Information We Collect
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>We may collect the following data:</p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>Telegram User ID & Username</li>
                <li>Device-related identifiers (GAID / IDFA)</li>
                <li>Referral information</li>
                <li>IP address, location (approx), and device model</li>
                <li>Usage analytics like clicks, sessions, offers completed</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                Why We Collect This Data
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>To detect fraud, fake referrals, and suspicious activity</li>
                <li>To track rewards and offer completion</li>
                <li>To improve app features and user experience</li>
                <li>To ensure fair usage and prevent multiple accounts</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                How We Protect Your Data
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                We use industry-standard security methods, encryption, access controls, and anti-fraud systems. We never sell or rent your personal data.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>4</span>
                Sharing of Data
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>We may share limited required information with:</p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                <li>Ad networks to confirm successful offer completion</li>
                <li>Fraud-prevention tools</li>
                <li>Verification / KYC partners (only if required)</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>5</span>
                GDPR & CCPA Rights
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>You have the following rights regarding your data:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['Access Data', 'Request Correction', 'Data Deletion', 'Opt-out Sharing'].map((item) => (
                  <div key={item} style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#10b981" /> {item}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>6</span>
                KYC & Verification
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
                In case of suspicious activity or fraud detection, we may request identity verification (KYC) to protect the platform.
              </p>
            </section>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '30px', marginTop: '10px' }}>
               <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>Data Privacy Support</p>
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
