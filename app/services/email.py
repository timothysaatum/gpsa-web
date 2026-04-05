"""
Email service — wraps the Resend API.

All sends are fire-and-forget from the caller's perspective,
but every attempt is recorded in email_logs for debugging and retry.

Templates are defined as plain methods returning (subject, html_body).
For a production system, replace the inline HTML with a proper
template engine (e.g. Jinja2 with mjml-compiled templates).
"""

import structlog
import resend
from datetime import UTC, datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.email_log import EmailLog
from app.models.enums import EmailStatus, EmailTemplate

logger = structlog.get_logger(__name__)

resend.api_key = settings.resend_api_key


class EmailService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Public send methods ───────────────────────────────────────────────────

    async def send_verification_email(self, to: str, full_name: str, token: str) -> None:
        verify_url = f"https://gpsa-uds.edu.gh/verify-email?token={token}"
        subject = "Verify your GPSA-UDS account"
        body = self._verification_template(full_name, verify_url)
        await self._send(
            to=to,
            subject=subject,
            html_body=body,
            template=EmailTemplate.email_verification,
        )

    async def send_password_reset_email(self, to: str, full_name: str, token: str) -> None:
        reset_url = f"https://gpsa-uds.edu.gh/reset-password?token={token}"
        subject = "Reset your GPSA-UDS password"
        body = self._password_reset_template(full_name, reset_url)
        await self._send(
            to=to,
            subject=subject,
            html_body=body,
            template=EmailTemplate.password_reset,
        )

    async def send_event_registration_confirmation(
        self, to: str, full_name: str, event_title: str, event_date: str, location: str
    ) -> None:
        subject = f"Registration confirmed — {event_title}"
        body = self._event_confirmation_template(full_name, event_title, event_date, location)
        await self._send(
            to=to,
            subject=subject,
            html_body=body,
            template=EmailTemplate.event_registration_confirmation,
        )

    async def send_welfare_report_received(self, to: str, report_ref: str) -> None:
        subject = "Your PharmaCare report has been received"
        body = self._welfare_received_template(report_ref)
        await self._send(
            to=to,
            subject=subject,
            html_body=body,
            template=EmailTemplate.welfare_report_received,
        )

    async def send_welfare_status_update(
        self, to: str, full_name: str, new_status: str, admin_notes: str | None
    ) -> None:
        subject = "Update on your PharmaCare report"
        body = self._welfare_status_template(full_name, new_status, admin_notes)
        await self._send(
            to=to,
            subject=subject,
            html_body=body,
            template=EmailTemplate.welfare_status_update,
        )

    # ── Core send ─────────────────────────────────────────────────────────────

    async def _send(
        self,
        *,
        to: str,
        subject: str,
        html_body: str,
        template: EmailTemplate,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> None:
        log_entry = EmailLog(
            recipient=to,
            template=template,
            subject=subject,
            entity_type=entity_type,
            status=EmailStatus.pending,
        )
        self.db.add(log_entry)
        await self.db.flush()

        try:
            response = resend.Emails.send({
                "from": f"{settings.email_from_name} <{settings.email_from_address}>",
                "to": [to],
                "subject": subject,
                "html": html_body,
            })
            log_entry.status = EmailStatus.sent
            log_entry.provider_message_id = response.get("id")
            log_entry.sent_at = datetime.now(UTC)
            logger.info("email_sent", to=to, template=template, msg_id=log_entry.provider_message_id)

        except Exception as exc:
            log_entry.status = EmailStatus.failed
            log_entry.error_message = str(exc)
            log_entry.retry_count += 1
            logger.error("email_failed", to=to, template=template, error=str(exc))

        await self.db.flush()

    # ── Templates ─────────────────────────────────────────────────────────────

    def _base_template(self, content: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Outfit', Arial, sans-serif; background: #faf8f3;
                    color: #1c2b22; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #fff;
                          border-radius: 12px; overflow: hidden;
                          border: 1px solid #e8e0d0; }}
            .header {{ background: #0d4a2f; padding: 28px 36px; }}
            .header h1 {{ color: #c8991a; font-size: 22px; margin: 0; }}
            .header p {{ color: rgba(255,255,255,.7); font-size: 13px; margin: 4px 0 0; }}
            .body {{ padding: 36px; }}
            .footer {{ background: #f0ebe0; padding: 20px 36px;
                       font-size: 12px; color: #5a7060; text-align: center; }}
            .btn {{ display: inline-block; background: #0d4a2f; color: #fff !important;
                    padding: 13px 28px; border-radius: 8px; text-decoration: none;
                    font-weight: 700; font-size: 15px; margin: 20px 0; }}
            p {{ line-height: 1.7; font-size: 15px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💊 GPSA-UDS</h1>
              <p>Ghana Pharmaceutical Students' Association — UDS</p>
            </div>
            <div class="body">{content}</div>
            <div class="footer">
              This email was sent by GPSA-UDS. If you did not request this, please ignore it.
              <br>© 2025 GPSA-UDS, University for Development Studies, Tamale, Ghana.
            </div>
          </div>
        </body>
        </html>
        """

    def _verification_template(self, name: str, url: str) -> str:
        return self._base_template(f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Welcome to GPSA-UDS! Please verify your email address to activate your account.</p>
            <a href="{url}" class="btn">Verify Email Address</a>
            <p>This link expires in {settings.email_verification_token_expire_hours} hours.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:<br>
            <small>{url}</small></p>
        """)

    def _password_reset_template(self, name: str, url: str) -> str:
        return self._base_template(f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to proceed.</p>
            <a href="{url}" class="btn">Reset Password</a>
            <p>This link expires in {settings.password_reset_token_expire_hours} hour(s).</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
        """)

    def _event_confirmation_template(
        self, name: str, event_title: str, event_date: str, location: str
    ) -> str:
        return self._base_template(f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your registration for <strong>{event_title}</strong> has been confirmed.</p>
            <p><strong>📅 Date:</strong> {event_date}<br>
               <strong>📍 Location:</strong> {location}</p>
            <p>We look forward to seeing you there!</p>
        """)

    def _welfare_received_template(self, ref: str) -> str:
        return self._base_template(f"""
            <p>Your PharmaCare report (ref: <strong>{ref}</strong>) has been received.</p>
            <p>Our Welfare Committee will review it and follow up within 48 hours.
               All reports are handled with care and full confidentiality.</p>
            <p>Thank you for reaching out.</p>
        """)

    def _welfare_status_template(
        self, name: str, status: str, notes: str | None
    ) -> str:
        notes_block = f"<p><strong>Update from the team:</strong> {notes}</p>" if notes else ""
        return self._base_template(f"""
            <p>Hi <strong>{name}</strong>,</p>
            <p>There is an update on your PharmaCare report.
               The current status is now: <strong>{status.replace('_', ' ').title()}</strong>.</p>
            {notes_block}
            <p>If you have further concerns, please do not hesitate to reach out.</p>
        """)
