import { LayoutSchema } from "cvdl-ts/dist/LayoutSchema";
import { DataSchema } from "cvdl-ts/dist/DataSchema";
import { useContext, useState } from "react";
import { DocumentDispatchContext } from "./State";


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

export default AddNewSection;