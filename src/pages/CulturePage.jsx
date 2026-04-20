import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Search, MapPin, Calendar, Users, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Emojis kept EXACTLY as original
const TYPE_EMOJI = {
  "Festival": "🎉", "Tradition": "🏮", "Ritual": "🙏", "Performing Arts": "🎭",
  "Craftsmanship": "🧺", "Culinary Heritage": "🍲", "Other": "✨"
};

const ENDANGERED_COLORS = {
  "Thriving": "text-green-400 bg-green-500/10 border-green-500/20",
  "Stable": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Vulnerable": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "Endangered": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Critically Endangered": "text-red-400 bg-red-500/10 border-red-500/20",
  "Extinct": "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

export default function CulturePage() {
  const [practices, setPractices] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchPractices();
  }, []);

  const fetchPractices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setPractices(data);
    setLoading(false);
  };

  const filtered = practices.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.town?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.category === typeFilter; 
    return matchSearch && matchType;
  });

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-border bg-card shadow-lg z-10`}>
        <div className="p-6 border-b border-border bg-muted/30">
          <h1 className="font-playfair text-2xl font-bold tracking-tight">Cultural Heritage</h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Intangible Treasures of Bohol</p>
        </div>

        <div className="p-4 border-b border-border space-y-3 bg-card">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search traditions..."
              className="pl-9 bg-muted/50 border-border focus:bg-background transition-all"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full bg-muted/50 border-border h-9">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Heritage Types</SelectItem>
              {Object.keys(TYPE_EMOJI).map(t => (
                <SelectItem key={t} value={t}>{TYPE_EMOJI[t]} {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{filtered.length} entries found</p>
            {loading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filtered.length === 0 && !loading ? (
            <div className="p-10 text-center opacity-40">
              <Search className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No practices found</p>
            </div>
          ) : (
            filtered.map(practice => (
              <button
                key={practice.id}
                onClick={() => setSelected(practice)}
                className={`w-full text-left p-5 border-b border-border hover:bg-muted/40 transition-all ${selected?.id === practice.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl bg-muted rounded-xl p-2 h-14 w-14 flex items-center justify-center shadow-inner">
                    {TYPE_EMOJI[practice.category] || "✨"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground leading-tight truncate">{practice.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 font-medium">
                      <MapPin className="w-3 h-3 text-primary" /> {practice.town}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[9px] font-black uppercase bg-secondary px-1.5 py-0.5 rounded tracking-tighter">
                        {practice.category}
                      </span>
                      {practice.endangered_status && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border tracking-tighter ${ENDANGERED_COLORS[practice.endangered_status]}`}>
                          {practice.endangered_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Detail View */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-background animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="relative h-[40vh] min-h-[300px]">
            {selected.image_url ? (
              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-muted to-primary/10 flex items-center justify-center">
                <span className="text-[120px] opacity-20">{TYPE_EMOJI[selected.category]}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            <button 
              onClick={() => setSelected(null)} 
              className="absolute top-6 left-6 z-20 bg-background/80 hover:bg-background backdrop-blur-md rounded-full px-4 py-2 text-xs font-bold border border-border transition-all md:hidden"
            >
              ← Back to List
            </button>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black uppercase rounded">
                  {selected.category}
                </div>
              </div>
              <h2 className="font-playfair text-5xl font-black text-foreground">{selected.name}</h2>
              <div className="flex items-center gap-4 mt-3">
                 <p className="text-sm font-bold flex items-center gap-1.5 text-primary">
                    <MapPin className="w-4 h-4" /> {selected.town}, Bohol
                 </p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl p-8 space-y-10">
            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {selected.endangered_status && (
                <div className={`p-4 rounded-2xl border ${ENDANGERED_COLORS[selected.endangered_status]}`}>
                  <p className="text-[10px] uppercase font-black opacity-70 mb-1">Conservation Status</p>
                  <p className="text-sm font-bold">{selected.endangered_status}</p>
                </div>
              )}
              {selected.schedule && (
                <div className="p-4 rounded-2xl border border-border bg-card">
                   <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Schedule / Frequency</p>
                   <p className="text-sm font-bold flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-primary" /> {selected.schedule}
                   </p>
                </div>
              )}
            </div>

            {/* Content Sections */}
            <section>
               <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Description & Significance</h3>
               <p className="text-lg text-foreground/80 leading-relaxed font-serif italic">
                 {selected.description || "No description available for this practice."}
               </p>
            </section>

            {selected.practitioners && (
              <div className="flex items-center gap-5 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-primary/60">Community Practitioners</p>
                  <p className="text-sm font-bold text-foreground">{selected.practitioners}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/10">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-border">
              <Music className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-xl font-playfair font-bold text-foreground">Select a Tradition</p>
              <p className="text-sm text-muted-foreground">Explore the intangible heritage of our community</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}