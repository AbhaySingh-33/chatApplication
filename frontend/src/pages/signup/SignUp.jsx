import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useRef, useState } from "react";
import useSignup from "../../hooks/useSignup";


const SignUp = () => {
    const [inputs, setInputs] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        gender: "",
        profilePic: null,
    });

    const fileInputRef = useRef(null);

    const { loading, signup } = useSignup();

    const handleCheckboxChange = (gender) => {
        setInputs({ ...inputs, gender });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setInputs({ ...inputs, profilePic: file });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signup({
            fullName: inputs.fullName,
            username: inputs.username,
            password: inputs.password,
            confirmPassword: inputs.confirmPassword,
            email: inputs.email,
            gender: inputs.gender,
            profilePic: inputs.profilePic,
        });
    };

	const [preview, setPreview] = useState("/default.png");

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="min-h-full flex justify-center items-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="w-full max-w-md lg:max-w-lg relative z-10">
                {/* Logo/Brand Section */}
                <div className="text-center mb-6 sm:mb-8 animate-fade-in-down">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full mb-4 animate-bounce-slow shadow-lg shadow-blue-500/50">
                        <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 animate-fade-in">Join ChatApp</h1>
                    <p className="text-blue-200 text-sm sm:text-base animate-fade-in delay-200">Create your account to start chatting</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-300/20 animate-slide-up hover:shadow-blue-500/20 transition-all duration-500">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4 animate-fade-in-left delay-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-blue-200">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
                                    value={inputs.fullName}
                                    onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-blue-200">Username</label>
                                <input
                                    type="text"
                                    placeholder="johndoe"
                                    className="w-full px-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
                                    value={inputs.username}
                                    onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 animate-fade-in-right delay-400">
                            <label className="text-sm font-medium text-blue-200">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
                                    value={inputs.email}
                                    onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 animate-fade-in-left delay-500">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-blue-200">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
                                    value={inputs.password}
                                    onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-blue-200">Confirm</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
                                    value={inputs.confirmPassword}
                                    onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <GenderCheckbox
                            onCheckboxChange={handleCheckboxChange}
                            selectedGender={inputs.gender}
                        />

                        {/* Profile Picture */}
                        <div className="flex flex-col items-center space-y-3 animate-fade-in delay-600">
                            <label className="text-sm font-medium text-blue-200">Profile Picture (optional)</label>
                            <div className="relative group">
                                <img 
                                    src={preview} 
                                    alt="Profile" 
                                    className="w-20 h-20 rounded-full object-cover border-3 border-blue-300/30 cursor-pointer transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/50"
                                    onClick={handleImageClick}
                                />
                                <div className="absolute inset-0 rounded-full bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer" onClick={handleImageClick}>
                                    <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up delay-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center animate-fade-in delay-800">
                        <p className="text-blue-200">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="text-cyan-400 hover:text-cyan-300 font-medium transition-all duration-200 hover:underline"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
