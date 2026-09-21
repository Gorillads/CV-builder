import type {
  AppState,
  ByLang,
  Category,
  LibraryItem,
} from "../model/types";

export interface CategorySeed {
  id: string;
  title: [string, string];
  blurb?: [string, string];
  onByDefault: boolean;
  items?: Array<{
    head: [string, string];
    meta?: string;
    comment?: [string, string];
    desc: [string, string];
    activities?: Array<[string, string]>;
  }>;
}

/** Everything a preset (or the blank default) needs to fully determine an
 *  AppState beyond the shared category/item-building logic in
 *  buildStateFromConfig: which categories/elements to seed, the design
 *  tokens that give it its look, and the header/tailor fields that show
 *  what belongs in those free-text spots too. */
export interface StateConfig {
  seeds: CategorySeed[];
  design: AppState["design"];
  header: AppState["header"];
  appliedTitle: ByLang<string>;
  /** Per-category display variant (see src/data/designTokens' VARIANTS);
   *  absent means every category uses the "standard" variant. */
  variant?: Record<string, string>;
}

/* The 16 built-in categories, in their default display order, all sharing
 * the exact same shape — a title plus zero or more elements (head/meta/
 * desc/activities). A category like Nøglekompetencer that's meant to read
 * as a compact pill list isn't a different kind of category; it just uses
 * a compact display variant (see src/data/designTokens' VARIANTS) on the
 * same element structure everything else uses. The "b_" prefix is just a
 * naming convention for lower-priority/detail categories (full project
 * list, all courses, tools, previous roles, publications, references) —
 * they sit later in the default order, so they're typically the first
 * content to overflow onto automatic "Bilag" pages once the CV exceeds one
 * page. Content here is generic placeholder copy, not a real resume: bring
 * your own content in-app or via CSV import (or start from one of the
 * example templates in src/data/presets.ts instead of a blank one). */
const SEEDS: CategorySeed[] = [
  {
    id: "profil",
    title: ["Profil", "Profile"],
    onByDefault: true,
    items: [
      {
        head: ["", ""],
        desc: [
          "Kort profiltekst der opsummerer din baggrund og hvad du søger. Redigér denne tekst direkte.",
          "Short profile summarising your background and what you're looking for. Edit this text directly.",
        ],
      },
    ],
  },
  {
    id: "kompetencer",
    title: ["Nøglekompetencer", "Core Competencies"],
    onByDefault: true,
    items: [
      {
        head: ["Projektledelse", "Project management"],
        desc: [
          "Kort forklaring af hvordan kompetencen er brugt i praksis.",
          "Short explanation of how the competency has been used in practice.",
        ],
      },
      {
        head: ["Stakeholder management", "Stakeholder management"],
        desc: [
          "Kort forklaring af, hvornår og hvordan kompetencen er anvendt.",
          "Short explanation of when and how the competency has been applied.",
        ],
      },
    ],
  },
  {
    id: "erfaring",
    title: ["Erfaring", "Experience"],
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
    onByDefault: true,
    items: [
      {
        head: ["Uddannelsestitel, Institution", "Degree Title, Institution"],
        meta: "2019–2023",
        desc: ["Kort beskrivelse af uddannelsen.", "Short description of the degree."],
        activities: [
          ["Relevant hovedfag eller speciale", "Relevant major or specialization"],
        ],
      },
    ],
  },
  {
    id: "kurser",
    title: ["Udvalgte fag", "Selected Courses"],
    onByDefault: true,
    items: [
      {
        head: ["Fagnavn", "Course Name"],
        meta: "2022",
        desc: ["Kort beskrivelse af faget og hvad du lærte.", "Short description of the course and what you learned."],
        activities: [
          ["Eksempel på en opgave eller et projekt fra faget", "Example of an assignment or project from the course"],
        ],
      },
    ],
  },
  {
    id: "sprog",
    title: ["Sprog", "Languages"],
    onByDefault: true,
    items: [
      {
        head: ["Dansk", "Danish"],
        meta: "Modersmål / Native",
        desc: ["Kan bruges professionelt i skrift og tale.", "Can be used professionally in writing and speech."],
        activities: [
          ["Anvendes dagligt på arbejdspladsen", "Used daily in the workplace"],
        ],
      },
      {
        head: ["Engelsk", "English"],
        meta: "Flydende / Fluent",
        desc: [
          "Flydende i tale og skrift, anvendt i internationalt samarbejde.",
          "Fluent in speech and writing, used in international collaboration.",
        ],
        activities: [
          ["Bruges til kommunikation med internationale kollegaer", "Used to communicate with international colleagues"],
        ],
      },
    ],
  },
  {
    id: "certificeringer",
    title: ["Certificeringer", "Certifications"],
    onByDefault: false,
    items: [],
  },
  {
    id: "referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [],
  },
  {
    id: "frivilligt",
    title: ["Frivilligt arbejde", "Volunteer Work"],
    onByDefault: false,
    items: [],
  },
  {
    id: "interesser",
    title: ["Interesser", "Interests"],
    onByDefault: false,
    items: [],
  },
  {
    id: "b_projektliste",
    title: ["Fuld projektliste", "Full Project List"],
    onByDefault: true,
    items: [],
  },
  {
    id: "b_kurser",
    title: ["Alle fag", "All Courses"],
    onByDefault: true,
    items: [],
  },
  {
    id: "b_vaerktoejer",
    title: ["Værktøjer og software", "Tools and Software"],
    onByDefault: true,
    items: [],
  },
  {
    id: "b_publikationer",
    title: ["Publikationer og oplæg", "Publications and Talks"],
    onByDefault: false,
    items: [],
  },
  {
    id: "b_tidligere",
    title: ["Tidligere ansættelser", "Previous Roles"],
    onByDefault: true,
    items: [],
  },
  {
    id: "b_referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [],
  },
];

const DEFAULT_DESIGN: AppState["design"] = {
  font: "industry",
  scheme: "staal",
  headSize: "auto",
  struct: "single",
  headKind: "left",
  density: "4",
  sidebarSide: "right",
  headingSize: "auto",
  textSize: "auto",
  elementTextSize: "auto",
  contactSize: "auto",
  logoSize: "auto",
  sectionGap: "auto",
  entryGap: "auto",
  photoSize: "standard",
  photoPosition: "left",
  footer: { enabled: false, revision: "" },
};

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}${seq}`;
}

/** Shared by the blank default state and every preset in
 *  src/data/presets.ts — turns a seed list plus design/header/tailor
 *  fields into a full, ready-to-use AppState. */
export function buildStateFromConfig(config: StateConfig): AppState {
  const categories: Record<string, Category> = {};
  const items: Record<string, LibraryItem> = {};
  const selectedItems: Record<string, string[]> = {};
  const itemOrder: Record<string, string[]> = {};
  const on: Record<string, boolean> = {};
  const order: string[] = [];

  config.seeds.forEach((seed) => {
    categories[seed.id] = {
      id: seed.id,
      title: { da: seed.title[0], en: seed.title[1] },
      blurb: { da: seed.blurb?.[0] ?? "", en: seed.blurb?.[1] ?? "" },
      isCustom: false,
      isHidden: false,
      isCollapsed: false,
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
          comment: it.comment?.[0] ?? "",
          desc: it.desc[0],
        },
        en: {
          head: it.head[1],
          meta: it.meta ?? "",
          comment: it.comment?.[1] ?? "",
          desc: it.desc[1],
        },
        activities: (it.activities ?? []).map(([da, en]) => ({ da, en, isCollapsed: false })),
        isCollapsed: false,
        logo: "",
        logoVisible: true,
      };
      ids.push(id);
    });
    selectedItems[seed.id] = ids;
    itemOrder[seed.id] = [...ids];
  });

  return {
    lang: "da",
    order,
    categories,
    items,
    on,
    selectedItems,
    itemOrder,
    selectedActivities: {},
    variant: { ...(config.variant ?? {}) },
    activityStyle: {},
    sidebarPlacement: {},
    appliedTitle: config.appliedTitle,
    header: config.header,
    design: config.design,
  };
}

export function createDefaultState(): AppState {
  return buildStateFromConfig({
    seeds: SEEDS,
    design: DEFAULT_DESIGN,
    header: { name: "", address: "", phone: "", mail: "", location: { da: "", en: "" }, photo: "" },
    appliedTitle: { da: "", en: "" },
  });
}
