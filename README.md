<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.
View your app in AI Studio: https://ai.studio/apps/drive/1ae454ZN4_ouOKrPzrBExNr6kNpFP7YVT

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

This project is configured for continuous deployment to GitHub Pages when changes are pushed to the `main` branch.

1.  **Custom Domain:** The custom domain is configured in the repository's **Settings > Pages** section.
2.  **Workflow:** The deployment is handled by the `.github/workflows/deploy-frontend.yml` GitHub Actions workflow.
3.  **DNS:** Domain's DNS records point to GitHub Pages.
