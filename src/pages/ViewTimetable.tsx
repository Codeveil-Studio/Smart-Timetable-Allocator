import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Eye, RefreshCw, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface TimetableSummary {
  id: number;
  className: string;
  createdAt: string;
  versions: number;
}

const ViewTimetable = () => {
  const location = useLocation();
  const [summaries, setSummaries] = useState<TimetableSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  // Fetch summaries on mount
  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/timetable/summaries`);
      setSummaries(data as TimetableSummary[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load timetable list");
    }
  };

  const fetchVersions = async (className: string) => {
    try {
      const versions = await apiFetch(`${API_BASE}/timetable/${className}/versions`) as number[];
      setAvailableVersions(versions);
      if (versions.length > 0) {
        setSelectedVersion(versions[0].toString());
        return versions[0].toString();
      } else {
        setSelectedVersion("");
        return null;
      }
    } catch (e) {
      console.error("Failed to fetch versions", e);
      setAvailableVersions([]);
      return null;
    }
  };

  const fetchTimetable = async (className: string, version?: string) => {
    setLoading(true);
    setTimetableData([]);
    try {
      let url = `${API_BASE}/timetable/${className}`;
      if (version) {
        url += `?version=${version}`;
      }
      const data = await apiFetch(url);
      setTimetableData(data as TimetableEntry[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load timetable");
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = async (className: string) => {
    setSelectedClass(className);
    setIsModalOpen(true);
    const latestVersion = await fetchVersions(className);
    if (latestVersion) {
      fetchTimetable(className, latestVersion);
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
      
      // Refresh summaries to update version count/timestamp
      fetchSummaries();

      // Refresh versions and fetch latest
      const versions = await apiFetch(`${API_BASE}/timetable/${selectedClass}/versions`) as number[];
      setAvailableVersions(versions);
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

  const handleDelete = async () => {
    if (!classToDelete) return;
    try {
      await apiFetch(`${API_BASE}/timetable/${classToDelete}`, { method: "DELETE" });
      toast.success(`Timetable for ${classToDelete} deleted successfully`);
      fetchSummaries();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete timetable");
    } finally {
      setClassToDelete(null);
    }
  };

  const timeSlots = ["08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30"];
  const displayTimeSlots = ["8:30 AM", "9:30 AM", "10:30 AM", "11:30 AM", "12:30 PM", "1:30 PM", "2:30 PM", "3:30 PM", "4:30 PM", "5:30 PM"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getEntry = (day: string, startTime: string) => {
    return timetableData.find(t => t.day === day && t.startTime === startTime);
  };

  // Handle auto-redirect from generation
  useEffect(() => {
    if (location.state?.className) {
      handleViewTimetable(location.state.className);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Timetable Dashboard</h2>
        <Button onClick={fetchSummaries} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh List
        </Button>
      </div>

      <Card className="shadow-soft-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Class Name</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold">Versions</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No timetables found. Generate one first!
                  </td>
                </tr>
              ) : (
                summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{summary.id}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">{summary.className}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(summary.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {summary.versions}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => handleViewTimetable(summary.className)} className="gap-2">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setClassToDelete(summary.className)} className="gap-2">
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting the timetable of <span className="font-bold text-foreground">{classToDelete}</span> will delete it permanently. 
              This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Timetable Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-2xl font-bold">Timetable: {selectedClass}</DialogTitle>
              <div className="flex items-center gap-2 ml-4">
                <Select 
                  value={selectedVersion} 
                  onValueChange={(val) => { 
                    setSelectedVersion(val); 
                    fetchTimetable(selectedClass, val); 
                  }}
                  disabled={availableVersions.length === 0}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVersions.map((ver, index) => (
                      <SelectItem key={ver} value={ver.toString()}>
                        Version {ver} {index === 0 ? "(Latest)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pr-8">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRegenerate} 
                disabled={regenerating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} /> 
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6 bg-muted/10">
            <Card className="shadow-sm overflow-hidden border-0">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="border-b border-r p-4 text-left font-semibold sticky left-0 bg-background/95 backdrop-blur z-20 w-32">Day</th>
                    {displayTimeSlots.map((slot, i) => (
                      <th key={i} className="border-b border-r last:border-r-0 p-4 text-left font-semibold min-w-[140px]">{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-muted/30 transition-colors">
                      <td className="border-b border-r p-4 font-semibold sticky left-0 bg-background z-10">{day}</td>
                      {timeSlots.map((slotTime, slotIdx) => {
                        const entry = getEntry(day, slotTime);
                        return (
                          <td key={slotIdx} className="border-b border-r last:border-r-0 p-2 h-28 align-top bg-background/50">
                            {entry ? (
                              <div className={`p-3 rounded-lg h-full text-sm border shadow-sm transition-all hover:shadow-md ${entry.isLab ? "bg-orange-50 border-orange-200 text-orange-900" : "bg-blue-50 border-blue-200 text-blue-900"}`}>
                                <div className="font-bold line-clamp-2">{entry.course}</div>
                                <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                                  <span className="font-medium">{entry.room}</span>
                                  <span>•</span>
                                  <span>{entry.roomType}</span>
                                </div>
                                {entry.isLab && (
                                  <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-800 uppercase tracking-wider">
                                    LAB
                                  </div>
                                )}
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
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-background">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <Eye className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">No timetable data available for this version</p>
                </div>
              )}
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewTimetable;
