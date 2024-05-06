
import { DataSchema } from 'cvdl-ts/dist/DataSchema';
import { ItemContent, ResumeSection } from 'cvdl-ts/dist/Resume';
import SectionItemField from './SectionItemField';
import { useContext, useState } from 'react';
import { DocumentDispatchContext } from '@/pages';

export type FieldProps = {
    name: string;
    value: string;
    isActive: boolean;
}

export type ItemProps = FieldProps[];
export type SectionProps = ItemProps[];


const ItemHeader = ({ itemContent, showAll, section, item, moveUp, moveDown, copy }: {
    itemContent: ItemProps,
    showAll: () => void,
    section: string,
    item: number,
    moveUp: () => void,
    moveDown: () => void,
    copy: () => void,
}) => {
    // Pick the first two fields, and render them as the header. The first is normal, the second is italic.
    const dispatch = useContext(DocumentDispatchContext);
    const [editWindow, setEditWindow] = useState<boolean>(false);

    if (itemContent.length < 2) {
        console.log(itemContent);
        console.error("Section content is too short");
        return <></>
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} onClick={showAll}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                {itemContent[0].isActive && <span>{itemContent[0].value}</span>}
                ,&nbsp;
                {itemContent[1].isActive && <span style={{ fontStyle: "italic" }}>{itemContent[1].value}</span>}
            </div>
            <div>
                <button className='bordered' onClick={(e) => { dispatch!({ type: 'delete-item', section: section, item: item }); e.stopPropagation() }} >&#x232B;</button>
                <button className='bordered' onClick={(e) => { moveUp(); e.stopPropagation() }}>↑</button>
                <button className='bordered' onClick={(e) => { moveDown(); e.stopPropagation() }}>↓</button>
                <button className='bordered' onClick={(e) => { copy(); e.stopPropagation() }}>&#x2398;</button>
            </div>
        </div>
    )
}


const SectionItem = ({ section, item, itemContent }: { section: string, item: number, itemContent: ItemProps }) => {
    const [showAll, setShowAll] = useState<boolean>(false);
    const [fields, setFields] = useState<ItemProps>(itemContent);
    const dispatch = useContext(DocumentDispatchContext);
    const toggleShowAll = () => {
        setShowAll(!showAll);
    }

    return (
        <div
            className={`bordered-full ${!showAll ? 'clickable' : ''}`}
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
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
                                    <div style={{ display: "flex", flexDirection: "row", marginTop: "5px" }}>
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
                                                            marginRight: "5px"
                                                        }}
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

                                <button className='bordered' style={{ marginRight: "0px", marginLeft: "auto", marginTop: "0px", marginBottom: "auto" }} onClick={toggleShowAll}>✗</button>
                            </div>
                        </>
                    )
                    : <ItemHeader
                        itemContent={fields}
                        section={section}
                        item={item}
                        showAll={toggleShowAll}
                        moveDown={() => dispatch!({ type: 'move-item', section: section, item: item, direction: 'down' })}
                        moveUp={() => dispatch!({ type: 'move-item', section: section, item: item, direction: 'up' })}
                        copy={() => dispatch!({ type: 'copy-item', section: section, item: item })}
                    />
            }
        </div>
    )

}

export default SectionItem;