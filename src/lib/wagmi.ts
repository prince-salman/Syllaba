import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Syllaba',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia, baseSepolia, mainnet],
  ssr: true,
});
