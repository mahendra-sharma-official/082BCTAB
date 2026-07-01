import React, { useEffect, useState } from "react";
import { Star, Award, TrendingUp, Calendar, Tag, Search, RefreshCw, ExternalLink, Github, Layers } from "lucide-react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Project } from "../types";
import { calculateProjectScore } from "../utils/helpers";

interface ExploreViewProps {
  currentUserUid: string;
}

type SortType = "weighted" | "stars" | "recent";

export default function ExploreView({ currentUserUid }: ExploreViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState<SortType>("weighted");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "projects"));
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      setProjects(list);
    } catch (err) {
      console.error("Error loading explore projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleToggleStar = async (project: Project) => {
    try {
      const isStarred = (project.starredBy || []).includes(currentUserUid);
      const nextStarredBy = isStarred
        ? (project.starredBy || []).filter((uid) => uid !== currentUserUid)
        : [...(project.starredBy || []), currentUserUid];

      const nextStars = nextStarredBy.length;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, starredBy: nextStarredBy, stars: nextStars } : p
        )
      );

      const projRef = doc(db, "projects", project.id);
      await updateDoc(projRef, {
        starredBy: nextStarredBy,
        stars: nextStars,
      });
    } catch (err) {
      console.error("Error toggling star:", err);
      loadProjects();
    }
  };

  const allTags = Array.from(
    new Set<string>(projects.flatMap((p) => p.tags || []))
  ).filter((tag) => tag.length > 0);

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || (p.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortMethod === "stars") {
        return (b.stars || 0) - (a.stars || 0);
      }
      if (sortMethod === "recent") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      const scoreA = calculateProjectScore(a.stars || 0, a.createdAt);
      const scoreB = calculateProjectScore(b.stars || 0, b.createdAt);
      return scoreB - scoreA;
    });

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-[#111111] pb-4 mb-8 flex flex-wrap gap-4 items-end justify-between">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
            ACADEMIC REGISTRY
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">
            Explore Student Submissions
          </h2>
          <p className="text-sm italic text-[#8A8A8A] mt-1">
            Browse peer achievements. Star projects to weight their exposure dynamically.
          </p>
        </div>
        
        <button
          onClick={loadProjects}
          className="p-2 border border-[#E5E5E5] hover:border-[#111111] bg-white transition-colors flex items-center justify-center"
          title="Refresh Feed"
        >
          <RefreshCw className="w-4 h-4 text-[#111111]" />
        </button>
      </div>

      {/* Controls: Search, Sort & Tag Filters */}
      <div className="space-y-4 mb-10 bg-[#F9F9F9] p-6 border border-[#E5E5E5]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, student name, or skills..."
              className="w-full pl-9 pr-3 py-2.5 border border-[#E5E5E5] bg-white text-xs font-sans uppercase tracking-wider outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortMethod("weighted")}
              className={`px-3.5 py-2 border text-[10px] font-sans font-extrabold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                sortMethod === "weighted" ? "bg-[#111111] text-[#F4C430] border-[#111111]" : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Weighted Rank
            </button>

            <button
              onClick={() => setSortMethod("stars")}
              className={`px-3.5 py-2 border text-[10px] font-sans font-extrabold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                sortMethod === "stars" ? "bg-[#111111] text-[#F4C430] border-[#111111]" : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Most Starred
            </button>

            <button
              onClick={() => setSortMethod("recent")}
              className={`px-3.5 py-2 border text-[10px] font-sans font-extrabold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                sortMethod === "recent" ? "bg-[#111111] text-[#F4C430] border-[#111111]" : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Recent
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="border-t border-[#E5E5E5] pt-4 flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-sans font-bold uppercase tracking-widest mr-1 text-[#8A8A8A]">
              Filter Tag:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 border text-[9px] font-sans font-bold uppercase tracking-widest transition-all ${
                !selectedTag ? "bg-[#F4C430] border-[#111111] text-[#111111]" : "bg-white border-[#E5E5E5] text-[#8A8A8A] hover:border-[#8A8A8A]"
              }`}
            >
              all
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 border text-[9px] font-sans font-bold uppercase tracking-widest transition-all ${
                  selectedTag === tag ? "bg-[#F4C430] border-[#111111] text-[#111111]" : "bg-white border-[#E5E5E5] text-[#8A8A8A] hover:border-[#8A8A8A]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feed Area */}
      {loading ? (
        <div className="text-center font-sans text-xs uppercase tracking-widest py-12 text-[#8A8A8A]">
          Loading submissions feed...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">
          No projects match your search filters.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project, idx) => {
            const isStarredByMe = (project.starredBy || []).includes(currentUserUid);
            const score = calculateProjectScore(project.stars || 0, project.createdAt).toFixed(2);
            
            // Check display mode variation
            const isDeepDiveMode = project.displayMode === "deep-dive";

            return (
              <div
                key={project.id}
                className={`border bg-white p-6 transition-all flex flex-col md:flex-row gap-6 justify-between items-start ${
                  isDeepDiveMode ? "border-l-4 border-l-amber-500 border-[#E5E5E5] bg-gradient-to-br from-white to-neutral-50/40" : "border-[#E5E5E5] hover:border-[#111111]"
                }`}
              >
                {/* Ranking Index and Star Interaction Panel */}
                <div className="flex md:flex-col items-center gap-3 self-stretch justify-between md:justify-center border-b md:border-b-0 md:border-r border-[#E5E5E5] pb-3 md:pb-0 md:pr-6 min-w-[70px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-4xl font-sans font-black text-[#F4C430]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {sortMethod === "weighted" && (
                      <span className="text-[9px] font-mono text-[#8A8A8A]" title="Hacker News ranking score">
                        ({score})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleStar(project)}
                    className={`flex flex-col items-center gap-1 border p-2 w-14 transition-all ${
                      isStarredByMe ? "bg-[#F4C430] border-[#111111] text-[#111111]" : "bg-white border-[#E5E5E5] hover:border-[#111111] text-[#8A8A8A]"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isStarredByMe ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-sans font-extrabold uppercase">
                      {project.stars || 0}
                    </span>
                  </button>
                </div>

                {/* Content Block */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-serif font-bold text-[#111111] hover:underline cursor-pointer leading-tight">
                        {project.title}
                      </h3>
                      {isDeepDiveMode && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-900 text-white text-[8px] font-sans font-bold uppercase tracking-wider rounded-[1px]">
                          <Layers className="w-2.5 h-2.5 text-amber-400" /> Deep Dive View
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8A8A8A] font-sans font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#111111]" />
                      {project.date}
                    </span>
                  </div>

                  <p className="text-sm font-serif leading-relaxed text-[#111111]/85">
                    {project.description}
                  </p>

                  {/* Deep Dive Mode Structural Options Expansion Layout */}
                  {isDeepDiveMode && project.keyFeatures && project.keyFeatures.length > 0 && (
                    <div className="bg-neutral-50 border border-[#E5E5E5] p-3.5 my-2 rounded-[2px]">
                      <span className="block font-sans text-[8px] font-bold text-[#8A8A8A] tracking-wider uppercase mb-1.5">Highlighted Matrix Aspects</span>
                      <ul className="list-inside list-square space-y-1 text-xs text-neutral-800 font-serif">
                        {project.keyFeatures.map((feat: string, i: number) => (
                          <li key={i} className="marker:text-amber-500"><span className="pl-1">{feat}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E5E5] pt-3">
                    <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#111111]">
                      <span className="text-[#8A8A8A]">by</span> <span className="underline">{project.ownerName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Rich Action Outbound Links Grid */}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-neutral-600 hover:text-black uppercase tracking-wider">
                          <Github className="w-3.5 h-3.5" /> Source
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider">
                          <ExternalLink className="w-3.5 h-3.5" /> Demo
                        </a>
                      )}

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-l border-neutral-200 pl-3">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 border border-[#E5E5E5] bg-[#F9F9F9] text-[9px] font-sans font-bold uppercase tracking-widest text-[#111111]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}