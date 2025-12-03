"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Background from "@/components/background";

type CellState = "empty" | "player" | "ai" | "hit" | "miss" | "destroyed";

const GRID_SIZE = 6;
const TOTAL_TURNS = 30;
const TOWER_COUNT = 3;

const crystalColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
export default function BattleGridGame() {
  const [phase, setPhase] = useState<"setup" | "battle" | "finished">("setup");
  const [playerTowers, setPlayerTowers] = useState<number[]>([]);
  const [aiTowers, setAiTowers] = useState<number[]>([]);
  const [playerGrid, setPlayerGrid] = useState<CellState[]>(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
  const [aiGrid, setAiGrid] = useState<CellState[]>(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
  const [turn, setTurn] = useState<number>(0);
  const [status, setStatus] = useState<string>("Place your crystals on the sanctum grid");
  const aiTurnTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper to convert row/col to index
  const rcToIdx = (r: number, c: number) => r * GRID_SIZE + c;

  // Randomly place AI towers after player setup
  const placeAITowers = () => {
    const positions: number[] = [];
    while (positions.length < TOWER_COUNT) {
      const idx = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
      if (!positions.includes(idx) && !playerTowers.includes(idx)) {
        positions.push(idx);
      }
    }
    setAiTowers(positions);
    setPhase("battle");
    setStatus("Your turn");
  };

  // Handle player placing towers during setup
  const handlePlayerSetup = (idx: number) => {
    if (phase !== "setup" || playerTowers.length >= TOWER_COUNT) return;
    if (playerTowers.includes(idx)) return;
    const newTowers = [...playerTowers, idx];
    setPlayerTowers(newTowers);
    const newGrid = [...playerGrid];
    newGrid[idx] = "player";
    setPlayerGrid(newGrid);
    if (newTowers.length === TOWER_COUNT) {
      // Delay AI placement to simulate secret placement
      setTimeout(placeAITowers, 500);
    }
  };

  // Handle player attack on AI grid
  const handlePlayerAttack = (idx: number) => {
    if (phase !== "battle" || aiGrid[idx] === "hit" || aiGrid[idx] === "miss" || aiGrid[idx] === "destroyed") return;
    const newGrid = [...aiGrid];
    if (aiTowers.includes(idx)) {
      newGrid[idx] = "hit";
      setAiTowers(aiTowers.filter((t) => t !== idx));
      setStatus("Hit! You shattered an enemy crystal.");
    } else {
      newGrid[idx] = "miss";
      setStatus("Missed! The spell dissipates.");
    }
    setAiGrid(newGrid);
    setTurn(turn + 1);
    // Check win
    if (aiTowers.length === 0) {
      setStatus("You win! All enemy crystals shattered.");
      setPhase("finished");
    } else if (turn + 1 >= TOTAL_TURNS) {
      setStatus("Turn limit reached. The duel ends in a draw.");
      setPhase("finished");
    } else {
      // AI turn after delay
      aiTurnTimer.current = setTimeout(() => {
        aiAttack();
      }, 1000);
    }
  };

  // AI attack logic
  const aiAttack = () => {
    const available = playerGrid
      .map((cell, idx) => (cell === "player" || cell === "empty" ? idx : -1))
      .filter((idx) => idx !== -1);
    if (available.length === 0) {
      setStatus("AI has no targets. You win the duel!");
      setPhase("finished");
      return;
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    const newGrid = [...playerGrid];
    if (playerTowers.includes(idx)) {
      newGrid[idx] = "destroyed";
      setPlayerTowers(playerTowers.filter((t) => t !== idx));
      setStatus("AI shattered one of your crystals!");
    } else {
      newGrid[idx] = "miss";
      setStatus("AI missed! The spell fizzles.");
    }
    setPlayerGrid(newGrid);
    setTurn(turn + 1);
    // Check loss
    if (playerTowers.length === 0) {
      setStatus("You lose! All your crystals shattered.");
      setPhase("finished");
    } else if (turn + 1 >= TOTAL_TURNS) {
      setStatus("Turn limit reached. Game over.");
      setPhase("finished");
    }
  };

  // Restart game
  const restart = () => {
    setPhase("setup");
    setPlayerTowers([]);
    setAiTowers([]);
    setPlayerGrid(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
    setAiGrid(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
    setTurn(0);
    setStatus("Place your crystals on the sanctum grid");
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (aiTurnTimer.current) clearTimeout(aiTurnTimer.current);
    };
  }, []);

  // Render grid cells
  const renderCell = (grid: CellState[], idx: number, onClick: (idx: number) => void) => {
    let bg = "bg-white";
    switch (grid[idx]) {
      case "player":
        bg = "bg-green-500";
        break;
      case "ai":
        bg = "bg-red-500";
        break;
      case "hit":
        bg = "bg-red-500";
        break;
      case "miss":
        bg = "bg-blue-500";
        break;
      case "destroyed":
        bg = "bg-black";
        break;
      default:
        bg = "bg-white";
    }
    return (
      <td
        key={idx}
        className={`w-8 h-8 border border-gray-300 cursor-pointer ${bg}`}
        onClick={() => onClick(idx)}
      />
    );
  };

  const renderGrid = (grid: CellState[], onClick: (idx: number) => void) => {
    const rows = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const cells = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const idx = rcToIdx(r, c);
        cells.push(renderCell(grid, idx, onClick));
      }
      rows.push(<tr key={r}>{cells}</tr>);
    }
    return <table className="border-collapse">{rows}</table>;
  };

  return (
    <>
      <Background />
      <div className="relative flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Battle Grid Game</h1>
      <p>{status}</p>
      <div className="text-sm mt-2">
        <h2 className="font-semibold mb-1">How to Play</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>During the <strong>setup</strong> phase, click on your grid to place your crystals until all are placed.</li>
          <li>Once all crystals are placed, the AI will secretly place its crystals.</li>
          <li>During the <strong>battle</strong> phase, click on the AI grid to cast a spell at that cell.</li>
          <li>If you hit an enemy crystal, it is destroyed. If you miss, the cell turns blue.</li>
          <li>Win by destroying all enemy crystals before the turn limit or before all your crystals are destroyed.</li>
          <li>Lose if all your crystals are destroyed or the turn limit is reached.</li>
        </ul>
      </div>
      <div className="w-8 h-8 rounded-full mx-auto my-4" style={{backgroundColor: crystalColors[turn % crystalColors.length]}}></div>
      <div className="flex gap-8">
        <div>
          <h2 className="text-lg">Your Grid</h2>
          {renderGrid(playerGrid, phase === "setup" ? handlePlayerSetup : () => {})}
        </div>
        <div>
          <h2 className="text-lg">AI Grid</h2>
          {renderGrid(aiGrid, phase === "battle" ? handlePlayerAttack : () => {})}
        </div>
      </div>
      <div className="flex gap-4">
        <Button onClick={restart}>Restart</Button>
        <span>Turn: {turn}</span>
      </div>
    </div>
    </>
  );
}
