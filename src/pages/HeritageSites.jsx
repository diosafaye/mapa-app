import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Search, BookOpen, MapPin, Calendar, Star, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CONSERVATION_COLORS = {
  "Excellent": "text-green-400 bg-green-500/10 border-green-500/20",
  "Good": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Fair": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "Deteriorating": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Critical": "text-red-400 bg-red-500/10 border-red-500/20",
  "Destroyed": "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const CATEGORY_EMOJI = {
  "Church": "⛪", "Historical Landmark": "🏛️", "Natural Heritage": "🌿",
  "Archaeological Site": "🏺", "Museum": "🏛", "Cultural Center": "🎭", "Other": "📍"
};

export default function HeritageSites() {
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('heritage_sites')
      .select('*')
      .eq('is_active', true) // Only show active sites
      .order('name', { ascending: true });

    if (!error && data) {
      setSites(data);
    }
    setLoading(false);
  };

  const filtered = sites.filter(s => {
    const matchSearch = (
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.town?.toLowerCase().includes(search.toLowerCase())
    );
    const matchCat = categoryFilter === "all" || s.category === categoryFilter;
    const matchClass = classFilter === "all" || s.classification === classFilter;
    return matchSearch && matchCat && matchClass;
  });

  // Dynamic filter lists based on database content
  const categories = [...new Set(sites.map(s => s.category).filter(Boolean))];
  const classifications = [...new Set(sites.map(s => s.classification).filter(Boolean))];

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-border bg-card shadow-sm`}>
        <div className="p-6 border-b border-border">
          <h1 className="font-playfair text-2xl font-bold text-foreground mb-1 tracking-tight">Heritage Sites</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bohol Cultural Documentation</p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sites or towns..."
              className="pl-9 bg-card border-border text-xs h-9 font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-card border-border text-[10px] font-bold h-8 uppercase">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="bg-card border-border text-[10px] font-bold h-8 uppercase">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <BookOpen className="w-10 h-10 mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">No sites matched your search</p>
            </div>
          ) : (
            filtered.map(site => (
              <button
                key={site.id}
                onClick={() => setSelected(site)}
                className={`w-full text-left p-5 border-b border-border/50 hover:bg-muted/50 transition-all ${
                  selected?.id === site.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl grayscale-[0.5] group-hover:grayscale-0 transition-all">
                    {CATEGORY_EMOJI[site.category] || "📍"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-foreground leading-tight truncate uppercase tracking-tighter">
                      {site.name}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1 uppercase">
                      <MapPin className="w-3 h-3 text-primary" /> {site.town}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {site.category}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          <div className="relative h-80 flex-shrink-0">
            {selected.image_url ? (
              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover shadow-inner" />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center border-b border-border">
                <span className="text-8xl opacity-20">{CATEGORY_EMOJI[site.category] || "🏛️"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <button 
              onClick={() => setSelected(null)} 
              className="absolute top-6 left-6 bg-background/90 backdrop-blur border border-border rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest md:hidden shadow-xl"
            >
              ← Back to List
            </button>
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-[10px] font-black bg-primary text-primary-foreground px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                {selected.category}
              </span>
              <h2 className="font-playfair text-4xl font-black text-foreground mt-3 leading-tight drop-shadow-sm">
                {selected.name}
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-2 flex items-center gap-2 uppercase tracking-tighter">
                <MapPin className="w-4 h-4 text-primary" /> {selected.town}, Bohol, Philippines
              </p>
            </div>
          </div>

          <div className="max-w-3xl p-8 space-y-8">
            <div className="flex flex-wrap gap-3">
              {selected.classification && (
                <div className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 rounded-xl px-5 py-2.5 shadow-sm">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="text-xs font-black uppercase tracking-tight">{selected.classification}</span>
                </div>
              )}
              {selected.condition && (
                <div className={`flex items-center gap-2 rounded-xl px-5 py-2.5 border shadow-sm ${CONSERVATION_COLORS[selected.condition] || "bg-muted"}`}>
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-tight">Status: {selected.condition}</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Historical Significance</h3>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {selected.description || "Historical records for this site are currently being digitized."}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Site Metadata</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Coordinates</p>
                      <p className="text-[11px] font-mono text-foreground mt-1 bg-muted/50 p-2 rounded border border-border">
                        {selected.latitude}, {selected.longitude}
                      </p>
                    </div>
                    {selected.date_documented && (
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Documentation Date</p>
                        <p className="text-xs font-bold text-foreground mt-1">
                          {new Date(selected.date_documented).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground bg-muted/5 border-l border-border">
          <div className="text-center max-w-sm px-10">
            <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-10" />
            <h3 className="text-lg font-black text-foreground/40 uppercase tracking-widest">Heritage Explorer</h3>
            <p className="text-xs font-bold opacity-60 leading-relaxed mt-2">
              Select a site from the directory to uncover the history, maps, and conservation status of Bohol's cultural landmarks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}