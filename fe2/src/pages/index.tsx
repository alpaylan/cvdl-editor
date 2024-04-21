


import { createContext, useEffect, useReducer, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FontDict } from 'cvdl-ts/dist/AnyLayout';
import { render as pdfRender } from 'cvdl-ts/dist/PdfLayout';
import { RemoteStorage } from 'cvdl-ts/dist/RemoteStorage';
import { LocalStorage } from 'cvdl-ts/dist/LocalStorage';
import { Storage } from 'cvdl-ts/dist/Storage';
import { ItemContent, Resume } from 'cvdl-ts/dist/Resume';
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
}

export const DocumentReducer = (state: Resume, action: DocumentAction) => {
  console.log(action);
  const newState = new Resume(state.layout, state.sections);

  if (action.type === "load") {
    return action.value;
  }

  if (action.type === "field-update") {
    newState.sections = state.sections.map((section) => {
      if (section.section_name === action.section) {
        section.items[action.item].set(action.field, action.value);
      }
      return section;
    });
  }
  console.error(newState);
  return newState;
}

function App() {
  console.log = () => { };
  console.warn = () => { };
  console.info = () => { };

  const [resumeData, dispatch] = useReducer(DocumentReducer, new Resume("SingleColumnSchema", []));
  // console.log(state);
  const [storage, setStorage] = useState<Storage>(new LocalStorage());
  const [numPages, setNumPages] = useState<number>();
  const [pdf, setPdf] = useState<string | null>(null);
  const [resume, setResume] = useState<string>("resume2");
  // const [resumeData, setResumeData] = useState<Resume | null>(state)
  const [layoutSchemas, setLayoutSchemas] = useState<string[] | null>(null)
  const [resumeLayout, setResumeLayout] = useState<ResumeLayout | null>(null)
  const [dataSchemas, setDataSchemas] = useState<DataSchema[] | null>(null)
  const [fontDict, setFontDict] = useState<FontDict>(new FontDict());
  const [debug, setDebug] = useState<boolean>(false);
  const [storageInitiated, setStorageInitiated] = useState<boolean>(false);

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
    storage.load_resume(resume).then((data) => {
      // setResumeData(data);
      console.error("Running load");
      dispatch({ type: "load", value: data });
    })
  }, [resume, storage, storageInitiated]);

  useEffect(() => {
    if (!storageInitiated) {
      return;
    }
    const data_schema_loader = async () => {
      if (!resumeData) {
        return [];
      }
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

    const start_time = performance.now();
    pdfRender({
      resume_name: resume,
      resume: resumeData!,
      storage,
      fontDict,
      debug
    }).then(({ blob, fontDict, pages }) => {
      setPdf(window.URL.createObjectURL(blob));
      setFontDict(fontDict);

      const end_time = performance.now();
      console.info("Rendering pdf took " + (end_time - start_time) + "ms");
    });

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
    storage.save_resume("resume2", resumeData);
  }

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "s" && e.ctrlKey || e.key === "s" && e.metaKey) {
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
              <button onClick={saveResume} >Save</button>
              <button onClick={() => setDebug(!debug)} >Invert Debug</button>
              <b>Sections</b>
              {(resumeData && layoutSchemas) &&
                resumeData.sections.map((section, index) => {
                  return (
                    <Section key={index} section={section} dataSchemas={dataSchemas!} />
                  )
                })
              }
            </div>
          </div>
          <div id="pdf-container" style={{ display: "flex", flexDirection: "column" }}></div>
        </div>
        </Layout>
      </DocumentDispatchContext.Provider>
    </DocumentContext.Provider>
  );
}

export default App;
