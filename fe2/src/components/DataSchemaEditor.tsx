"use client";
import { DocumentContext, DocumentDispatchContext } from "@/pages";
import { DataSchema } from "cvdl-ts/dist/DataSchema";
import { LocalStorage } from "cvdl-ts/dist/LocalStorage";
import { useContext, useState } from "react";

const DataSchemaEditor = () => {
    const resumeContext = useContext(DocumentContext);
    const dispatch = useContext(DocumentDispatchContext);

    const layoutSchemaNames = resumeContext?.layout_schemas();
    const [dataSchema, setDataSchema] = useState<DataSchema | null>(null);
    const storage = new LocalStorage();
    const dataSchemas = storage.list_data_schemas().map((name) => storage.load_data_schema(name));
    const dataSchemaNames = dataSchemas.map((schema) => schema.schema_name);
    return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%", margin: "20px", maxHeight: "95vh", overflow: "scroll"  }}>
            <h1>Layout Editor</h1>

            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%" }}>
                    {
                        (dataSchemaNames && dataSchemaNames.length !== 0) &&
                        <h2>Schemas</h2>
                    }
                    {
                        [...new Set(dataSchemaNames)].map((name, index) => {
                            return <button className="bordered" key={index} onClick={() => {
                                const storage = new LocalStorage();
                                const schema = storage.load_data_schema(name);
                                setDataSchema(schema);
                            }}>{name}</button>
                        })
                    }
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%" }}>
                    {
                        dataSchema &&
                        (
                            <>
                            <h2>{dataSchema.schema_name}</h2>
                            {
                                dataSchema.header_schema.map((field, index) => {
                                    return (<span key={index}>{field.name}</span>);
                                })
                            }
                            {
                                dataSchema.item_schema.map((field, index) => {
                                    return (<span key={index}>{field.name}</span>);
                                })
                            }
                            </>

                        )

                    }
                </div>
            </div>
        </div>
    );
}

export default DataSchemaEditor;