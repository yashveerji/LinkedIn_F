import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authDataContext } from "../context/AuthContext";

export default function JobForm() {
  const [form, setForm] = useState({ title: "", company: "", location: "", type: "", description: "", salaryRange: "" });
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${serverUrl}/api/jobs`, form, { withCredentials: true }).then(() => {
      alert("Job posted successfully");
      navigate("/jobs");
    });
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post a Job</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        {["title", "company", "location", "salaryRange"].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={field}
            className="border p-2 rounded w-full"
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required={field !== "salaryRange"}
          />
        ))}
        <select
          className="border p-2 rounded w-full"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          <option value="">Select Job Type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <textarea
          placeholder="Description"
          className="border p-2 rounded w-full"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded w-full">
          Post Job
        </button>
      </form>
    </div>
  );
}
