


import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FontDict } from 'cvdl-ts/dist/AnyLayout';
import { render as pdfRender } from 'cvdl-ts/dist/PdfLayout';
import { RemoteStorage } from 'cvdl-ts/dist/RemoteStorage';
import { LocalStorage } from 'cvdl-ts/dist/LocalStorage';
import { Storage } from 'cvdl-ts/dist/Storage';
import { ItemContent, ItemName, Resume, ResumeSection } from 'cvdl-ts/dist/Resume';
import { LayoutSchema } from 'cvdl-ts/dist/LayoutSchema';
import { ResumeLayout } from 'cvdl-ts/dist/ResumeLayout';
import { DataSchema } from 'cvdl-ts/dist/DataSchema';
// import * as pdfjsLib from 'pdfjs-dist/webpack';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';
import Section from '@/components/Section';
import { render as domRender } from '@/logic/DomLayout';
import Layout from '@/components/layout';
import LayoutEditor from '@/components/LayoutEditor';
import { data } from 'autoprefixer';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;


// Create a global storage for ResumeData
export const DocumentContext = createContext<Resume | null>(null);
export const DocumentDispatchContext = createContext<React.Dispatch<any> | null>(null);

// Create a dispatch function that changes the contents of a field in the ResumeData

type DocumentAction = {
  type: "field-update"
  section: string,
  item: number,
  field: string,
  value: ItemContent
} | {
  type: "load"
  value: Resume
} | {
  type: "layout-update"
  value: LayoutSchema
} | {
  type: "delete-item"
  section: string,
  item: number
} | {
  type: "add-empty-item",
  section: string
} | {
  type: "copy-item",
  section: string,
  item: number
} | {
  type: "move-item",
  section: string,
  item: number,
  direction: "up" | "down"
} | {
  type: "add-section",
  section: ResumeSection
} | {
  type: "add-empty-section",
  section_name: string,
  data_schema: string,
  layout_schema: string
}

export const DocumentReducer = (state: Resume, action: DocumentAction) => {
  console.log(action);
  const newState = Resume.fromJson(state.toJson());

  if (action.type === "load") {
    return action.value;
  }

  if (action.type === "field-update") {
    newState.sections = state.sections.map((section) => {
      if (section.section_name === action.section) {
        section.items[action.item].fields.set(action.field, action.value);
      }
      return section;
    });
  }

  if (action.type === "layout-update") {
    console.error("Loading layout");
    return newState;
  }

  if (action.type === "delete-item") {
    console.error("Deleting item");
    console.error(action);
    newState.sections = state.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        console.error("Deleting item");
        console.error(section.items);
        console.error(section.items[action.item])
        newSection.items = section.items.filter((item, index) => index !== action.item);
      }
      return newSection;
    });
  }

  if (action.type === "copy-item") {
    newState.sections = state.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        newSection.items.push(section.items[action.item]);
      }
      return newSection;
    });
  }

  if (action.type === "move-item") {
    newState.sections = state.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        const item = newSection.items[action.item];
        if (action.direction === "up") {
          if (action.item === 0) {
            return newSection;
          }
          const temp = newSection.items[action.item - 1];
          newSection.items[action.item - 1] = item;
          newSection.items[action.item] = temp;
        } else {
          if (action.item === newSection.items.length - 1) {
            return newSection;
          }
          const temp = newSection.items[action.item + 1];
          newSection.items[action.item + 1] = item;
          newSection.items[action.item] = temp;
        }
      }
      return newSection;
    });
  }

  if (action.type === "add-empty-item") {
    newState.sections = state.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        const storage = new LocalStorage();
        const data_schema = storage.load_data_schema(section.data_schema);
        const item = new Map<ItemName, ItemContent>();
        data_schema.item_schema.forEach((field) => {
          item.set(field.name, ItemContent.None());
        });
        const id = Math.random().toString(36).substring(7);
        newSection.items.push({ id, fields: item });
      }
      return newSection;
    });
  }

  if (action.type === "add-section") {
    newState.sections.push(action.section);
  }

  if (action.type === "add-empty-section") {
    const newSection = new ResumeSection();
    const storage = new LocalStorage();
    const layout_schema = storage.load_layout_schema(action.layout_schema);
    console.error(layout_schema);
    newSection.data_schema = layout_schema.data_schema_name;
    newSection.section_name = action.section_name;
    newSection.layout_schema = action.layout_schema;
    console.error(newSection);
    newState.sections.push(newSection);
  }

  return newState;
}

const AddNewSection = () => {
  const dispatch = useContext(DocumentDispatchContext);
  const [addingSection, setAddingSection] = useState<boolean>(false);
  const [sectionName, setSectionName] = useState<string>("");
  const [layoutSchema, setLayoutSchema] = useState<string>("");
  return (
    <>
      {!addingSection && <button className='bordered' onClick={() => {
        setAddingSection(!addingSection);
      }}> Add new section </button>
      }
      {addingSection && <div>
        <input type="text" value={sectionName} placeholder="Section name" onChange={(e) => setSectionName(e.target.value)} />
        <input type="text" value={layoutSchema} placeholder="Layout schema" onChange={(e) => setLayoutSchema(e.target.value)} />
        <button className='bordered' onClick={() => {
          setAddingSection(!addingSection);
        }}> Cancel </button>
        <button className='bordered' onClick={() => {
          setAddingSection(!addingSection);
          dispatch!({
            type: "add-empty-section",
            section_name: sectionName,
            layout_schema: layoutSchema
          });
        }}> Add </button>
      </div>
      }
    </>
  )
}
function App() {
  console.log = () => { };
  console.warn = () => { };
  console.info = () => { };

  const [resumeData, dispatch] = useReducer(DocumentReducer, new Resume("SingleColumnSchema", []));
  console.error("Rerendering app")
  // console.log(state);
  const [storage, setStorage] = useState<LocalStorage>(new LocalStorage());
  const [numPages, setNumPages] = useState<number>();
  const [pdf, setPdf] = useState<string | null>(null);
  const [resume, setResume] = useState<string>("resume5");
  // const [resumeData, setResumeData] = useState<Resume | null>(state)
  const [layoutSchemas, setLayoutSchemas] = useState<string[] | null>(null)
  const [resumeLayout, setResumeLayout] = useState<ResumeLayout | null>(null)
  const [dataSchemas, setDataSchemas] = useState<DataSchema[] | null>(null)
  const [fontDict, setFontDict] = useState<FontDict>(new FontDict());
  const [debug, setDebug] = useState<boolean>(false);
  const [storageInitiated, setStorageInitiated] = useState<boolean>(false);
  const [addingSection, setAddingSection] = useState<boolean>(false);
  useEffect(() => {
    require('../registerStaticFiles.js');
    storage.initiate_storage().then(() => {
      setStorageInitiated(true);
    });
  });

  useEffect(() => {
    if (!storageInitiated) {
      return;
    }
    const data = storage.load_resume(resume);
    console.error("Running load");
    dispatch({ type: "load", value: data });

  }, [resume, storage, storageInitiated]);

  useEffect(() => {
    console.error("Running effect");
    console.error(resumeData);
    console.error(resumeData.data_schemas());
    if (!storageInitiated) {
      return;
    }
    const data_schema_loader = async () => {
      if (!resumeData) {
        return [];
      }
      console.error(resumeData.data_schemas());
      return await Promise.all(resumeData.data_schemas().map((schema) => storage.load_data_schema(schema)));
    }

    const layout_schema_loader = async () => {
      return await storage.list_layout_schemas();
    }

    const resume_layout_loader = async () => {
      if (!resumeData) {
        throw "No resume layout";
      }
      return await storage.load_resume_layout(resumeData.resume_layout());
    }

    data_schema_loader().then((schemas) => setDataSchemas(schemas))
    layout_schema_loader().then((schemas) => setLayoutSchemas(schemas))
    resume_layout_loader().then((layout) => setResumeLayout(layout))

  }, [resumeData, storage, storageInitiated]);



  useEffect(() => {
    if (!storageInitiated) {
      return;
    }

    domRender({
      resume_name: resume,
      resume: resumeData!,
      storage,
      fontDict,
      debug
    });
  }, [resume, fontDict, debug, storage, resumeData]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const saveResume = () => {
    if (!resumeData) {
      return;
    }
    storage.save_resume("resume5", resumeData);
  }

  const downloadResume = () => {
    pdfRender({
      resume_name: resume,
      resume: resumeData!,
      storage,
      fontDict,
      debug
    }).then(({ blob, fontDict, pages }) => {
      const pdf = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pdf;
      link.download = "resume.pdf";
      link.click();
    });

  }

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "s" && e.ctrlKey || e.key === "s" && e.metaKey) {
        console.error("Saving resume");
        e.preventDefault();
        saveResume();
      }
    });
  });

  return (
    <DocumentContext.Provider value={resumeData}>
      <DocumentDispatchContext.Provider value={dispatch}>
        <Layout>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ display: "flex", width: "50%" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <button onClick={downloadResume} >Download</button>
                <button onClick={() => setDebug(!debug)} >Invert Debug</button>
                <b>Sections</b>

                <AddNewSection />
                {(resumeData && layoutSchemas) &&
                  resumeData.sections.map((section, index) => {
                    return (
                      <Section key={index} section={section} dataSchemas={dataSchemas!} />
                    )
                  })
                }
              </div>
            </div>
            <LayoutEditor />
            <div id="pdf-container" style={{ display: "flex", flexDirection: "column" }}></div>
          </div>
        </Layout>
      </DocumentDispatchContext.Provider>
    </DocumentContext.Provider>
  );
}

export default App;
