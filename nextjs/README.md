# Next.js Frontend

Next.js 15 application for Seery prediction market platform.

## Installation

**1. Install dependencies:**
```bash
npm install
```

**2. Set up environment variables:**

Create a `.env.local` file in the `nextjs/` folder (see `.env.example` for template):
```env
NEXT_PUBLIC_API_URL=http://localhost:3016
NEXT_PUBLIC_MAIN_CONTRACT_ADDRESS=0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D
```

**Deployed Contract Addresses:**
- **Mainnet:** `0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D` ([BSCScan](https://bscscan.com/address/0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D))
- **Testnet:** `0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6` ([BSCScan Testnet](https://testnet.bscscan.com/address/0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6))

**Note:** The live deployment at [theseery.com](https://theseery.com) uses BNB Smart Chain Testnet.

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
- `NEXT_PUBLIC_MAIN_CONTRACT_ADDRESS` - Main contract address on BNB Chain

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
