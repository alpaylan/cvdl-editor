// Use DOM as a backend for the CVDL layout engine.

import { ElementBox, FontDict, render as anyRender } from "cvdl-ts/dist/AnyLayout";
import { Storage } from "cvdl-ts/dist/Storage";
import { Resume } from "cvdl-ts/dist/Resume";
import { DataSchema } from "cvdl-ts/dist/DataSchema";
import { LayoutSchema } from "cvdl-ts/dist/LayoutSchema";
import { ResumeLayout } from "cvdl-ts/dist/ResumeLayout";

export type RenderResult = {
    blob: Blob,
    fontDict: FontDict,
    pages: ElementBox[][]
}

export type RenderProps = {
    resume_name?: string,
    resume?: Resume,
    data_schemas?: DataSchema[],
    layout_schemas?: LayoutSchema[],
    resume_layout?: ResumeLayout,
    storage: Storage,
    fontDict?: FontDict,
    debug: boolean,
}

export const render = async (
    { resume_name, resume, data_schemas, layout_schemas, resume_layout, storage, fontDict, debug = false }: RenderProps
) => {
    let container = document.getElementById("pdf-container")!;
    container.innerHTML = "";
    let start_time = Date.now();

    if (!resume && !resume_name) {
        throw "Rendering requires either resume_name or resume";
    }

    if (!resume) {
        if (!resume_name) {
            throw "Rendering requires resume_name";
        }
        resume = await storage.load_resume(resume_name);
    }

    if (!data_schemas) {
        data_schemas = await Promise.all(resume.data_schemas().map((schema) => storage.load_data_schema(schema)));
    }

    if (!layout_schemas) {
        layout_schemas = await Promise.all(resume.layout_schemas().map((schema) => storage.load_layout_schema(schema)));
    }

    if (!resume_layout) {
        resume_layout = await storage.load_resume_layout(resume.resume_layout());
    }

    if (!fontDict) {
        fontDict = new FontDict();
    }


    
    let end_time = Date.now();

    console.info(`Loading time: ${end_time - start_time}ms`);

    start_time = Date.now();
    const [font_dict, pages] = await
        anyRender({ layout_schemas, resume, data_schemas, resume_layout, storage, fontDict });
    end_time = Date.now();
    console.info(`Rendering time: ${end_time - start_time}ms`);
    console.log("Constructing printpdf font dictionary...");

    console.log("Rendering the document...");

    // Render the boxes
    for (const [index, boxes] of pages.entries()) {
        let pageContainer = container.appendChild(document.createElement("div"));
        pageContainer.id = `page-${index}`;
        console.log(`Rendering page ${index}`);
        console.log(`width: ${resume_layout!.width}, height: ${resume_layout!.height}`);
        pageContainer.style.cssText = `
            position: relative;
            width: ${resume_layout!.width}px;
            height: ${resume_layout!.height}px;
            border: 1px solid black;
        `;

        let doc = pageContainer.appendChild(document.createElement("div"));

        boxes.forEach((box) => {
            const elements = box.elements;
            // if (debug) {
            //     // Add an empty box to the document to show the bounding box
            //     doc.appendChild(
            //         document.createElement("div")
            //     ).style.cssText = `
            //         position: absolute;
            //         left: ${box.bounding_box.top_left.x}px;
            //         top: ${box.bounding_box.top_left.y}px;
            //         width: ${box.bounding_box.width()}px;
            //         height: ${box.bounding_box.height()}px;
            //         border: 1px solid red;
            //         box-sizing: border-box;
            //     `;
            // }
            for (const [box_, element] of elements) {
                console.log(
                    `(${box_.top_left.x}, ${box_.top_left.y})(${box_.bottom_right.x}, ${box_.bottom_right.y}): ${element.item}`
                );
                console.log(element.font.full_name());

                doc.appendChild(
                    document.createElement("div")
                ).innerText = element.item;
                (doc.lastChild! as HTMLDivElement).style.cssText = `
                    position: absolute;
                    left: ${box_.top_left.x}px;
                    top: ${box_.top_left.y}px;
                    font-family: "${element.font.full_name()}", sans-serif;
                    font-size: ${element.font.size}px;
                    font-style: ${element.font.style};
                    font-weight: ${element.font.weight};
                    ${debug ? "outline: 1px solid black;" : ""}
                `;
                if (debug) {
                    // doc.rect(box_.top_left.x, box_.top_left.y, box_.width(), box_.height()).stroke();
                }
            }
        });
    }
    console.log("Rendering is completed. Saving the document...");

    console.log("Document is saved to output.pdf");
}
