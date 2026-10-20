export interface StaffMember {
  id: string;
  fullName: string;
  gender: "male" | "female";
  positions: string[];
  departments: string[];
}

export const staffMembers: StaffMember[] = [
  {
    id: "radchenko",
    fullName: "Радченко Стефан Святославович",
    gender: "male",
    positions: ["Генеральний директор"],
    departments: ["Адміністративне відділення"],
  },
  {
    id: "edelshtein",
    fullName: "Едельштейн Ольга Миколаївна",
    gender: "female",
    positions: ["Медичний директор"],
    departments: ["Адміністративне відділення", "Відділення функціональної та променевої діагностики"],
  },
  {
    id: "pokrovskaya",
    fullName: "Покровська Анна Модестівна",
    gender: "female",
    positions: ["Заступник директора з питань терапії"],
    departments: ["Терапевтичне відділення №1", "Терапевтичне відділення №2"],
  },
  {
    id: "hipnoda",
    fullName: "Гіпнода Ірина Дмитрівна",
    gender: "female",
    positions: ["Заступник директора з питань ургентної допомоги"],
    departments: ["Приймальне відділення"],
  },
  {
    id: "polyakova",
    fullName: "Полякова Аміна Дмитрівна",
    gender: "female",
    positions: ["Головна медсестра"],
    departments: ["Адміністративне відділення"],
  },
  {
    id: "zakirko",
    fullName: "Люцим Дмитро Дмитрович",
    gender: "male",
    positions: [
      "Заступник директора з питань стратегічно важливих техніко-інформаційно-технологічних питань",
    ],
    departments: ["Адміністративне відділення"],
  },
];
