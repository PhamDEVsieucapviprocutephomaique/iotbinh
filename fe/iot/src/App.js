import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Datasensor from "./components/Datasensor";
import Actionhistory from "./components/Actionhistory";
import Layout from "./layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout></Layout>}>
          <Route index element={<Home></Home>}></Route>
          <Route path="profile/" element={<Profile></Profile>}></Route>
          <Route path="Datasensor/" element={<Datasensor></Datasensor>}></Route>
          <Route
            path="Actionhistory/"
            element={<Actionhistory></Actionhistory>}
          ></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
