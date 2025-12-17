import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Course {
  id: number;
  code: string;
  title: string;
  creditHours: number;
  instructorId?: number | null;
  instructorName?: string;
}

interface Room {
  id: number;
  roomNumber: string;
  roomType: string;
}

interface Instructor {
  id: number;
  name: string;
}

const GenerateSchedule = () => {
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // Data State
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // Selected for Class
  const [classCourses, setClassCourses] = useState<Record<string, Course[]>>({});
  const [classRooms, setClassRooms] = useState<Record<string, Room[]>>({});

  const [courseFilter, setCourseFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const loadData = async () => {
    try {
      const [crData, rmData, insData] = await Promise.all([
        apiFetch(`${API_BASE}/courses`),
        apiFetch(`${API_BASE}/rooms`),
        apiFetch(`${API_BASE}/instructors`)
      ]);

      const insMap = new Map((insData as Instructor[]).map(i => [i.id, i.name]));
      setInstructors(insData as Instructor[]);

      setAvailableCourses((crData as any[]).map((x) => ({
        id: x.id,
        code: x.code,
        title: x.title,
        creditHours: x.credit_hours,
        instructorId: x.instructor_id,
        instructorName: x.instructor_id ? insMap.get(x.instructor_id) : undefined
      })));

      setAvailableRooms((rmData as any[]).map((x) => ({
        id: x.id,
        roomNumber: x.room_number,
        roomType: x.room_type
      })));

    } catch (e) {
      console.error("Failed to load data", e);
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Class Options based on Semester
  let classOptions: string[] = [];
  if (selectedSemester === "Fall") {
    classOptions = [1, 3, 5, 7].flatMap(n => ["A", "B", "C"].map(s => `${n}-${s}`));
  } else if (selectedSemester === "Spring") {
    classOptions = [2, 4, 6, 8].flatMap(n => ["A", "B", "C"].map(s => `${n}-${s}`));
  }

  // Reset selected class if it's not in the new options (when semester changes)
  useEffect(() => {
    if (selectedClass && !classOptions.includes(selectedClass)) {
      setSelectedClass("");
    }
  }, [selectedSemester, classOptions, selectedClass]);

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="p-6 shadow-soft-md">
        <div className="flex flex-row items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Generate Timetable</h2>
          <Button onClick={() => {
            console.log("Generating timetable with:", { classCourses, classRooms });
            toast.info("Generating timetable...");
          }}>
            Generate Timetable
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
              disabled={!selectedSemester}
            >
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
        </div>

        {selectedClass && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Courses for {selectedClass}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Input placeholder="Filter courses" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} />
                </div>
              </div>
              
              {/* Available Courses List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto border p-2 rounded-md mb-4">
                {availableCourses
                  .filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(courseFilter.toLowerCase()))
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <div className="text-sm font-semibold">{c.code}</div>
                        <div className="text-xs text-muted-foreground">{c.title}</div>
                        <div className="text-xs text-muted-foreground">Cr: {c.creditHours} | Inst: {c.instructorName || "N/A"}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClassCourses((prev) => {
                            const list = prev[selectedClass] || [];
                            if (list.some((x) => x.id === c.id)) return prev;
                            return { ...prev, [selectedClass]: [...list, c] };
                          });
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
              </div>

              {/* Selected Courses Table */}
              <div className="border rounded-md">
                <div>
                  <table className="w-full border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border-b border-border p-3 text-left font-semibold">Code</th>
                        <th className="border-b border-border p-3 text-left font-semibold">Title</th>
                        <th className="border-b border-border p-3 text-left font-semibold">Cr. Hrs</th>
                        <th className="border-b border-border p-3 text-left font-semibold">Instructor</th>
                        <th className="border-b border-border p-3 text-left font-semibold w-[80px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(classCourses[selectedClass] || []).map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="border-b border-border p-3">{c.code}</td>
                          <td className="border-b border-border p-3">{c.title}</td>
                          <td className="border-b border-border p-3">{c.creditHours}</td>
                          <td className="border-b border-border p-3">{c.instructorName || "-"}</td>
                          <td className="border-b border-border p-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setClassCourses(prev => ({
                                  ...prev,
                                  [selectedClass]: prev[selectedClass].filter(x => x.id !== c.id)
                                }));
                              }}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!classCourses[selectedClass] || classCourses[selectedClass].length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">No courses added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Rooms for {selectedClass}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Input placeholder="Filter rooms" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} />
                </div>
              </div>
              
              {/* Available Rooms List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto border p-2 rounded-md mb-4">
                {availableRooms
                  .filter((r) => `${r.roomNumber} ${r.roomType}`.toLowerCase().includes(roomFilter.toLowerCase()))
                  .map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <div className="text-sm font-semibold">{r.roomNumber}</div>
                        <div className="text-xs text-muted-foreground">{r.roomType}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClassRooms((prev) => {
                            const list = prev[selectedClass] || [];
                            if (list.some((x) => x.id === r.id)) return prev;
                            return { ...prev, [selectedClass]: [...list, r] };
                          });
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
              </div>

              {/* Selected Rooms Table */}
              <div className="border rounded-md">
                <div>
                  <table className="w-full border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border-b border-border p-3 text-left font-semibold">Room Number</th>
                        <th className="border-b border-border p-3 text-left font-semibold">Room Type</th>
                         <th className="border-b border-border p-3 text-left font-semibold w-[80px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(classRooms[selectedClass] || []).map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="border-b border-border p-3">{r.roomNumber}</td>
                          <td className="border-b border-border p-3">{r.roomType}</td>
                          <td className="border-b border-border p-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setClassRooms(prev => ({
                                  ...prev,
                                  [selectedClass]: prev[selectedClass].filter(x => x.id !== r.id)
                                }));
                              }}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                       {(!classRooms[selectedClass] || classRooms[selectedClass].length === 0) && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">No rooms added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GenerateSchedule;
