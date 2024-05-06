"use client";
import { DocumentContext, DocumentDispatchContext } from "@/pages";
import { assert } from "console";
import { Alignment } from "cvdl-ts/dist/Alignment";
import { DataSchema } from "cvdl-ts/dist/DataSchema";
import { FontStyle, FontWeight } from "cvdl-ts/dist/Font";
import { Elem, Row, SectionLayout, Stack } from "cvdl-ts/dist/Layout";
import { LayoutSchema } from "cvdl-ts/dist/LayoutSchema";
import { LocalStorage } from "cvdl-ts/dist/LocalStorage";
import { Width } from "cvdl-ts/dist/Width";
import { useContext, useEffect, useReducer, useState } from "react";


type LensStep = {
    'attribute': string,
} | {
    'index': number,
};

type Lens = LensStep[];

const followLens = (lens: Lens, obj: any) => {
    return lens.reduce((acc, step) => {
        if ('attribute' in step) {
            return acc.inner[step.attribute];
        } else {
            return acc.inner.elements[step.index];
        }
    }, obj);
}

type LayoutVisitorStep = 'down' | 'up' | 'next' | 'prev';
type LayoutVisitor = LayoutVisitorStep[];
const layoutFollowLens = (lens: LayoutVisitor, layout: SectionLayout) => {
    let current = layout;
    let parents = [];

    for (let step of lens) {
        switch (step) {
            case 'down': {
                if (current.inner.tag === "Elem") {
                    throw new Error("Cannot go down from Elem");
                }
                parents.push(current);
                current = current.inner.elements[0];
                break;
            }
            case 'up': {
                let parent = parents.pop();
                if (parent === undefined) {
                    throw new Error("Cannot go up from root");
                }
                current = parent;
                break;
            }
            case 'next': {
                let parent = parents.pop();
                if (parent === undefined) {
                    throw new Error("Cannot go next from root");
                }
                let index = (parent.inner as Row | Stack).elements.indexOf(current);
                if (index === -1) {
                    throw new Error("Cannot find current element in parent");
                }
                if (index === (parent.inner as Row | Stack).elements.length - 1) {
                    throw new Error("Cannot go next from last element");
                }
                current = (parent.inner as Row | Stack).elements[index + 1];
                break;
            }
            case 'prev':
                let parent = parents.pop();
                if (parent === undefined) {
                    throw new Error("Cannot go prev from root");
                }
                let index = (parent.inner as Row | Stack).elements.indexOf(current);
                if (index === -1) {
                    throw new Error("Cannot find current element in parent");
                }
                if (index === 0) {
                    throw new Error("Cannot go prev from first element");
                }
                current = (parent.inner as Row | Stack).elements[index - 1];
                break;
        }
    }
}


const ControlPanel = (props: { layout: SectionLayout, setLayout: any, lens: Lens, setLens: (lens: Lens) => void }) => {
    const current = followLens(props.lens, props.layout);
    switch (current.inner.tag) {
        case "Row":
            return <ContainerControlPanel current={current} layout={props.layout} setLayout={props.setLayout} lens={props.lens} setLens={props.setLens} />;
        case "Stack":
            return <ContainerControlPanel current={current} layout={props.layout} setLayout={props.setLayout} lens={props.lens} setLens={props.setLens} />;
        case "Elem":
            return <ElemControlPanel current={current} layout={props.layout} setLayout={props.setLayout} lens={props.lens} setLens={props.setLens} />;
        default:
            return <p>Unknown tag</p>;
    }
}

const ContainerControlPanel = (props: { current: SectionLayout, layout: SectionLayout, setLayout: any, lens: Lens, setLens: (lens: Lens) => void }) => {
    const [newElement, setNewElement] = useState<string>("");
    const container = props.current.inner as Stack | Row;
    // const randomKey = Math.random().toString(36).substring(7);
    return (
        <div style={{ display: "flex", flexDirection: "row" }}>
            <div className="panel" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                <div style={{ width: "100%", padding: "20px" }}>
                    <b>{container.tag}({container.elements.map((layout) => 
                        layout.inner.tag === "Elem" ? layout.inner.item : layout.inner.tag
                    ).join(" | ")})</b>
                </div>
                <div className="panel-item">
                    <label>Alignment</label>
                    <select name="alignment" value={container.alignment} onChange={(e) => {
                        container.alignment = (e.target.value as Alignment);
                        props.setLayout(props.layout)
                    }}>
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                        <option value="Center">Center</option>
                        <option value="Justify">Justify</option>
                    </select>
                </div>
                <div className="panel-item">
                    <label>Width</label>
                    <input type="number" value={container.width.tag === "Fill" ? 100 : container.width.value} onChange={(e) => {
                        let value = parseInt(e.target.value);
                        if (value > 0 && value <= 100) {
                            container.width = Width.percent(parseInt(e.target.value));
                            props.setLayout(props.layout)
                        }
                    }} />
                </div>
                <div className="panel-item">
                    <button className="bordered" onClick={() => {
                        const parent = followLens(props.lens.slice(0, -1), props.layout);
                        const index = (parent.inner as Row | Stack).elements.indexOf(props.current);
                        (parent.inner as Row | Stack).elements.splice(index, 1);
                        props.setLens(props.lens.slice(0, -1));
                        props.setLayout(props.layout);
                    }}>Delete</button>
                </div>

                <div className="panel-item-elements">
                    {container.elements.length !== 0 && <label>Elements</label>}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {
                            container.elements.map((element, index) => {
                                return (
                                    <div key={index} style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",

                                    }}>
                                        <button className="bordered" onClick={() => {
                                            props.setLayout(props.layout);
                                            props.lens.push({ 'index': index });
                                        }}>{
                                                element.inner.tag === "Elem" ? `Elem(${element.inner.item})` : element.inner.tag
                                            }</button>
                                        <div>
                                            {index > 0 && <button className="bordered" onClick={() => {
                                                const temp = container.elements[index];
                                                container.elements[index] = container.elements[index - 1];
                                                container.elements[index - 1] = temp;
                                                props.setLayout(props.layout);
                                            }}>{container.tag === "Stack" ? "↑" : "←"}</button>}
                                            {index < container.elements.length - 1 && <button className="bordered" onClick={() => {
                                                const temp = container.elements[index];
                                                container.elements[index] = container.elements[index + 1];
                                                container.elements[index + 1] = temp;
                                                props.setLayout(props.layout);
                                            }}>{container.tag === "Stack" ? "↓" : "→"}</button>}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
                <div className="panel-item-elements">
                    <label>Add New Text Element</label>
                    <input type="text" onChange={(e) => {
                        setNewElement(e.target.value);
                    }} />
                    <button className="bordered" onClick={() => {
                        const elem = Elem.default_();
                        elem.is_ref = false;
                        elem.item = newElement;
                        container.elements.push(new SectionLayout(elem));
                        props.setLayout(props.layout);
                    }}> Add</button>
                </div>
            </div>
        </div>
    );

}

const ElemControlPanel = (props: { current: SectionLayout, layout: SectionLayout, setLayout: any, lens: Lens, setLens: (lens: Lens) => void }) => {
    const elem = props.current.inner as Elem;
    return (
        <div style={{ display: "flex", flexDirection: "row" }}>
            <div className="panel">
                <div style={{ width: "100%", padding: "20px" }}>
                    <b>Elem({elem.item})</b>
                </div>
                <div className="panel-item">
                    <label>Font Name</label>
                    <select name="font-name" value={elem.font.name} onChange={(e) => {
                        elem.font.name = e.target.value;
                        props.setLayout(props.layout)
                    }}>
                        <option value="Exo">Exo</option>
                    </select>
                </div>
                <div className="panel-item">
                    <label>Font Size</label>
                    <input type="number" value={elem.font.size} onChange={(e) => {
                        let value = parseInt(e.target.value);
                        if (value > 8) {
                            elem.font.size = parseInt(e.target.value);
                            props.setLayout(props.layout)
                        }
                    }} />
                </div>
                <div className="panel-item">
                    <label>Font Weight</label>
                    <select name="font-weight" value={elem.font.weight} onChange={(e) => {
                        elem.font.weight = (e.target.value as FontWeight);
                        props.setLayout(props.layout)
                    }}>
                        <option value="Thin">Thin</option>
                        <option value="Medium">Medium</option>
                        <option value="Bold">Bold</option>
                    </select>
                </div>
                <div className="panel-item">
                    <label>Font Style</label>
                    <select name="font-style" value={elem.font.style} onChange={(e) => {
                        elem.font.style = (e.target.value as FontStyle);
                        props.setLayout(props.layout)
                    }}>
                        <option value="Italic">Italic</option>
                        <option value="Normal">Normal</option>
                        <option value="Oblique">Oblique</option>
                    </select>
                </div>
                <div className="panel-item">
                    <label>Alignment</label>
                    <select name="alignment" value={elem.alignment} onChange={(e) => {
                        elem.alignment = (e.target.value as Alignment);
                        props.setLayout(props.layout)
                    }}>
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                        <option value="Center">Center</option>
                        <option value="Justify">Justify</option>
                    </select>
                </div>
                <div className="panel-item">
                    <label>Width</label>

                    <select name="width" value={elem.width.tag} onChange={(e) => {
                        elem.width.tag = (e.target.value as "Fill" | "Percent" | "Absolute");
                        props.setLayout(props.layout)

                    }}>
                        <option value="Fill">Fill</option>
                        <option value="Percent">Percent(%)</option>
                        <option value="Absolute">Absolute(px)</option>
                    </select>
                    {
                        elem.width.tag !== "Fill" &&
                        <input type="number" value={elem.width.value} onChange={(e) => {
                            let value = parseInt(e.target.value);
                            if (value > 0) {
                                // @ts-ignore
                                elem.width.value = value;
                                props.setLayout(props.layout)
                            }
                        }} />
                    }
                </div>
                <div className="panel-item">
                    <button className="bordered" onClick={() => {
                        const parent = followLens(props.lens.slice(0, -1), props.layout);
                        const index = (parent.inner as Row | Stack).elements.indexOf(props.current);
                        (parent.inner as Row | Stack).elements.splice(index, 1);
                        props.setLens(props.lens.slice(0, -1));
                        props.setLayout(props.layout);
                    }}>Delete</button>
                </div>

            </div>

        </div>
    );

}


const RowEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div
            className="layout-editor-row"
            style={{
                display: "flex",
                flexDirection: "row",
                padding: "10px",
                outline: "1px solid",
            }}
            onClick={(e) => {
                console.error("Clicked on row")
                props.setLens([...props.lens]);
                e.stopPropagation();
            }}
        >
            {
                props.layout.inner.elements.map((item: any, index: number) => {
                    return <LayoutEditWindow key={index} layout={item} lens={[...props.lens, { 'index': index }]} setLens={props.setLens} />
                })
            }
        </div>
    );
}

const StackEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div
            className="layout-editor-stack"
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                outline: "1px solid black",
            }}
            onClick={(e) => {
                console.error("Clicked on stack")
                props.setLens([...props.lens]);
                e.stopPropagation();
            }}
        >
            {
                props.layout.inner.elements.map((item: any, index: number) => {
                    return <LayoutEditWindow key={index} layout={item} lens={[...props.lens, { 'index': index }]} setLens={props.setLens} />
                })
            }
        </div>
    );
}

const ItemEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div
            className="layout-editor-item"
            style={{
                fontFamily: props.layout.inner.font.name + ", sans-serif",
                fontSize: props.layout.inner.font.size,
                fontWeight: props.layout.inner.font.weight,
                fontStyle: props.layout.inner.font.style,
                marginLeft: props.layout.inner.margin.left,
                marginRight: props.layout.inner.margin.right,
                marginTop: props.layout.inner.margin.top,
                marginBottom: props.layout.inner.margin.bottom,
                alignContent: props.layout.inner.alignment,
                width: props.layout.inner.width.value + "%",
                outline: "1px solid black",
                padding: "2px"
            }}
            onClick={(e) => {
                props.setLens([...props.lens]);
                e.stopPropagation();
            }}
        >{props.layout.inner.item}
        </div>
    );
}

const TagSwitch = (props: { tag: string, layout: LayoutSchema, lens: any, setLens: any }) => {
    switch (props.tag) {
        case "Row":
            return <RowEditor layout={props.layout} lens={props.lens} setLens={props.setLens} />;
        case "Stack":
            return <StackEditor layout={props.layout} lens={props.lens} setLens={props.setLens} />;
        case "Elem":
            return <ItemEditor layout={props.layout} lens={props.lens} setLens={props.setLens} />;
        default:
            return <p>Unknown tag</p>;
    }
}


const LayoutEditWindow = (props: { layout: any, lens: any, setLens: any }) => {

    return (
        <TagSwitch tag={props.layout.inner.tag} layout={props.layout} lens={props.lens} setLens={props.setLens} />
    );
}

const markUsedElements = (layout: LayoutSchema, dataSchema: DataSchema) => {
    const elements: { [key: string]: boolean } = {};

    if (dataSchema === null || layout === null) {
        return elements;
    }

    dataSchema.item_schema.forEach((item) => {
        elements[item.name] = false;
    });

    const markUsed = (layout: any) => {
        if (layout.inner.tag === "Elem") {
            if (layout.inner.is_ref) {
                elements[layout.inner.item] = true;
            }
        } else {
            layout.inner.elements.forEach((element: any) => {
                markUsed(element);
            });
        }
    }

    markUsed(layout.header_layout_schema);
    markUsed(layout.item_layout_schema);

    return elements;
}

const unusedElements = (layout: LayoutSchema, dataSchema: DataSchema) => {
    const elements = markUsedElements(layout, dataSchema);
    return Object.entries(elements).filter((entry) => !entry[1]).map((entry) => entry[0]);
}


const LayoutEditor = () => {
    const resumeContext = useContext(DocumentContext);
    const dispatch = useContext(DocumentDispatchContext);

    const layoutSchemaNames = resumeContext?.layout_schemas();
    const [layoutSchema, setLayoutSchema] = useState<LayoutSchema | null>(null);
    const [dataSchema, setDataSchema] = useState<DataSchema | null>(null);
    const [layoutSchemaControlPanel, setLayoutSchemaControlPanel] = useState<Lens | null>(null);
    const [creatingNewLayoutSchema, setCreatingNewLayoutSchema] = useState<boolean>(false);
    const [layoutVisitor, setLayoutVisitor] = useState<LayoutVisitor | null>(null);
    const [selectedLayout, setSelectedLayout] = useState<SectionLayout | null>(null);
    const [allAvailableLayouts, setAllAvailableLayouts] = useState<string[]>([]);

    useEffect(() => {
        const storage = new LocalStorage();
        setAllAvailableLayouts(storage.list_layout_schemas());
    }, []);

    useEffect(() => {
        if (layoutSchemaControlPanel === null || layoutSchema === null) {
            return;
        }
        const current = followLens(layoutSchemaControlPanel!, layoutSchema!.item_layout_schema);
        setSelectedLayout(current);
    }, [layoutSchema, layoutSchemaControlPanel]);
    const setLayout = (sectionLayout: SectionLayout) => {
        if (!layoutSchema) {
            return;
        }
        const storage = new LocalStorage();
        layoutSchema.item_layout_schema = sectionLayout;
        setLayoutSchema(layoutSchema);
        console.error("Dispatching layout update");
        storage.save_layout_schema(layoutSchema);
        dispatch!({ type: "layout-update", layout: layoutSchema });
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%", margin: "20px" }}>
            <h1>Layout Editor</h1>
            <button className="bordered" onClick={() => {
                setCreatingNewLayoutSchema(true);
                if (dataSchema === null) {
                    return;
                }
                setLayoutSchema(LayoutSchema.empty("new schema", dataSchema!.schema_name))
            }}>⊕ Create New Layout Schema</button>

            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%" }}>
                    {
                        (layoutSchemaNames && layoutSchemaNames.length !== 0) &&
                        <h2>Currently Used Layouts</h2>
                    }
                    {
                        layoutSchemaNames?.map((name, index) => {
                            return <button className="bordered" key={index} onClick={() => {
                                const storage = new LocalStorage();
                                const schema = storage.load_layout_schema(name);
                                setLayoutSchema(schema);
                                setLayoutSchemaControlPanel(null);
                                setDataSchema(storage.load_data_schema(schema.data_schema_name));
                            }}>{name}</button>
                        })
                    }
                </div>


                <div style={{ display: "flex", flexDirection: "column", justifyContent: "left", width: "50%" }}>
                    <h2>All Available Layouts</h2>
                    {
                        allAvailableLayouts.map((name, index) => {
                            if (layoutSchemaNames?.includes(name)) {
                                return null;
                            }
                            return <button className="bordered" key={index} onClick={() => {
                                const storage = new LocalStorage();
                                const schema = storage.load_layout_schema(name);
                                setLayoutSchema(schema);
                                setLayoutSchemaControlPanel(null);
                                setDataSchema(storage.load_data_schema(schema.data_schema_name));
                            }}>{name}</button>
                        })
                    }
                </div>
            </div>

            {
                layoutSchema !== null ?
                    <>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <LayoutEditWindow setLens={setLayoutSchemaControlPanel} lens={[{ 'attribute': 'header_layout_schema' }]} layout={layoutSchema.header_layout_schema} />
                                <div style={{ height: "5px" }}></div>
                                <LayoutEditWindow setLens={setLayoutSchemaControlPanel} lens={[]} layout={layoutSchema.item_layout_schema} />
                            </div>
                            {
                                layoutSchemaControlPanel !== null && <ControlPanel layout={layoutSchema.item_layout_schema} setLayout={setLayout} lens={layoutSchemaControlPanel} setLens={setLayoutSchemaControlPanel} />
                            }
                        </div>
                    </> :
                    creatingNewLayoutSchema &&
                    <div>
                        {
                            resumeContext?.data_schemas().map((name, index) => {
                                return <button key={index} onClick={() => {
                                    const storage = new LocalStorage();
                                    const schema = storage.load_data_schema(name);
                                    setDataSchema(schema);
                                }}>{name}</button>
                            })
                        }
                        <button onClick={() => setCreatingNewLayoutSchema(false)}>Cancel</button>

                    </div>
            }
            {
                (dataSchema !== null && selectedLayout && selectedLayout.inner.tag !== "Elem") &&
                <div>
                    {
                        unusedElements(layoutSchema!, dataSchema).map((used, index) => {
                            return <button
                                key={index}
                                style={{
                                    color: used[1] ? "black" : "red",
                                    border: "1px solid black",
                                    margin: "2px",
                                    padding: "2px",
                                    borderRadius: "5px"
                                }}
                                onClick={() => {
                                    const elem = Elem.default_();
                                    elem.is_ref = true;
                                    elem.item = used;
                                    (selectedLayout!.inner as Row | Stack).elements.push(new SectionLayout(elem));
                                    setLayout(selectedLayout!);
                                }}>{used} +</button>
                        })
                    }
                </div>

            }
        </div>
    );
}

export default LayoutEditor;