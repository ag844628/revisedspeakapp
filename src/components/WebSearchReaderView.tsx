import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Volume2, 
  Square, 
  Play, 
  Pause, 
  ExternalLink, 
  Sparkles, 
  BookOpen,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { Profile, SearchResultItem } from '../types';

interface WebSearchReaderViewProps {
  activeProfile: Profile;
  onReadAloud: (text: string, rate: number) => void;
  onStopReading: () => void;
  isReading: boolean;
}

export const WebSearchReaderView: React.FC<WebSearchReaderViewProps> = ({
  activeProfile,
  onReadAloud,
  onStopReading,
  isReading,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<SearchResultItem | null>(null);
  const [readingSpeed, setReadingSpeed] = useState<number>(1.0);

  const sampleSearches = [
    'महाराष्ट्रातील आजचे हवामान अंदाज',
    'राज्य आणि देशातील ताज्या मुख्य बातम्या',
    'क्रिकेट विश्वचषक व ताज्या मॅचेस निकाल',
    'शेतकऱ्यांसाठी नवीन शासकीय योजना',
    'आरोग्यदायी आहाराचे नियम व टिप्स',
  ];

  const handleExecuteSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setQuery(searchQuery);

    try {
      const response = await fetch('/api/assistant/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data: SearchResultItem = await response.json();
      setCurrentResult(data);

      // Automatically read summary if desired
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-5 rounded-3xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-xs">
            <Globe className="w-6 h-6 text-blue-200 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold">इंटरनेट वेब शोध व वाचन (Web Search & Read)</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              इंटरनेटवरील कोणतीही ताजी माहिती शोधा आणि ती तुमच्या कंपॅनियनच्या आवाजात मोठ्याने ऐका.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSearch(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="उदा. आजचे हवामान, ताज्या बातम्या, शेती योजना..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-purple-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-95 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? 'शोधत आहे...' : 'शोधा'}</span>
          </button>
        </form>

        {/* Quick Sample Search Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0">सुचवलेले:</span>
          {sampleSearches.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExecuteSearch(s)}
              className="px-3 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-900 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reading Speed & Voice Controls */}
      <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={activeProfile.avatarUrl} alt={activeProfile.name} className="w-8 h-8 rounded-full object-cover" />
          <div>
            <span className="text-xs font-bold text-purple-950 block">{activeProfile.name} चा आवाज</span>
            <span className="text-[10px] text-purple-700">वाचून दाखवण्यासाठी वापरला जाईल</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 font-semibold">गती (Speed):</span>
          {[0.8, 1.0, 1.2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setReadingSpeed(spd)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                readingSpeed === spd
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Search Result & Reading Card */}
      {currentResult && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                वेब शोध निकाल (Live Web Grounding)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                "{currentResult.query}"
              </h3>
            </div>

            {/* Read Aloud Button */}
            <div className="flex items-center gap-2">
              {isReading ? (
                <button
                  type="button"
                  onClick={onStopReading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>वाचन थांबवा (Stop)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReadAloud(currentResult.summary, readingSpeed)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>मोठ्याने वाचून दाखवा (Read Aloud)</span>
                </button>
              )}
            </div>
          </div>

          {/* Reading Wave Visualizer Indicator */}
          {isReading && (
            <div className="bg-purple-100/70 p-3 rounded-2xl flex items-center justify-center gap-1.5 border border-purple-200">
              <span className="text-xs font-semibold text-purple-900 mr-2 flex items-center gap-1">
                <Volume2 className="w-4 h-4 text-purple-700" />
                <span>वाचून दाखवत आहे:</span>
              </span>
              <span className="w-1 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-6 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
          )}

          {/* Formatted Content */}
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
            {currentResult.summary}
          </div>

          {/* Grounding Sources */}
          {currentResult.sources && currentResult.sources.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                वेब संदर्भ स्रोत (Sources & References):
              </span>
              <div className="flex flex-wrap gap-2">
                {currentResult.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-purple-900 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-200"
                  >
                    <span className="line-clamp-1 max-w-[200px]">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
