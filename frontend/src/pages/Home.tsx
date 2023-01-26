import { IUser } from '../interfaces';

const Home = (props: { user: IUser }) => {
	return (
		<div className="home">
			<h1>My progression</h1>
			<p>User: {props.user.username}</p>
		</div>
	);
};

export default Home;
