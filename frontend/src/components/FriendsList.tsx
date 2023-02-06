import React from 'react';
import 'reactjs-popup/dist/index.css';
import Friend from './Friend';

import users from '../mock-data/users';

type PersonListProps = {
	// names : {
	//     first :string,
	//     last : string,
	//     status : string,
	// }[],
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
};

export const FriendsList = (props: PersonListProps) => {
	// let [firstName, setFirstName] = useState<string>("");
	// let [nameList, setFriendsList] = useState<INameList[]>([]);

	// const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
	//     if (event.target.name === 'name')
	//         setFirstName(event.target.value)
	// };

	// const addFriend = (event: any) : void => {
	//     event?.preventDefault();
	//     const newFriend = {first: firstName, last: "wayne", status: "connected"}
	//     setFriendsList([...nameList, newFriend]);
	//     setFirstName("");
	// }

	return (
		<div className="friendsList-wrapper">
			{users.map((user) => (
				<Friend
					key={user.idd}
					name={user.pseudo}
					states={user.states}
					idd={user.idd}
					activeConv={props.activeConv}
				/>
			))}
			{/* <form className='add-friend-form'>
                <label>
                    <input type="text" name="name" placeholder='Add Friend' value={firstName} className='add-friend-form-label' onChange={handleChange}/>
                </label>
                <input type="submit" value="Add" className='add-friend-form-submit-button' onClick={addFriend}/>
            </form> */}
		</div>
	);
};

export default FriendsList;
