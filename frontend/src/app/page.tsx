import Link from "next/link";
import styles from "./landing.module.css";
import { 
  ArrowRight, Zap, ShieldCheck, Users, 
  CheckCircle2, HelpCircle, Trophy, MessageSquare 
} from "lucide-react";

export default function LandingPage() {
  const BOT_LINK = "https://t.me/rewardly_india_bot?start=11111";

  return (
    <div className={styles.landingPage}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.navBrand}>
            <div className={styles.logoIcon}>R</div>
            <span>Rewardly</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#how-it-works">How it Works</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
            <Link href={BOT_LINK} className={styles.navCta}>Start Earning</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroBadge}>
            <Zap size={14} fill="currentColor" />
            <span>Join 50,000+ Active Earners</span>
          </div>
          <h1 className={styles.heroTitle}>
            The Most Fun Way to<br />
            <span>Earn Real Rewards</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Complete simple tasks, participate in surveys, and invite friends to earn coins. 
            Redeem them instantly for UPI, Gift Cards, and more!
          </p>
          <div className={styles.heroActions}>
            <Link href={BOT_LINK} className={styles.mainCta}>
              Start Earning on Telegram <ArrowRight size={20} />
            </Link>
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <strong>₹5.4M+</strong>
                <span>Paid Out</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <strong>4.8/5</strong>
                <span>User Rating</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionDesc}>Start your earning journey in 3 simple steps</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}><MessageSquare size={32} /></div>
              <h3>Join Our Bot</h3>
              <p>Click the start button to launch our official Telegram bot and verify your account.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}><Trophy size={32} /></div>
              <h3>Complete Tasks</h3>
              <p>Take surveys, play games, and complete simple daily tasks to accumulate coins.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}><CheckCircle2 size={32} /></div>
              <h3>Get Paid</h3>
              <p>Redeem your coins for real cash or gift vouchers. Withdrawals are processed within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureBox}>
              <div className={styles.featureIconBox}><Zap size={24} /></div>
              <h4>Instant Payouts</h4>
              <p>No more waiting for weeks. Most of our rewards are processed instantly to your account.</p>
            </div>
            <div className={styles.featureBox}>
              <div className={styles.featureIconBox}><ShieldCheck size={24} /></div>
              <h4>100% Secure</h4>
              <p>Your data and earnings are protected with enterprise-grade security protocols.</p>
            </div>
            <div className={styles.featureBox}>
              <div className={styles.featureIconBox}><Users size={24} /></div>
              <h4>Referral Program</h4>
              <p>Invite your friends and earn a percentage of their lifetime earnings. Unlimited growth!</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          </div>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <HelpCircle size={20} className={styles.faqIcon} />
              <div>
                <h5>Is Rewardly free to use?</h5>
                <p>Absolutely! You never have to pay anything to earn on Rewardly. We are 100% free.</p>
              </div>
            </div>
            <div className={styles.faqItem}>
              <HelpCircle size={20} className={styles.faqIcon} />
              <div>
                <h5>What is the minimum withdrawal?</h5>
                <p>The minimum withdrawal starts at just ₹50 (5,000 coins) for most payment methods.</p>
              </div>
            </div>
            <div className={styles.faqItem}>
              <HelpCircle size={20} className={styles.faqIcon} />
              <div>
                <h5>Which payment methods are supported?</h5>
                <p>We support UPI, Amazon Pay, Google Play Gift Cards, and many other popular methods.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.navBrand}>
              <div className={styles.logoIcon}>R</div>
              <span>Rewardly</span>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 Rewardly Networks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
