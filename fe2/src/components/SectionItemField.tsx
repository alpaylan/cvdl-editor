
import { FieldProps } from '@/components/SectionItem';

const SectionItemField = ({ field }: { field: FieldProps }) => {
    return (
        <div key={field.name} >
            <b> {field.name} </b>
            <input type="text"
                defaultValue={field.value}
            />
        </div>
    )
}

export default SectionItemField;