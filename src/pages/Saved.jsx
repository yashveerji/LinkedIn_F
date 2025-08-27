import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import Post from '../components/Post';

export default function Saved() {
  const { serverUrl } = useContext(authDataContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(serverUrl + '/api/post/saved', { withCredentials: true });
        setItems(res.data || []);
      } catch (e) { setItems([]); }
    })();
  }, [serverUrl]);

  return (
    <div className="w-full min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-4">Saved Posts</h1>
      <div className="flex flex-col gap-4">
        {items.length === 0 && <div className="text-gray-500">No saved posts</div>}
        {items.map((p) => (
          <div key={p._id} className="bg-white rounded-xl shadow p-4">
            <Post {...p} />
          </div>
        ))}
      </div>
    </div>
  );
}
