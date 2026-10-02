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
          "Indsæt her en kort profiltekst, der opsummerer din baggrund, dine styrker og hvad der kendetegner dig fagligt.",
          "Insert a short profile here summarising your background, your strengths, and what characterises you professionally.",
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
        head: ["Kompetence", "Skill"],
        desc: [
          "Indsæt en af dine kompetencer her, og en kort forklaring af, hvordan du har brugt den.",
          "Insert one of your skills here, and a short explanation of how you've used it.",
        ],
      },
      {
        head: ["Endnu en kompetence", "Another skill"],
        desc: [
          "Indsæt endnu et konkret eksempel på en kompetence og hvornår den er blevet anvendt.",
          "Insert another concrete example of a skill and when it's been applied.",
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
        meta: "Angiv år / Insert year",
        desc: [
          "Indsæt her en kort beskrivelse af rollen og dine ansvarsområder.",
          "Insert a short description of the role and your responsibilities here.",
        ],
        activities: [
          ["Indsæt et konkret resultat eller en leverance fra rollen", "Insert a concrete result or deliverable from the role"],
          ["Indsæt endnu et eksempel på en relevant aktivitet i rollen", "Insert another example of a relevant activity in the role"],
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
        meta: "Angiv år / Insert year",
        desc: ["Indsæt her en kort beskrivelse af uddannelsen.", "Insert a short description of the degree here."],
        activities: [
          ["Indsæt et relevant hovedfag eller speciale", "Insert a relevant major or specialization"],
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
        meta: "Angiv år / Insert year",
        desc: [
          "Indsæt her en kort beskrivelse af faget, og hvad du lærte.",
          "Insert a short description of the course here, and what you learned.",
        ],
        activities: [
          ["Indsæt et eksempel på en opgave eller et projekt fra faget", "Insert an example of an assignment or project from the course"],
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

/** The "Modern" preset's look (see MODERN_SEEDS/the "modern" Preset entry
 *  in presets.ts) — shared from here, rather than presets.ts, so the blank
 *  default state below can also open in it without presets.ts importing
 *  back into this module. */
export const MODERN_DESIGN: AppState["design"] = {
  font: "plex",
  scheme: "staal",
  headSize: "4",
  struct: "sidebar",
  headKind: "left",
  density: "4",
  sidebarSide: "right",
  sidebarWidth: "33",
  headingSize: "4",
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
        logoSize: "auto",
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

/** The very first state a new document opens in (and what "Nulstil"/reset
 *  restores) — the Modern template's look, with every category's content
 *  replaced by instructions rather than a fictive person's CV, so it reads
 *  unmistakably as a template to fill in rather than someone else's resume. */
export function createDefaultState(): AppState {
  return buildStateFromConfig({
    seeds: SEEDS,
    design: MODERN_DESIGN,
    header: { name: "", address: "", phone: "", mail: "", location: { da: "", en: "" }, photo: "" },
    appliedTitle: { da: "", en: "" },
    variant: { kompetencer: "chips" },
  });
}
