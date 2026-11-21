import { createConfig, http, injected } from "wagmi";
import { baseSepolia, sepolia, mainnet } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});
