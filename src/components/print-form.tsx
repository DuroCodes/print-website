"use client";

import type React from "react";
import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import type { Session } from "@auth/core/types";

interface Filament {
  id: string;
  name: string;
  brand: string;
  color: string;
  type: "PLA" | "PLA Matte" | "Mixed";
}

interface Status {
  type: "success" | "error" | "loading" | null;
  message: string;
}

export default function PrintForm({ session }: { session: Session }) {
  const filamentOptions: Filament[] = [
    {
      id: "random",
      name: "Random",
      brand: "Surprise Me",
      color:
        "conic-gradient(hsl(0, 60%, 60%), hsl(60, 60%, 60%), hsl(120, 60%, 60%), hsl(180, 60%, 60%), hsl(240, 60%, 60%), hsl(300, 60%, 60%), hsl(360, 60%, 60%))",
      type: "Mixed",
    },
    {
      id: "bambu-pla-white",
      name: "White",
      brand: "Bambu Lab",
      color: "white",
      type: "PLA",
    },
    {
      id: "bambu-pla-black",
      name: "Black",
      brand: "Bambu Lab",
      color: "black",
      type: "PLA",
    },
    {
      id: "bambu-pla-matte-sky-blue",
      name: "Sky Blue",
      brand: "Bambu Lab",
      color: "#57B7E6",
      type: "PLA Matte",
    },
    {
      id: "bambu-pla-matte-mandarin",
      name: "Mandarin Orange",
      brand: "Bambu Lab",
      color: "#FA9863",
      type: "PLA Matte",
    },
    {
      id: "bambu-pla-matte-pink",
      name: "Sakura Pink",
      brand: "Bambu Lab",
      color: "#E8AFCF",
      type: "PLA Matte",
    },
    {
      id: "elegoo-pla-pink",
      name: "Pink",
      brand: "Elegoo",
      color: "#CE7A96",
      type: "PLA",
    },
  ] as const;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [filament, setFilament] = useState<Filament | null>(null);
  const [specialNotes, setSpecialNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<Status>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const maxFileSize = 8 * 1024 * 1024;
    if (selectedFile.size > maxFileSize) {
      setStatus({
        type: "error",
        message: "File too large. Please ensure your file is under 8MB.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Sending request..." });

    const formData = new FormData();
    formData.append(
      "payload_json",
      JSON.stringify({
        embeds: [
          {
            title: "New 3D Print Request",
            fields: [
              {
                name: "Project Name",
                value: projectName,
                inline: false,
              },
              {
                name: "Filament",
                value: filament
                  ? `${filament.name} (${filament.brand})`
                  : "Not selected",
                inline: false,
              },
              {
                name: "Special Notes",
                value: specialNotes || "None",
                inline: false,
              },
              {
                name: "User",
                value: session.user?.name ?? "Unknown User",
                inline: false,
              },
            ],
          },
        ],
      }),
    );

    formData.append("files[0]", selectedFile, selectedFile.name);

    try {
      const res = await fetch(import.meta.env.PUBLIC_DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send webhook", { cause: res });

      setStatus({ type: "success", message: "Request sent successfully! 🎉" });
      setSelectedFile(null);
      setProjectName("");
      setFilament(null);
      setSpecialNotes("");

      setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 5000);
    } catch (err) {
      console.error(err);

      let errorMessage = "An error occurred. Please try again.";

      if (err instanceof Error) {
        if (
          err.message.includes("413") ||
          err.message.includes("Payload Too Large")
        ) {
          errorMessage =
            "File too large. Please ensure your file is under 8MB.";
        } else if (
          err.message.includes("400") ||
          err.message.includes("Bad Request")
        ) {
          errorMessage =
            "Invalid file format. Please upload a valid STL or 3MF file.";
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("network")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage =
            "An error occurred. Make sure your file is under 8MB and try again.";
        }
      }

      setStatus({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = [".stl", ".3mf"];

      if (fileExtension && allowedExtensions.includes(`.${fileExtension}`)) {
        const maxFileSize = 8 * 1024 * 1024;
        if (file.size > maxFileSize) {
          setStatus({
            type: "error",
            message: "File too large. Please ensure your file is under 8MB.",
          });
          return;
        }
        setSelectedFile(file);
        setStatus({ type: null, message: "" });
      } else {
        setStatus({
          type: "error",
          message:
            "Invalid file format. Please upload a valid STL or 3MF file.",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const maxFileSize = 8 * 1024 * 1024;
      if (file.size > maxFileSize) {
        setStatus({
          type: "error",
          message: "File too large. Please ensure your file is under 8MB.",
        });
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      setStatus({ type: null, message: "" });
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>3D Print Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filament">Filament</Label>
              <Select
                value={filament?.id || ""}
                onValueChange={(value) => {
                  const selectedFilament = filamentOptions.find(
                    (f) => f.id === value,
                  );
                  setFilament(selectedFilament || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose filament" />
                </SelectTrigger>
                <SelectContent>
                  {filamentOptions.map((filament) => (
                    <SelectItem key={filament.id} value={filament.id}>
                      <div className="flex items-center gap-3 py-1">
                        {filament.id === "random" ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border border-neutral-300"
                              style={{ background: filament.color }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: filament.color }}
                          />
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {filament.name}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {filament.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {filament.brand}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive || selectedFile
                    ? "border-primary"
                    : "border-neutral-300 hover:border-neutral-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-primary mx-auto" />
                    <div>
                      <p className="font-medium text-primary text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto" />
                    <div>
                      <p className="font-medium">Drop STL or 3MF file</p>
                      <p className="text-sm text-neutral-500">
                        or click to browse
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".stl,.3mf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Browse
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                File uploads are limited to 8MB.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or notes..."
                className="min-h-[80px] resize-none"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
              disabled={
                !selectedFile ||
                !projectName.trim() ||
                status.type === "loading"
              }
            >
              {status.type === "loading" ? "Sending..." : "Submit Request"}
            </Button>

            {status.type && (
              <div
                className={`text-center p-3 rounded-lg ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : status.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
