import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import { jwtDecode } from "jwt-decode";
import { Row, Col, Layout, Card, Dropdown, Menu, Avatar, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import TaskManager from "./components/TaskManager";
import axios from "axios";
import {Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;

const App = () => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? { token, user: jwtDecode(token) } : null;
  });
  const [userData, setUserData] = useState(null);
  const apiUrl = "https://task-manager-backend-kxmk.onrender.com";
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuth({ token: null, user: null });
    setUserData(null);
    // window.location.reload();
window.location.href = "https://task-manager-udh2.onrender.com/auth";
  };


  useEffect(() => {
    if (auth?.user?.id) {
      axios.get(`${apiUrl}/api/users/fetchUser/${auth.user.id}`)
        .then((response) => {
          setUserData(response.data);
        })
        .catch((error) => console.error("Error fetching user data:", error));
    }
  }, [auth]);
useEffect(() => {
  if (!auth) {
    navigate("/auth");
  }
}, [auth, navigate]);
  const profileMenu = (
    <Menu>
      <Menu.Item key="user-info" disabled>
        <div style={{ lineHeight: "1.5" }}>
          <span style={{ fontWeight: "bold" }}>Name:</span>{" "}
          <span style={{ fontWeight: "500" }}>{userData?.name || "User"}</span> <br />
          <span style={{ fontWeight: "bold" }}>Email:</span>{" "}
          <span style={{ fontWeight: "500" }}>{userData?.email || "User"}</span> <br />

        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        style={{
          backgroundColor: "red",
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
          borderRadius: "5px",
          padding: "10px",
        }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );


  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ padding: "0 20px", backgroundColor: "#001529", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Col>
            <h2 style={{ color: "white", margin: 0 }}>Task Manager</h2>
          </Col>
          {auth && (
            <Col>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Dropdown overlay={profileMenu} trigger={['click']}>
                  <Tooltip title={userData?.name || "User"}>
                    <Avatar
                      style={{
                        backgroundColor: "white",
                        color: "black",
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: "1px solid black"
                      }}
                    >
                      {userData?.name ? userData.name.charAt(0).toUpperCase() : <UserOutlined />}
                    </Avatar>
                  </Tooltip>
                </Dropdown>
              </div>
            </Col>
          )}
        </Row>
      </Header>


      <Content style={{ padding: "10px" }}>
        <Routes>
          // <Route path="/" element={auth ? <Navigate to="/managetasks" /> : <Navigate to="/auth" />} />

          <Route
            path="/auth"
            element={
              auth ? (
                <Navigate to="/managetasks" />
              ) : (
                <Row justify="center" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={16} lg={12}>
                    <Auth setAuth={setAuth} />
                  </Col>
                </Row>
              )
            }
          />

          <Route
            path="/managetasks"
            element={
              auth ? (
                <Row justify="center" gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={24}>
                    <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
                      <TaskManager userData={userData} username={userData?.name} setAuth={setAuth} />
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
         <Route
              path="*"
              element={auth ? <Navigate to="/managetasks" /> : <Navigate to="/auth" />}
            />    
        </Routes>
      </Content>

    </Layout>
  );
};

export default App;
