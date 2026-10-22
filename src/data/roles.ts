export const ROLE_LABELS_UI: Record<string, string> = {
  patient: "Пацієнт",
  employee: "Працівник лікарні",
  operator: "Оператор",
  department_head: "Завідувач відділення",
  executive_secretary: "Відповідальний секретар",
  deputy_director: "Заступник директора",
  med_director: "Медичний директор",
  main_director: "Генеральний директор",
  sysadmin: "Системний адміністратор",
};

export const ROLE_ICONS_UI: Record<string, string> = {
  patient: "mdi:account",
  employee: "mdi:hospital-building",
  operator: "mdi:headset",
  department_head: "mdi:door-open",
  deputy_director: "mdi:account-tie",
  executive_secretary: "mdi:notebook-edit-outline",
  med_director: "mdi:doctor",
  main_director: "mdi:crown",
  sysadmin: "mdi:shield-cog",
};

export const REVIEWER_ROLES_UI = [
  "sysadmin",
  "main_director",
  "med_director",
  "deputy_director",
];
export const ASSIGNER_ROLES_UI = [
  "sysadmin",
  "main_director",
  "med_director",
  "deputy_director",
];
export const MANAGE_ANN_ROLES_UI = [
  "sysadmin",
  "main_director",
  "med_director",
  "deputy_director",
];
export const APPOINTMENT_REVIEW_ROLES_UI = ["sysadmin", "operator"];
export const STAFF_ROLES_UI = [
  "sysadmin",
  "main_director",
  "med_director",
  "deputy_director",
  "department_head",
  "executive_secretary",
  "employee",
  "operator",
];

export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}
