
import React, { useContext, useEffect, useRef, useState } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { REACTIONS } from "./Reactions";
import { LuSendHorizontal } from "react-icons/lu";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
// socket handled globally in UserContext for feed updates
import ConnectionButton from './ConnectionButton';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';

// Note: no local socket connection; updates flow via context

// ...existing code...

function Post(props) {
  // Delete post
  const handleDeletePost = async () => {
    if (!postId) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${serverUrl}/api/post/delete/${postId}`, { withCredentials: true });
  // Notify parent to remove from list without full page reload
  if (typeof props.onDelete === 'function') props.onDelete();
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!postId || !commentId) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`${serverUrl}/api/post/comment/${postId}/${commentId}`, { withCredentials: true });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      alert("Failed to delete comment");
    }
  };
  const {
    id, _id, author = {}, like = [], comment = [], description = "",
    image, createdAt, repostedFrom,
  } = props;

  const postId = id || _id;

  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authDataContext);
  const { userData, handleGetProfile } = useContext(userDataContext);

  const [reactions, setReactions] = useState(props.reactions || []);
  const [showReactions, setShowReactions] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  // Count for each reaction type
  const reactionCounts = REACTIONS.reduce((acc, r) => {
    acc[r.key] = reactions.filter(rx => rx.type === r.key).length;
    return acc;
  }, {});
  const totalReactions = reactions.length;
  const paletteTimers = useRef({ closeTimer: null, longPressTimer: null, longPress: false });

  const openPalette = () => {
    if (paletteTimers.current.closeTimer) {
      clearTimeout(paletteTimers.current.closeTimer);
      paletteTimers.current.closeTimer = null;
    }
    setShowReactions(true);
  };
  const closePalette = (delay = 120) => {
    if (paletteTimers.current.closeTimer) clearTimeout(paletteTimers.current.closeTimer);
    paletteTimers.current.closeTimer = setTimeout(() => setShowReactions(false), delay);
  };
  const handlePressStart = () => {
    if (paletteTimers.current.longPressTimer) clearTimeout(paletteTimers.current.longPressTimer);
    paletteTimers.current.longPress = false;
    paletteTimers.current.longPressTimer = setTimeout(() => {
      paletteTimers.current.longPress = true;
      openPalette();
    }, 450);
  };
  const handlePressEnd = (e) => {
    if (paletteTimers.current.longPressTimer) clearTimeout(paletteTimers.current.longPressTimer);
    if (paletteTimers.current.longPress) {
      // Suppress the click that follows a long press
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    // reset flag shortly after
    setTimeout(() => { paletteTimers.current.longPress = false; }, 0);
  };
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(comment || []);
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    setReactions(props.reactions || []);
    setComments(comment || []);
    // Set my reaction
    if (props.reactions && userData?._id) {
      const mine = props.reactions.find(r => r.user && (r.user._id === userData._id || r.user === userData._id));
      setMyReaction(mine ? mine.type : null);
    }
  }, [props.reactions, comment, userData]);

  // Real-time updates handled by UserContext; this component just reflects props

  // Handle reaction click (like, love, wow, sad, angry)
  const handleReaction = async (type) => {
    if (!postId) {
      console.warn("Missing postId — pass id={post._id}");
      return;
    }
    setMyReaction(prev => (prev === type ? null : type));
    try {
      const res = await axios.post(
        `${serverUrl}/api/post/like/${postId}`,
        { type },
        { withCredentials: true }
      );
      setReactions(res.data?.reactions || []);
      const mine = (res.data?.reactions || []).find(r => r.user && (r.user._id === userData?._id || r.user === userData?._id));
      setMyReaction(mine ? mine.type : null);
      setShowReactions(false);
    } catch (error) {
      console.log("Like error:", error);
      setMyReaction(prev => (prev === type ? null : type));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!postId) {
      console.warn("Missing postId — pass id={post._id}");
      return;
    }
    const content = commentContent.trim();
    if (!content) return;
    try {
      const res = await axios.post(
        `${serverUrl}/api/post/comment/${postId}`,
        { content },
        { withCredentials: true }
      );
      setComments(res.data?.comment || []);
      setCommentContent("");
    } catch (error) {
      console.log("Comment error:", error);
    }
  };


  // Handler for reposting a post
  const handleRepost = async () => {
    if (!postId) return;
    try {
      await axios.post(`${serverUrl}/api/post/repost/${postId}`, {}, { withCredentials: true });
      alert("Reposted successfully!");
    } catch (error) {
      alert("Failed to repost");
    }
  };

  // Quote Repost
  const [showQuote, setShowQuote] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const handleQuoteRepost = async () => {
    if (!postId) return;
    try {
      await axios.post(`${serverUrl}/api/post/repost/${postId}/quote`, { quote: quoteText }, { withCredentials: true });
      setShowQuote(false);
      setQuoteText("");
      alert("Reposted with quote!");
    } catch (e) { alert("Failed to quote repost"); }
  };

  // Save/Unsave post
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cardRef = useRef(null);
  const toggleSave = async () => {
    if (!postId) return;
    try {
      const res = await axios.post(`${serverUrl}/api/post/save/${postId}`, {}, { withCredentials: true });
      setSaved(res.data?.saved);
    } catch (e) { alert("Failed to update saved status"); }
  };

  // Initialize saved state from userData if available
  useEffect(() => {
    try {
      const list = userData?.savedPosts || [];
      if (postId && Array.isArray(list)) {
        const exists = list.some(p => (p?._id || p)?.toString?.() === postId?.toString?.());
        setSaved(Boolean(exists));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.savedPosts, postId]);

  // Close three-dots menu on outside click / ESC
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Keyboard shortcuts when card focused
  const onKeyDown = (e) => {
    const k = e.key?.toLowerCase?.();
    if (k === 'l') {
      handleReaction(myReaction === 'like' ? 'like' : 'like');
    } else if (k === 'c') {
      setShowComment(v => !v);
    } else if (k === 's') {
      toggleSave();
    }
  };

  // Share to Connection modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Handler for opening share modal
  const handleShareToConnection = () => {
    setShowShareModal(true);
  };

  // Handler for sending post to selected connection
  const handleSendToConnection = async () => {
    if (!postId || !selectedConnection) return;
    setShareLoading(true);
    try {
      // Example API call: you may want to implement this endpoint in your backend
      await axios.post(`${serverUrl}/api/chat/share-post`, {
        to: selectedConnection,
        postId,
      }, { withCredentials: true });
      setShowShareModal(false);
      setSelectedConnection(null);
      alert("Post shared successfully!");
    } catch (error) {
      alert("Failed to share post");
    }
    setShareLoading(false);
  };

  return (
    <div ref={cardRef} tabIndex={0} onKeyDown={onKeyDown} className="w-full min-h-[200px] flex flex-col gap-4 bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-lg focus:outline-none">

      {/* Header */}
      <div className='flex justify-between items-center'>
        <div
          className='flex gap-3 items-start cursor-pointer'
          onClick={() => author?.userName && handleGetProfile(author.userName)}
        >
          <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm'>
            <img src={author?.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div>
            <div className='text-lg font-semibold text-[#0A66C2] hover:text-[#084d8a] transition-colors'>
              {`${author?.firstName ?? ""} ${author?.lastName ?? ""}`}
            </div>
            <div className='text-sm text-gray-600'>{author?.headline}</div>
            <div className='text-xs text-gray-500'>{createdAt ? moment(createdAt).fromNow() : ""}</div>
            {repostedFrom && (
              <div className='text-xs text-gray-600'>
                Reposted from
                <button
                  className='ml-1 text-[#0A66C2] hover:underline'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (repostedFrom?.userName) handleGetProfile(repostedFrom.userName);
                  }}
                >
                  {`${repostedFrom?.firstName ?? ''} ${repostedFrom?.lastName ?? ''}`}
                </button>
              </div>
            )}
          </div>
        </div>

  <div className="relative" ref={menuRef}>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
          >
            <HiOutlineDotsHorizontal className="w-5 h-5 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              <ul className="py-1 text-sm text-gray-700">
                {userData?._id && author?._id && userData._id === author._id ? (
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={handleDeletePost}>Delete post</button>
                  </li>
                ) : (
                  <li>
                    <div className="px-4 py-2"><ConnectionButton userId={author?._id} /></div>
                  </li>
                )}
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleRepost}>Repost</button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setShowQuote(true)}>Quote repost</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>


      {/* Post image */}
      {image && (
        <div className="w-full flex justify-center items-center my-2" onDoubleClick={() => handleReaction('like')} aria-label="Post image">
          <img src={image} alt="Post" className="max-h-96 rounded-lg object-contain select-none" draggable={false} />
        </div>
      )}

      {/* Post description */}
      <div className={`w-full ${!more ? "max-h-[100px] overflow-hidden" : ""} pl-[60px] text-gray-800`} onDoubleClick={() => handleReaction('like')}>
        {description}
      </div>
      {description?.length > 120 && (
        <div
          className="pl-[60px] text-sm font-medium text-[#0077b5] cursor-pointer hover:underline"
          onClick={() => setMore(prev => !prev)}
        >
          {more ? "Read less..." : "Read more..."}
        </div>
      )}




  {/* Primary actions: Like/Reaction, Comment, Share, Save */}
  <div className='flex flex-wrap justify-around items-center text-gray-700 font-medium py-2 relative gap-2'>
    {/* Like/Reaction with hover + long-press */}
    <div
      className='relative inline-block'
      onMouseEnter={openPalette}
      onMouseLeave={() => closePalette(120)}
    >
  <button
        onClick={(e) => {
          if (paletteTimers.current.longPress) return; // ignore click right after long-press
          handleReaction(myReaction === null ? 'like' : myReaction);
        }}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={!postId}
        title={!postId ? "Missing postId" : (myReaction ? 'Remove reaction' : 'Like')}
        className={`flex items-center gap-2 ${myReaction ? 'text-[#0A66C2]' : 'hover:text-[#0A66C2]'}`}
      >
        {myReaction ? (
          <span style={{ color: REACTIONS.find(r => r.key === myReaction)?.color }}>
            {React.createElement(REACTIONS.find(r => r.key === myReaction)?.icon, { className: 'w-5 h-5' })}
          </span>
        ) : (
          <BiLike className='w-5 h-5' />
        )}
  <span>{myReaction ? REACTIONS.find(r => r.key === myReaction)?.label : "Like"}</span>
  <span className='text-xs text-gray-500' aria-label={`Total reactions ${totalReactions}`}>({totalReactions})</span>
      </button>
      {/* Reaction palette on hover */}
      {showReactions && (
        <div
          className="absolute bottom-8 left-0 bg-white shadow-lg rounded-full flex gap-2 px-3 py-2 z-20 border border-gray-200"
          onMouseEnter={openPalette}
          onMouseLeave={() => closePalette(80)}
        >
          {REACTIONS.map(r => (
            <button
              key={r.key}
              title={r.label}
              onClick={() => handleReaction(r.key)}
              style={{ color: r.color }}
              className={`hover:scale-125 transition-transform ${myReaction === r.key ? 'font-bold' : ''}`}
            >
              {React.createElement(r.icon, { className: 'w-6 h-6' })}
              <span className='text-xs ml-1'>{reactionCounts[r.key]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
        {/* Comment */}
        <button
          className='flex items-center gap-2 hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
          aria-label="Toggle comments"
        >
          <span className='flex items-center gap-1'>
            <FaRegCommentDots className='w-5 h-5' />
            <span>Comment</span>
            <span className='text-xs text-gray-500 ml-1'>({comments?.length || 0})</span>
          </span>
        </button>
  {/* Repost and Quote moved to three-dots menu above */}
        {/* Save */}
        <button
          className={`flex items-center gap-2 ${saved ? 'text-yellow-600' : 'hover:text-yellow-600'}`}
          onClick={toggleSave}
          aria-label={saved ? 'Unsave post' : 'Save post'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M5.25 3A2.25 2.25 0 003 5.25v14.69a.75.75 0 001.2.6l6.3-4.725a.75.75 0 01.9 0l6.3 4.725a.75.75 0 001.2-.6V5.25A2.25 2.25 0 0018.75 3h-13.5z" />
          </svg>
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
  {/* Share to Connection */
  }
        <button
          className='flex items-center gap-2 hover:text-purple-600'
          onClick={handleShareToConnection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 2.25l-9.193 9.193m0 0l-3.182 8.182a.563.563 0 00.728.728l8.182-3.182m-5.728-5.728l8.182-8.182a.563.563 0 01.728.728l-8.182 8.182z" />
          </svg>
          <span>Share to Connection</span>
        </button>
      {/* Share to Connection Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-xs shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => setShowShareModal(false)}>&times;</button>
            <h3 className="text-lg font-semibold mb-3 text-center">Share Post to Connection</h3>
            {userData?.connections && userData.connections.length > 0 ? (
              <>
                <select
                  className="w-full p-2 border rounded mb-4 text-black dark:text-white dark:bg-gray-800"
                  value={selectedConnection || ''}
                  onChange={e => setSelectedConnection(e.target.value)}
                >
                  <option value='' disabled>Select a connection</option>
                  {userData.connections.map(conn => (
                    <option key={conn._id} value={conn._id}>
                      {conn.firstName} {conn.lastName} {conn.userName ? `(@${conn.userName})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSendToConnection}
                  disabled={!selectedConnection || shareLoading}
                >
                  {shareLoading ? 'Sharing...' : 'Share'}
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500">No connections found.</div>
            )}
          </div>
        </div>
      )}
      </div>
      {/* Reaction summary row */}
      {totalReactions > 0 && (
        <div className='pl-[60px] -mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600'>
          {REACTIONS.filter(r => reactionCounts[r.key] > 0).map(r => (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border ${myReaction === r.key ? 'border-[#0A66C2] text-[#0A66C2]' : 'border-gray-200 hover:border-gray-300'}`}
              title={`${r.label}: ${reactionCounts[r.key]}`}
              aria-label={`${r.label} count ${reactionCounts[r.key]}`}
            >
              <span style={{ color: r.color }}>
                {React.createElement(r.icon, { className: 'w-4 h-4' })}
              </span>
              <span>{reactionCounts[r.key]}</span>
            </button>
          ))}
        </div>
      )}
      {/* Quote Modal */}
      {showQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => setShowQuote(false)}>&times;</button>
            <h3 className="text-lg font-semibold mb-3">Add a comment to your repost</h3>
            <textarea className="w-full border rounded p-2 h-28" value={quoteText} onChange={(e)=>setQuoteText(e.target.value)} placeholder="Say something about this..." />
            <button className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700" onClick={handleQuoteRepost}>Repost</button>
          </div>
        </div>
      )}
      {/* Comments section */}
      {showComment && (
        <div className='mt-2'>
          <form
            className="flex justify-between items-center border border-gray-200 rounded-full px-4 py-1 bg-white"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Leave a comment..."
              className='flex-1 outline-none border-none text-sm text-black placeholder-gray-500'
              style={{ color: "#000", backgroundColor: "#fff" }}
              autoComplete="off"
              spellCheck={false}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <button type="submit" disabled={!postId} title={!postId ? "Missing postId" : "Send"}>
              <LuSendHorizontal className="text-[#07a4ff] w-5 h-5" />
            </button>
          </form>

          {/* Comment list */}
          <div className='mt-3 flex flex-col gap-3'>
            {comments?.map((com) => (
              <div key={com._id} className='flex flex-col gap-1 border-b border-gray-200 pb-2'>
                <div className="flex items-center gap-2">
                  <div className='w-[35px] h-[35px] rounded-full overflow-hidden'>
                    <img src={com.user?.profileImage || dp} alt="" className='h-full w-full object-cover' />
                  </div>
                  <div className='text-sm font-semibold text-[#0A66C2]'>{`${com.user?.firstName ?? ""} ${com.user?.lastName ?? ""}`}</div>
                  {/* Delete comment button for comment owner */}
                  {userData?._id && com.user?._id && userData._id === com.user._id && (
                    <button
                      className="text-xs text-red-500 hover:underline ml-2"
                      onClick={() => handleDeleteComment(com._id)}
                      title="Delete Comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className='pl-[45px] text-sm text-gray-700'>{com.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
