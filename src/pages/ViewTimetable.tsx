import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Filter } from "lucide-react";

const ViewTimetable = () => {
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
            <Select defaultValue="spring">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spring">Spring 2024</SelectItem>
                <SelectItem value="fall">Fall 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select defaultValue="cs">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cs">Software Engineering</SelectItem>
                {/* <SelectItem value="ee">Electrical Engineering</SelectItem>
                <SelectItem value="me">Mechanical Engineering</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Section</Label>
            <Select defaultValue="a">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Section A</SelectItem>
                <SelectItem value="b">Section B</SelectItem>
                <SelectItem value="c">Section C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button className="flex-1">Apply</Button>
            <Button variant="outline">Reset</Button>
          </div>
        </div>
      </Card>

      {/* Export Actions */}
      <Card className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Timetable View</h3>
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
      <Card className="p-6 shadow-soft-md">
        <Tabs defaultValue="section" className="w-full">
          {/* <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="section">By Section</TabsTrigger>
            <TabsTrigger value="instructor">By Instructor</TabsTrigger>
            <TabsTrigger value="room">By Room</TabsTrigger>
          </TabsList> */}

          <TabsContent value="section">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-4 text-left font-semibold">Day</th>
                    {["8:30 AM", "9:30 AM", "10:30 AM", "11:30 AM", "12:30 PM", "1:30 PM", "2:30 PM", "3:30 PM", "4:30 PM", "5:30 PM"].map((slot, i) => (
                      <th key={i} className="border border-border p-4 text-left font-semibold">{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, dayIdx) => (
                    <tr key={day} className="hover:bg-muted/30 transition-colors">
                      <td className="border border-border p-4 font-semibold">{day}</td>
                      {[...Array(10)].map((_, slotIdx) => {
                        const hasClass = Math.random() > 0.5;
                        const colors = ["bg-primary/10", "bg-accent/10", "bg-purple-500/10", "bg-blue-500/10"];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        return (
                          <td key={slotIdx} className={`border border-border p-4 ${hasClass ? randomColor : ""}`}>
                            {hasClass && (
                              <>
                                <div className="text-sm font-semibold">CS-{200 + dayIdx}{slotIdx}</div>
                                <div className="text-xs text-muted-foreground">
                                  Dr. {["Smith", "Johnson", "Williams", "Brown"][Math.floor(Math.random() * 4)]} • R-{100 + slotIdx}
                                </div>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="instructor">
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg mb-2">Instructor Schedule View</p>
              <p className="text-sm">Displays timetables organized by instructor</p>
            </div>
          </TabsContent>

          <TabsContent value="room">
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg mb-2">Room Utilization View</p>
              <p className="text-sm">Displays room schedules and availability</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ViewTimetable;
