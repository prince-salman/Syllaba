'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function WalletLogin() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex flex-col items-start gap-3">
      <ConnectButton label="Login dengan MetaMask" />

      {isConnected && address ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <p className="font-semibold">Status Login: Terhubung</p>
          <p className="font-mono text-xs break-all">{address}</p>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Hubungkan MetaMask untuk login dan mulai menyusun roadmap belajar Syllaba.
        </p>
      )}
    </div>
  );
}
