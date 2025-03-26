import { BsEmojiSmile } from "react-icons/bs";

const EmojiPickerButton = ({ onClick }) => {
    return (
        <button
            type="button"
            className="absolute inset-y-0 start-0  flex items-center ps-3"
            onClick={onClick}
        >
            <BsEmojiSmile />
        </button>
    );
};

export default EmojiPickerButton;