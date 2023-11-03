


import { useEffect, useReducer, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FontDict } from 'cvdl-ts/src/AnyLayout';
import { render as pdfRender } from 'cvdl-ts/src/PdfLayout';
import { RemoteStorage } from 'cvdl-ts/src/RemoteStorage';
import { LocalStorage } from 'cvdl-ts/src/LocalStorage';
import { Storage } from 'cvdl-ts/src/Storage';
import { ItemContent, Resume } from 'cvdl-ts/src/Resume';
import { LayoutSchema } from 'cvdl-ts/src/LayoutSchema';
import { ResumeLayout } from 'cvdl-ts/src/ResumeLayout';
import { DataSchema } from 'cvdl-ts/src/DataSchema';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/webpack';

function App() {
  console.log = function () { }
  console.warn = function () { }
  console.error = function () { }
  console.debug = function () { }

  const [storage, setStorage] = useState<Storage>(new LocalStorage());
  const [numPages, setNumPages] = useState<number>();
  const [pdf, setPdf] = useState<string | null>(null);
  const [resume, setResume] = useState<string>("resume2");
  const [resumeData, setResumeData] = useState<Resume | null>(null)
  const [layoutSchemas, setLayoutSchemas] = useState<string[] | null>(null)
  const [resumeLayout, setResumeLayout] = useState<ResumeLayout | null>(null)
  const [dataSchemas, setDataSchemas] = useState<DataSchema[] | null>(null)
  const [fontDict, setFontDict] = useState<FontDict>(new FontDict());
  const [debug, setDebug] = useState<boolean>(false);

  useEffect(() => {
    require('../registerStaticFiles.js');
    storage.initiate_storage();
  });

  useEffect(() => {
    storage.load_resume(resume).then((data) => {
      setResumeData(data);
    })
  }, [resume, storage]);

  useEffect(() => {
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

  }, [resumeData, storage]);



  useEffect(() => {
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

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ display: "flex", width: "700px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button onClick={saveResume} >Save</button>
          <button onClick={() => setDebug(!debug)} >Invert Debug</button>
          <b >Sections</b>
          {(resumeData && layoutSchemas) &&
            resumeData.sections.map((section, index) => {
              return (
                <div key={index} >
                  <button key={section.section_name} > {section.section_name} </button>
                  <div style={{ flexDirection: "row" }}>
                    <b > Layout: </b>
                    <input list="layout-schemas"
                      defaultValue={section.layout_schema}
                      onChange={(e) => {
                        if (layoutSchemas.find((schema_name) => schema_name === e.target.value)) {
                          section.layout_schema = e.target.value;
                          setResumeData(new Resume(resumeData.layout, resumeData.sections));
                        }
                      }} />
                    <datalist id="layout-schemas">
                      {layoutSchemas.map((schema) => {
                        return <option value={schema} key={schema}> {schema} </option>
                      })}
                    </datalist>
                  </div>
                  <span >
                    ----------------
                  </span>
                  {
                    section.items.map((item, index) => {
                      return (
                        <div key={index}>
                          {
                            dataSchemas?.find((schema) => schema.schema_name === section.data_schema)?.item_schema.map((field) => {
                              return (
                                <div style={{ flexDirection: "row" }} key={field.name} >
                                  <b > {field.name} </b>
                                  <input type="text" onChange={(e) => {
                                    item.set(field.name, ItemContent.fromJson(e.target.value));
                                    setResumeData(new Resume(resumeData.layout, resumeData.sections));
                                    // @ts-ignore
                                  }} defaultValue={ItemContent.toString(item.get(field.name) ?? ItemContent.None())} />
                                </div>
                              )
                            })}
                          <span >
                            ----------------
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              )
            })
          }
        </div>
      </div>
      <div style={{ display: "flex", width: "%50", flexDirection: "column" }}>
        <div style={{ display: "flex", maxHeight: "792px", overflow: "scroll" }}>
          <Document file={pdf} onLoadSuccess={onDocumentLoadSuccess}  >
            {/* <Page pageNumber={pageNumber} /> */}
            {Array.apply(null, Array(numPages))
              .map((x, i) => i + 1)
              .map(page => (<div key={page} style={{ borderWidth: "1px", borderColor: "#000000" }}> <Page pageNumber={page} /> </div>))}
          </Document>
        </div>
      </div>
    </div>
  );
}

export default App;
