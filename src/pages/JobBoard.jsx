import React, { useEffect, useState, useContext } from "react";
import { userDataContext } from "../context/UserContext";
import { authDataContext } from "../context/AuthContext";
import axios from "axios";
import Nav from "../components/Nav";


function Jobs() {
  const { userData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showJobModal, setShowJobModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("");

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/jobs`, { withCredentials: true });
      setJobs(res.data);
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
    }
  };

  // Add or Edit job
  const handleJobSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim() || !location.trim()) {
      alert("All fields are required");
      return;
    }
    try {
      if (isEditMode && selectedJob) {
        await axios.put(`${serverUrl}/api/jobs/edit/${selectedJob._id}`, {
          title,
          company,
          description,
          location,
        }, { withCredentials: true });
      } else {
        await axios.post(`${serverUrl}/api/jobs/add`, {
          title,
          company,
          description,
          location,
        }, { withCredentials: true });
      }
      setTitle("");
      setCompany("");
      setDescription("");
      setLocation("");
      setShowJobModal(false);
      setIsEditMode(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
    }
  };

  // Open edit modal
  const openEditModal = (job) => {
    setSelectedJob(job);
    setTitle(job.title);
    setCompany(job.company);
    setDescription(job.description);
    setLocation(job.location);
    setIsEditMode(true);
    setShowJobModal(true);
  };

  // Open apply modal
  const openApplyModal = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  // Apply to job (dummy, just closes modal)
  const applyJob = async (e) => {
    e.preventDefault();
    // Here you would send application data to backend
    setApplicantName("");
    setApplicantEmail("");
    setApplicantMessage("");
    setShowApplyModal(false);
    setSelectedJob(null);
    alert("Application submitted!");
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs by search
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
      {/* Navbar */}
      <Nav />


      {/* Job Modal (Add/Edit) */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <form onSubmit={handleJobSubmit} className="card w-full max-w-md relative">
            <button type="button" className="absolute top-3 right-3 text-2xl text-yellow-400" onClick={() => { setShowJobModal(false); setIsEditMode(false); setSelectedJob(null); }}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">{isEditMode ? "Edit Job" : "Add Job"}</h2>
            <input type="text" className="input mb-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="text" className="input mb-2" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
            <input type="text" className="input mb-2" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <input type="text" className="input mb-4" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
            <button type="submit" className="btn-primary w-full">{isEditMode ? "Update Job" : "Add Job"}</button>
          </form>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <form onSubmit={applyJob} className="card w-full max-w-md relative">
              <button type="button" className="absolute top-3 right-3 text-2xl text-yellow-400" onClick={() => setShowApplyModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">Apply for {selectedJob.title}</h2>
              <input type="text" className="input mb-2" placeholder="Your Name" value={applicantName} onChange={e => setApplicantName(e.target.value)} required />
              <input type="email" className="input mb-2" placeholder="Your Email" value={applicantEmail} onChange={e => setApplicantEmail(e.target.value)} required />
              <textarea className="input mb-4" placeholder="Why are you a good fit?" value={applicantMessage} onChange={e => setApplicantMessage(e.target.value)} rows={4} required />
              <button type="submit" className="btn-primary w-full">Submit Application</button>
            </form>
          </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between mt-[80px] sm:items-center px-4 py-4 bg-white shadow-md gap-3">
          <button className="btn-primary w-full sm:w-auto mb-2 sm:mb-0" onClick={() => setShowJobModal(true)}>Add Job</button>
          <input
            type="text"
            placeholder="Search Job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full sm:w-60"
          />
      </div>

      {/* Job Cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const isOwner = userData && job.createdBy && (job.createdBy._id === userData._id);
            return (
              <div
                key={job._id}
                className="bg-white flex flex-col gap-2 border-2 border-yellow-200 hover:shadow-2xl transition duration-200 rounded-2xl p-5"
              >
                <h3 className="text-lg font-bold text-[#1A1F71]">{job.title}</h3>
                <p className="text-gray-700 text-sm">Company: {job.company}</p>
                <p className="text-gray-800 text-sm">{job.description}</p>
                <p className="text-yellow-600 text-xs">Location: {job.location}</p>
                <div className="flex gap-2 mt-2">
                  <button className="btn-secondary" onClick={() => openApplyModal(job)}>Apply</button>
                  {isOwner && (
                    <button className="btn-primary" onClick={() => openEditModal(job)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No jobs available
          </p>
        )}
      </div>
    </div>
  );
}

export default Jobs;