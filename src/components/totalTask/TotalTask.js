import React, { useState } from "react";
import "./TotalTasks.css";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AddTask from './AddTask';
import { db } from "../../firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";

const TotalTasks = ({ tasks, searchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userRole = currentUser?.role;

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("none");

  const handleBack = () => navigate('/dashboard');

  // Delete Task
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  // Update Status
  const handleStatusChange = async (taskId, newStatus) => {
    await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
  };

  // Filtering logic
  let filteredTasks = tasks.filter((task) => {
    const taskNum = task.taskNumber?.toLowerCase() || "";
    const taskName = task.name?.toLowerCase() || "";
    return (
      taskNum.includes(searchQuery.toLowerCase()) ||
      taskName.includes(searchQuery.toLowerCase())
    );
  });

  if (priorityFilter !== "All") {
    filteredTasks = filteredTasks.filter((task) => task.priority === priorityFilter);
  }

  if (statusFilter !== "All") {
    filteredTasks = filteredTasks.filter((task) => task.status === statusFilter);
  }

  // Sorting by priority
  if (sortOrder !== "none") {
    const priorityValue = (p) =>
      ({ High: 1, Medium: 2, Low: 3 }[p] || 4);
    filteredTasks.sort((a, b) => {
      const valA = priorityValue(a.priority);
      const valB = priorityValue(b.priority);
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  } else {
    // Default sort by task number ascending
    filteredTasks.sort((a, b) => {
      const numA = parseInt(a.taskNumber?.replace("INC", ""), 10);
      const numB = parseInt(b.taskNumber?.replace("INC", ""), 10);
      return numA - numB;
    });
  }

  return (
    <div className="tt-container">
      <h1>Total Tasks</h1>

      {(userRole === "user" || userRole === "admin") && (
        <AddTask tasks={tasks} />
      )}

      <div className="tt-filter-bar">
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="with assignee">With Assignee</option>
          <option value="In Progress">In Progress</option>
          <option value="under review">Under Review</option>
          <option value="ready to deploy">Ready to Deploy</option>
          <option value="Completed">Completed</option>
        </select>

        <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
          Sort by Priority {sortOrder === "asc" ? "🔼" : "🔽"}
        </button>

        <button onClick={() => {
          setPriorityFilter("All");
          setStatusFilter("All");
          setSortOrder("none");
        }} className="tt-clear-btn">
          Clear Filters
        </button>
      </div>

      <ul className="tt-task-list">
        {filteredTasks.map((task) => (
          <li key={task.id} className="tt-task-row">
            <div className="tt-col">
              <Link to={`/task/${task.id}`} state={{ from: location.pathname }} className="tt-link">
                <strong>{task.taskNumber}: {task.name}</strong>
              </Link>
            </div>
            <div className="tt-col">
              <em className="tt-desc">
                {task.description?.length > 40
                  ? `${task.description.slice(0, 40)}...`
                  : task.description || "No description"}
              </em>
            </div>
            <div className="tt-col">
              <span className={`tt-priority ${task.priority?.toLowerCase()}`}>
                {task.priority}
              </span>
            </div>
            <div className="tt-col">
              {(userRole === "assignee" || userRole === "admin") ? (
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="tt-status-dropdown"
                >
                  <option value="with assignee">With Assignee</option>
                  <option value="In Progress">In Progress</option>
                  <option value="under review">Under Review</option>
                  <option value="ready to deploy">Ready to Deploy</option>
                  <option value="Completed">Completed</option>
                </select>
              ) : (
                <span className="tt-readonly-status">{task.status}</span>
              )}
            </div>
            {(userRole === "user" || userRole === "admin") && (
              <div className="tt-col">
                <button onClick={() => handleDelete(task.id)} className="tt-delete-btn">
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <button className="tt-back-btn" onClick={handleBack}>Back</button>
    </div>
  );
};

export default TotalTasks;
