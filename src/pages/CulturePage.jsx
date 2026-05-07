import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/api/supabaseClient"; 
import { Search, MapPin, Calendar, Users, Music, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const fetchPractices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cultural_practices')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPractices(data || []);
    } catch (err) {
      console.error("Failed to load cultural practices:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPractices();
  }, [fetchPractices]);

  // FIXED: Now mapping specifically to the 'type' column
  const filtered = useMemo(() => {
    return practices.filter(p => {
      const matchSearch = !search || 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.town?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || p.type === typeFilter; 
      return matchSearch && matchType;
    });
  }, [practices, search, typeFilter]);

  // FIXED: Generating filter from 'type' column
  const availableTypes = useMemo(() => 
    [...new Set(practices.map(p => p.type).filter(Boolean))], 
    [practices]
  );

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-border bg-card shadow-lg z-10`}>
        <div className="p-6 border-b border-border bg-muted/30">
          <h1 className="font-playfair text-2xl font-bold tracking-tight text-foreground">Cultural Heritage</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Intangible Treasures of Bohol</p>
        </div>

        <div className="p-4 border-b border-border space-y-3 bg-card">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search traditions or towns..."
              className="pl-9 bg-muted/50 border-border focus:bg-background transition-all text-xs h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full bg-muted/50 border-border h-8 text-[10px] font-bold uppercase">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Heritage Types</SelectItem>
              {availableTypes.map(t => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TYPE_EMOJI[t] || "✨"} {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">
            {filtered.length} documented practice{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Accessing Archives...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center opacity-40">
              <Search className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm font-bold">No practices found</p>
            </div>
          ) : (
            filtered.map(practice => (
              <button
                key={practice.id}
                onClick={() => setSelected(practice)}
                className={`w-full text-left p-5 border-b border-border hover:bg-muted/40 transition-all ${
                  selected?.id === practice.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl bg-muted rounded-lg p-2 h-12 w-12 flex items-center justify-center shadow-inner flex-shrink-0">
                    {TYPE_EMOJI[practice.type] || "✨"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-foreground leading-tight truncate uppercase tracking-tighter">
                      {practice.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tight">
                      <MapPin className="w-3 h-3 text-primary" /> {practice.town}
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
          <div className="relative h-[45vh] min-h-[350px]">
            {selected.image_url ? (
              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover shadow-2xl" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-muted to-primary/10 flex items-center justify-center">
                <span className="text-[140px] opacity-10">{TYPE_EMOJI[selected.type] || "✨"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            <button 
              onClick={() => setSelected(null)} 
              className="absolute top-6 left-6 z-20 bg-background/90 hover:bg-background backdrop-blur-md rounded-full p-2 border border-border shadow-xl md:hidden text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="absolute bottom-10 left-10 right-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase rounded-full shadow-lg tracking-[0.2em]">
                  {selected.type}
                </span>
                {selected.endangered_status && (
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border shadow-lg tracking-[0.1em] ${ENDANGERED_COLORS[selected.endangered_status]}`}>
                    {selected.endangered_status}
                  </span>
                )}
              </div>
              <h2 className="font-playfair text-6xl font-black text-foreground drop-shadow-sm leading-tight">
                {selected.name}
              </h2>
              <p className="text-sm font-black flex items-center gap-2 text-primary mt-4 uppercase tracking-[0.2em]">
                <MapPin className="w-4 h-4" /> {selected.town}, Bohol, Philippines
              </p>
            </div>
          </div>

          <div className="max-w-5xl p-10 space-y-12">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-10">
                <section>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Description & Significance
                  </h3>
                  <p className="text-lg text-foreground/90 leading-relaxed font-medium text-justify">
                    {selected.description || "The specific details and cultural significance of this tradition are currently being documented by the MAPA Bohol team."}
                  </p>
                </section>

                {selected.historical_background && (
                  <section className="bg-muted/30 rounded-3xl p-8 border border-border">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Historical Lineage</h3>
                    <p className="text-base text-foreground/80 leading-relaxed italic font-serif">
                      {selected.historical_background}
                    </p>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-6">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Heritage Metadata</h3>
                  
                  <div className="space-y-6">
                    {selected.schedule && (
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Occurrence</p>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-foreground leading-tight">{selected.schedule}</p>
                        </div>
                      </div>
                    )}

                    {selected.practitioners && (
                      <div className="pt-6 border-t border-border">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Community Custodians</p>
                        <div className="flex items-start gap-3">
                          <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <p className="text-xs font-bold text-foreground leading-snug">{selected.practitioners}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/5 border-l border-border">
          <div className="text-center space-y-6 max-w-sm px-10">
            <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border border-border rotate-3">
              <Music className="w-8 h-8 text-primary/40" />
            </div>
            <div>
              <h3 className="text-xl font-playfair font-black text-foreground uppercase tracking-widest">Tradition Registry</h3>
              <p className="text-xs font-bold text-muted-foreground leading-relaxed mt-3 opacity-60">
                Explore the living heritage of Bohol. Select a practice to view its history, community practitioners, and conservation status.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}