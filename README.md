# Destiny Credit AI - Credit Education Platform

## 🌟 Overview
**Destiny Credit AI** is a state-of-the-art educational platform designed to empower users with knowledge and tools to manage their credit health. By leveraging AI-driven letter generation, guided educational workflows, and a curated resource center, the platform simplifies complex credit processes while maintaining strict legal and educational compliance.

## 🏗 Project Architecture & Folder Structure

```
destinycreditai/
├── app/                      # Next.js App Router (Primary Logic)
│   ├── (auth)/               # Authentication pages (Login, Signup, Reset)
│   ├── admin/                # Admin Management Control Panel
│   ├── api/                  # Server-side API Endpoints
│   ├── dashboard/            # User Dashboard & Letter Generator
│   ├── disclaimer/           # Mandatory Onboarding Disclaimer
│   ├── resources/            # Public Resource Center
│   ├── globals.css           # Global Design System & Variables
│   ├── layout.tsx            # Root configuration & Navigation
│   └── page.tsx              # Landing Page
├── components/               # Shared UI Components (e.g., AdminAuth)
├── lib/                      # Core Libraries (Prisma Client, Auth Utils)
├── prisma/                   # Database Schema & Seed Scripts
├── public/                   # Static Assets & Upload Storage
├── tailwind.config.js        # Modern Design Styling Tokens
└── README.md                 # Project Documentation
```

## 🚀 Key Features

### 1. 🤖 AI Chat Letter Generator (`/dashboard`)
- **Intelligence**: Powered by OpenAI **GPT-4o** for professional and compliant educational letters.
- **Document Analysis**: Users can upload credit reports which the AI analyzes to identify specific inaccuracies.
- **Compliance Guardrails**: Uses strictly conditional language ("if inaccurate") to ensure educational focus.
- **Versatility**: Generates Dispute, Validation, and Goodwill letters for Experian, Equifax, and TransUnion.

### 2. 🎛 Admin Control Panel (`/admin`)
- **Total Visibility**: A central hub to manage the entire platform ecosystem.
- **User Management**: Add, edit, deactivate, or delete users and track their activity.
- **Content Control**: CRUD operations for Workflows, AI Prompts, Letter Templates, and Disclaimers.
- **Audit Logs**: Monitor generated letters and follow-ups across the system.

### 3. 🔄 Guided Workflows
- **Step-by-Step Education**: Interactive modules that guide users through the credit dispute life cycle.
- **Customizable**: Admins can dynamically add or modify workflows via a JSON-based step system.
- **Categories**: Includes Metro 2 Education, Dispute Process, and Follow-up Guidance.

### 4. 📚 Resource Center
- **Expert Curated**: Links to primary authorities like CFPB, FTC, and Official Credit Bureaus.
- **Community Integrated**: Direct access to Skool Community, Loom tutorials, and YouTube education.

### 5. 📮 Follow-up System
- **Timeline Tracking**: Support for 15, 30, and 45-day follow-up letter generation.
- **Context Aware**: Links back to original dispute letters for continuity.

## 🛠 Technical Implementation

### **Backend & Database**
- **Framework**: Next.js 16 with App Router for optimized server-side rendering.
- **Database**: PostgreSQL managed via **Prisma ORM** for high-performance data operations.
- **Authentication**: JWT-based session security with role-based access (ADMIN vs USER).

### **Compliance Logic**
- **Non-Legal Advice**: Every generated letter includes a mandatory educational disclaimer.
- **Onboarding Flow**: All users must accept a comprehensive legal disclaimer before accessing the dashboard.
- **Timeouts**: API routes optimized with 60s `maxDuration` to ensure complex AI tasks complete reliably.

## 📦 Getting Started

1. **Install Dependencies**: `npm install`
2. **Setup Database**: 
   - Update `.env.local` with your `DATABASE_URL`.
   - Run `npx prisma migrate dev` to initialize schemas.
   - Run `node prisma/seed.js` to populate default workflows and prompts.
3. **AI Integration**: Add your `OPENAI_API_KEY` to `.env.local`.
4. **Run Locally**: `npm run dev`

---
**Disclaimer**: *This project is for educational purposes only. It is not a credit repair service and does not provide legal or financial advice.*
