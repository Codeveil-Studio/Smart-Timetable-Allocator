import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { toast } from "sonner";

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

interface TimetableEntry {
  class: string;
  course: string;
  room: string;
  roomType?: string;
  isLab?: boolean;
  day: string;
  startTime: string; // "08:30"
  endTime: string;
}

const ViewTimetable = () => {
  const location = useLocation();
  const [selectedSemester, setSelectedSemester] = useState<string>("Spring");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Compute Class Options based on Semester
  let classOptions: string[] = [];
  if (selectedSemester === "Fall") {
    classOptions = [1, 3, 5, 7].flatMap(n => ["A", "B", "C"].map(s => `${n}-${s}`));
  } else if (selectedSemester === "Spring") {
    classOptions = [2, 4, 6, 8].flatMap(n => ["A", "B", "C"].map(s => `${n}-${s}`));
  }

  useEffect(() => {
    if (selectedClass && !classOptions.includes(selectedClass)) {
      setSelectedClass("");
      setAvailableVersions([]);
      setSelectedVersion("");
    } else if (selectedClass) {
      // Fetch versions when class changes
      fetchVersions(selectedClass);
    }
  }, [selectedSemester, classOptions, selectedClass]);

  const fetchVersions = async (className: string) => {
    try {
      const versions = await apiFetch(`${API_BASE}/timetable/${className}/versions`) as number[];
      setAvailableVersions(versions);
      if (versions.length > 0) {
        // Default to latest version if not already set or invalid
        // If we just loaded, we probably want the latest.
        // If we are regenerating, we'll manually update.
        setSelectedVersion(versions[0].toString());
      } else {
        setSelectedVersion("");
      }
    } catch (e) {
      console.error("Failed to fetch versions", e);
      setAvailableVersions([]);
    }
  };

  const fetchTimetable = async (classNameOverride?: string, versionOverride?: string) => {
    const targetClass = typeof classNameOverride === 'string' ? classNameOverride : selectedClass;
    const targetVersion = typeof versionOverride === 'string' ? versionOverride : selectedVersion;
    
    if (!targetClass) {
      toast.error("Please select a class");
      return;
    }
    setLoading(true);
    try {
      let url = `${API_BASE}/timetable/${targetClass}`;
      if (targetVersion) {
        url += `?version=${targetVersion}`;
      }
      const data = await apiFetch(url);
      setTimetableData(data as TimetableEntry[]);
      toast.success("Timetable loaded");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load timetable");
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedClass) return;
    setRegenerating(true);
    try {
      await apiFetch(`${API_BASE}/timetable/regenerate/${selectedClass}`, {
        method: "POST"
      });
      toast.success("Timetable regenerated successfully!");
      // Refresh versions and fetch latest
      await fetchVersions(selectedClass);
      // We need to wait a bit for state to update or just explicitly fetch latest
      // Ideally fetchVersions updates availableVersions, and we grab the first one (newest)
      // Since setState is async, we can't rely on `availableVersions` immediately.
      // But we know we just regenerated, so there should be a new version.
      // Let's just re-fetch the timetable without version param (defaults to latest) 
      // OR fetch versions again and pick top.
      // For safety, let's just trigger a full refresh flow
      const versions = await apiFetch(`${API_BASE}/timetable/${selectedClass}/versions`) as number[];
      if (versions.length > 0) {
         setSelectedVersion(versions[0].toString());
         fetchTimetable(selectedClass, versions[0].toString());
      }
    } catch (e: any) {
      toast.error(e.message || "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (location.state?.semester) {
      setSelectedSemester(location.state.semester);
    }
    if (location.state?.className) {
      const cls = location.state.className;
      setSelectedClass(cls);
      // We need to fetch versions first, then timetable
      fetchVersions(cls).then(() => {
         // After versions are fetched, fetch timetable (defaults to latest implicit or we can wait)
         // Actually fetchTimetable handles optional version. If we don't pass it, backend gets latest.
         fetchTimetable(cls); 
      });
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const timeSlots = ["08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30"];
  const displayTimeSlots = ["8:30 AM", "9:30 AM", "10:30 AM", "11:30 AM", "12:30 PM", "1:30 PM", "2:30 PM", "3:30 PM", "4:30 PM", "5:30 PM"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getEntry = (day: string, startTime: string) => {
    return timetableData.find(t => t.day === day && t.startTime === startTime);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Filter Section */}
      <Card className="p-6 shadow-soft-md">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Filter Timetables</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder={!selectedSemester ? "Select Semester first" : "Select Class"} />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
             <Label>Version</Label>
             <Select value={selectedVersion} onValueChange={(val) => { setSelectedVersion(val); fetchTimetable(undefined, val); }} disabled={!selectedClass || availableVersions.length === 0}>
               <SelectTrigger>
                 <SelectValue placeholder="Latest" />
               </SelectTrigger>
               <SelectContent>
                 {availableVersions.map((ver) => (
                   <SelectItem key={ver} value={ver.toString()}>Version {ver}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="flex items-end gap-2 col-span-1 md:col-span-4 lg:col-span-1">
            <Button className="flex-1" onClick={() => fetchTimetable()} disabled={loading || !selectedClass}>
              {loading ? "Loading..." : "View Timetable"}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleRegenerate} disabled={loading || regenerating || !selectedClass}>
              {regenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Actions */}
      <Card className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Timetable View: {selectedClass || "None"}</h3>
        <div className="flex gap-3">
          <Button variant="default" className="gap-2">
            <Download className="w-4 h-4" />
            Export to PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>
      </Card>

      {/* Timetable Display */}
      <Card className="p-6 shadow-soft-md overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-4 text-left font-semibold sticky left-0 bg-muted z-10">Day</th>
              {displayTimeSlots.map((slot, i) => (
                <th key={i} className="border border-border p-4 text-left font-semibold">{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="hover:bg-muted/30 transition-colors">
                <td className="border border-border p-4 font-semibold sticky left-0 bg-background z-10">{day}</td>
                {timeSlots.map((slotTime, slotIdx) => {
                  const entry = getEntry(day, slotTime);
                  return (
                    <td key={slotIdx} className="border border-border p-2 h-24 align-top">
                      {entry ? (
                        <div className={`p-2 rounded-md h-full text-xs ${entry.isLab ? "bg-orange-100 text-orange-800" : "bg-primary/10 text-foreground"}`}>
                          <div className="font-bold">{entry.course}</div>
                          <div className="text-muted-foreground mt-1">{entry.room} ({entry.roomType})</div>
                          {entry.isLab && <div className="text-[10px] font-bold mt-1">LAB</div>}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {timetableData.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No timetable data to display. Please select a class and click View.
          </div>
        )}
      </Card>
    </div>
  );
};

export default ViewTimetable;
