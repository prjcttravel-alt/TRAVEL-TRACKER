import { useState, useEffect, useCallback, useRef } from 'react';
import { getEvents, getCategories } from '../api/endpoints';
import API from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Filter, X, ChevronRight, Compass, Wallet, AlertCircle, Clock, Mountain, Utensils, Home, Bus } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-500/20 text-emerald-400',
  Moderate: 'bg-amber-500/20 text-amber-400',
  Hard: 'bg-orange-500/20 text-orange-400',
  Extreme: 'bg-red-500/20 text-red-400',
};

export default function Explore() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  const trackDebounceRef = useRef(null);

  // Track search keywords for admin analytics (debounced 800ms)
  const trackKeyword = useCallback((keyword) => {
    if (trackDebounceRef.current) clearTimeout(trackDebounceRef.current);
    if (!keyword || keyword.trim().length < 2) return;
    trackDebounceRef.current = setTimeout(async () => {
      try {
        await API.post('/search/track', { keyword: keyword.trim() });
      } catch {
        // silently fail — tracking is non-critical
      }
    }, 800);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    trackKeyword(val);
  };

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8df9?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getEvents(), getCategories()])
      .then(([eventRes, catRes]) => {
        // Backend returns { success: true, count: X, data: [...] } for events
        setEvents(eventRes.data?.data || []);
        // Backend returns [...] directly for categories based on previous observation
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
      })
      .catch(err => {
        console.error('Explore fetch error:', err);
        setError('Failed to synchronize with expedition database.');
        toast.error('Connection failed. Retrying...');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = (events || []).filter(e => {
    if (!e) return false;
    const matchesCategory = !selectedCategoryId || 
                            e.category?._id === selectedCategoryId || 
                            e.category === selectedCategoryId;
    const title = e.eventTitle || '';
    const city = e.city || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatBudget = (val) => {
    if (!val) return '0';
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return val.toString();
  };

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
      <AlertCircle className="w-20 h-20 text-red-400 mb-6" />
      <h2 className="text-4xl font-black text-dark-slate mb-4">Sync Error</h2>
      <p className="text-slate-500 max-w-md mb-8">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-travel bg-primary-ocean text-white px-10">Try Again</button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pt-40 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-20">
          <div className="flex items-center space-x-2 text-primary-ocean font-black uppercase tracking-[0.3em] text-[10px] mb-4">
            <Compass className="w-4 h-4" />
            <span>Curated Journeys</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-dark-slate leading-none mb-6">
                Explore <span className="text-primary-ocean italic">Expeditions.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                From high-altitude treks to serene coastal escapes. Discover your next legendary story.
              </p>
            </div>
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-ocean transition-colors" />
              <input 
                type="text" placeholder="Search city, trail, or trek..."
                value={searchQuery} onChange={handleSearchChange}
                className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 ring-primary-ocean/10 transition-all font-medium text-dark-slate"
              />
            </div>
          </div>
        </header>

        {/* Categories Bar */}
        <div className="flex items-center space-x-4 mb-20 overflow-x-auto pb-4 hide-scrollbar">
          <div className="bg-slate-50 p-2 rounded-[2rem] flex items-center shadow-inner">
            <button 
              onClick={() => setSearchParams({})}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedCategoryId ? 'bg-white text-dark-slate shadow-xl' : 'text-slate-400 hover:text-dark-slate'}`}
            >
              All Expeditions
            </button>
            {categories.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setSearchParams({ category: cat._id })}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategoryId === cat._id ? 'bg-white text-dark-slate shadow-xl' : 'text-slate-400 hover:text-dark-slate'}`}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          {loading ? (
            [1,2,3,4,5,6].map(n => (
              <div key={n} className="h-[550px] rounded-[3rem] bg-slate-50 animate-pulse border border-slate-100" />
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full py-40 text-center">
              <div className="text-8xl mb-8">🔭</div>
              <h3 className="text-4xl text-dark-slate mb-4">No Expeditions Found</h3>
              <p className="text-slate-400 font-medium">Try broadening your search or choosing a different category.</p>
            </div>
          ) : filteredEvents.map((e) => (
            <motion.div 
              key={e._id} layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="group flex flex-col h-full bg-white rounded-[4rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Image */}
              <div className="h-[400px] relative overflow-hidden m-4 rounded-[3rem]">
                <img 
                  src={e.eventBanner || FALLBACK_IMAGE} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={e.eventTitle}
                  onError={(ev) => { ev.target.src = FALLBACK_IMAGE }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-slate/90 via-dark-slate/20 to-transparent"></div>
                
                {/* Top Badges */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                  {e.difficulty && (
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${DIFFICULTY_COLORS[e.difficulty] || 'bg-slate-500/20 text-slate-300'}`}>
                      {e.difficulty}
                    </span>
                  )}
                  {e.duration && (
                    <span className="glass px-4 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest border-white/20 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {e.duration}
                    </span>
                  )}
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-primary-sky">
                      <MapPin className="w-3 h-3" />
                      <span>{e.city || 'Regional'}, {e.country || 'India'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      <Wallet className="w-3 h-3" />
                      <span>₹{formatBudget(e.estimatedTravelBudget)}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black leading-tight group-hover:text-primary-sky transition-colors line-clamp-1">{e.eventTitle}</h3>
                </div>
              </div>

              {/* Bottom Content */}
              <div className="px-10 pb-10 pt-4 flex-grow flex flex-col">
                <p className="text-slate-700 font-medium line-clamp-2 mb-6 leading-relaxed">
                  {e.eventDescription}
                </p>
                
                {/* Expenditure chips */}
                {e.expenditure && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {e.expenditure.transport > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-bold">
                        <Bus className="w-3 h-3" /> ₹{formatBudget(e.expenditure.transport)}
                      </span>
                    )}
                    {e.expenditure.accommodation > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[9px] font-bold">
                        <Home className="w-3 h-3" /> ₹{formatBudget(e.expenditure.accommodation)}
                      </span>
                    )}
                    {e.expenditure.food > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-[9px] font-bold">
                        <Utensils className="w-3 h-3" /> ₹{formatBudget(e.expenditure.food)}
                      </span>
                    )}
                    {e.expenditure.activities > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-bold">
                        <Mountain className="w-3 h-3" /> ₹{formatBudget(e.expenditure.activities)}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unlimited Slots</span>
                  </div>
                  <Link 
                    to={`/events/${e._id}`}
                    className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-primary-ocean hover:text-dark-slate transition-colors group/btn"
                  >
                    <span>View Plan</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
