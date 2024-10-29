## create account (sender)
curl -X POST http://localhost:3500/api/account/create \
-H "Content-Type: application/json" \
-d '{
  "user_id": "1",
  "username": "sender"
}'

## create account (receiver)
curl -X POST http://localhost:3500/api/account/create \
-H "Content-Type: application/json" \
-d '{
  "user_id": "2",
  "username": "receiver"
}'

## get account details
curl -X GET http://localhost:3500/api/account/1


## send public note
curl -X POST http://localhost:3500/api/notes/public/send \
-H "Content-Type: application/json" \
-d '{
  "sender_id": "1",
  "receiver_id": "2",
  "amount": "50"
}'


## send note to tg username
curl -X POST http://localhost:3500/api/notes/public/send \
-H "Content-Type: application/json" \
-d '{
  "sender_id": "1",
  "receiver_username": "receiver",
  "amount": "25"
}'


## get user notes
curl -X GET http://localhost:3500/api/account/2/notes

## consume note
curl -X POST http://localhost:3500/api/notes/consume \
-H "Content-Type: application/json" \
-d '{
  "user_id": "2",
  "note_id": "note_YOURNOTEID"
}'
