import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3500;

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Mock storage
let accounts: Record<string, any> = {};
let notes: any[] = [];
let usernameToUserIdMap: Record<string, string> = {};


// Create Account
const createAccount: RequestHandler = (req: Request, res: Response) => {
	const { user_id, username } = req.body;

	// if (accounts[user_id]) {
	// 	console.log("create account nonok", accounts)
	// 	res.status(400).json({ error: 'Account already exists.' });
	// 	return;
	// }

	const usernameExists = Object.values(accounts).some(acc => acc.username === username);
	if (accounts[user_id] || usernameExists) {
		console.log("Account creation failed: Duplicate user_id or username", accounts);
		res.status(400).json({ error: 'Account with this user_id or username already exists.' });
		return;
	}

	accounts[user_id] = {
		id: user_id,
		user_id,
		username,
		balance: '100 ETH',
		notes: [],
	};

	usernameToUserIdMap[username] = user_id; // Add the mapping for username -> user_id

	console.log("create account ok", accounts)
	res.json({ message: 'Account created successfully.', account: accounts[user_id] });
};

// Get User Notes
const getUserNotes: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params;
	console.log(`Fetching notes for userId: ${userId}`); // Debugging

	const userNotes = notes.filter((note) => {
		console.log(`Checking note:`, note); // Debug each note
		return note.receiver_id === userId; // Match userId directly
	});

	if (userNotes.length === 0) {
		console.log('No notes found for user:', userId); // Debugging
		res.status(404).json({ error: 'No notes found for this user.' });
		return;
	}

	console.log('Notes found:', userNotes); // Debugging
	res.json(userNotes);
};

// Send Public Note (with support for both user_id and username)
const sendPublicNote: RequestHandler = (req: Request, res: Response) => {
	let { sender_id, receiver_id, amount, receiver_username } = req.body;

	// Lookup receiver_id if receiver_username is provided
	if (receiver_username) {
		receiver_id = usernameToUserIdMap[receiver_username];
		if (!receiver_id) {
			res.status(404).json({ error: 'Receiver username not found.' });
			return;
		}
	}

	if (!accounts[sender_id] || !accounts[receiver_id]) {
		res.status(404).json({ error: 'Sender or receiver account not found.' });
		return;
	}

	const senderBalance = parseFloat(accounts[sender_id].balance);
	if (senderBalance < parseFloat(amount)) {
		res.status(400).json({ error: 'Insufficient balance.' });
		return;
	}

	// Create the public note
	const note = {
		note_id: `note_${Date.now()}`,
		sender_id,
		receiver_id,
		amount,
		note_type: 'public',
		timestamp: new Date().toISOString(),
	};

	// Deduct amount from sender's balance
	accounts[sender_id].balance = `${senderBalance - parseFloat(amount)} ETH`;
	notes.push(note);

	res.json({ message: 'Public note sent successfully.', note });
};

// // Send Public Note
// const sendPublicNote: RequestHandler = (req: Request, res: Response) => {
// 	const { sender_id, receiver_id, amount } = req.body;

// 	if (!accounts[sender_id] || !accounts[receiver_id]) {
// 		res.status(404).json({ error: 'Sender or receiver account not found.' });
// 		return;
// 	}

// 	const senderBalance = parseFloat(accounts[sender_id].balance);
// 	if (senderBalance < parseFloat(amount)) {
// 		res.status(400).json({ error: 'Insufficient balance.' });
// 		return;
// 	}

// 	// Create the public note
// 	const note = {
// 		note_id: `note_${Date.now()}`,
// 		sender_id,
// 		receiver_id,
// 		amount,
// 		note_type: 'public',
// 		timestamp: new Date().toISOString(),
// 	};

// 	// Deduct amount from sender's balance
// 	accounts[sender_id].balance = `${senderBalance - parseFloat(amount)} ETH`;

// 	notes.push(note);

// 	res.json({ message: 'Public note sent successfully.', note });
// };

// Consume a Note
const consumeNote: RequestHandler = (req: Request, res: Response) => {
	const { user_id, note_id } = req.body;
	const note = notes.find((n) => n.note_id === note_id && n.receiver_id === user_id);

	if (!note) {
		res.status(404).json({ error: 'Note not found or not intended for this account.' });
		return;
	}

	const accountBalance = parseFloat(accounts[user_id].balance);
	accounts[user_id].balance = `${accountBalance + parseFloat(note.amount)} ETH`;

	// Remove the consumed note
	notes = notes.filter((n) => n.note_id !== note_id);

	res.json({ message: 'Note consumed successfully.', account: accounts[user_id] });
};

// Get Account Details
// Get Account Details
const getAccountDetails: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params; // Use 'userId' instead of 'user_id'
	const account = accounts[userId]; // Fetch the account using the correct key

	console.log(req.params); // Should log: { userId: '1' }

	if (!account) {
		console.log('get account details nonok', accounts);
		res.status(404).json({ error: 'Account not found.' });
		return;
	}

	console.log('get account details ok', accounts);
	res.json(account);
};
// Register Routes
app.post('/api/account/create', createAccount);
app.get('/api/account/:userId/notes', getUserNotes);
app.post('/api/notes/public/send', sendPublicNote);
app.post('/api/notes/consume', consumeNote);
app.get('/api/account/:userId', getAccountDetails);

// Start Server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
