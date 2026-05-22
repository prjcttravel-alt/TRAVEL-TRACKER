import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, bookEvent } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, Shield, Heart, Share2, ChevronLeft, Star, Info, CheckCircle, Compass, ArrowRight, Wallet, Banknote, Bus, Home, Utensils, Mountain, Ticket, Package, X as XIcon, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Extreme: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const EXPENDITURE_CONFIG = [
  { key: 'transport', label: 'Transport', icon: Bus, color: 'bg-blue-500', barColor: 'bg-blue-400' },
  { key: 'accommodation', label: 'Stay', icon: Home, color: 'bg-purple-500', barColor: 'bg-purple-400' },
  { key: 'food', label: 'Food', icon: Utensils, color: 'bg-orange-500', barColor: 'bg-orange-400' },
  { key: 'activities', label: 'Activities', icon: Mountain, color: 'bg-emerald-500', barColor: 'bg-emerald-400' },
  { key: 'permits', label: 'Permits', icon: Ticket, color: 'bg-pink-500', barColor: 'bg-pink-400' },
  { key: 'miscellaneous', label: 'Misc', icon: Package, color: 'bg-slate-500', barColor: 'bg-slate-400' },
];

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [tickets, setTickets] = useState(1);
  const [activeTab, setActiveTab] = useState('highlights');

  useEffect(() => {
    getEvent(id)
      .then(res => setEvent(res.data?.data || res.data))
      .catch(() => toast.error('Trip not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async () => {
    if (!user) return toast.error('Please login first');
    try {
      const res = await bookEvent({ eventId: id, tickets });
      if (res.data.success) {
        toast.success('Expedition Booked! Pay fee in cash at venue.');
      } else {
        toast.error(res.data.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking Error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-dark-slate">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-5xl">✈️</motion.div>
    </div>
  );

  if (!event) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <p className="text-2xl font-black text-dark-slate mb-4">Expedition not found</p>
      <Link to="/explore" className="btn-travel bg-primary-ocean text-white">Back to Explore</Link>
    </div>
  );

  const exp = event.expenditure || {};
  const totalExp = Object.values(exp).reduce((a, b) => a + (b || 0), 0);
  const maxExp = Math.max(...Object.values(exp).map(v => v || 0), 1);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }}
          src={event.eventBanner || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8df9?auto=format&fit=crop&w=1200&q=80'} 
          className="w-full h-full object-cover" alt={event.eventTitle}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8df9?auto=format&fit=crop&w=1200&q=80' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-slate via-dark-slate/20 to-transparent"></div>
        
        <div className="absolute inset-0 flex items-end pb-20 px-4 md:px-10">
          <div className="max-w-7xl mx-auto w-full">
            <Link to="/explore" className="flex items-center space-x-2 text-white/80 hover:text-white mb-10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Expeditions</span>
            </Link>
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-primary-ocean px-5 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                  {event.category?.categoryName || 'Adventure'}
                </span>
                {event.difficulty && (
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${DIFFICULTY_COLORS[event.difficulty] || ''}`}>
                    {event.difficulty}
                  </span>
                )}
                {event.duration && (
                  <span className="glass px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border-white/20 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {event.duration}
                  </span>
                )}
                <div className="flex items-center space-x-1 text-accent-sunset">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-black text-xs">4.9 (124 reviews)</span>
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8">
                {event.eventTitle}
              </motion.h1>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-8 text-white/90">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-primary-sky" />
                  <span className="font-black text-sm uppercase tracking-widest">{event.city}, {event.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-primary-sky" />
                  <span className="font-black text-sm uppercase tracking-widest">{new Date(event.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-primary-sky" />
                  <span className="font-black text-sm uppercase tracking-widest">Unlimited Slots</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-10 py-32 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-8">
          {/* About */}
          <div className="prose prose-xl mb-20 max-w-none">
            <h2 className="text-4xl font-black text-dark-slate mb-8">About the <span className="text-primary-ocean italic">Expedition.</span></h2>
            <p className="text-slate-800 text-xl font-medium leading-relaxed">{event.eventDescription}</p>
          </div>

          {/* Pricing & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-primary-ocean/10 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary-ocean" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Est. Budget</h4>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-dark-slate">₹{(event.estimatedTravelBudget || 0).toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ Person</span>
              </div>
              <p className="mt-4 text-sm text-slate-700 font-medium">Includes travel, stay, and basic meals.</p>
            </div>
            <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 shadow-xl shadow-emerald-100/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Gateway: CASH ONLY</h4>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-emerald-700">₹{(event.suggestedDonation || 0).toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Booking Fee</span>
              </div>
              <p className="mt-4 text-xs text-emerald-600 font-medium font-bold uppercase tracking-widest">Pay on Arrival at Base Camp</p>
            </div>
          </div>

          {/* Expenditure Breakdown */}
          {totalExp > 0 && (
            <div className="mb-20">
              <h3 className="text-3xl font-black text-dark-slate mb-2">Expenditure <span className="text-primary-ocean italic">Breakdown.</span></h3>
              <p className="text-slate-600 text-lg font-medium mb-10">Where your money goes — full cost transparency.</p>
              
              <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                <div className="space-y-6">
                  {EXPENDITURE_CONFIG.map(({ key, label, icon: Icon, barColor }, idx) => {
                    const val = exp[key] || 0;
                    if (val === 0) return null;
                    const pct = Math.round((val / totalExp) * 100);
                    const barWidth = Math.round((val / maxExp) * 100);
                    return (
                      <motion.div key={key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${barColor} bg-opacity-20 flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-dark-slate" />
                            </div>
                            <span className="text-sm font-black text-dark-slate">{label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-dark-slate">₹{val.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-lg">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Expenditure</span>
                  <span className="text-2xl font-black text-dark-slate">₹{totalExp.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {event.eventGallery && event.eventGallery.length > 0 && (
            <div className="mb-20">
              <h3 className="text-3xl font-black text-dark-slate mb-8">Expedition <span className="text-primary-ocean italic">Gallery.</span></h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.eventGallery.map((img, i) => (
                  <motion.div 
                    key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="aspect-square rounded-[2rem] overflow-hidden group cursor-pointer border border-slate-100"
                  >
                    <img src={img} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt="Gallery" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' }} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Organizer */}
          {event.organizerName && (
            <div className="mb-20 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <img src={event.organizerLogo || 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&w=200&q=80'} 
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg" 
                  alt="Organizer" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&w=200&q=80' }} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Organized By</h4>
                  <p className="text-xl font-black text-dark-slate">{event.organizerName}</p>
                </div>
              </div>
              <Link to="/community" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-ocean hover:underline">
                View Profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-20">
            <div className="flex space-x-8 border-b border-slate-100 mb-10 overflow-x-auto pb-4 hide-scrollbar">
              {['highlights', 'inclusions', 'exclusions', 'reviews'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`text-xs font-black uppercase tracking-widest pb-4 transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary-ocean' : 'text-slate-400'}`}>
                  {tab}
                  {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-ocean rounded-full" />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                {activeTab === 'highlights' && (
                  (event.highlights && event.highlights.length > 0) ? event.highlights.map((h, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-primary-ocean/5 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary-ocean/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-ocean" />
                      </div>
                      <p className="text-slate-700 font-semibold pt-2">{h}</p>
                    </motion.div>
                  )) : <p className="text-slate-400">No highlights listed for this expedition.</p>
                )}
                {activeTab === 'inclusions' && (
                  (event.inclusions && event.inclusions.length > 0) ? event.inclusions.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <p className="text-emerald-800 font-semibold">{item}</p>
                    </motion.div>
                  )) : <p className="text-slate-400">No inclusions listed.</p>
                )}
                {activeTab === 'exclusions' && (
                  (event.exclusions && event.exclusions.length > 0) ? event.exclusions.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100">
                      <XIcon className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-red-700 font-semibold">{item}</p>
                    </motion.div>
                  )) : <p className="text-slate-400">No exclusions listed.</p>
                )}
                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    {event.reviews?.length > 0 ? event.reviews.map((rev, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center space-x-4">
                            <img src={rev.user?.profileImage || 'https://i.pravatar.cc/100?u=' + rev.user?._id} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                            <div>
                              <p className="font-black text-dark-slate">{rev.user?.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-accent-sunset">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-black text-xs">{rev.rating}.0</span>
                          </div>
                        </div>
                        <p className="text-slate-600 font-medium italic">"{rev.comment}"</p>
                      </div>
                    )) : (
                      <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No explorer reviews yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-dark-slate rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-ocean/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-2xl font-black mb-10">Secure Your Slot</h3>
            <div className="space-y-8 mb-12">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Price</span>
                <span className="text-3xl font-black">₹{((event.suggestedDonation || 0) * tickets).toLocaleString()}</span>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Number of Explorers</label>
                <div className="flex items-center bg-white/5 rounded-2xl p-2 border border-white/10">
                  <button onClick={() => setTickets(Math.max(1, tickets-1))} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors">-</button>
                  <span className="flex-grow text-center font-black">{tickets}</span>
                  <button onClick={() => setTickets(tickets+1)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors">+</button>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-sky/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-sky" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  <p className="text-white">Travel Guarantee</p>
                  <p className="text-slate-400">Secure & Reliable</p>
                </div>
              </div>
            </div>
            <button onClick={handleBooking}
              className="w-full py-6 bg-primary-ocean text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-primary-sky transition-all shadow-xl shadow-primary-ocean/40 active:scale-95 flex items-center justify-center space-x-3">
              <span>Join Expedition</span>
              <Compass className="w-5 h-5" />
            </button>
            <p className="text-center mt-8 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Pay ₹{((event.suggestedDonation || 0) * tickets).toLocaleString()} CASH at Basecamp
            </p>
          </div>

          <div className="mt-12 glass p-10 rounded-[3rem] border border-white flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-100">
                <Heart className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Save for Later</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>
    </div>
  );
}
