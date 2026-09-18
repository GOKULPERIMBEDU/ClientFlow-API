import { ClientModel } from "../models/client.model.js";
import { InvoiceModel } from "../models/invoice.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { ProjectModel } from "../models/project.model.js";
import { TaskModel } from "../models/task.model.js";
import { UserModel } from "../models/user.model.js";
import { DEFAULT_PROFILE } from "../types/profile.types.js";

const seedUsers = [
  {
    _id: "usr_priya",
    name: "Priya Raman",
    email: "priya.raman@clientflow.example",
    role: "lead" as const,
  },
];

const seedClients = [
  {
    _id: "cli_northwind",
    name: "Amelia Hart",
    email: "amelia.hart@northwind.example",
    company: "Northwind Logistics",
    phone: "+61 2 5550 1842",
    status: "active" as const,
    timezone: "Australia/Sydney",
    industry: "Logistics",
  },
  {
    _id: "cli_saffron",
    name: "Rohan Mehta",
    email: "rohan.mehta@saffronlabs.example",
    company: "Saffron Labs",
    phone: "+91 80 4120 7781",
    status: "active" as const,
    timezone: "Asia/Kolkata",
    industry: "SaaS",
  },
  {
    _id: "cli_harbor",
    name: "Elena Vasquez",
    email: "elena@harborandco.example",
    company: "Harbor & Co",
    phone: "+1 212 555 0198",
    status: "onboarding" as const,
    timezone: "America/New_York",
    industry: "Professional Services",
  },
  {
    _id: "cli_lumen",
    name: "James Okonkwo",
    email: "james.okonkwo@lumencapital.example",
    company: "Lumen Capital",
    phone: "+1 646 555 0144",
    status: "paused" as const,
    timezone: "America/New_York",
    industry: "Finance",
  },
];

const seedProjects = [
  {
    _id: "prj_lane_visibility",
    clientId: "cli_northwind",
    name: "Lane Visibility Platform",
    description: "Realtime freight tracking dashboard and carrier SLA alerts.",
    status: "active" as const,
    budget: 186000,
    currency: "AUD",
    startDate: "2026-02-01",
    endDate: "2026-11-30",
  },
  {
    _id: "prj_saffron_onboarding",
    clientId: "cli_saffron",
    name: "Product Onboarding Revamp",
    description: "Guided activation flows, in-app checklists, and success metrics.",
    status: "active" as const,
    budget: 94000,
    currency: "USD",
    startDate: "2026-04-15",
    endDate: "2026-10-15",
  },
  {
    _id: "prj_harbor_brand",
    clientId: "cli_harbor",
    name: "Brand Site Rebuild",
    description: "Marketing site, case studies, and proposal portal for Harbor & Co.",
    status: "planning" as const,
    budget: 62000,
    currency: "USD",
    startDate: "2026-09-21",
    endDate: "2026-12-18",
  },
  {
    _id: "prj_lumen_reporting",
    clientId: "cli_lumen",
    name: "LP Reporting Suite",
    description: "Quarterly investor reporting pack with automated data pulls.",
    status: "on_hold" as const,
    budget: 128000,
    currency: "USD",
    startDate: "2026-03-01",
    endDate: "2026-09-30",
  },
];

const seedTasks = [
  {
    _id: "tsk_1",
    title: "Carrier SLA alert rules",
    projectId: "prj_lane_visibility",
    assignee: "Noah",
    status: "in_progress" as const,
  },
  {
    _id: "tsk_2",
    title: "Map tile performance pass",
    projectId: "prj_lane_visibility",
    assignee: "Amelia",
    status: "todo" as const,
  },
  {
    _id: "tsk_3",
    title: "Activation checklist copy",
    projectId: "prj_saffron_onboarding",
    assignee: "Priya",
    status: "review" as const,
  },
  {
    _id: "tsk_4",
    title: "Success metric dashboard",
    projectId: "prj_saffron_onboarding",
    assignee: "Rohan",
    status: "in_progress" as const,
  },
  {
    _id: "tsk_5",
    title: "Case study information architecture",
    projectId: "prj_harbor_brand",
    assignee: "Elena",
    status: "todo" as const,
  },
  {
    _id: "tsk_6",
    title: "LP pack data contract",
    projectId: "prj_lumen_reporting",
    assignee: "James",
    status: "done" as const,
  },
];

const seedInvoices = [
  {
    _id: "inv_041",
    invoiceNumber: "INV-2026-041",
    clientId: "cli_saffron",
    issueDate: "2026-09-17",
    dueDate: "2026-10-01",
    taxRate: 10,
    notes: "Payment due within 14 days. Bank transfer preferred.",
    status: "draft" as const,
    items: [
      { id: "li_1", description: "Product discovery sprint", quantity: 1, rate: 8400 },
      { id: "li_2", description: "Design system expansion", quantity: 2, rate: 3200 },
    ],
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

export async function seedIfEmpty(): Promise<void> {
  const [userCount, clientCount, projectCount, taskCount, invoiceCount, profileCount] = await Promise.all([
    UserModel.countDocuments(),
    ClientModel.countDocuments(),
    ProjectModel.countDocuments(),
    TaskModel.countDocuments(),
    InvoiceModel.countDocuments(),
    ProfileModel.countDocuments(),
  ]);

  await seedCollection("user(s)", userCount, () => UserModel.insertMany(seedUsers), seedUsers.length);
  await seedCollection("client(s)", clientCount, () => ClientModel.insertMany(seedClients), seedClients.length);
  await seedCollection(
    "project(s)",
    projectCount,
    () => ProjectModel.insertMany(seedProjects),
    seedProjects.length,
  );
  await seedCollection("task(s)", taskCount, () => TaskModel.insertMany(seedTasks), seedTasks.length);
  await seedCollection(
    "invoice(s)",
    invoiceCount,
    () => InvoiceModel.insertMany(seedInvoices),
    seedInvoices.length,
  );
  await seedCollection("profile(s)", profileCount, () => ProfileModel.create({ ...DEFAULT_PROFILE }), 1);
}
