import Link from "next/link";
import styles from "./landing.module.css";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className={styles.landingContainer}>
      <div className={styles.heroContent}>
        <div className={styles.landingLogo}>R</div>
        
        <h1 className={styles.heroTitle}>
          Earn Rewards<br />
          <span>Every Day.</span>
        </h1>
        
        <p className={styles.heroDesc}>
          Complete simple surveys, play games, and earn coins you can withdraw instantly.
        </p>
        
        <Link href="/app" className={styles.getStartedBtn}>
          Get Started <ArrowRight size={22} />
        </Link>
        
        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>📝</span>
            <span className={styles.featureText}>Live Surveys</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🎮</span>
            <span className={styles.featureText}>Fun Games</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⚡</span>
            <span className={styles.featureText}>Instant Payout</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔥</span>
            <span className={styles.featureText}>Hot Offers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
