import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors());
app.use(express.json());

// mock storage
let accounts: Record<string, any> = {};
let notes: any[] = [];
let usernameToUserIdMap: Record<string, string> = {};


// create account
const createAccount: RequestHandler = (req: Request, res: Response) => {
	const { user_id, username } = req.body;

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

	usernameToUserIdMap[username] = user_id; // add the mapping for telegram username -> user_id

	console.log("create account ok", accounts)
	res.json({ message: 'Account created successfully.', account: accounts[user_id] });
};

// get user notes
const getUserNotes: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params;
	console.log(`Fetching notes for userId: ${userId}`);

	const userNotes = notes.filter((note) => {
		console.log(`Checking note:`, note);
		return note.receiver_id === userId;
	});

	if (userNotes.length === 0) {
		console.log('No notes found for user:', userId);
		res.status(200).json({ message: 'No notes found for this user.' });
		return;
	}

	console.log('Notes found:', userNotes);
	res.json(userNotes);
};

// send public note (with support for both user_id and username)
const sendPublicNote: RequestHandler = (req: Request, res: Response) => {
	let { sender_id, receiver_id, amount, receiver_username } = req.body;

	// falopa para user -> id 
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

	const note = {
		note_id: `note_${Date.now()}`,
		sender_id,
		receiver_id,
		amount,
		note_type: 'public',
		timestamp: new Date().toISOString(),
	};

	accounts[sender_id].balance = `${senderBalance - parseFloat(amount)} ETH`;
	notes.push(note);

	res.json({ message: 'Public note sent successfully.', note });
};

// Send transaction and update sender and receiver balances
const sendTransaction: RequestHandler = (req: Request, res: Response) => {
	const { sender_id, receiver_id, amount, receiver_username } = req.body;

	let receiverFinalId = receiver_id;

	// Resolve receiver ID if only username is provided
	if (receiver_username) {
		receiverFinalId = usernameToUserIdMap[receiver_username];
		if (!receiverFinalId) {
			res.status(404).json({ error: 'Receiver username not found.' });
			return;
		}
	}

	if (!accounts[sender_id] || !accounts[receiverFinalId]) {
		res.status(404).json({ error: 'Sender or receiver account not found.' });
		return;
	}

	const senderBalance = parseFloat(accounts[sender_id].balance);
	if (senderBalance < parseFloat(amount)) {
		res.status(400).json({ error: 'Insufficient balance.' });
		return;
	}

	// Deduct from sender and add to receiver
	accounts[sender_id].balance = `${senderBalance - parseFloat(amount)} ETH`;
	const receiverBalance = parseFloat(accounts[receiverFinalId].balance);
	accounts[receiverFinalId].balance = `${receiverBalance + parseFloat(amount)} ETH`;

	// Add to transaction history
	const transaction = {
		transaction_id: `txn_${Date.now()}`,
		sender_id,
		receiver_id: receiverFinalId,
		amount,
		timestamp: new Date().toISOString(),
	};
	notes.push(transaction);

	res.json({ message: 'Transaction successful', transaction });
};

const getTransactionHistory: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params;

	const userTransactions = notes.filter(
		(note) => note.sender_id === userId || note.receiver_id === userId
	);

	res.json({ transactions: userTransactions });
};

app.get('/api/account/:userId/transactions', getTransactionHistory);

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

// consume a note
const consumeNote: RequestHandler = (req: Request, res: Response) => {
	const { user_id, note_id } = req.body;
	const note = notes.find((n) => n.note_id === note_id && n.receiver_id === user_id);

	if (!note) {
		res.status(404).json({ error: 'Note not found or not intended for this account.' });
		return;
	}

	const accountBalance = parseFloat(accounts[user_id].balance);
	accounts[user_id].balance = `${accountBalance + parseFloat(note.amount)} ETH`;

	// remove the consumed note
	notes = notes.filter((n) => n.note_id !== note_id);

	res.json({ message: 'Note consumed successfully.', account: accounts[user_id] });
};

// get account details
const getAccountDetails: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params;
	const account = accounts[userId];

	console.log(req.params);

	if (!account) {
		console.log('get account details nonok', accounts);
		res.status(404).json({ error: 'Account not found.' });
		return;
	}

	console.log('get account details ok', accounts);
	res.json(account);
};


app.post('/api/transactions/send', sendTransaction);
app.post('/api/account/create', createAccount);
app.get('/api/account/:userId/notes', getUserNotes);
app.post('/api/notes/public/send', sendPublicNote);
app.post('/api/notes/consume', consumeNote);
app.get('/api/account/:userId', getAccountDetails);

// start server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
