// app/api/price/ip/route.ts
import { NextResponse } from 'next/server';

interface CoinGeckoResponse {
  'story-2': {
    usd: number;
  };
}

interface PriceResponse {
  pair: string;
  ipPriceInUSDC: number;   // 1 IP = X USDC
  usdcPriceInIP: number;   // 1 USDC = X IP
  timestamp: string;
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=story-2&vs_currencies=usd',
      {
        next: { revalidate: 60 },
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data: CoinGeckoResponse = await res.json();
    const ipPriceInUSDC = data['story-2']?.usd;

    if (ipPriceInUSDC === undefined) {
      throw new Error('Price data not found');
    }

    // Calculate inverse: how much IP you get for 1 USDC
    const usdcPriceInIP = 1 / ipPriceInUSDC;

    const response: PriceResponse = {
      pair: 'IP/USDC',
      ipPriceInUSDC: Math.round(ipPriceInUSDC * 10000) / 10000,
      usdcPriceInIP: Math.round(usdcPriceInIP * 10000) / 10000,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch IP price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}