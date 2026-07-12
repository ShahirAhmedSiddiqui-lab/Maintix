import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Asset, Issue, Technician, WorkOrder, ActivityLog } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client to prevent startup crash if API key is not configured yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Seed highly realistic, custom enterprise maintenance data
let assets: Asset[] = [
  {
    id: "AST-101",
    name: "Server Room B Cooling Unit",
    category: "HVAC / Cooling",
    status: "Operational",
    location: "Data Center Room B",
    installDate: "2023-04-12",
    criticality: "Critical",
    model: "Carrier WeatherMaster 50TJ",
    serialNumber: "SN-938210-CR",
    lastMaintenanceDate: "2026-06-15",
    maintenanceCount: 12
  },
  {
    id: "AST-102",
    name: "Automated Packaging Line A",
    category: "Manufacturing / Robotics",
    status: "Degraded",
    location: "Warehouse Assembly Hall 1",
    installDate: "2022-08-30",
    criticality: "High",
    model: "KUKA Palletizer Pack-500",
    serialNumber: "SN-58301-KA",
    lastMaintenanceDate: "2026-07-01",
    maintenanceCount: 8
  },
  {
    id: "AST-103",
    name: "Heavy-Duty Hydraulic Press",
    category: "Heavy Machinery",
    status: "Operational",
    location: "Metal Stamp Section C",
    installDate: "2021-02-18",
    criticality: "High",
    model: "Komatsu H1P-300T",
    serialNumber: "SN-293810-KM",
    lastMaintenanceDate: "2026-05-10",
    maintenanceCount: 15
  },
  {
    id: "AST-104",
    name: "Data Center Backup Generator",
    category: "Electrical Systems",
    status: "Operational",
    location: "Utility Yard North",
    installDate: "2020-11-05",
    criticality: "Critical",
    model: "Caterpillar C18 Diesel",
    serialNumber: "SN-772911-CAT",
    lastMaintenanceDate: "2026-06-28",
    maintenanceCount: 22
  },
  {
    id: "AST-105",
    name: "Toyota 8FGU25 Forklift",
    category: "Fleet / Vehicles",
    status: "Broken",
    location: "Loading Dock West",
    installDate: "2024-01-20",
    criticality: "Medium",
    model: "Toyota Core IC Forklift",
    serialNumber: "SN-48201-TY",
    lastMaintenanceDate: "2026-07-05",
    maintenanceCount: 4
  }
];

let issues: Issue[] = [
  {
    id: "ISS-401",
    title: "Forklift Hydraulic Fluid Leak",
    description: "Hydraulic pressure dropped suddenly during operation. Fluid observed pooling under the loading dock west forklift.",
    assetId: "AST-105",
    assetName: "Toyota 8FGU25 Forklift",
    category: "Mechanical / Fleet",
    priority: "High",
    status: "New",
    reportedBy: "Marcus Vance (Dock Lead)",
    reportedDate: "2026-07-10T09:30:00Z",
    assignedTechnicianId: undefined,
    assignedTechnicianName: undefined,
    aiAnalysis: {
      title: "Toyota Forklift Hydraulic Fluid Leak & Pressure Drop",
      category: "Fleet / Vehicles",
      priority: "High",
      possibleCauses: [
        "Blown high-pressure hydraulic hose seal",
        "Punctured hydraulic reservoir tank",
        "Failing hydraulic pump gasket"
      ],
      initialChecks: [
        "1. Check fluid level in the reservoir once equipment is fully cooled down.",
        "2. Trace lines from the control valve block to lift cylinders to isolate the leak path.",
        "3. Wipe down fittings and test pump at idle to locate micro-fractures."
      ]
    }
  },
  {
    id: "ISS-402",
    title: "Packaging Line Conveyor Belt Squeal",
    description: "Loud high-frequency squealing noise coming from assembly line A tension pulley roller. Belt is slightly out of alignment.",
    assetId: "AST-102",
    assetName: "Automated Packaging Line A",
    category: "Mechanical",
    priority: "Medium",
    status: "In Progress",
    reportedBy: "Elena Rostova (Line Operator)",
    reportedDate: "2026-07-09T14:15:00Z",
    assignedTechnicianId: "TECH-02",
    assignedTechnicianName: "Carlos Ramirez",
    aiAnalysis: {
      title: "Packaging Line Tension Pulley Roller Alignment",
      category: "Manufacturing / Robotics",
      priority: "Medium",
      possibleCauses: [
        "Dry or seized drive roller bearings",
        "Worn conveyor tension adjustments",
        "Material debris accumulation around tracking guides"
      ],
      initialChecks: [
        "1. Stop packaging line A and perform lockout-tagout (LOTO).",
        "2. Measure tension levels on both left and right sides of roller assembly.",
        "3. Inspect bearing seals for heat discolouration or cracking."
      ]
    }
  }
];

let technicians: Technician[] = [
  {
    id: "TECH-01",
    name: "Sarah Jenkins",
    specialty: "HVAC / Electrical Systems",
    status: "Available",
    currentWorkload: 0,
    email: "s.jenkins@maintix.io",
    phone: "+1 (555) 382-9901"
  },
  {
    id: "TECH-02",
    name: "Carlos Ramirez",
    specialty: "Mechanical / Industrial Systems",
    status: "On Job",
    currentWorkload: 1,
    email: "c.ramirez@maintix.io",
    phone: "+1 (555) 728-1120"
  },
  {
    id: "TECH-03",
    name: "David Chen",
    specialty: "Robotics / Automation Control",
    status: "Available",
    currentWorkload: 0,
    email: "d.chen@maintix.io",
    phone: "+1 (555) 193-4422"
  },
  {
    id: "TECH-04",
    name: "Samantha Patel",
    specialty: "Heavy Machinery & Safety Specialist",
    status: "Offline",
    currentWorkload: 0,
    email: "s.patel@maintix.io",
    phone: "+1 (555) 902-8811"
  }
];

let workOrders: WorkOrder[] = [
  {
    id: "WO-201",
    title: "Quarterly Calibration and Alignment Check",
    assetId: "AST-103",
    assetName: "Heavy-Duty Hydraulic Press",
    description: "Perform physical structural inspection, pressure gauge calibration, and seal alignment verification.",
    priority: "High",
    status: "Scheduled",
    dueDate: "2026-07-15",
    assignedTechnicianId: "TECH-04",
    assignedTechnicianName: "Samantha Patel"
  },
  {
    id: "WO-202",
    title: "Cooling Unit Bi-Annual Filter & Coil Wash",
    assetId: "AST-101",
    assetName: "Server Room B Cooling Unit",
    description: "Replace air intake filters, spray and clean evaporator coils, verify refrigerant charge pressure.",
    priority: "Critical",
    status: "Completed",
    dueDate: "2026-06-15",
    completedDate: "2026-06-15",
    assignedTechnicianId: "TECH-01",
    assignedTechnicianName: "Sarah Jenkins"
  }
];

let activityLogs: ActivityLog[] = [
  {
    id: "LOG-001",
    type: "asset_created",
    timestamp: "2026-07-05T08:00:00Z",
    message: "New Asset added: Toyota 8FGU25 Forklift",
    user: "Elena Rostova (Facility Administrator)",
    details: "Assigned ID: AST-105"
  },
  {
    id: "LOG-002",
    type: "issue_reported",
    timestamp: "2026-07-10T09:30:00Z",
    message: "Critical issue reported: Toyota 8FGU25 Forklift",
    user: "Marcus Vance (Dock Lead)",
    details: "Issue: Hydraulic Fluid Leak on Loading Dock West"
  },
  {
    id: "LOG-003",
    type: "work_order_assigned",
    timestamp: "2026-07-10T10:00:00Z",
    message: "Conveyor Belt alignment assigned to Carlos Ramirez",
    user: "Elena Rostova (Facility Administrator)",
    details: "Work order assigned to technician for immediate response."
  }
];

// Helper to log actions
function addLog(type: ActivityLog['type'], message: string, user: string, details?: string) {
  const log = {
    id: `LOG-${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    message,
    user,
    details
  };
  activityLogs.unshift(log);
}

// REST API Endpoints

// 1. Assets
app.get("/api/assets", (req, res) => {
  res.json(assets);
});

app.post("/api/assets", (req, res) => {
  const { name, category, status, location, installDate, criticality, model, serialNumber } = req.body;
  if (!name || !category || !status || !location || !installDate || !criticality || !model || !serialNumber) {
    return res.status(400).json({ error: "Missing required asset details" });
  }

  const newAsset = {
    id: `AST-${100 + assets.length + 1}`,
    name,
    category,
    status,
    location,
    installDate,
    criticality,
    model,
    serialNumber,
    maintenanceCount: 0
  };

  assets.push(newAsset);
  addLog("asset_created", `New Asset added: ${name}`, "Elena Rostova (Admin)", `Assigned ID: ${newAsset.id}`);
  res.status(201).json(newAsset);
});

// 2. Issues
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

app.post("/api/issues", (req, res) => {
  const { title, description, assetId, assetName, category, priority, status, aiAnalysis, reportedBy } = req.body;
  if (!title || !description || !assetId || !reportedBy) {
    return res.status(400).json({ error: "Missing required issue details" });
  }

  const newIssue = {
    id: `ISS-${400 + issues.length + 1}`,
    title,
    description,
    assetId,
    assetName: assetName || "Unknown Asset",
    category: category || "General",
    priority: priority || "Medium",
    status: (status || "New") as any,
    reportedBy,
    reportedDate: new Date().toISOString(),
    aiAnalysis: aiAnalysis || null
  };

  issues.unshift(newIssue);
  addLog("issue_reported", `New Issue reported on ${newIssue.assetName}: ${title}`, reportedBy, `Assigned ID: ${newIssue.id}`);
  res.status(201).json(newIssue);
});

app.patch("/api/issues/:id", (req, res) => {
  const { id } = req.params;
  const { status, assignedTechnicianId } = req.body;
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (status) {
    issue.status = status;
    addLog("status_change", `Issue ${id} status updated to: ${status}`, "System Dispatch");
  }

  if (assignedTechnicianId !== undefined) {
    if (assignedTechnicianId === "") {
      issue.assignedTechnicianId = undefined;
      issue.assignedTechnicianName = undefined;
    } else {
      const tech = technicians.find(t => t.id === assignedTechnicianId);
      if (tech) {
        issue.assignedTechnicianId = tech.id;
        issue.assignedTechnicianName = tech.name;
        issue.status = "In Progress";
        addLog("work_order_assigned", `Issue ${id} assigned to ${tech.name}`, "Elena Rostova (Admin)");
      }
    }
  }

  res.json(issue);
});

// 3. Technicians
app.get("/api/technicians", (req, res) => {
  res.json(technicians);
});

app.patch("/api/technicians/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tech = technicians.find(t => t.id === id);
  if (!tech) {
    return res.status(404).json({ error: "Technician not found" });
  }
  if (status) {
    tech.status = status;
  }
  res.json(tech);
});

// 4. Work Orders
app.get("/api/workorders", (req, res) => {
  res.json(workOrders);
});

app.post("/api/workorders", (req, res) => {
  const { title, assetId, assetName, description, priority, dueDate, assignedTechnicianId } = req.body;
  if (!title || !assetId || !dueDate) {
    return res.status(400).json({ error: "Missing required work order fields" });
  }

  let assignedTechnicianName = undefined;
  if (assignedTechnicianId) {
    const tech = technicians.find(t => t.id === assignedTechnicianId);
    if (tech) {
      assignedTechnicianName = tech.name;
    }
  }

  const newWO = {
    id: `WO-${200 + workOrders.length + 1}`,
    title,
    assetId,
    assetName: assetName || "General Facility",
    description: description || "",
    priority: priority || "Medium",
    status: (assignedTechnicianId ? "Assigned" : "Scheduled") as any,
    assignedTechnicianId,
    assignedTechnicianName,
    dueDate
  };

  workOrders.unshift(newWO);
  addLog("work_order_assigned", `New work order created: ${title}`, "Elena Rostova (Admin)", `Assigned ID: ${newWO.id}`);
  res.status(201).json(newWO);
});

app.patch("/api/workorders/:id", (req, res) => {
  const { id } = req.params;
  const { status, assignedTechnicianId } = req.body;
  const wo = workOrders.find(w => w.id === id);
  if (!wo) {
    return res.status(404).json({ error: "Work Order not found" });
  }

  if (status) {
    wo.status = status;
    if (status === "Completed") {
      wo.completedDate = new Date().toISOString().split("T")[0];
      // Increment maintenance count for the corresponding asset
      const asset = assets.find(a => a.id === wo.assetId);
      if (asset) {
        asset.maintenanceCount += 1;
        asset.lastMaintenanceDate = wo.completedDate;
        asset.status = "Operational";
      }
      addLog("maintenance_completed", `Work order ${id} completed on ${wo.assetName}`, "Carlos Ramirez");
    } else {
      addLog("status_change", `Work order ${id} status changed to ${status}`, "System Dispatch");
    }
  }

  if (assignedTechnicianId !== undefined) {
    if (assignedTechnicianId === "") {
      wo.assignedTechnicianId = undefined;
      wo.assignedTechnicianName = undefined;
      wo.status = "Scheduled";
    } else {
      const tech = technicians.find(t => t.id === assignedTechnicianId);
      if (tech) {
        wo.assignedTechnicianId = tech.id;
        wo.assignedTechnicianName = tech.name;
        wo.status = "Assigned";
        addLog("work_order_assigned", `Work order ${id} assigned to ${tech.name}`, "Elena Rostova (Admin)");
      }
    }
  }

  res.json(wo);
});

// 5. Activity log
app.get("/api/activity", (req, res) => {
  res.json(activityLogs);
});

// 6. AI Triage with Gemini API
app.post("/api/triage", async (req, res) => {
  const { description, assetContext } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Description is required for triage" });
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are an expert industrial asset maintenance triage AI. 
Analyze the natural language description of an equipment/asset fault, and suggest a structured ticket.
Always be realistic, using high-quality technical terms.
Categorize the issue accurately into standard industry departments (e.g. HVAC / Cooling, Manufacturing / Robotics, Electrical Systems, Fleet / Vehicles, Mechanical, Plumbing, IT Infrastructure).
Assess priority strictly as Low, Medium, High, or Critical based on environmental risk, safety, server room cooling fail, production downtime, etc.
Provide 3 realistic possible engineering causes, and 3 concise first-step diagnostic procedures for the technician.`;

    const prompt = `FAULT DESCRIPTION: "${description}"\n${assetContext ? `ASSET DETAILS: ${JSON.stringify(assetContext)}` : ""}\n\nGenerate structured triage data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Short, professional, clear ticket title explaining the problem."
            },
            category: {
              type: Type.STRING,
              description: "Departments: HVAC / Cooling, Manufacturing / Robotics, Electrical Systems, Fleet / Vehicles, Mechanical, Plumbing, IT Infrastructure"
            },
            priority: {
              type: Type.STRING,
              description: "Strictly one of: Low, Medium, High, Critical"
            },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly realistic technical causes of the issue."
            },
            initialChecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 actionable inspection steps for a technician to verify the issue."
            }
          },
          required: ["title", "category", "priority", "possibleCauses", "initialChecks"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini");
    }

    const parsed = JSON.parse(text);
    res.json(parsed);

  } catch (error: any) {
    console.error("Gemini triage error:", error);
    res.status(500).json({
      error: error.message || "Failed to perform AI triage analysis. Make sure GEMINI_API_KEY is configured."
    });
  }
});


// Serve static frontend build in production, set up Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Maintix Server listening on http://localhost:${PORT}`);
  });
}

startServer();
