import { useEffect, useState, useRef, useMemo } from 'react'
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import { Col, Form, Row } from 'react-bootstrap'
import Select from "react-select";
import JoditEditor from "jodit-react";
// import Dropzone from "react-dropzone";

const MyForm = ({ errors, fields, initialValues, validSchema, onSubmit = (values) => null, isReset = false, disabled = false }: { errors?: any, fields?: any[], initialValues: any, validSchema: SchemaOf<any>, onSubmit?: (values: any) => void, isReset?: boolean, disabled?: boolean }) => {
    const [inactive, setInActive] = useState(false)
    const [showTable, setShowTable] = useState(false);
    return (
        <Formik initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={validSchema}
            onSubmit={(values, { resetForm }) => {
                if (!disabled) {
                    onSubmit(values)
                    isReset && resetForm()
                    setInActive(true)
                    setTimeout(() => { setInActive(false) }, 2000);
                }
            }}>
            {({ values, setFieldValue }) => {
                return (
                    <FormikForm autoComplete="off">
                        <Row>
                            <Col md={12}>
                                {errors && errors?.id && <div className="alert alert-danger py-2 fs--1 mb-0 d-flex" role="alert"><i className="fa-solid fa-exclamation"></i> {errors && errors?.id}<ErrorMessage name='id' /> </div>}
                            </Col>
                            {fields?.map(({ isDisabled = false, ...field }, i) => {
                                return (
                                    <Col md={field?.col ? field?.col : 12} key={i}>
                                        {field?.type === "line" ? <><hr /> <h6 style={{ color: 'rgb(78 83 90)' }} className='fs-1'>{field?.label}</h6> </> :
                                            <Form.Group className="my-2">
                                                {!['submit', 'file', 'hidden'].includes(field?.type) &&
                                                    <Form.Label className="form-label">
                                                        {field?.label}
                                                    </Form.Label>}
                                                {(() => {
                                                    delete field?.hideLabel


                                                    switch (field?.type) {
                                                        // For Select Input
                                                        case 'select':
                                                            var field2 = Object.assign({}, field)
                                                            delete field2.options
                                                            return (
                                                                <Field disabled={disabled || isDisabled} className="form-select" {...field2} name={field?.name} as="select">
                                                                    <option value="0" disabled>Select {field?.label}</option>
                                                                    {
                                                                        field?.options.map((option:any, i:any) => (
                                                                            <option value={option?.id} key={option?.id} >{option?.name}</option>
                                                                        ))
                                                                    }
                                                                </Field>
                                                            )

                                                        // For Select Input
                                                        case 'select2':
                                                            return <Field disabled={disabled || isDisabled} {...field} options={field?.options} component={Select2} />

                                                        // For Select Input
                                                        case 'select-multiple':

                                                            return <Field disabled={disabled || isDisabled} isMulti={true} {...field} options={field?.options} component={SelectMultiple} />

                                                        // For Textarea Input
                                                        case 'textarea':
                                                            return <Field disabled={disabled || isDisabled} className="form-control" placeholder={field?.label} as="textarea" {...field} />

                                                        // For Html Editor Input
                                                        case 'text-editer':
                                                            return <Field disabled={disabled || isDisabled} name={field?.name} component={TextEditer} {...field} />

                                                        // For File Input
                                                        case 'file':
                                                            return <Field disabled={disabled || isDisabled} name={field?.name} component={PictureInput} {...field} />

                                                        case 'multi-file':
                                                            return <Field disabled={disabled || isDisabled} name={field?.name} multiple component={PictureInputPreview} {...field} />;

                                                        // case 'multi-file-data':
                                                        //     return <Field disabled={disabled || isDisabled} name={field?.name} multiple component={MultiFileUpload} {...field} />;


                                                        case 'check':
                                                            return <Field disabled={disabled || isDisabled} type="checkbox" name={field?.name} label={field?.name} component={Checkbox} />
                                                        // For Read Only Input 
                                                        case 'readOnly':
                                                            return (
                                                                <div>
                                                                    <Field
                                                                        disabled={disabled || isDisabled}
                                                                        type="text"
                                                                        name={field?.name}
                                                                        value={field?.value}
                                                                        readOnly
                                                                        className="form-control"
                                                                    />
                                                                    <Field
                                                                        type="hidden"
                                                                        name={field?.name}
                                                                        value={field?.hiddenValue}
                                                                    />
                                                                </div>
                                                            )

                                                        // For Submit Input
                                                        case 'submit':
                                                            return <button disabled={disabled || isDisabled || inactive} value="submit" className="btn btn-primary" {...field}>{field?.label}</button>

                                                        case 'features':
                                                            return (
                                                                <Form.Group className="mb-3">
                                                                    <FeatureManager
                                                                        values={values}
                                                                        setFieldValue={setFieldValue}
                                                                        options={field.options}
                                                                    />
                                                                    <ErrorMessage
                                                                        name={field.name}
                                                                        component="div"
                                                                        className="text-danger small"
                                                                    />
                                                                </Form.Group>
                                                            );

                                                        // For Rest of Input Filed
                                                        default:
                                                            return <Field disabled={disabled || isDisabled} className="form-control" placeholder={field?.label} {...field} autoComplete="off" />
                                                    }
                                                })()}
                                                <small className='text-danger'>{errors && errors[field?.name]}<ErrorMessage name={field?.name} /></small>


                                            </Form.Group>
                                        }
                                    </Col>
                                )
                            })}
                        </Row>
                    </FormikForm>
                )
            }}
        </Formik >
    )
}

const PictureInput = ({ form, field, multiple, label, disabled }: { form: any, field: any, multiple?: boolean, label?: string, disabled?: boolean }) => {

    var [url, setUrl] = useState('')
    var [urls, setUrls] = useState<string[]>([])

    useEffect(() => {
        var data = field?.value
        if (data != null && Array.isArray(data)) { setUrls(data) }
        else if (data != null && typeof data != 'object') { setUrl(data) }
    }, [field])

    return (
        <>
            <label className="form-label form-label">
                {label}
                {![undefined, null, ""].includes(url) && <a className="fs--2 ms-1" target="__blank" href={url}> (Download Attachment) </a>}
            </label>
            <div className="input-group">
                <input
                    name={field?.name}
                    className="form-control"
                    type="file"
                    multiple={multiple}
                    disabled={disabled}
                    aria-describedby="btnGroupAddon2"
                    onChange={(e:any) => {
                        if (e.target.files) {
                            multiple ? form.setFieldValue(field?.name, e.target.files) : form.setFieldValue(field?.name, e.target.files[0]);
                        }
                    }} />
                {![undefined, null, ""].includes(url) &&
                    <a className="input-group-text" target="__blank" href={url} id="btnGroupAddon2">
                        <i className="fa fa-download"></i>
                    </a>}

                {urls.length > 0 && <div className="btn-group me-2" role="group">
                    {urls?.map((item, i) => (
                        <a key={i} type="button" className="btn btn-secondary" href={item} target="__blank"><i className="fa fa-download"></i></a>
                    ))}
                </div>}

            </div>
        </>
    )
};


const PictureInputPreview = ({ form, field, multiple = false, label, disabled }: { form: any, field: any, multiple?: boolean, label?: string, disabled?: boolean }) => {
    const [previews, setPreviews] = useState<any>([]);

    useEffect(() => {
        if (field?.value && Array.isArray(field?.value)) {
            setPreviews(field.value.map((file:any) => (typeof file === "string" ? file : URL.createObjectURL(file))));
        }
    }, [field?.value]);

    const handleFileChange = (e:any) => {
        const files = Array.from(e.target.files);
        if (multiple) {
            form.setFieldValue(field?.name, files);
        } else {
            form.setFieldValue(field?.name, files[0]);
        }
        setPreviews(files.map((file:any) => URL.createObjectURL(file)));
    };

    return (
        <>
            <label className="form-label"></label>
            <input
                name={field?.name}
                className="form-control"
                type="file"
                multiple={multiple}
                disabled={disabled}
                accept="image/*"
                onChange={handleFileChange}
            />
            {previews.length > 0 && (
                <div className="mt-2">
                    {previews.map((src:any, index:number) => (
                        <img key={index} src={src} alt={`Preview ${index}`} className="img-thumbnail me-2" style={{ width: "80px", height: "80px" }} />
                    ))}
                </div>
            )}
        </>
    );
};

const PictureInputSmall = ({ form, field, multiple, disabled, className = "" }: { form: any, field: any, multiple?: boolean, disabled?: boolean, className?: string }) => {
    var random = Math.random();
    const [selected, setSelected] = useState(false)
    return (
        <>
            <label className={`btn btn-sm btn-falcon-default mb-0 ${selected ? className : ''}`} htmlFor={`random-${random}`}>
                <i className="fa fa-paperclip" aria-hidden="true"></i>
            </label>
            <input
                name={field?.name}
                id={`random-${random}`}
                className="form-control d-none"
                type="file"
                multiple={multiple}
                disabled={disabled}
                aria-describedby="btnGroupAddon2"
                onChange={(e:any) => {
                    setSelected(true)
                    multiple ? form.setFieldValue(field?.name, e.target.files) : form.setFieldValue(field?.name, e.target.files[0])
                }} />
        </>
    )
};

const Checkbox = ({ form, field, disabled, size = 'lg', onChangeCustom = () => null, className = "", checked = false }: { form: any, field: any, disabled?: boolean, size?: string, onChangeCustom?: (value: number) => void, className?: string, checked?: boolean }) => {
    return (
        <div className={`form-check form-switch form-${size}-switch ${className}`}>
            <input checked={checked} disabled={disabled} className="form-check-input" id="Checked" type="checkbox" {...field} onChange={(e) => {
                onChangeCustom(Number(e.target.checked))
                form.setFieldValue(field?.name, Number(e.target.checked))
            }} />
            <label className="form-check-label" htmlFor="Checked"></label>
        </div>
    )
};

const Select2 = ({ form, field, options = [], label = "", menuPortalTarget = null, className = "", classNamePrefix = "react-select", disabled = false, onChange = () => null, onChangeCustom = () => null, onBlur = () => null, onChangeUpdateToNull = false }: {form:any, field:any, options:any, label:any, menuPortalTarget:any, className:any, classNamePrefix:any, disabled:any, onChange:any, onChangeCustom:any, onBlur:any, onChangeUpdateToNull:any}) => {

    const [myValue, setMyValue] = useState(null);
    useEffect(() => {
        if (onChangeUpdateToNull) {
            var selected = options.filter((row:any) => [row.id, row._id].includes(field?.value))
            selected.length === 1 ? setMyValue(selected?.[0]) : setMyValue(null)
        } else {
            setMyValue(options.find((row:any) => [row.id, row._id].includes(field?.value)))
        }
       
    }, [field?.value, options, onChangeUpdateToNull])
    
 
    
    return (
         
        <Select
            closeMenuOnSelect={true}
            options={options}
            isDisabled={disabled}
            menuPortalTarget={menuPortalTarget}
            placeholder={`Select ${label}`}
            // menuIsOpen={false}
            className={className}
            classNamePrefix={classNamePrefix}
            isOptionSelected={(option:any, selectValue:any) => selectValue.some((i:any) => i === option)}
            getOptionLabel={(option: any) => option?.name}
            getOptionValue={(option: any) => option?.id || option?._id}
            value={myValue}
            onBlur={() => { onBlur(myValue?.[0]) }}
            onChange={(value:any) => {
                onChange(value)
                onChangeCustom(value)
                setMyValue(value)
                form.setFieldValue(field?.name, value?.id || value?._id)
            }}
        />
    )
};

const SelectMultiple = ({
    className,
    placeholder,
    field,
    form,
    disabled = false,
    options,
    isMulti = false
}:{
    className:any
    placeholder:any
    field:any
    form:any
    disabled:any
    options:any
    isMulti:any 
}) => {

    const onChange = (option:any) => {
        form.setFieldValue(
            field?.name,
            isMulti
                ? (option).map((item:any) => item.id)
                : (option).id
        );
    };

    const getValue = () => {
        if (options) {
            return isMulti
                ? options.filter((option:any) => field?.value.indexOf(option?.id) >= 0)
                : options.find((option:any) => option?.id === field?.value);
        } else {
            return isMulti ? [] : "";
        }
    };

    return (
        <Select
            className={className}
            isDisabled={disabled}
            name={field?.name}
            value={getValue()}
            onChange={onChange}
            placeholder={placeholder}
            options={options}
            getOptionLabel={(option:any) => option?.name}
            getOptionValue={(option:any) => option?.id}
            isMulti={isMulti}
        />
    );
};

const TextEditer = ({ form, field, disabled }: {form:any, field:any, disabled:any}) => {
    const editor = useRef(null)
    const [canUpdate, setCanUpdate] = useState(true)
    const [content, setContent] = useState<any>('')

    useEffect(() => {
        if (canUpdate && field?.value !== "") {
            setContent(field?.value)
            setCanUpdate(false)
        }

    }, [field?.value, canUpdate])

    return useMemo(() => {
        const config = { readonly: disabled }
        return <JoditEditor ref={editor} value={content} config={config} onBlur={(content:any) => form.setFieldValue(field?.name, content)} />
    }, [content, form, field?.name, disabled])
}


const FeatureManager = ({ options, values, setFieldValue }: {options:any, values:any, setFieldValue:any }) => {
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [featureValue, setFeatureValue] = useState('');
    const [featureDescription, setFeatureDescription] = useState('');

    const handleAddFeature = () => {
        if (!selectedFeature || !featureValue ) return;

        const newFeatures = {
            ...values.features,
            [selectedFeature.id]: {
                name: selectedFeature.name,
                description: featureDescription,
                value: parseInt(featureValue)
            }
        };
        
        setFieldValue('features', newFeatures);
        setSelectedFeature(null);
        setFeatureValue('');
        setFeatureDescription('')
    };

    const handleRemoveFeature = (featureKey:any) => {
        const newFeatures = { ...values.features };
        delete newFeatures[featureKey];
        setFieldValue('features', newFeatures);
    };

    return (
        <div className="feature-manager">
            <div className="d-flex gap-2 mb-3">
                <Field
                    name="featureSelector"
                    component={Select2}
                    options={options}
                    value={selectedFeature}
                    onChange={setSelectedFeature}
                    placeholder="Select Feature"
                    className="form-control no-outline-select"
                />
                <Field
                    type="text"
                    name="feature_description"
                    placeholder="feature description"
                    value={featureDescription}
                    onChange={(e:any) => setFeatureDescription(e.target.value)}
                    className="form-control"
                />

                <Field
                    style={{ width: '25%' }}
                    type="number"
                    name="featureValue"
                    placeholder="Value"
                    value={featureValue}
                    onChange={(e:any) => setFeatureValue(e.target.value)}
                    className="form-control"
                />
                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={handleAddFeature}
                >
                    Add
                </button>
            </div>

            {Object.keys(values.features || {}).length > 0 && (
                <div className="feature-list w-full">
                    <table className="table">
                        <thead>
                            <tr>
                                <th scope="col">Sr No.</th>
                                <th scope="col">Feature Name</th>
                                <th scope="col">Description</th>
                                <th scope="col">Value</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(values.features || {}).map(([key, feature]) => {
                                const typedFeature = feature as { name: string; description: string; value: number };
                                return (
                                    <tr key={key}>
                                        <th scope="row">{key}</th>
                                        <td>{typedFeature.name}</td>
                                        <td>{typedFeature.description}</td>
                                        <td>{typedFeature.value}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() => handleRemoveFeature(key)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


// const MultiFileUpload = ({ form, field, multiple = false, label, disabled }) => {
//     const [files, setFiles] = useState([]);

//     const onDrop = (acceptedFiles) => {
//       setFiles(acceptedFiles);
//     };

//   return (
//     <div>
//         <Dropzone onDrop={onDrop} multiple={true}accept="image/*">
//         {({ getRootProps, getInputProps }) => (
//             <div {...getRootProps()} className="dropzone">
//             <input {...getInputProps()} name={field?.name} />
//             <p>Drag & drop some files here, or click to select files</p>
//             </div>
//         )}
//         </Dropzone>

//         <div className="file-previews">
//         {files.map((file, index) => (
//             <div key={index} className="file-preview">
//             <img src={URL.createObjectURL(file)} alt={file.name} width="100" />
//             <p>{file.name}</p>
//             </div>
//         ))}
//         </div>
//     </div>
//   );
// };

export { PictureInput, PictureInputSmall, Checkbox, Select2, SelectMultiple, TextEditer, PictureInputPreview }
export default MyForm