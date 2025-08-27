import React, { useContext, useEffect, useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { FiPlus, FiCamera } from "react-icons/fi";
import { userDataContext } from "../context/UserContext";
import EditProfile from "../components/EditProfile";
import { RxCross1 } from "react-icons/rx";
import { BsImage } from "react-icons/bs";
import axios from "axios";
import { authDataContext } from "../context/AuthContext";
import Post from "../components/Post";
import AIChat from "../components/AIChat";


function Home() {
  const { userData, edit, setEdit, postData, setPostData, getPost, handleGetProfile } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState("");
  const [description, setDescription] = useState("");
  const [uploadPost, setUploadPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState([]);
  const [toast, setToast] = useState("");
  const image = useRef();
  const sentinelRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleUploadPost = async () => {
    setPosting(true);
    try {
      const formdata = new FormData();
      formdata.append("description", description);
      if (backendImage) formdata.append("image", backendImage);
      await axios.post(serverUrl + "/api/post/create", formdata, {
        withCredentials: true,
      });
      await getPost();
      setPosting(false);
      setUploadPost(false);
    } catch (error) {
      setPosting(false);
      console.log(error);
    }
  };

  const handleSuggestedUsers = async () => {
    try {
      const result = await axios.get(serverUrl + "/api/user/suggestedusers", {
        withCredentials: true,
      });
      setSuggestedUser(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleSuggestedUsers();
  }, []);

  useEffect(() => {
    getPost();
  }, [uploadPost]);

  // initial paged load
  useEffect(() => {
    let cancelled = false;
    const loadFirstPage = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/post/getpost?page=1&limit=10`, { withCredentials: true });
        const data = res.data;
        const items = Array.isArray(data) ? data : (data.items || []);
        if (!cancelled) {
          setPostData(items);
          setPage(1);
          setHasMore(Boolean(!Array.isArray(data) && data.hasMore));
        }
      } catch (e) {
        // fallback to context fetch already called
      }
    };
    loadFirstPage();
    return () => { cancelled = true; };
  }, [serverUrl, setPostData]);

  // infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadMore();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasMore, page]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await axios.get(`${serverUrl}/api/post/getpost?page=${nextPage}&limit=10`, { withCredentials: true });
      const data = res.data;
      const items = Array.isArray(data) ? data : (data.items || []);
      setPostData(prev => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(Boolean(!Array.isArray(data) && data.hasMore));
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

    return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] dark:from-[#181824] dark:to-[#23243a] flex flex-col lg:flex-row p-5 gap-5 relative text-white dark:text-yellow-100">
      {edit && <EditProfile />}

    {/* Left Sidebar */}
  <div className="w-full lg:w-[25%] flex flex-col gap-5">
        {/* Profile Card */}
  <div className="card flex flex-col items-center relative dark:bg-[#181824] dark:border-yellow-700">
          <div
            className="relative w-[80px] h-[80px] rounded-full overflow-hidden border-4 border-yellow-400 dark:border-yellow-700 cursor-pointer"
            onClick={() => setEdit(true)}
          >
            <img
              src={userData.profileImage || dp}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <FiCamera className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-1 rounded-full" />
          </div>
          <h2 className="mt-3 font-bold text-lg text-yellow-400 dark:text-yellow-300">{`${userData.firstName} ${userData.lastName}`}</h2>
          <p className="text-sm text-yellow-200 dark:text-yellow-400 text-center">{userData.headline}</p>
          <button
            className="mt-3 btn-primary dark:bg-yellow-500 dark:text-[#181824]"
            onClick={() => setEdit(true)}
          >
            Edit Profile
          </button>
        </div>

        {/* Suggested Users */}
  <div className="card dark:bg-[#181824] dark:border-yellow-700">
          <h3 className="font-semibold text-lg text-yellow-400 dark:text-yellow-300 mb-3">Suggested Users</h3>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
            {suggestedUser.length > 0 ? (
              suggestedUser.map((su, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary cursor-pointer transition"
                  onClick={() => handleGetProfile(su.userName)}
                >
                  <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-yellow-400 dark:border-yellow-700">
                    <img
                      src={su.profileImage || dp}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-yellow-200 dark:text-yellow-400">{`${su.firstName} ${su.lastName}`}</span>
                    <span className="text-xs text-yellow-300 dark:text-yellow-200">{su.headline}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-yellow-300 dark:text-yellow-200">No suggestions</p>
            )}
          </div>
        </div>
      </div>

  {/* Center Feed */}
  <div className="w-full lg:w-[50%] flex flex-col gap-5 mt-[90px]">
        {/* + Post Button */}
        <button
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg dark:bg-yellow-500 dark:text-[#181824]"
          onClick={() => setUploadPost(true)}
        >
          <FiPlus size={20} /> Add Post
        </button>

        {/* Posts */}
  {postData.map((post, index) => (
          <div key={index} className="card dark:bg-[#181824] dark:border-yellow-700">
            <Post {...post} onDelete={() => {
              setToast("Post deleted successfully");
              setTimeout(() => {
                setToast("");
    // Reload first page after delete for consistency
    setPage(1);
    setHasMore(true);
    setPostData(prev => prev.filter(p => p._id !== post._id));
              }, 1500);
            }} />
          </div>
        ))}
  <div ref={sentinelRef} className="h-6"></div>
  {isLoadingMore && (
    <div className="text-center text-yellow-200 dark:text-yellow-300">Loading more...</div>
  )}
      {/* Toast notification */}
      {toast && (
  <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-500 dark:bg-green-700 text-white px-6 py-2 rounded shadow-lg z-50 animate-fadeIn">
          {toast}
        </div>
      )}
      </div>
<AIChat/>
      {/* Post Modal */}
      {uploadPost && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setUploadPost(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[90%] max-w-md card dark:bg-[#181824] dark:border-yellow-700 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white dark:text-yellow-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg text-yellow-400 dark:text-yellow-300">Create Post</h2>
              <RxCross1
                className="cursor-pointer text-yellow-400"
                onClick={() => setUploadPost(false)}
              />
            </div>
            <textarea
              className="input mt-3 resize-none dark:bg-[#23243a] dark:text-yellow-100 dark:placeholder-yellow-300"
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {frontendImage && (
              <img
                src={frontendImage}
                alt="Preview"
                className="mt-3 w-full rounded-lg"
              />
            )}
            <div className="flex justify-between items-center mt-4">
              <BsImage
                className="text-yellow-400 dark:text-yellow-300 cursor-pointer"
                onClick={() => image.current.click()}
              />
              <input type="file" ref={image} hidden onChange={handleImage} />
              <button
                className="btn-primary dark:bg-yellow-500 dark:text-[#181824]"
                onClick={handleUploadPost}
                disabled={posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
