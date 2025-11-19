import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Calendar, Download, FileSpreadsheet, AlertCircle, CheckCircle, Users, Home } from "lucide-react";
import { toast } from "sonner";

const GenerateTimetable = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setShowResults(true);
      toast.success("Timetable generated successfully!");
    }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Input Form Section */}
      {!showResults && (
        <Card className="p-6 shadow-soft-md">
          <h2 className="text-2xl font-bold text-foreground mb-6">Configuration</h2>

          {/* Basic Setup */}
          <div className="space-y-6 mb-6">
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
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <Label className="mb-2 block">Upload Course Data (CSV/Excel)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-all duration-300 cursor-pointer group">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLSX (MAX. 5MB)</p>
            </div>
          </div>

          {/* Constraints Accordion */}
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="instructors" className="border rounded-xl px-4 mb-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Instructor Constraints</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Instructor Name</Label>
                  <Input placeholder="Enter instructor name" />
                </div>
                <div className="space-y-2">
                  <Label>Unavailable Timeslots</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeslots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mon-8">Monday 8:00 AM</SelectItem>
                      <SelectItem value="tue-10">Tuesday 10:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full">Add Instructor</Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rooms" className="border rounded-xl px-4 mb-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Room Constraints</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input placeholder="e.g., R-101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture Hall</SelectItem>
                        <SelectItem value="lab">Laboratory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" placeholder="e.g., 50" />
                </div>
                <Button variant="outline" className="w-full">Add Room</Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="courses" className="border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Course Setup</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input placeholder="e.g., CS-101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input placeholder="e.g., Introduction to Programming" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lecture Hours/Week</Label>
                    <Input type="number" placeholder="e.g., 3" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lab Hours/Week</Label>
                    <Input type="number" placeholder="e.g., 2" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">Add Course</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-14 text-lg font-semibold shadow-glow hover:shadow-glow transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Generate Timetable
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Results Section */}
      {showResults && (
        <div className="space-y-6 animate-scale-in">
          {/* Action Buttons */}
          <Card className="p-4 flex items-center justify-between">
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
            <Button variant="secondary" onClick={() => setShowResults(false)}>
              Regenerate
            </Button>
          </Card>

          {/* Conflict Report */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Conflict Report
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Room Conflict</p>
                  <p className="text-xs text-muted-foreground">Room R-101 is double-booked on Monday 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Successfully Scheduled</p>
                  <p className="text-xs text-muted-foreground">121 out of 124 sections scheduled without conflicts</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Timetable Views */}
          <Card className="p-6">
            <Tabs defaultValue="section" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="section">By Section</TabsTrigger>
                <TabsTrigger value="instructor">By Instructor</TabsTrigger>
                <TabsTrigger value="room">By Room</TabsTrigger>
              </TabsList>

              <TabsContent value="section" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left font-semibold">Time</th>
                        <th className="border border-border p-3 text-left font-semibold">Monday</th>
                        <th className="border border-border p-3 text-left font-semibold">Tuesday</th>
                        <th className="border border-border p-3 text-left font-semibold">Wednesday</th>
                        <th className="border border-border p-3 text-left font-semibold">Thursday</th>
                        <th className="border border-border p-3 text-left font-semibold">Friday</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3 font-medium">8:00 - 9:00</td>
                        <td className="border border-border p-3 bg-primary/10">
                          <div className="text-sm font-semibold">CS-101</div>
                          <div className="text-xs text-muted-foreground">Dr. Smith • R-101</div>
                        </td>
                        <td className="border border-border p-3"></td>
                        <td className="border border-border p-3 bg-accent/10">
                          <div className="text-sm font-semibold">EE-201</div>
                          <div className="text-xs text-muted-foreground">Dr. Johnson • R-202</div>
                        </td>
                        <td className="border border-border p-3"></td>
                        <td className="border border-border p-3 bg-primary/10">
                          <div className="text-sm font-semibold">CS-101</div>
                          <div className="text-xs text-muted-foreground">Dr. Smith • R-101</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">9:00 - 10:00</td>
                        <td className="border border-border p-3"></td>
                        <td className="border border-border p-3 bg-purple-500/10">
                          <div className="text-sm font-semibold">ME-301</div>
                          <div className="text-xs text-muted-foreground">Dr. Williams • R-303</div>
                        </td>
                        <td className="border border-border p-3"></td>
                        <td className="border border-border p-3 bg-accent/10">
                          <div className="text-sm font-semibold">EE-201</div>
                          <div className="text-xs text-muted-foreground">Dr. Johnson • R-202</div>
                        </td>
                        <td className="border border-border p-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="instructor">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Instructor view - Similar table structure showing instructor schedules</p>
                </div>
              </TabsContent>

              <TabsContent value="room">
                <div className="text-center py-12 text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Room view - Similar table structure showing room utilization</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GenerateTimetable;
