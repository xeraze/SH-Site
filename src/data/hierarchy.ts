export type RoleStatus = "vacant" | "occupied" | "limited";

export interface Role {
  id: string;
  title: string;
  description: string;
  status?: RoleStatus;
  occupied?: number;
  limit?: number;
}

export interface RoleLevel {
  id: string;
  label: string;
  colorAccent: string;
  roles: Role[];
}

export const roleHierarchy: RoleLevel[] = [
  {
    id: "board",
    label: "Рада директорів",
    colorAccent: "#8B2E4E",
    roles: [
      {
        id: "general-director",
        title: "Генеральний директор",
        description:
          "Вище керівництво лікарні. Визначає стратегічний розвиток закладу та затверджує ключові рішення Ради директорів.",
        status: "occupied",
      },
      {
        id: "board-chair",
        title: "Голова Ради директорів",
        description:
          "Очолює Раду директорів, координує роботу вищого керівного складу лікарні.",
        status: "occupied",
      },
    ],
  },
  {
    id: "administration",
    label: "Адміністрація",
    colorAccent: "#2E5C8B",
    roles: [
      {
        id: "medical-director",
        title: "Медичний директор",
        description:
          "Відповідає за організацію лікувального процесу та якість медичної допомоги в закладі.",
        status: "occupied",
      },
      {
        id: "financial-director",
        title: "Фінансовий директор",
        description: "Керує фінансовою діяльністю та бюджетом лікарні.",
        status: "occupied",
      },
      {
        id: "executive-director",
        title: "Виконавчий директор",
        description:
          "Забезпечує виконання поточних адміністративних та організаційних завдань лікарні.",
        status: "vacant",
      },
      {
        id: "head-nurse",
        title: "Головна медсестра",
        description:
          "Координує роботу середнього та молодшого медичного персоналу всіх відділень.",
        status: "occupied",
      },
      {
        id: "chief-accountant",
        title: "Головний бухгалтер",
        description: "Відповідає за бухгалтерський облік та фінансову звітність.",
        status: "vacant",
      },
      {
        id: "hr-specialist",
        title: "Спеціаліст відділу кадрів",
        description: "Веде кадровий облік, оформлює прийом та переведення персоналу.",
        status: "vacant",
      },
      {
        id: "legal-counsel",
        title: "Юрисконсульт",
        description: "Надає правовий супровід діяльності лікарні.",
        status: "vacant",
      },
      {
        id: "accountant",
        title: "Бухгалтер",
        description: "Веде поточну фінансову документацію закладу.",
        status: "vacant",
      },
    ],
  },
  {
    id: "leadership",
    label: "Керівництво відділень",
    colorAccent: "#2E8B8B",
    roles: [
      {
        id: "head-polyclinic",
        title: "Завідувач Поліклінічного відділення",
        description: "Керує роботою поліклінічного відділення та амбулаторним прийомом.",
        status: "vacant",
      },
      {
        id: "head-reception",
        title: "Завідувач Приймального відділення",
        description: "Відповідає за первинний прийом та маршрутизацію пацієнтів.",
        status: "vacant",
      },
      {
        id: "head-diagnostic",
        title: "Завідувач Консультативно-діагностичного відділення",
        description: "Керує діагностичними службами та консультативною допомогою.",
        status: "vacant",
      },
      {
        id: "head-internal",
        title: "Завідувач відділення внутрішніх хвороб",
        description: "Відповідає за лікування терапевтичних пацієнтів.",
        status: "vacant",
      },
      {
        id: "head-anesthesiology",
        title: "Завідувач відділення анестезіології з ліжками інтенсивної терапії",
        description: "Керує анестезіологічною службою та палатами інтенсивної терапії.",
        status: "vacant",
      },
      {
        id: "head-maternity",
        title: "Завідувач Пологового відділення",
        description: "Відповідає за ведення вагітності, пологи та післяпологовий догляд.",
        status: "vacant",
      },
      {
        id: "head-surgery",
        title: "Завідувач Хірургічного відділення",
        description: "Керує хірургічною службою лікарні.",
        status: "vacant",
      },
      {
        id: "head-infectious",
        title: "Завідувач Інфекційного відділення",
        description: "Відповідає за лікування пацієнтів з інфекційними захворюваннями.",
        status: "vacant",
      },
      {
        id: "head-ophthalmology",
        title: "Завідувач Офтальмологічного кабінету",
        description: "Керує офтальмологічною допомогою в закладі.",
        status: "vacant",
      },
      {
        id: "head-dentistry",
        title: "Завідувач Стоматологічного кабінету",
        description: "Відповідає за стоматологічну допомогу.",
        status: "vacant",
      },
      {
        id: "head-rehab",
        title: "Завідувач Реабілітаційного кабінету",
        description: "Керує процесом реабілітації пацієнтів.",
        status: "vacant",
      },
      {
        id: "head-pathology",
        title: "Завідувач Патологоанатомічного відділення",
        description: "Відповідає за патологоанатомічні дослідження.",
        status: "vacant",
      },
      {
        id: "head-admin-dept",
        title: "Завідувач Адміністративного відділення",
        description: "Керує адміністративно-господарською діяльністю.",
        status: "vacant",
      },
    ],
  },
  {
    id: "doctors",
    label: "Лікарський персонал",
    colorAccent: "#4A5FBF",
    roles: [
      {
        id: "doctor-intern",
        title: "Лікар-інтерн",
        description: "Лікар на етапі первинної спеціалізації під наглядом досвідчених колег.",
      },
      {
        id: "doctor",
        title: "Лікар",
        description:
          "Відповідає за постановку діагнозів, лікування хворих та ведення пацієнтів у межах своєї спеціальності. Кваліфікаційна категорія відображається окремо на Discord-сервері лікарні.",
      },
    ],
  },
  {
    id: "mid-personnel",
    label: "Середній медичний персонал",
    colorAccent: "#2E8B8B",
    roles: [
      {
        id: "head-nurse-role",
        title: "Старша медсестра/медбрат",
        description: "Координує роботу медсестринського персоналу відділення.",
        status: "occupied",
      },
      {
        id: "nurse",
        title: "Медсестра/медбрат",
        description:
          "Виконує медичні маніпуляції та догляд за пацієнтами. Кваліфікаційна категорія відображається окремо на Discord-сервері лікарні.",
      },
      {
        id: "radiology-tech",
        title: "Рентгенолаборант",
        description: "Проводить рентгенологічні дослідження.",
      },
      {
        id: "lab-assistant",
        title: "Фельдшер-лаборант",
        description: "Виконує лабораторні дослідження та аналізи.",
      },
    ],
  },
  {
    id: "junior-personnel",
    label: "Молодший медичний персонал",
    colorAccent: "#C97A3D",
    roles: [
      {
        id: "housekeeper",
        title: "Сестра/брат-господиня",
        description: "Відповідає за господарське забезпечення відділення.",
      },
      {
        id: "orderly",
        title: "Санітар",
        description: "Забезпечує санітарний догляд та допомогу пацієнтам.",
      },
      {
        id: "support-staff",
        title: "Допоміжний персонал",
        description:
          "Працівники технічних служб, охорони та харчоблоку. Пильнують лад у лікарні, допомагають у щоденних турботах і підтримують належний порядок.",
      },
    ],
  },
];

export interface Department {
  id: string;
  name: string;
  description: string;
}

export const departments: Department[] = [
  {
    id: "polyclinic",
    name: "Поліклінічне відділення",
    description: "Амбулаторний прийом пацієнтів, планові консультації профільних лікарів.",
  },
  {
    id: "reception",
    name: "Приймальне відділення",
    description: "Первинний прийом, огляд та маршрутизація пацієнтів до профільних відділень.",
  },
  {
    id: "diagnostic",
    name: "Консультативно-діагностичне відділення",
    description: "Діагностичні дослідження та консультації суміжних спеціалістів.",
  },
  {
    id: "internal",
    name: "Відділення внутрішніх хвороб",
    description: "Лікування терапевтичних захворювань дорослих пацієнтів.",
  },
  {
    id: "anesthesiology",
    name: "Відділення анестезіології з ліжками інтенсивної терапії",
    description: "Анестезіологічний супровід операцій та інтенсивна терапія важких пацієнтів.",
  },
  {
    id: "maternity",
    name: "Пологове відділення",
    description: "Ведення вагітності, пологова допомога та післяпологовий догляд.",
  },
  {
    id: "surgery",
    name: "Хірургічне відділення",
    description: "Планові та ургентні хірургічні втручання.",
  },
  {
    id: "infectious",
    name: "Інфекційне відділення",
    description: "Діагностика та лікування інфекційних захворювань в ізольованих умовах.",
  },
  {
    id: "ophthalmology",
    name: "Офтальмологічний кабінет",
    description: "Діагностика та лікування захворювань органів зору.",
  },
  {
    id: "dentistry",
    name: "Стоматологічний кабінет",
    description: "Стоматологічна допомога та профілактичні огляди.",
  },
  {
    id: "rehab",
    name: "Реабілітаційний кабінет",
    description: "Відновлювальне лікування та фізична реабілітація пацієнтів.",
  },
  {
    id: "pathology",
    name: "Патологоанатомічне відділення",
    description: "Патологоанатомічні дослідження та експертизи.",
  },
  {
    id: "administrative",
    name: "Адміністративне відділення",
    description: "Організаційно-господарче забезпечення роботи лікарні.",
  },
];