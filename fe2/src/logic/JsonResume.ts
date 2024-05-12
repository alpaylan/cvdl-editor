// Import a jsonresume file and convert it to a resume object/

import { Width } from "cvdl-ts/dist/Width";
import { DataSchema } from "cvdl-ts/dist/DataSchema";
import { Font } from "cvdl-ts/dist/Font";
import { Elem, Row, SectionLayout, Stack } from "cvdl-ts/dist/Layout";
import { LayoutSchema } from "cvdl-ts/dist/LayoutSchema";
import { LocalStorage } from "cvdl-ts/dist/LocalStorage";
import { ItemContent, Resume, ResumeSection } from "cvdl-ts/dist/Resume";

export type JsonResume = {
    basics?: {
        name?: string;
        label?: string;
        image?: string;
        email?: string;
        phone?: string;
        url?: string;
        summary?: string;
        location?: {
            address?: string;
            postalCode?: string;
            city?: string;
            countryCode?: string;
            region?: string;
        };
        profiles?: {
            network?: string;
            username?: string;
            url?: string;
        };
    };
    work?: {
        name?: string;
        position?: string;
        url?: string;
        startDate?: string;
        endDate?: string;
        summary?: string;
        highlights?: string[];
    }[];
    volunteer?: {
        organization?: string;
        position?: string;
        url?: string;
        startDate?: string;
        endDate?: string;
        summary?: string;
        highlights?: string[];
    }[];
    education?: {
        institution?: string;
        url?: string;
        area?: string;
        studyType?: string;
        startDate?: string;
        endDate?: string;
        score?: string;
        courses?: string[];
    }[];
    awards?: {
        title?: string;
        date?: string;
        awarder?: string;
        summary?: string;
    }[];
    certificates?: {
        name?: string;
        date?: string;
        issuer?: string;
        url?: string;
    }[];
    publications?: {
        name?: string;
        publisher?: string;
        releaseDate?: string;
        url?: string;
        summary?: string;
    }[];
    skills?: {
        name?: string;
        level?: string;
        keywords?: string[];
    }[];
    languages?: {
        language?: string;
        fluency?: string;
    }[];
    interests?: {
        name?: string;
        keywords?: string[];
    }[];
    references?: {
        name?: string;
        reference?: string;
    }[];
    projects?: {
        name?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        highlights?: string[];
        url?: string;
    }[];
}

const jsonResumeBasics: DataSchema = new DataSchema("json-resume-basics", [
    {
        name: "name",
        data_type: { tag: "String" }
    },
    {
        name: "email",
        data_type: { tag: "String" }
    },
    {
        name: "phone",
        data_type: { tag: "String" }
    }
], []);

const jsonResumeBasicsLayout: LayoutSchema = new LayoutSchema(
    "json-resume-basics",
    "json-resume-basics",
    new SectionLayout(
        new Stack([
            new SectionLayout(Elem.default_().as_ref().with_item("name").with_width(Width.percent(100)).with_alignment("Center").with_font(new Font("Exo", 16, "Bold", "Normal", "Local"))),
            new SectionLayout(Row.default_().with_elements([
                new SectionLayout(Elem.default_().as_ref().with_item("email").with_font(new Font("Exo", 12, "Medium", "Normal", "Local")).with_width(Width.percent(50))),
                new SectionLayout(Elem.default_().as_ref().with_item("phone").with_font(new Font("Exo", 12, "Medium", "Normal", "Local")).with_width(Width.percent(50)).with_alignment("Right"))
            ]))
        ])
    ),
    new SectionLayout(
        new Stack([])
    )
);

const jsonResumeWork: DataSchema = new DataSchema("json-resume-work",
    [],
    [
        // name?: string;
        { name: 'name', data_type: { tag: 'String' } },
        // position?: string;
        { name: 'position', data_type: { tag: 'String' } },
        // url?: string;
        { name: 'url', data_type: { tag: 'String' } },
        // startDate?: string;
        { name: 'startDate', data_type: { tag: 'Date' } },
        // endDate?: string;
        { name: 'endDate', data_type: { tag: 'Date' } },
        // summary?: string;
        { name: 'summary', data_type: { tag: 'String' } },
        // highlights?: string[];
        { name: 'highlights', data_type: { tag: 'List', value: { tag: 'String' } } }
    ]
)

const jsonResumeWorkLayout: LayoutSchema = new LayoutSchema("json-resume-work", "json-resume-work",
    new SectionLayout(Elem.default_().with_item("Work")),
    new SectionLayout(
        new Stack([
            new SectionLayout(Elem.default_().as_ref().with_item("name").with_width(Width.percent(100)).with_alignment("Center").with_font(new Font("Exo", 16, "Bold", "Normal", "Local"))),
            new SectionLayout(Row.default_().with_elements([
                new SectionLayout(Elem.default_().as_ref().with_item("position").with_font(new Font("Exo", 12, "Medium", "Normal", "Local")).with_width(Width.percent(50))),
                new SectionLayout(Elem.default_().as_ref().with_item("startDate").with_font(new Font("Exo", 12, "Medium", "Normal", "Local")).with_width(Width.percent(50)).with_alignment("Right"))
            ]))
        ])
    )
)




const get = (obj: any, key: string): ItemContent => {
    return obj[key] ? { tag: "String", value: obj[key] } : { tag: "String", value: "" };
}


const randomId = () => {
    return Math.random().toString(36).substring(7);
}

export const convert = (json: JsonResume): Resume => {
    const storage = new LocalStorage();
    storage.save_data_schema(jsonResumeBasics);
    storage.save_layout_schema(jsonResumeBasicsLayout);
    storage.save_data_schema(jsonResumeWork);
    storage.save_layout_schema(jsonResumeWorkLayout);

    const basics: ResumeSection = new ResumeSection();
    basics.section_name = "Basics";
    basics.data_schema = "json-resume-basics"
    basics.layout_schema = "json-resume-basics"
    basics.data = new Map([
        ["name", get(json.basics, "name")],
        ["email", get(json.basics, "email")],
        ["phone", get(json.basics, "phone")]
    ]);

    const work: ResumeSection = new ResumeSection();
    work.section_name = "Work Experience";
    work.data_schema = "json-resume-work";
    work.layout_schema = "json-resume-work";
    json.work?.map((w) => new Map([
        ["name", get(w, "name")],
        ["position", get(w, "position")],
        ["url", get(w, "url")],
        ["startDate", get(w, "startDate")],
        ["endDate", get(w, "endDate")],
        ["summary", get(w, "summary")],
        ["highlights", { tag: "List", value: (w.highlights?.map((h: string) => ({ tag: "String", value: h })) || []) } as ItemContent]
    ])
    ).forEach((w) => {
        work.items.push({
            id: randomId(),
            fields: w
        });
    });

    return new Resume("SingleColumnSchema", [basics, work]);
}
