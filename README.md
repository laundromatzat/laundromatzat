# Laundromatzat Digital Atelier (Monorepo)

Welcome to the **Laundromatzat** monorepo. This repository houses the main creative portfolio and a suite of specialized tools.

## 🛠️ Quick Start

This project is configured as a single workspace with shared dependencies where possible.

### Prerequisites

- Node.js 18+
- Google Gemini API Key (for Portfolio AI tools).
- LM Studio (optional, for Paystub Analyzer local LLM).

### Setup

1.  **Install dependencies**

    ```bash
    npm install
    ```

    > **Note**: This project installs git hooks via Husky. `lint-staged` will automatically lint your code before every commit.

2.  **Configure Environment**
    Create `.env.local`:

    ```env
    VITE_GEMINI_API_KEY=your_key
    DATABASE_URL=postgresql://localhost/laundromatzat_dev
    ```

3.  **Set Up Local Database (Development)**

    ```bash
    # Install PostgreSQL (macOS)
    brew install postgresql@14
    brew services start postgresql@14

    # Create development database
    createdb laundromatzat_dev
    ```

    > **Note**: The backend will automatically create all required tables on first run.

4.  **Run Development Server**

    ```bash
    npm run dev
    ```

    - Portfolio: `http://localhost:5173`
    - Fabric Designer: `http://localhost:5173/fabric-designer`
    - Paystub Analyzer: `http://localhost:5173/paystub-analyzer`

### Running the Paystub Backend

To use the Paystub Analyzer, you must also start the local backend:

```bash
cd server
npm start
```

## 🤖 AI Architecture

This project uses a **"Grounding-to-Visuals"** pattern to ensure AI accuracy.

- **Research Phase**: Complex requests (like Fabric Design) first go through a research step to gather technical facts.
- **Generation Phase**: The synthesized facts are used as context for the final creative generation.

## 🚀 Deployment & Security

To deploy this application to production (e.g., laundromatzat.com), follow these critical steps to ensure security and functionality.

### 1. Environment Variables

You must configure the following environment variables in your production environment (e.g., Render, HerokuConfig, or `.env` file on your server).

| Variable | Description | Security Note |
|Base URL| `http://localhost:5173` | Set to your production URL (e.g., `https://laundromatzat.com`) |
| `NODE_ENV` | Set to `production` | Enables optimization and strict security checks. |
| `PORT` | Listening port (default: 4000) | Set by your hosting provider usually. |
| `JWT_SECRET` | Secret key for signing session tokens. | **CRITICAL**: Generate a long, random string (e.g., `openssl rand -base64 32`). Do NOT use the default. |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key. | **RESTRICT THIS KEY**: In Google Cloud Console, restrict this key to `https://laundromatzat.com` (HTTP Referrer restriction). |
| `LM_STUDIO_API_URL` | URL for local/hosted LLM. | Ensure this is accessible from the backend server if used. |

### 2. Database & Storage Strategy

The application uses **PostgreSQL** (managed database) and persistent file storage (`server/uploads/`).

#### **Development Environment**

- **Database**: Set `DATABASE_URL` in `.env.local` to point to a **separate development database**
  - **Recommended**: Local PostgreSQL instance (`postgresql://localhost/laundromatzat_dev`)
  - **Alternative**: Render dev database (separate from production)
  - **⚠️ Never use production `DATABASE_URL` in development** to avoid data corruption
- **Storage**: Local filesystem (`server/uploads/`) - data persists on your machine

#### **Production Environment (Render)**

- **Database**: Render-managed PostgreSQL (set via `DATABASE_URL` environment variable)
- **Storage**: Render persistent disk mounted to `server/uploads/`
- **Backups**: Use `npm run backup` to create JSON dumps (see Admin Features section)

### 3. Build & Run

For a single-server deployment (serving both Frontend and Backend):

1.  **Build Frontend**:

    ```bash
    npm run build
    ```

    This creates the optimized static files in `dist/`.

2.  **Start Backend**:

    ```bash
    cd server
    npm install
    # Ensure dependencies like helmet and rate-limit are installed
    npm install helmet express-rate-limit

    # Start the server (Process Manager recommended, e.g., PM2)
    npm start
    ```

    _Note: The server is configured to serve the `dist/` frontend files automatically when `NODE_ENV=production`._

### 4. Security Checklist

- [ ] **HTTPS**: Ensure your domain has an SSL certificate (e.g., via Let's Encrypt or your PaaS provider).
- [ ] **API Restrictions**: checking your Google Cloud Console to ensure `VITE_GEMINI_API_KEY` can only be called from `https://laundromatzat.com`.
- [ ] **CORS**: The backend is configured to allow `https://laundromatzat.com`. If you change your domain, update `allowedOrigins` in `server/server.js`.
- [ ] **Secrets**: Never commit `.env` files to GitHub. They are ignored by default, but double-check.

### 5. Troubleshooting

- **PDF Processing**: If `pdfjs-dist` errors occur in production, ensure the host environment supports the necessary Node.js bindings or libraries.
- **Blank Screen**: Check browser console. If API calls fail (401/403), check CORS settings and `JWT_SECRET` consistency.

### 6. Admin Features & Maintenance

#### 🛑 User Approval Workflow

New users cannot log in immediately.

1. User registers -> Sees "Pending Approval" message.
2. Admin logs in -> Dashboard -> Clicks "Approve".
3. User can now log in.

#### 📧 Email Notifications

Admin receives an email when a new user registers.
**Requirement:** Set these env vars on Render:

- `SMTP_HOST` (e.g., smtp.gmail.com)
- `SMTP_PORT` (e.g., 587)
- `SMTP_USER` (Your email)
- `SMTP_PASS` (App Password)
- `ADMIN_EMAIL` (Where to send notifications)

#### 🛡️ Database Backup

To create a JSON dump of all critical tables:

```bash
npm run backup
# Output: server/backups/backup-{timestamp}.json
```

#### 🚨 Emergency Shortcuts (Disabled)

The endpoints `hard-reset-users` and `reset-password-emergency` are **commented out** in `server.js` for security. Uncomment them only if you lose Admin access again.
