## create account 

curl -X POST https://miden-api-public-tx-mock.onrender.com/api/account/create \
-H "Content-Type: application/json" \
-d '{
  "user_id": "1",
  "username": "testuser"
}'

## get account details

curl -X GET https://miden-api-public-tx-mock.onrender.com/api/account/1


## send public note

curl -X POST https://miden-api-public-tx-mock.onrender.com/api/notes/public/send \
-H "Content-Type: application/json" \
-d '{
  "sender_id": "1",
  "receiver_id": "2",
  "amount": "50"
}'

## get user notes

curl -X GET https://miden-api-public-tx-mock.onrender.com/api/account/1/notes

## consume notes

curl -X POST https://miden-api-public-tx-mock.onrender.com/api/notes/consume \
-H "Content-Type: application/json" \
-d '{
  "user_id": "2",
  "note_id": "note_1698314361000"
}'
