"use client";
import { DocumentContext } from "@/pages";
import { SectionLayout } from "cvdl-ts/dist/Layout";
import { LayoutSchema } from "cvdl-ts/dist/LayoutSchema";
import { LocalStorage } from "cvdl-ts/dist/LocalStorage";
import { Width } from "cvdl-ts/dist/Width";
import { useContext, useEffect, useState } from "react";


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

const ControlPanel = (props: { layout: SectionLayout, setLayout: any, lens: Lens }) => {
    const current = followLens(props.lens, props.layout);
    console.error(current);
    return (
        <div>
            <h2>Control Panel</h2>
            {/* <pre>{JSON.stringify(current, null, 2)}</pre> */}
            <div style={{ display: "flex", flexDirection: "column"}}>
                <label>Font Name</label>
                <input type="text" defaultValue={current.inner.font.name} onChange={(e) => { current.inner.font.name = e.target.value }} />
                <label>Font Size</label>
                <input type="number" defaultValue={current.inner.font.size} onChange={(e) => { current.inner.font.size = parseInt(e.target.value); props.setLayout({...props.layout}) }} />
                <label>Font Weight</label>
                <input type="text" defaultValue={current.inner.font.weight} onChange={(e) => { current.inner.font.weight = e.target.value }} />
                <label>Font Style</label>
                <input type="text" defaultValue={current.inner.font.style} onChange={(e) => { current.inner.font.style = e.target.value }} />
                <label>Margin Left</label>
                <input type="number" defaultValue={current.inner.margin.left} onChange={(e) => { current.inner.margin.left = parseInt(e.target.value) }} />
                <label>Margin Right</label>
                <input type="number" defaultValue={current.inner.margin.right} onChange={(e) => { current.inner.margin.right = parseInt(e.target.value) }} />
                <label>Margin Top</label>
                <input type="number" defaultValue={current.inner.margin.top} onChange={(e) => { current.inner.margin.top = parseInt(e.target.value) }} />
                <label>Margin Bottom</label>
                <input type="number" defaultValue={current.inner.margin.bottom} onChange={(e) => { current.inner.margin.bottom = parseInt(e.target.value) }} />
                <label>Alignment</label>
                <input type="text" defaultValue={current.inner.alignment} onChange={(e) => { current.inner.alignment = e.target.value }} />
                <label>Width</label>
                <input type="number" defaultValue={current.inner.width.value} onChange={(e) => { current.inner.width = Width.percent(parseInt(e.target.value)) }} />

            </div>

        </div>
    );

}


const RowEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            padding: "5px",
            outline: "1px solid ",
        }}>
            {
                props.layout.inner.elements.map((item: any, index: number) => {
                    return <LayoutEditWindow key={index} layout={item} lens={[...props.lens, {'index': index}]} setLens={props.setLens} />
                })
            }
        </div>
    );
}

const StackEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "5px",
            outline: "1px solid black",

        }}>
            {
                props.layout.inner.elements.map((item: any, index: number) => {
                    return <LayoutEditWindow key={index} layout={item} lens={[...props.lens, {'index': index}]} setLens={props.setLens} />
                })
            }
        </div>
    );
}

const ItemEditor = (props: { layout: any, lens: Lens, setLens: any }) => {
    return (
        <div>
            {/* <pre>{JSON.stringify(props.layout, null, 2)}</pre> */}
            <div
                style={{
                    fontFamily: props.layout.inner.font.name,
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
                    padding: "2px",
                }}
                onClick={() => {
                    props.setLens([...props.lens]);
                }}
            >{props.layout.inner.item}
            </div>
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
        <div
        >
            {
                <TagSwitch tag={props.layout.inner.tag} layout={props.layout} lens={props.lens} setLens={props.setLens} />
            }
        </div>
    );
}

const LayoutEditor = () => {
    const resumeContext = useContext(DocumentContext);

    const layoutSchemaNames = resumeContext?.layout_schemas();
    const [layoutSchemaIndex, setLayoutSchemaIndex] = useState<number | null>(null);
    const [layoutSchema, setLayoutSchema] = useState<LayoutSchema | null>(null);
    const [layoutSchemaControlPanel, setLayoutSchemaControlPanel] = useState<any>(null);
    useEffect(() => {

        const storage = new LocalStorage();
        if (layoutSchemaNames && layoutSchemaNames.length > 0 && layoutSchemaIndex !== null) {

            storage.load_layout_schema(layoutSchemaNames[layoutSchemaIndex]).then((schema) => {
                setLayoutSchema(schema);
            });
        }
    }, [layoutSchemaIndex]);

    const setLayout = (sectionLayout: SectionLayout) => {
        if (!layoutSchema) {
            return;
        }
        layoutSchema.item_layout_schema = sectionLayout;
        setLayoutSchema({...layoutSchema});
    }
    return (
        <div>
            <h1>Layout Editor</h1>
            {
                layoutSchemaNames?.map((name, index) => {
                    return <button key={index} onClick={() => setLayoutSchemaIndex(index)}>{name}</button>
                })
            }
            {
                layoutSchema ?
                    <>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <LayoutEditWindow setLens={setLayoutSchemaControlPanel} lens={[{'attribute': 'header_layout_schema'}]} layout={layoutSchema.header_layout_schema} />
                                <div style={{ height: "5px" }}></div>
                                <LayoutEditWindow setLens={setLayoutSchemaControlPanel} lens={[]} layout={layoutSchema.item_layout_schema} />
                            </div>
                            {
                                layoutSchemaControlPanel !== null && <ControlPanel layout={layoutSchema.item_layout_schema} setLayout={setLayout} lens={layoutSchemaControlPanel} />
                            }
                        </div>
                    </> : <p>Loading...</p>

            }
        </div>
    );
}

export default LayoutEditor;