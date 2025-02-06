import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTasks, addTask, updateTask, deleteTask } from "../store/taskSlice";
import { Button, List, message, Modal, Form, Input, DatePicker, Select, Divider, Row, Col, Typography, Card, Tooltip, Avatar, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { SortAscendingOutlined, SortDescendingOutlined, CopyOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "./TaskManager.css"
dayjs.extend(utc);
const { Option } = Select;
const { Title, Text } = Typography;

const TaskManager = ({ userData, userRole, username, setAuth }) => {
    const dispatch = useDispatch();
    const tasks = useSelector((state) => state.tasks.tasks);
    const apiUrl = "https://task-manager-backend-kxmk.onrender.com";
    const { Title } = Typography;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [filters, setFilters] = useState({ status: "", dueDate: "" });
    const [isUpdating, setIsUpdating] = useState(false);
    const [users, setUsers] = useState([]);
    const [currentTaskId, setCurrentTaskId] = useState(null);
    const [sortAscending, setSortAscending] = useState(true);
    const [currentTaskDetails, setCurrentTaskDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const token = localStorage.getItem("token");

    const axiosInstance = axios.create({
        baseURL: apiUrl,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });


    const fetchTasks = async (filters = {}) => {
        try {
            const { data } = await axiosInstance.get("/api/tasks", { params: { ...filters, sortOrder: sortAscending ? "asc" : "desc" }, });
            dispatch(setTasks(data));
        } catch (error) {
            if (error.status === 401) {
                handleLogout(error?.response?.data?.msg ? error?.response?.data?.msg : "Authentication Error");
            }
            console.error("Error fetching tasks:", error);
            message.error("Failed to fetch tasks!");
        }
    };
    const fetchUsers = async () => {
        try {
            const { data } = await axiosInstance.get("/api/users/all");
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            message.error("Failed to fetch users!");
        }
    };

    const hasPermission = (task) => {
        const createdById = task?.createdBy?._id || task?.createdBy;
        return userData?.userId === createdById?.toString();
    };


    const handleDetailsModal = (task) => {
        setCurrentTaskDetails(task);
        setIsDetailsModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setCurrentTaskDetails(null);
    };

    const handleAddTask = async (values) => {
        try {
            const newTask = {
                ...values,
                dueDate: dayjs(values.dueDate).utc().format(),
                createdBy: userData.userId,

            };
            const { data } = await axiosInstance.post("/api/tasks", newTask);
            dispatch(addTask(data));
            message.success("Task added successfully!");
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            if (error.status === 401) {
                handleLogout(error?.response?.data?.msg ? error?.response?.data?.msg : "Authentication Error");
            }
            console.error("Error adding task:", error);
            message.error("Failed to add task!");
        }
    };

    const handleUpdateTask = async (taskId, updatedTask) => {
        try {

            if (userData) {
                updatedTask.dueDate = dayjs(updatedTask.dueDate).utc().format();
                updatedTask.createdBy = userData.userId;

            }

            const { data } = await axiosInstance.put(`/api/tasks/updateTask/${taskId}`, updatedTask);
            dispatch(updateTask(data));
            message.success("Task updated successfully!");
            setIsModalOpen(false);
            form.resetFields();
            setIsUpdating(false);
        } catch (error) {
            if (error.status === 401) {
                handleLogout(error?.response?.data?.msg ? error?.response?.data?.msg : "Authentication Error");
            }
            console.error("Error updating task:", error);
            message.error("Failed to update task!");
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axiosInstance.delete(`/api/tasks/deleteTask/${taskId}`);
            dispatch(deleteTask(taskId));
            message.success("Task deleted successfully!");
        } catch (error) {
            if (error.status === 401) {
                handleLogout(error?.response?.data?.msg ? error?.response?.data?.msg : "Authentication Error");
            }
            console.error("Error deleting task:", error);
            message.error("Failed to delete task!");
        }
    };


    const showModal = (task) => {
        if (task) {
            setIsUpdating(true);
            setCurrentTaskId(task._id);
            form.setFieldsValue({
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? dayjs(task.dueDate) : null,
                status: task.status,
                assignedUser: task.assignedUser,
            });
        } else {
            setIsUpdating(false);
        }
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        setIsUpdating(false);
    };

    const handleFilterChange = (value, field) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: value,
        }));
    };

    const getButtonColor = (status) => {
        switch (status) {
            case "Completed":
                return "green";
            case "Pending":
                return "red";
            default:
                return "default";
        }
    };
    const toggleSortDirection = () => {
        setSortAscending(!sortAscending);
        fetchTasks(filters);
    };

    const handleLogout = (info) => {
        message.success(info);

        setTimeout(() => {

            localStorage.removeItem("token");
            setAuth({ token: null, user: null });
            window.location.reload();
        }, [3000])
    };
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => message.success("Copied to clipboard!"))
            .catch(() => message.error("Failed to copy!"));
    };

    useEffect(() => {
        fetchTasks(filters);
        fetchUsers();
    }, [filters, dispatch]);


    return (
        <div>

            <div style={{ marginBottom: "20px" }}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Filter by Status"
                            onChange={(value) => handleFilterChange(value, "status")}
                            defaultValue={""}
                        >
                            <Option value="">All Status</Option>
                            <Option value="Pending">Pending</Option>
                            <Option value="Completed">Completed</Option>
                        </Select>
                    </Col>

                    <Col span={8}>
                        <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Filter by Due Date"
                            onChange={(date) => handleFilterChange(date, "dueDate")}
                        />
                    </Col>

                    <Col span={8}>
                        <Button type="primary" onClick={() => showModal(null)} style={{ width: "100%" }}>
                            Add Task
                        </Button>
                    </Col>
                </Row>
            </div>

            <div className="todo-task-List" >
                <div className="todo-task-list-main">
                    <div className="sortIcon">
                        <h3>Current Tasks</h3>
                        <Tooltip title={sortAscending ? "Sort Ascending" : "Sort Descending"}>
                            <Button onClick={toggleSortDirection}>
                                {sortAscending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                            </Button>
                        </Tooltip>
                    </div>

                    <List
                        dataSource={tasks.filter((task) => task.status !== "Completed")}
                        renderItem={(task) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Tooltip title={task?.createdBy?.username || userData?.name}>
                                            <Avatar style={{ backgroundColor: "#1890ff", color: "#fff" }}>
                                                {task?.createdBy?.username
                                                    ? task.createdBy.username.charAt(0).toUpperCase()
                                                    : userData?.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </Tooltip>

                                    }
                                    title={task.title}
                                    description={
                                        <>
                                            <Tooltip title={task.description}>
                                                <span style={{
                                                    display: "inline-block",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    maxWidth: "250px" // Adjust as needed
                                                }}>
                                                    {task.description}
                                                </span>
                                            </Tooltip>
                                            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleUpdateTask(task._id, { status: "Completed" })}
                                                        style={{ backgroundColor: getButtonColor("Completed"), color: "white" }}
                                                    >
                                                        Mark as Complete
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => showModal(task)}
                                                        style={{ backgroundColor: "orange", color: "white" }}
                                                    >
                                                        Update
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleDetailsModal(task)}
                                                        style={{ backgroundColor: "gray", color: "white" }}
                                                    >
                                                        Details
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleDeleteTask(task._id)}
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                    />
                                                )}
                                            </div>
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />

                </div>

                <Divider type="vertical" className="todo-list-divider" />

                <div className="todo-task-list-main">
                    <div className="sortIcon">
                        <h3>Completed Tasks</h3>
                        <Tooltip title={sortAscending ? "Sort Ascending" : "Sort Descending"}>
                            <Button onClick={toggleSortDirection}>
                                {sortAscending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                            </Button>
                        </Tooltip>
                    </div>

                    <List
                        dataSource={tasks.filter((task) => task.status === "Completed")}
                        renderItem={(task) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Tooltip title={task?.createdBy?.username || userData?.name}>
                                            <Avatar style={{ backgroundColor: "#1890ff", color: "#fff" }}>
                                                {task?.createdBy?.username
                                                    ? task.createdBy.username.charAt(0).toUpperCase()
                                                    : userData?.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </Tooltip>

                                    }
                                    title={task.title}
                                    description={
                                        <>
                                            <Tooltip title={task.description}>
                                                <span style={{
                                                    display: "inline-block",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    maxWidth: "250px" // Adjust as needed
                                                }}>
                                                    {task.description}
                                                </span>
                                            </Tooltip>
                                            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleUpdateTask(task._id, { status: "Pending" })}
                                                        style={{ backgroundColor: getButtonColor("Pending"), color: "white" }}
                                                    >
                                                        Mark as Pending
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => showModal(task)}
                                                        style={{ backgroundColor: "orange", color: "white" }}
                                                    >
                                                        Update
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleDetailsModal(task)}
                                                        style={{ backgroundColor: "gray", color: "white" }}
                                                    >
                                                        Details
                                                    </Button>
                                                )}
                                                {hasPermission(task) && (
                                                    <Button
                                                        onClick={() => handleDeleteTask(task._id)}
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                    />
                                                )}
                                            </div>
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />


                </div>
                <Modal
                    // title="Task Details"
                    visible={isDetailsModalOpen}
                    onCancel={handleDetailsModalClose}
                    footer={null}
                    width={600}
                >
                    {currentTaskDetails && (
                        <Card style={{ width: "100%", borderRadius: "8px", border: 'none' }}>
                            <Title level={4} style={{ marginBottom: "12px", textAlign: "center" }}>Task Details</Title>

                            <Space direction="vertical" size="middle" style={{ display: "flex" }}>
                                <div>
                                    <Text type="secondary">Title</Text>
                                    <Text strong style={{ display: "block" }}>{currentTaskDetails.title}</Text>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary">Description</Text> <Tooltip title="Copy">
                                                <Button
                                                    icon={<CopyOutlined />}
                                                    onClick={() => handleCopy(currentTaskDetails.description)}
                                                    type="text"
                                                />
                                            </Tooltip></div>
                                        <Text style={{ display: "block" }}>{currentTaskDetails.description}</Text>
                                    </div>


                                </div>

                                <div>
                                    <Text type="secondary">Status</Text>
                                    <Text strong style={{ display: "block", color: currentTaskDetails.status === "Completed" ? "green" : "red" }}>
                                        {currentTaskDetails.status}
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary">Due Date</Text>
                                    <Text strong style={{ display: "block" }}>
                                        {dayjs(currentTaskDetails.dueDate).format("YYYY-MM-DD")}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Modal>
            </div>

            {/* Modal to Add or Update Task */}
            <Modal
                visible={isModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={() => form.submit()}
                    >
                        {isUpdating ? "Update Task" : "Add Task"}
                    </Button>,
                ]}
            >

                <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                    <Title level={3} style={{ textAlign: "center", marginBottom: "20px" }}>
                        {isUpdating ? "Update Task" : "Add Task"}
                    </Title>

                    <Form
                        form={form}
                        onFinish={(values) => {
                            const updatedTask = {
                                ...values,
                                dueDate: values.dueDate.format("YYYY-MM-DD"),
                            };
                            if (isUpdating) {
                                handleUpdateTask(currentTaskId, updatedTask);
                            } else {
                                handleAddTask(updatedTask);
                            }
                        }}
                        layout="vertical"
                    >
                        {/* Title Input */}
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: "Please input the title!" }]}
                        >
                            <Input placeholder="Enter task title" />
                        </Form.Item>

                        {/* Description Input */}
                        <Form.Item
                            label="Description"
                            name="description"
                            rules={[{ required: true, message: "Please input the description!" }]}
                        >
                            <Input.TextArea placeholder="Enter task description" rows={4} />
                        </Form.Item>

                        {/* Due Date Picker */}
                        <Form.Item
                            name="dueDate"
                            label="Due Date"
                            rules={[{ required: true, message: "Please select a due date" }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select due date"
                            />
                        </Form.Item>

                        {/* Status Select */}
                        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                            <Select placeholder="Select task status">
                                <Option value="Pending">Pending</Option>
                                <Option value="Completed">Completed</Option>
                            </Select>
                        </Form.Item>


                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default TaskManager;
