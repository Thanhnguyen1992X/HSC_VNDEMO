## Packages
qrcode.react | Generating QR codes for the digital name cards
jwt-decode | Safely decoding and checking admin auth tokens
lucide-react | Standard icons for the application
recharts | Analytics dashboard charts
date-fns | Formatting dates for analytics and displays

## Notes
- Tailwind Config - extend fontFamily:
  fontFamily: {
    sans: ["var(--font-sans)"],
    display: ["var(--font-display)"],
  }
- The application uses JWT tokens for the admin section stored in localStorage ('admin_token')
- All admin /api/* routes expect an 'Authorization: Bearer <token>' header
- Public name cards are accessed at /:employee_id
