
import React, { useState, useEffect, useRef } from 'react';
import { Music, Home, Heart, History as HistoryIcon, Sparkles, Loader2, Play, Share2, PlusCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { MOODS } from './constants';
import { Song, AppState, MoodConfig } from './types';
import { interpretMood, getSongsByMoodId } from './services/geminiService';

// --- Utilities ---

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// --- Sub-components ---

const Navbar: React.FC<{ activeState: AppState; setActiveState: (s: AppState) => void }> = ({ activeState, setActiveState }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-md">
    <div 
      className="flex items-center gap-2 cursor-pointer group"
      onClick={() => setActiveState(AppState.HOME)}
    >
      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform">
        <Music size={20} fill="currentColor" />
      </div>
      <span className="text-xl font-bold tracking-tight">Moody</span>
    </div>
    
    <div className="flex items-center gap-6">
      <button 
        onClick={() => setActiveState(AppState.HOME)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${activeState === AppState.HOME ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
      >
        <Home size={18} />
        <span className="text-sm font-medium">Home</span>
      </button>
      <button 
        onClick={() => setActiveState(AppState.FAVORITES)}
        className={`flex items-center gap-2 transition-all ${activeState === AppState.FAVORITES ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
      >
        <Heart size={18} />
        <span className="text-sm font-medium">Favorites</span>
      </button>
      <button 
        onClick={() => setActiveState(AppState.HISTORY)}
        className={`flex items-center gap-2 transition-all ${activeState === AppState.HISTORY ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
      >
        <HistoryIcon size={18} />
        <span className="text-sm font-medium">History</span>
      </button>
    </div>
  </nav>
);

const Player: React.FC<{ song: Song | null }> = ({ song }) => {
  const [showFallback, setShowFallback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setShowFallback(false);
  }, [song]);

  if (!song) return null;
  const videoId = getYoutubeId(song.youtubeUrl || song.youtubeQuery || '');
  
  if (!videoId || showFallback) {
    return (
      <div className="relative aspect-video w-full rounded-2xl flex flex-col items-center justify-center bg-zinc-900 border border-white/5 text-gray-400 p-8 text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
          <Music size={32} />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-white text-xl">{song.title}</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">This track has restricted embedding. To play this music, please visit YouTube directly.</p>
        </div>
        <a 
          href={song.youtubeUrl || song.youtubeQuery} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-cyan-500 text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Open on YouTube <ExternalLink size={18} />
        </a>
        <button 
          onClick={() => setShowFallback(false)}
          className="text-xs text-gray-600 hover:text-gray-400"
        >
          Try loading again
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl group">
      <iframe
        key={videoId}
        ref={iframeRef}
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
        title={song.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setShowFallback(true)}
          className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 hover:bg-red-500/80 transition-colors"
        >
          <AlertCircle size={12} /> Playback Error?
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [activeState, setActiveState] = useState<AppState>(AppState.HOME);
  const [currentMood, setCurrentMood] = useState<MoodConfig | null>(null);
  const [customMood, setCustomMood] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('moody_favorites');
    const savedHistory = localStorage.getItem('moody_history');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleMoodSelect = async (mood: MoodConfig) => {
    setIsLoading(true);
    setCurrentMood(mood);
    setActiveState(AppState.PLAYLIST);
    const recommendedSongs = await getSongsByMoodId(mood.id);
    setSongs(recommendedSongs);
    setCurrentSongIndex(0);
    setIsLoading(false);
    if (recommendedSongs.length > 0) addToHistory(recommendedSongs[0]);
  };

  const handleCustomMoodSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customMood.trim()) return;
    setIsLoading(true);
    setCurrentMood({ 
      id: 'custom', 
      name: 'Custom', 
      icon: '✨', 
      description: customMood, 
      color: 'from-cyan-500 to-blue-600' 
    });
    setActiveState(AppState.PLAYLIST);
    const recommendedSongs = await interpretMood(customMood);
    setSongs(recommendedSongs);
    setCurrentSongIndex(0);
    setIsLoading(false);
    if (recommendedSongs.length > 0) addToHistory(recommendedSongs[0]);
  };

  const addToHistory = (song: Song) => {
    setHistory(prev => {
      const filtered = prev.filter(s => s.youtubeQuery !== song.youtubeQuery);
      const newHistory = [song, ...filtered].slice(0, 20);
      localStorage.setItem('moody_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const toggleFavorite = (song: Song) => {
    setFavorites(prev => {
      const isFav = prev.find(s => s.youtubeQuery === song.youtubeQuery);
      let newFavs;
      if (isFav) {
        newFavs = prev.filter(s => s.youtubeQuery !== song.youtubeQuery);
      } else {
        newFavs = [song, ...prev];
      }
      localStorage.setItem('moody_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (song: Song) => favorites.some(s => s.youtubeQuery === song.youtubeQuery);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#050505]">
      <Navbar activeState={activeState} setActiveState={setActiveState} />

      {activeState === AppState.HOME && (
        <main className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              Music for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 neon-text">Soul</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
              AI-powered music recommendations matched to your mood.
            </p>
          </div>

          <section className="max-w-2xl mx-auto">
            <div className="glass p-8 rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={64} className="text-cyan-400" />
              </div>
              <form onSubmit={handleCustomMoodSubmit} className="space-y-4 relative z-10">
                <input 
                  type="text"
                  value={customMood}
                  onChange={(e) => setCustomMood(e.target.value)}
                  placeholder="Tell Moody how you're feeling..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-lg"
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'GET RECOMMENDATIONS'}
                </button>
              </form>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood)}
                className="glass group p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all text-left flex items-start gap-4"
              >
                <div className="text-4xl">{mood.icon}</div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">{mood.name}</h3>
                  <p className="text-sm text-gray-500">{mood.description}</p>
                </div>
              </button>
            ))}
          </section>
        </main>
      )}

      {activeState === AppState.PLAYLIST && (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-bottom-8 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-extrabold">
                <span className="text-cyan-400 neon-text">{currentMood?.name}</span> Mood
              </h2>
              {!isLoading && (
                <button 
                  onClick={() => currentMood?.id === 'custom' ? handleCustomMoodSubmit() : handleMoodSelect(currentMood!)}
                  className="text-gray-500 hover:text-cyan-400 flex items-center gap-2 text-sm transition-colors"
                >
                  <RefreshCw size={14} /> Refresh Mix
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-cyan-400" size={48} />
                <p className="text-gray-400 animate-pulse">Finding the perfect songs for you...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="glass p-1 rounded-3xl overflow-hidden neon-border bg-black">
                  <Player song={songs[currentSongIndex]} />
                </div>
                
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{songs[currentSongIndex]?.title}</h3>
                    <p className="text-gray-400 text-lg">{songs[currentSongIndex]?.artist}</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                      onClick={() => toggleFavorite(songs[currentSongIndex])}
                      className={`p-4 rounded-full transition-all ${isFavorite(songs[currentSongIndex]) ? 'bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Heart size={28} fill={isFavorite(songs[currentSongIndex]) ? 'currentColor' : 'none'} />
                    </button>
                    <a 
                      href={songs[currentSongIndex]?.youtubeUrl || songs[currentSongIndex]?.youtubeQuery}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-white/5 text-gray-400 hover:text-cyan-400 rounded-full transition-all"
                    >
                      <ExternalLink size={28} />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                     <PlusCircle size={20} /> Save Playlist
                   </button>
                   <button className="flex-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                     <Share2 size={20} /> Share
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-400">
              <Play size={20} className="text-cyan-400" /> Up Next
            </h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {songs.map((song, idx) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setCurrentSongIndex(idx);
                    addToHistory(song);
                  }}
                  className={`w-full group glass p-4 rounded-xl flex items-center gap-4 transition-all border border-transparent ${currentSongIndex === idx ? 'border-cyan-500/50 bg-cyan-500/10' : 'hover:border-white/10 hover:bg-white/5'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${currentSongIndex === idx ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-gray-500'}`}>
                    {currentSongIndex === idx ? <Play size={16} fill="currentColor" /> : idx + 1}
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <h4 className={`font-bold truncate ${currentSongIndex === idx ? 'text-cyan-400' : 'text-white'}`}>{song.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                  </div>
                  {isFavorite(song) && <Heart size={14} className="text-red-500" fill="currentColor" />}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {(activeState === AppState.FAVORITES || activeState === AppState.HISTORY) && (
        <main className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
           <div className="space-y-2">
              <h2 className="text-4xl font-extrabold flex items-center gap-3">
                {activeState === AppState.FAVORITES ? <Heart className="text-red-500" /> : <HistoryIcon className="text-cyan-400" />}
                {activeState === AppState.FAVORITES ? 'Favorites' : 'Recent History'}
              </h2>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {(activeState === AppState.FAVORITES ? favorites : history).length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
                  <p className="text-gray-500 text-lg">Your list is currently empty.</p>
                  <button onClick={() => setActiveState(AppState.HOME)} className="mt-4 text-cyan-400 hover:underline">Discover new music</button>
                </div>
              ) : (
                (activeState === AppState.FAVORITES ? favorites : history).map((song) => (
                  <div 
                    key={song.id + Math.random()} 
                    className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-cyan-400">
                        <Music size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{song.title}</h4>
                        <p className="text-sm text-gray-500">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSongs([song]);
                          setCurrentSongIndex(0);
                          setActiveState(AppState.PLAYLIST);
                          setCurrentMood({ id: 'rec', name: 'Saved', icon: '💿', description: '', color: '' });
                        }}
                        className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-black transition-all"
                      >
                        <Play size={20} />
                      </button>
                      <button 
                        onClick={() => toggleFavorite(song)}
                        className={`p-3 rounded-lg transition-all ${isFavorite(song) ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-500 hover:bg-white/10'}`}
                      >
                        <Heart size={20} fill={isFavorite(song) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </main>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="glass px-4 py-2 rounded-full border border-white/5 text-[10px] text-gray-500 pointer-events-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Systems Active
          </div>
        </div>
      </footer>
    </div>
  );
}
