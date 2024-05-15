"use client"


import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ElementPath, FontDict } from 'cvdl-ts/dist/AnyLayout';
import { render as pdfRender } from 'cvdl-ts/dist/PdfLayout';
import { RemoteStorage } from 'cvdl-ts/dist/RemoteStorage';
import { LocalStorage } from 'cvdl-ts/dist/LocalStorage';
import { Storage } from 'cvdl-ts/dist/Storage';
import { Item, ItemContent, ItemName, Resume, ResumeSection } from 'cvdl-ts/dist/Resume';
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
import DataSchemaEditor from '@/components/DataSchemaEditor';
import { convert } from '@/logic/JsonResume';
import { fetchGist, fetchGistById } from '@/api/fetchGist';
import { debounce } from './SectionItemField';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;



export type EditorState = {
  resume: Resume,
  editorPath: ElementPath,
  resumeName: string,
  editHistory: DocumentAction[]
};

export const EditorContext = createContext<EditorState | null>(null);

// Create a global storage for ResumeData
// export const DocumentContext = createContext<Resume | null>(null);
export const DocumentDispatchContext = createContext<React.Dispatch<any> | null>(null);

// Create a dispatch function that changes the contents of a field in the ResumeData

const reId = (resume: Resume) => {
  const newResume = Resume.fromJson(resume.toJson());
  newResume.sections = newResume.sections.map((section) => {
    const newSection = ResumeSection.fromJson(section.toJson());
    newSection.items = newSection.items.map((item) => {
      const newItem = { id: Math.random().toString(36).substring(7), fields: item.fields };
      return newItem;
    });
    return newSection;
  });
  return newResume;
}

const deepCopyResume = (resume: Resume) => {
  const newResume = Resume.fromJson(resume.toJson());
  newResume.sections = newResume.sections.map((section) => {
    const newSection = ResumeSection.fromJson(section.toJson());
    newSection.items = newSection.items.map((item) => {
      const newItem = { id: item.id, fields: item.fields };
      return newItem;
    });
    return newSection;
  });
  return newResume;
}


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
  type: "add-item",
  section: string
  item: Item
  index?: number
} | {
  type: "add-section",
  index?: number,
  section: ResumeSection
} | {
  type: "add-empty-section",
  section_name: string,
  data_schema: string,
  layout_schema: string
} | {
  type: "delete-section",
  section_name: string
} | {
  type: "section-layout-update",
  section_name: string,
  layout_schema_name: string
} | {
  type: "add-layout",
  layout: LayoutSchema
} | {
  type: "create-new-resume",
  resumeName: string
} | {
  type: "switch-resume",
  resumeName: string
} | {
  type: "undo"
};

export type ContentEditorAction = {
  type: "set-editor-path",
  path: ElementPath
}

export type EditorAction = DocumentAction | ContentEditorAction;

const cloneEditorHistory = (history: DocumentAction[]) => {
  return history.map((action) => {
    return { ...action };
  });
}


export const DocumentReducer = (state: EditorState, action_: EditorAction) => {
  const resume = state.resume;
  console.error(action_);
  let newState = reId(resume);
  let path = state.editorPath;
  let resumeName = state.resumeName;
  let editHistory = cloneEditorHistory(state.editHistory) as DocumentAction[];
  let undoing = false;

  if (action_.type === "undo" && editHistory.length > 0) {
    let lastAction = editHistory.pop();
    action_ = (lastAction!) as EditorAction;
    undoing = true;
  }
  // Learn why this is needed.
  const action = action_ as EditorAction;

  if (action.type === 'set-editor-path') {
    path = action.path;
    if (path.tag === "section" || path.tag === "item") {
      setTimeout(() => {
        // @ts-ignore
        document.getElementById(path.section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }

  if (action.type === "load") {
    newState = action.value;
  }

  if (action.type === "create-new-resume") {
    newState = new Resume("SingleColumnSchema", []);
    path = { tag: 'none' };
    resumeName = action.resumeName;
  }

  if (action.type === "switch-resume") {
    resumeName = action.resumeName;
    path = { tag: 'none' };
    newState = new LocalStorage().load_resume(action.resumeName);
  }

  if (action.type === "field-update") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        if (action.item !== -1) {
          const item = newSection.items[action.item];
          if (!undoing) {
            editHistory.push({ type: "field-update", section: section.section_name, item: action.item, field: action.field, value: item.fields.get(action.field)! });
          }
          item.fields.set(action.field, action.value);
        } else {
          if (!undoing) {
            editHistory.push({ type: "field-update", section: section.section_name, item: action.item, field: action.field, value: newSection.data.get(action.field)! });
          }
          newSection.data.set(action.field, action.value);
        }
      }
      return newSection;
    });
  }

  if (action.type === "delete-item") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        newSection.items = section.items.filter((item, index) => index !== action.item);
        if (!undoing) {
          console.error(section.items[action.item]);
          editHistory.push({ type: "add-item", section: section.section_name, item: section.items[action.item], index: action.item });
        }
      }
      return newSection;
    });
  }

  if (action.type === "add-item") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        if (action.index === undefined) {
          newSection.items.push(action.item);
          path = { tag: 'item', section: section.section_name, item: newSection.items.length - 1 };
        } else {
          newSection.items.splice(action.index, 0, action.item);
          path = { tag: 'item', section: section.section_name, item: action.index };
        }

        console.error(action.item);
        document.getElementById(action.item.id)?.scrollIntoView();
        if (!undoing) {
          editHistory.push({ type: "delete-item", section: section.section_name, item: newSection.items.length - 1 });
        }
      }
      return newSection;
    });
  }

  if (action.type === "copy-item") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {
        const id = Math.random().toString(36).substring(7);
        const item = section.items[action.item];
        const fields = new Map<ItemName, ItemContent>();
        item.fields.forEach((value, key) => {
          fields.set(key, value);
        });
        newSection.items.push({ id, fields });
        if (!undoing) {
          editHistory.push({ type: "delete-item", section: section.section_name, item: newSection.items.length - 1 });
        }
      }
      return newSection;
    });
  }

  if (action.type === "move-item") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section) {

        if ((action.item < 0 && action.direction === "up") ||
          (action.item >= newSection.items.length && action.direction === "down")) {
          return newSection;
        }

        const swapPosition = action.direction === "up" ? action.item - 1 : action.item + 1;

        const item = newSection.items[action.item];

        const temp = newSection.items[swapPosition];
        newSection.items[swapPosition] = item;
        newSection.items[action.item] = temp;

        if (!undoing) {
          editHistory.push({ type: "move-item", section: section.section_name, item: swapPosition, direction: action.direction === "up" ? "down" : "up" });
        }
      }
      return newSection;
    });
  }

  if (action.type === "add-empty-item") {
    newState.sections = resume.sections.map((section) => {
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
        path = { tag: 'item', section: section.section_name, item: newSection.items.length - 1 };
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
        if (!undoing) {
          editHistory.push({ type: "delete-item", section: section.section_name, item: newSection.items.length - 1 });
        }
      }
      return newSection;
    });
  }

  if (action.type === "add-section") {
    if (action.index === undefined) {
      newState.sections.push(action.section);
    } else {
      newState.sections.splice(action.index, 0, action.section);
    }

    if (!undoing) {
      editHistory.push({ type: "delete-section", section_name: action.section.section_name });
    }
  }

  if (action.type === "add-empty-section") {
    const newSection = new ResumeSection();
    const storage = new LocalStorage();
    const layout_schema = storage.load_layout_schema(action.layout_schema);
    newSection.data_schema = layout_schema.data_schema_name;
    newSection.section_name = action.section_name;
    newSection.layout_schema = action.layout_schema;
    newState.sections.push(newSection);
    if (!undoing) {
      editHistory.push({ type: "delete-section", section_name: action.section_name });
    }
  }

  if (action.type === "delete-section") {
    newState.sections = resume.sections.filter((section) => section.section_name !== action.section_name);
    if (!undoing) {
      editHistory.push({
        type: "add-section",
        index: resume.sections.findIndex((section) => section.section_name === action.section_name),
        section: resume.sections.find((section) => section.section_name === action.section_name)!
      });
    }
  }

  if (action.type === "section-layout-update") {
    newState.sections = resume.sections.map((section) => {
      const newSection = ResumeSection.fromJson(section.toJson());
      if (section.section_name === action.section_name) {
        newSection.layout_schema = action.layout_schema_name;
        if (!undoing) {
          editHistory.push({ type: "section-layout-update", section_name: action.section_name, layout_schema_name: section.layout_schema });
        }
      }
      return newSection;
    });
  }

  new LocalStorage().save_resume(resumeName, newState);
  return { resume: newState, editorPath: path, resumeName: resumeName, editHistory: editHistory };
}

const AddNewSection = (props: { dataSchemas: DataSchema[], layoutSchemas: LayoutSchema[] }) => {

  const dispatch = useContext(DocumentDispatchContext);
  const [addingSection, setAddingSection] = useState<boolean>(false);
  const [sectionName, setSectionName] = useState<string>("");
  const [dataSchema, setDataSchema] = useState<string>(props.dataSchemas[0].schema_name ?? "");
  const [availableLayoutSchemas, setAvailableLayoutSchemas] = useState<LayoutSchema[]>(props.layoutSchemas);
  const [layoutSchema, setLayoutSchema] = useState<string>(availableLayoutSchemas[0].schema_name ?? "");

  return (
    <>
      {!addingSection &&
        <button className='bordered' onClick={() => {
          setAddingSection(!addingSection);
        }}>⊕ Add new section </button>
      }
      {addingSection &&
        <div className='panel'>
          <div className='panel-item'>
            <label>Section Name</label>
            <input type="text" value={sectionName} placeholder="Section name" onChange={(e) => setSectionName(e.target.value)} />
          </div>
          <div className='panel-item'>
            <label>Data Schema</label>
            <select value={dataSchema} onChange={(e) => {
              setDataSchema(e.target.value);
              setAvailableLayoutSchemas(props.layoutSchemas.filter((schema) => schema.data_schema_name === e.target.value));
            }}>
              {props.dataSchemas.map((schema) => {
                return <option key={schema.schema_name} value={schema.schema_name}>{schema.schema_name}</option>
              })}
            </select>
          </div>
          <div className='panel-item'>
            <label>Layout Schema</label>
            <select value={layoutSchema} onChange={(e) => {
              setLayoutSchema(e.target.value);
            }}>
              {availableLayoutSchemas.map((schema) => {
                return <option key={schema.schema_name} value={schema.schema_name}>{schema.schema_name}</option>
              })}
            </select>
          </div>
          <div className='panel-item'>
            <button className='bordered' onClick={() => {
              setAddingSection(!addingSection);
            }}> Cancel </button>
          </div>
          <div className='panel-item'>
            <button className='bordered' onClick={() => {
              setAddingSection(!addingSection);
              dispatch!({
                type: "add-empty-section",
                section_name: sectionName,
                layout_schema: layoutSchema
              });
            }}> Add </button>
          </div>
        </div>
      }
    </>
  )
}

const GihubLogin = () => {
  const [token, setToken] = useState<string>("")
  const [open, setOpen] = useState<boolean>(false);

  if (!open) {
    return (
      <button className='bordered' onClick={() => setOpen(true)}>Login with Github</button>
    )
  }

  return (
    <div>
      <input type="text" value={token} placeholder="Paste your Github Token" onChange={(e) => setToken(e.target.value)} />
      <button className='bordered' onClick={() => {
        localStorage.setItem("github_token", token);
        setOpen(false);
      }}>Login</button>
    </div>
  )
}

function App() {
  console.log = () => { };
  console.warn = () => { };
  console.info = () => { };

  const [state, dispatch] = useReducer(DocumentReducer, { resume: new Resume("SingleColumnSchema", []), editorPath: { tag: 'none' }, resumeName: "Default", editHistory: [] });

  const [storage, setStorage] = useState<LocalStorage>(new LocalStorage());
  const [resume, setResume] = useState<string>("Default");
  const [resumes, setResumes] = useState<string[] | null>(null);
  // const [resumeData, setResumeData] = useState<Resume | null>(state)
  const [layoutSchemas, setLayoutSchemas] = useState<LayoutSchema[] | null>(null)
  const [resumeLayout, setResumeLayout] = useState<ResumeLayout | null>(null)
  const [dataSchemas, setDataSchemas] = useState<DataSchema[] | null>(null)
  const [fontDict, setFontDict] = useState<FontDict>(new FontDict());
  const [debug, setDebug] = useState<boolean>(false);
  const [storageInitiated, setStorageInitiated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<"content-editor" | "layout-editor" | "schema-editor">("content-editor");

  useEffect(() => {
    require('../registerStaticFiles.js');
    storage.initiate_storage().then(() => {
      setStorageInitiated(true);
    });

    if (localStorage.getItem("version") !== "0.1.0") {
      localStorage.clear();
      localStorage.setItem("version", "0.1.0");
    }

    // Check if query parameter is present
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const load_resume = urlParams.get('user');
      console.log(load_resume);
      if (load_resume) {
        fetchGist(load_resume).then((data) => {
          const resume = convert(data);
          dispatch({ type: "load", value: resume });
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!storageInitiated) {
      return;
    }

    const data = storage.load_resume(resume);
    dispatch({ type: "load", value: data });


  }, [resume, storage, storageInitiated]);

  useEffect(() => {
    if (!storageInitiated) {
      return;
    }
    const data_schema_loader = () => {
      const dataSchemaNames = storage.list_data_schemas();
      return dataSchemaNames.map((schema) => storage.load_data_schema(schema));
    }

    const layout_schema_loader = () => {
      const layoutSchemaNames = storage.list_layout_schemas();
      return layoutSchemaNames.map((schema) => storage.load_layout_schema(schema));
    }

    const resume_layout_loader = () => {
      if (!state.resume) {
        throw "No resume layout";
      }
      return storage.load_resume_layout(state.resume.resume_layout());
    }

    const resumes = storage.list_resumes();

    setDataSchemas(data_schema_loader())
    setLayoutSchemas(layout_schema_loader())
    setResumeLayout(resume_layout_loader())
    setResumes(resumes);
  }, [state.resume, storage, storageInitiated]);




  useEffect(() => {
    if (!storageInitiated) {
      return;
    }

    domRender({
      resume_name: resume,
      resume: state.resume!,
      storage,
      fontDict,
      state,
      dispatch,
      debug
    });
  }, [resume, fontDict, debug, storage, state.resume]);

  const saveResumeToGithub = () => {
    if (!state.resume) {
      return;
    }
    const githubToken = localStorage.getItem("github_token");
    if (!githubToken) {
      alert("Please login with Github to save your resume");
      return;
    }
    alert(githubToken);
    fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "description": "Resume",
        "public": true,
        "files": {
          [`${resume}.json`]: {
            "content": JSON.stringify(state.resume.toJson())
          }
        }
      })
    }).then((response) => {
      if (response.status === 201) {
        alert("Resume saved successfully");
      } else {
        alert("Error saving resume");
      }
    });
  }

  const saveResume = () => {
    if (!state.resume) {
      return;
    }
    // Download the current resume as a json file
    const data = JSON.stringify(state.resume.toJson());
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resume}.json`;
    link.click();
  }

  const downloadResume = () => {
    pdfRender({
      resume_name: resume,
      resume: state.resume!,
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

  const uploadResume = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files![0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse((e.target as any).result);
        const resume = "layout" in data ? Resume.fromJson(data) : convert(data);
        dispatch({ type: "load", value: resume });
      }
      reader.readAsText(file);
    }
    input.click();
  }

  const uploadResumeFromGist = () => {
    // Prompt for Gist ID
    const gistId = prompt("Enter Gist ID");
    if (!gistId) {
      return;
    }
    fetchGistById(gistId).then((data) => {
      console.error(data);
      const resume = "layout" in data ? Resume.fromJson(data) : convert(data);
      dispatch({ type: "load", value: resume });
    });
  }


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && e.ctrlKey || e.key === "z" && e.metaKey) {
        if (e.repeat) {
          return
        }
        e.preventDefault();
        dispatch({ type: "undo" });
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && e.ctrlKey || e.key === "s" && e.metaKey) {
        if (e.repeat) {
          return
        }
        e.preventDefault();
        saveResume();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  });


  return (
    <EditorContext.Provider value={state}>
      <DocumentDispatchContext.Provider value={dispatch}>
        <Layout>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ display: "flex", flexDirection: "column", margin: "20px" }}>
              <button className='bordered' style={{
                backgroundColor: currentTab === "content-editor" ? "#101010" : "white",
                color: currentTab === "content-editor" ? "white" : "black"
              }} onClick={() => setCurrentTab("content-editor")}>Content Editor</button>
              <button className='bordered' style={{
                backgroundColor: currentTab === "layout-editor" ? "#101010" : "white",
                color: currentTab === "layout-editor" ? "white" : "black"
              }} onClick={() => setCurrentTab("layout-editor")}>Layout Editor</button>
              <button className='bordered' style={{
                backgroundColor: currentTab === "schema-editor" ? "#101010" : "white",
                color: currentTab === "schema-editor" ? "white" : "black"
              }} onClick={() => setCurrentTab("schema-editor")}>Schema Editor</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "50%", margin: "20px", minWidth: "250px", maxHeight: "95vh", overflow: "scroll" }}>
              <div style={{ display: "flex", flexDirection: "row" }}>
                <select value={resume} onChange={(e) => {
                  setResume(e.target.value);
                  dispatch({ type: "switch-resume", resumeName: e.target.value });
                }}>
                  {
                    resumes && resumes.map((resume) => {
                      return <option key={resume} value={resume}>{resume}</option>
                    })
                  }
                </select>
                <button className='bordered' onClick={() => {
                  const name = prompt("Enter new resume name");
                  if (name) {
                    setResume(name);
                    dispatch({ type: "create-new-resume", resumeName: name });
                  }
                }
                }>⊕ New Resume</button>
              </div>

              {currentTab === "content-editor" &&
                <div>
                  <h1>Content Editor</h1>
                  {(layoutSchemas && dataSchemas) && <AddNewSection layoutSchemas={layoutSchemas!} dataSchemas={dataSchemas!} />}
                  {(state.resume && layoutSchemas) &&
                    state.resume.sections.map((section, index) => {
                      return (
                        <Section key={index} section={section} dataSchemas={dataSchemas!} layoutSchemas={layoutSchemas!} />
                      )
                    })
                  }
                </div>}
              {currentTab === "layout-editor" &&
                <LayoutEditor />
              }
              {currentTab === "schema-editor" &&
                <DataSchemaEditor />
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", margin: "20px", minWidth: "640px", maxHeight: "95vh", overflow: "scroll" }}>
              <div style={{ display: "flex", flexDirection: "row", marginBottom: "5px" }}>
                <button className='bordered' onClick={uploadResume} >&#x1F4C1; Import</button>
                <button className='bordered' onClick={uploadResumeFromGist} >&#x1F517; Import</button>
                <button className='bordered' onClick={downloadResume} >⤓ Download</button>
                <button className='bordered' onClick={() => setDebug(!debug)}>&#x1F41E; Debug</button>
              </div>
              <div id="pdf-container" style={{ display: "flex", flexDirection: "column" }}></div>
            </div>
          </div>
        </Layout>
      </DocumentDispatchContext.Provider>
    </EditorContext.Provider>
  );
}

export default App;
