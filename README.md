# Destiny Credit AI Platform

Destiny Credit AI is a comprehensive credit education and financial guidance platform powered by AI. It helps users understand credit management, generate dispute letters, and tracks their progress.

## Folder Structure

- `app/`: Next.js App Router routes and pages.
  - `(auth)/`: Authentication pages (Login, Signup).
  - `admin/`: Admin Panel for platform management.
  - `dashboard/`: Main user dashboard for letter generation and tracking.
  - `credit-videos/`: Educational video library.
  - `resources/`: Educational resources and links.
  - `api/`: Backend API routes.
    - `admin/`: Admin-specific API endpoints (CRUD for users, prompts, resources, etc.).
    - `generate-letter/`: AI letter generation logic via OpenAI.
    - `upload/`: File upload and management.
- `components/`: Reusable UI components.
  - `AdminAuth.tsx`: Security wrapper for admin routes.
- `lib/`: Utility libraries (Prisma client, Auth helpers, AI helpers).
- `prisma/`: Database schema and migrations.
- `public/`: Static assets (Logo, Uploads).

## Admin Flow

1. **Dashboard Management**: Admins can manage educational content, resources, and credit videos.
2. **AI Configuration**: Admins can define specific AI prompts for different letter types (Dispute, Validation, Bankruptcy, etc.).
3. **User Management**: Admins create users and set their initial passwords.
4. **Guidance Video**: Admins can upload a central guidance video displayed on the user dashboard.

## User Flow

1. **Login**: Users log in with credentials set by the administrator.
2. **Dashboard**: Users access their credit workspace, see the guidance video, and generate letters.
3. **Letter Generation**: Users select a letter type and can upload a credit report. The AI parses the report and generates a professional, compliant letter.
4. **Follow-ups**: Users can track their letters and generate follow-up responses at 15, 30, and 45-day intervals.
5. **Education**: Users can browse the Credit Video library and Resource Center.

## AI Logic Flow

1. **Input**: User provides basic info (Name, Creditor, Bureau) and selects a Letter Type. Optionally uploads a report (PDF/Image/Text).
2. **Parsing**: If a report is uploaded, the backend uses AI-compatible parsing to extract credit details.
3. **Prompt Construction**:
   - Backend fetches the Admin-defined prompt for the selected Letter Type.
   - Combines it with a base System Prompt and Compliance Rules.
   - Injects the parsed report data if available.
4. **Generation**: OpenAI (GPT-4) generates a professional, educational letter.
5. **Output**: The letter is displayed to the user and saved for future follow-ups.

## Security

- JWT-based authentication for both users and admins.
- Separate Admin login with role-based access control.
- All file uploads are stored securely and associated with the uploader.
