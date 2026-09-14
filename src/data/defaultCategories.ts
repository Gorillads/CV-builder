import type {
  AppState,
  Category,
  CategoryKind,
  LibraryItem,
} from "../model/types";

interface CategorySeed {
  id: string;
  title: [string, string];
  blurb?: [string, string];
  kind: CategoryKind;
  onByDefault: boolean;
  items?: Array<{
    head: [string, string];
    meta?: string;
    desc: [string, string];
    activities?: Array<[string, string]>;
    tagValue?: [string, string];
  }>;
}

/* The 16 built-in categories, in their default display order. The "b_"
 * prefix is just a naming convention for lower-priority/detail categories
 * (full project list, all courses, tools, previous roles, publications,
 * references) — it isn't a different category kind. They sit later in
 * the default order, so they're typically the first content to overflow
 * onto automatic "Bilag" pages once the CV exceeds one page. Content here
 * is generic placeholder copy, not a real resume: bring your own content
 * in-app or via CSV import. */
const SEEDS: CategorySeed[] = [
  {
    id: "profil",
    title: ["Profil", "Profile"],
    kind: null,
    onByDefault: true,
    blurb: [
      "Kort profiltekst der opsummerer din baggrund og hvad du søger. Redigér denne tekst direkte.",
      "Short profile summarising your background and what you're looking for. Edit this text directly.",
    ],
  },
  {
    id: "kompetencer",
    title: ["Nøglekompetencer", "Core Competencies"],
    kind: "tags",
    onByDefault: true,
    items: [
      { head: ["Kompetence", "Competency"], desc: ["", ""], tagValue: ["Projektledelse", "Project management"] },
      { head: ["Kompetence", "Competency"], desc: ["", ""], tagValue: ["Stakeholder management", "Stakeholder management"] },
    ],
  },
  {
    id: "erfaring",
    title: ["Erfaring", "Experience"],
    kind: "entry",
    onByDefault: true,
    items: [
      {
        head: ["Stillingstitel, Virksomhed", "Job Title, Company"],
        meta: "2023–nu",
        desc: [
          "Kort beskrivelse af rollen og ansvarsområder.",
          "Short description of the role and responsibilities.",
        ],
        activities: [
          ["Eksempel på en konkret leverance eller resultat", "Example of a concrete deliverable or result"],
          ["Endnu et eksempel på en aktivitet i rollen", "Another example of an activity in the role"],
        ],
      },
    ],
  },
  {
    id: "uddannelse",
    title: ["Uddannelse", "Education"],
    kind: "entry",
    onByDefault: true,
    items: [
      {
        head: ["Uddannelsestitel, Institution", "Degree Title, Institution"],
        meta: "2019–2023",
        desc: ["Kort beskrivelse af uddannelsen.", "Short description of the degree."],
        activities: [],
      },
    ],
  },
  {
    id: "kurser",
    title: ["Udvalgte fag", "Selected Courses"],
    kind: "entry",
    onByDefault: true,
    items: [
      { head: ["Fagnavn", "Course Name"], meta: "2022", desc: ["", ""], activities: [] },
    ],
  },
  {
    id: "sprog",
    title: ["Sprog", "Languages"],
    kind: "entry",
    onByDefault: true,
    items: [
      { head: ["Dansk", "Danish"], meta: "Modersmål / Native", desc: ["", ""], activities: [] },
      { head: ["Engelsk", "English"], meta: "Flydende / Fluent", desc: ["", ""], activities: [] },
    ],
  },
  {
    id: "certificeringer",
    title: ["Certificeringer", "Certifications"],
    kind: "entry",
    onByDefault: false,
    items: [],
  },
  {
    id: "referencer",
    title: ["Referencer", "References"],
    kind: "entry",
    onByDefault: false,
    items: [],
  },
  {
    id: "frivilligt",
    title: ["Frivilligt arbejde", "Volunteer Work"],
    kind: "entry",
    onByDefault: false,
    items: [],
  },
  {
    id: "interesser",
    title: ["Interesser", "Interests"],
    kind: "tags",
    onByDefault: false,
    items: [],
  },
  {
    id: "b_projektliste",
    title: ["Fuld projektliste", "Full Project List"],
    kind: "entry",
    onByDefault: true,
    items: [],
  },
  {
    id: "b_kurser",
    title: ["Alle fag", "All Courses"],
    kind: "entry",
    onByDefault: true,
    items: [],
  },
  {
    id: "b_vaerktoejer",
    title: ["Værktøjer og software", "Tools and Software"],
    kind: "tags",
    onByDefault: true,
    items: [],
  },
  {
    id: "b_publikationer",
    title: ["Publikationer og oplæg", "Publications and Talks"],
    kind: "entry",
    onByDefault: false,
    items: [],
  },
  {
    id: "b_tidligere",
    title: ["Tidligere ansættelser", "Previous Roles"],
    kind: "entry",
    onByDefault: true,
    items: [],
  },
  {
    id: "b_referencer",
    title: ["Referencer", "References"],
    kind: "entry",
    onByDefault: false,
    items: [],
  },
];

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}${seq}`;
}

export function createDefaultState(): AppState {
  const categories: Record<string, Category> = {};
  const items: Record<string, LibraryItem> = {};
  const selectedItems: Record<string, string[]> = {};
  const on: Record<string, boolean> = {};
  const order: string[] = [];

  SEEDS.forEach((seed) => {
    categories[seed.id] = {
      id: seed.id,
      title: { da: seed.title[0], en: seed.title[1] },
      blurb: { da: seed.blurb?.[0] ?? "", en: seed.blurb?.[1] ?? "" },
      kind: seed.kind,
      isCustom: false,
      isHidden: false,
      isReplacedByImport: false,
    };
    on[seed.id] = seed.onByDefault;
    order.push(seed.id);

    const ids: string[] = [];
    (seed.items ?? []).forEach((it) => {
      const id = nextId("seed");
      items[id] = {
        id,
        categoryId: seed.id,
        isUserCreated: false,
        da: {
          head: it.head[0],
          meta: it.meta ?? "",
          desc: it.desc[0],
          tagValue: it.tagValue?.[0] ?? "",
        },
        en: {
          head: it.head[1],
          meta: it.meta ?? "",
          desc: it.desc[1],
          tagValue: it.tagValue?.[1] ?? "",
        },
        activities: (it.activities ?? []).map(([da, en]) => ({ da, en })),
        group: { da: "", en: "" },
      };
      ids.push(id);
    });
    selectedItems[seed.id] = ids;
  });

  return {
    lang: "da",
    order,
    categories,
    items,
    on,
    selectedItems,
    selectedActivities: {},
    variant: {},
    appliedTitle: { da: "", en: "" },
    keywords: { da: "", en: "" },
    header: {
      name: "",
      phone: "",
      mail: "",
      location: { da: "", en: "" },
    },
    design: {
      font: "industry",
      scheme: "staal",
      headSize: "standard",
      struct: "single",
      headKind: "left",
      density: "standard",
      sidebarSide: "right",
      headingSize: "standard",
      footer: { enabled: false, revision: "" },
    },
  };
}
