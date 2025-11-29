import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GenerateSchedule = () => {
  const classOptions = Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => ["A", "B", "C"].map((s) => `${n}-${s}`));
  const [selectedClass, setSelectedClass] = useState<string>(classOptions[0]);
  const [classCourses, setClassCourses] = useState<Record<string, { code: string; title: string }[]>>({});
  const [classRooms, setClassRooms] = useState<Record<string, { roomNumber: string; roomType: string }[]>>({});

  const [courseFilter, setCourseFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const availableCourses = [
    { code: "CS-101", title: "Intro to Programming" },
    { code: "CS-201", title: "Data Structures" },
    { code: "EE-201", title: "Circuit Analysis" },
    { code: "ME-301", title: "Mechanics" },
    { code: "CS-301", title: "Algorithms" },
  ];

  const availableRooms = [
    { roomNumber: "R-101", roomType: "Lecture Hall" },
    { roomNumber: "R-202", roomType: "Lab" },
    { roomNumber: "R-303", roomType: "Lecture Hall" },
    { roomNumber: "R-404", roomType: "Lab" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="p-6 shadow-soft-md">
        <h2 className="text-2xl font-bold text-foreground mb-6">Generate Timetable</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Courses for {selectedClass}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <Input placeholder="Filter courses" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCourses
                .filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(courseFilter.toLowerCase()))
                .map((c) => (
                  <div key={c.code} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-sm font-semibold">{c.code}</div>
                      <div className="text-xs text-muted-foreground">{c.title}</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setClassCourses((prev) => {
                          const list = prev[selectedClass] || [];
                          if (list.some((x) => x.code === c.code)) return prev;
                          return { ...prev, [selectedClass]: [...list, { code: c.code, title: c.title }] };
                        });
                      }}
                    >
                      Add Course
                    </Button>
                  </div>
                ))}
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold">Course Code</th>
                    <th className="border border-border p-3 text-left font-semibold">Course Title</th>
                  </tr>
                </thead>
                <tbody>
                  {(classCourses[selectedClass] || []).map((c) => (
                    <tr key={c.code} className="hover:bg-muted/30 transition-colors">
                      <td className="border border-border p-3">{c.code}</td>
                      <td className="border border-border p-3">{c.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Rooms for {selectedClass}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <Input placeholder="Filter rooms" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRooms
                .filter((r) => `${r.roomNumber} ${r.roomType}`.toLowerCase().includes(roomFilter.toLowerCase()))
                .map((r) => (
                  <div key={r.roomNumber} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-sm font-semibold">{r.roomNumber}</div>
                      <div className="text-xs text-muted-foreground">{r.roomType}</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setClassRooms((prev) => {
                          const list = prev[selectedClass] || [];
                          if (list.some((x) => x.roomNumber === r.roomNumber)) return prev;
                          return { ...prev, [selectedClass]: [...list, { roomNumber: r.roomNumber, roomType: r.roomType }] };
                        });
                      }}
                    >
                      Add Room
                    </Button>
                  </div>
                ))}
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold">Room Number</th>
                    <th className="border border-border p-3 text-left font-semibold">Room Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(classRooms[selectedClass] || []).map((r) => (
                    <tr key={r.roomNumber} className="hover:bg-muted/30 transition-colors">
                      <td className="border border-border p-3">{r.roomNumber}</td>
                      <td className="border border-border p-3">{r.roomType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GenerateSchedule;
