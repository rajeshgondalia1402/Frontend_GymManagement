# GymPro SaaS — Subscription Plans & Pricing Guide

> **Purpose:** This document defines 3 subscription tiers that Gym Owners pay annually to use the GymPro platform. It maps every product feature to a tier, provides recommended pricing (INR), and serves as a sales reference for the product team.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Role Summary](#2-role-summary)
3. [Complete Feature Inventory](#3-complete-feature-inventory)
4. [Subscription Tiers — Feature Matrix](#4-subscription-tiers--feature-matrix)
5. [Pricing Recommendation](#5-pricing-recommendation)
6. [Plan Comparison Card (Sales Ready)](#6-plan-comparison-card-sales-ready)
7. [Add-On Modules (Future Upsell)](#7-add-on-modules-future-upsell)
8. [FAQ for Sales Team](#8-faq-for-sales-team)

---

## 1. Platform Overview

GymPro is a cloud-based gym management SaaS. The **Admin** (you) manages the platform, onboards Gym Owners, and creates subscription plans. The **Gym Owner** is the paying client who manages their gym. **Trainers** and **Members** are end-users under a Gym Owner's account.

**Revenue model:** Gym Owners pay an annual subscription fee to the Admin. The tier they choose determines which features they can access.

---

## 2. Role Summary

| Role | Who They Are | What They Can Do |
|------|-------------|------------------|
| **Admin** | Platform owner (you) | Manages gyms, gym owners, subscription plans, master data, sales inquiries |
| **Gym Owner** | Paying client — runs a gym | Full gym operations: members, trainers, finances, diet/exercise, reports |
| **Trainer** | Staff under Gym Owner | View assigned PT members, salary history, download salary slips, profile |
| **Member** | End-user (gym-goer) | View membership, diet plan, exercise plan, trainer info, dashboard |

---

## 3. Complete Feature Inventory

Below is every feature available in the platform, categorized by module.

### A. Dashboard & Overview
| # | Feature | Description |
|---|---------|-------------|
| A1 | Gym Owner Dashboard | Overview: total members, active/expiring/expired counts, trainers, diet plans, exercise plans, quick actions, alerts |
| A2 | Trainer Dashboard | Monthly overview: salary, incentive, assigned PT members with details |
| A3 | Member Dashboard | Membership status alert, today's workout, weekly schedule, trainer info |

### B. Member Management
| # | Feature | Description |
|---|---------|-------------|
| B1 | Member Listing | Full paginated table with search, sort, multi-filter (status, gender, blood group, package, date range) |
| B2 | Add/Edit Member | Full form: personal info, photo upload, camera capture, document upload |
| B3 | Member Detail View | Detailed profile with membership info, assigned trainer/diet/exercise |
| B4 | BMI Calculator | Built-in BMI calculator during member registration |
| B5 | Course Package Selection | Auto-fee calculation with discount logic (% or flat), extra discount |
| B6 | Membership Renewal | Renew membership from member listing with payment tracking |
| B7 | Balance Payment Tracking | Record partial payments, track pending balances (Regular + PT) |
| B8 | Toggle Member Status | Activate/deactivate members |
| B9 | Member Export to Excel | Export full member list with styled headers, frozen row |
| B10 | Balance Payment Export | Export balance payment data to Excel |

### C. Personal Training (PT) Management
| # | Feature | Description |
|---|---------|-------------|
| C1 | Add PT Membership | Add PT addon to existing member: select package, trainer, fee calculation |
| C2 | Edit PT Membership | Modify PT package, trainer, fees, goals |
| C3 | Pause PT Membership | Temporarily pause a PT membership |
| C4 | Remove PT Membership | Remove PT addon from member |
| C5 | PT Fee Calculation | Auto-calculate: package fees → max discount → extra discount → final → payment status |

### D. Member Inquiry / CRM
| # | Feature | Description |
|---|---------|-------------|
| D1 | Member Inquiries | Track prospective member leads: name, contact, DOB, gender, height/weight, photo |
| D2 | Follow-up Management | (Future — currently basic notes. Gym Inquiry at admin level has follow-ups) |
| D3 | Reference Tracking | How they heard about the gym, reference info |

### E. Trainer Management
| # | Feature | Description |
|---|---------|-------------|
| E1 | Trainer Listing | Paginated list with search, sort, expandable PT member sub-table |
| E2 | Add/Edit Trainer | Full form: personal info, specialization, experience, salary, photo, document |
| E3 | Trainer Detail View | View trainer profile + assigned PT members |
| E4 | Reset Trainer Password | Admin/owner resets trainer credentials |
| E5 | Toggle Trainer Status | Activate/deactivate trainers |
| E6 | View Trainer's PT Members | Expandable sub-table showing all PT members per trainer |

### F. Salary & Payroll
| # | Feature | Description |
|---|---------|-------------|
| F1 | Salary Settlement CRUD | Create/edit/delete monthly salary records for trainers |
| F2 | Auto Salary Calculation | API-based: base salary → per-day rate → present/absent/discount days → calculated salary |
| F3 | Incentive Management | PT incentive, Protein incentive, Member reference incentive, Other incentive |
| F4 | Salary Slip Download | Generate professional A4-format salary slip (printable PDF) |
| F5 | Salary Export to Excel | Export salary settlement history with styled Excel |
| F6 | Trainer Salary View | Trainers can view their own salary history, stats, and download slips |

### G. Expense Management
| # | Feature | Description |
|---|---------|-------------|
| G1 | Expense CRUD | Create/edit/delete expenses with amount, date, payment mode, description |
| G2 | Expense Groups | Categorize expenses (Rent, Electricity, Equipment, etc.) |
| G3 | File Attachments | Upload receipts/bills per expense (up to 5 files) |
| G4 | Expense Export to Excel | Export expenses with styled headers |

### H. Financial Reports
| # | Feature | Description |
|---|---------|-------------|
| H1 | Income Report | All member payments: renewal, balance, totals. Filter by year/month/date/status |
| H2 | Income Report Excel Export | Export income data with member-wise breakdown, grand totals |
| H3 | Expense Report | Combined expenses + salary settlements. Filter by type/group/mode/date |
| H4 | Expense Report Excel Export | Export expense report with styled Excel |
| H5 | Income Summary Cards | Renewal payments, balance payments, total income, pending amount |
| H6 | Expense Summary Cards | Total expenses, total salaries, grand total, record count |

### I. Diet & Nutrition
| # | Feature | Description |
|---|---------|-------------|
| I1 | Diet Plans CRUD | Create/view/delete diet plans with name, calories/day, meals |
| I2 | Diet Templates | Advanced structured meal templates (1-6 meals/day) with time, title, description |
| I3 | Assign Diet to Members | Assign diet plans/templates to members with start/end dates |
| I4 | Bulk Diet Assignment | Assign one template to multiple members at once |
| I5 | Member Diet View | Members can view their assigned diet plan with meal details |

### J. Exercise & Workout
| # | Feature | Description |
|---|---------|-------------|
| J1 | Exercise Plans CRUD | Create/view/delete exercise plans (daily or weekly) with exercises list |
| J2 | Assign Exercise to Members | Assign exercise plans to members by day-of-week |
| J3 | Workout Exercise Master | Master list of exercises grouped by body part |
| J4 | Body Part Master | Master data for body parts (Chest, Back, Legs, etc.) |
| J5 | Member Exercise View | Members see weekly schedule with day-wise exercises, sets, reps |

### K. Master Data Management
| # | Feature | Description |
|---|---------|-------------|
| K1 | Course Packages | Manage membership packages: Regular/PT, fees, duration, discounts |
| K2 | Expense Group Master | Expense categorization |
| K3 | Body Part Master | For exercise categorization |
| K4 | Workout Exercise Master | Exercise library |
| K5 | Designation Master | Staff titles/roles |

### L. Platform & Account
| # | Feature | Description |
|---|---------|-------------|
| L1 | Subscription History | View gym's platform subscription: current plan, validity, payment history |
| L2 | Trainer Portal | Trainers get their own login — dashboard, PT members, salary, profile |
| L3 | Member Portal | Members get their own login — dashboard, membership, diet, exercise, trainer |

---

## 4. Subscription Tiers — Feature Matrix

### Tier Definitions

| | 🥉 **STARTER** | 🥈 **PROFESSIONAL** | 🥇 **ENTERPRISE** |
|---|:---:|:---:|:---:|
| **Target Gym** | Small / new gym, <100 members | Mid-size gym, 100–500 members | Large gym / chain, 500+ members |
| **Duration** | 1 Year | 1 Year | 1 Year |

### Feature Access by Tier

| # | Feature | 🥉 Starter | 🥈 Professional | 🥇 Enterprise |
|---|---------|:----------:|:---------------:|:--------------:|
| | **DASHBOARD & OVERVIEW** | | | |
| A1 | Gym Owner Dashboard | ✅ | ✅ | ✅ |
| A2 | Trainer Dashboard (Trainer Portal) | ❌ | ✅ | ✅ |
| A3 | Member Dashboard (Member Portal) | ❌ | ❌ | ✅ |
| | **MEMBER MANAGEMENT** | | | |
| B1 | Member Listing (search, sort, filter) | ✅ | ✅ | ✅ |
| B2 | Add/Edit Member (basic info) | ✅ | ✅ | ✅ |
| B3 | Member Detail View | ✅ | ✅ | ✅ |
| B4 | BMI Calculator | ❌ | ✅ | ✅ |
| B5 | Course Package Auto-Fee Calculation | ✅ | ✅ | ✅ |
| B6 | Membership Renewal | ✅ | ✅ | ✅ |
| B7 | Balance Payment Tracking | ✅ | ✅ | ✅ |
| B8 | Photo Upload & Camera Capture | ❌ | ✅ | ✅ |
| B9 | Member Export to Excel | ❌ | ✅ | ✅ |
| B10 | Balance Payment Export | ❌ | ✅ | ✅ |
| | **PERSONAL TRAINING (PT)** | | | |
| C1 | Add PT Membership | ❌ | ✅ | ✅ |
| C2 | Edit PT Membership | ❌ | ✅ | ✅ |
| C3 | Pause PT Membership | ❌ | ✅ | ✅ |
| C4 | Remove PT Membership | ❌ | ✅ | ✅ |
| C5 | PT Fee Calculation | ❌ | ✅ | ✅ |
| | **MEMBER INQUIRY / CRM** | | | |
| D1 | Member Inquiries CRUD | ✅ Basic | ✅ Full | ✅ Full |
| D2 | Reference Tracking | ❌ | ✅ | ✅ |
| | **TRAINER MANAGEMENT** | | | |
| E1 | Trainer Listing | ✅ Up to 3 | ✅ Up to 10 | ✅ Unlimited |
| E2 | Add/Edit Trainer | ✅ | ✅ | ✅ |
| E3 | Trainer Detail View | ✅ | ✅ | ✅ |
| E4 | Reset Trainer Password | ✅ | ✅ | ✅ |
| E5 | Toggle Trainer Status | ✅ | ✅ | ✅ |
| E6 | View Trainer's PT Members | ❌ | ✅ | ✅ |
| | **SALARY & PAYROLL** | | | |
| F1 | Salary Settlement CRUD | ❌ | ✅ | ✅ |
| F2 | Auto Salary Calculation | ❌ | ✅ | ✅ |
| F3 | Incentive Management | ❌ | ❌ | ✅ |
| F4 | Salary Slip Download | ❌ | ✅ | ✅ |
| F5 | Salary Export to Excel | ❌ | ❌ | ✅ |
| F6 | Trainer Self-Service Portal | ❌ | ✅ | ✅ |
| | **EXPENSE MANAGEMENT** | | | |
| G1 | Expense CRUD | ✅ | ✅ | ✅ |
| G2 | Expense Groups / Categories | ✅ | ✅ | ✅ |
| G3 | File Attachments (Receipts) | ❌ | ✅ | ✅ |
| G4 | Expense Export to Excel | ❌ | ✅ | ✅ |
| | **FINANCIAL REPORTS** | | | |
| H1 | Income Report (view only) | ❌ | ✅ | ✅ |
| H2 | Income Report Excel Export | ❌ | ❌ | ✅ |
| H3 | Expense Report (view only) | ❌ | ✅ | ✅ |
| H4 | Expense Report Excel Export | ❌ | ❌ | ✅ |
| H5 | Income Summary Cards | ❌ | ✅ | ✅ |
| H6 | Expense Summary Cards | ❌ | ✅ | ✅ |
| | **DIET & NUTRITION** | | | |
| I1 | Diet Plans (basic CRUD) | ❌ | ✅ | ✅ |
| I2 | Diet Templates (structured meals) | ❌ | ❌ | ✅ |
| I3 | Assign Diet to Members | ❌ | ✅ | ✅ |
| I4 | Bulk Diet Assignment | ❌ | ❌ | ✅ |
| I5 | Member Diet View (Member Portal) | ❌ | ❌ | ✅ |
| | **EXERCISE & WORKOUT** | | | |
| J1 | Exercise Plans CRUD | ❌ | ✅ | ✅ |
| J2 | Assign Exercise to Members | ❌ | ✅ | ✅ |
| J3 | Workout Exercise Master | ❌ | ✅ | ✅ |
| J4 | Body Part Master | ❌ | ✅ | ✅ |
| J5 | Member Exercise View (Member Portal) | ❌ | ❌ | ✅ |
| | **COURSE PACKAGES** | | | |
| K1 | Regular Packages | ✅ Up to 5 | ✅ Unlimited | ✅ Unlimited |
| K2 | PT Packages | ❌ | ✅ Unlimited | ✅ Unlimited |
| | **MASTER DATA** | | | |
| K3 | Expense Group Master | ✅ | ✅ | ✅ |
| K4 | Body Part Master | ❌ | ✅ | ✅ |
| K5 | Designation Master | ❌ | ✅ | ✅ |
| | **PLATFORM & PORTALS** | | | |
| L1 | Subscription History | ✅ | ✅ | ✅ |
| L2 | Trainer Portal (separate login) | ❌ | ✅ | ✅ |
| L3 | Member Portal (separate login) | ❌ | ❌ | ✅ |

---

## 5. Pricing Recommendation

### Base Pricing (Annual — INR)

| | 🥉 **STARTER** | 🥈 **PROFESSIONAL** | 🥇 **ENTERPRISE** |
|---|:---:|:---:|:---:|
| **Annual Price** | ₹4,999 / year | ₹11,999 / year | ₹24,999 / year |
| **Monthly Equivalent** | ₹417/mo | ₹1,000/mo | ₹2,083/mo |
| **Per-Day Cost** | ~₹14/day | ~₹33/day | ~₹68/day |

### Pricing Rationale

| Tier | Why This Price? |
|------|----------------|
| **Starter ₹4,999** | Affordable entry point for small gyms. Covers core member management + basic operations. Less than ₹14/day — cheaper than a member's daily protein shake. Removes barrier to adoption. |
| **Professional ₹11,999** | Unlocks the real value — PT management, salary/payroll, financial reports, diet/exercise plans, trainer portal, Excel exports. Mid-range gyms easily save 10× this in operational efficiency. ~₹1,000/month. |
| **Enterprise ₹24,999** | Full platform access including member portal, advanced diet templates, bulk operations, all Excel exports, incentive tracking. For large gyms managing 500+ members and multiple trainers. ~₹2,083/month. |

### Early Bird / Launch Discounts (Optional)

| Offer | Discount |
|-------|----------|
| First 50 Gym Signups | 30% off first year |
| 2-Year Commitment | 20% off (pay ₹3,999 / ₹9,599 / ₹19,999 per year) |
| Referral Bonus | 1 month free extension for each referred gym |

---

## 6. Plan Comparison Card (Sales Ready)

### 🥉 STARTER — ₹4,999/year
**Best for:** New gyms, small fitness centers, <100 members

**What you get:**
- ✅ Gym Owner Dashboard with alerts
- ✅ Member management (add, edit, renew, track payments)
- ✅ Up to 3 trainers
- ✅ Up to 5 course packages (Regular only)
- ✅ Expense tracking with categories
- ✅ Member inquiry tracking (basic)
- ✅ Subscription history
- ❌ No PT management
- ❌ No financial reports
- ❌ No diet/exercise plans
- ❌ No trainer or member portal
- ❌ No Excel exports

---

### 🥈 PROFESSIONAL — ₹11,999/year ⭐ MOST POPULAR
**Best for:** Growing gyms, 100–500 members, offering PT services

**Everything in Starter, PLUS:**
- ✅ **Personal Training module** (add/edit/pause/remove PT memberships)
- ✅ **Trainer Portal** — trainers get their own login to view PT members & salary
- ✅ Up to 10 trainers
- ✅ Unlimited course packages (Regular + PT)
- ✅ **Salary & payroll** — auto-calculation, salary slips, settlements
- ✅ **Financial reports** — income & expense reports with summary cards
- ✅ **Diet plans** — create & assign to members
- ✅ **Exercise plans** — create, assign, workout/body part master
- ✅ **Excel exports** — members, expenses, salary
- ✅ Photo upload & camera capture
- ✅ Expense receipt attachments
- ✅ BMI Calculator
- ✅ Full member inquiry with reference tracking
- ❌ No member portal
- ❌ No diet templates / bulk assignment
- ❌ No report Excel exports
- ❌ No incentive breakdown

---

### 🥇 ENTERPRISE — ₹24,999/year
**Best for:** Large gyms, fitness chains, 500+ members, premium services

**Everything in Professional, PLUS:**
- ✅ **Member Portal** — members get their own login to view dashboard, diet, exercise, trainer
- ✅ **Unlimited trainers**
- ✅ **Advanced Diet Templates** — structured multi-meal templates with time slots
- ✅ **Bulk diet assignment** — assign one template to many members
- ✅ **Incentive management** — PT, Protein, Referral, Other incentives
- ✅ **ALL Excel exports** — income reports, expense reports, salary
- ✅ **Full salary export** with complete breakdown
- ✅ Priority support

---

## 7. Add-On Modules (Future Upsell)

These features can be sold as add-ons or built into future tiers:

| Add-On | Price (Suggested) | Description |
|--------|-------------------|-------------|
| SMS/WhatsApp Notifications | ₹2,999/year | Birthday wishes, renewal reminders, payment alerts |
| Attendance Tracking (Biometric) | ₹4,999/year | Integration with biometric devices, check-in/check-out |
| Online Payment Gateway | ₹1,999/year + 2% txn | Members pay online via UPI/Card |
| Multi-Branch Management | ₹9,999/year | Manage multiple gym locations under one account |
| Custom Branding | ₹2,999/year | White-label member portal with gym's own logo/colors |
| Advanced Analytics | ₹3,999/year | Revenue trends, member retention, trainer performance graphs |
| Mobile App (Member) | ₹7,999/year | Branded Android/iOS app for members |

---

## 8. FAQ for Sales Team

**Q: What happens if a gym exceeds the trainer/package limit?**
A: They'll be prompted to upgrade. No hard block — show a banner suggesting the next tier.

**Q: Can a gym downgrade mid-year?**
A: Yes. The system supports prorated upgrades/downgrades (already implemented in admin GymsPage). Remaining balance is adjusted.

**Q: What if a gym doesn't renew?**
A: Their data remains but access is read-only. After 90 days of expiry, they see a blocked screen prompting renewal.

**Q: Do trainers/members count against the subscription?**
A: Trainers have limits per tier (3/10/Unlimited). Member count is unlimited on all tiers — we want gym owners to grow.

**Q: Is there a free trial?**
A: Recommended: 14-day free trial of Professional tier. No credit card required. Converts to Starter if not upgraded.

**Q: How do I handle a gym that wants only diet/exercise features?**
A: Those are Professional tier features. You cannot cherry-pick — push them to Professional. The pricing is reasonable for the value.

**Q: What payment modes do we accept for subscriptions?**
A: Cash, Card, UPI, Bank Transfer, Cheque, Net Banking (all already implemented in the platform).

---

## Quick Revenue Projection

| Scenario | Gyms | Mix | Annual Revenue |
|----------|------|-----|---------------|
| **Year 1 (Conservative)** | 50 gyms | 60% Starter, 30% Pro, 10% Enterprise | ₹3,84,950 (~₹3.85 lakh) |
| **Year 1 (Moderate)** | 150 gyms | 40% Starter, 40% Pro, 20% Enterprise | ₹16,49,700 (~₹16.5 lakh) |
| **Year 2 (Growth)** | 500 gyms | 30% Starter, 45% Pro, 25% Enterprise | ₹63,74,250 (~₹63.7 lakh) |

> **Break-even tip:** At just 25 Professional-tier gyms, you earn ₹3 lakh/year — likely covering hosting + basic operations.

---

*Document generated from codebase analysis on Feb 2026. Update when new modules are added.*

HALFYEARLY - Small Gym Setup
- Export Excel Features Removed
STARTER - Starter
PROFESSIONAL - Most Popular (Silver)
PROFESSIONAL - Most Popular (Gold)
PROFESSIONAL - Most Popular (Diamond)