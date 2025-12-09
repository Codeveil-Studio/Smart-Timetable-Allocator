import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
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

const GenerateTimetable = () => {
  const [instructors, setInstructors] = useState<{ id: number; name: string; course: string; courseName: string }[]>([]);
  const [newInstructorName, setNewInstructorName] = useState("");
  const [newInstructorCourse, setNewInstructorCourse] = useState("");
  const [newInstructorCourseName, setNewInstructorCourseName] = useState("");

  const [rooms, setRooms] = useState<{ id: number; roomNumber: string; roomType: string }[]>([]);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("");

  const [courses, setCourses] = useState<{ id: number; code: string; title: string; creditHours: number }[]>([]);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCreditHours, setNewCourseCreditHours] = useState<number | "">
  ("");

  const [editOpen, setEditOpen] = useState(false);
  const [editType, setEditType] = useState<"instructor" | "room" | "course" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editInstructor, setEditInstructor] = useState({ name: "", course: "", courseName: "" });
  const [editRoom, setEditRoom] = useState({ roomNumber: "", roomType: "" });
  const [editCourse, setEditCourse] = useState<{ code: string; title: string; creditHours: number }>({ code: "", title: "", creditHours: 0 });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"instructor" | "room" | "course" | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const insData: unknown = await apiFetch(`${API_BASE}/instructors`);
      setInstructors((insData as Array<{ id: number; name: string; course_code: string; course_name: string }>).map((x) => ({ id: x.id, name: x.name, course: x.course_code, courseName: x.course_name })));
      const rmData: unknown = await apiFetch(`${API_BASE}/rooms`);
      setRooms((rmData as Array<{ id: number; room_number: string; room_type: string }>).map((x) => ({ id: x.id, roomNumber: x.room_number, roomType: x.room_type })));
      const crData: unknown = await apiFetch(`${API_BASE}/courses`);
      setCourses((crData as Array<{ id: number; code: string; title: string; credit_hours: number }>).map((x) => ({ id: x.id, code: x.code, title: x.title, creditHours: x.credit_hours })));
    } catch (e) {
      console.error("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classOptions = Array.from({ length: 8 }, (_, i) => i + 1)
    .flatMap((n) => ["A", "B", "C"].map((s) => `${n}-${s}`));
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
        <h2 className="text-2xl font-bold text-foreground mb-6">Set Availibility</h2>

          {/* Basic Setup */}
          {/* <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cs">Computer Science</SelectItem>
                    <SelectItem value="ee">Electrical Engineering</SelectItem>
                    <SelectItem value="me">Mechanical Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div> */}

          {/* File Upload */}
          {/* <div className="mb-6">
            <Label className="mb-2 block">Upload Course Data (CSV/Excel)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-all duration-300 cursor-pointer group">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLSX (MAX. 5MB)</p>
            </div>
          </div> */}

          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="instructors" className="border rounded-xl px-4 mb-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Instructor Constraints</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left font-semibold">Instructor Name</th>
                        <th className="border border-border p-3 text-left font-semibold">Course Code</th>
                        <th className="border border-border p-3 text-left font-semibold">Course Name</th>
                        <th className="border border-border p-2 text-left font-semibold w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructors.map((inst, idx) => (
                        <tr key={`${inst.name}-${idx}`} className="hover:bg-muted/30 transition-colors">
                          <td className="border border-border p-3">{inst.name}</td>
                          <td className="border border-border p-3">{inst.course}</td>
                          <td className="border border-border p-3">{inst.courseName}</td>
                          <td className="border border-border p-2 w-[140px] whitespace-nowrap">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setEditType("instructor");
                                  setEditIndex(idx);
                                  setEditInstructor({ name: inst.name, course: inst.course, courseName: inst.courseName });
                                  setEditOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setDeleteType("instructor");
                                  setDeleteIndex(idx);
                                  setDeleteOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Instructor Name</Label>
                    <Input value={newInstructorName} onChange={(e) => setNewInstructorName(e.target.value)} placeholder="e.g., Dr. Ali" />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input value={newInstructorCourse} onChange={(e) => setNewInstructorCourse(e.target.value)} placeholder="e.g., CS-101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input value={newInstructorCourseName} onChange={(e) => setNewInstructorCourseName(e.target.value)} placeholder="e.g., Intro to Programming" />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!newInstructorName || !newInstructorCourse || !newInstructorCourseName) return;
                        (async () => {
                          try {
                            const row = (await apiFetch(`${API_BASE}/instructors`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: newInstructorName, course: newInstructorCourse, courseName: newInstructorCourseName }),
                            })) as { id: number; name: string; course_code: string; course_name: string };
                            setInstructors((prev) => [...prev, { id: row.id, name: row.name, course: row.course_code, courseName: row.course_name }]);
                            toast.success("Instructor added", { description: `${row.name} (${row.course_code})` });
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "Failed to add instructor";
                            toast.error("Failed to add instructor", { description: msg });
                          }
                        })();
                        setNewInstructorName("");
                        setNewInstructorCourse("");
                        setNewInstructorCourseName("");
                      }}
                    >
                      Add Instructor
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rooms" className="border rounded-xl px-4 mb-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Room Constraints</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left font-semibold">Room Number</th>
                        <th className="border border-border p-3 text-left font-semibold">Room Type</th>
                        <th className="border border-border p-2 text-left font-semibold w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room, idx) => (
                        <tr key={`${room.roomNumber}-${idx}`} className="hover:bg-muted/30 transition-colors">
                          <td className="border border-border p-3">{room.roomNumber}</td>
                          <td className="border border-border p-3">{room.roomType}</td>
                          <td className="border border-border p-2 w-[140px] whitespace-nowrap">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setEditType("room");
                                  setEditIndex(idx);
                                  setEditRoom({ roomNumber: room.roomNumber, roomType: room.roomType });
                                  setEditOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setDeleteType("room");
                                  setDeleteIndex(idx);
                                  setDeleteOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} placeholder="e.g., R-101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select value={newRoomType} onValueChange={setNewRoomType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                        <SelectItem value="Lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!newRoomNumber || !newRoomType) return;
                        (async () => {
                          try {
                            const row = (await apiFetch(`${API_BASE}/rooms`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ roomNumber: newRoomNumber, roomType: newRoomType }),
                            })) as { id: number; room_number: string; room_type: string };
                            setRooms((prev) => [...prev, { id: row.id, roomNumber: row.room_number, roomType: row.room_type }]);
                            toast.success("Room added", { description: `${row.room_number} (${row.room_type})` });
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "Failed to add room";
                            toast.error("Failed to add room", { description: msg });
                          }
                        })();
                        setNewRoomNumber("");
                        setNewRoomType("");
                      }}
                    >
                      Add Room
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="courses" className="border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Course Setup</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left font-semibold">Course Code</th>
                        <th className="border border-border p-3 text-left font-semibold">Course Title</th>
                        <th className="border border-border p-3 text-left font-semibold">Credit Hours</th>
                        <th className="border border-border p-2 text-left font-semibold w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c, idx) => (
                        <tr key={`${c.code}-${idx}`} className="hover:bg-muted/30 transition-colors">
                          <td className="border border-border p-3">{c.code}</td>
                          <td className="border border-border p-3">{c.title}</td>
                          <td className="border border-border p-3">{c.creditHours}</td>
                          <td className="border border-border p-2 w-[140px] whitespace-nowrap">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setEditType("course");
                                  setEditIndex(idx);
                                  setEditCourse({ code: c.code, title: c.title, creditHours: c.creditHours });
                                  setEditOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={() => {
                                  setDeleteType("course");
                                  setDeleteIndex(idx);
                                  setDeleteOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} placeholder="e.g., CS-101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} placeholder="e.g., Introduction to Programming" />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Hours</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={newCourseCreditHours === "" ? "" : newCourseCreditHours}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewCourseCreditHours(v === "" ? "" : Math.max(0, Number(v)));
                      }}
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!newCourseCode || !newCourseTitle || newCourseCreditHours === "") return;
                        (async () => {
                          try {
                            const row = (await apiFetch(`${API_BASE}/courses`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ code: newCourseCode, title: newCourseTitle, creditHours: Number(newCourseCreditHours) }),
                            })) as { id: number; code: string; title: string; credit_hours: number };
                            setCourses((prev) => [...prev, { id: row.id, code: row.code, title: row.title, creditHours: row.credit_hours }]);
                            toast.success("Course added", { description: `${row.code} — ${row.title}` });
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "Failed to add course";
                            toast.error("Failed to add course", { description: msg });
                          }
                        })();
                        setNewCourseCode("");
                        setNewCourseTitle("");
                        setNewCourseCreditHours("");
                      }}
                    >
                      Add Course
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit</DialogTitle>
            </DialogHeader>
            {editType === "instructor" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Instructor Name</Label>
                  <Input value={editInstructor.name} onChange={(e) => setEditInstructor({ ...editInstructor, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input value={editInstructor.course} onChange={(e) => setEditInstructor({ ...editInstructor, course: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input value={editInstructor.courseName} onChange={(e) => setEditInstructor({ ...editInstructor, courseName: e.target.value })} />
                </div>
              </div>
            )}
            {editType === "room" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input value={editRoom.roomNumber} onChange={(e) => setEditRoom({ ...editRoom, roomNumber: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Room Type</Label>
                  <Select value={editRoom.roomType} onValueChange={(v) => setEditRoom({ ...editRoom, roomType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {editType === "course" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input value={editCourse.code} onChange={(e) => setEditCourse({ ...editCourse, code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input value={editCourse.title} onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Credit Hours</Label>
                  <Input type="number" min={0} step={1} value={editCourse.creditHours} onChange={(e) => setEditCourse({ ...editCourse, creditHours: Math.max(0, Number(e.target.value)) })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (editIndex === null || editType === null) return;
                  if (editType === "instructor") {
                    const id = instructors[editIndex].id;
                    (async () => {
                      try {
                        const row = (await apiFetch(`${API_BASE}/instructors`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, name: editInstructor.name, course: editInstructor.course, courseName: editInstructor.courseName }),
                        })) as { name: string; course_code: string; course_name: string };
                        setInstructors((prev) => prev.map((x, i) => (i === editIndex ? { id, name: row.name, course: row.course_code, courseName: row.course_name } : x)));
                        toast.success("Instructor updated", { description: `${row.name} (${row.course_code})` });
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to update instructor";
                        toast.error("Failed to update instructor", { description: msg });
                      }
                    })();
                  } else if (editType === "room") {
                    const id = rooms[editIndex].id;
                    (async () => {
                      try {
                        const row = (await apiFetch(`${API_BASE}/rooms`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, roomNumber: editRoom.roomNumber, roomType: editRoom.roomType }),
                        })) as { room_number: string; room_type: string };
                        setRooms((prev) => prev.map((x, i) => (i === editIndex ? { id, roomNumber: row.room_number, roomType: row.room_type } : x)));
                        toast.success("Room updated", { description: `${row.room_number} (${row.room_type})` });
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to update room";
                        toast.error("Failed to update room", { description: msg });
                      }
                    })();
                  } else if (editType === "course") {
                    const id = courses[editIndex].id;
                    (async () => {
                      try {
                        const row = (await apiFetch(`${API_BASE}/courses`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, code: editCourse.code, title: editCourse.title, creditHours: editCourse.creditHours }),
                        })) as { code: string; title: string; credit_hours: number };
                        setCourses((prev) => prev.map((x, i) => (i === editIndex ? { id, code: row.code, title: row.title, creditHours: row.credit_hours } : x)));
                        toast.success("Course updated", { description: `${row.code} — ${row.title}` });
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to update course";
                        toast.error("Failed to update course", { description: msg });
                      }
                    })();
                  }
                  setEditOpen(false);
                  setEditType(null);
                  setEditIndex(null);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>This action will remove the selected item.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteIndex === null || deleteType === null) return;
                  if (deleteType === "instructor") {
                    const id = instructors[deleteIndex].id;
                    (async () => {
                      try {
                        await apiFetch(`${API_BASE}/instructors`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                        setInstructors((prev) => prev.filter((_, i) => i !== deleteIndex));
                        toast.success("Instructor deleted");
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to delete instructor";
                        toast.error("Failed to delete instructor", { description: msg });
                      }
                    })();
                  } else if (deleteType === "room") {
                    const id = rooms[deleteIndex].id;
                    (async () => {
                      try {
                        await apiFetch(`${API_BASE}/rooms`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                        setRooms((prev) => prev.filter((_, i) => i !== deleteIndex));
                        toast.success("Room deleted");
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to delete room";
                        toast.error("Failed to delete room", { description: msg });
                      }
                    })();
                  } else if (deleteType === "course") {
                    const id = courses[deleteIndex].id;
                    (async () => {
                      try {
                        await apiFetch(`${API_BASE}/courses`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                        setCourses((prev) => prev.filter((_, i) => i !== deleteIndex));
                        toast.success("Course deleted");
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Failed to delete course";
                        toast.error("Failed to delete course", { description: msg });
                      }
                    })();
                  }
                  setDeleteOpen(false);
                  setDeleteType(null);
                  setDeleteIndex(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default GenerateTimetable;
