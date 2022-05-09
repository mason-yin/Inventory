import React, { useState, useRef, useEffect, useMemo, useCallback} from 'react';
import Modal from "react-bootstrap/Modal";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component

import 'ag-grid-community/dist/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import {Button, Form} from "react-bootstrap";

const App = () => {

    const gridRef = useRef(); // Optional - for accessing Grid's API
    const [rowData, setRowData] = useState(); // Set rowData to Array of Objects, one Object per Row
    const [show, setShow] = useState(false); // set popup modal

    //  show modal popup view
    const handleShow = () => setShow(true);

    // Each Column Definition results in one Column.
    const [columnDefs, setColumnDefs] = useState([
        {
            field: 'name', headerName: 'Name', width : 150,
            suppressSizeToFit: true, filter: true, editable: true
        },
        {
            field: 'category', headerName: 'Category', width : 150,
            suppressSizeToFit: true, filter: true, editable: true,
            cellEditor: 'agSelectCellEditor', cellEditorParams: {
                values: ['dairy', 'meat', 'seafood', 'vegetable', 'fruit', 'beverage', 'cereal']
            }
        },
        {
            field: 'quantity', headerName: 'Quantity', width : 150,
            suppressSizeToFit: true, sortable: true, filter: true, editable: true,
            valueParser: params => {
                let number = Number(params.newValue);
                if (isNaN(number)) {
                    alert("please enter number only!")
                    return params.oldValue
                }
                return number
            }
        },
        {
            field: 'price', headerName: 'Price', width : 150,
            suppressSizeToFit: true, sortable: true, filter: true, editable: true,
            valueParser: params => {
                let number = Number(params.newValue);
                if (isNaN(number)) {
                    alert("please enter number only!")
                    return params.oldValue
                }
                return number
            }
        },
        {
            field: 'comment', headerName: 'Comment', minWidth: 200,
            editable: true, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true,
            cellEditorParams: {
                maxLength: 300, row: 10, col: 50
            }
        },
        {
            field: 'lastUpdatedTime', headerName: 'Last Updated At', width : 200,
            suppressSizeToFit: true, filter: true, sortable: true
        }
    ]);


    // Example of consuming Grid Event
    const cellClickedListener = useCallback( event => {
        // console.log('cellClicked', event);
    }, []);

    // DefaultColDef sets props common to all Columns
    const defaultColDef = useMemo( ()=> ({
        resizable: true
    }), []);

    //  fetch inventory data
    useEffect(() => {
        fetch('http://localhost:8080/inventory/retrieveAll',{
            method: 'GET',
            mode: 'cors'
        })
            .then(response => {
                const statusCode = response.status;
                if (statusCode === 204) {
                    alert("no item found")
                    setRowData([])
                    throw new Error("no item found");
                }
                const data = response.json();
                return Promise.all([statusCode, data]);
            })
            .then(([code, data]) => {
                if (code !== 200) {
                    alert("error in fetching data from backend: " + data.message)
                    console.error(data.message)
                }
                return data.data
            })
            .then(rowData => {
                rowData.forEach(row => row.lastUpdatedTime = JSON.stringify(row.lastUpdatedTime).substr(1, 10))
                setRowData(rowData)})
            .catch(error => console.error("error in fetching data from backend: ", error.message))
    }, [])

    // adjust column size after data is populated
    const onGridReady = useCallback(() => {
        gridRef.current.api.sizeColumnsToFit();
    }, []);

    // cell value change event, call backend update interface
    const onCellValueChanged = useCallback(event => {
        fetch('http://localhost:8080/inventory/update', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event.data)
        })
            .then(response => {
                const statusCode = response.status;
                const data = response.json();
                return Promise.all([statusCode, data]);
            })
            .then(([code, data]) => {
                if (code !== 200) {
                    alert("error in updating data to backend: " + data.message)
                    console.error(data.message)
                    return null
                }
                return data
            })
            .then(result => console.log(result.message))
            .catch(error => console.error("error in updating data to backend", error))
    }, []);

    //  remove selected row, call backend delete interface
    const onRemoveSelected = useCallback(() => {
        const selectedData = gridRef.current.api.getSelectedRows();
        gridRef.current.api.applyTransaction({ remove: selectedData });
        fetch('http://localhost:8080/inventory/delete/' + selectedData[0].id, {
            method: 'GET',
            mode: 'cors'
        })
            .then(response => {
                const statusCode = response.status;
                const data = response.json();
                return Promise.all([statusCode, data]);
            })
            .then(([code, data]) => {
                if (code !== 200) {
                    alert("error in deleting data from backend: " + data.message)
                    console.error(data.message)
                    return null
                }
                return data
            })
            .then(result => console.log(result.message))
            .catch(error => console.error("error in deleting data from backend", error))
    }, []);


    // handle form data
    const [name, setName] = useState("")
    const [category, setCategory] = useState("")
    const [quantity, setQuantity] = useState("")
    const [comment, setComment] = useState("")
    const [price, setPrice] = useState("")

    //  check data integrity, then submit form data, call backend create interface
    const handleSubmit = () => {
        // parse data to JSON format
        const item = {
            name: name,
            category: category,
            quantity: quantity,
            comment: comment,
            price: price
        }
        console.log(item)
        fetch('http://localhost:8080/inventory/create', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        })
            .then(response => {
                const statusCode = response.status;
                const data = response.json();
                return Promise.all([statusCode, data]);
            })
            .then(([code, data]) => {
                if (code !== 200) {
                    console.log(data)
                    alert("error in creating item in backend: " + data.message)
                    console.error(data.message)
                } else {
                    alert("create success")
                    setShow(false);
                    window.location.reload(false);  //  refresh page to display the newly inserted data
                }
            })
            .catch(error => {
                console.error("error in creating item", error)
                alert("create failed!")
            })
    }

    //  form close, clear all data field
    const handleClose = () => {
        setName("")
        setCategory("")
        setQuantity("")
        setPrice("")
        setComment("")
        setShow(false);
    }

    //  handle search data
    const [searchName, setSearchName] = useState("")
    const [searchCat, setSearchCat] = useState("")

    //  search for items
    const handleSearch = () => {
        if (searchName === "" && searchCat === "") {
            alert("need at least one search parameter!")
        } else if (searchName !== "" && searchCat === "") { //  search by name, regex pattern match
            fetch('http://localhost:8080/inventory/retrieveByName?name=' + searchName,{
                method: 'GET',
                mode: 'cors'
            })
                .then(response => {
                    const statusCode = response.status;
                    if (statusCode === 204) {
                        alert("no item found")
                        setRowData([])
                        throw new Error("no item found");
                    }
                    const data = response.json();
                    return Promise.all([statusCode, data]);
                })
                .then(([code, data]) => {
                    if (code !== 200) {
                        alert("error in fetching data from backend: " + data.message)
                        console.error(data.message)
                    }
                    return data.data
                })
                .then(rowData => {
                    rowData.forEach(row => row.lastUpdatedTime = JSON.stringify(row.lastUpdatedTime).substr(1, 10))
                    setRowData(rowData)})
                .catch(error => console.error("error in fetching data from backend: ", error.message))
        } else if (searchName === "" && searchCat !== "") {
            fetch('http://localhost:8080/inventory/retrieveByCategory?category=' + searchCat,{
                method: 'GET',
                mode: 'cors'
            })
                .then(response => {
                    const statusCode = response.status;
                    if (statusCode === 204) {
                        alert("no item found")
                        setRowData([])
                        throw new Error("no item found");
                    }
                    const data = response.json();
                    return Promise.all([statusCode, data]);
                })
                .then(([code, data]) => {
                    if (code !== 200) {
                        alert("error in fetching data from backend: " + data.message)
                        console.error(data.message)
                    }
                    return data.data
                })
                .then(rowData => {
                    rowData.forEach(row => row.lastUpdatedTime = JSON.stringify(row.lastUpdatedTime).substr(1, 10))
                    setRowData(rowData)})
                .catch(error => console.error("error in fetching data from backend: ", error.message))
        } else {
            fetch('http://localhost:8080/inventory/retrieveByNameAndCategory?name=' + searchName + '&category=' + searchCat,{
                method: 'GET',
                mode: 'cors'
            })
                .then(response => {
                    const statusCode = response.status;
                    if (statusCode === 204) {
                        alert("no item found")
                        setRowData([])
                        throw new Error("no item found");
                    }
                    const data = response.json();
                    return Promise.all([statusCode, data]);
                })
                .then(([code, data]) => {
                    if (code !== 200) {
                        alert("error in fetching data from backend: " + data.message)
                        console.error(data.message)
                    }
                    return data.data
                })
                .then(rowData => {
                    rowData.forEach(row => row.lastUpdatedTime = JSON.stringify(row.lastUpdatedTime).substr(1, 10))
                    setRowData(rowData)})
                .catch(error => console.error("error in fetching data from backend: ", error.message))
        }
    }

    return (
        <div className="App">
            <h1>Welcome to Mason's Food Inventory System!</h1>
            <p>Instruction: </p>
            <p>Click "Insert new item" button to insert a new item</p>
            <p>Select a row then click "Delete Selected Row" button to delete that row</p>
            <p>Double click a cell to edit its value</p>
            <p>Use search to search for items</p>
            <p>filter and sort enabled</p>
            <div className="button">
                <Button variant="primary" onClick={handleShow} style={{margin: '10px'}}>
                    Insert new item
                </Button>
                <Button variant="primary" onClick={onRemoveSelected} style={{margin: '10px'}}>
                    Delete Selected Row
                </Button>
            </div>
            <div>
                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Insert a new item</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="ControlInput">
                                <Form.Label>Item Name</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Item name"
                                    value={name}
                                    onChange={e => {
                                        setName(e.target.value);
                                    }}
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please enter item name
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicSelect">
                                <Form.Label>Item Category</Form.Label>
                                <Form.Select
                                    required
                                    aria-label="Default select example"
                                    value={category}
                                    onChange={e => {
                                        setCategory(e.target.value);
                                    }}
                                >
                                    <option value="">Choose a category</option>
                                    <option value="dairy">dairy</option>
                                    <option value="meat">meat</option>
                                    <option value="seafood">seafood</option>
                                    <option value="vegetable">vegetable</option>
                                    <option value="fruit">fruit</option>
                                    <option value="beverage">beverage</option>
                                    <option value="cereal">cereal</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    Please select a category
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="ControlInput">
                                <Form.Label>Item Quantity</Form.Label>
                                <Form.Control
                                    required
                                    type="number"
                                    placeholder="Item quantity"
                                    value={quantity}
                                    onChange={e => {
                                        setQuantity(e.target.value);
                                    }}
                                />
                                <Form.Text className="text-muted">
                                    Integer Only
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    Integer Only
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="ControlInput">
                                <Form.Label>Item Price</Form.Label>
                                <Form.Control
                                    required
                                    type="number"
                                    placeholder="Item price"
                                    value={price}
                                    onChange={e => {
                                        setPrice(e.target.value);
                                    }}
                                />
                                <Form.Text className="text-muted">
                                    Number Only, maximum fraction 2 digits
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    Number Only, maximum fraction 2 digits
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="ControlTextarea">
                                <Form.Label>Comment</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={comment}
                                    onChange={e => {
                                        setComment(e.target.value);
                                    }}
                                />
                            </Form.Group>
                            <Button variant="secondary" onClick={handleClose} style={{margin: '10px'}}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSubmit} style={{margin: '10px'}}>
                                Submit
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
            {/* On div wrapping Grid a) specify theme CSS Class Class and b) sets Grid size */}
            <div className="ag-theme-alpine" style={{width: 1600}}>
                <AgGridReact
                    domLayout='autoHeight'
                    ref={gridRef} // Ref for accessing Grid's API
                    defaultColDef={defaultColDef}   //  default props
                    rowData={rowData} // Row Data for Rows
                    columnDefs={columnDefs} // Column Defs for Columns
                    onGridReady={onGridReady}
                    animateRows={true} // Optional - set to 'true' to have rows animate when sorted
                    rowSelection='multiple' // Options - allows click selection of rows
                    onCellDoubleClicked={cellClickedListener} // Optional - registering for Grid Event
                    onCellValueChanged={onCellValueChanged}
                    pagination={true}
                    paginationPageSize={10}
                />
            </div>
            <br/>
            <div>
                <h2>
                    Search
                </h2>
                <Form>
                    <Form.Group className="mb-3" controlId="ControlInput">
                        <Form.Label>Item Name</Form.Label>
                        <Form.Control
                            type="text"
                            style={{width:"800px"}}
                            placeholder="Item name"
                            value={searchName}
                            onChange={e => {
                                setSearchName(e.target.value);
                            }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicSelect">
                        <Form.Label>Item Category</Form.Label>
                        <Form.Select
                            style={{width:"800px"}}
                            aria-label="Default select example"
                            value={searchCat}
                            onChange={e => {
                                setSearchCat(e.target.value);
                            }}
                        >
                            <option value="">Choose a category</option>
                            <option value="dairy">dairy</option>
                            <option value="meat">meat</option>
                            <option value="seafood">seafood</option>
                            <option value="vegetable">vegetable</option>
                            <option value="fruit">fruit</option>
                            <option value="beverage">beverage</option>
                            <option value="cereal">cereal</option>
                        </Form.Select>
                    </Form.Group>
                    <Button variant="primary" onClick={handleSearch} style={{margin: '10px'}}>
                        Search
                    </Button>
                </Form>
            </div>
        </div>
    );
};

export default App;
