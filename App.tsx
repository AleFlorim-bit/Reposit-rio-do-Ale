import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import AnalysisTerminal from './components/AnalysisTerminal';
import { GamePhase, PlayerStats, AIBossProfile } from './types';
import { generateBossProfile } from './services/geminiService';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [stats, setStats] = useState<PlayerStats>({
    jumps: 0, meleeAttacks: 0, shotsFired: 0, distanceKept: 0, framesRecorded: 0, aggressionTime: 0, retreatTime: 0, hitsLanded: 0, hitsTaken: 0, airTime: 0
  });
  const [bossProfile, setBossProfile] = useState<AIBossProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const startTraining = () => {
    setPhase(GamePhase.TRAINING);
    setResultMessage(null);
  };

  const handleTrainingComplete = async (collectedStats: PlayerStats) => {
    setStats(collectedStats);
    setPhase(GamePhase.ANALYSIS);
    setIsAnalyzing(true);

    // Call Gemini AI
    const profile = await generateBossProfile(collectedStats);
    setBossProfile(profile);
    setIsAnalyzing(false);
  };

  const startBossFight = () => {
    setPhase(GamePhase.BOSS_FIGHT);
  };

  const handleGameOver = (playerWon: boolean) => {
    setPhase(GamePhase.GAME_OVER);
    if (playerWon) {
        setResultMessage(bossProfile?.dialogue_lose || "A Sombra se desfaz em luz...");
    } else {
        setResultMessage(bossProfile?.dialogue_win || "A escuridão consumiu tudo.");
    }
  };

  const restartGame = () => {
    setPhase(GamePhase.INTRO);
    setStats({
        jumps: 0, meleeAttacks: 0, shotsFired: 0, distanceKept: 0, 
        framesRecorded: 0, aggressionTime: 0, retreatTime: 0, 
        hitsLanded: 0, hitsTaken: 0, airTime: 0
    });
    setBossProfile(null);
    setResultMessage(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="max-w-5xl w-full relative z-10">
        
        {/* Header UI */}
        <div className="mb-8 flex justify-between items-end border-b-2 border-purple-900/50 pb-4">
           <div>
             <h1 className="text-4xl md:text-5xl font-black cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm tracking-wider">PROJECT: SOULBOUND</h1>
             <p className="text-purple-300 font-serif italic text-sm mt-1">Confronte seu próprio reflexo</p>
           </div>
           <div className="flex gap-4 text-xs font-bold tracking-widest cinzel">
              <span className={phase === GamePhase.TRAINING ? "text-amber-400 border-b border-amber-400" : "text-purple-800"}>I. DESPERTAR</span>
              <span className={phase === GamePhase.ANALYSIS ? "text-amber-400 border-b border-amber-400" : "text-purple-800"}>II. REFLEXO</span>
              <span className={phase === GamePhase.BOSS_FIGHT ? "text-amber-400 border-b border-amber-400" : "text-purple-800"}>III. CONFRONTO</span>
           </div>
        </div>

        {/* Main Game Container */}
        <div className="relative shadow-2xl shadow-purple-900/20">
            {phase === GamePhase.INTRO && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05020a]/90 backdrop-blur text-center p-8">
                    <div className="max-w-xl p-10 border-2 border-purple-500/30 bg-[#120822] shadow-[0_0_100px_rgba(147,51,234,0.15)] rounded-lg">
                        <h2 className="text-3xl font-bold cinzel text-amber-100 mb-6">O Ritual Começa</h2>
                        <p className="mb-8 text-purple-200 font-serif text-lg leading-relaxed">
                            O espelho mágico observará sua alma.
                            Enfrente o guardião de treino. O sistema aprenderá se você é um <span className="text-amber-400 font-bold">Guerreiro (Melee - Z)</span> ou um <span className="text-amber-400 font-bold">Mago (Magia - X)</span>.
                            <br/><br/>
                            Baseado nisso, ele invocará sua <span className="text-red-400 italic">Sombra Perfeita</span> para destruí-lo.
                        </p>
                        <button 
                            onClick={startTraining}
                            className="bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-sm cinzel tracking-widest transition-all hover:scale-105 shadow-lg border border-purple-400/20"
                        >
                            INICIAR RITUAL
                        </button>
                    </div>
                </div>
            )}

            {phase === GamePhase.GAME_OVER && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm text-center">
                    <div className="max-w-md p-10 border-y-4 border-double border-red-900 bg-[#0a0505]">
                        <h2 className="text-5xl font-black cinzel text-white mb-4 tracking-widest">{resultMessage?.toLowerCase().includes("luz") || resultMessage?.toLowerCase().includes("desfaz") ? "PURIFICAÇÃO" : "CORRUPÇÃO"}</h2>
                        <div className="h-px w-24 bg-red-800 mx-auto mb-6"></div>
                        <p className="text-xl font-serif italic text-red-200/80 mb-10">"{resultMessage}"</p>
                        <button 
                            onClick={restartGame}
                            className="text-amber-500 hover:text-amber-200 cinzel font-bold border-b border-amber-500/50 hover:border-amber-200 transition-colors pb-1 uppercase tracking-widest"
                        >
                            TENTAR NOVAMENTE
                        </button>
                    </div>
                 </div>
            )}
            
            <GameCanvas 
                phase={phase} 
                onPhaseComplete={handleTrainingComplete} 
                bossProfile={bossProfile}
                onGameOver={handleGameOver}
            />

            {phase === GamePhase.ANALYSIS && (
                <AnalysisTerminal 
                    playerStats={stats} 
                    bossProfile={bossProfile} 
                    isLoading={isAnalyzing} 
                    onStartBoss={startBossFight} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;