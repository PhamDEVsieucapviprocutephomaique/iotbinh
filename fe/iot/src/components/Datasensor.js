import React, { useState, useEffect, useRef } from "react";
import "../scss/Datasensor.scss";

const Datasensor = () => {
  const [data, setData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState("time");
  // Sửa state mặc định thành "asc"
  const [sortType, setSortType] = useState("asc");

  const [searchValue, setSearchValue] = useState(""); // Đổi tên từ searchTime
  const [searchField, setSearchField] = useState("time");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [inputPageSize, setInputPageSize] = useState(10);
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [data, loading]);

  // Hàm fetch dữ liệu từ API sort
  const fetchSortedData = async (attribute, order, isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasensor/sort/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attribute: attribute,
            type: order,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiData = await response.json();
      setData(apiData);
    } catch (error) {
      console.error("Error fetching sorted data:", error);
      setError(error.message);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Hàm fetch dữ liệu từ API search
  const fetchSearchData = async (search, field) => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasensor/search/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            search: search,
            type: field,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiData = await response.json();
      setData(apiData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching search data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch dữ liệu mặc định khi component mount (lần đầu)
  useEffect(() => {
    fetchSortedData("time", "asc", true);
  }, []);

  // Gọi API khi sortBy hoặc sortType thay đổi (những lần sau)
  useEffect(() => {
    if (!initialLoading) {
      fetchSortedData(sortBy, sortType, false);
    }
  }, [sortBy, sortType]);

  // Gọi API search khi searchValue thay đổi (debounce)
  useEffect(() => {
    if (!initialLoading && searchValue !== "") {
      const timeoutId = setTimeout(() => {
        fetchSearchData(searchValue, searchField);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchValue, searchField]);

  // Reset searchValue khi searchField thay đổi
  useEffect(() => {
    setSearchValue("");
  }, [searchField]);

  // Hàm xử lý khi click nút Search
  const handleSearchClick = () => {
    if (searchValue.trim() !== "") {
      fetchSearchData(searchValue, searchField);
    }
  };

  // Hàm xử lý khi click nút Clear
  const handleClearClick = () => {
    setSearchValue("");
    // Load lại dữ liệu mặc định
    fetchSortedData("time", "desc", false);
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = data.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(data.length / recordsPerPage);

  // Hàm render phân trang thông minh
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={currentPage === i ? "active" : ""}
            disabled={loading}
          >
            {i}
          </button>
        );
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={currentPage === i ? "active" : ""}
              disabled={loading}
            >
              {i}
            </button>
          );
        }
        buttons.push(<span key="ellipsis1">...</span>);
        buttons.push(
          <button
            key={totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className={currentPage === totalPages ? "active" : ""}
            disabled={loading}
          >
            {totalPages}
          </button>
        );
      } else if (currentPage >= totalPages - 2) {
        buttons.push(
          <button key={1} onClick={() => setCurrentPage(1)} disabled={loading}>
            1
          </button>
        );
        buttons.push(<span key="ellipsis2">...</span>);
        for (let i = totalPages - 2; i <= totalPages; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={currentPage === i ? "active" : ""}
              disabled={loading}
            >
              {i}
            </button>
          );
        }
      } else {
        buttons.push(
          <button key={1} onClick={() => setCurrentPage(1)} disabled={loading}>
            1
          </button>
        );
        buttons.push(<span key="ellipsis3">...</span>);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={currentPage === i ? "active" : ""}
              disabled={loading}
            >
              {i}
            </button>
          );
        }
        buttons.push(<span key="ellipsis4">...</span>);
        buttons.push(
          <button
            key={totalPages}
            onClick={() => setCurrentPage(totalPages)}
            disabled={loading}
          >
            {totalPages}
          </button>
        );
      }
    }

    return buttons;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const applyPageSize = (value) => {
    let num = parseInt(value.toString().replace(/^0+/, ""), 10);
    if (isNaN(num) || num < 10) num = 10;
    setRecordsPerPage(num);
    setCurrentPage(1);
    setInputPageSize(num);
  };

  if (initialLoading) {
    return (
      <div className="app">
        {/* <div className="loading">Loading data...</div> */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>{today}</h1>

      <div className="controls">
        <div className="left-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={loading}
          >
            <option value="id">ID</option>
            <option value="temperature">Nhiệt độ</option>
            <option value="humidity">Độ ẩm</option>
            <option value="light">Ánh sáng</option>
            <option value="time">Thời gian</option>
          </select>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            disabled={loading}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>

          {loading && <span className="sort-loading">Đang tải...</span>}
        </div>

        <div className="right-controls">
          <div className="search-wrapper">
            <input
              ref={searchInputRef} // Thêm ref vào input
              type="text"
              placeholder="Tìm kiếm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              disabled={loading}
            />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              disabled={loading}
            >
              <option value="time">Time</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="light">Light</option>
            </select>
          </div>
          <button onClick={handleSearchClick} disabled={loading}>
            Search
          </button>
          <button onClick={handleClearClick} disabled={loading}>
            Clear
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Temperature (°C)</th>
              <th>Humidity (%)</th>
              <th>Light (Nit)</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.temperature}</td>
                <td>{record.humidity}</td>
                <td>{record.light}</td>
                <td>
                  {record.time}
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(record.time)}
                    disabled={loading}
                  >
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-wrapper">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>

        {renderPaginationButtons()}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || loading}
        >
          Next
        </button>

        <div className="page-size-wrapper">
          <span>Page size:</span>
          <input
            type="number"
            min="10"
            value={inputPageSize}
            onChange={(e) => {
              let val = parseInt(
                e.target.value.toString().replace(/^0+/, ""),
                10
              );
              if (!isNaN(val) && val >= 10) {
                setRecordsPerPage(val);
                setCurrentPage(1);
                setInputPageSize(val);
              } else {
                setInputPageSize(e.target.value.replace(/^0+/, ""));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPageSize(e.target.value);
            }}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Datasensor;
