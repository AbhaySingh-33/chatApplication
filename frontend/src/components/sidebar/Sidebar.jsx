import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
	return (
		<div className='border-r-0 sm:border-r border-blue-300/20 p-2 flex flex-col h-full overflow-hidden bg-blue-900/20 backdrop-blur-sm'>
			<div className="animate-fade-in delay-200">
				<SearchInput />
			</div>
			<div className='divider px-3 border-blue-300/30'></div>
			<div className="animate-fade-in delay-300 flex-1 overflow-hidden">
				<Conversations />
			</div>
			<div className="mt-auto pt-2 animate-fade-in delay-400">
				<LogoutButton />
			</div>
		</div>
	);
};
export default Sidebar;