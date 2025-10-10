import "../scss/Actionhistory.scss";
import { useState, useEffect, useRef, useCallback } from "react";

const Actionshistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [searchDevice, setSearchDevice] = useState("");
  const [searchAction, setSearchAction] = useState("");
  const [searchTime, setSearchTime] = useState("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [inputPageSize, setInputPageSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Refs
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Fetch total pages từ API
  const fetchTotalPages = useCallback(
    async (
      pageSize = recordsPerPage,
      device = searchDevice,
      action = searchAction
    ) => {
      try {
        const filterData = {};
        if (device && device !== "") {
          filterData.device = device;
        }
        if (action && action !== "") {
          filterData.action = action;
        }
        filterData.page_size = pageSize;

        const res = await fetch(
          "http://127.0.0.1:8000/api/historyaction/countpage/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(filterData),
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
    [recordsPerPage, searchDevice, searchAction]
  );

  // Fetch data với filter từ API (có pagination)
  const fetchFilteredData = useCallback(
    async (
      device = searchDevice,
      action = searchAction,
      page = currentPage,
      pageSize = recordsPerPage
    ) => {
      setLoading(true);
      try {
        const filterData = {};
        if (device && device !== "") {
          filterData.device = device;
        }
        if (action && action !== "") {
          filterData.action = action;
        }
        filterData.page = page;
        filterData.page_size = pageSize;

        console.log("Filter API Request parameters:", filterData);

        const res = await fetch(
          "http://127.0.0.1:8000/api/historyaction/filter/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(filterData),
          }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const filteredData = await res.json();

        // Format thời gian
        const formattedData = filteredData.map((item) => ({
          ...item,
          time: formatTime(item.time),
        }));

        setRecords(formattedData);
        await fetchTotalPages(pageSize, device, action);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
        if (initialLoading) setInitialLoading(false);
      }
    },
    [
      searchDevice,
      searchAction,
      currentPage,
      recordsPerPage,
      fetchTotalPages,
      initialLoading,
    ]
  );

  // Fetch search data từ API search time (có pagination)
  const fetchSearchTimeData = useCallback(
    async (timeValue, page = currentPage, pageSize = recordsPerPage) => {
      if (!timeValue.trim()) {
        fetchFilteredData("", "", page, pageSize);
        return;
      }

      setLoading(true);
      try {
        console.log("Search API Request parameters:", {
          time: timeValue,
          page: page,
          page_size: pageSize,
        });

        const res = await fetch(
          "http://127.0.0.1:8000/api/historyaction/search/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              time: timeValue,
              page: page,
              page_size: pageSize,
            }),
          }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const searchResults = await res.json();

        // Format thời gian
        const formattedData = searchResults.map((item) => ({
          ...item,
          time: formatTime(item.time),
        }));

        setRecords(formattedData);
        await fetchTotalPages(pageSize);
      } catch (err) {
        console.error("Error searching data:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchFilteredData, currentPage, recordsPerPage, fetchTotalPages]
  );

  // Format thời gian
  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      if (timeString.includes("T")) {
        const [datePart, timePart] = timeString.split("T");
        const cleanTimePart = timePart.split(".")[0];
        return `${datePart} / ${cleanTimePart}`;
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  };

  // Debounce search
  const handleSearch = useCallback(
    (value, page = 1, pageSize = recordsPerPage) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (value.trim() === "") {
          fetchFilteredData(searchDevice, searchAction, page, pageSize);
        } else {
          fetchSearchTimeData(value, page, pageSize);
        }
        setCurrentPage(page);
      }, 500);
    },
    [
      fetchFilteredData,
      fetchSearchTimeData,
      searchDevice,
      searchAction,
      recordsPerPage,
    ]
  );

  // Fetch dữ liệu mặc định khi component mount
  useEffect(() => {
    fetchFilteredData("", "", 1, recordsPerPage);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Gọi API khi searchDevice hoặc searchAction thay đổi
  useEffect(() => {
    if (!initialLoading) {
      setCurrentPage(1);
      fetchFilteredData(searchDevice, searchAction, 1, recordsPerPage);
    }
  }, [searchDevice, searchAction]);

  // Gọi API search khi searchTime thay đổi (debounce)
  useEffect(() => {
    if (!initialLoading && searchTime.trim() !== "") {
      handleSearch(searchTime, 1, recordsPerPage);
    }
  }, [searchTime]);

  // Focus lại input sau khi re-render
  useEffect(() => {
    if (isInputFocused && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  });

  // Hàm xử lý khi click nút Search
  const handleSearchClick = () => {
    if (searchTime.trim() !== "") {
      setCurrentPage(1);
      fetchSearchTimeData(searchTime, 1, recordsPerPage);
    }
  };

  const handleClear = () => {
    setSearchDevice("");
    setSearchAction("");
    setSearchTime("");
    setCurrentPage(1);
    fetchFilteredData("", "", 1, recordsPerPage);
  };

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);

    if (searchTime.trim()) {
      fetchSearchTimeData(searchTime, pageNumber, recordsPerPage);
    } else {
      fetchFilteredData(searchDevice, searchAction, pageNumber, recordsPerPage);
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

  // Page size handlers
  const handlePageSizeInputChange = (e) => {
    setInputPageSize(e.target.value);
  };

  const handlePageSizeBlur = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 10) {
      setRecordsPerPage(value);
      setInputPageSize(value.toString());
      setCurrentPage(1);

      if (searchTime.trim()) {
        fetchSearchTimeData(searchTime, 1, value);
      } else {
        fetchFilteredData(searchDevice, searchAction, 1, value);
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

        if (searchTime.trim()) {
          fetchSearchTimeData(searchTime, 1, value);
        } else {
          fetchFilteredData(searchDevice, searchAction, 1, value);
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

    if (searchTime.trim()) {
      fetchSearchTimeData(searchTime, 1, newSize);
    } else {
      fetchFilteredData(searchDevice, searchAction, 1, newSize);
    }
  };

  const decrementPageSize = () => {
    const newSize = Math.max(10, recordsPerPage - 1);
    setRecordsPerPage(newSize);
    setInputPageSize(newSize.toString());
    setCurrentPage(1);

    if (searchTime.trim()) {
      fetchSearchTimeData(searchTime, 1, newSize);
    } else {
      fetchFilteredData(searchDevice, searchAction, 1, newSize);
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
      <div className="action-history">
        <div className="loading">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="action-history">
      {/* Date row */}
      <div className="date-row">
        <p>{today}</p>
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <div className="left-filters">
          <select
            value={searchDevice}
            onChange={(e) => setSearchDevice(e.target.value)}
            disabled={loading}
          >
            <option value="">All Devices</option>
            <option value="device1">Điều hòa</option>
            <option value="device2">Đèn</option>
            <option value="device3">Quạt</option>
          </select>

          <select
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            disabled={loading}
          >
            <option value="">All Actions</option>
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>

          {loading && <span className="loading-text">Đang tải...</span>}
        </div>

        <div className="right-filters">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm theo thời gian..."
            value={searchTime}
            onChange={(e) => setSearchTime(e.target.value)}
            disabled={loading}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={{
              outline: "none",
              boxShadow: "none",
              border: "1px solid #ccc",
            }}
          />
          <button onClick={handleSearchClick} disabled={loading}>
            Search
          </button>
          <button onClick={handleClear} disabled={loading}>
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Device</th>
              <th>Action</th>
              <th>Time</th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item, index) => (
              <tr key={`${item.id}-${item.time}-${index}`}>
                <td>
                  {item.id || index + 1 + (currentPage - 1) * recordsPerPage}
                </td>
                <td>
                  {item.device === "device1"
                    ? "Điều hòa"
                    : item.device === "device2"
                    ? "Đèn"
                    : item.device === "device3"
                    ? "Quạt"
                    : item.device}
                </td>
                <td>{item.action.toUpperCase()}</td>
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

      {/* Pagination + Page size */}
      <div className="pagination-wrapper">
        {/* <div className="pagination-info">
          Hiển thị{" "}
          {records.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1}{" "}
          đến{" "}
          {Math.min(
            currentPage * recordsPerPage,
            (currentPage - 1) * recordsPerPage + records.length
          )}{" "}
          trong tổng số {totalCount} bản ghi
          {(searchDevice || searchAction || searchTime) && (
            <span className="filter-info">
              {" "}
              | Đang lọc:
              {searchDevice &&
                ` Thiết bị: ${
                  searchDevice === "device1"
                    ? "Điều hòa"
                    : searchDevice === "device2"
                    ? "Đèn"
                    : "Quạt"
                }`}
              {searchAction && ` Hành động: ${searchAction.toUpperCase()}`}
              {searchTime && ` Thời gian: "${searchTime}"`}
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
            <span>Hiển thị: </span>
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
            <span>bản ghi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actionshistory;
