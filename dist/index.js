"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3500;
app.use(express.json()); // Parse JSON request bodies
// Mock storage
let accounts = {};
let notes = [];
let transactions = [];
// GET: Fetch account by user ID
const getAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const account = accounts[`acc_${userId}`];
    if (account) {
        console.log(`Account acc_${userId} fetched.`);
        res.status(200).json({ message: 'Account fetched successfully.', account });
        return;
    }
    console.log(`Account acc_${userId} not found.`);
    res.status(404).json({ error: 'Account not found.' });
});
// Create a new account
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        balance: '0 ETH',
        notes: [],
    };
    res.json({ message: 'Account created successfully.', account: accounts[accountId] });
});
// Send a private note
const sendPrivateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender_id, receiver_id, amount } = req.body;
    if (!accounts[sender_id] || !accounts[receiver_id]) {
        res.status(404).json({ error: 'Sender or receiver account not found.' });
        return;
    }
    const note = {
        note_id: `note_${Date.now()}`,
        sender_id,
        receiver_id,
        amount,
        note_type: 'private',
        timestamp: new Date().toISOString(),
    };
    notes.push(note);
    transactions.push(note);
    res.json({ message: 'Private note sent successfully.', note });
});
// Consume a note
const consumeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { account_id, note_id } = req.body;
    const note = notes.find((n) => n.note_id === note_id);
    if (!note) {
        res.status(404).json({ error: 'Note not found.' });
        return;
    }
    accounts[account_id].balance = `${parseFloat(accounts[account_id].balance) + parseFloat(note.amount)} ETH`;
    notes = notes.filter((n) => n.note_id !== note_id);
    res.json({ message: 'Note consumed successfully.', account: accounts[account_id] });
});
// Get account details
const getAccountDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.params;
    const account = accounts[accountId];
    if (!account) {
        res.status(404).json({ error: 'Account not found.' });
        return;
    }
    res.json(account);
});
// Register routes
app.post('/api/account/create', createAccount);
app.get('/api/account/:userId', getAccount);
app.post('/api/notes/private/send', sendPrivateNote);
app.post('/api/notes/consume', consumeNote);
app.get('/api/account/:accountId', getAccountDetails);
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
