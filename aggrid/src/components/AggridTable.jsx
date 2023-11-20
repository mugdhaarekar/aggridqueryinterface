import React, { useMemo, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react"; // the AG Grid React Component
import { mockTableData } from "./mockData";
import { Input } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
import "ag-grid-community/styles/ag-theme-alpine.css";

const AggridTable = () => {
  const [pageSize, setPageSize] = useState(15);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState(null);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const [logs, setLogs] = useState(mockTableData);

  const [gridOptions, setGridOptions] = useState({
    columnDefs: [
      {
        field: "level",
        headerName: "Level",
      },
      {
        field: "message",
        headerName: "Message",
        autoHeight: true,
        width: 300,
      },
      {
        field: "resourceId",
        headerName: "ResourceID",
      },
      {
        field: "date",
        headerName: "Date",
        valueGetter: (params) => {
          const timestamp = params.data.timestamp;
          const date = timestamp
            ? new Date(timestamp).toLocaleDateString()
            : "";
          return date; //Fetches the date from timestamp for better readability
        },
        filter: "agDateColumnFilter",
        filterParams: {
          comparator: function (filterLocalDateAtMidnight, cellValue) {
            const dateAsString = cellValue;
            if (dateAsString == null) return 0;
            const cellDate = new Date(dateAsString);
            const cellDateWithoutTime = new Date(
              cellDate.getFullYear(),
              cellDate.getMonth(),
              cellDate.getDate()
            );
            if (cellDateWithoutTime < filterLocalDateAtMidnight) {
              return -1;
            } else if (cellDateWithoutTime > filterLocalDateAtMidnight) {
              return 1;
            } else {
              return 0;
            }
          },
        },
      },
      {
        field: "time",
        headerName: "Time",
        width: 100,
        valueGetter: (params) => {
          const timestamp = params.data.timestamp;
          const time = timestamp
            ? new Date(timestamp).toLocaleTimeString()
            : "";
          return time; //Fetches the time from timestamp
        },
      },
      { field: "traceId", headerName: "TraceID" },
      { field: "commit", headerName: "Commit" },
      {
        field: "metadata",
        headerName: "Metadata",
        valueGetter: (params) => params.data.metadata?.parentResourceId || "",
        headerStyle: { textAlign: "center" },
      },
    ],

    rowData: logs,
  });

  const fetchLogs = async () => {
    try {
      const response = await fetch("http://localhost:3000/logs"); //Replace this with your URL
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
      setGridOptions({
        ...gridOptions,
        rowData: data,
      });
    } catch (error) {
      console.error("Error fetching logs", error);
    }
  };

  const handleSearchChange = (e) => {
    setQuickFilter(e.target.value);
    gridApi.setQuickFilter(e.target.value);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      suppressSizeToFit: true,
      headerClass: "header-white",
    };
  }, []);

  return (
    <div className="d-flex flex-column">
      <div className="mt-3 mx-3 d-flex justify-content-between">
        <Input
          placeholder="Search"
          suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
          value={quickFilter}
          onChange={handleSearchChange}
          size="large"
          style={{ width: "200px", height: "40px" }}
        />
        <div
          className="d-flex align-items-center"
          style={{ marginRight: "4rem" }}
        >
          Show
          <select
            className="form-select form-select-sm"
            aria-label=".form-select-sm example"
            style={{ border: "none", color: "#377DF5", width: "80px" }}
            defaultValue={pageSize}
            onChange={(e) =>
              setPageSize(
                e.target.value === "all"
                  ? logs.length
                  : parseInt(e.target.value)
              )
            }
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      <div
        className="mt-1 ms-3 pt-3 ag-theme-alpine table-ag-theme"
        style={{ width: "95%", height: "750px", overflow: "visible" }}
      >
        <AgGridReact
          defaultColDef={defaultColDef}
          quickFilterText={quickFilter}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={pageSize}
          rowSelection="multiple"
          rowModelType="clientSide"
          animateRows={true}
          gridOptions={gridOptions}
          rowData={logs}
        />
      </div>
    </div>
  );
};

export default AggridTable;
