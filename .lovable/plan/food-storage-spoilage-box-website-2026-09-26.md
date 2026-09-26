# Food Storage Spoilage Box website

## What will be built

- A working monitoring dashboard at `/` using realistic sample sensor readings that update automatically.
- Clear freshness states—Fresh, Warning, and Spoilage Risk—with restrained green, amber, and red alerts.
- Browser notification permission and an email-alert preference form; email delivery will be represented as a configured demo until a sending service is connected.
- A device panel showing the presentation’s actual hardware components only: ESP32-S3, BME680/SGP30, DS18B20/SHT31/SHT40, camera module, OLED display, LED indicators, buzzer, MicroSD card, DS3231 RTC, and Wi-Fi/Bluetooth.
- Separate useful pages for waste-management guidance and recent waste-management innovations, using original website content rather than presentation features or images.
- Shared navigation and mobile-friendly layouts with unique page titles and descriptions.

## Visual direction

- Clinical, hygienic interface on white/off-white surfaces.
- Deep blue for trust and monitoring controls, fresh green for safe readings, and soft amber for early warnings.
- Compact scientific readouts, crisp typography, subtle borders, and restrained motion—no dark theme, decorative gradients, or presentation imagery.

## Interactions

- Inspect temperature, humidity, pressure, and VOC readings.
- Trigger and dismiss a sample spoilage warning.
- Request browser-notification permission and edit an email address for alert preferences.
- Filter waste guidance by wet waste, dry waste, and practical innovations.

## Technical details

- Keep the first version frontend-only with deterministic sample data, so it works without device setup or credentials.
- Structure sensor data behind a small adapter so a future ESP32 HTTP endpoint can replace the simulator cleanly.
- Browser alerts use the standard Notifications API when permission is granted.
- Email alert delivery will also be available
- Validate the finished site on desktop and mobile, including warning interactions and navigation.