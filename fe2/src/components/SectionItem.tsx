
import { DataSchema } from 'cvdl-ts/dist/DataSchema';
import { ItemContent, ResumeSection } from 'cvdl-ts/dist/Resume';
import SectionItemField from './SectionItemField';
import { useState } from 'react';

export type FieldProps = {
    name: string;
    value: string;
    isActive: boolean;
}

export type ItemProps = FieldProps[];
export type SectionProps = ItemProps[];


const ItemHeader = ({ itemContent, showAll }: { itemContent: ItemProps, showAll: () => void }) => {
    // Pick the first two fields, and render them as the header. The first is normal, the second is italic.
    if (itemContent.length < 2) {
        console.log(itemContent);
        console.error("Section content is too short");
        return <></>
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                {itemContent[0].isActive && <span>{itemContent[0].value}</span>}
                ,&nbsp;
                {itemContent[1].isActive && <span style={{ fontStyle: "italic" }}>{itemContent[1].value}</span>}
            </div>
            <button onClick={showAll}>^</button>
        </div>
    )
}


const SectionItem = ({ section, item, itemContent }: { section: string, item: number, itemContent: ItemProps }) => {
    const [showAll, setShowAll] = useState<boolean>(false);
    const [fields, setFields] = useState<ItemProps>(itemContent);

    const toggleShowAll = () => {
        setShowAll(!showAll);
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                border: "1px solid black",
                borderRadius: "5px",
                margin: "5px",
            }}
        >

            {
                showAll ?

                    (
                        <>
                            <div style={{ display: "flex", flexDirection: "row" }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {
                                        fields.map((field, index) => {
                                            if (!field.isActive) {
                                                return <></>
                                            };
                                            return (
                                                <SectionItemField section={section} item={item} field={field} key={index} />
                                            )
                                        })
                                    }
                                    <div style={{ display: "flex", flexDirection: "row"}}>
                                    {
                                        fields.filter((ic) => !ic.isActive).map((field, index) => {
                                            return (
                                                <div key={index} >
                                                    <button style={{ 
                                                        display: "inline",
                                                        whiteSpace: "pre-wrap",
                                                        border: "1px solid black",
                                                        borderRadius: "12px",
                                                        paddingRight: "5px",
                                                        paddingLeft: "5px",
                                                        marginRight: "5px" }}
                                                        onClick={() => { field.isActive = true; setFields([...fields]) }}    
                                                    >
                                                        {field.name}{' '}+
                                                    </button>
                                                </div>
                                            )
                                        })
                                    }
                                    </div>
                                </div>

                                <button style={{ marginRight: "0px", marginLeft: "auto", marginTop: "0px", marginBottom: "auto" }} onClick={toggleShowAll}>x</button>
                            </div>
                        </>
                    )
                    : <ItemHeader itemContent={fields} showAll={toggleShowAll} />
            }
        </div>
    )

}

export default SectionItem;