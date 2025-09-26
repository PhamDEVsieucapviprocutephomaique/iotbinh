import "../scss/Actionhistory.scss";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const Actionshistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [inputPageSize, setInputPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [searchDevice, setSearchDevice] = useState("");
  const [searchAction, setSearchAction] = useState("");
  const [searchTime, setSearchTime] = useState("");

  const [records, setRecords] = useState([]);

  // Ref để giữ focus
  const searchInputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Hàm fetch dữ liệu từ API filter
  const fetchFilteredData = async (device, action) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/historyaction/filter/",
        {
          device: device,
          action: action,
        }
      );

      setRecords(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setLoading(false);
    }
  };

  // Hàm fetch dữ liệu từ API search time
  const fetchSearchTimeData = async (timeValue) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/historyaction/search/",
        {
          time: timeValue,
        }
      );

      setRecords(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch search history:", err);
      setLoading(false);
    }
  };

  // Fetch dữ liệu mặc định khi component mount
  useEffect(() => {
    fetchFilteredData("", "");
  }, []);

  // Gọi API khi searchDevice hoặc searchAction thay đổi
  useEffect(() => {
    fetchFilteredData(searchDevice, searchAction);
  }, [searchDevice, searchAction]);

  // Gọi API search khi searchTime thay đổi (debounce)
  useEffect(() => {
    if (searchTime.trim() !== "") {
      const timeoutId = setTimeout(() => {
        fetchSearchTimeData(searchTime);
      }, 500);

      return () => clearTimeout(timeoutId);
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
      fetchSearchTimeData(searchTime);
    }
  };

  const handleClear = () => {
    setSearchDevice("");
    setSearchAction("");
    setSearchTime("");
    fetchFilteredData("", "");
  };

  const applyPageSize = (value) => {
    let num = parseInt(value.toString().replace(/^0+/, ""), 10);
    if (isNaN(num) || num < 10) num = 10;
    setRecordsPerPage(num);
    setCurrentPage(1);
    setInputPageSize(num);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Pagination
  const totalPages = Math.ceil(records.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <div className="action-history">
      {/* Date row */}
      <div className="date-row">
        <p>T2, ngày 30 tháng 8 năm 2025</p>
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <div className="left-filters">
          <select
            value={searchDevice}
            onChange={(e) => setSearchDevice(e.target.value)}
            disabled={loading}
          >
            <option value="">Device</option>
            <option value="device1">Điều hòa</option>
            <option value="device2">Đèn</option>
            <option value="device3">Quạt</option>
          </select>

          <select
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            disabled={loading}
          >
            <option value="">Action</option>
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>

          {loading && <span className="loading-text">Đang tải...</span>}
        </div>

        <div className="right-filters">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="YYYY-MM-DD HH:MM:SS"
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
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  {record.device === "device1"
                    ? "Điều hòa"
                    : record.device === "device2"
                    ? "Đèn"
                    : record.device === "device3"
                    ? "Quạt"
                    : record.device}
                </td>
                <td>{record.action.toUpperCase()}</td>
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

      {/* Pagination + Page size */}
      <div className="pagination-wrapper">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => setCurrentPage(index + 1)}
            className={currentPage === index + 1 ? "active" : ""}
            disabled={loading}
          >
            {index + 1}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
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
              let val = e.target.value.replace(/^0+/, "");
              setInputPageSize(val);
              const num = parseInt(val, 10);
              if (!isNaN(num) && num >= 10) {
                setRecordsPerPage(num);
                setCurrentPage(1);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPageSize(inputPageSize);
            }}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Actionshistory;
