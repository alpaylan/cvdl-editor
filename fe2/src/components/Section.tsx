
import { DataSchema } from 'cvdl-ts/dist/DataSchema';
import { ItemContent, ResumeSection } from 'cvdl-ts/dist/Resume';
import SectionItemField from './SectionItemField';
import { useState } from 'react';
import SectionItem from './SectionItem';

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
            let value = ItemContent.toString(item.get(field.name) ?? ItemContent.None());
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
    const sectionContent = computeSectionContent(section, dataSchemas);
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid black",
                borderRadius: "5px",
                margin: "5px",
                padding: "10px",
            }}
        >
            <h1 key={section.section_name} style={{ fontSize: "1.3em", fontWeight: "bold"}} > {section.section_name} </h1>
            <div style={{ flexDirection: "row" }}>
                <b > Layout: </b>
                <input list="layout-schemas"
                    defaultValue={section.layout_schema}
                />
            </div>
            {
                sectionContent.map((itemContent, index) => {
                    return (
                        <SectionItem key={index} itemContent={itemContent} />
                    )
                })
            }
        </div>
    )
}

export default Section;