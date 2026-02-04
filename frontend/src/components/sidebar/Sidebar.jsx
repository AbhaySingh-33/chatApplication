import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
	return (
		<div className='border-r-0 sm:border-r border-white/10 p-2 flex flex-col h-full overflow-hidden bg-white/5 backdrop-blur-sm'>
			<div className="animate-fade-in delay-200">
				<SearchInput />
			</div>
			<div className='divider px-3 border-white/20'></div>
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