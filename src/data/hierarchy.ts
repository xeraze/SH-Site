import { PERSONALIZATION_ITEMS } from "./personalization";

export interface Department {
  id: string;
  name: string;
  description: string;
}

const DEPT_ORDER = [
  "dept_admission",
  "dept_polyclinic",
  "dept_therapeutic",
  "dept_therapeutic2",
  "dept_surgical",
  "dept_anesthesia",
  "dept_functional",
  "dept_lab",
  "dept_pathomorph",
  "dept_admin",
];

const DESCRIPTIONS: Record<string, string> = {
  dept_admission:
    "Первинний прийом, огляд та маршрутизація пацієнтів до профільних відділень. Цілодобовий прийом хворих з ургентними станами.",
  dept_polyclinic:
    "Амбулаторний прийом пацієнтів, планові консультації профільних лікарів, профілактичні огляди.",
  dept_therapeutic:
    "Лікування терапевтичних захворювань дорослих пацієнтів: хвороби органів дихання, серцево-судинної системи, травлення.",
  dept_therapeutic2:
    "Лікування терапевтичних захворювань дорослих пацієнтів: ендокринологія, нефрологія, неврологія.",
  dept_surgical:
    "Планові та ургентні хірургічні втручання. Прийом пацієнтів з травмами та гострими хірургічними станами.",
  dept_anesthesia:
    "Анестезіологічне забезпечення операцій, знеболення та інтенсивна терапія пацієнтів з важкими станами, нагляд у післяопераційному періоді.",
  dept_functional:
    "Ультразвукові дослідження, електрокардіографія, функціональне обстеження пацієнтів за призначенням лікаря.",
  dept_lab:
    "Лабораторні дослідження крові, сечі та інших біологічних матеріалів. Прийом аналізів за направленням лікаря.",
  dept_pathomorph:
    "Патоморфологічні дослідження, гістологічна експертиза, цитологічні дослідження.",
  dept_admin:
    "Забезпечує господарську, організаційну та технічну діяльність закладу: кадрове діловодство, фінансова робота, матеріально-технічне забезпечення.",
};

const deptItems = PERSONALIZATION_ITEMS.filter((i) => i.category === "department");

function toItem(id: string) {
  return deptItems.find((i) => i.id === id);
}

export const departments: Department[] = [
  ...DEPT_ORDER.filter((id) => Boolean(toItem(id))).map((id) => ({
    id,
    name: toItem(id)?.label ?? id,
    description: DESCRIPTIONS[id] ?? "",
  })),
  ...deptItems
    .filter((i) => !DEPT_ORDER.includes(i.id))
    .map((i) => ({
      id: i.id,
      name: i.label,
      description: DESCRIPTIONS[i.id] ?? "",
    })),
];
