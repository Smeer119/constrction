// app/dashboard/worker/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  X,
  FileText,
  ArrowLeft,
  Clock,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type Worker = {
  id: string;
  name: string;
  phone_number: string;
};

type Payment = {
  amount: number;
  description: string;
};

type Attendance = {
  id: string;
  worker_id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: "present" | "absent";
  payment?: Payment;
  pdf_url?: string;
};

export default function WorkerAttendancePage() {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", phone_number: "" });
  const [dateFilter, setDateFilter] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showGeneratedPDFs, setShowGeneratedPDFs] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editPayment, setEditPayment] = useState<{
    workerId: string;
    amount: string;
    description: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Load workers from Supabase
        const { data: workersData, error } = await supabase
          .from("workers")
          .select("*");
        if (!error && workersData) {
          setWorkers(workersData);
        }

        // Load today's attendance from localStorage
        const savedAttendance = localStorage.getItem(
          `attendance_${dateFilter}`
        );
        if (savedAttendance) {
          setAttendance(JSON.parse(savedAttendance));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateFilter, toast]);

  // Save attendance to localStorage whenever it changes
  useEffect(() => {
    if (attendance.length > 0) {
      localStorage.setItem(
        `attendance_${dateFilter}`,
        JSON.stringify(attendance)
      );
    }
  }, [attendance, dateFilter]);

  // Add new worker to Supabase
  const addWorker = async () => {
    if (!newWorker.name || !newWorker.phone_number) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workers")
        .insert([newWorker])
        .select()
        .single();

      if (error) throw error;

      setWorkers([...workers, data]);
      setNewWorker({ name: "", phone_number: "" });
      setShowAddWorker(false);
      toast({
        title: "Success",
        description: "Worker added successfully",
      });
} catch (error) {
  console.error("Error adding worker:", error);

  const err = error as { message?: string }; // type assertion

  toast({
    title: "Error",
    description: err.message || "Failed to add worker",
    variant: "destructive",
  });
}
  }
  // Delete worker from database
  const deleteWorker = async (workerId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("workers")
        .delete()
        .eq("id", workerId);

      if (error) throw error;

      setWorkers(workers.filter((w) => w.id !== workerId));
      setAttendance(attendance.filter((a) => a.worker_id !== workerId));
      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update worker attendance status
  const updateAttendanceStatus = (
    workerId: string,
    status: "present" | "absent"
  ) => {
    const now = format(new Date(), "HH:mm");
    const existingRecordIndex = attendance.findIndex(
      (a) => a.worker_id === workerId && a.date === dateFilter
    );

    const newAttendance = {
      id: `temp_${Date.now()}`,
      worker_id: workerId,
      date: dateFilter,
      status,
      clock_in: status === "present" ? now : undefined,
      clock_out: undefined,
    };

    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedAttendance = [...attendance];
      updatedAttendance[existingRecordIndex] = {
        ...updatedAttendance[existingRecordIndex],
        ...newAttendance,
        payment: updatedAttendance[existingRecordIndex].payment, // Keep existing payment
      };
      setAttendance(updatedAttendance);
    } else {
      // Add new record
      setAttendance([...attendance, newAttendance]);
    }
  };

  // Update clock in/out times
  const updateClockTime = (
    workerId: string,
    field: "clock_in" | "clock_out",
    value: string
  ) => {
    const existingRecordIndex = attendance.findIndex(
      (a) => a.worker_id === workerId && a.date === dateFilter
    );

    if (existingRecordIndex >= 0) {
      const updatedAttendance = [...attendance];
      updatedAttendance[existingRecordIndex] = {
        ...updatedAttendance[existingRecordIndex],
        [field]: value || undefined,
        status: value
          ? "present"
          : updatedAttendance[existingRecordIndex].status,
      };
      setAttendance(updatedAttendance);
    } else if (value) {
      // Create new record if setting time and no record exists
      setAttendance([
        ...attendance,
        {
          id: `temp_${Date.now()}`,
          worker_id: workerId,
          date: dateFilter,
          status: "present",
          [field]: value,
        },
      ]);
    }
  };

  // Update payment information
  const updatePayment = (workerId: string) => {
    if (!editPayment) return;

    const existingRecordIndex = attendance.findIndex(
      (a) => a.worker_id === workerId && a.date === dateFilter
    );

    const paymentData = {
      amount: parseFloat(editPayment.amount) || 0,
      description: editPayment.description,
    };

    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedAttendance = [...attendance];
      updatedAttendance[existingRecordIndex] = {
        ...updatedAttendance[existingRecordIndex],
        payment: paymentData,
      };
      setAttendance(updatedAttendance);
    } else {
      // Add new record
      setAttendance([
        ...attendance,
        {
          id: `temp_${Date.now()}`,
          worker_id: workerId,
          date: dateFilter,
          status: "absent",
          payment: paymentData,
        },
      ]);
    }

    setEditPayment(null);
  };

  // Generate and save PDF report
  const generatePDF = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get user profile for the generator name
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", currentUser.id)
        .single();

      // Create PDF document
      const doc = new jsPDF();

      // Add title and metadata
      doc.setFontSize(18);
      doc.text("Worker Attendance Report", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Generated by: ${profile?.name || "System"}`, 14, 25);
      doc.text(
        `Date: ${format(new Date(dateFilter), "MMMM dd, yyyy")}`,
        14,
        32
      );
      doc.text("Project: Gopal Construction", 14, 39);

      // Add attendance summary
      doc.setFontSize(14);
      doc.text("Attendance Summary", 14, 50);
      doc.setFontSize(12);

      const presentCount = attendance.filter(
        (a) => a.status === "present"
      ).length;
      const absentCount = attendance.filter(
        (a) => a.status === "absent"
      ).length;

      doc.text(`Total Present: ${presentCount}`, 14, 60);
      doc.text(`Total Absent: ${absentCount}`, 14, 67);

      // Add attendance details table
      doc.setFontSize(14);
      doc.text("Attendance Details", 14, 80);

      const attendanceData = workers.map((worker) => {
        const workerAttendance = attendance.find(
          (a) => a.worker_id === worker.id && a.date === dateFilter
        );
        return [
          worker.name,
          worker.phone_number,
          workerAttendance?.clock_in || "N/A",
          workerAttendance?.clock_out || "N/A",
          workerAttendance?.status
            ? workerAttendance.status.charAt(0).toUpperCase() +
              workerAttendance.status.slice(1)
            : "N/A",
          workerAttendance?.payment
            ? `₹${workerAttendance.payment.amount}`
            : "N/A",
          workerAttendance?.payment?.description || "N/A",
        ];
      });

      // Add table using jspdf-autotable
      autoTable(doc, {
        startY: 85,
        head: [
          [
            "Name",
            "Phone",
            "Clock In",
            "Clock Out",
            "Status",
            "Amount",
            "Description",
          ],
        ],
        body: attendanceData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        "Gopal Construction - Worker Management System",
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );

      // Generate PDF file name
      const fileName = `attendance_${dateFilter}_${Date.now()}.pdf`;

      // Convert PDF to blob for upload
      const pdfBlob = doc.output("blob");

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("worker_pdfs")
        .upload(`reports/${fileName}`, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL of the uploaded PDF
      const { data: urlData } = supabase.storage
        .from("worker_pdfs")
        .getPublicUrl(`reports/${fileName}`);

      // Update attendance records with PDF URL
      const updatedAttendance = attendance.map((record) => ({
        ...record,
        pdf_url:
          record.date === dateFilter ? urlData.publicUrl : record.pdf_url,
      }));
      setAttendance(updatedAttendance);

      // Download PDF automatically
      doc.save(fileName);

      toast({
        title: "Success",
        description: "PDF generated and saved successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary counts
  const calculateSummary = () => {
    const present = attendance.filter((a) => a.status === "present");
    const absent = attendance.filter((a) => a.status === "absent");

    return {
      present: present.length,
      absent: absent.length,
    };
  };

  const summary = calculateSummary();

  // Get all unique dates with PDFs for the calendar filter
  const pdfDates = Array.from(
    new Set(attendance.filter((a) => a.pdf_url).map((a) => a.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <DashboardLayout role="worker">
      <div className="p-4">
        {/* Header Section */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <h2 className="text-xl font-bold">Worker Attendance</h2>
            <p className="text-sm text-gray-600">
              Manage daily worker attendance
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Worker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newWorker.name}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, name: e.target.value })
                      }
                      placeholder="Worker name"
                    />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={newWorker.phone_number}
                      onChange={(e) =>
                        setNewWorker({
                          ...newWorker,
                          phone_number: e.target.value,
                        })
                      }
                      placeholder="Phone number"
                      type="tel"
                    />
                  </div>
                  <Button
                    onClick={addWorker}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Worker"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => setShowGeneratedPDFs(true)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <FileText className="w-4 h-4 mr-1" />
              View PDFs
            </Button>
          </div>
        </div>

        {/* Date Filter and Summary */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => setDateFilter(format(new Date(), "yyyy-MM-dd"))}
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Today
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:w-48">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.present}</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.absent}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generate PDF Button */}
        <div className="mb-4">
          <Button onClick={generatePDF} className="w-full" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Generating PDF..." : "Generate & Download PDF"}
          </Button>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] w-full">
              <div className="min-w-[1000px]">
                {" "}
                {/* Force horizontal scroll on mobile */}
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[150px]">Phone</TableHead>
                      <TableHead className="w-[120px]">Clock In</TableHead>
                      <TableHead className="w-[120px]">Clock Out</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[150px]">Amount</TableHead>
                      <TableHead className="w-[200px]">Description</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker) => {
                      const workerAttendance = attendance.find(
                        (a) =>
                          a.worker_id === worker.id && a.date === dateFilter
                      );
                      return (
                        <TableRow key={worker.id}>
                          <TableCell className="font-medium">
                            {worker.name}
                          </TableCell>
                          <TableCell>{worker.phone_number}</TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={workerAttendance?.clock_in || ""}
                              onChange={(e) =>
                                updateClockTime(
                                  worker.id,
                                  "clock_in",
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={workerAttendance?.clock_out || ""}
                              onChange={(e) =>
                                updateClockTime(
                                  worker.id,
                                  "clock_out",
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  workerAttendance?.status === "present"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateAttendanceStatus(worker.id, "present")
                                }
                                className="flex-1"
                              >
                                Present
                              </Button>
                              <Button
                                variant={
                                  workerAttendance?.status === "absent"
                                    ? "destructive"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateAttendanceStatus(worker.id, "absent")
                                }
                                className="flex-1"
                              >
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditPayment({
                                  workerId: worker.id,
                                  amount:
                                    workerAttendance?.payment?.amount.toString() ||
                                    "",
                                  description:
                                    workerAttendance?.payment?.description ||
                                    "",
                                })
                              }
                              className="w-full text-left"
                            >
                              {workerAttendance?.payment ? (
                                <span className="flex items-center">
                                  <IndianRupee className="w-4 h-4 mr-1" />
                                  {workerAttendance.payment.amount}
                                </span>
                              ) : (
                                "Add Payment"
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {workerAttendance?.payment?.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWorker(worker.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Payment Edit Dialog */}
        <Dialog open={!!editPayment} onOpenChange={() => setEditPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={editPayment?.amount || ""}
                  onChange={(e) =>
                    editPayment &&
                    setEditPayment({
                      ...editPayment,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editPayment?.description || ""}
                  onChange={(e) =>
                    editPayment &&
                    setEditPayment({
                      ...editPayment,
                      description: e.target.value,
                    })
                  }
                  placeholder="Payment description"
                />
              </div>
              <Button
                onClick={() =>
                  editPayment && updatePayment(editPayment.workerId)
                }
                className="w-full"
              >
                Save Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generated PDFs Modal */}
        {showGeneratedPDFs && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
              <CardHeader className="flex flex-row justify-between items-center border-b">
                <CardTitle>Generated PDF Reports</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowGeneratedPDFs(false);
                    setSelectedPdf(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {selectedPdf ? (
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPdf(null)}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to list
                      </Button>
                      <Button
                        onClick={() => window.open(selectedPdf, "_blank")}
                        variant="default"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <iframe
                      src={selectedPdf}
                      className="w-full flex-1 border-0"
                      title="PDF Preview"
                    />
                  </div>
                ) : (
                  <ScrollArea className="h-[70vh]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pdfDates.map((date) => {
                          const pdfRecord = attendance.find(
                            (a) => a.date === date && a.pdf_url
                          );
                          return (
                            <TableRow key={date}>
                              <TableCell>
                                {format(parseISO(date), "MMMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedPdf(pdfRecord?.pdf_url || null)
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View/Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
