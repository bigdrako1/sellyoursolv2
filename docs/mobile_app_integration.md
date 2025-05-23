# Mobile App Integration

This document provides information about the mobile app integration for the Sellyoursolv2 trading platform.

## Overview

The mobile app integration allows users to access the trading platform from their mobile devices. It provides a RESTful API for the mobile app to interact with the platform, including:

- User authentication
- Agent management
- Market data
- Order management
- Position tracking
- Notifications

## API Endpoints

The mobile API is available at `/api/mobile` and includes the following endpoints:

### Authentication

- `POST /api/mobile/login`: Login with username and password

### Agents

- `GET /api/mobile/agents`: Get all agents for the current user
- `GET /api/mobile/agents/{agent_id}`: Get agent details
- `POST /api/mobile/agents`: Create a new agent
- `DELETE /api/mobile/agents/{agent_id}`: Delete an agent
- `POST /api/mobile/agents/{agent_id}/start`: Start an agent
- `POST /api/mobile/agents/{agent_id}/stop`: Stop an agent
- `POST /api/mobile/agents/{agent_id}/command`: Execute a command on an agent

### Markets

- `GET /api/mobile/markets`: Get markets from an exchange

### Orders

- `GET /api/mobile/orders`: Get orders from an exchange
- `POST /api/mobile/orders`: Create a new order

### Positions

- `GET /api/mobile/positions`: Get positions from an exchange

### Notifications

- `GET /api/mobile/notifications`: Get notifications for the current user
- `POST /api/mobile/notifications/{notification_id}/read`: Mark a notification as read

## Authentication

The mobile API uses OAuth2 for authentication. To authenticate, send a POST request to `/api/mobile/login` with the following JSON body:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

The response will include an access token:

```json
{
  "access_token": "your_access_token",
  "token_type": "bearer",
  "user_id": "your_user_id",
  "username": "your_username"
}
```

For subsequent requests, include the access token in the `Authorization` header:

```
Authorization: Bearer your_access_token
```

## Data Models

### Agent Summary

```json
{
  "agent_id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "metrics": {},
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Agent Detail

```json
{
  "agent_id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "config": {},
  "metrics": {},
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Market Summary

```json
{
  "symbol": "string",
  "base": "string",
  "quote": "string",
  "price": 0.0,
  "change_24h": 0.0,
  "volume_24h": 0.0
}
```

### Order Summary

```json
{
  "order_id": "string",
  "symbol": "string",
  "type": "string",
  "side": "string",
  "amount": 0.0,
  "price": 0.0,
  "status": "string",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Position Summary

```json
{
  "symbol": "string",
  "side": "string",
  "amount": 0.0,
  "entry_price": 0.0,
  "current_price": 0.0,
  "pnl": 0.0,
  "pnl_percentage": 0.0,
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Notification Summary

```json
{
  "notification_id": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "read": false,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Example Usage

### Login

```bash
curl -X POST "http://localhost:8000/api/mobile/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

### Get Agents

```bash
curl -X GET "http://localhost:8000/api/mobile/agents" \
  -H "Authorization: Bearer your_access_token"
```

### Create Agent

```bash
curl -X POST "http://localhost:8000/api/mobile/agents" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent",
    "type": "predictive",
    "config": {
      "exchange_id": "binance",
      "symbols": ["BTC/USDT", "ETH/USDT"],
      "model_id": "price_direction_model_v1",
      "trade_enabled": false
    }
  }'
```

### Execute Agent Command

```bash
curl -X POST "http://localhost:8000/api/mobile/agents/your_agent_id/command" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "get_predictions",
    "parameters": {}
  }'
```

### Get Markets

```bash
curl -X GET "http://localhost:8000/api/mobile/markets?exchange=binance" \
  -H "Authorization: Bearer your_access_token"
```

### Create Order

```bash
curl -X POST "http://localhost:8000/api/mobile/orders?exchange=binance" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "type": "MARKET",
    "side": "BUY",
    "amount": 0.001
  }'
```

## Mobile App Features

The mobile app provides the following features:

1. **Dashboard**: Overview of account balance, active agents, and recent trades
2. **Agents**: List of agents with status and metrics
3. **Markets**: List of markets with price and volume information
4. **Orders**: List of open and closed orders
5. **Positions**: List of open positions with profit/loss information
6. **Notifications**: List of notifications from the platform

## Push Notifications

The platform supports push notifications for the following events:

1. **Agent Status**: When an agent starts, stops, or encounters an error
2. **Trade Execution**: When an agent executes a trade
3. **Order Status**: When an order is filled, canceled, or rejected
4. **Position Update**: When a position is opened, closed, or has significant profit/loss
5. **System Alerts**: Important system notifications

## Mobile App Development

The mobile app is developed using React Native, which allows for cross-platform development for both iOS and Android. The app communicates with the platform through the RESTful API described above.

### Key Technologies

- **React Native**: Cross-platform mobile framework
- **Redux**: State management
- **Axios**: HTTP client for API requests
- **React Navigation**: Navigation between screens
- **Victory Native**: Charts and visualizations
- **Push Notification Service**: Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNS) for iOS

### App Architecture

The mobile app follows a clean architecture with the following layers:

1. **Presentation Layer**: React components and screens
2. **State Management Layer**: Redux store, actions, and reducers
3. **Domain Layer**: Business logic and models
4. **Data Layer**: API client and local storage

### Security Considerations

1. **Secure Storage**: Sensitive information like access tokens is stored securely using encrypted storage
2. **Certificate Pinning**: The app uses certificate pinning to prevent man-in-the-middle attacks
3. **Biometric Authentication**: The app supports biometric authentication (fingerprint, face ID) for additional security
4. **Automatic Logout**: The app automatically logs out after a period of inactivity

## Future Enhancements

1. **Offline Mode**: Allow the app to work offline with limited functionality
2. **Advanced Charts**: Add more advanced charting capabilities
3. **Custom Alerts**: Allow users to set custom alerts for price movements
4. **Social Features**: Add social features like sharing trading strategies
5. **Widget Support**: Add widget support for quick access to key information
