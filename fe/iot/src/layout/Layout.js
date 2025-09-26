import { Link, Outlet, useLocation } from "react-router-dom";
import "../scss/Layout.scss";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="layout">
      {/* Header */}
      <div className="header">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          Home
        </Link>
        <Link
          to="/Datasensor"
          className={location.pathname === "/Datasensor" ? "active" : ""}
        >
          Data Sensor
        </Link>
        <Link
          to="/Actionhistory"
          className={location.pathname === "/Actionhistory" ? "active" : ""}
        >
          Action History
        </Link>
        <Link
          to="/profile"
          className={location.pathname === "/profile" ? "active" : ""}
        >
          Profile
        </Link>
      </div>

      {/* Nội dung */}
      <div className="body">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
