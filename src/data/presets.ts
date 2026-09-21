import type { AppState, ByLang } from "../model/types";
import type { CategorySeed, StateConfig } from "./defaultCategories";
import { buildStateFromConfig } from "./defaultCategories";

export interface Preset {
  id: string;
  name: ByLang<string>;
  description: ByLang<string>;
  config: StateConfig;
}

/* Three fully filled-out example CVs, one per persona, so a "Classic",
 * "Modern" or "Artistic" style also comes with content that shows what
 * belongs in every section — an empty CV gives no sense of what fits
 * where. Each persona reuses the same 16 built-in category ids as the
 * blank default (so hide/delete/reorder work exactly the same way
 * afterwards), just with real-sounding example text and matching design
 * tokens instead of empty categories and the generic default look. */

// ---------------------------------------------------------------------
// Classic — a traditional finance/accounting career.
// ---------------------------------------------------------------------

const CLASSIC_SEEDS: CategorySeed[] = [
  {
    id: "profil",
    title: ["Profil", "Profile"],
    onByDefault: true,
    items: [
      {
        head: ["", ""],
        desc: [
          "Erfaren økonomichef med mere end 15 års erfaring inden for regnskab, budgettering og finansiel rapportering i store danske virksomheder. Kendt for grundighed, pålidelighed og evnen til at skabe overblik i komplekse økonomiske processer.",
          "Experienced finance manager with more than 15 years of experience in accounting, budgeting and financial reporting at large Danish companies. Known for thoroughness, reliability and the ability to bring clarity to complex financial processes.",
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
        head: ["Årsregnskaber & IFRS", "Annual Reports & IFRS"],
        desc: [
          "Omfattende erfaring med udarbejdelse af årsregnskaber efter danske og internationale standarder.",
          "Extensive experience preparing annual reports under Danish and international accounting standards.",
        ],
      },
      {
        head: ["Budgettering & Forecasting", "Budgeting & Forecasting"],
        desc: [
          "Ansvarlig for koncernbudgetter og løbende forecasts til ledelsen.",
          "Responsible for group budgets and ongoing forecasts to management.",
        ],
      },
      {
        head: ["Ledelse af økonomifunktion", "Finance Team Leadership"],
        desc: [
          "Erfaring med at lede og udvikle et økonomiteam på op til 8 medarbejdere.",
          "Experience leading and developing a finance team of up to 8 employees.",
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
        head: ["Økonomichef, Nordisk Handel A/S", "Finance Manager, Nordisk Handel A/S"],
        meta: "2015–nu",
        comment: ["Fuldtid", "Full-time"],
        desc: [
          "Ansvarlig for den samlede økonomifunktion i en virksomhed med 200 medarbejdere og en årlig omsætning på 450 mio. kr.",
          "Responsible for the entire finance function at a company with 200 employees and annual revenue of DKK 450 million.",
        ],
        activities: [
          ["Reducerede månedsafslutningen fra 10 til 5 arbejdsdage", "Reduced the monthly closing process from 10 to 5 working days"],
          ["Implementerede nyt ERP-system på tværs af tre afdelinger", "Implemented a new ERP system across three departments"],
          ["Ansvarlig for revision og myndighedskontakt", "Responsible for the audit process and authority liaison"],
        ],
      },
      {
        head: ["Regnskabskonsulent, Deloitte", "Accounting Consultant, Deloitte"],
        meta: "2009–2015",
        comment: ["Fuldtid", "Full-time"],
        desc: [
          "Revision og regnskabsrådgivning for mellemstore virksomheder inden for industri og handel.",
          "Audit and accounting advisory for mid-sized companies in industry and trade.",
        ],
        activities: [
          ["Gennemførte revision af 20+ årsregnskaber årligt", "Carried out the audit of 20+ annual reports per year"],
          ["Rådgav klienter om skatteoptimering og selskabsstruktur", "Advised clients on tax optimisation and company structure"],
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
        head: ["Cand.merc. i Finansiering og Regnskab, CBS", "MSc in Finance and Accounting, CBS"],
        meta: "2005–2009",
        desc: [
          "Speciale i værdiansættelse af mellemstore danske virksomheder.",
          "Thesis on the valuation of mid-sized Danish companies.",
        ],
        activities: [
          ["Afsluttet med udmærkelse", "Graduated with distinction"],
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
        head: ["Skatteret og selskabsret", "Tax Law and Corporate Law"],
        meta: "2008",
        desc: [
          "Fordybelse i dansk skatte- og selskabsret med fokus på virksomhedsomstruktureringer.",
          "In-depth study of Danish tax and corporate law with a focus on corporate restructuring.",
        ],
        activities: [
          ["Skriftlig opgave om generationsskifte i familieejede virksomheder", "Written assignment on succession in family-owned companies"],
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
          "Anvendes i kommunikation med internationale revisorer og leverandører.",
          "Used in communication with international auditors and suppliers.",
        ],
        activities: [
          ["Forhandler kontrakter på engelsk", "Negotiates contracts in English"],
        ],
      },
    ],
  },
  {
    id: "certificeringer",
    title: ["Certificeringer", "Certifications"],
    onByDefault: false,
    items: [
      {
        head: ["Statsautoriseret revisor", "State-Authorised Public Accountant"],
        meta: "2012",
        desc: [
          "Beskikkelse udstedt af Erhvervsstyrelsen.",
          "Authorisation issued by the Danish Business Authority.",
        ],
      },
    ],
  },
  {
    id: "referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Peter Holm, Adm. direktør, Nordisk Handel A/S", "Peter Holm, CEO, Nordisk Handel A/S"],
        desc: [
          "Tidligere nærmeste leder. Kontaktes efter aftale vedrørende ledelseserfaring og faglig kompetence.",
          "Former direct manager. Available by prior arrangement to speak to leadership experience and professional competence.",
        ],
      },
    ],
  },
  {
    id: "frivilligt",
    title: ["Frivilligt arbejde", "Volunteer Work"],
    onByDefault: false,
    items: [
      {
        head: ["Kasserer, Lokal idrætsforening", "Treasurer, Local Sports Club"],
        meta: "2018–nu",
        desc: [
          "Ansvarlig for foreningens regnskab og budget for ca. 300 medlemmer.",
          "Responsible for the club's accounts and budget for around 300 members.",
        ],
      },
    ],
  },
  {
    id: "interesser",
    title: ["Interesser", "Interests"],
    onByDefault: false,
    items: [
      { head: ["Sejlsport", "Sailing"], desc: ["Sejler kapsejlads i lokal klub hver sommer.", "Races sailboats at a local club every summer."] },
      { head: ["Skak", "Chess"], desc: ["Spiller i den lokale skakklub.", "Plays at the local chess club."] },
    ],
  },
  {
    id: "b_projektliste",
    title: ["Fuld projektliste", "Full Project List"],
    onByDefault: true,
    items: [
      {
        head: ["Implementering af nyt ERP-system", "New ERP System Implementation"],
        meta: "2020",
        desc: [
          "Ledede projektet fra udbud til fuld idriftsættelse på tværs af økonomi, salg og lager.",
          "Led the project from tender to full go-live across finance, sales and warehousing.",
        ],
      },
    ],
  },
  {
    id: "b_kurser",
    title: ["Alle fag", "All Courses"],
    onByDefault: true,
    items: [
      { head: ["Videregående regnskabsteori", "Advanced Accounting Theory"], meta: "2007", desc: ["", ""] },
      { head: ["International skatteret", "International Tax Law"], meta: "2008", desc: ["", ""] },
    ],
  },
  {
    id: "b_vaerktoejer",
    title: ["Værktøjer og software", "Tools and Software"],
    onByDefault: true,
    items: [
      {
        head: ["Microsoft Dynamics 365", "Microsoft Dynamics 365"],
        desc: ["Dagligt brugt til bogføring, rapportering og budgetopfølgning.", "Used daily for bookkeeping, reporting and budget follow-up."],
      },
      {
        head: ["Excel (avanceret)", "Excel (advanced)"],
        desc: ["Herunder pivottabeller, makroer og finansiel modellering.", "Including pivot tables, macros and financial modelling."],
      },
    ],
  },
  {
    id: "b_publikationer",
    title: ["Publikationer og oplæg", "Publications and Talks"],
    onByDefault: false,
    items: [
      {
        head: ["Effektiv månedsafslutning i mellemstore virksomheder", "Efficient Month-End Closing in Mid-Sized Companies"],
        meta: "FSR – danske revisorer, 2021",
        desc: [
          "Oplæg om praktiske erfaringer med at accelerere regnskabsprocessen.",
          "Talk on practical experience accelerating the accounting process.",
        ],
      },
    ],
  },
  {
    id: "b_tidligere",
    title: ["Tidligere ansættelser", "Previous Roles"],
    onByDefault: true,
    items: [
      {
        head: ["Revisorassistent, KPMG", "Audit Assistant, KPMG"],
        meta: "2007–2009",
        desc: [
          "Assisterede ved revision af små og mellemstore virksomheder.",
          "Assisted with the audit of small and mid-sized companies.",
        ],
      },
    ],
  },
  {
    id: "b_referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Yderligere referencer", "Additional references"],
        desc: ["Udleveres på forespørgsel.", "Available upon request."],
      },
    ],
  },
];

const CLASSIC_DESIGN: AppState["design"] = {
  font: "aptos",
  scheme: "marine",
  headSize: "4",
  struct: "single",
  headKind: "left",
  density: "4",
  sidebarSide: "right",
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

// ---------------------------------------------------------------------
// Modern — a tech/product management career.
// ---------------------------------------------------------------------

const MODERN_SEEDS: CategorySeed[] = [
  {
    id: "profil",
    title: ["Profil", "Profile"],
    onByDefault: true,
    items: [
      {
        head: ["", ""],
        desc: [
          "Produktchef med 8 års erfaring i at lede tværfaglige teams gennem hele produktudviklingscyklussen, fra idé til lancering. Datadrevet tilgang med stærkt fokus på brugeroplevelse og forretningsresultater.",
          "Product manager with 8 years of experience leading cross-functional teams through the full product lifecycle, from idea to launch. Data-driven approach with a strong focus on user experience and business results.",
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
        head: ["Produktstrategi", "Product Strategy"],
        desc: [
          "Udvikler og prioriterer produktroadmaps i tæt samarbejde med design, udvikling og forretning.",
          "Develops and prioritises product roadmaps in close collaboration with design, engineering and business.",
        ],
      },
      {
        head: ["Datadrevet beslutningstagning", "Data-Driven Decision Making"],
        desc: [
          "Bruger A/B-test og brugerdata til at validere produktbeslutninger.",
          "Uses A/B testing and user data to validate product decisions.",
        ],
      },
      {
        head: ["Agil ledelse", "Agile Leadership"],
        desc: [
          "Erfaren Scrum-ejer for flere selvstyrende udviklingsteams.",
          "Experienced Scrum owner for multiple self-organising development teams.",
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
        head: ["Senior Product Manager, Vendo Tech", "Senior Product Manager, Vendo Tech"],
        meta: "2021–nu",
        comment: ["Fuldtid", "Full-time"],
        desc: [
          "Ansvarlig for produktporteføljen inden for betalingsløsninger, med et team på 12 udviklere og designere.",
          "Responsible for the product portfolio within payment solutions, leading a team of 12 developers and designers.",
        ],
        activities: [
          ["Øgede aktive brugere med 40% på 12 måneder gennem ny onboarding-flow", "Increased active users by 40% in 12 months through a new onboarding flow"],
          ["Lancerede tre større produktfunktioner fra idé til produktion", "Launched three major product features from idea to production"],
          ["Etablerede fælles OKR-proces på tværs af produktteams", "Established a shared OKR process across product teams"],
        ],
      },
      {
        head: ["Product Owner, ScaleUp Nordic", "Product Owner, ScaleUp Nordic"],
        meta: "2018–2021",
        comment: ["Fuldtid", "Full-time"],
        desc: [
          "Ejede produktbacklog for en SaaS-platform med 50.000+ brugere.",
          "Owned the product backlog for a SaaS platform with 50,000+ users.",
        ],
        activities: [
          ["Reducerede kundeafgang med 15% gennem forbedret onboarding", "Reduced customer churn by 15% through improved onboarding"],
          ["Faciliterede ugentlige sprintplanlægninger for to teams", "Facilitated weekly sprint planning for two teams"],
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
        head: ["Cand.merc. i Business Intelligence, CBS", "MSc in Business Intelligence, CBS"],
        meta: "2014–2018",
        desc: [
          "Speciale om brugeradfærd i digitale betalingsløsninger.",
          "Thesis on user behaviour in digital payment solutions.",
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
        head: ["Design Thinking og Innovation", "Design Thinking and Innovation"],
        meta: "2017",
        desc: [
          "Praktisk projektarbejde med udvikling af nye digitale produktkoncepter.",
          "Hands-on project work developing new digital product concepts.",
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
      },
      {
        head: ["Engelsk", "English"],
        meta: "Flydende / Fluent",
        desc: [
          "Anvendes dagligt i internationalt produktteam.",
          "Used daily in an international product team.",
        ],
      },
    ],
  },
  {
    id: "certificeringer",
    title: ["Certificeringer", "Certifications"],
    onByDefault: false,
    items: [
      {
        head: ["Certified Scrum Product Owner (CSPO)", "Certified Scrum Product Owner (CSPO)"],
        meta: "2019",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Kan formidles ved forespørgsel", "Available upon request"],
        desc: ["", ""],
      },
    ],
  },
  {
    id: "frivilligt",
    title: ["Frivilligt arbejde", "Volunteer Work"],
    onByDefault: false,
    items: [
      {
        head: ["Mentor, Tech Mentor Denmark", "Mentor, Tech Mentor Denmark"],
        desc: [
          "Mentorerer kvinder i starten af deres tech-karriere.",
          "Mentors women early in their tech careers.",
        ],
      },
    ],
  },
  {
    id: "interesser",
    title: ["Interesser", "Interests"],
    onByDefault: false,
    items: [
      { head: ["Løb", "Running"], desc: ["Løber halvmaraton et par gange om året.", "Runs a half marathon a couple of times a year."] },
      { head: ["Brætspil", "Board games"], desc: ["", ""] },
    ],
  },
  {
    id: "b_projektliste",
    title: ["Fuld projektliste", "Full Project List"],
    onByDefault: true,
    items: [
      {
        head: ["Ny onboarding-flow", "New Onboarding Flow"],
        meta: "2023",
        desc: [
          "Redesignede den fulde onboarding-oplevelse baseret på brugerinterviews og data.",
          "Redesigned the entire onboarding experience based on user interviews and data.",
        ],
      },
    ],
  },
  {
    id: "b_kurser",
    title: ["Alle fag", "All Courses"],
    onByDefault: true,
    items: [
      { head: ["Product Analytics", "Product Analytics"], meta: "2018", desc: ["", ""] },
      { head: ["Brugercentreret design", "User-Centred Design"], meta: "2017", desc: ["", ""] },
    ],
  },
  {
    id: "b_vaerktoejer",
    title: ["Værktøjer og software", "Tools and Software"],
    onByDefault: true,
    items: [
      { head: ["Figma", "Figma"], desc: ["Bruges til wireframes og prototyper.", "Used for wireframes and prototypes."] },
      { head: ["Jira & Confluence", "Jira & Confluence"], desc: ["Til roadmaps, backlog og dokumentation.", "For roadmaps, backlog and documentation."] },
      { head: ["SQL & Amplitude", "SQL & Amplitude"], desc: ["Til produktanalyse og opfølgning på nøgletal.", "For product analytics and tracking key metrics."] },
    ],
  },
  {
    id: "b_publikationer",
    title: ["Publikationer og oplæg", "Publications and Talks"],
    onByDefault: false,
    items: [
      {
        head: ["Sådan bygger du et produktteam der leverer", "How to Build a Product Team That Delivers"],
        meta: "ProductTank Copenhagen, 2022",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "b_tidligere",
    title: ["Tidligere ansættelser", "Previous Roles"],
    onByDefault: true,
    items: [
      {
        head: ["Digital konsulent, Netcompany", "Digital Consultant, Netcompany"],
        meta: "2016–2018",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "b_referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Yderligere referencer", "Additional references"],
        desc: ["Udleveres på forespørgsel.", "Available upon request."],
      },
    ],
  },
];

const MODERN_DESIGN: AppState["design"] = {
  font: "plex",
  scheme: "staal",
  headSize: "4",
  struct: "sidebar",
  headKind: "left",
  density: "4",
  sidebarSide: "right",
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

// ---------------------------------------------------------------------
// Artistic — a graphic design/illustration career.
// ---------------------------------------------------------------------

const ARTISTIC_SEEDS: CategorySeed[] = [
  {
    id: "profil",
    title: ["Profil", "Profile"],
    onByDefault: true,
    items: [
      {
        head: ["", ""],
        desc: [
          "Grafisk designer og illustrator med en legende tilgang til visuel kommunikation. Arbejder i krydsfeltet mellem branding, illustration og digital design, og trives med projekter der udfordrer det forventede.",
          "Graphic designer and illustrator with a playful approach to visual communication. Works at the intersection of branding, illustration and digital design, and thrives on projects that challenge the expected.",
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
        head: ["Visuel identitet & branding", "Visual Identity & Branding"],
        desc: [
          "Udvikler sammenhængende visuelle identiteter fra logo til fuldt brandunivers.",
          "Develops cohesive visual identities from logo to a full brand universe.",
        ],
      },
      {
        head: ["Illustration", "Illustration"],
        desc: [
          "Håndtegnet og digital illustration til bøger, plakater og kampagner.",
          "Hand-drawn and digital illustration for books, posters and campaigns.",
        ],
      },
      {
        head: ["Layout og trykklar produktion", "Layout and Print Production"],
        desc: [
          "Sikrer at design fungerer lige godt på skærm og i tryk.",
          "Ensures designs work equally well on screen and in print.",
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
        head: ["Grafisk designer, Studie Nord", "Graphic Designer, Studie Nord"],
        meta: "2020–nu",
        comment: ["Fuldtid", "Full-time"],
        desc: [
          "Udvikler visuelle identiteter og kampagnemateriale for kultur- og livsstilsbrands.",
          "Develops visual identities and campaign material for culture and lifestyle brands.",
        ],
        activities: [
          ["Designede visuel identitet for tre byfestivaler", "Designed the visual identity for three city festivals"],
          ["Illustrerede en børnebog udgivet på et dansk forlag", "Illustrated a children's book published by a Danish publisher"],
        ],
      },
      {
        head: ["Freelance illustrator", "Freelance Illustrator"],
        meta: "2017–2020",
        comment: ["Freelance", "Freelance"],
        desc: [
          "Selvstændig virksomhed med illustrationsopgaver til magasiner, forlag og reklamebureauer.",
          "Independent illustration practice for magazines, publishers and advertising agencies.",
        ],
        activities: [
          ["Fast bidragyder til et kulturmagasin i tre år", "Regular contributor to a culture magazine for three years"],
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
        head: ["Grafisk designer, Danmarks Medie- og Journalisthøjskole", "Graphic Design, Danish School of Media and Journalism"],
        meta: "2014–2017",
        desc: [
          "Afgangsprojekt om illustrationens rolle i digital storytelling.",
          "Final project on the role of illustration in digital storytelling.",
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
        head: ["Typografi og layout", "Typography and Layout"],
        meta: "2016",
        desc: [
          "Fordybelse i typografisk hierarki og redaktionelt layout.",
          "In-depth study of typographic hierarchy and editorial layout.",
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
      },
      {
        head: ["Engelsk", "English"],
        meta: "Flydende / Fluent",
        desc: [
          "Bruges i kommunikation med internationale kunder og samarbejdspartnere.",
          "Used in communication with international clients and collaborators.",
        ],
      },
    ],
  },
  {
    id: "certificeringer",
    title: ["Certificeringer", "Certifications"],
    onByDefault: false,
    items: [
      {
        head: ["Adobe Certified Professional, Illustrator", "Adobe Certified Professional, Illustrator"],
        meta: "2019",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Portfolio og referencer udleveres gerne", "Portfolio and references available on request"],
        desc: ["", ""],
      },
    ],
  },
  {
    id: "frivilligt",
    title: ["Frivilligt arbejde", "Volunteer Work"],
    onByDefault: false,
    items: [
      {
        head: ["Frivillig illustrator, Lokalt kulturhus", "Volunteer Illustrator, Local Cultural Centre"],
        desc: [
          "Designer plakater og programmer til kulturhusets årlige events.",
          "Designs posters and programmes for the cultural centre's annual events.",
        ],
      },
    ],
  },
  {
    id: "interesser",
    title: ["Interesser", "Interests"],
    onByDefault: false,
    items: [
      { head: ["Keramik", "Ceramics"], desc: ["", ""] },
      { head: ["Analog fotografi", "Analogue photography"], desc: ["", ""] },
    ],
  },
  {
    id: "b_projektliste",
    title: ["Fuld projektliste", "Full Project List"],
    onByDefault: true,
    items: [
      {
        head: ["Byfestival — visuel identitet", "City Festival — Visual Identity"],
        meta: "2022",
        desc: [
          "Komplet visuel identitet inkl. plakater, skilte og indhold til sociale medier.",
          "Complete visual identity including posters, signage and social media content.",
        ],
      },
    ],
  },
  {
    id: "b_kurser",
    title: ["Alle fag", "All Courses"],
    onByDefault: true,
    items: [
      { head: ["Digital illustration", "Digital Illustration"], meta: "2016", desc: ["", ""] },
      { head: ["Bogtilrettelæggelse", "Book Design"], meta: "2017", desc: ["", ""] },
    ],
  },
  {
    id: "b_vaerktoejer",
    title: ["Værktøjer og software", "Tools and Software"],
    onByDefault: true,
    items: [
      { head: ["Adobe Illustrator & Photoshop", "Adobe Illustrator & Photoshop"], desc: ["", ""] },
      { head: ["Procreate", "Procreate"], desc: ["Til digital illustration på iPad.", "For digital illustration on iPad."] },
      { head: ["Figma", "Figma"], desc: ["Til digitalt design og præsentationer.", "For digital design and presentations."] },
    ],
  },
  {
    id: "b_publikationer",
    title: ["Publikationer og oplæg", "Publications and Talks"],
    onByDefault: false,
    items: [
      {
        head: ["Illustrationer til børnebogen 'Skoven om natten'", "Illustrations for the children's book 'The Forest at Night'"],
        meta: "Forlaget Mille, 2023",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "b_tidligere",
    title: ["Tidligere ansættelser", "Previous Roles"],
    onByDefault: true,
    items: [
      {
        head: ["Junior designer, Reklamebureau Blomst", "Junior Designer, Reklamebureau Blomst"],
        meta: "2017",
        desc: ["", ""],
      },
    ],
  },
  {
    id: "b_referencer",
    title: ["Referencer", "References"],
    onByDefault: false,
    items: [
      {
        head: ["Se portfolio for udvalgte samarbejder", "See portfolio for selected collaborations"],
        desc: ["", ""],
      },
    ],
  },
];

const ARTISTIC_DESIGN: AppState["design"] = {
  font: "industry",
  scheme: "kobber",
  headSize: "6",
  struct: "banded",
  headKind: "center",
  density: "4",
  sidebarSide: "right",
  headingSize: "6",
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

export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: { da: "Klassisk", en: "Classic" },
    description: {
      da: "Traditionelt layout og en økonomiprofil — til roller hvor et konservativt, gennemarbejdet udtryk vægtes højt.",
      en: "A traditional layout and a finance profile — for roles where a conservative, polished look matters most.",
    },
    config: {
      seeds: CLASSIC_SEEDS,
      design: CLASSIC_DESIGN,
      header: {
        name: "Anders Jensen",
        address: "Vesterbrogade 12, 1620 København V",
        phone: "+45 20 12 34 56",
        mail: "anders.jensen@email.dk",
        location: { da: "København", en: "Copenhagen" },
        photo: "",
      },
      appliedTitle: { da: "Økonomichef", en: "Finance Manager" },
    },
  },
  {
    id: "modern",
    name: { da: "Moderne", en: "Modern" },
    description: {
      da: "Sidebar-layout og en produktprofil — til roller i tech og digitale virksomheder.",
      en: "A sidebar layout and a product profile — for roles in tech and digital companies.",
    },
    config: {
      seeds: MODERN_SEEDS,
      design: MODERN_DESIGN,
      header: {
        name: "Sofie Nielsen",
        address: "Nørrebrogade 45, 8000 Aarhus C",
        phone: "+45 30 98 76 54",
        mail: "sofie.nielsen@email.dk",
        location: { da: "Aarhus", en: "Aarhus" },
        photo: "",
      },
      appliedTitle: { da: "Senior Product Manager", en: "Senior Product Manager" },
      variant: { kompetencer: "chips" },
    },
  },
  {
    id: "artistic",
    name: { da: "Kunstnerisk", en: "Artistic" },
    description: {
      da: "Udtryksfuldt bånd-layout og en designprofil — til kreative roller hvor det visuelle udtryk selv er en del af ansøgningen.",
      en: "An expressive banded layout and a design profile — for creative roles where the visual style itself is part of the application.",
    },
    config: {
      seeds: ARTISTIC_SEEDS,
      design: ARTISTIC_DESIGN,
      header: {
        name: "Mikkel Lund",
        address: "Vestergade 8, 5000 Odense C",
        phone: "+45 40 11 22 33",
        mail: "mikkel.lund@email.dk",
        location: { da: "Odense", en: "Odense" },
        photo: "",
      },
      appliedTitle: { da: "Grafisk designer", en: "Graphic Designer" },
      variant: { kompetencer: "chips" },
    },
  },
];

export function buildPresetState(id: string): AppState | null {
  const preset = PRESETS.find((p) => p.id === id);
  return preset ? buildStateFromConfig(preset.config) : null;
}
