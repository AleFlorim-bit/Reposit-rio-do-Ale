import React from 'react';
import { AIBossProfile, PlayerStats } from '../types';

interface AnalysisTerminalProps {
  playerStats: PlayerStats;
  bossProfile: AIBossProfile | null;
  isLoading: boolean;
  onStartBoss: () => void;
}

const AnalysisTerminal: React.FC<AnalysisTerminalProps> = ({ playerStats, bossProfile, isLoading, onStartBoss }) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05020a]/90 text-purple-400 z-50 p-8 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-6 cinzel text-purple-200 animate-pulse tracking-widest">INVOCANDO O REFLEXO</h2>
        
        {/* Magic Circle Animation */}
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-purple-800 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-2 border-2 border-purple-500 rounded-full animate-[spin_5s_linear_infinite_reverse] border-dashed"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-200 rounded-full shadow-[0_0_20px_#d8b4fe]"></div>
            </div>
        </div>

        <div className="mt-4 text-sm font-serif italic text-purple-300/70 text-center space-y-2">
          <p>Lendo os movimentos da alma...</p>
          <p>Agressividade Espiritual: {Math.round(playerStats.aggressionTime / playerStats.framesRecorded * 100)}%</p>
          <p>Materializando a Sombra...</p>
        </div>
      </div>
    );
  }

  if (!bossProfile) return null;

  return (
    <div className="absolute inset-0 bg-[#0a0514]/95 text-purple-100 z-40 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto border-2 border-[#4c1d95] bg-[#1a0b2e]/50 shadow-[0_0_50px_rgba(76,29,149,0.3)] relative">
        
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-500/50"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-500/50"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-500/50"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-500/50"></div>

        <header className="text-center py-8 border-b border-purple-900/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <h1 className="text-5xl md:text-6xl font-black cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600 mb-2 drop-shadow-sm">
            ESPELHO DA ALMA
          </h1>
          <p className="text-purple-300 font-serif italic tracking-widest text-sm">O Abismo olhou de volta para você</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-8">
          
          {/* Player Stats Column */}
          <div className="space-y-6">
            <h3 className="text-2xl cinzel text-amber-500 border-b border-amber-900/30 pb-2">Ecos do Herói</h3>
            
            <div className="bg-[#0f0518] p-6 border border-purple-900/50 rounded-lg">
                <div className="space-y-3 font-serif text-purple-200">
                    <div className="flex justify-between border-b border-purple-900/30 pb-1">
                        <span className="opacity-60">Estilo de Movimento</span>
                        <span className="text-amber-200">{playerStats.jumps > playerStats.framesRecorded/100 ? "Aéreo" : "Terrestre"}</span>
                    </div>
                    <div className="flex justify-between border-b border-purple-900/30 pb-1">
                        <span className="opacity-60">Preferência de Combate</span>
                        <span className="text-amber-200">{playerStats.meleeAttacks > playerStats.shotsFired ? "Lâmina (Melee)" : "Magia (Range)"}</span>
                    </div>
                    <div className="flex justify-between border-b border-purple-900/30 pb-1">
                        <span className="opacity-60">Ímpeto (Agressividade)</span>
                        <span className="text-amber-200">{Math.round(playerStats.aggressionTime / playerStats.framesRecorded * 100)}%</span>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-xs text-purple-400 uppercase tracking-widest mb-2">Leitura da Alma:</p>
                    <p className="text-sm italic text-gray-300 leading-relaxed border-l-2 border-purple-600 pl-3">
                        "{bossProfile.strategy_analysis}"
                    </p>
                </div>
            </div>
          </div>

          {/* Boss Profile Column */}
          <div className="space-y-6">
            <h3 className="text-2xl cinzel text-red-500 border-b border-red-900/30 pb-2">A Sombra Desperta</h3>
            
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-red-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-[#150a25] border border-purple-800 p-6 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                        <div 
                            className="w-20 h-20 rounded shadow-[0_0_15px_currentColor] border-2 border-white/20 flex-shrink-0"
                            style={{ backgroundColor: bossProfile.stats.colorHex, color: bossProfile.stats.colorHex }}
                        ></div>
                        <div>
                            <h2 className="text-3xl font-bold cinzel text-white leading-none mb-1">{bossProfile.name}</h2>
                            <p className="text-red-400 font-serif italic">{bossProfile.title}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-red-900/30 border border-red-800 text-[10px] text-red-200 tracking-wider uppercase">
                                Arquétipo: {bossProfile.archetype}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-gray-300 font-serif text-sm leading-relaxed mb-6 opacity-90">
                        {bossProfile.description}
                    </p>
                    
                    {/* Runes / Tactics */}
                    <div className="grid grid-cols-3 gap-3">
                         <div className="text-center p-2 bg-black/40 border border-purple-900/50 rounded">
                            <div className="text-[10px] uppercase text-purple-400 mb-1">Distância</div>
                            <div className="cinzel text-sm text-white">{bossProfile.tactics.preferredDistance}</div>
                         </div>
                         <div className="text-center p-2 bg-black/40 border border-purple-900/50 rounded">
                            <div className="text-[10px] uppercase text-purple-400 mb-1">Movimento</div>
                            <div className="cinzel text-sm text-white">{bossProfile.tactics.movementStyle}</div>
                         </div>
                         <div className="text-center p-2 bg-black/40 border border-purple-900/50 rounded">
                            <div className="text-[10px] uppercase text-purple-400 mb-1">Postura</div>
                            <div className="cinzel text-sm text-white">{bossProfile.tactics.aggressionLevel}</div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-900/50 p-8 text-center bg-gradient-to-b from-[#1a0b2e]/0 to-black/40">
          <p className="text-2xl cinzel italic text-red-400/90 mb-8 max-w-2xl mx-auto">
            "{bossProfile.dialogue_intro}"
          </p>
          <button 
            onClick={onStartBoss}
            className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-sm transition-all hover:scale-105"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-900 to-purple-900 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 border border-red-500/50"></div>
            <span className="relative z-10 cinzel text-xl font-bold text-white tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">
                ENFRENTAR DESTINO
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTerminal;