export type PositionRight =
  | "appeals"
  | "callcenter"
  | "content"
  | "manage"
  | "admin";

export type PositionGroup = "administration" | "staff" | "doctors";

export interface PositionDef {
  id: string;
  label: string;
  group: PositionGroup;
  rank: number;
  rights: PositionRight[];
}

export const POSITION_GROUPS: { id: PositionGroup; label: string }[] = [
  { id: "administration", label: "Адміністрація" },
  { id: "staff", label: "Штатна посада" },
  { id: "doctors", label: "Медперсонал" },
];

const REVIEW_RIGHTS: PositionRight[] = ["appeals", "content", "manage"];
const NO_RIGHTS: PositionRight[] = [];
const FULL_RIGHTS: PositionRight[] = ["appeals", "content", "manage", "admin"];

const STAFF_POSITIONS: [string, string, number][] = [
  ["doctor", "Лікар", 34],
  ["doctor_intern", "Лікар-інтерн", 33],
  ["nurse", "Медична сестра", 32],
  ["sanitary", "Санітар", 31],
];

const STAFF_POSITION_DEFS: PositionDef[] = STAFF_POSITIONS.map(
  ([id, label, rank]) => ({
    id,
    label,
    group: "doctors" as const,
    rank,
    rights: NO_RIGHTS,
  }),
);

export const POSITIONS: PositionDef[] = [
  {
    id: "sysadmin",
    label: "Системний адміністратор",
    group: "administration",
    rank: 100,
    rights: FULL_RIGHTS,
  },
  {
    id: "main_director",
    label: "Генеральний директор",
    group: "administration",
    rank: 90,
    rights: REVIEW_RIGHTS,
  },
  {
    id: "med_director",
    label: "Медичний директор",
    group: "administration",
    rank: 80,
    rights: REVIEW_RIGHTS,
  },
  {
    id: "head_nurse",
    label: "Головна медична сестра",
    group: "administration",
    rank: 75,
    rights: NO_RIGHTS,
  },
  {
    id: "chief_accountant",
    label: "Головний бухгалтер",
    group: "administration",
    rank: 74,
    rights: NO_RIGHTS,
  },
  {
    id: "deputy_director",
    label: "Заступник директора",
    group: "administration",
    rank: 60,
    rights: REVIEW_RIGHTS,
  },
  {
    id: "department_head",
    label: "Завідувач відділення",
    group: "administration",
    rank: 50,
    rights: NO_RIGHTS,
  },
  { id: "lawyer", label: "Юрисконсульт", group: "staff", rank: 48, rights: NO_RIGHTS },
  { id: "accountant", label: "Бухгалтер", group: "staff", rank: 46, rights: NO_RIGHTS },
  {
    id: "operator",
    label: "Оператор кол-центру",
    group: "staff",
    rank: 40,
    rights: ["callcenter"],
  },
  {
    id: "employee",
    label: "Працівник лікарні",
    group: "staff",
    rank: 30,
    rights: NO_RIGHTS,
  },
  ...STAFF_POSITION_DEFS,
  { id: "patient", label: "Пацієнт", group: "staff", rank: 0, rights: NO_RIGHTS },
];

const POSITION_ICONS: Record<string, string> = {
  sysadmin: "mdi:shield-cog",
  main_director: "mdi:crown",
  med_director: "mdi:doctor",
  head_nurse: "mdi:medical-bag",
  chief_accountant: "mdi:account-cash",
  deputy_director: "mdi:account-tie",
  department_head: "mdi:door-open",
  lawyer: "mdi:gavel",
  accountant: "mdi:calculator-variant-outline",
  operator: "mdi:headset",
  employee: "mdi:hospital-building",
  patient: "mdi:account",
  doctor: "mdi:stethoscope",
  doctor_intern: "mdi:school",
  nurse: "mdi:medical-bag",
  sanitary: "mdi:spray-bottle",
};

const BY_ID: Map<string, PositionDef> = new Map(POSITIONS.map((p) => [p.id, p]));

export function positionOf(id: string): PositionDef | undefined {
  return BY_ID.get(id);
}

export function hasRight(roles: string[], right: PositionRight): boolean {
  return roles.some((r) => BY_ID.get(r)?.rights.includes(right) ?? false);
}

export function isDoctorPosition(id: string): boolean {
  return BY_ID.get(id)?.group === "doctors";
}

export function rolesWithRight(right: PositionRight): string[] {
  return POSITIONS.filter((p) => p.rights.includes(right)).map((p) => p.id);
}

export const ROLE_LABELS_UI: Record<string, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.id, p.label]),
);

export const ROLE_ICONS_UI: Record<string, string> = { ...POSITION_ICONS };

export function positionLabelsOf(roles: string[]): string[] {
  return roles
    .filter((r) => r !== "patient" && r !== "employee")
    .map((r) => ROLE_LABELS_UI[r] ?? r);
}

export const REVIEWER_ROLES_UI = rolesWithRight("appeals");
export const ASSIGNER_ROLES_UI = rolesWithRight("manage");
export const MANAGE_ANN_ROLES_UI = rolesWithRight("content");
export const APPOINTMENT_REVIEW_ROLES_UI = rolesWithRight("callcenter");
export const STAFF_ROLES_UI = POSITIONS.filter((p) => p.id !== "patient").map((p) => p.id);

export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}
