const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
	return (
		<div className="space-y-2">
			<label className="text-sm font-medium text-gray-200">Gender</label>
			<div className="flex gap-4">
				<label className="flex items-center space-x-3 cursor-pointer group">
					<div className="relative">
						<input
							type="radio"
							name="gender"
							value="male"
							checked={selectedGender === "male"}
							onChange={() => onCheckboxChange("male")}
							className="sr-only"
						/>
						<div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
							selectedGender === "male" 
								? "border-blue-500 bg-blue-500" 
								: "border-white/30 group-hover:border-blue-400"
						}`}>
							{selectedGender === "male" && (
								<div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
							)}
						</div>
					</div>
					<span className="text-white group-hover:text-blue-300 transition-colors duration-200">Male</span>
				</label>
				
				<label className="flex items-center space-x-3 cursor-pointer group">
					<div className="relative">
						<input
							type="radio"
							name="gender"
							value="female"
							checked={selectedGender === "female"}
							onChange={() => onCheckboxChange("female")}
							className="sr-only"
						/>
						<div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
							selectedGender === "female" 
								? "border-pink-500 bg-pink-500" 
								: "border-white/30 group-hover:border-pink-400"
						}`}>
							{selectedGender === "female" && (
								<div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
							)}
						</div>
					</div>
					<span className="text-white group-hover:text-pink-300 transition-colors duration-200">Female</span>
				</label>
			</div>
		</div>
	);
};
export default GenderCheckbox;