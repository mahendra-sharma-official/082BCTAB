import React, { useState, useEffect } from "react";
import { User, Tag, Github, Linkedin, Globe, MessageSquare, Plus, Trash2, Code, UserX, Settings, Layout, Eye, Save, X, Heading, Type, Columns, List, Minus, Link, Image, FileText, Users } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, UserRole, Project } from "../types";
import ChatModal from "./ChatModal";

interface ProfilesViewProps {
  currentUserUid: string;
  currentUserProfile: UserProfile | null;
  currentUserRole: UserRole;
  onRefreshProfile: () => void;
}

export default function ProfilesView({
  currentUserUid,
  currentUserProfile,
  currentUserRole,
  onRefreshProfile,
}: ProfilesViewProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  // Layout Controls
  const [viewMode, setViewMode] = useState<"clan" | "my-profile">("clan");

  // Profile Edit fields
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  // Project Configuration Modal
  const [addingProj, setAddingProj] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjTags, setNewProjTags] = useState("");
  const [newProjDate, setNewProjDate] = useState("");
  const [newProjGithub, setNewProjGithub] = useState(""); 
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]); // Array of user UIDs

  // Preview Workspace Toggle
  const [projectEditorTab, setProjectEditorTab] = useState<"edit" | "preview">("edit");

  // Core Sandbox States
  const [activeSandbox, setActiveSandbox] = useState<{ uid: string; name: string } | null>(null);
  const [fullscreenWebsite, setFullscreenWebsite] = useState<{ uid: string; name: string } | null>(null);
  const [htmlCode, setHtmlCode] = useState<string>("<h1>Welcome to my space!</h1>\n<p>Edit this HTML/CSS layout.</p>");
  const [cssCode, setCssCode] = useState<string>("body {\n  font-family: sans-serif;\n  color: #333;\n  padding: 20px;\n}");
  const [isSavingSandbox, setIsSavingSandbox] = useState(false);

  // Modals
  const [chatTarget, setChatTarget] = useState<{ uid: string; name: string } | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const [usersSnap, rolesSnap, projectsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "roles")),
        getDocs(query(collection(db, "projects"), where("ownerUid", "==", currentUserUid))),
      ]);

      const usersList: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      setProfiles(usersList);

      const rolesMap: Record<string, UserRole> = {};
      rolesSnap.forEach((docSnap) => {
        rolesMap[docSnap.id] = docSnap.data().role as UserRole;
      });
      setRoles(rolesMap);

      const projs: Project[] = [];
      projectsSnap.forEach((docSnap) => {
        projs.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      setMyProjects(projs);
    } catch (err) {
      console.error("Error loading profile elements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    if (currentUserProfile) {
      setEditName(currentUserProfile.name || "");
      setEditRoll(currentUserProfile.rollNumber || "");
      setEditBatch(currentUserProfile.batchYear || "");
      setEditSkills((currentUserProfile.skills || []).join(", "));
      setEditGithub(currentUserProfile.socials?.github || "");
      setEditLinkedin(currentUserProfile.socials?.linkedin || "");
      setEditWebsite(currentUserProfile.socials?.website || "");
      setEditPhotoURL(currentUserProfile.photoURL || "");
    }
  }, [currentUserUid, currentUserProfile]);

  // Toggle collaborator selection
  const handleToggleCollaborator = (uid: string) => {
    setSelectedCollaborators((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const injectSyntax = (type: "heading" | "bold" | "list" | "table" | "rule" | "link" | "image") => {
    const textarea = document.getElementById("projectRichEditor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = newProjDesc.substring(start, end);
    let result = "";

    switch (type) {
      case "heading":
        result = `## ${selection || "Heading Title"}\n`;
        break;
      case "bold":
        result = `**${selection || "Strong Text"}**`;
        break;
      case "list":
        result = `\n* ${selection || "Feature Point"}\n* Item 2\n`;
        break;
      case "table":
        result = `\n| Phase | System Target |\n| :--- | :--- |\n| 01 | ${selection || "Core Configuration"} |\n`;
        break;
      case "rule":
        result = `\n---\n`;
        break;
      case "link":
        result = `[${selection || "Resource Text"}](https://github.com/)`;
        break;
      case "image":
        result = `![${selection || "Image Label"}](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)`;
        break;
    }

    const output = newProjDesc.substring(0, start) + result + newProjDesc.substring(end);
    setNewProjDesc(output);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + result.length, start + result.length);
    }, 50);
  };

  const handleOpenShowcase = async (uid: string, name: string, openAsOwner: boolean) => {
    try {
      const showcaseDoc = await getDoc(doc(db, "showcases", uid));
      let currentHtml = "<h1>Welcome to my space!</h1>\n<p>This space is waiting for content creation.</p>";
      let currentCss = "body {\n  font-family: sans-serif;\n  padding: 20px;\n  background: #fafafa;\n}";

      if (showcaseDoc.exists()) {
        const data = showcaseDoc.data();
        currentHtml = data.html || "<h1>Welcome to my space!</h1>";
        currentCss = data.css || "body { font-family: sans-serif; }";
      }

      setHtmlCode(currentHtml);
      setCssCode(currentCss);

      if (openAsOwner) {
        setActiveSandbox({ uid, name });
      } else {
        setFullscreenWebsite({ uid, name });
      }
    } catch (err) {
      console.error("Error getting showcase source data:", err);
    }
  };

  const handleSaveShowcase = async () => {
    if (!activeSandbox) return;
    try {
      setIsSavingSandbox(true);
      await setDoc(doc(db, "showcases", activeSandbox.uid), {
        html: htmlCode,
        css: cssCode,
        updatedAt: new Date(),
      }, { merge: true });
      alert("Showcase layout successfully deployed!");
    } catch (err) {
      console.error("Error saving sandbox parameters:", err);
    } finally {
      setIsSavingSandbox(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", currentUserUid);
      const skillsArray = editSkills.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

      const updatedProfile = {
        uid: currentUserUid,
        name: editName.trim(),
        email: currentUserProfile?.email || "",
        skills: skillsArray,
        rollNumber: editRoll.trim(),
        batchYear: editBatch.trim(),
        photoURL: editPhotoURL.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUserUid}`,
        socials: {
          github: editGithub.trim(),
          linkedin: editLinkedin.trim(),
          website: editWebsite.trim(),
        },
      };

      await setDoc(userRef, updatedProfile, { merge: true });
      onRefreshProfile();
      loadProfiles();
      setViewMode("clan");
    } catch (err) {
      console.error("Error saving profile details:", err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;

    try {
      const projId = `proj_${Date.now()}`;
      const tagsArray = newProjTags.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);

      const projectRef = doc(db, "projects", projId);
      await setDoc(projectRef, {
        ownerUid: currentUserUid,
        ownerName: currentUserProfile?.name || "Clan Member",
        ownerEmail: currentUserProfile?.email || "",
        title: newProjTitle.trim(),
        description: newProjDesc.trim(),
        tags: tagsArray,
        date: newProjDate || new Date().toISOString().split("T")[0],
        githubLink: newProjGithub.trim(),
        collaborators: selectedCollaborators, 
        stars: 0,
        starredBy: [],
        createdAt: new Date(),
      });

      setNewProjTitle("");
      setNewProjDesc("");
      setNewProjTags("");
      setNewProjDate("");
      setNewProjGithub("");
      setSelectedCollaborators([]);
      setAddingProj(false);
      loadProfiles();
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (confirm("Are you sure you want to drop this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projId));
        loadProfiles();
      } catch (err) {
        console.error("Error deleting project reference:", err);
      }
    }
  };

  const handleRemoveProfile = async (uid: string, email: string) => {
    if (!confirm(`Eject ${email} from the Portal?`)) return;
    setRemovingUid(uid);
    try {
      await setDoc(doc(db, "bannedEmails", email.toLowerCase()), { bannedBy: currentUserUid, bannedAt: new Date() });
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "roles", uid));
      loadProfiles();
    } catch (err) {
      console.error("Error executing admin cleanup:", err);
    } finally {
      setRemovingUid(null);
    }
  };

  const getCombinedSrcDoc = () => {
    return `<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode}</body></html>`;
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 font-serif text-[#111111] animate-fade-in">
      
      {/* IMMERSIVE IFRAME FULLSCREEN DOMAIN SIMULATOR */}
      {fullscreenWebsite && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans">
          <div className="bg-neutral-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
            <p className="text-xs font-mono text-neutral-300">EXPLORING ACTIVE HUB NODE: <span className="text-white font-bold">{fullscreenWebsite.name.toUpperCase()}</span></p>
            <button onClick={() => setFullscreenWebsite(null)} className="bg-neutral-800 hover:bg-neutral-700 text-white p-1.5 rounded flex items-center gap-1 text-xs uppercase font-bold"><X className="w-4 h-4" /> Exit Site</button>
          </div>
          <iframe title="Immersive Website Portal" srcDoc={getCombinedSrcDoc()} sandbox="allow-scripts" className="w-full flex-1 border-none bg-white" />
        </div>
      )}

      {/* OVERHAULED POPUP MODAL: EXTENDED WORKSPACE COMPONENT PANEL WITH COLLABORATOR ATTACHMENT REGISTER */}
      {addingProj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white border border-[#111111] w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh] rounded-[3px] overflow-hidden animate-scale-up">
            
            {/* Modal Navigation Header */}
            <div className="flex items-center justify-between bg-[#111111] text-white px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase font-bold tracking-widest">Enhanced Project Workspace Builder</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-neutral-800 p-0.5 rounded text-xs">
                  <button type="button" onClick={() => setProjectEditorTab("edit")} className={`px-2.5 py-1 rounded-[2px] transition-all font-bold ${projectEditorTab === "edit" ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`}>Editor</button>
                  <button type="button" onClick={() => setProjectEditorTab("preview")} className={`px-2.5 py-1 rounded-[2px] transition-all font-bold ${projectEditorTab === "preview" ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`}>Live Preview</button>
                </div>
                <button onClick={() => setAddingProj(false)} className="text-neutral-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            {/* Workspace Main Form Body Splitter */}
            <form onSubmit={handleAddProject} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white">
              
              {/* Left Side Inputs Column (Spans 2 for spacious text workspace setup) */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Project Title Name</label>
                  <input type="text" required value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="e.g., Cryptographic Node Relayer Interface" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">GitHub Code Repository Link</label>
                    <input type="url" value={newProjGithub} onChange={(e) => setNewProjGithub(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="https://github.com/user/repo" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Build Timeline Completion Date</label>
                    <input type="date" value={newProjDate} onChange={(e) => setNewProjDate(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" />
                  </div>
                </div>

                {/* Rich Syntax WYSIWYG Assist Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-[#8A8A8A]">Rich Workspace Configuration (Markdown Syntax Mode)</label>
                    <div className="flex gap-0.5 bg-neutral-100 p-0.5 border border-neutral-200 rounded">
                      <button type="button" onClick={() => injectSyntax("heading")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Add Title Structure"><Heading className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("bold")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Highlight Text / Bold"><Type className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("list")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Insert Bullet Grid list"><List className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("table")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Create Comparison Data Matrix Table"><Columns className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("link")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Add Structural Hyperlink Asset"><Link className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("image")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Inject External Link Graphics / Image Media Assets"><Image className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => injectSyntax("rule")} className="p-1 hover:bg-white text-neutral-700 rounded transition-colors" title="Visual Segment Line Divider"><Minus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <textarea id="projectRichEditor" required value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full p-3 border border-[#E5E5E5] focus:border-[#111111] text-xs h-44 resize-none outline-none bg-[#FBFBFB] font-mono leading-relaxed" placeholder="Write or utilize the toolbar modules above to lay down clear workspace definitions, image URLs, and documentation maps..." />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Development Matrix Elements / Tech Stack (Comma separated)</label>
                  <input type="text" value={newProjTags} onChange={(e) => setNewProjTags(e.target.value)} className="w-full p-2.5 border border-[#E5E5E5] focus:border-[#111111] text-xs outline-none bg-[#FBFBFB]" placeholder="react, rust, webgl, tailwind" />
                </div>
              </div>

              {/* Right Side Adaptive Control Stack (Contains Collaborator Selector & Render Outputs) */}
              <div className="flex flex-col gap-4">
                
                {/* COLLABORATOR SELECTION MATRIX GRID */}
                <div className="border border-neutral-200 rounded p-4 bg-neutral-50/60 flex flex-col h-44">
                  <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-1.5 mb-2 flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#111111]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#111111]">Attach Collaborators from the Clan</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {profiles
                      .filter((p) => p.uid !== currentUserUid) 
                      .map((member) => {
                        const isChecked = selectedCollaborators.includes(member.uid);
                        return (
                          <label key={member.uid} className={`flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${isChecked ? "bg-white border-[#111111] shadow-sm" : "bg-white/40 border-neutral-200 hover:bg-white"}`}>
                            <div className="flex items-center gap-2">
                              <img src={member.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.uid}`} alt="" className="w-5 h-5 border rounded-full object-cover" />
                              <span className="text-xs font-medium text-neutral-800 truncate max-w-[140px]">{member.name}</span>
                            </div>
                            <input type="checkbox" checked={isChecked} onChange={() => handleToggleCollaborator(member.uid)} className="accent-neutral-900 rounded focus:ring-0 w-3.5 h-3.5" />
                          </label>
                        );
                    })}
                    {profiles.filter((p) => p.uid !== currentUserUid).length === 0 && (
                      <p className="text-[11px] font-serif italic text-neutral-400 text-center pt-6">No alternative workspace nodes available.</p>
                    )}
                  </div>
                </div>

                {/* Interactive Live Viewport Display Screen */}
                <div className="border border-neutral-200 bg-white flex-1 flex flex-col rounded p-4 overflow-hidden min-h-[180px]">
                  {projectEditorTab === "edit" ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center text-neutral-400 p-4">
                      <FileText className="w-7 h-7 text-neutral-300 mb-1.5 stroke-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Workspace Editor Active</span>
                      <p className="text-[11px] italic text-neutral-400 font-serif mt-0.5 max-w-xs">Click the live preview selector at any point to inspect output layouts.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto font-sans text-xs text-neutral-800 space-y-2 prose max-w-none">
                      <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-wide border-b border-neutral-200 pb-1 uppercase">{newProjTitle || "Untitled Workspace Core"}</h2>
                      <div className="text-[9px] text-neutral-500 font-medium">
                        Team Attached: {currentUserProfile?.name || "Me"} 
                        {selectedCollaborators.map(uid => `, ${profiles.find(p => p.uid === uid)?.name || ""}`)}
                      </div>
                      <div className="whitespace-pre-wrap font-serif text-[11px] leading-relaxed text-neutral-700 bg-neutral-50/40 p-2 border border-dashed rounded">
                        {newProjDesc || <span className="text-neutral-400 italic font-serif">Workspace description metrics empty.</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Commitment Grid Trigger Row */}
              <div className="lg:col-span-3 flex justify-end gap-3 pt-3 border-t border-neutral-100 flex-shrink-0">
                <button type="button" onClick={() => setAddingProj(false)} className="px-5 py-2.5 border border-[#E5E5E5] text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 rounded-[2px]">Discard</button>
                <button type="submit" className="px-8 py-2.5 bg-[#111111] text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-widest rounded-[2px]">Deploy Workspace Core</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic System Sub-Navigation Engine */}
      <div className="mb-10 flex flex-wrap gap-4 items-center justify-between border-b border-[#111111] pb-4">
        <div>
          <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">PORTAL NETWORKS</span>
          <h2 className="text-3xl font-serif font-bold text-[#111111]">{viewMode === "clan" ? "The Clan" : "My Base Center"}</h2>
          <p className="text-sm italic text-[#8A8A8A]">{viewMode === "clan" ? "Connecting every active node in our circle. View profiles, experience custom sites, or start text lines." : "Refine your system profiles, structural badges, projects, and active code sandboxes."}</p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <button onClick={() => { setViewMode("clan"); setActiveSandbox(null); }} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-[2px] ${viewMode === "clan" && !activeSandbox ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#111111] hover:border-[#111111]"}`}>The Clan</button>
          <button onClick={() => setViewMode("my-profile")} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-[2px] ${viewMode === "my-profile" ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#111111] hover:border-[#111111]"}`}>My Profile</button>
        </div>
      </div>

      {/* OWNER ONLY EDITOR WINDOW */}
      {activeSandbox && viewMode === "my-profile" && (
        <div className="bg-white border border-[#111111] p-6 mb-12 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-6">
            <div>
              <span className="font-sans text-[10px] font-bold tracking-widest text-[#8A8A8A] uppercase">LIVE SHOWCASE SANDBOX</span>
              <h3 className="text-2xl font-bold font-serif">Configure Your Web Domain Layout</h3>
            </div>
            <div className="flex items-center gap-3 font-sans">
              <button onClick={handleSaveShowcase} disabled={isSavingSandbox} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-[2px] disabled:opacity-50"><Save className="w-3.5 h-3.5" />{isSavingSandbox ? "Deploying..." : "Deploy Live Space"}</button>
              <button onClick={() => setActiveSandbox(null)} className="border border-[#111111] hover:bg-neutral-100 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px]">Close Editor</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[550px]">
            <div className="flex flex-col gap-4 h-full">
              <div className="flex-1 flex flex-col font-mono text-xs">
                <span className="font-sans text-[10px] text-[#8A8A8A] font-bold mb-1 uppercase tracking-wide">Document Structure (HTML)</span>
                <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} className="w-full flex-1 p-3 bg-neutral-900 text-emerald-400 font-mono border border-neutral-800 rounded outline-none resize-none" />
              </div>
              <div className="flex-1 flex flex-col font-mono text-xs">
                <span className="font-sans text-[10px] text-[#8A8A8A] font-bold mb-1 uppercase tracking-wide">Style Sheets (CSS)</span>
                <textarea value={cssCode} onChange={(e) => setCssCode(e.target.value)} className="w-full flex-1 p-3 bg-neutral-900 text-blue-400 font-mono border border-neutral-800 rounded outline-none resize-none" />
              </div>
            </div>
            <div className="flex flex-col h-full border border-[#E5E5E5] rounded bg-white overflow-hidden shadow-inner">
              <div className="bg-neutral-100 border-b border-[#E5E5E5] px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span></div>
                <div className="bg-white border border-neutral-200 text-[10px] font-mono rounded px-3 py-0.5 text-neutral-500 flex-1 truncate">https://clan.portal/showcase/${activeSandbox.uid}</div>
              </div>
              <iframe title="Sandbox App Render Console Window" srcDoc={getCombinedSrcDoc()} sandbox="allow-scripts" className="w-full flex-1 bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CLAN DIRECTORY CARDS GRID */}
      {viewMode === "clan" && (
        <>
          {loading ? (
            <div className="text-center font-sans text-xs uppercase tracking-widest py-12 text-[#8A8A8A]">Assembling network directory...</div>
          ) : profiles.length === 0 ? (
            <div className="text-center font-serif py-12 text-[#8A8A8A] italic border border-dashed border-[#E5E5E5] bg-[#F9F9F9]">No active members indexed in database structure.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {profiles.map((profile) => {
                const userRole = roles[profile.uid] || "student";
                const isMe = profile.uid === currentUserUid;
                const canRemove = currentUserRole === "admin" && !isMe;

                return (
                  <div key={profile.uid} className="border border-[#E5E5E5] bg-white p-6 hover:border-[#111111] transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={profile.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.uid}`} alt={profile.name} className="w-12 h-12 border border-[#E5E5E5] object-cover" />
                        <div>
                          <h3 className="font-sans font-bold text-base text-[#111111] leading-tight uppercase tracking-wide">{profile.name}</h3>
                          {profile.rollNumber && profile.batchYear ? <p className="text-[10px] font-mono text-[#8A8A8A]">{profile.batchYear}BCT{profile.rollNumber}</p> : <p className="text-[9px] font-sans text-[#8A8A8A] uppercase tracking-wider italic">Node Setup Incomplete</p>}
                        </div>
                      </div>
                      <div className="mb-4"><span className="inline-block px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest border border-[#111111] text-[#111111]">{userRole.toUpperCase()}</span></div>
                      {profile.skills && profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-6">{profile.skills.map((skill) => <span key={skill} className="px-2 py-0.5 bg-[#F9F9F9] border border-[#E5E5E5] text-[9px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A]">|{skill}</span>)}</div>
                      ) : <p className="text-xs text-[#8A8A8A] italic font-serif mb-6">Unlisted specializations.</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-6 border-t border-[#E5E5E5] pt-4">
                        {profile.socials?.github && <a href={`https://github.com/${profile.socials.github}`} target="_blank" rel="noreferrer" className="text-[#8A8A8A] hover:text-[#111111]"><Github className="w-4 h-4" /></a>}
                        {profile.socials?.linkedin && <a href={`https://linkedin.com/in/${profile.socials.linkedin}`} target="_blank" rel="noreferrer" className="text-[#8A8A8A] hover:text-[#111111]"><Linkedin className="w-4 h-4" /></a>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleOpenShowcase(profile.uid, profile.name, false)} className="bg-white hover:bg-[#F9F9F9] text-[#111111] border border-[#E5E5E5] hover:border-[#111111] py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"><Globe className="w-3.5 h-3.5" />Visit Website</button>
                        {!isMe ? <button onClick={() => setChatTarget({ uid: profile.uid, name: profile.name })} className="bg-[#111111] text-white py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"><MessageSquare className="w-3.5 h-3.5" />Chat 1:1</button> : <button onClick={() => setViewMode("my-profile")} className="border border-dashed border-[#111111] text-[#111111] bg-amber-50 hover:bg-amber-100 flex items-center justify-center py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]">Edit Space</button>}
                      </div>
                      {canRemove && <button onClick={() => handleRemoveProfile(profile.uid, profile.email)} disabled={removingUid === profile.uid} className="w-full mt-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white py-2 text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 rounded-[2px]"><UserX className="w-3.5 h-3.5" />Eject Node</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW: MY PERSONAL BASE CENTRE PANEL VIEW */}
      {viewMode === "my-profile" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 bg-[#F9F9F9] p-8 border border-[#E5E5E5]">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2 mb-6">
                <h3 className="text-xl font-serif font-bold text-[#111111]">Configure Identity Node</h3>
                <button onClick={() => handleOpenShowcase(currentUserUid, currentUserProfile?.name || "My Space", true)} className="bg-amber-500 text-neutral-900 text-xs font-sans font-bold uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5 hover:bg-amber-600 transition-all rounded-[2px]"><Code className="w-3.5 h-3.5" /> Customize HTML/CSS Space</button>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Full Identity Name</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Custom Profile Image Address (URL)</label><input type="text" value={editPhotoURL} onChange={(e) => setEditPhotoURL(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Structural Serial/Roll ID</label><input type="text" value={editRoll} onChange={(e) => setEditRoll(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Batch Matrix Tag</label><input type="text" value={editBatch} onChange={(e) => setEditBatch(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">Core Systems Specializations (Comma separated)</label><input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">GitHub ID</label><input type="text" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">LinkedIn Handle</label><input type="text" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                  <div><label className="block text-[9px] uppercase font-bold mb-1 tracking-wider text-[#8A8A8A]">External Address</label><input type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="w-full p-2 border border-[#E5E5E5] bg-white text-xs outline-none" /></div>
                </div>
                <button type="submit" className="w-full bg-[#111111] text-white hover:bg-neutral-800 py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px]">Commit Changes</button>
              </form>
            </div>
            <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-[#E5E5E5] pt-6 lg:pt-0 lg:pl-8">
              <div className="flex justify-between items-baseline mb-6">
                <h3 className="text-xl font-serif font-bold text-[#111111]">Active Projects</h3>
                <button onClick={() => setAddingProj(true)} className="border border-[#111111] bg-white px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Workspace Project</button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 font-sans">
                {myProjects.length === 0 ? <div className="text-xs text-[#8A8A8A] font-serif italic text-center py-8">No listed workspaces found.</div> : myProjects.map((proj) => (
                  <div key={proj.id} className="flex items-center justify-between p-3.5 border border-[#E5E5E5] bg-white text-xs animate-fade-in">
                    <div>
                      <div className="font-bold text-[#111111] uppercase tracking-wider">{proj.title}</div>
                      <div className="text-[9px] text-[#8A8A8A] uppercase tracking-wider mt-0.5">{proj.date}</div>
                    </div>
                    <button onClick={() => handleDeleteProject(proj.id)} className="text-red-600 hover:bg-red-50 p-1 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Messenger Component Portal Interface */}
      {chatTarget && currentUserProfile && <ChatModal currentUid={currentUserUid} currentName={currentUserProfile.name} targetUid={chatTarget.uid} targetName={chatTarget.name} onClose={() => setChatTarget(null)} />}
    </div>
  );
}