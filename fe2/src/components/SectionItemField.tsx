
import { FieldProps } from '@/components/SectionItem';
import { useContext, useReducer } from 'react';
import { DocumentContext, DocumentDispatchContext } from '@/pages/index';
import { ItemContent } from 'cvdl-ts/dist/Resume';

function debounce<T extends Function>(cb: T, wait = 200) {
    let h = 0;
    let callable = (...args: any) => {
        clearTimeout(h);
        h = setTimeout(() => cb(...args), wait) as any;
    };
    return callable as any as T;
}


const SectionItemField = ({ section, item, field }: { section: string, item: number, field: FieldProps }) => {
    const dispatch = useContext(DocumentDispatchContext);
    const debouncedDispatch = debounce(dispatch!);
    return (
        <div key={field.name} >
            <b> {field.name} </b>
            <input type="text"
                style={{ 
                    width: "100%",
                    padding: "5px",
                    borderRadius: "5px",
                    border: "1px solid black"
                }}
                defaultValue={field.value}
                onChange={(e) => {
                    const value = e.target.value;
                    debouncedDispatch({ type: "field-update", section: section, item: item, field: field.name, value: { tag: "String", value: value } });
                }}
                onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.boxShadow = "0 0 10px #F0EBE3";
                }}
                onBlur={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.boxShadow = "none";
                }}
            />
        </div>
    )
}

export default SectionItemField;