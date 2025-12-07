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
        sender_email = os.environ.get("MAIL_USERNAME")
        sender_password = os.environ.get("MAIL_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Error: Email credentials not found in environment variables.")
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'html'))

            # Setup server with timeout
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
            server.starttls()
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, to_email, text)
            server.quit()
            print(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
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
