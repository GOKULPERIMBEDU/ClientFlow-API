import { ClientModel } from "../models/client.model.js";
import { InvoiceModel } from "../models/invoice.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { ProjectModel } from "../models/project.model.js";
import { TaskModel } from "../models/task.model.js";
import { UserModel } from "../models/user.model.js";
import { DEFAULT_PROFILE } from "../types/profile.types.js";
import { statusLabel } from "../utils/status-labels.js";

const seedUsers = [
  {
    _id: "usr_gokul",
    name: "Gokul",
    email: "gokul@clientflow.com",
    role: "admin" as const,
    assignedProjects: ["prj_immigration_simplified", "prj_pulse_care_os"],
  },
  {
    _id: "usr_deepan",
    name: "Deepan",
    email: "deepan@clientflow.com",
    role: "member" as const,
    assignedProjects: ["prj_immigration_simplified"],
  },
  {
    _id: "usr_lokesh",
    name: "Lokesh",
    email: "lokesh@clientflow.com",
    role: "member" as const,
    assignedProjects: ["prj_pulse_care_os"],
  },
  {
    _id: "usr_pavithra",
    name: "Pavithra",
    email: "pavithra@clientflow.com",
    role: "member" as const,
    assignedProjects: ["prj_pulse_care_os"],
  },
];

const STALE_USER_IDS = ["usr_priya"];
const STALE_USER_EMAILS = ["priya.raman@clientflow.example", "gokul.perimbedu@clientflow.example"];

const LEGACY_CLIENT_IDS = ["cli_northwind", "cli_saffron", "cli_harbor", "cli_lumen"];
const LEGACY_PROJECT_IDS = [
  "prj_lane_visibility",
  "prj_saffron_onboarding",
  "prj_harbor_brand",
  "prj_lumen_reporting",
];

const seedClients = [
  {
    _id: "cli_mongo_leaf",
    name: "Murali",
    email: "murali@mongoleaf.com",
    company: "Mango Leaf Tech Lab",
    phone: "+1 212 555 0140",
    status: "active" as const,
    timezone: "America/New_York",
    industry: "Immigration Technology",
  },
  {
    _id: "cli_gm_private",
    name: "Koteswari",
    email: "koteswari@gmprivate.com",
    company: "GM Private Limited",
    phone: "+91 22 4000 2100",
    status: "active" as const,
    timezone: "Asia/Kolkata",
    industry: "Healthcare",
  },
];

const seedProjects = [
  {
    _id: "prj_immigration_simplified",
    clientId: "cli_mongo_leaf",
    name: "Immigration Simplified",
    description: "Immigration workflow platform for Mango Leaf Tech Lab.",
    status: "active" as const,
    budget: 12500,
    currency: "USD",
    startDate: "2026-09-01",
    endDate: "2027-03-31",
    assignedTeam: ["usr_gokul", "usr_deepan"],
  },
  {
    _id: "prj_pulse_care_os",
    clientId: "cli_gm_private",
    name: "Pulse Care OS",
    description: "Care operations platform for GM Private Limited.",
    status: "active" as const,
    budget: 450000,
    currency: "INR",
    startDate: "2026-09-01",
    endDate: "2027-03-31",
    assignedTeam: ["usr_gokul", "usr_lokesh", "usr_pavithra"],
  },
];

const seedTasks = [
  {
    _id: "tsk_imm_requirements",
    title: "Requirement Gathering",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "completed" as const,
    description:
      "Capture intake forms, document checklist, and visa-category rules with Deepan. Accepted as the baseline for Immigration Simplified.",
    dueDate: "2026-07-18",
    estimatedHours: 12,
    spentHours: 11,
  },
  {
    _id: "tsk_imm_homepage",
    title: "Homepage UI/UX Design",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "client_review" as const,
    description:
      "Marketing homepage, hero, and service tiles. Waiting on Deepan for copy and brand-color confirmation before implementation.",
    dueDate: "2026-09-26",
    estimatedHours: 16,
    spentHours: 14,
  },
  {
    _id: "tsk_imm_oauth",
    title: "User Authentication (OAuth)",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "testing_qa" as const,
    description:
      "Google and email OAuth, session refresh, and role gates for applicant vs. staff. QA is covering expired-token and MFA edge cases.",
    dueDate: "2026-09-30",
    estimatedHours: 20,
    spentHours: 18,
  },
  {
    _id: "tsk_imm_portal",
    title: "Client Portal Dashboard",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "in_progress" as const,
    description:
      "Applicant dashboard: case status, document uploads, and upcoming appointments. Building the case-timeline widget this sprint.",
    dueDate: "2026-10-10",
    estimatedHours: 24,
    spentHours: 9,
  },
  {
    _id: "tsk_imm_stripe",
    title: "Stripe Payment Integration",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "todo" as const,
    description:
      "Checkout for retainers and per-filing fees in USD. Needs webhook handling for failed cards and receipt emails.",
    dueDate: "2026-10-20",
    estimatedHours: 14,
    spentHours: 0,
  },
  {
    _id: "tsk_imm_database",
    title: "Setup Database",
    projectId: "prj_immigration_simplified",
    assignee: "Deepan",
    status: "backlog" as const,
    description:
      "MongoDB collections for applicants, cases, documents, and audit logs. Index on case number and applicant email.",
    dueDate: "2026-10-28",
    estimatedHours: 8,
    spentHours: 0,
  },
  {
    _id: "tsk_pulse_architecture",
    title: "System Architecture Design",
    projectId: "prj_pulse_care_os",
    assignee: "Gokul",
    status: "completed" as const,
    description:
      "Service map for Pulse Care OS: appointments, doctor roster, notifications, and patient records. Signed off by Gokul.",
    dueDate: "2026-08-08",
    estimatedHours: 18,
    spentHours: 17,
  },
  {
    _id: "tsk_pulse_doctor_dash",
    title: "Doctor Dashboard Layout",
    projectId: "prj_pulse_care_os",
    assignee: "Gokul",
    status: "client_review" as const,
    description:
      "Daily calendar, patient queue, and encounter notes. Awaiting Gokul’s review of the mobile breakpoint and color contrast.",
    dueDate: "2026-09-24",
    estimatedHours: 16,
    spentHours: 13,
  },
  {
    _id: "tsk_pulse_appointments",
    title: "Patient Appointment API",
    projectId: "prj_pulse_care_os",
    assignee: "Gokul",
    status: "in_progress" as const,
    description:
      "REST endpoints for slot search, booking, reschedule, and cancellation with IST timezone handling and double-book guards.",
    dueDate: "2026-10-05",
    estimatedHours: 22,
    spentHours: 10,
  },
  {
    _id: "tsk_pulse_push",
    title: "Push Notification Setup",
    projectId: "prj_pulse_care_os",
    assignee: "Gokul",
    status: "todo" as const,
    description:
      "FCM/APNs reminders for upcoming visits and lab results. Need clinic opt-in copy before wiring production keys.",
    dueDate: "2026-10-16",
    estimatedHours: 10,
    spentHours: 0,
  },
];

async function seedCollection<T>(
  label: string,
  count: number,
  insert: () => Promise<unknown>,
  size: number,
): Promise<void> {
  if (count === 0) {
    await insert();
    console.log(`Seeded ${size} ${label}`);
  }
}

async function replaceDummyWorkspace(): Promise<void> {
  const seedProjectIds = seedProjects.map((project) => project._id);
  const seedTaskIds = seedTasks.map((task) => task._id);

  await Promise.all([
    ClientModel.deleteMany({ _id: { $in: LEGACY_CLIENT_IDS } }),
    ProjectModel.deleteMany({ _id: { $in: LEGACY_PROJECT_IDS } }),
    TaskModel.deleteMany({
      $or: [{ projectId: { $in: LEGACY_PROJECT_IDS } }, { projectId: { $in: seedProjectIds }, _id: { $nin: seedTaskIds } }],
    }),
    InvoiceModel.deleteMany({ clientId: { $in: LEGACY_CLIENT_IDS } }),
  ]);

  for (const client of seedClients) {
    await ClientModel.updateOne({ _id: client._id }, { $set: client }, { upsert: true });
  }

  for (const project of seedProjects) {
    await ProjectModel.updateOne({ _id: project._id }, { $set: project }, { upsert: true });
  }

  for (const task of seedTasks) {
    await TaskModel.updateOne({ _id: task._id }, { $set: task }, { upsert: true });
  }
}

export async function seedIfEmpty(): Promise<void> {
  const profileCount = await ProfileModel.countDocuments();

  await UserModel.deleteMany({
    $or: [{ _id: { $in: STALE_USER_IDS } }, { email: { $in: STALE_USER_EMAILS } }],
  });
  for (const user of seedUsers) {
    await UserModel.updateOne({ _id: user._id }, { $set: user }, { upsert: true });
  }

  await seedCollection("profile(s)", profileCount, () => ProfileModel.create({ ...DEFAULT_PROFILE }), 1);
  await replaceDummyWorkspace();
  await migrateTaskStatuses();
  await seedTaskHistory();
}

async function migrateTaskStatuses(): Promise<void> {
  await TaskModel.updateMany({ status: "review" } as object, { $set: { status: "client_review" } });
  await TaskModel.updateMany({ status: "done" } as object, { $set: { status: "completed" } });
}

function historyEntry(
  actionType: "created" | "status" | "assignee",
  userName: string,
  timestamp: Date,
  oldValue = "",
  newValue = "",
  message = "",
) {
  return {
    id: crypto.randomUUID(),
    type: actionType,
    actionType,
    userId: userName === "Deepan" ? "usr_deepan" : "usr_gokul",
    userName,
    author: userName,
    oldValue,
    newValue,
    message,
    timestamp,
    createdAt: timestamp,
  };
}

function seedHistoryForTask(task: (typeof seedTasks)[number]) {
  const created = new Date("2026-09-01T09:00:00.000Z");
  const movedTodo = new Date("2026-09-08T10:30:00.000Z");
  const movedCurrent = new Date("2026-09-14T14:15:00.000Z");
  const entries = [
    historyEntry("created", task.assignee, created, "", statusLabel(task.status === "completed" ? "backlog" : "backlog"), "created this task"),
  ];

  if (task.status === "backlog") {
    return entries;
  }

  entries.push(historyEntry("status", task.assignee, movedTodo, "Backlog", "To Do", "changed the Status"));

  if (task.status === "todo") {
    return entries;
  }

  const currentLabel = statusLabel(task.status);
  entries.push(historyEntry("status", task.assignee, movedCurrent, "To Do", currentLabel, "changed the Status"));
  return entries;
}

async function seedTaskHistory(): Promise<void> {
  for (const task of seedTasks) {
    const doc = await TaskModel.findById(task._id).exec();
    if (!doc) {
      continue;
    }
    const hasStructured = (doc.activity ?? []).some(
      (entry) => entry.actionType === "status" || entry.actionType === "created" || entry.actionType === "assignee",
    );
    if (hasStructured) {
      continue;
    }
    const seeded = seedHistoryForTask(task);
    await TaskModel.updateOne({ _id: task._id }, { $set: { activity: seeded } });
  }
}
