# Smart Schedule Hub

A modern, React + TypeScript application for university timetable management and scheduling.

## Tech Stack
- React 18, TypeScript
- Vite 5 (fast dev, optimized build)
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router, TanStack Query
- Recharts, Lucide Icons

## Prerequisites
- Node.js 18 or newer
- npm (comes with Node.js)

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   The app runs on `http://localhost:8080/` (if occupied, Vite picks another port).
3. Open the app in your browser and start building.

## Available Scripts
- `npm run dev` – start local dev server
- `npm run build` – create production build in `dist/`
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint across the project

## Configuration
- Dev server port and host are configured in `vite.config.ts`.
- Path alias `@` maps to `src/` for cleaner imports.

## Project Structure
```
smart-schedule-hub/
├─ src/
│  ├─ components/        # UI components (shadcn/ui + custom)
│  ├─ pages/             # Route pages
│  ├─ lib/               # Utilities
│  ├─ main.tsx           # App entry
│  └─ index.css          # Tailwind styles and CSS variables
├─ index.html            # Vite HTML entry
├─ vite.config.ts        # Vite config (server, aliases, plugins)
├─ tailwind.config.ts    # Tailwind configuration
├─ package.json          # Scripts and dependencies
└─ README.md
```

## Build & Preview
```bash
npm run build
npm run preview
```
Then open the printed local URL.

## Notes
- Theming uses `next-themes` with Tailwind CSS variables.
- UI components are built with shadcn/ui and Radix for accessibility and composability.

## Project info

**URL**: https://lovable.dev/projects/3adfc167-117f-43bb-86f1-7d6b97010968

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3adfc167-117f-43bb-86f1-7d6b97010968) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3adfc167-117f-43bb-86f1-7d6b97010968) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
