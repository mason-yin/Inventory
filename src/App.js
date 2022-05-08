import React, { useState, useRef, useEffect, useMemo, useCallback} from 'react';
import { render } from 'react-dom';
import { Modal } from "./Modal";
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component

import 'ag-grid-community/dist/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const App = () => {

    const gridRef = useRef(); // Optional - for accessing Grid's API
    const [rowData, setRowData] = useState(); // Set rowData to Array of Objects, one Object per Row
    const [showModal, setShowModal] = useState(false);  //  set pop up modal

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
    }));

    // load data from backend service
    const onGridReady = useCallback(() => {
        fetch('http://localhost:8080/inventory/retrieveAll',{
            method: 'GET',
            mode: 'cors'
        })
            .then(result => result.json())
            .then(result => result.data)
            .then(rowData => {
                rowData.forEach(row => row.lastUpdatedTime = JSON.stringify(row.lastUpdatedTime).substr(1, 10))
                setRowData(rowData)})
            .catch(error => console.error("error in fetching data from backend", error.message))
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
            .then(result => result.json())
            .then(result => console.log(result.message))
            .catch(error => console.error("error in updating data from backend", error))
    });

    //  remove selected row, call backend delete interface
    const onRemoveSelected = useCallback(() => {
        const selectedData = gridRef.current.api.getSelectedRows();
        gridRef.current.api.applyTransaction({ remove: selectedData });
        fetch('http://localhost:8080/inventory/delete/' + selectedData[0].id, {
            method: 'GET',
            mode: 'cors'
        })
            .then(result => result.json())
            .then(result => console.log(result.message))
            .catch(error => console.error("error in deleting data from backend", error))
    }, []);

    //  control pop up modal
    const openModal = () => {
        setShowModal(true);
    };

    // Example using Grid's API
    const buttonListener = useCallback( () => {
        gridRef.current.api.sizeColumnsToFit();
    }, []);

    return (
        <div className="App">
            <h1>Welcome to Mason's Food Inventory System!</h1>

            <div className="button">
                <button onClick={openModal} style={{ margin: '4px' }}>Create Inventory</button>
                {showModal ? <Modal setShowModal={setShowModal} /> : null}
                {/*<button onClick={onRemoveSelected} style={{ margin: '4px' }}>Delete Selected Row</button>*/}
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
                />
            </div>
        </div>
    );
};

export default App;
