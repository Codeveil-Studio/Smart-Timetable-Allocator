import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GitCompare, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const apiFetch = async (url: string, init?: RequestInit): Promise<unknown> => {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data: unknown = await res.json();
    if (!res.ok) {
      const errMsg = (data as { error?: string; message?: string })?.error || (data as { message?: string })?.message || "Request failed";
      throw new Error(errMsg);
    }
    return data;
  }
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Request failed");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

interface TimetableSummary {
  id: number;
  className: string;
  versions: number;
}

interface TimetableEntry {
  id: number;
  class: string;
  course: string;
  courseId: number;
  room: string;
  roomId: number;
  roomType?: string;
  instructor: string;
  instructorId: number;
  isLab?: boolean;
  day: string;
  startTime: string; // "08:30"
  endTime: string;
}

interface ConflictEntry {
  type: string;
  description: string;
  day: string;
  time: string;
  entityA_Id: number;
  entityB_Id: number;
}

interface CompareResponse {
  timetableA: TimetableEntry[];
  timetableB: TimetableEntry[];
  conflicts: ConflictEntry[];
}

const CompareTimetables = () => {
  const [summaries, setSummaries] = useState<TimetableSummary[]>([]);
  
  // Selection State
  const [classA, setClassA] = useState<string>("");
  const [verA, setVerA] = useState<string>("");
  const [versionsA, setVersionsA] = useState<number[]>([]);

  const [classB, setClassB] = useState<string>("");
  const [verB, setVerB] = useState<string>("");
  const [versionsB, setVersionsB] = useState<number[]>([]);

  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/timetable/summaries`);
      setSummaries(data as TimetableSummary[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load classes");
    }
  };

  const fetchVersions = async (className: string, setVers: (v: number[]) => void) => {
    try {
      const versions = await apiFetch(`${API_BASE}/timetable/${className}/versions`) as number[];
      setVers(versions);
      return versions;
    } catch (e) {
      console.error(e);
      setVers([]);
      return [];
    }
  };

  const handleClassChange = async (cls: string, isA: boolean) => {
    if (isA) {
      setClassA(cls);
      setVerA("");
      setCompareResult(null);
      const vers = await fetchVersions(cls, setVersionsA);
      if (vers.length > 0) setVerA(vers[0].toString());
    } else {
      setClassB(cls);
      setVerB("");
      setCompareResult(null);
      const vers = await fetchVersions(cls, setVersionsB);
      if (vers.length > 0) setVerB(vers[0].toString());
    }
  };

  const handleCompare = async () => {
    if (!classA || !verA || !classB || !verB) {
      toast.error("Please select both timetables and versions");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/timetable/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classA,
          versionA: parseInt(verA),
          classB,
          versionB: parseInt(verB)
        })
      });
      setCompareResult(res as CompareResponse);
      toast.success("Comparison complete");
    } catch (e: any) {
      toast.error(e.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  // Rendering Helpers
  const timeSlots = ["08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30"];
  const displayTimeSlots = ["8:30", "9:30", "10:30", "11:30", "12:30", "1:30", "2:30", "3:30", "4:30", "5:30"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getEntry = (data: TimetableEntry[], day: string, startTime: string) => {
    return data.find(t => t.day === day && t.startTime === startTime);
  };

  const getConflict = (day: string, startTime: string, isA: boolean) => {
    if (!compareResult) return null;
    return compareResult.conflicts.find(c => 
      c.day === day && 
      c.time === startTime && 
      (isA ? true : true) // Conflict involves both usually, but we check if this slot is involved
      // Actually, conflict entry has EntityA_Id and EntityB_Id.
      // We should check if the entry in this slot matches the conflict ID.
    );
  };
  
  const isConflict = (entry: TimetableEntry, isA: boolean) => {
    if (!compareResult) return null;
    return compareResult.conflicts.find(c => isA ? c.entityA_Id === entry.id : c.entityB_Id === entry.id);
  };

  const renderGrid = (data: TimetableEntry[], title: string, isA: boolean) => (
    <div className="flex-1 min-w-[300px] overflow-x-auto">
      <h3 className="font-bold text-lg mb-2 text-center">{title}</h3>
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
            <tr>
                <th className="w-16 p-2 border bg-muted">Day</th>
                {displayTimeSlots.map(t => <th key={t} className="p-1 border bg-muted text-center">{t}</th>)}
            </tr>
        </thead>
        <tbody>
            {days.map(day => (
                <tr key={day}>
                    <td className="font-semibold border p-2 bg-muted/30">{day}</td>
                    {timeSlots.map((slot, i) => {
                        const entry = getEntry(data, day, slot);
                        const conflict = entry ? isConflict(entry, isA) : null;
                        
                        // Highlighting: Check if same course/instructor exists in OTHER timetable
                        // This logic is tricky efficiently in render loop.
                        // Ideally pre-compute "matches".
                        // For now, simple check?
                        // "Same course appearing in both timetables" -> Assign same color?
                        // We can check if compareResult.timetableB has same courseId.
                        
                        let highlightClass = "";
                        let borderColor = "border-border";
                        
                        if (entry) {
                           if (conflict) {
                               highlightClass = "bg-red-100 text-red-900";
                               borderColor = "border-red-500 border-2";
                           } else {
                               // Check for matches
                               const otherData = isA ? compareResult?.timetableB : compareResult?.timetableA;
                               const sameCourse = otherData?.some(t => t.courseId === entry.courseId);
                               const sameInstructor = otherData?.some(t => t.instructorId === entry.instructorId);
                               const sameRoom = otherData?.some(t => t.roomId === entry.roomId);
                               
                               if (sameCourse) highlightClass = "bg-blue-50 text-blue-900";
                               else if (sameInstructor) highlightClass = "bg-green-50 text-green-900";
                               else if (sameRoom) highlightClass = "bg-purple-50 text-purple-900";
                               else highlightClass = entry.isLab ? "bg-orange-50 text-orange-900" : "bg-card";
                           }
                        }

                        return (
                            <td key={i} className={`border p-1 h-20 align-top relative ${borderColor}`}>
                                {entry ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className={`w-full h-full p-1 rounded overflow-hidden text-[10px] leading-tight ${highlightClass} cursor-pointer`}>
                                                <div className="font-bold truncate">{entry.course}</div>
                                                <div className="truncate">{entry.room} ({entry.roomType})</div>
                                                <div className="truncate opacity-75">{entry.instructor}</div>
                                                {conflict && <div className="absolute top-0 right-0 p-0.5"><AlertTriangle className="w-3 h-3 text-red-600" /></div>}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-xs">
                                                <p><strong>{entry.course}</strong></p>
                                                <p>{entry.instructor}</p>
                                                <p>{entry.room}</p>
                                                {conflict && (
                                                    <div className="mt-1 pt-1 border-t border-red-200 text-red-600 font-bold">
                                                        Conflict: {conflict.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Compare Timetables</h2>
        </div>

        <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timetable A</label>
                            <Select value={classA} onValueChange={(v) => handleClassChange(v, true)}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    {summaries.map(s => <SelectItem key={s.id} value={s.className}>{s.className}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Version</label>
                            <Select value={verA} onValueChange={setVerA} disabled={!classA}>
                                <SelectTrigger><SelectValue placeholder="Ver" /></SelectTrigger>
                                <SelectContent>
                                    {versionsA.map(v => <SelectItem key={v} value={v.toString()}>Version {v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center pb-2">
                    <div className="bg-muted p-2 rounded-full">
                        <GitCompare className="w-6 h-6 text-muted-foreground" />
                    </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timetable B</label>
                            <Select value={classB} onValueChange={(v) => handleClassChange(v, false)}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    {summaries.map(s => <SelectItem key={s.id} value={s.className}>{s.className}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Version</label>
                            <Select value={verB} onValueChange={setVerB} disabled={!classB}>
                                <SelectTrigger><SelectValue placeholder="Ver" /></SelectTrigger>
                                <SelectContent>
                                    {versionsB.map(v => <SelectItem key={v} value={v.toString()}>Version {v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Button onClick={handleCompare} disabled={loading} className="w-full md:w-auto min-w-[120px]">
                    {loading ? "Comparing..." : "Compare"}
                </Button>
            </div>
        </Card>

        {compareResult && (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    {compareResult.conflicts.length === 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 pl-1 pr-2 py-1">
                            <CheckCircle className="w-4 h-4" /> No Conflicts Detected
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="gap-1 pl-1 pr-2 py-1">
                            <AlertTriangle className="w-4 h-4" /> {compareResult.conflicts.length} Conflicts Detected
                        </Badge>
                    )}
                    <div className="text-sm text-muted-foreground ml-auto flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 border border-blue-200 block rounded-sm"></span> Same Course</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-50 border border-green-200 block rounded-sm"></span> Same Instructor</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-50 border border-purple-200 block rounded-sm"></span> Same Room</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-500 block rounded-sm"></span> Conflict</span>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 overflow-hidden">
                    {renderGrid(compareResult.timetableA, `${classA} (v${verA})`, true)}
                    {renderGrid(compareResult.timetableB, `${classB} (v${verB})`, false)}
                </div>
            </div>
        )}
    </div>
  );
};

export default CompareTimetables;
