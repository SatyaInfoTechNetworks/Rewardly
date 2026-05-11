export const ANALYTICS_EVENTS = {
  // Auth Events
  AUTH: {
    SIGNUP: 'user_signup',
    LOGIN: 'user_login',
    TG_AUTH_SUCCESS: 'telegram_auth_success',
    TG_AUTH_FAILED: 'telegram_auth_failed',
  },

  // Contest Events
  CONTEST: {
    VIEWED: 'contest_viewed',
    JOINED: 'contest_joined',
    COMPLETED: 'contest_completed',
    LEADERBOARD_VIEWED: 'leaderboard_viewed',
    REWARD_CLAIMED: 'contest_reward_claimed',
  },

  // Game Events
  GAME: {
    STARTED: 'game_started',
    FINISHED: 'game_finished',
    RETRY_USED: 'game_retry_used',
    SCORE_SUBMITTED: 'game_score_submitted',
    CRASHED: 'game_crashed',
  },

  // Wallet & Economy
  WALLET: {
    COINS_EARNED: 'coins_earned',
    COINS_SPENT: 'coins_spent',
    REDEEM_REQUESTED: 'redeem_requested',
    REDEEM_APPROVED: 'redeem_approved',
  },

  // Referral Events
  REFERRAL: {
    SHARED: 'referral_shared',
    SIGNUP: 'referral_signup',
    VALIDATED: 'referral_validated',
  },

  // Survey & Offer Events
  SURVEY: {
    STARTED: 'survey_started',
    COMPLETED: 'survey_completed',
    DISQUALIFIED: 'survey_disqualified',
  },
  OFFER: {
    CLICKED: 'offer_clicked',
    COMPLETED: 'offer_completed',
    REJECTED: 'offer_rejected',
  },

  // System
  FRAUD: {
    DETECTED: 'fraud_detected',
    INVALID_SCORE: 'invalid_score',
    DUPLICATE_REFERRAL: 'duplicate_referral',
  }
} as const;
