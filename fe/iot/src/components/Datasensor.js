import React, { useState, useEffect, useRef, useCallback } from "react";
import "../scss/Datasensor.scss";

const Datasensor = () => {
  const [data, setData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState("time");
  const [sortType, setSortType] = useState("asc");

  const [searchValue, setSearchValue] = useState("");
  const [searchField, setSearchField] = useState("time");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [inputPageSize, setInputPageSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [data, loading]);

  // Fetch total pages từ API
  const fetchTotalPages = useCallback(
    async (pageSize = recordsPerPage) => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/datasensor/countpage/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              page_size: pageSize,
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTotalPages(data.total_pages);
        setTotalCount(data.total_count);
      } catch (err) {
        console.error("Error fetching total pages:", err);
      }
    },
    [recordsPerPage]
  );

  // Fetch data với sorting và pagination
  const fetchSortedData = useCallback(
    async (
      attribute = sortBy,
      order = sortType,
      page = currentPage,
      pageSize = recordsPerPage,
      isInitial = false
    ) => {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      try {
        console.log("API Request parameters:", {
          attribute: attribute,
          type: order,
          page: page,
          page_size: pageSize,
        });

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
              page: page,
              page_size: pageSize,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData = await response.json();
        setData(apiData);

        // Fetch total pages sau khi có data
        await fetchTotalPages(pageSize);
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
    },
    [sortBy, sortType, currentPage, recordsPerPage, fetchTotalPages]
  );

  // Fetch search data từ API search với pagination
  const fetchSearchData = useCallback(
    async (search, field, page = currentPage, pageSize = recordsPerPage) => {
      setLoading(true);
      try {
        console.log("API Search parameters:", {
          search: search,
          type: field,
          page: page,
          page_size: pageSize,
        });

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
              page: page,
              page_size: pageSize,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData = await response.json();
        setData(apiData);

        // Fetch total pages sau khi có data
        await fetchTotalPages(pageSize);
      } catch (error) {
        console.error("Error fetching search data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, recordsPerPage, fetchTotalPages]
  );

  // Debounce search
  const handleSearch = useCallback(
    (value, field) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (value.trim() === "") {
          fetchSortedData(sortBy, sortType, 1, recordsPerPage);
        } else {
          fetchSearchData(value, field, 1, recordsPerPage);
        }
        setCurrentPage(1);
      }, 500);
    },
    [fetchSortedData, fetchSearchData, sortBy, sortType, recordsPerPage]
  );

  // Xử lý search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    handleSearch(value, searchField);
  };

  // Xử lý search type change
  const handleSearchTypeChange = (e) => {
    const field = e.target.value;
    setSearchField(field);
    if (searchValue.trim()) {
      handleSearch(searchValue, field);
    }
  };

  // Fetch dữ liệu mặc định khi component mount (lần đầu)
  useEffect(() => {
    fetchSortedData("time", "asc", 1, recordsPerPage, true);
  }, []);

  // Gọi API khi sortBy hoặc sortType thay đổi (những lần sau)
  useEffect(() => {
    if (!initialLoading) {
      setCurrentPage(1);
      fetchSortedData(sortBy, sortType, 1, recordsPerPage);
    }
  }, [sortBy, sortType]);

  // Hàm xử lý khi click nút Search
  const handleSearchClick = () => {
    if (searchValue.trim() !== "") {
      setCurrentPage(1);
      fetchSearchData(searchValue, searchField, 1, recordsPerPage);
    }
  };

  // Hàm xử lý khi click nút Clear
  const handleClearClick = () => {
    setSearchValue("");
    setSearchField("time");
    setCurrentPage(1);
    fetchSortedData(sortBy, sortType, 1, recordsPerPage);
  };

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (searchValue.trim()) {
      fetchSearchData(searchValue, searchField, pageNumber, recordsPerPage);
    } else {
      fetchSortedData(sortBy, sortType, pageNumber, recordsPerPage);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) endPage = 4;
      else if (currentPage >= totalPages - 2) startPage = totalPages - 3;

      if (startPage > 2) pageNumbers.push("...");
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
      if (endPage < totalPages - 1) pageNumbers.push("...");
      if (totalPages > 1) pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  // Handle page size input change
  const handlePageSizeInputChange = (e) => {
    setInputPageSize(e.target.value);
  };

  const handlePageSizeBlur = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 10) {
      setRecordsPerPage(value);
      setInputPageSize(value.toString());
      setCurrentPage(1);
      if (searchValue.trim()) {
        fetchSearchData(searchValue, searchField, 1, value);
      } else {
        fetchSortedData(sortBy, sortType, 1, value);
      }
    } else {
      setInputPageSize(recordsPerPage.toString());
    }
  };

  const handlePageSizeKeyPress = (e) => {
    if (e.key === "Enter") {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value >= 10) {
        setRecordsPerPage(value);
        setInputPageSize(value.toString());
        setCurrentPage(1);
        if (searchValue.trim()) {
          fetchSearchData(searchValue, searchField, 1, value);
        } else {
          fetchSortedData(sortBy, sortType, 1, value);
        }
        e.target.blur();
      }
    }
  };

  const incrementPageSize = () => {
    const newSize = recordsPerPage + 1;
    setRecordsPerPage(newSize);
    setInputPageSize(newSize.toString());
    setCurrentPage(1);
    if (searchValue.trim()) {
      fetchSearchData(searchValue, searchField, 1, newSize);
    } else {
      fetchSortedData(sortBy, sortType, 1, newSize);
    }
  };

  const decrementPageSize = () => {
    const newSize = Math.max(10, recordsPerPage - 1);
    setRecordsPerPage(newSize);
    setInputPageSize(newSize.toString());
    setCurrentPage(1);
    if (searchValue.trim()) {
      fetchSearchData(searchValue, searchField, 1, newSize);
    } else {
      fetchSortedData(sortBy, sortType, 1, newSize);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (initialLoading) {
    return (
      <div className="app">
        <div className="loading">Loading data...</div>
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
            <select
              value={searchField}
              onChange={handleSearchTypeChange}
              disabled={loading}
            >
              <option value="time">Time</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="light">Light</option>
            </select>

            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search by ${searchField}...`}
              value={searchValue}
              onChange={handleSearchChange}
              disabled={loading}
            />
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
              <th>ID {sortBy === "id" && (sortType === "asc" ? "↑" : "↓")}</th>
              <th>
                Temperature (°C){" "}
                {sortBy === "temperature" && (sortType === "asc" ? "↑" : "↓")}
              </th>
              <th>
                Humidity (%){" "}
                {sortBy === "humidity" && (sortType === "asc" ? "↑" : "↓")}
              </th>
              <th>
                Light (Nit){" "}
                {sortBy === "light" && (sortType === "asc" ? "↑" : "↓")}
              </th>
              <th>
                Time {sortBy === "time" && (sortType === "asc" ? "↑" : "↓")}
              </th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={`${item.id || index}-${item.time}`}>
                <td>
                  {item.id || index + 1 + (currentPage - 1) * recordsPerPage}
                </td>
                <td>{item.temperature}</td>
                <td>{item.humidity}</td>
                <td>{item.light}</td>
                <td>{item.time}</td>
                <td>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(item.time)}
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
        {/* <div className="pagination-info">
          Showing{" "}
          {data.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} to{" "}
          {Math.min(
            currentPage * recordsPerPage,
            (currentPage - 1) * recordsPerPage + data.length
          )}{" "}
          of {totalCount} entries
          {searchValue && (
            <span className="search-info">
              {" "}
              | Searching: "{searchValue}" in {searchField}
            </span>
          )}
        </div> */}

        <div className="pagination-controls">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </button>

          {pageNumbers.map((number, index) =>
            number === "..." ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={number}
                className={currentPage === number ? "active" : ""}
                onClick={() => paginate(number)}
                disabled={loading}
              >
                {number}
              </button>
            )
          )}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
          >
            Next
          </button>

          <div className="page-size-wrapper">
            <span>Show: </span>
            <div className="page-size-control">
              <button
                className="page-size-btn"
                onClick={decrementPageSize}
                disabled={recordsPerPage <= 10 || loading}
              >
                -
              </button>
              <input
                type="number"
                min="10"
                value={inputPageSize}
                onChange={handlePageSizeInputChange}
                onFocus={(e) => e.target.select()}
                onBlur={handlePageSizeBlur}
                onKeyPress={handlePageSizeKeyPress}
                className="page-size-input"
                disabled={loading}
              />
              <button
                className="page-size-btn"
                onClick={incrementPageSize}
                disabled={loading}
              >
                +
              </button>
            </div>
            <span>entries</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datasensor;
