# Rewardly - Comprehensive Technical Documentation

This document serves as the complete technical specification and architecture guide for the Rewardly platform, covering the frontend, backend, database schema, and core business logic (such as payment handling).

---

## 1. Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, CSS Modules (DeskApp Theme for Admin).
- **Backend**: Node.js, Express.js REST API.
- **Database**: PostgreSQL / MySQL (managed via Sequelize ORM).
- **Authentication**: Telegram Web App (TWA) Authentication / JWT.

---

## 2. Frontend Architecture

The frontend is built using Next.js and is divided into two main experiences: the **User Panel** and the **Admin Panel**.

### User Panel (Frontend)
- **Target Platform**: Designed primarily as a Telegram Web App (TWA) or mobile-responsive web application.
- **State Management**: React Hooks (`useState`, `useEffect`) and Context API for global state (user session, coin balance).
- **Core Flows**:
  - **Authentication**: Users are authenticated automatically via Telegram initData.
  - **Earning Hub**: Users navigate through different modules (Games, Offers, Visit Tasks, Contests) to earn coins.
  - **Real-time Updates**: Balances and notifications are updated dynamically after completing tasks.

### Admin Panel (Frontend)
- **Location**: `src/app/admin/page.tsx`
- **Design System**: Custom implementation of the **DeskApp** premium admin theme.
- **Modularity**: The admin panel uses a single-page application (SPA) approach with a sidebar navigation that switches the `activeView` state to render different management modules (Users, Payouts, Contests, etc.) without reloading the page.
- **Security**: Protected by an Admin Secret Key (`x-admin-secret` header) stored in `localStorage`.

---

## 3. Backend Architecture

The backend is an Express.js REST API structured for scalability and modularity.

### Directory Structure
- `src/models/`: Sequelize database models defining the schema.
- `src/routes/`: Express routers grouping endpoints by feature (e.g., `/api/admin`, `/api/users`, `/api/offers`).
- `src/middlewares/`: Custom middlewares for authentication, admin validation, and rate-limiting.
- `src/config/`: Database connection and environment variables.
- `src/utils/`: Helper functions (e.g., signature verification, random generators).

---

## 4. Payment & Withdrawal Flow (How Payments are Handled)

The platform uses a manual, highly secure withdrawal system to prevent fraud and ensure accurate payouts.

### Step 1: Configuration (Admin)
- The admin creates a **Payout Method** (e.g., "UPI", "PayPal", "Crypto") in the `payout_methods` table.
- The admin defines **Payout Tiers** for that method in the `payout_tiers` table (e.g., Tier 1: 1000 Coins = ₹10, Tier 2: 5000 Coins = ₹50).
- The admin configures what input is required from the user (e.g., "Enter your UPI ID").

### Step 2: User Request (Frontend -> Backend)
- The user navigates to the Wallet section and selects a Payout Method and Tier.
- The user enters their payment details (e.g., `user@upi`).
- The backend verifies the user has enough `balance`.
- The backend deducts the coins from the user's `balance` and creates a new record in the `withdrawal_requests` table with status `pending`.
- A `Transaction` log is created to record the deduction.

### Step 3: Admin Review (Admin Panel)
- The admin navigates to the **Withdrawal Tickets** section in the Admin Panel.
- The admin reviews the request, checking the user's `quality_score`, recent transactions, and IP address for fraud.
- The admin processes the actual fiat payment manually via their bank/crypto wallet using the user's provided details.

### Step 4: Resolution
- **If Approved**: The admin clicks "Approve". The `withdrawal_requests` status changes to `approved` (or `paid`). The transaction is finalized.
- **If Rejected**: The admin clicks "Reject" and provides a reason (e.g., "Invalid UPI ID" or "Fraud detected"). The status changes to `rejected`, the deducted coins are **refunded** back to the user's `balance`, and a refund `Transaction` is logged.

---

## 5. Database Schema (Exact Tables & Fields)

The database is fully relational. Below are the exact table names and fields mapped by Sequelize:

### Core User Data
- **`users`**
  - Fields: `telegram_id` (BIGINT, PK), `username` (STRING), `first_name` (STRING), `last_name` (STRING), `balance` (BIGINT), `pending_balance` (BIGINT), `streak` (INTEGER), `last_check_in` (DATE), `is_banned` (BOOLEAN), `status` (STRING), `google_aid` (STRING), `ios_idfa` (STRING), `phone_number` (STRING), `is_phone_verified` (BOOLEAN), `is_channel_joined` (BOOLEAN), `referred_by` (BIGINT), `ip_address` (STRING), `photo_url` (STRING), `daily_games_played` (INTEGER), `last_game_date` (DATEONLY), `last_active_at` (DATE), `last_notification_at` (DATE), `notification_clicks` (INTEGER), `notification_opens` (INTEGER), `quality_score` (INTEGER)

### Earning Mechanisms
- **`offers`**
  - Fields: `id` (UUID), `external_id` (STRING), `title` (STRING), `description` (TEXT), `icon_url` (TEXT), `tracking_url` (TEXT), `total_reward` (DECIMAL), `actual_price` (DECIMAL), `category` (STRING), `is_active` (BOOLEAN), `likes_count` (INTEGER), `is_hot` (BOOLEAN), `input_type` (STRING), `input_instruction` (TEXT), `reward_type` (STRING), `extra_label` (STRING), `estimated_time` (STRING), `difficulty` (STRING), `daily_completion_cap` (INTEGER), `country_targeting` (STRING)
- **`offer_tiers`**
  - Fields: `id` (UUID), `offer_id` (UUID), `title` (STRING), `tier_title` (STRING), `app_tier_title` (STRING), `reward` (DECIMAL), `steps` (JSON), `sequence` (INTEGER), `status` (STRING)
- **`offer_completions`**
  - Fields: `id` (UUID), `user_id` (BIGINT), `offer_id` (UUID), `click_id` (STRING), `reward_coins` (INTEGER)
- **`user_offer_progress`**
  - Fields: `id` (UUID), `user_id` (BIGINT), `offer_id` (UUID), `click_id` (STRING), `status` (ENUM), `completed_tiers` (JSON), `user_input` (TEXT), `admin_status` (STRING), `admin_remark` (TEXT)
- **`visit_tasks`**
  - Fields: `id` (INTEGER), `title` (STRING), `url` (STRING), `reward_amount` (INTEGER), `icon` (STRING), `timer_seconds` (INTEGER), `status` (STRING)
- **`user_visits`**
  - Fields: `id` (INTEGER), `user_id` (BIGINT), `task_id` (INTEGER), `completed_at` (DATE)
- **`games`**
  - Fields: `id` (INTEGER), `name` (STRING), `slug` (STRING), `type` (STRING), `thumbnail_url` (STRING), `config` (JSON), `status` (ENUM)
- **`game_sessions`**
  - Fields: `id` (UUID), `user_id` (BIGINT), `game_id` (INTEGER), `contest_id` (INTEGER), `score` (INTEGER), `duration` (INTEGER), `is_valid` (BOOLEAN), `metadata` (JSON), `status` (ENUM)
- **`daily_rewards`**
  - Fields: `day` (INTEGER), `reward_amount` (INTEGER)
- **`lifafas`**
  - Fields: `id` (INTEGER), `code` (STRING), `reward_coins` (INTEGER), `max_uses` (INTEGER), `current_uses` (INTEGER), `status` (STRING), `expires_at` (DATE)
- **`lifafa_claims`**
  - Fields: `id` (INTEGER), `lifafa_id` (INTEGER), `user_id` (BIGINT), `claimed_at` (DATE)

### Contests & Events
- **`contests`**
  - Fields: `id` (INTEGER), `name` (STRING), `slug` (STRING), `tracking_type` (ENUM), `game_id` (INTEGER), `banner_image` (STRING), `status` (ENUM), `start_time` (DATE), `end_time` (DATE), `prize_pool` (INTEGER), `prize_pool_type` (ENUM), `access_type` (ENUM), `entry_fee` (INTEGER), `entry_fee_type` (ENUM), `maximum_participants` (INTEGER), `description` (TEXT), `rules` (TEXT), `auto_join` (BOOLEAN), `minimum_activity` (INTEGER)
- **`contest_participants`**
  - Fields: `id` (INTEGER), `contest_id` (INTEGER), `user_id` (BIGINT), `score` (INTEGER), `rank` (INTEGER), `status` (ENUM), `reward_claimed` (BOOLEAN)
- **`contest_rewards`**
  - Fields: `id` (INTEGER), `contest_id` (INTEGER), `rank_from` (INTEGER), `rank_to` (INTEGER), `reward_type` (ENUM), `reward_value` (INTEGER), `reward_text` (STRING)
- **`lucky_draws`**
  - Fields: `id` (INTEGER), `title` (STRING), `slug` (STRING), `description` (TEXT), `banner_image` (STRING), `type` (ENUM), `prize_type` (ENUM), `prize_amount` (STRING), `prize_value` (INTEGER), `status` (ENUM), `start_time` (DATE), `end_time` (DATE), `free_entries_allowed` (BOOLEAN), `ad_entries_enabled` (BOOLEAN), `max_ad_entries` (INTEGER), `coin_entry_enabled` (BOOLEAN), `coin_cost_per_entry` (INTEGER), `max_entries_per_user` (INTEGER), `referral_entries_enabled` (BOOLEAN), `auto_winner_announcement` (BOOLEAN), `winners_count` (INTEGER)
- **`lucky_draw_entries`**
  - Fields: `id` (INTEGER), `lucky_draw_id` (INTEGER), `user_id` (BIGINT), `entry_source` (ENUM)
- **`lucky_draw_winners`**
  - Fields: `id` (INTEGER), `lucky_draw_id` (INTEGER), `user_id` (BIGINT), `prize_won` (STRING), `rank` (INTEGER), `status` (ENUM), `proof_image` (STRING)

### Referrals
- **`referrals`**
  - Fields: `id` (INTEGER), `referrer_user_id` (BIGINT), `referred_user_id` (BIGINT), `status` (ENUM), `is_valid` (BOOLEAN), `validated_at` (DATE), `ip_address` (STRING), `device_id` (STRING)
- **`referral_milestones`**
  - Fields: `id` (INTEGER), `required_referrals` (INTEGER), `reward_coins` (INTEGER), `icon` (STRING), `status` (STRING), `sort_order` (INTEGER)
- **`referral_settings`**
  - Fields: `id` (INTEGER), `welcome_bonus` (INTEGER), `referral_reward` (INTEGER), `reward_trigger` (ENUM), `min_earnings` (INTEGER), `min_offers` (INTEGER), `min_redeem_amount` (INTEGER), `same_device_block` (BOOLEAN), `vpn_detection` (BOOLEAN)

### Economy & Administration
- **`transactions`**
  - Fields: `id` (INTEGER), `telegram_id` (BIGINT), `reference_id` (STRING), `amount` (INTEGER), `type` (STRING), `description` (STRING), `external_id` (STRING), `status` (ENUM), `contest_id` (INTEGER)
- **`payout_methods`**
  - Fields: `id` (INTEGER), `name` (STRING), `logo_url` (STRING), `conversion_rate` (STRING), `fee_text` (STRING), `disclaimer` (TEXT), `custom_inputs` (JSON), `status` (STRING), `order_index` (INTEGER)
- **`payout_tiers`**
  - Fields: `id` (INTEGER), `payout_method_id` (INTEGER), `amount_text` (STRING), `coins_required` (INTEGER), `status` (STRING)
- **`withdrawal_requests`**
  - Fields: `id` (INTEGER), `user_id` (BIGINT), `payout_method_id` (INTEGER), `payout_tier_id` (INTEGER), `amount_text` (STRING), `coins_used` (INTEGER), `payout_details` (TEXT), `status` (ENUM), `admin_note` (STRING)
- **`broadcasts`**
  - Fields: `id` (INTEGER), `title` (STRING), `message` (TEXT), `media_type` (STRING), `media_url` (TEXT), `button_text` (STRING), `button_url` (TEXT), `target_type` (STRING), `status` (STRING), `scheduled_at` (DATE)
- **`broadcast_logs`**
  - Fields: `id` (INTEGER), `broadcast_id` (INTEGER), `user_id` (BIGINT), `telegram_id` (BIGINT), `status` (STRING), `error_message` (TEXT), `sent_at` (DATE), `clicked` (TINYINT), `opened` (TINYINT)
- **`app_settings`**
  - Fields: `id` (INTEGER), `game_reward_coins` (INTEGER), `game_limit_per_day` (INTEGER), `adsgram_block_id` (STRING), `monetag_zone_id` (STRING), `adsgram_enabled` (BOOLEAN), `monetag_enabled` (BOOLEAN), `onboarding_verification_enabled` (BOOLEAN), `pubscale_app_id` (STRING), `pubscale_enabled` (BOOLEAN), `opinion_universe_url` (TEXT), `opinion_universe_enabled` (BOOLEAN), `pubscale_sandbox` (BOOLEAN), `adsgram_checkin_block_id` (STRING), `adsgram_draw_block_id` (STRING), `adsgram_visit_block_id` (STRING), `watch_earn_cooldown` (INTEGER), `ad_entry_cooldown` (INTEGER), `inactive_reminder_enabled` (BOOLEAN), `wallet_reminder_enabled` (BOOLEAN), `referral_push_enabled` (BOOLEAN), `growdeck_enabled` (BOOLEAN), `growdeck_app_id` (STRING), `growdeck_secret_key` (STRING), `growdeck_postback_secret` (STRING), `timewall_enabled` (BOOLEAN), `timewall_app_id` (STRING), `timewall_postback_secret` (STRING)

---

## 6. Security & Fraud Prevention

- **Transaction Audit Log**: Every addition or deduction of coins is logged in the `transactions` table. This creates an immutable ledger that admins can review.
- **Quality Score**: Users have a `quality_score` in the `users` table that decreases if they fail tasks or submit fake proofs.
- **Referral Fraud**: The `referral_settings` table includes options for `same_device_block` and `vpn_detection` to prevent users from referring themselves using emulators or VPNs.
- **Manual Proof Review**: For custom tasks (like subscribing to a YouTube channel), users must upload a screenshot or text proof, which is manually reviewed by an admin before coins are credited.
