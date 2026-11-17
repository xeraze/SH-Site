export {
  APPOINTMENT_REVIEW_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  REVIEWER_ROLES_UI,
  ROLE_ICONS_UI,
  ROLE_LABELS_UI,
  STAFF_ROLES_UI,
  hasAnyRole,
  isDoctorPosition,
  positionOf,
} from "./positions";

export type StaffStatus = "patient" | "active" | "vacation";

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  patient: "Пацієнт",
  active: "Працівник лікарні",
  vacation: "У відпустці",
};

export const STAFF_STATUS_ORDER: StaffStatus[] = ["patient", "active", "vacation"];

export function isStaffStatus(value: unknown): value is StaffStatus {
  return value === "patient" || value === "active" || value === "vacation";
}

export function toStaffStatus(value: string | null | undefined): StaffStatus {
  return isStaffStatus(value) ? value : "patient";
}
