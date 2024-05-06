
import { DataSchema } from 'cvdl-ts/dist/DataSchema';
import { ItemContent, ResumeSection } from 'cvdl-ts/dist/Resume';
import SectionItemField from './SectionItemField';
import { useContext, useState } from 'react';
import SectionItem from './SectionItem';
import { DocumentDispatchContext } from '@/pages';

export type FieldProps = {
    name: string;
    value: string;
    isActive: boolean;
}

export type ItemProps = FieldProps[];
export type SectionProps = ItemProps[];

const computeSectionContent = (section: ResumeSection, dataSchemas: DataSchema[]): SectionProps => {
    const dataSchema = dataSchemas.find((schema) => schema.schema_name === section.data_schema);
    if (!dataSchema) {
        return [];
    }
    const sectionContent: SectionProps = [];
    section.items.forEach((item) => {
        const itemContent: ItemProps = [];
        dataSchema.item_schema.forEach((field) => {
            let name = field.name;
            let value = ItemContent.toString(item.fields.get(field.name) ?? ItemContent.None());
            let isActive = value !== "";
            itemContent.push({
                name,
                value,
                isActive
            });
        })
        sectionContent.push(itemContent);
    })
    console.log(sectionContent);
    return sectionContent;
}


const Section = ({ section, dataSchemas }: { section: ResumeSection, dataSchemas: DataSchema[] }) => {
    const [showAll, setShowAll] = useState<boolean>(false);
    const toggleShowAll = () => {
        setShowAll(!showAll);
    }

    const sectionContent = computeSectionContent(section, dataSchemas);
    const dispatch = useContext(DocumentDispatchContext);
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid black",
                borderRadius: "5px",
                padding: "10px",
                marginBottom: "10px"
            }}
        >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "10px"}}>
                <div style={{ display: "flex", flexDirection: "row"}}>
                    <h1 key={section.section_name} style={{ fontSize: "1.3em", fontWeight: "bold", marginRight: "10px" }} > {section.section_name} </h1>

                    <div className='bordered'>{sectionContent.length}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "80px" }}>

                    <button className='bordered' onClick={() => {
                        dispatch!({ type: "add-empty-item", section: section.section_name })
                    }}> + </button>
                    <button className='bordered' onClick={toggleShowAll}> {showAll ? "✗" : "≡"} </button>

                </div>
            </div>
            {

                showAll &&
                <>
                    <div style={{ flexDirection: "row" }}>
                        <b > Layout: </b>
                        <input list="layout-schemas"
                            defaultValue={section.layout_schema}
                        />
                    </div>
                    {
                        sectionContent.map((itemContent, index) => {
                            return (
                                <SectionItem key={section.items[index].id} item={index} section={section.section_name} itemContent={itemContent} />
                            )
                        })
                    }
                </>
            }
        </div>)
}

export default Section;