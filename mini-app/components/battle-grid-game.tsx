"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Background from "@/components/background";
import Modal from "@/components/ui/modal";

type CellState = "empty" | "player" | "ai" | "hit" | "miss" | "destroyed";

let GRID_SIZE = 6; // will be overridden by difficulty settings
let TOTAL_TURNS = 30; // will be overridden by difficulty settings
let TOWER_COUNT = 3; // will be overridden by difficulty settings

const crystalColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
export default function BattleGridGame() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [phase, setPhase] = useState<"setup" | "battle" | "finished">("setup");
  const [playerTowers, setPlayerTowers] = useState<number[]>([]);
  const [aiTowers, setAiTowers] = useState<number[]>([]);
  const [playerGrid, setPlayerGrid] = useState<CellState[]>(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
  const [aiGrid, setAiGrid] = useState<CellState[]>(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
  const [turn, setTurn] = useState<number>(0);
  const [status, setStatus] = useState<string>("Place your crystals on the sanctum grid");
    const [showHowTo, setShowHowTo] = useState<boolean>(false);
    const [showEndModal, setShowEndModal] = useState<boolean>(false);
    const [endMessage, setEndMessage] = useState<string>("");
    const [placementTime, setPlacementTime] = useState<number>(60);
    const [placementTimer, setPlacementTimer] = useState<number>(60);
    const [lastAttackIdx, setLastAttackIdx] = useState<number | null>(null);
    const [selectedSkill, setSelectedSkill] = useState<"fireball" | "meteor" | "star" | null>(null);
    const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({
      fireball: 0,
      meteor: 0,
      star: 0,
    });

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
    if (phase !== "battle") return;
    // Skill usage
    if (selectedSkill) {
      const newGrid = [...aiGrid];
      const col = idx % GRID_SIZE;
      if (selectedSkill === "fireball") {
        const row = Math.floor(idx / GRID_SIZE);
        const indices = [row * GRID_SIZE + (idx % GRID_SIZE)];
        if (idx % GRID_SIZE < GRID_SIZE - 1) {
          indices.push(row * GRID_SIZE + (idx % GRID_SIZE + 1));
        }
        indices.forEach((i) => {
          if (aiTowers.includes(i)) {
            newGrid[i] = "hit";
            setAiTowers(aiTowers.filter((t) => t !== i));
            setStatus("Fireball hit! Destroyed a crystal.");
          } else {
            newGrid[i] = "miss";
            setStatus("Fireball missed!");
          }
        });
        setAiGrid(newGrid);
        setSkillCooldowns((prev) => ({ ...prev, fireball: 2 }));
        setSelectedSkill(null);
        setTurn(turn + 1);
        // Check win
        if (aiTowers.length === 0) {
          setStatus("You win! All enemy crystals shattered.");
          setPhase("finished");
          setEndMessage("Victory! All enemy crystals shattered.");
          setShowEndModal(true);
        } else if (turn + 1 >= TOTAL_TURNS) {
          setStatus("Turn limit reached. The duel ends in a draw.");
          setPhase("finished");
          setEndMessage("Draw! No one wins in 30 turns.");
          setShowEndModal(true);
        } else {
          aiAttack();
        }
        return;
      }
      // Other skills can be added similarly
    }
    // Normal attack
    if (aiGrid[idx] === "hit" || aiGrid[idx] === "miss" || aiGrid[idx] === "destroyed") return;
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
      setEndMessage("Victory! All enemy crystals shattered.");
      setShowEndModal(true);
    } else if (turn + 1 >= TOTAL_TURNS) {
      setStatus("Turn limit reached. The duel ends in a draw.");
      setPhase("finished");
      setEndMessage("Draw! No one wins in 30 turns.");
      setShowEndModal(true);
    } else {
      // AI turn after delay
      aiAttack();
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
    let idx: number;
    if (difficulty === "easy") {
      idx = available[Math.floor(Math.random() * available.length)];
    } else if (difficulty === "medium") {
      const filtered = lastAttackIdx !== null ? available.filter(i => i !== lastAttackIdx) : available;
      idx = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : available[Math.floor(Math.random() * available.length)];
    } else {
      // Hard: strategic (placeholder)
      idx = available[Math.floor(Math.random() * available.length)];
    }
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
    setLastAttackIdx(idx);
    // Check loss
    if (playerTowers.length === 0) {
      setStatus("You lose! All your crystals shattered.");
      setPhase("finished");
      setEndMessage("Defeat! All your crystals shattered.");
      setShowEndModal(true);
    } else if (turn + 1 >= TOTAL_TURNS) {
      setStatus("Turn limit reached. Game over.");
      setPhase("finished");
      setEndMessage("Draw! No one wins in 30 turns.");
      setShowEndModal(true);
    }
  };
  const setDifficultyAndReset = (level: "easy" | "medium" | "hard") => {
    const newGridSize = level === "easy" ? 6 : level === "medium" ? 8 : 10;
    const newTowerCount = level === "easy" ? 3 : level === "medium" ? 4 : 5;
    const newTotalTurns = 30;
    const newPlacementTime = level === "easy" ? 60 : level === "medium" ? 45 : 30;
    setDifficulty(level);
    setPhase("setup");
    setPlayerTowers([]);
    setAiTowers([]);
    setPlayerGrid(Array(newGridSize * newGridSize).fill("empty"));
    setAiGrid(Array(newGridSize * newGridSize).fill("empty"));
    setTurn(0);
    setStatus("Place your crystals on the sanctum grid");
    setPlacementTime(newPlacementTime);
    setPlacementTimer(newPlacementTime);
    setLastAttackIdx(null);
    // Update constants
    GRID_SIZE = newGridSize;
    TOWER_COUNT = newTowerCount;
    TOTAL_TURNS = newTotalTurns;
  };

  useEffect(() => {
    if (phase !== "setup") return;
    if (placementTimer <= 0) {
      if (playerTowers.length < TOWER_COUNT) {
        placeAITowers();
      }
      return;
    }
    const timer = setTimeout(() => setPlacementTimer(placementTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, placementTimer, playerTowers.length, TOWER_COUNT]);

  useEffect(() => {
    if (turn > 0) {
      setSkillCooldowns((prev) => ({
        fireball: Math.max(0, prev.fireball - 1),
        meteor: Math.max(0, prev.meteor - 1),
        star: Math.max(0, prev.star - 1),
      }));
    }
  }, [turn]);

  // Restart game
  const restart = () => {
    setPhase("setup");
    setPlayerTowers([]);
    setAiTowers([]);
    setPlayerGrid(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
    setAiGrid(Array(GRID_SIZE * GRID_SIZE).fill("empty"));
    setTurn(0);
    setStatus("Place your crystals on the sanctum grid");
    setLastAttackIdx(null);
    setPlacementTimer(placementTime);
  };

  // Cleanup timer on unmount

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
    const hoverGlow = difficulty === "easy" && grid[idx] === "ai" ? "hover:bg-yellow-300" : "";
    return (
      <td
        key={idx}
        className={`w-8 h-8 border border-gray-300 cursor-pointer ${bg} ${hoverGlow}`}
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
        const cell = grid[idx];
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
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setDifficultyAndReset("easy")}>Easy</Button>
          <Button onClick={() => setDifficultyAndReset("medium")}>Medium</Button>
          <Button onClick={() => setDifficultyAndReset("hard")}>Hard</Button>
          <Button onClick={() => setShowHowTo(true)}>How to Play</Button>
        </div>
        <div className="flex gap-4 mb-4">
          <Button
            className="text-black"
            variant={selectedSkill === "fireball" ? "default" : "outline"}
            disabled={skillCooldowns.fireball > 0}
            onClick={() => {
              setSelectedSkill("fireball");
              setSkillCooldowns((prev) => ({ ...prev, fireball: 2 }));
            }}
          >
            Fireball {skillCooldowns.fireball > 0 && `(${skillCooldowns.fireball})`}
          </Button>
          <Button
            className="text-black"
            variant={selectedSkill === "meteor" ? "default" : "outline"}
            disabled={skillCooldowns.meteor > 0 || difficulty === "easy"}
            onClick={() => {
              setSelectedSkill("meteor");
              setSkillCooldowns((prev) => ({ ...prev, meteor: 4 }));
            }}
          >
            Meteor {skillCooldowns.meteor > 0 && `(${skillCooldowns.meteor})`}
          </Button>
          <Button
            className="text-black"
            variant={selectedSkill === "star" ? "default" : "outline"}
            disabled={skillCooldowns.star > 0 || difficulty === "easy"}
            onClick={() => {
              setSelectedSkill("star");
              setSkillCooldowns((prev) => ({ ...prev, star: 6 }));
            }}
          >
            Star Ray {skillCooldowns.star > 0 && `(${skillCooldowns.star})`}
          </Button>
        </div>
      <h1 className="text-2xl font-bold">Battle Grid Game</h1>
      <p>{status}</p>
      {phase === "setup" && <p>Time remaining: {placementTimer}s</p>}
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
      <Modal isOpen={showHowTo} onClose={() => setShowHowTo(false)}>
        <div className="p-4 space-y-4 text-black">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">How to Play Wizard Duel</h2>
            <Button variant="ghost" onClick={() => setShowHowTo(false)}>X</Button>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Phase 1: Place Your Crystals</h3>
            <p>Click empty squares on your grid (left side) to place crystals.</p>
            <p>You have 60 seconds to place 3 crystals.</p>
            <p>Crystals will be hidden once battle begins.</p>
            <h3 className="font-semibold">Phase 2: Attack Enemy</h3>
            <p>Click squares on enemy grid (right side) to attack.</p>
            <p>HIT = Red square (destroyed enemy crystal)</p>
            <p>MISS = Gray square (empty)</p>
            <p>Enemy will attack you after each turn.</p>
            <p>Win: Destroy all enemy crystals before they destroy yours.</p>
            <h3 className="font-semibold">⚠️ Notice about Skills:</h3>
            <p>In Medium and Hard modes, both you and the AI gain powerful skills</p>
            <p>Skills are black icons on the left side – click to activate</p>
            <p>Each skill has a cooldown (turns before reuse)</p>
            <p>Easy mode has no skills – only basic attacks</p>
            <p>Skills include: Fireball, Meteor Strike, and Star Ray – each with unique area effects!</p>
            <h3 className="font-semibold">Game End</h3>
            <p>When you destroy all enemy crystals: Victory Popup appears with celebration message!</p>
            <p>When AI destroys all your crystals: Defeat Message appears.</p>
            <p>If no one wins in 30 turns: Draw is declared.</p>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showEndModal} onClose={() => setShowEndModal(false)}>
        <div className="p-4 space-y-4 text-black">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Game Over</h2>
            <Button variant="ghost" onClick={() => setShowEndModal(false)}>X</Button>
          </div>
          <p>{endMessage}</p>
        </div>
      </Modal>
    </div>
    </>
  );
}
