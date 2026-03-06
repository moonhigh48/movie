'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/movie?keyword=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      alert("검색 중 에러 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any) => {
    setSavingId(item.id);
    try {
      const res = await fetch('/api/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        setDoneId(item.id);
        setTimeout(() => setDoneId(null), 3000);
      }
      else alert("저장 실패");
    } catch (error) {
      alert("서버 통신 에러");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="p-4 max-w-[420px] mx-auto min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="mb-8 border-t-[12px] border-b-[12px] border-white bg-black p-5 text-center shadow-2xl relative">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">Scene Finder</h2>
        <div className="mt-3 flex justify-between text-[11px] font-mono font-bold text-gray-600 border-t border-gray-900 pt-2">
          <span>ROLL: MULTI</span>
          <span>PROD: WVEAD</span>
        </div>
      </div>
      
      <div className="flex gap-2 mb-10 border-2 border-white p-1.5 rounded-sm bg-black">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="TITLE / SERIES..."
          className="flex-1 px-3 py-2 bg-transparent outline-none text-sm font-mono uppercase"
        />
        <button onClick={handleSearch} className="px-5 py-2 bg-white text-black font-black text-sm hover:bg-yellow-400">
          {loading ? '...' : 'ACTION!'}
        </button>
      </div>

      <div className="space-y-10">
        {results.map((item:any) => (
          <div key={item.id} className="flex gap-4 border-b border-gray-900 pb-8 group relative">
            <span className="absolute -top-3 right-0 text-[10px] font-black bg-white text-black px-2 py-0.5 uppercase z-10">
              {item.media_type === 'tv' ? 'TV' : 'Movie'}
            </span>

            {/* 포스터 */}
            <div className="w-[85px] h-[125px] bg-gray-900 flex-shrink-0 border border-gray-800 overflow-hidden shadow-lg self-start">
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300'} 
                alt="poster" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            
            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg truncate uppercase text-white">
                {item.title || item.name}
              </h3>
              <p className="text-[11px] text-gray-500 font-mono font-bold">
                {(item.release_date || item.first_air_date)?.split('-')[0]} / ★ {item.vote_average?.toFixed(1)}
              </p>
              
              {/* 줄거리 영역 (호버 시 펼쳐짐) */}
              <div className="mt-3 relative">
                <p className="text-[11px] text-gray-400 leading-relaxed font-light italic transition-all duration-300
                  line-clamp-2 hover:line-clamp-none">
                  {item.overview || "No description available."}
                </p>
              </div>
              
              <button 
                onClick={() => handleSave(item)}
                disabled={savingId === item.id || doneId === item.id}
                className={`mt-3 px-3 py-1 text-[10px] font-black border-2 transition-all uppercase tracking-tighter w-[110px] text-center
                  ${doneId === item.id 
                    ? 'bg-black border-white text-white' 
                    : savingId === item.id 
                      ? 'bg-gray-800 border-gray-800 text-gray-500' 
                      : 'border-white text-white hover:bg-yellow-400 hover:text-black hover:border-yellow-400'}`}
              >
                {doneId === item.id 
                  ? '✓ Saved' 
                  : savingId === item.id 
                    ? 'Saving...' 
                    : 'Save to Notion'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
