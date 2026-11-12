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
  { id: "qualification", label: "Професійна кваліфікація" },
  { id: "medical_staff", label: "Медичний персонал" },
  { id: "department", label: "Структурний підрозділ" },
  { id: "administration", label: "Адміністрація закладу" },
];

export const PERSONALIZATION_ITEMS: PersonalizationItem[] = [
  { id: "category_high", label: "Вища кваліфікаційна категорія", category: "qualification" },
  { id: "category_first", label: "Перша кваліфікаційна категорія", category: "qualification" },
  { id: "category_second", label: "Друга кваліфікаційна категорія", category: "qualification" },
  { id: "category_none", label: "Спеціаліст без кваліфікаційної категорії", category: "qualification" },
  { id: "intern", label: "Лікар-інтерн", category: "qualification" },

  { id: "nurse_senior", label: "Старша сестра медична", category: "medical_staff" },
  { id: "nurse", label: "Сестра медична", category: "medical_staff" },
  { id: "nurse_anesthetist", label: "Сестра медична-анестезист", category: "medical_staff" },
  { id: "nurse_junior", label: "Молодша сестра медична", category: "medical_staff" },
  { id: "xray_lab", label: "Рентгенолаборант", category: "medical_staff" },
  { id: "paramedic_lab", label: "Фельдшер-лаборант", category: "medical_staff" },
  { id: "nurse_housekeeping", label: "Сестра-господиня", category: "medical_staff" },
  { id: "auxiliary", label: "Допоміжний персонал", category: "medical_staff" },

  { id: "dept_functional", label: "Відділення функціональної діагностики", category: "department" },
  { id: "dept_lab", label: "Клініко-діагностична лабораторія", category: "department" },
  { id: "dept_therapeutic", label: "Терапевтичне відділення", category: "department" },
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
