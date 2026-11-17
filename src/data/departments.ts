export interface PersonalizationCategory {
  id: string;
  label: string;
}

export interface PersonalizationItem {
  id: string;
  label: string;
  category: string;
}

export const PERSONALIZATION_CATEGORIES: PersonalizationCategory[] = [
  { id: "department", label: "Структурний підрозділ" },
  { id: "administration", label: "Адміністрація закладу" },
];

export const PERSONALIZATION_ITEMS: PersonalizationItem[] = [
  { id: "dept_functional", label: "Відділення функціональної діагностики", category: "department" },
  { id: "dept_lab", label: "Клініко-діагностична лабораторія", category: "department" },
  { id: "dept_therapeutic", label: "Терапевтичне відділення №1", category: "department" },
  { id: "dept_therapeutic2", label: "Терапевтичне відділення №2", category: "department" },
  { id: "dept_surgical", label: "Хірургічне відділення", category: "department" },
  { id: "dept_anesthesia", label: "Відділення анестезіології та інтенсивної терапії", category: "department" },
  { id: "dept_polyclinic", label: "Поліклінічне відділення", category: "department" },
  { id: "dept_admission", label: "Приймальне відділення", category: "department" },
  { id: "dept_pathomorph", label: "Патоморфологічне відділення", category: "department" },
  { id: "dept_admin", label: "Адміністративне відділення", category: "department" },

  { id: "exec_secretary", label: "Відповідальний секретар", category: "administration" },
];

export function personalizationLabels(
  ids: string[],
  items: PersonalizationItem[] = PERSONALIZATION_ITEMS,
): { category: string; label: string; id: string }[] {
  return ids
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is PersonalizationItem => Boolean(i))
    .map((i) => ({
      id: i.id,
      label: i.label,
      category: PERSONALIZATION_CATEGORIES.find((c) => c.id === i.category)?.label ?? "",
    }));
}
