import React from 'react';

interface GeminiVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number; // 0 to 100
  onClick?: () => void;
  avatarUrl?: string;
  personaName?: string;
}

export const GeminiVoiceOrb: React.FC<GeminiVoiceOrbProps> = ({
  status,
  audioLevel,
  onClick,
  avatarUrl,
  personaName,
}) => {
  // Scale calculations based on mic volume or speaking state
  const dynamicScale = Math.min(1.4, 1 + audioLevel / 180);
  const ringScale = Math.min(1.7, 1 + audioLevel / 120);

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Outer Glow Halo */}
      <div
        className={`absolute rounded-full transition-all duration-300 blur-2xl pointer-events-none ${
          status === 'listening'
            ? 'w-48 h-48 bg-gradient-to-tr from-purple-500/40 via-indigo-500/40 to-pink-500/40'
            : status === 'thinking'
            ? 'w-52 h-52 bg-gradient-to-tr from-blue-500/50 via-teal-400/40 to-purple-600/40 animate-spin'
            : status === 'speaking'
            ? 'w-56 h-56 bg-gradient-to-tr from-violet-500/50 via-pink-500/50 to-amber-400/40'
            : 'w-36 h-36 bg-purple-500/10'
        }`}
        style={{
          transform: `scale(${status === 'listening' || status === 'speaking' ? dynamicScale : 1})`,
        }}
      />

      {/* Dynamic Animated Pulse Rings */}
      {(status === 'listening' || status === 'speaking') && (
        <>
          <div
            className="absolute w-36 h-36 rounded-full border-2 border-purple-400/40 animate-ping pointer-events-none"
            style={{ animationDuration: '2.4s' }}
          />
          <div
            className="absolute w-44 h-44 rounded-full border border-pink-400/30 transition-transform duration-100 pointer-events-none"
            style={{ transform: `scale(${ringScale})` }}
          />
        </>
      )}

      {/* Central Interactive Orb Button */}
      <button
        type="button"
        onClick={onClick}
        className="relative z-10 group cursor-pointer focus:outline-none transition-transform active:scale-95"
      >
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 transition-all duration-300 shadow-xl ${
            status === 'listening'
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 ring-4 ring-purple-300/60'
              : status === 'thinking'
              ? 'bg-gradient-to-tr from-blue-500 via-teal-400 to-purple-600 ring-4 ring-cyan-300/60 animate-pulse'
              : status === 'speaking'
              ? 'bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-500 ring-4 ring-pink-300/60'
              : 'bg-gradient-to-tr from-slate-700 via-purple-900 to-slate-800 ring-2 ring-purple-200'
          }`}
          style={{
            transform: `scale(${status === 'listening' || status === 'speaking' ? dynamicScale : 1})`,
          }}
        >
          {/* Internal Persona Avatar Container */}
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={personaName || 'Persona'}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-tr from-purple-700 to-indigo-600">
                🎙️
              </div>
            )}

            {/* Overlay status animation */}
            {status === 'thinking' && (
              <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {status === 'speaking' && (
              <div className="absolute inset-x-0 bottom-0 py-1 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-1">
                <span className="w-1 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Realtime Status Label */}
      <div className="mt-4 flex flex-col items-center">
        <div
          className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-xs transition-colors ${
            status === 'listening'
              ? 'bg-purple-100 text-purple-900 border border-purple-300'
              : status === 'thinking'
              ? 'bg-blue-100 text-blue-900 border border-blue-300'
              : status === 'speaking'
              ? 'bg-pink-100 text-pink-900 border border-pink-300'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'listening'
                ? 'bg-red-500 animate-ping'
                : status === 'thinking'
                ? 'bg-blue-500 animate-pulse'
                : status === 'speaking'
                ? 'bg-pink-500 animate-bounce'
                : 'bg-slate-400'
            }`}
          />
          <span>
            {status === 'listening'
              ? 'तुमचा आवाज ऐकत आहे...'
              : status === 'thinking'
              ? 'विचार करत आहे...'
              : status === 'speaking'
              ? `${personaName || 'कंपॅनियन'} बोलत आहे...`
              : 'मायक्रोफोन टॅप करा किंवा हाक द्या'}
          </span>
        </div>

        {/* Live Audio Level dB bar when listening */}
        {status === 'listening' && (
          <div className="w-36 mt-2 flex items-center gap-1">
            <span className="text-[10px] text-purple-700 font-mono">आवाज:</span>
            <div className="flex-1 bg-purple-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-75"
                style={{ width: `${Math.max(8, audioLevel)}%` }}
              />
            </div>
            <span className="text-[10px] text-purple-700 font-mono">{audioLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
