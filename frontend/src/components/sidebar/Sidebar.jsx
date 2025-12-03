import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
	return (
		<div className='border-r border-black-900 p-4 flex flex-col h-full overflow-hidden'>
			<SearchInput />
			<div className='divider px-3'></div>
			<Conversations />
			<div className="mt-auto pb-4">
				<LogoutButton />
			</div>
		</div>
	);
};
export default Sidebar;