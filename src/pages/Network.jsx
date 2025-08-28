import React, { useContext, useEffect, useState } from "react";
import Nav from "../components/Nav";
import axios from "axios";
import { authDataContext } from "../context/AuthContext";
import dp from "../assets/dp.webp";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { RxCrossCircled } from "react-icons/rx";
import io from "socket.io-client";

import { useNavigate } from "react-router-dom";

function Network() {
  const { serverUrl } = useContext(authDataContext);

  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  // Socket setup
  useEffect(() => {
    const socket = io(serverUrl, { withCredentials: true });

    socket.on("newRequest", (newReq) => {
      setRequests((prev) => [...prev, newReq]);
    });

    socket.on("requestAccepted", () => {
      fetchConnections();
      fetchRequests();
    });

    socket.on("connectionRemoved", (id) => {
      setConnections((prev) => prev.filter((c) => c._id !== id));
    });

    return () => socket.disconnect();
  }, [serverUrl]);

  // Fetch pending requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/connection/requests`, {
        withCredentials: true,
      });
      console.log("Requests API response:", res.data);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch accepted connections (fixed endpoint)
  const fetchConnections = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/connection/`, {
        withCredentials: true,
      });
      console.log("Connections API response:", res.data);
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept a connection request
  const handleAccept = async (id) => {
    try {
      await axios.put(`${serverUrl}/api/connection/accept/${id}`, {}, { withCredentials: true });
      fetchRequests();
      fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  // Reject a connection request
  const handleReject = async (id) => {
    try {
      await axios.put(`${serverUrl}/api/connection/reject/${id}`, {}, { withCredentials: true });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchConnections();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] flex flex-col items-center">
      <div className="fixed top-0 w-full z-50">
        <Nav />
      </div>

      <div className="w-full max-w-[900px] mt-[90px] px-4 sm:px-6 lg:px-8 flex flex-col gap-6">

        {/* Invitations */}
        <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between text-lg font-semibold text-gray-700">
          <span>Invitations</span>
          <span className="text-[#0a66c2]">{requests.length}</span>
        </div>

        {requests.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg divide-y">
            {requests.map((req) => (
              <div key={req._id} className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
                    <img
                      src={req.sender?.profileImage || dp}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-base sm:text-lg font-medium text-gray-800">
                    {[req.sender?.firstName, req.sender?.lastName].filter(Boolean).join(" ")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-[#18c5ff] hover:text-[#0ea5e9] transition-colors"
                    onClick={() => handleAccept(req._id)}
                  >
                    <IoIosCheckmarkCircleOutline className="w-9 h-9" />
                  </button>
                  <button
                    className="text-[#ff4218] hover:text-red-600 transition-colors"
                    onClick={() => handleReject(req._id)}
                  >
                    <RxCrossCircled className="w-8 h-8" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-6 text-center text-gray-500">
            No new invitations.
          </div>
        )}

        {/* Connections */}
        <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between text-lg font-semibold text-gray-700 mt-8">
          <span>My Connections</span>
          <span className="text-[#0a66c2]">{connections.length}</span>
        </div>

        {connections.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg divide-y">
            {connections.map((conn) => (
              <div
                key={conn._id}
                className="flex items-center p-4 gap-4 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => navigate(`/profile/${conn.userName}`)}
                title="View Profile"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
                  <img
                    src={conn.profileImage || dp}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-base sm:text-lg font-medium text-gray-800">
                  {[conn.firstName, conn.lastName].filter(Boolean).join(" ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-6 text-center text-gray-500">
            You have no connections yet.
          </div>
        )}

      </div>
    </div>
  );
}

export default Network;
