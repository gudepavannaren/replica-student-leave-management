import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyLeaves = ({ studentId }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/leave/student/${studentId}`)
      .then(res => setLeaves(res.data));
  }, [studentId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Leave Applications</h2>
      <div className="space-y-2">
        {leaves.map(leave => (
          <div key={leave._id} className="border p-3 rounded bg-white shadow">
            <p><strong>Reason:</strong> {leave.reason}</p>
            <p><strong>Status:</strong> {leave.status}</p>
            {leave.pdfUrl && (
              <a href={`http://localhost:5000/${leave.pdfUrl}`} className="text-blue-600 underline">Download Pass</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyLeaves;
