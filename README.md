# DS-backend-pretest
## Endpoint
### Part 1 & Part 2
**GET** `http://localhost:3000/data?user={userId}`
- If the userId is not provide or not a number, it will return `400 Bad Request` from `ParseIntPipe`
- In `RateLimitGuard`, every time the user request the endpoint, cache the `ip` in redis with the key `ip:{ip}-{uuid}` and set the expire time to 1 minute. If the user request the endpoint more than 10 times within 1 minute, it will return `429 Too Many Requests`
- The request `userId` will be cached in redis with the key `user:{userId}-{uuid}` and set the expire time to 1 minute. If the user request the endpoint with the same `userId` more than 5 times within 1 minute, it will return `429 Too Many Requests`
- Both 429 error will return the current request count in the data field

### Part 3
**WS** `ws://localhost:3000/bitstamp`
- Can be connected with `socket.io`
- It has 2 events
  - `subscribe` - Subscribe to the channel
  - `unsubscribe` - Unsubscribe to the channel
- Each event will require a list of channel name to subscribe or unsubscribe
- The channel name can be found in [Bitstamp WebSocket API](https://www.bitstamp.net/websocket/v2/)
- The server will send the data to the client when the data is received from Bitstamp WebSocket API
- Besides, the server will process the received data and calculate the 1minute OHLC data for each channel and send it to the client who has subscribed to the channel
- The OHLC data will be sent to the channel room once the received data's timestamp is not in the same minute with the previous received data's timestamp
- The OHLC data will be sent to the client with the event name `ohlc` and the data will be in the following format
  ```json
  {
    "pair": "btcusd",
    "timestamp": 1621436400,
    "open": 0,
    "high": 0,
    "low": 0,
    "close": 0
  }
  ```

## How to run
This project is using `docker-compose` to run the redis server and the backend server

### development
```bash
# start the redis server
docker-compose up -d redis
# install the dependencies
yard install
# start the dev server
yarn start:dev
```

### production
```bash
docker-compose up -d --no-deps --build
```