"""
Notification service for the trading agents system.

This module provides a notification service that can send alerts and notifications
through various channels like email, Telegram, Discord, etc.
"""
import asyncio
import logging
import json
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional, Union, Set
import aiohttp
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class NotificationChannel:
    """Base class for notification channels."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the notification channel.

        Args:
            config: Channel configuration
        """
        self.config = config
        self.enabled = config.get("enabled", False)

    async def send(self, message: str, subject: Optional[str] = None, **kwargs) -> bool:
        """
        Send a notification.

        Args:
            message: Message to send
            subject: Message subject
            **kwargs: Additional parameters

        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            logger.debug(f"Channel {self.__class__.__name__} is disabled")
            return False

        try:
            return await self._send_impl(message, subject, **kwargs)
        except Exception as e:
            logger.error(f"Error sending notification via {self.__class__.__name__}: {str(e)}")
            return False

    async def _send_impl(self, message: str, subject: Optional[str] = None, **kwargs) -> bool:
        """
        Implementation of send method.

        Args:
            message: Message to send
            subject: Message subject
            **kwargs: Additional parameters

        Returns:
            True if successful, False otherwise
        """
        raise NotImplementedError("Subclasses must implement this method")

class EmailChannel(NotificationChannel):
    """Email notification channel."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the email channel.

        Args:
            config: Channel configuration
        """
        super().__init__(config)
        self.smtp_server = config.get("smtp_server", "smtp.gmail.com")
        self.smtp_port = config.get("smtp_port", 587)
        self.username = config.get("username")
        self.password = config.get("password")
        self.from_email = config.get("from_email", self.username)
        self.to_emails = config.get("to_emails", [])

        # Validate configuration
        if not self.username or not self.password:
            logger.warning("Email channel is missing username or password")
            self.enabled = False

        if not self.to_emails:
            logger.warning("Email channel has no recipients")
            self.enabled = False

    async def _send_impl(self, message: str, subject: Optional[str] = None, **kwargs) -> bool:
        """
        Send an email notification.

        Args:
            message: Message to send
            subject: Email subject
            **kwargs: Additional parameters

        Returns:
            True if successful, False otherwise
        """
        if not subject:
            subject = "Trading Agents Notification"

        # Create message
        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = ", ".join(self.to_emails)

        # Add message body
        msg.attach(MIMEText(message, "plain"))

        # Send email
        context = ssl.create_default_context()

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(self.username, self.password)
                server.sendmail(self.from_email, self.to_emails, msg.as_string())

            logger.info(f"Email sent to {', '.join(self.to_emails)}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

class TelegramChannel(NotificationChannel):
    """Telegram notification channel."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Telegram channel.

        Args:
            config: Channel configuration
        """
        super().__init__(config)
        self.bot_token = config.get("bot_token")
        self.chat_ids = config.get("chat_ids", [])

        # Validate configuration
        if not self.bot_token:
            logger.warning("Telegram channel is missing bot token")
            self.enabled = False

        if not self.chat_ids:
            logger.warning("Telegram channel has no chat IDs")
            self.enabled = False

    async def _send_impl(self, message: str, subject: Optional[str] = None, **kwargs) -> bool:
        """
        Send a Telegram notification.

        Args:
            message: Message to send
            subject: Message subject (prepended to message if provided)
            **kwargs: Additional parameters

        Returns:
            True if successful, False otherwise
        """
        # Format message
        if subject:
            formatted_message = f"*{subject}*\n\n{message}"
        else:
            formatted_message = message

        # Send to all chat IDs
        success = True
        async with aiohttp.ClientSession() as session:
            for chat_id in self.chat_ids:
                try:
                    url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
                    params = {
                        "chat_id": chat_id,
                        "text": formatted_message,
                        "parse_mode": "Markdown"
                    }

                    async with session.post(url, params=params) as response:
                        if response.status != 200:
                            response_text = await response.text()
                            logger.error(f"Failed to send Telegram message to {chat_id}: {response_text}")
                            success = False
                        else:
                            logger.info(f"Telegram message sent to {chat_id}")

                except Exception as e:
                    logger.error(f"Error sending Telegram message to {chat_id}: {str(e)}")
                    success = False

        return success

class DiscordChannel(NotificationChannel):
    """Discord notification channel."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Discord channel.

        Args:
            config: Channel configuration
        """
        super().__init__(config)
        self.webhook_urls = config.get("webhook_urls", [])

        # Validate configuration
        if not self.webhook_urls:
            logger.warning("Discord channel has no webhook URLs")
            self.enabled = False

    async def _send_impl(self, message: str, subject: Optional[str] = None, **kwargs) -> bool:
        """
        Send a Discord notification.

        Args:
            message: Message to send
            subject: Message subject (used as embed title if provided)
            **kwargs: Additional parameters

        Returns:
            True if successful, False otherwise
        """
        # Format message
        payload = {
            "content": message if not subject else None,
            "username": kwargs.get("username", "Trading Agents Bot"),
            "avatar_url": kwargs.get("avatar_url")
        }

        # Add embed if subject is provided
        if subject:
            payload["embeds"] = [{
                "title": subject,
                "description": message,
                "color": kwargs.get("color", 0x00ff00)  # Green by default
            }]

        # Send to all webhook URLs
        success = True
        async with aiohttp.ClientSession() as session:
            for webhook_url in self.webhook_urls:
                try:
                    async with session.post(webhook_url, json=payload) as response:
                        if response.status not in (200, 204):
                            response_text = await response.text()
                            logger.error(f"Failed to send Discord message: {response_text}")
                            success = False
                        else:
                            logger.info("Discord message sent")

                except Exception as e:
                    logger.error(f"Error sending Discord message: {str(e)}")
                    success = False

        return success


class NotificationService:
    """
    Notification service for sending alerts and notifications through various channels.

    This service manages multiple notification channels and provides methods to send
    notifications through all enabled channels.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the notification service.

        Args:
            config: Service configuration
        """
        self.config = config or {}
        self.channels: Dict[str, NotificationChannel] = {}
        self.notification_history: List[Dict[str, Any]] = []
        self.max_history_size = self.config.get("max_history_size", 1000)

        # Initialize channels
        self._init_channels()

        logger.info(f"Notification service initialized with {len(self.channels)} channels")

    def _init_channels(self):
        """Initialize notification channels from configuration."""
        # Email channel
        email_config = self.config.get("email", {})
        if email_config:
            self.channels["email"] = EmailChannel(email_config)

        # Telegram channel
        telegram_config = self.config.get("telegram", {})
        if telegram_config:
            self.channels["telegram"] = TelegramChannel(telegram_config)

        # Discord channel
        discord_config = self.config.get("discord", {})
        if discord_config:
            self.channels["discord"] = DiscordChannel(discord_config)

    async def send(
        self,
        message: str,
        subject: Optional[str] = None,
        channels: Optional[List[str]] = None,
        level: str = "info",
        **kwargs
    ) -> Dict[str, bool]:
        """
        Send a notification through all enabled channels.

        Args:
            message: Message to send
            subject: Message subject
            channels: List of channels to use (None for all enabled)
            level: Notification level (info, warning, error, critical)
            **kwargs: Additional parameters for channels

        Returns:
            Dictionary mapping channel names to success status
        """
        # Determine which channels to use
        if channels is None:
            channels_to_use = self.channels
        else:
            channels_to_use = {name: channel for name, channel in self.channels.items() if name in channels}

        # Send notifications
        results = {}
        for name, channel in channels_to_use.items():
            if channel.enabled:
                success = await channel.send(message, subject, **kwargs)
                results[name] = success

        # Record in history
        self._record_notification(message, subject, level, results)

        return results

    def _record_notification(
        self,
        message: str,
        subject: Optional[str],
        level: str,
        results: Dict[str, bool]
    ):
        """
        Record a notification in history.

        Args:
            message: Message that was sent
            subject: Message subject
            level: Notification level
            results: Send results by channel
        """
        notification = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "subject": subject,
            "level": level,
            "results": results,
            "success": any(results.values())
        }

        self.notification_history.append(notification)

        # Trim history if needed
        if len(self.notification_history) > self.max_history_size:
            self.notification_history = self.notification_history[-self.max_history_size:]

    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get notification history.

        Args:
            limit: Maximum number of notifications to return

        Returns:
            List of notifications
        """
        if limit is None:
            return self.notification_history
        else:
            return self.notification_history[-limit:]

    def clear_history(self):
        """Clear notification history."""
        self.notification_history = []

    def get_channel_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all channels.

        Returns:
            Dictionary mapping channel names to status information
        """
        return {
            name: {
                "enabled": channel.enabled,
                "type": channel.__class__.__name__
            }
            for name, channel in self.channels.items()
        }