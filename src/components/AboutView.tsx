import React, { useEffect, useState } from "react";
import { Calendar, Github, ExternalLink, Users, Terminal, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Project, UserProfile } from "../types";

export default function AboutView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  // Track expanded descriptions by project ID
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadTimelineData() {
      try {
        setLoading(true);

        const usersSnap = await getDocs(collection(db, "users"));
        const usersDictionary: Record<string, UserProfile> = {};
        usersSnap.forEach((uDoc) => {
          usersDictionary[uDoc.id] = { uid: uDoc.id, ...uDoc.data() } as UserProfile;
        });
        setProfilesMap(usersDictionary);

        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const list: Project[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Project);
        });
        setProjects(list);
      } catch (err) {
        console.error("Error loading timeline metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTimelineData();
  }, []);

  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-mono text-[#111111] animate-fade-in selection:bg-amber-100">
      
      {/* Overview Block - Minimalist Corporate Terminal Design */}
      <div className="border border-[#111111] p-8 mb-16 bg-[#FFFFFF] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#111111] text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
          SYS // YEARBOOK_INIT
        </div>
        
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-3 flex items-center gap-2">
          <Terminal className="w-3 h-3 text-amber-500 animate-pulse" /> INSTITUTIONAL ARCHIVE
        </span>
        
        <h2 className="text-3xl font-serif font-extrabold text-[#111111] mb-6 leading-tight tracking-tight">
          Department of Computer Engineering <span className="text-amber-500 italic font-normal font-sans text-2xl ml-1">(BCT)</span>
        </h2>
        
        <p className="text-sm font-serif leading-relaxed text-neutral-700 mb-8 max-w-4xl">
          Pulchowk Campus, the central engineering hub of Tribhuvan University, hosts the premier Computer Engineering program in Nepal. The BCT department brings together the country's most talented problem solvers, theoreticians, and tech developers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-dashed border-neutral-200 pt-6">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
              // CURRICULAR CONTEXT
            </span>
            <p className="text-xs font-serif leading-relaxed text-neutral-600">
              Evolving from core computing disciplines, our batch works extensively on artificial intelligence, hardware integrations, modern distributed architectures, and scalable web frameworks.
            </p>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
              // THE PORTAL NETWORK
            </span>
            <p className="text-xs font-serif leading-relaxed text-neutral-600">
              This portal acts as a permanent, live yearbook. Projects are mapped directly to student profiles, allowing ongoing peer discovery, feedback, and collaboration.
            </p>
          </div>
        </div>
      </div>

      {/* Project Timeline Title Header */}
      <div className="border-b-2 border-[#111111] pb-2 mb-12 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 bg-amber-500 rounded-full" />
          <h3 className="text-xs uppercase font-black tracking-[0.25em] text-[#111111]">
            Chronological Build Tree
          </h3>
        </div>
        <span className="text-[10px] bg-neutral-100 px-2 py-0.5 border border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
          {projects.length} Nodes Indexed
        </span>
      </div>

      {/* Chronology Tree / Timeline View */}
      {loading ? (
        <div className="py-16 text-center text-xs uppercase tracking-[0.2em] text-neutral-400 animate-pulse">
          [-] Accessing core database registers...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-neutral-200 text-center font-serif text-neutral-400 italic bg-[#FBFBFB]">
          No active deployment manifests logged inside registry node.
        </div>
      ) : (
        <div className="relative border-l-2 border-[#111111] pl-6 ml-2 space-y-6">
          {projects.map((project) => {
            const isDeepDiveMode = project.displayMode === "deep-dive";
            const isExpanded = !!expandedLogs[project.id];
            
            const associatedCollaborators = project.collaborators
              ?.map((uid) => profilesMap[uid])
              .filter(Boolean) || [];

            return (
              <div key={project.id} className="relative group transition-all duration-200">
                
                {/* Minimalist Tech Timeline Marker Dot */}
                <div className={`absolute -left-[32px] top-4.5 w-3 h-3 border-2 transition-all duration-300 ${
                  isDeepDiveMode 
                    ? "border-amber-500 bg-[#111111] rotate-45 scale-110 group-hover:bg-amber-500" 
                    : "border-[#111111] bg-white group-hover:bg-[#111111] group-hover:scale-125"
                }`} />
                
                {/* Compact Project Grid Node */}
                <div className={`border bg-white p-5 transition-all duration-300 rounded-[2px] ${
                  isDeepDiveMode 
                    ? "border-[#111111] shadow-[2px_2px_0px_0px_rgba(245,158,11,0.2)]" 
                    : "border-neutral-200 hover:border-neutral-800 hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                }`}>
                  
                  {/* Card Header System */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 tracking-tight uppercase hover:text-amber-600 transition-colors cursor-pointer">
                        {project.title}
                      </h4>
                      {isDeepDiveMode && (
                        <span className="text-[8px] font-sans bg-amber-50 text-amber-800 border border-amber-200/80 px-1 py-0.5 font-bold uppercase tracking-wider rounded-[1px]">
                          DEEP_DIVE_CORE
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold tracking-wider">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span>{project.date}</span>
                    </div>
                  </div>

                  {/* Description Box with Smart Adaptive See-More Reveal Grid */}
                  <div className="text-xs font-serif text-neutral-600 leading-relaxed max-w-4xl mb-3">
                    <div className={isExpanded ? "" : "line-clamp-2"}>
                      {project.description}
                    </div>
                    
                    {/* Expand Trigger Button */}
                    {project.description && project.description.length > 120 && (
                      <button 
                        onClick={() => toggleLog(project.id)}
                        className="mt-1.5 inline-flex items-center gap-1 font-sans text-[9px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        {isExpanded ? (
                          <>[- MINIMIZE FILE LOG] <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>[+ READ ARCHIVE LOG] <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* COLLABORATOR AVATAR HUD CHIPS */}
                  {associatedCollaborators.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-1.5 bg-neutral-50 border border-neutral-200/40 px-2 py-1.5 rounded-[1px] max-w-fit">
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                        CO-AUTHORS:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {associatedCollaborators.map((member) => (
                          <div key={member.uid} className="inline-flex items-center gap-1 bg-white border border-neutral-200/80 px-1.5 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,0.05)] text-[9px] font-medium text-neutral-700">
                            <img 
                              src={member.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.uid}`} 
                              alt="" 
                              className="w-3.5 h-3.5 border border-neutral-200 rounded-full object-cover"
                            />
                            <span className="font-sans text-[10px] font-semibold text-neutral-800">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature Lists Render Grid Block */}
                  {isDeepDiveMode && project.keyFeatures && project.keyFeatures.length > 0 && isExpanded && (
                    <div className="mb-4 border-l-2 border-amber-500 bg-neutral-50/50 p-3 text-[11px] text-neutral-700 font-mono">
                      <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-amber-500" /> DEPLOYMENT SPECIFICATION LABELS:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {project.keyFeatures.map((feat: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-neutral-600">
                            <span className="text-amber-500 font-bold">&gt;_</span> {feat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card System Footer Core Meta Map */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-neutral-100 pt-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-neutral-400">NODE_OWNER:</span>
                      <span className="text-neutral-800 bg-neutral-100 px-1.5 py-0.5 border border-neutral-200/60 rounded-[1px]">{project.ownerName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-500 hover:text-black uppercase tracking-wider transition-colors">
                          <Github className="w-3 h-3" /> SRC_CODE
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-500 hover:text-black uppercase tracking-wider transition-colors">
                          <ExternalLink className="w-3 h-3" /> LIVE_DOM
                        </a>
                      )}

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-l border-neutral-100 pl-4">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 bg-neutral-50 text-[9px] font-bold uppercase tracking-wide text-neutral-500 border border-neutral-200/70"
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