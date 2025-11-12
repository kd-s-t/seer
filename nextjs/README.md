# Next.js Frontend

Next.js 15 application for Seery prediction market platform.

## Installation

**1. Install dependencies:**
```bash
npm install
```

**2. Set up environment variables:**

Create a `.env.local` file in the `nextjs/` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:3016
```

**3. Ensure backend is running:**

Make sure the Express.js backend is running on `http://localhost:3016` before starting the frontend.

## Running

**Development mode:**
```bash
npm run dev
```

App runs on `http://localhost:3015` and automatically opens in your browser.

**Production build:**
```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3016)

## Features

- **Market Browsing**: View all active prediction markets
- **Market Creation**: Create new markets manually or with AI assistance
- **Betting Interface**: Place bets on market outcomes
- **Wallet Integration**: MetaMask wallet connection
- **Real-Time Updates**: Live market data and pool sizes
- **AI Market Generation**: Generate markets from news using AI

## Project Structure

```
nextjs/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Main page
│   ├── layout.tsx    # Root layout
│   └── globals.css   # Global styles
├── components/       # React components
│   └── MarketCard.tsx
├── public/           # Static assets
└── types/            # TypeScript type definitions
```
