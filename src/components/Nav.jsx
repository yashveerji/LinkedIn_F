
import React, { useContext, useEffect, useState } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa';
import logo2 from "../assets/GC.jpg"
import { IoSearchSharp } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { FaUserGroup } from "react-icons/fa6";
import { IoNotificationsSharp } from "react-icons/io5";
import dp from "../assets/dp.webp"
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { MdWork } from "react-icons/md";
import { BsBookmarkHeartFill } from 'react-icons/bs';

function Nav() {
    const [activeSearch, setActiveSearch] = useState(false)
    const { userData, setUserData, handleGetProfile } = useContext(userDataContext)
    const [showPopup, setShowPopup] = useState(false)
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const navigate = useNavigate()
    const location = useLocation()
    const { serverUrl } = useContext(authDataContext)
    const [searchInput, setSearchInput] = useState("")
    const [searchData, setSearchData] = useState([])

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        // Remove manual body background override so Tailwind dark: classes work
        document.body.style.background = '';
    }, [darkMode]);

    const handleSignOut = async () => {
        try {
            await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true })
            setUserData(null)
            navigate("/login")
        } catch (error) {
            console.log(error);
        }
    }

    const handleSearch = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/user/search?query=${searchInput}`, { withCredentials: true })
            setSearchData(result.data)
        } catch (error) {
            setSearchData([])
        }
    }

    useEffect(() => {
        handleSearch()
    }, [searchInput])

    const isActive = (path) => location.pathname === path

    return (
        <>
            <header className={`w-full h-[80px] bg-gradient-to-br from-white/80 dark:from-[#181A20] dark:to-[#23272F] to-[#F3F4F6] dark:shadow-black/40 shadow-lg backdrop-blur-md flex items-center px-4 lg:px-12 z-[80] transition-colors duration-300`}
                aria-label="Main Navigation"
            >
                {/* Left: Logo & Search */}
                <div className='flex items-center gap-4 flex-1 rounded-md'>
                    <img
                        src={logo2}
                        alt="Logo"
                        className='w-[50px] cursor-pointer rounded-lg shadow-md border-2 border-indigo-400 dark:border-yellow-400 bg-white/60 dark:bg-[#23272F] transition-all duration-300'
                        onClick={() => {
                            setActiveSearch(false)
                            navigate("/")
                        }}
                        aria-label="Go to Home"
                    />
                    {!activeSearch && (
                        <IoSearchSharp
                            className='w-[23px] h-[23px] text-gray-500 dark:text-gray-300 lg:hidden cursor-pointer hover:scale-110 transition-transform'
                            onClick={() => setActiveSearch(true)}
                            aria-label="Open search"
                        />
                    )}
                    <form
                        className={`bg-[#f0efe7] dark:bg-[#23272F] h-[40px] rounded-full flex items-center gap-2 px-3 transition-all duration-300 ${activeSearch ? "flex" : "hidden"} lg:flex w-[200px] lg:w-[350px] shadow-inner`}
                        aria-label="Search users"
                    >
                        <IoSearchSharp className='w-[20px] h-[20px] text-gray-600 dark:text-gray-300' />
                        <input
                            type="text"
                            placeholder='Search users...'
                            className='w-full bg-transparent outline-none text-gray-800 dark:text-gray-100'
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            aria-label="Search input"
                        />
                    </form>
                </div>

                {/* Search Results */}
                {searchData.length > 0 && (
                    <div className="absolute top-[75px] left-0 lg:left-12 shadow-lg w-full lg:w-[500px] bg-white dark:bg-[#23272F] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[250px] z-[90] animate-fadeIn">
                        {searchData.map((sea) => (
                            <div
                                key={sea._id}
                                className="flex gap-3 items-center border-b border-gray-100 dark:border-gray-800 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                                onClick={() => handleGetProfile(sea.userName)}
                                tabIndex={0}
                                aria-label={`Go to profile of ${sea.firstName} ${sea.lastName}`}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-green-400 shadow-md">
                                    <img
                                        src={sea.profileImage || dp}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        {`${sea.firstName} ${sea.lastName}`}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                        {sea.headline}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Right: Nav Items */}
                <nav className='flex items-center gap-4' aria-label="Main navigation links">
                    <button
                        className={`hidden lg:flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate("/")}
                        aria-label="Home"
                    >
                        <TiHome className='w-[23px] h-[23px] mb-1' />
                        <span>Home</span>
                    </button>
                    <button
                        className={`hidden md:flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/network") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate("/network")}
                        aria-label="My Networks"
                    >
                        <FaUserGroup className='w-[23px] h-[23px] mb-1' />
                        <span>My Networks</span>
                    </button>
                    <button
                        className={`flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/chat") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate("/chat")}
                        aria-label="Chat"
                    >
                        <IoChatbubbleEllipsesSharp className='w-[23px] h-[23px] mb-1' />
                        <span className='hidden md:block'>Chat</span>
                    </button>
                    <button
                        className={`flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/jobs") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate("/jobs")}
                        aria-label="Jobs"
                    >
                        <MdWork className="w-[23px] h-[23px] mb-1" />
                        <span className="hidden md:block">Jobs</span>
                    </button>
                    <button
                        className={`flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/notification") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate("/notification")}
                        aria-label="Notifications"
                    >
                        <IoNotificationsSharp className='w-[23px] h-[23px] mb-1' />
                        <span className='hidden md:block'>Notifications</span>
                    </button>
                    <button
                        className={`flex flex-col items-center cursor-pointer rounded-full px-4 py-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive("/saved") ? "bg-indigo-500 text-white shadow-lg" : "text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"}`}
                        onClick={() => navigate('/saved')}
                        aria-label="Saved"
                    >
                        <BsBookmarkHeartFill className='w-[23px] h-[23px] mb-1' />
                        <span className='hidden md:block'>Saved</span>
                    </button>
                    {/* Dark/Light Mode Toggle */}
                    <button
                        className={`ml-2 p-2 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300
                            ${darkMode
                                ? 'bg-gradient-to-br from-[#23272F] to-[#181A20] border-2 border-yellow-400 scale-110'
                                : 'bg-gradient-to-br from-indigo-200 to-yellow-100 border-2 border-indigo-400 scale-110'
                            }
                        `}
                        onClick={() => setDarkMode((prev) => !prev)}
                        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {darkMode ? <FaSun className='text-yellow-400' /> : <FaMoon className='text-indigo-700' />}
                    </button>
                    {/* Profile Picture with status */}
                    <div
                        className='w-[44px] h-[44px] rounded-full overflow-hidden cursor-pointer border-2 border-indigo-400 dark:border-yellow-400 shadow-md hover:scale-105 transition-transform relative ml-2'
                        onClick={() => setShowPopup(prev => !prev)}
                        tabIndex={0}
                        aria-label="Open profile menu"
                    >
                        <img src={userData?.profileImage || dp} alt="Profile" className='w-full h-full object-cover' />
                        {/* Status indicator */}
                        <span className='absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-[#23272F] animate-pulse'></span>
                    </div>
                </nav>
            </header>
            {/* Profile Popup outside header for visibility */}
            {showPopup && (
                <div className='fixed top-[90px] right-4 lg:right-12 w-[320px] bg-white/90 dark:bg-[#23272F] shadow-2xl rounded-2xl p-5 flex flex-col items-center gap-4 z-[999] border border-gray-200 dark:border-gray-700 backdrop-blur-xl animate-fadeIn' role="menu" aria-label="Profile menu">
                    <div className='w-[70px] h-[70px] rounded-full overflow-hidden ring-4 ring-indigo-400 dark:ring-yellow-400 shadow-lg'>
                        <img src={userData?.profileImage || dp} alt="" className='w-full h-full object-cover' />
                    </div>
                    <div className='text-xl font-bold text-gray-800 dark:text-gray-100'>{`${userData.firstName} ${userData.lastName}`}</div>
                    <button
                        className='w-full h-[40px] rounded-full border border-yellow-400 bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] dark:text-[#23272F] font-semibold hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200'
                        onClick={() => handleGetProfile(userData.userName)}
                        aria-label="View Profile"
                    >
                        View Profile
                    </button>
                    <div className='w-full h-[1px] bg-gray-300 dark:bg-gray-700'></div>
                    <button
                        className='w-full h-[40px] rounded-full border border-red-500 bg-gradient-to-r from-[#aa0c0c] to-[#d23805] text-[#f1f2ff] dark:text-[#f1f2ff] font-semibold hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200'
                        onClick={handleSignOut}
                        aria-label="Sign Out"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </>
    );
}

export default Nav;
