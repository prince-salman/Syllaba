import { createConfig, http, injected } from "wagmi";
import { baseSepolia, sepolia, mainnet } from "wagmi/chains";

export const SYLLABA_CHAIN_ID = 84532 as const;

export const SYLLABA_CERTIFICATE_CONTRACT =
  (process.env.NEXT_PUBLIC_SYLLABA_CERTIFICATE_ADDRESS ||
    process.env.NEXT_PUBLIC_SYLLABA_VAULT_ADDRESS ||
    "0xe55a108Ba1E3EE56d64d55F96C7144302400f808") as `0x${string}`;

export const SYLLABA_COIN_CONTRACT =
  (process.env.NEXT_PUBLIC_SYLLABA_COIN_ADDRESS ||
    "0x95f917B6DA441EC62de4bCA5ea83512a8b60BFA7") as `0x${string}`;

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});
