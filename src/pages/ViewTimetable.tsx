import { useEffect, useState } from "react";
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
  day: string;
  startTime: string; // "08:30"
  endTime: string;
}

const ViewTimetable = () => {
  const [selectedSemester, setSelectedSemester] = useState<string>("Spring");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

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
    }
  }, [selectedSemester, classOptions, selectedClass]);

  const fetchTimetable = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE}/timetable/${selectedClass}`);
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={fetchTimetable} disabled={loading || !selectedClass}>
              {loading ? "Loading..." : "View Timetable"}
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
                        <div className="bg-primary/10 p-2 rounded-md h-full text-xs">
                          <div className="font-bold text-primary">{entry.course}</div>
                          <div className="text-muted-foreground mt-1">{entry.room}</div>
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
