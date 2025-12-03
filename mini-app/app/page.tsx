import { description, title } from "@/lib/metadata";
import { generateMetadata } from "@/lib/farcaster-embed";
import BattleGridGame from "@/components/battle-grid-game";

export { generateMetadata };

export default function Home() {
  // NEVER write anything here, only use this page to import components
  return <BattleGridGame />;
}
