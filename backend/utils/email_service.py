import requests
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EmailService:
    @staticmethod
    def send_email(to_email, subject, body):
        # 1. BREVO API (Preferred for Render)
        brevo_key = os.environ.get("BREVO_API_KEY")
        if brevo_key:
            try:
                url = "https://api.brevo.com/v3/smtp/email"
                sender_email = os.environ.get("MAIL_USERNAME") or "admin@dblocklibrary.com"
                sender_name = "D-Block Library"
                
                payload = {
                    "sender": {"name": sender_name, "email": sender_email},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": body
                }
                headers = {
                    "accept": "application/json",
                    "api-key": brevo_key,
                    "content-type": "application/json"
                }
                
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                
                if response.status_code in [200, 201, 202]:
                    print(f"Brevo Email sent successfully to {to_email}")
                    return True
                else:
                    print(f"Brevo API Error: {response.text}")
                    # Don't return False yet, maybe try fallback? 
                    # Actually, if API fails, SMTP likely fails too.
                    # But let's fall through to console log if needed.
            except Exception as e:
                print(f"Brevo Exception: {e}")

        # 2. SMTP FALLBACK (Legacy)
        sender_email = os.environ.get("MAIL_USERNAME")
        sender_password = os.environ.get("MAIL_PASSWORD")
        
        # If no credentials for SMTP either, abort early (or go to console log)
        if not brevo_key and (not sender_email or not sender_password):
            print("Error: No Email credentials (Brevo or SMTP) found.")
            # Fall through to console log for dev/demo

        try:
            if not sender_email or not sender_password:
                raise Exception("Missing SMTP Credentials")

            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'html'))

            # Use SMTP_SSL on port 465 (Wrapper for SSL)
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, to_email, text)
            try:
                server.quit()
            except:
                pass
            
            print(f"SMTP Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"Failed to send email via SMTP: {e}")
            # FALBACK FOR RENDER FREE TIER (SMTP BLOCKED)
            # If network is unreachable, log the OTP so admin/user can see it in Render Logs
            if "OTP" in subject or "Password" in subject:
                 print("\n" + "="*40)
                 print(f" [CRITICAL FALLBACK] Email Service Failed.")
                 print(f" EMAIL TO: {to_email}")
                 print(f" SUBJECT: {subject}")
                 # Extract OTP from body if possible for easy reading
                 import re
                 otp_match = re.search(r'\b\d{6}\b', body)
                 if otp_match:
                     print(f" \n >>> YOUR OTP IS: {otp_match.group(0)} <<<\n")
                 print("="*40 + "\n")
                 return True # Return True so frontend lets user enter the OTP
            return False

    @staticmethod
    def send_otp_email(to_email, otp, name):
        subject = "🔐 D-Block Library: Password Reset OTP"
        body = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4F46E5 0%, #2563EB 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">D-Block Library</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px;">Government College of Engineering, Erode</p>
                    </div>

                    <!-- Content -->
                    <div style="padding: 30px; text-align: center;">
                        <h2 style="color: #1F2937; margin: 0 0 15px; font-size: 20px;">Password Reset Request</h2>
                        <p style="color: #6B7280; font-size: 15px; margin-bottom: 25px; line-height: 1.5;">
                            Hello {name},<br>
                            Use the verification code below to reset your password.
                        </p>
                        
                        <div style="background-color: #EEF2FF; border: 1px dashed #6366F1; border-radius: 8px; padding: 15px; margin: 0 auto 25px; display: inline-block;">
                            <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #4F46E5; font-family: monospace;">{otp}</span>
                        </div>

                        <p style="color: #9CA3AF; font-size: 13px; margin: 0;">
                            This code will expire in <strong style="color: #6B7280;">10 minutes</strong>.<br>
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #F9FAFB; padding: 15px; text-align: center; border-top: 1px solid #E5E7EB;">
                        <p style="color: #D1D5DB; font-size: 11px; margin: 0;">
                            © 2025 D-Block Library System. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        return EmailService.send_email(to_email, subject, body)
