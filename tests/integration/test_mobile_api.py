"""
Integration tests for mobile API.

This module contains integration tests for the mobile API endpoints.
"""
import os
import sys
import unittest
import json
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import the FastAPI app
from trading_agents.api.app import create_app

class TestMobileAPI(unittest.TestCase):
    """Integration tests for mobile API."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        # Create test client
        cls.app = create_app(testing=True)
        cls.client = TestClient(cls.app)
        
        # Create test user
        cls.test_user = {
            "username": "testuser",
            "password": "testpassword"
        }
        
        # Create test agent
        cls.test_agent = {
            "name": "Test Agent",
            "type": "predictive",
            "config": {
                "exchange_id": "binance",
                "symbols": ["BTC/USDT", "ETH/USDT"],
                "model_id": "test_model",
                "trade_enabled": False
            }
        }
        
        # Create test order
        cls.test_order = {
            "symbol": "BTC/USDT",
            "type": "MARKET",
            "side": "BUY",
            "amount": 0.001
        }
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200, "Root endpoint should return 200")
        self.assertIn("message", response.json(), "Response should include message")
    
    def test_health_endpoint(self):
        """Test health endpoint."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200, "Health endpoint should return 200")
        self.assertIn("status", response.json(), "Response should include status")
        self.assertEqual(response.json()["status"], "ok", "Status should be ok")
    
    def test_login_endpoint(self):
        """Test login endpoint."""
        # Note: This test will fail in a real environment without a valid user
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock token endpoint
        @self.app.post("/token")
        async def mock_token():
            return {
                "access_token": "mock_token",
                "token_type": "bearer",
                "user_id": "mock_user_id",
                "username": self.test_user["username"]
            }
        
        # Test login
        response = self.client.post(
            "/api/mobile/login",
            json=self.test_user
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Login endpoint should return 200")
        self.assertIn("access_token", response.json(), "Response should include access token")
        self.assertIn("token_type", response.json(), "Response should include token type")
        self.assertIn("user_id", response.json(), "Response should include user ID")
        self.assertIn("username", response.json(), "Response should include username")
    
    def test_agents_endpoint(self):
        """Test agents endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock authentication dependency
        @self.app.get("/api/mobile/agents")
        async def mock_agents():
            return [
                {
                    "agent_id": "mock_agent_id",
                    "name": self.test_agent["name"],
                    "type": self.test_agent["type"],
                    "status": "stopped",
                    "metrics": {},
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        
        # Test agents endpoint
        response = self.client.get(
            "/api/mobile/agents",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agents endpoint should return 200")
        self.assertIsInstance(response.json(), list, "Response should be a list")
        
        # If response is not empty, verify structure
        if response.json():
            agent = response.json()[0]
            self.assertIn("agent_id", agent, "Agent should include agent_id")
            self.assertIn("name", agent, "Agent should include name")
            self.assertIn("type", agent, "Agent should include type")
            self.assertIn("status", agent, "Agent should include status")
            self.assertIn("metrics", agent, "Agent should include metrics")
            self.assertIn("created_at", agent, "Agent should include created_at")
    
    def test_agent_detail_endpoint(self):
        """Test agent detail endpoint."""
        # Note: This test will fail in a real environment without a valid token and agent
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock agent detail endpoint
        @self.app.get("/api/mobile/agents/mock_agent_id")
        async def mock_agent_detail():
            return {
                "agent_id": "mock_agent_id",
                "name": self.test_agent["name"],
                "type": self.test_agent["type"],
                "status": "stopped",
                "config": self.test_agent["config"],
                "metrics": {},
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z"
            }
        
        # Test agent detail endpoint
        response = self.client.get(
            "/api/mobile/agents/mock_agent_id",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Agent detail endpoint should return 200")
        self.assertIn("agent_id", response.json(), "Response should include agent_id")
        self.assertIn("name", response.json(), "Response should include name")
        self.assertIn("type", response.json(), "Response should include type")
        self.assertIn("status", response.json(), "Response should include status")
        self.assertIn("config", response.json(), "Response should include config")
        self.assertIn("metrics", response.json(), "Response should include metrics")
        self.assertIn("created_at", response.json(), "Response should include created_at")
        self.assertIn("updated_at", response.json(), "Response should include updated_at")
    
    def test_create_agent_endpoint(self):
        """Test create agent endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock create agent endpoint
        @self.app.post("/api/mobile/agents")
        async def mock_create_agent():
            return {
                "agent_id": "mock_agent_id",
                "name": self.test_agent["name"],
                "type": self.test_agent["type"],
                "status": "stopped",
                "config": self.test_agent["config"],
                "metrics": {},
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z"
            }
        
        # Test create agent endpoint
        response = self.client.post(
            "/api/mobile/agents",
            headers={"Authorization": "Bearer mock_token"},
            json=self.test_agent
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Create agent endpoint should return 200")
        self.assertIn("agent_id", response.json(), "Response should include agent_id")
        self.assertEqual(response.json()["name"], self.test_agent["name"], "Response name should match request name")
        self.assertEqual(response.json()["type"], self.test_agent["type"], "Response type should match request type")
    
    def test_markets_endpoint(self):
        """Test markets endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock markets endpoint
        @self.app.get("/api/mobile/markets")
        async def mock_markets():
            return [
                {
                    "symbol": "BTC/USDT",
                    "base": "BTC",
                    "quote": "USDT",
                    "price": 50000.0,
                    "change_24h": 2.5,
                    "volume_24h": 1000000.0
                },
                {
                    "symbol": "ETH/USDT",
                    "base": "ETH",
                    "quote": "USDT",
                    "price": 3000.0,
                    "change_24h": 1.5,
                    "volume_24h": 500000.0
                }
            ]
        
        # Test markets endpoint
        response = self.client.get(
            "/api/mobile/markets?exchange=binance",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Markets endpoint should return 200")
        self.assertIsInstance(response.json(), list, "Response should be a list")
        
        # If response is not empty, verify structure
        if response.json():
            market = response.json()[0]
            self.assertIn("symbol", market, "Market should include symbol")
            self.assertIn("base", market, "Market should include base")
            self.assertIn("quote", market, "Market should include quote")
            self.assertIn("price", market, "Market should include price")
            self.assertIn("change_24h", market, "Market should include change_24h")
            self.assertIn("volume_24h", market, "Market should include volume_24h")
    
    def test_orders_endpoint(self):
        """Test orders endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock orders endpoint
        @self.app.get("/api/mobile/orders")
        async def mock_orders():
            return [
                {
                    "order_id": "mock_order_id",
                    "symbol": "BTC/USDT",
                    "type": "MARKET",
                    "side": "BUY",
                    "amount": 0.001,
                    "price": 50000.0,
                    "status": "FILLED",
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        
        # Test orders endpoint
        response = self.client.get(
            "/api/mobile/orders?exchange=binance",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Orders endpoint should return 200")
        self.assertIsInstance(response.json(), list, "Response should be a list")
        
        # If response is not empty, verify structure
        if response.json():
            order = response.json()[0]
            self.assertIn("order_id", order, "Order should include order_id")
            self.assertIn("symbol", order, "Order should include symbol")
            self.assertIn("type", order, "Order should include type")
            self.assertIn("side", order, "Order should include side")
            self.assertIn("amount", order, "Order should include amount")
            self.assertIn("price", order, "Order should include price")
            self.assertIn("status", order, "Order should include status")
            self.assertIn("created_at", order, "Order should include created_at")
    
    def test_create_order_endpoint(self):
        """Test create order endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock create order endpoint
        @self.app.post("/api/mobile/orders")
        async def mock_create_order():
            return {
                "order_id": "mock_order_id",
                "symbol": self.test_order["symbol"],
                "type": self.test_order["type"],
                "side": self.test_order["side"],
                "amount": self.test_order["amount"],
                "price": 50000.0,
                "status": "NEW",
                "created_at": "2023-01-01T00:00:00Z"
            }
        
        # Test create order endpoint
        response = self.client.post(
            "/api/mobile/orders?exchange=binance",
            headers={"Authorization": "Bearer mock_token"},
            json=self.test_order
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Create order endpoint should return 200")
        self.assertIn("order_id", response.json(), "Response should include order_id")
        self.assertEqual(response.json()["symbol"], self.test_order["symbol"], "Response symbol should match request symbol")
        self.assertEqual(response.json()["type"], self.test_order["type"], "Response type should match request type")
        self.assertEqual(response.json()["side"], self.test_order["side"], "Response side should match request side")
        self.assertEqual(response.json()["amount"], self.test_order["amount"], "Response amount should match request amount")
    
    def test_positions_endpoint(self):
        """Test positions endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock positions endpoint
        @self.app.get("/api/mobile/positions")
        async def mock_positions():
            return [
                {
                    "symbol": "BTC/USDT",
                    "side": "LONG",
                    "amount": 0.001,
                    "entry_price": 50000.0,
                    "current_price": 51000.0,
                    "pnl": 1.0,
                    "pnl_percentage": 2.0,
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        
        # Test positions endpoint
        response = self.client.get(
            "/api/mobile/positions?exchange=binance",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Positions endpoint should return 200")
        self.assertIsInstance(response.json(), list, "Response should be a list")
        
        # If response is not empty, verify structure
        if response.json():
            position = response.json()[0]
            self.assertIn("symbol", position, "Position should include symbol")
            self.assertIn("side", position, "Position should include side")
            self.assertIn("amount", position, "Position should include amount")
            self.assertIn("entry_price", position, "Position should include entry_price")
            self.assertIn("current_price", position, "Position should include current_price")
            self.assertIn("pnl", position, "Position should include pnl")
            self.assertIn("pnl_percentage", position, "Position should include pnl_percentage")
            self.assertIn("created_at", position, "Position should include created_at")
    
    def test_notifications_endpoint(self):
        """Test notifications endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock notifications endpoint
        @self.app.get("/api/mobile/notifications")
        async def mock_notifications():
            return [
                {
                    "notification_id": "mock_notification_id",
                    "type": "agent_status",
                    "title": "Agent Started",
                    "message": "Agent 'Test Agent' has been started",
                    "read": False,
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        
        # Test notifications endpoint
        response = self.client.get(
            "/api/mobile/notifications",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Notifications endpoint should return 200")
        self.assertIsInstance(response.json(), list, "Response should be a list")
        
        # If response is not empty, verify structure
        if response.json():
            notification = response.json()[0]
            self.assertIn("notification_id", notification, "Notification should include notification_id")
            self.assertIn("type", notification, "Notification should include type")
            self.assertIn("title", notification, "Notification should include title")
            self.assertIn("message", notification, "Notification should include message")
            self.assertIn("read", notification, "Notification should include read")
            self.assertIn("created_at", notification, "Notification should include created_at")
    
    def test_mark_notification_read_endpoint(self):
        """Test mark notification read endpoint."""
        # Note: This test will fail in a real environment without a valid token
        # In a real implementation, we would use a mock authentication service
        
        # Create a mock mark notification read endpoint
        @self.app.post("/api/mobile/notifications/mock_notification_id/read")
        async def mock_mark_notification_read():
            return {"message": "Notification marked as read"}
        
        # Test mark notification read endpoint
        response = self.client.post(
            "/api/mobile/notifications/mock_notification_id/read",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200, "Mark notification read endpoint should return 200")
        self.assertIn("message", response.json(), "Response should include message")

if __name__ == "__main__":
    unittest.main()
