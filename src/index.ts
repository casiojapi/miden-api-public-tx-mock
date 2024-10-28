import express, { Request, Response, RequestHandler } from 'express';

const app = express();
const PORT = process.env.PORT || 3500;

app.use(express.json()); // Parse JSON request bodies

// Mock storage
let accounts: Record<string, any> = {};
let notes: any[] = [];

// Create Account
const createAccount: RequestHandler = (req: Request, res: Response) => {
	const { user_id, username } = req.body;
	const accountId = `acc_${user_id}`;

	if (accounts[accountId]) {
		res.status(400).json({ error: 'Account already exists.' });
		return;
	}

	accounts[accountId] = {
		id: accountId,
		user_id,
		username,
		balance: '100 ETH', // Give initial balance for testing
		notes: [],
	};

	res.json({ message: 'Account created successfully.', account: accounts[accountId] });
};

// Get User Notes
const getUserNotes: RequestHandler = (req: Request, res: Response) => {
	const { userId } = req.params;
	const userNotes = notes.filter((note) => note.receiver_id === `acc_${userId}`);
	res.json(userNotes);
};

// Send Public Note
const sendPublicNote: RequestHandler = (req: Request, res: Response) => {
	const { sender_id, receiver_id, amount } = req.body;

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

// Consume a Note
const consumeNote: RequestHandler = (req: Request, res: Response) => {
	const { account_id, note_id } = req.body;
	const note = notes.find((n) => n.note_id === note_id && n.receiver_id === account_id);

	if (!note) {
		res.status(404).json({ error: 'Note not found or not intended for this account.' });
		return;
	}

	const accountBalance = parseFloat(accounts[account_id].balance);
	accounts[account_id].balance = `${accountBalance + parseFloat(note.amount)} ETH`;

	// Remove the consumed note
	notes = notes.filter((n) => n.note_id !== note_id);

	res.json({ message: 'Note consumed successfully.', account: accounts[account_id] });
};

// Get Account Details
const getAccountDetails: RequestHandler = (req: Request, res: Response) => {
	const { accountId } = req.params;
	const account = accounts[accountId];

	if (!account) {
		res.status(404).json({ error: 'Account not found.' });
		return;
	}

	res.json(account);
};

// Register Routes
app.post('/api/account/create', createAccount);
app.get('/api/account/:userId/notes', getUserNotes);
app.post('/api/notes/public/send', sendPublicNote);
app.post('/api/notes/consume', consumeNote);
app.get('/api/account/:accountId', getAccountDetails);

// Start Server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
