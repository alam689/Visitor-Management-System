import { PURPOSES } from "./constants";

/* Deterministic PRNG so the demo history is identical on every fresh seed. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const at = (date, hour, minute) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const plus = (iso, mins) => new Date(new Date(iso).getTime() + mins * 60000).toISOString();

/* ------------------------------------------------------------------
   Organization master
   ------------------------------------------------------------------ */
export const SEED_ORGS = [
  {
    orgId: "ORG-001",
    name: "Northwind Studios",
    address: "House 42, Road 11, Banani, Dhaka 1213",
    contactNumber: "+880 2 9876543",
    email: "reception@northwind.example",
    website: "www.northwind.example",
    contactPerson: "Nadia Islam",
    slotStart: "09:00",
    slotEnd: "18:00",
    slotDays: [0, 1, 2, 3, 4],
    createdAt: "2024-01-08T09:00:00.000Z",
  },
  {
    orgId: "ORG-002",
    name: "Meridian Logistics",
    address: "Plot 7, Uttara Sector 4, Dhaka 1230",
    contactNumber: "+880 2 8811223",
    email: "front.desk@meridian.example",
    website: "www.meridian.example",
    contactPerson: "Sabbir Rahman",
    slotStart: "08:30",
    slotEnd: "17:30",
    slotDays: [0, 1, 2, 3, 4],
    createdAt: "2024-06-02T09:00:00.000Z",
  },
];

/* ------------------------------------------------------------------
   Host master
   ------------------------------------------------------------------ */
export const SEED_HOSTS = [
  { hostId: "HST-001", orgId: "ORG-001", employeeId: "EMP-1001", name: "Sarah Ahmed",     department: "Engineering", designation: "Engineering Manager", concern: "Product & platform teams", photo: "" },
  { hostId: "HST-002", orgId: "ORG-001", employeeId: "EMP-1002", name: "Karim Hossain",   department: "Sales",       designation: "Key Account Lead",    concern: "Enterprise accounts",      photo: "" },
  { hostId: "HST-003", orgId: "ORG-001", employeeId: "EMP-1003", name: "Nadia Islam",     department: "People",      designation: "Head of People",      concern: "Hiring & interviews",      photo: "" },
  { hostId: "HST-004", orgId: "ORG-001", employeeId: "EMP-1004", name: "Tariq Chowdhury", department: "Facilities",  designation: "Facilities Manager",  concern: "Contractors & maintenance", photo: "" },
  { hostId: "HST-005", orgId: "ORG-001", employeeId: "EMP-1005", name: "Imran Khalid",    department: "Finance",     designation: "Finance Controller",  concern: "Vendors & audit",          photo: "" },
  { hostId: "HST-006", orgId: "ORG-001", employeeId: "EMP-1006", name: "Ayesha Siddika",  department: "Operations",  designation: "Operations Lead",     concern: "Deliveries & logistics",   photo: "" },
  { hostId: "HST-051", orgId: "ORG-002", employeeId: "EMP-2001", name: "Sabbir Rahman",   department: "Operations",  designation: "Depot Manager",       concern: "Fleet & dispatch",         photo: "" },
  { hostId: "HST-052", orgId: "ORG-002", employeeId: "EMP-2002", name: "Farhana Yasmin",  department: "Finance",     designation: "Accounts Manager",    concern: "Billing & vendors",        photo: "" },
];

/* ------------------------------------------------------------------
   User master — demo credentials, shown on the sign-in screen
   ------------------------------------------------------------------ */
export const SEED_USERS = [
  { userId: "USR-001", orgId: "ORG-001", loginId: "admin",     password: "admin123",  userType: "admin",     employeeId: "EMP-1000", name: "Rumana Haque", active: true },
  { userId: "USR-002", orgId: "ORG-001", loginId: "reception", password: "desk123",   userType: "reception", employeeId: "EMP-1010", name: "Reception Desk", active: true },
  { userId: "USR-003", orgId: "ORG-001", loginId: "sarah",     password: "host123",   userType: "host",      employeeId: "EMP-1001", name: "Sarah Ahmed",  active: true },
  { userId: "USR-051", orgId: "ORG-002", loginId: "meridian",  password: "admin123",  userType: "admin",     employeeId: "EMP-2000", name: "Sabbir Rahman", active: true },
];

/* ------------------------------------------------------------------
   Visitor master
   ------------------------------------------------------------------ */
const PEOPLE = [
  ["Fatima", "Al-Zahra", "Sunstone Partners"],
  ["Rafiqul", "Islam", "Delta Freight"],
  ["Priya", "Sharma", "—"],
  ["Omar", "Faruk", "Vertex Contracting"],
  ["Nasrin", "Akter", "Swift Courier"],
  ["Mahbub", "Hasan", "Delta Freight"],
  ["Rezaul", "Karim", "Bluewave Media"],
  ["Lucia", "Romano", "Romano Design"],
  ["Daniel", "Osei", "Osei & Co"],
  ["Mei", "Tanaka", "Kyoto Systems"],
  ["Arjun", "Nair", "Nimbus Cloud"],
  ["Hannah", "Weiss", "Weiss Legal"],
  ["Yusuf", "Demir", "Anatolia Trade"],
  ["Clara", "Mendes", "Mendes Analytics"],
  ["Ivan", "Petrov", "Northline Steel"],
  ["Aisha", "Bello", "Bello Foods"],
  ["Tomas", "Novak", "Praha Tooling"],
  ["Sofia", "Garcia", "Garcia Interiors"],
  ["Liam", "O'Connor", "Shamrock IT"],
  ["Zara", "Habib", "Habib Textiles"],
];

const slug = s => s.toLowerCase().replace(/[^a-z]/g, "");

export function buildVisitorMaster() {
  return PEOPLE.map(([first, last, company], i) => ({
    visitorId: `VIS-${String(1001 + i)}`,
    orgId: "ORG-001",
    name: `${first} ${last}`,
    mobile: `+8801${(700000000 + i * 1234567).toString().slice(0, 9)}`,
    email: `${slug(first)}.${slug(last)}@example.com`,
    organization: company,
    cardImage: "",
    createdAt: new Date(Date.now() - (PEOPLE.length - i) * 86400000).toISOString(),
  }));
}

/* ------------------------------------------------------------------
   Visits
   ------------------------------------------------------------------ */
let counter = 1042;
const nextBadge = () => `FY-${counter++}`;

/** Builds the initial dataset: masters plus 30 days of visits and a live today. */
export function buildSeed() {
  const rand = rng(20260521);
  const today = new Date();
  const visitorMaster = buildVisitorMaster();
  const hosts = SEED_HOSTS.filter(h => h.orgId === "ORG-001");
  const visits = [];

  const pickVisitor = () => visitorMaster[Math.floor(rand() * visitorMaster.length)];
  const pickHost = () => hosts[Math.floor(rand() * hosts.length)];

  // --- History: last 30 days, weekdays busier than weekends ---
  for (let back = 30; back >= 1; back--) {
    const day = new Date(today);
    day.setDate(day.getDate() - back);
    const weekend = day.getDay() === 5 || day.getDay() === 6; // Fri/Sat weekend
    const count = weekend ? 1 + Math.floor(rand() * 3) : 8 + Math.floor(rand() * 8);

    for (let i = 0; i < count; i++) {
      const visitor = pickVisitor();
      const checkInAt = at(day, 8 + Math.floor(rand() * 10), Math.floor(rand() * 60));
      const wait = 3 + Math.floor(rand() * 18);
      const dwell = wait + 20 + Math.floor(rand() * 150);

      visits.push({
        id: `vst-${counter}-${Math.floor(rand() * 1e6)}`,
        orgId: "ORG-001",
        visitorId: visitor.visitorId,
        hostId: pickHost().hostId,
        purpose: PURPOSES[Math.floor(rand() * PURPOSES.length)],
        status: "out",
        checkInAt,
        meetingAt: plus(checkInAt, wait),
        checkOutAt: plus(checkInAt, dwell),
        expectedAt: null,
        badgeNo: nextBadge(),
        vehicle: "",
        notes: "",
        source: rand() > 0.5 ? "kiosk" : "desk",
      });
    }
  }

  // --- Today: waiting, in meeting, departed and expected ---
  const byName = name => visitorMaster.find(v => v.name === name).visitorId;

  const todayRows = [
    { name: "Fatima Al-Zahra", hostId: "HST-001", purpose: "Business meeting", h: 8,  m: 42, status: "meeting", wait: 6 },
    { name: "Rafiqul Islam",   hostId: "HST-002", purpose: "Client visit",     h: 9,  m: 15, status: "meeting", wait: 11 },
    { name: "Priya Sharma",    hostId: "HST-003", purpose: "Job interview",    h: 9,  m: 50, status: "waiting" },
    { name: "Omar Faruk",      hostId: "HST-004", purpose: "Contractor",       h: 10, m: 5,  status: "waiting" },
    { name: "Nasrin Akter",    hostId: "HST-006", purpose: "Delivery",         h: 7,  m: 30, status: "out", wait: 4,  dwell: 130 },
    { name: "Mahbub Hasan",    hostId: "HST-002", purpose: "Client visit",     h: 8,  m: 0,  status: "out", wait: 9,  dwell: 100 },
  ];

  for (const t of todayRows) {
    const checkInAt = at(today, t.h, t.m);
    visits.push({
      id: `vst-today-${slug(t.name)}`,
      orgId: "ORG-001",
      visitorId: byName(t.name),
      hostId: t.hostId,
      purpose: t.purpose,
      status: t.status,
      checkInAt,
      meetingAt: t.wait != null ? plus(checkInAt, t.wait) : null,
      checkOutAt: t.status === "out" ? plus(checkInAt, t.dwell) : null,
      expectedAt: null,
      badgeNo: nextBadge(),
      vehicle: "",
      notes: "",
      source: "desk",
    });
  }

  const expected = [
    { name: "Rezaul Karim", hostId: "HST-003", purpose: "Business meeting", h: 11, m: 0 },
    { name: "Lucia Romano", hostId: "HST-005", purpose: "Event / tour",     h: 11, m: 30 },
  ];

  for (const p of expected) {
    visits.push({
      id: `vst-prereg-${slug(p.name)}`,
      orgId: "ORG-001",
      visitorId: byName(p.name),
      hostId: p.hostId,
      purpose: p.purpose,
      status: "prereg",
      checkInAt: null,
      meetingAt: null,
      checkOutAt: null,
      expectedAt: at(today, p.h, p.m),
      badgeNo: nextBadge(),
      vehicle: "",
      notes: "",
      source: "desk",
    });
  }

  return {
    organizations: SEED_ORGS.map(o => ({ ...o })),
    users: SEED_USERS.map(u => ({ ...u })),
    hosts: SEED_HOSTS.map(h => ({ ...h })),
    visitors: visitorMaster,
    visits,
  };
}
