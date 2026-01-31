"""Email tasks for Celery."""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from celery import shared_task

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Send email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML body content
        text_content: Plain text body content (optional)
        
    Returns:
        True if sent successfully
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
        return True  # Return True in dev mode
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        
        # Add plain text version
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        
        # Add HTML version
        msg.attach(MIMEText(html_content, "html"))
        
        # Connect and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {type(e).__name__}")
        return False


@shared_task(
    name="app.tasks.email_tasks.send_verification_email",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_verification_email(self, user_email: str, verification_token: str) -> bool:
    """
    Send email verification email.
    
    Args:
        user_email: User's email address
        verification_token: Email verification token
        
    Returns:
        True if sent successfully
    """
    # Build verification URL
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Подтвердите ваш email</h1>
        <p>Спасибо за регистрацию! Пожалуйста, подтвердите ваш email, нажав на кнопку ниже:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{verify_url}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Подтвердить Email
            </a>
        </p>
        <p style="color: #666; font-size: 14px;">
            Если кнопка не работает, скопируйте эту ссылку в браузер:<br>
            <a href="{verify_url}">{verify_url}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
            Ссылка действительна 24 часа. Если вы не регистрировались, проигнорируйте это письмо.
        </p>
    </body>
    </html>
    """
    
    text_content = f"""
    Подтвердите ваш email
    
    Спасибо за регистрацию! Для подтверждения email перейдите по ссылке:
    {verify_url}
    
    Ссылка действительна 24 часа.
    """
    
    try:
        return send_email(user_email, "Подтвердите ваш email", html_content, text_content)
    except Exception as e:
        logger.error(f"Verification email failed, retrying: {e}")
        raise self.retry(exc=e)


@shared_task(
    name="app.tasks.email_tasks.send_password_reset_email",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_password_reset_email(self, user_email: str, reset_token: str) -> bool:
    """
    Send password reset email.
    
    Args:
        user_email: User's email address
        reset_token: Password reset token
        
    Returns:
        True if sent successfully
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Сброс пароля</h1>
        <p>Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Сбросить пароль
            </a>
        </p>
        <p style="color: #666; font-size: 14px;">
            Если кнопка не работает, скопируйте эту ссылку:<br>
            <a href="{reset_url}">{reset_url}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
            Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        </p>
    </body>
    </html>
    """
    
    try:
        return send_email(user_email, "Сброс пароля", html_content)
    except Exception as e:
        logger.error(f"Password reset email failed, retrying: {e}")
        raise self.retry(exc=e)


@shared_task(name="app.tasks.email_tasks.send_welcome_email")
def send_welcome_email(user_email: str, user_name: str) -> bool:
    """
    Send welcome email to new user.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Добро пожаловать, {user_name}!</h1>
        <p>Спасибо за регистрацию в нашем сервисе.</p>
        <p>Ваш аккаунт успешно активирован и готов к использованию.</p>
    </body>
    </html>
    """
    
    return send_email(user_email, f"Добро пожаловать, {user_name}!", html_content)


@shared_task(name="app.tasks.email_tasks.send_security_alert")
def send_security_alert(user_email: str, alert_type: str, details: dict) -> bool:
    """
    Send security alert email.
    """
    alert_messages = {
        "new_login": "Обнаружен вход с нового устройства",
        "password_changed": "Ваш пароль был изменён",
        "suspicious_activity": "Обнаружена подозрительная активность",
    }
    
    title = alert_messages.get(alert_type, "Уведомление безопасности")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">⚠️ {title}</h1>
        <p>Мы обнаружили активность в вашем аккаунте:</p>
        <ul>
            <li><strong>Тип:</strong> {alert_type}</li>
            <li><strong>IP адрес:</strong> {details.get('ip_address', 'Неизвестно')}</li>
            <li><strong>Устройство:</strong> {details.get('device', 'Неизвестно')}</li>
            <li><strong>Время:</strong> {details.get('timestamp', 'Неизвестно')}</li>
        </ul>
        <p style="color: #666;">
            Если это были вы, проигнорируйте это сообщение. 
            Если нет — немедленно смените пароль.
        </p>
    </body>
    </html>
    """
    
    return send_email(user_email, f"Уведомление безопасности: {title}", html_content)
